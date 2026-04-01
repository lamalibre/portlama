import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  X,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../components/Toast.jsx';
import { useAdminClient } from '../context/AdminClientContext.jsx';

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-zinc-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

function CreateGrantModal({ onClose }) {
  const client = useAdminClient();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [username, setUsername] = useState('');
  const [pluginName, setPluginName] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => client.getUsers(),
  });

  const { data: pluginsData } = useQuery({
    queryKey: ['admin-plugins'],
    queryFn: () => client.getPlugins(),
  });

  const mutation = useMutation({
    mutationFn: (data) => client.createUserAccessGrant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access-grants'] });
      addToast('Grant created successfully', 'success');
      onClose();
    },
    onError: (err) => {
      addToast(err?.toString() || 'Failed to create grant', 'error');
    },
  });

  const users = usersData?.users || [];
  const plugins = pluginsData?.plugins || [];

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-bold text-white mb-4">Create Plugin Grant</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Grant a user the right to install a plugin on their device.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">User</label>
          <select
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Select a user...</option>
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.displayname || u.username} ({u.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Plugin</label>
          <select
            value={pluginName}
            onChange={(e) => setPluginName(e.target.value)}
            className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Select a plugin...</option>
            {plugins.map((p) => (
              <option key={p.packageName} value={p.packageName}>
                {p.displayName || p.name} ({p.packageName})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!username || !pluginName || mutation.isPending}
          onClick={() => mutation.mutate({ username, pluginName })}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Create Grant
        </button>
      </div>
    </Modal>
  );
}

function GrantRow({ grant, onRevoke }) {
  const isUsed = grant.used;
  const createdDate = new Date(grant.createdAt).toLocaleDateString();

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/30">
      <td className="px-4 py-3 text-sm text-white">{grant.username}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-zinc-500" />
          <span className="text-sm text-zinc-300 font-mono">{grant.pluginName}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {isUsed ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle2 size={10} />
            Used
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            <Clock size={10} />
            Available
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">{createdDate}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {grant.usedAt ? new Date(grant.usedAt).toLocaleDateString() : '-'}
      </td>
      <td className="px-4 py-3">
        {!isUsed && (
          <button
            type="button"
            onClick={() => onRevoke(grant.grantId)}
            className="text-zinc-500 hover:text-red-400 p-1"
            title="Revoke grant"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

export default function UserPluginAccess() {
  const client = useAdminClient();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-access-grants'],
    queryFn: () => client.getUserAccessGrants(),
    refetchInterval: 10_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (grantId) => client.revokeUserAccessGrant(grantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access-grants'] });
      addToast('Grant revoked', 'success');
    },
    onError: (err) => {
      addToast(err?.toString() || 'Failed to revoke grant', 'error');
    },
  });

  const grants = data?.grants || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-white">User Plugin Access</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Grant non-admin users the right to install plugins on their devices via the desktop app.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500"
        >
          <Plus size={14} />
          Create Grant
        </button>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 text-sm">Loading...</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-sm text-red-400">{error?.toString() || 'Failed to load grants'}</span>
        </div>
      ) : grants.length === 0 ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8 text-center">
          <Package size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No grants created yet.</p>
          <p className="text-zinc-500 text-xs mt-1">
            Create a grant to allow a user to install a plugin.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-900 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Plugin</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Used</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <GrantRow
                  key={grant.grantId}
                  grant={grant}
                  onRevoke={(grantId) => revokeMutation.mutate(grantId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateGrantModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
