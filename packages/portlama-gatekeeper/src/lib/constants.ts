/**
 * Principal types for grants.
 */
export const PRINCIPAL_TYPES = ['user', 'group'] as const;
export type PrincipalType = (typeof PRINCIPAL_TYPES)[number];

/**
 * Built-in resource types. The grant system is extensible — new resource types
 * can be added without schema changes.
 */
export const RESOURCE_TYPES = ['tunnel', 'plugin'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/**
 * Tunnel access modes.
 */
export const ACCESS_MODES = ['public', 'authenticated', 'restricted'] as const;
export type AccessMode = (typeof ACCESS_MODES)[number];

/**
 * Reserved Authelia group names (identity tier). These cannot be used as
 * Portlama group names to avoid confusion between the two group systems.
 */
export const RESERVED_GROUP_NAMES = ['admins', 'internal', 'external'] as const;

/**
 * Hard cap on Portlama groups (DoS protection).
 */
export const MAX_GROUPS = 200;

/**
 * Hard cap on grants (DoS protection).
 */
export const MAX_GRANTS = 1000;

/**
 * Hard cap on members per group (DoS protection).
 */
export const MAX_MEMBERS_PER_GROUP = 1000;

/**
 * Consumed grant retention period (90 days in ms).
 * Grants older than this are pruned during write operations.
 */
export const GRANT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Gatekeeper in-memory session cache TTL (30 seconds in ms).
 */
export const SESSION_CACHE_TTL_MS = 30 * 1000;

/**
 * Group name validation regex: lowercase alphanumeric + hyphens,
 * cannot start or end with a hyphen, 2-63 chars.
 */
export const GROUP_NAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/**
 * Maximum group name length.
 */
export const MAX_GROUP_NAME_LENGTH = 63;

/**
 * Minimum group name length.
 */
export const MIN_GROUP_NAME_LENGTH = 2;

/**
 * Default data directory path.
 */
export const DEFAULT_DATA_DIR = '/etc/portlama';

/**
 * State file names.
 */
export const GROUPS_FILE = 'groups.json';
export const GRANTS_FILE = 'access-grants.json';
export const SETTINGS_FILE = 'gatekeeper.json';
export const ACCESS_LOG_FILE = 'access-request-log.json';

/**
 * Authelia verify endpoint (localhost).
 */
export const AUTHELIA_VERIFY_URL = 'http://127.0.0.1:9091/api/authz/forward-auth';

/**
 * Gatekeeper service port.
 */
export const GATEKEEPER_PORT = 9294;
