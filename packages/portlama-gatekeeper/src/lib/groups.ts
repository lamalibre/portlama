import { readFile, writeFile, rename, open, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_DATA_DIR,
  GROUPS_FILE,
  RESERVED_GROUP_NAMES,
  MAX_GROUPS,
  MAX_MEMBERS_PER_GROUP,
  GROUP_NAME_REGEX,
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
} from './constants.js';
import {
  removeGrantsByPredicate,
  updateGrantsByPredicate,
} from './grants.js';
import type {
  Group,
  GroupState,
  CreateGroupOptions,
  UpdateGroupOptions,
  DeleteGroupResult,
} from './types.js';

const dataDir = process.env.PORTLAMA_DATA_DIR ?? DEFAULT_DATA_DIR;
const groupsPath = path.join(dataDir, GROUPS_FILE);

// ---------------------------------------------------------------------------
// Promise-chain mutex (same pattern as panel-server/lib/user-access.js)
// ---------------------------------------------------------------------------

let groupLock = Promise.resolve();

function withGroupLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = groupLock;
  let resolve: () => void;
  groupLock = new Promise<void>((r) => {
    resolve = r;
  });
  return prev.then(fn).finally(() => resolve());
}

// ---------------------------------------------------------------------------
// State I/O (atomic writes: tmp → fsync → rename)
// ---------------------------------------------------------------------------

interface GroupsState {
  groups: GroupState[];
}

async function loadGroups(): Promise<GroupsState> {
  try {
    const raw = await readFile(groupsPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && 'groups' in parsed) {
      const obj = parsed as Record<string, unknown>;
      return {
        groups: Array.isArray(obj.groups) ? (obj.groups as GroupState[]) : [],
      };
    }
    return { groups: [] };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { groups: [] };
    }
    throw new Error(
      `Failed to read groups state: ${(err as Error).message}`,
    );
  }
}

async function saveGroups(state: GroupsState): Promise<void> {
  await mkdir(path.dirname(groupsPath), { recursive: true });
  const tmpPath = `${groupsPath}.tmp`;
  const content = JSON.stringify(state, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, groupsPath);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateGroupName(name: string): void {
  if (name.length < MIN_GROUP_NAME_LENGTH || name.length > MAX_GROUP_NAME_LENGTH) {
    throw Object.assign(
      new Error(`Group name must be ${MIN_GROUP_NAME_LENGTH}-${MAX_GROUP_NAME_LENGTH} characters`),
      { statusCode: 400 },
    );
  }
  if (!GROUP_NAME_REGEX.test(name)) {
    throw Object.assign(
      new Error('Group name must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen'),
      { statusCode: 400 },
    );
  }
  if ((RESERVED_GROUP_NAMES as readonly string[]).includes(name)) {
    throw Object.assign(
      new Error(`Group name "${name}" is reserved for Authelia identity tiers`),
      { statusCode: 400 },
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createGroup(
  name: string,
  options: CreateGroupOptions = {},
): Promise<Group> {
  validateGroupName(name);

  return withGroupLock(async () => {
    const state = await loadGroups();

    if (state.groups.length >= MAX_GROUPS) {
      throw Object.assign(
        new Error(`Maximum number of groups (${MAX_GROUPS}) reached`),
        { statusCode: 503 },
      );
    }

    if (state.groups.some((g) => g.name === name)) {
      throw Object.assign(
        new Error(`Group "${name}" already exists`),
        { statusCode: 409 },
      );
    }

    const group: GroupState = {
      name,
      description: options.description ?? '',
      members: [],
      createdAt: new Date().toISOString(),
      createdBy: options.createdBy ?? 'admin',
    };

    state.groups.push(group);
    await saveGroups(state);
    return group;
  });
}

export async function listGroups(): Promise<readonly Group[]> {
  const state = await loadGroups();
  return state.groups;
}

export async function getGroup(name: string): Promise<Group | null> {
  const state = await loadGroups();
  return state.groups.find((g) => g.name === name) ?? null;
}

export async function updateGroup(
  name: string,
  updates: UpdateGroupOptions,
): Promise<Group> {
  return withGroupLock(async () => {
    const state = await loadGroups();
    const group = state.groups.find((g) => g.name === name);
    if (!group) {
      throw Object.assign(
        new Error(`Group "${name}" not found`),
        { statusCode: 404 },
      );
    }

    if (updates.description !== undefined) {
      group.description = updates.description;
    }

    if (updates.name !== undefined && updates.name !== name) {
      validateGroupName(updates.name);

      if (state.groups.some((g) => g.name === updates.name)) {
        throw Object.assign(
          new Error(`Group "${updates.name}" already exists`),
          { statusCode: 409 },
        );
      }

      // Cascade rename to grants (uses grantLock for safe concurrent access)
      await updateGrantsByPredicate(
        (g) => g.principalType === 'group' && g.principalId === name,
        (g) => { g.principalId = updates.name!; },
      );

      group.name = updates.name;
    }

    await saveGroups(state);
    return group;
  });
}

export async function deleteGroup(name: string): Promise<DeleteGroupResult> {
  validateGroupName(name);

  return withGroupLock(async () => {
    const state = await loadGroups();
    const idx = state.groups.findIndex((g) => g.name === name);
    if (idx === -1) {
      throw Object.assign(
        new Error(`Group "${name}" not found`),
        { statusCode: 404 },
      );
    }

    state.groups.splice(idx, 1);
    await saveGroups(state);

    // Auto-revoke all grants referencing this group (uses grantLock)
    const deletedGrants = await removeGrantsByPredicate(
      (g) => g.principalType === 'group' && g.principalId === name,
    );

    return { deletedGrants };
  });
}

export async function addMembers(
  groupName: string,
  usernames: readonly string[],
): Promise<Group> {
  return withGroupLock(async () => {
    const state = await loadGroups();
    const group = state.groups.find((g) => g.name === groupName);
    if (!group) {
      throw Object.assign(
        new Error(`Group "${groupName}" not found`),
        { statusCode: 404 },
      );
    }

    for (const username of usernames) {
      if (!group.members.includes(username)) {
        if (group.members.length >= MAX_MEMBERS_PER_GROUP) {
          throw Object.assign(
            new Error(`Maximum members per group (${MAX_MEMBERS_PER_GROUP}) reached`),
            { statusCode: 503 },
          );
        }
        group.members.push(username);
      }
    }

    await saveGroups(state);
    return group;
  });
}

export async function removeMembers(
  groupName: string,
  usernames: readonly string[],
): Promise<Group> {
  return withGroupLock(async () => {
    const state = await loadGroups();
    const group = state.groups.find((g) => g.name === groupName);
    if (!group) {
      throw Object.assign(
        new Error(`Group "${groupName}" not found`),
        { statusCode: 404 },
      );
    }

    const removeSet = new Set(usernames);
    group.members = group.members.filter((m) => !removeSet.has(m));

    await saveGroups(state);
    return group;
  });
}

export async function getGroupsForUser(username: string): Promise<readonly string[]> {
  const state = await loadGroups();
  return state.groups
    .filter((g) => g.members.includes(username))
    .map((g) => g.name);
}
