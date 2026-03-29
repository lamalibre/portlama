import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Power,
  PowerOff,
  Trash2,
  Download,
  AlertCircle,
  Play,
  Square,
  Cpu,
  Terminal,
  Folder,
  Shield,
  ChevronLeft,
  ScrollText,
  ExternalLink,
} from 'lucide-react';
import { desktopLocalPluginClient as client } from '../lib/desktop-local-plugin-client.js';

// Map icon names from curated list to lucide-react components
const ICON_MAP = {
  cpu: Cpu,
  terminal: Terminal,
  folder: Folder,
  shield: Shield,
  package: Package,
};

function StatusBadge({ status }) {
  const styles =
    status === 'enabled'
      ? 'bg-green-500/20 text-green-400'
      : 'bg-zinc-500/20 text-zinc-400';

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles}`}>
      {status === 'enabled' ? 'Enabled' : 'Disabled'}
    </span>
  );
}

function HostStatusBar({ status, onStart, onStop, isActing }) {
  const running = status?.running;

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${running ? 'bg-green-400' : 'bg-zinc-600'}`}
          />
          <div>
            <span className="text-sm text-white font-medium">
              Plugin Host
            </span>
            <span className="text-xs text-zinc-500 ml-2">
              {running
                ? `Running on port ${status?.port || 9293}`
                : 'Stopped'}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={isActing}
          onClick={running ? onStop : onStart}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
            running
              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              : 'bg-cyan-600 text-white hover:bg-cyan-500'
          }`}
        >
          {running ? (
            <>
              <Square size={12} />
              Stop
            </>
          ) : (
            <>
              <Play size={12} />
              Start
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function AvailablePluginCard({ plugin, installed, onInstall, isInstalling }) {
  const Icon = ICON_MAP[plugin.icon] || Package;

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-cyan-400" />
        <span className="text-white font-semibold">{plugin.name}</span>
      </div>
      <p className="text-zinc-400 text-sm mb-3">{plugin.description}</p>
      <p className="text-zinc-500 text-xs mb-4 font-mono">{plugin.packageName}</p>
      {installed ? (
        <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded inline-block">
          Installed
        </span>
      ) : (
        <button
          type="button"
          disabled={isInstalling}
          onClick={() => onInstall(plugin.packageName)}
          className="flex items-center gap-1.5 rounded bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={12} />
          {isInstalling ? 'Installing...' : 'Install'}
        </button>
      )}
    </div>
  );
}

function InstalledPluginCard({ plugin, onEnable, onDisable, onUninstall, onOpen, isActing }) {
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const handleUninstall = () => {
    if (!confirmUninstall) {
      setConfirmUninstall(true);
      return;
    }
    setConfirmUninstall(false);
    onUninstall(plugin.name);
  };

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-cyan-400" />
          <span className="text-white font-semibold">{plugin.displayName || plugin.name}</span>
          <span className="text-zinc-500 text-xs">v{plugin.version}</span>
        </div>
        <StatusBadge status={plugin.status} />
      </div>

      {plugin.description && (
        <p className="text-zinc-400 text-sm mb-2">{plugin.description}</p>
      )}

      <p className="text-zinc-500 text-xs mb-4">
        {plugin.packageName}
        {plugin.installedAt && (
          <span> &middot; Installed {new Date(plugin.installedAt).toLocaleDateString()}</span>
        )}
      </p>

      {plugin.capabilities && plugin.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {plugin.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {plugin.status === 'disabled' ? (
          <button
            type="button"
            disabled={isActing}
            onClick={() => onEnable(plugin.name)}
            className="flex items-center gap-1.5 rounded bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Power size={12} />
            Enable
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={isActing}
              onClick={() => onDisable(plugin.name)}
              className="flex items-center gap-1.5 rounded bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PowerOff size={12} />
              Disable
            </button>
            {plugin.packages?.server && (
              <button
                type="button"
                onClick={() => onOpen(plugin.name)}
                className="flex items-center gap-1.5 rounded bg-zinc-700 px-3 py-1.5 text-xs text-cyan-400 hover:bg-zinc-600"
              >
                <ExternalLink size={12} />
                Open
              </button>
            )}
          </>
        )}

        {confirmUninstall ? (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400">Uninstall?</span>
            <button
              type="button"
              onClick={handleUninstall}
              disabled={plugin.status === 'enabled'}
              className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmUninstall(false)}
              className="rounded bg-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-600"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={isActing || plugin.status === 'enabled'}
            onClick={handleUninstall}
            title={plugin.status === 'enabled' ? 'Disable before uninstalling' : 'Uninstall plugin'}
            className="flex items-center gap-1.5 rounded bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={12} />
            Uninstall
          </button>
        )}
      </div>
    </div>
  );
}

function LocalPluginPanel({ pluginName, hostPort, onBack }) {
  const mountRef = useRef(null);
  const cleanupRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBundle() {
      try {
        const jsSource = await client.fetchPluginBundle(pluginName);
        if (cancelled) return;

        // Evaluate the plugin bundle in global scope
        const evalFn = new Function(jsSource);
        evalFn();

        const pluginEntry = window.__portlamaPlugins?.[pluginName];
        if (!pluginEntry || typeof pluginEntry.mount !== 'function') {
          setError('Plugin did not register a mount function');
          setLoading(false);
          return;
        }

        const ctx = {
          mountPoint: mountRef.current,
          panelUrl: `http://localhost:${hostPort || 9293}`,
          basePath: `/plugins/${pluginName}`,
          subPath: '',
          theme: {
            bg: 'zinc-950',
            card: 'zinc-900',
            accent: 'cyan-400',
            border: 'zinc-800',
          },
        };

        const result = pluginEntry.mount(ctx);
        if (result && typeof result === 'object' && typeof result.unmount === 'function') {
          cleanupRef.current = result.unmount;
        } else if (typeof result === 'function') {
          cleanupRef.current = result;
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadBundle();

    return () => {
      cancelled = true;
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch {
          // best-effort cleanup
        }
        cleanupRef.current = null;
      }
    };
  }, [pluginName, hostPort]);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-4"
      >
        <ChevronLeft size={14} />
        Back to Local Plugins
      </button>

      {loading && (
        <div className="text-zinc-500 text-sm">Loading plugin panel...</div>
      )}

      {error && (
        <div className="rounded-lg bg-zinc-900 border border-red-800/50 p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            Failed to load plugin panel: {error}
          </div>
        </div>
      )}

      <div ref={mountRef} />
    </div>
  );
}

function HostLogs() {
  const logsQuery = useQuery({
    queryKey: ['local-host-logs'],
    queryFn: () => client.getHostLogs(),
    refetchInterval: 5000,
  });

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
        <ScrollText size={14} />
        Host Logs
      </h2>
      <pre className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-xs text-zinc-400 font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
        {logsQuery.data || 'No logs available'}
      </pre>
    </div>
  );
}

export default function LocalPlugins() {
  const queryClient = useQueryClient();
  const [openPlugin, setOpenPlugin] = useState(null);
  const [toast, setToast] = useState(null);

  const addToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Queries
  const hostQuery = useQuery({
    queryKey: ['local-host-status'],
    queryFn: () => client.getHostStatus(),
    refetchInterval: 5000,
  });

  const pluginsQuery = useQuery({
    queryKey: ['local-plugins'],
    queryFn: () => client.getPlugins(),
    refetchInterval: 10000,
  });

  const availableQuery = useQuery({
    queryKey: ['local-available-plugins'],
    queryFn: () => client.getAvailablePlugins(),
  });

  // Mutations
  const startMutation = useMutation({
    mutationFn: () => client.startHost(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-host-status'] });
      addToast('Plugin host started');
    },
    onError: (err) => addToast(err.message || String(err), 'error'),
  });

  const stopMutation = useMutation({
    mutationFn: () => client.stopHost(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-host-status'] });
      addToast('Plugin host stopped');
    },
    onError: (err) => addToast(err.message || String(err), 'error'),
  });

  const installMutation = useMutation({
    mutationFn: (packageName) => client.installPlugin(packageName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['local-plugins'] });
      addToast(`Plugin "${data?.name || 'unknown'}" installed`);
    },
    onError: (err) => addToast(err.message || String(err), 'error'),
  });

  const enableMutation = useMutation({
    mutationFn: (name) => client.enablePlugin(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-plugins'] });
      queryClient.invalidateQueries({ queryKey: ['local-host-status'] });
      addToast('Plugin enabled');
    },
    onError: (err) => addToast(err.message || String(err), 'error'),
  });

  const disableMutation = useMutation({
    mutationFn: (name) => client.disablePlugin(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-plugins'] });
      queryClient.invalidateQueries({ queryKey: ['local-host-status'] });
      addToast('Plugin disabled');
    },
    onError: (err) => addToast(err.message || String(err), 'error'),
  });

  const uninstallMutation = useMutation({
    mutationFn: (name) => client.uninstallPlugin(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-plugins'] });
      addToast('Plugin uninstalled');
    },
    onError: (err) => addToast(err.message || String(err), 'error'),
  });

  const isActing =
    installMutation.isPending ||
    enableMutation.isPending ||
    disableMutation.isPending ||
    uninstallMutation.isPending ||
    startMutation.isPending ||
    stopMutation.isPending;

  const installedPlugins = pluginsQuery.data?.plugins || [];
  const availablePlugins = availableQuery.data || [];
  const installedNames = new Set(installedPlugins.map((p) => p.packageName));

  // If a plugin panel is open, show it
  if (openPlugin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LocalPluginPanel
          pluginName={openPlugin}
          hostPort={hostQuery.data?.port}
          onBack={() => setOpenPlugin(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Local Plugins</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Run plugins locally without a server or agent
        </p>
      </div>

      {/* Host status */}
      <HostStatusBar
        status={hostQuery.data}
        onStart={() => startMutation.mutate()}
        onStop={() => stopMutation.mutate()}
        isActing={isActing}
      />

      {/* Available plugins */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Available Plugins</h2>
        {availableQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-zinc-900 border border-zinc-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePlugins.map((plugin) => (
              <AvailablePluginCard
                key={plugin.name}
                plugin={plugin}
                installed={installedNames.has(plugin.packageName)}
                onInstall={(pkg) => installMutation.mutate(pkg)}
                isInstalling={installMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Installed plugins */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Installed Plugins</h2>
        {pluginsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg bg-zinc-900 border border-zinc-800"
              />
            ))}
          </div>
        ) : pluginsQuery.isError ? (
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              Failed to load plugins
            </div>
          </div>
        ) : installedPlugins.length === 0 ? (
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-6">
            <p className="text-zinc-500 text-sm text-center">
              No plugins installed. Choose from the available plugins above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installedPlugins.map((plugin) => (
              <InstalledPluginCard
                key={plugin.name}
                plugin={plugin}
                onEnable={(name) => enableMutation.mutate(name)}
                onDisable={(name) => disableMutation.mutate(name)}
                onUninstall={(name) => uninstallMutation.mutate(name)}
                onOpen={(name) => setOpenPlugin(name)}
                isActing={isActing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      {hostQuery.data?.running && <HostLogs />}
    </div>
  );
}
