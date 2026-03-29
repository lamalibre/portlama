/**
 * Web-backed AgentClient implementation.
 *
 * Used when the agent panel is accessed via agent-<label>.<domain>.
 * All calls go through the local panel HTTP server's REST API.
 *
 * @returns {import('../context/AgentClientContext.jsx').AgentClient}
 */
export function createWebAgentClient() {
  async function apiFetch(path, opts = {}) {
    const { body, method = 'GET', ...rest } = opts;
    const headers = { ...rest.headers };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // No-content responses (204)
    if (res.status === 204) return undefined;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  return {
    // Status & Control
    getStatus: () => apiFetch('/status'),
    startAgent: () => apiFetch('/start', { method: 'POST' }),
    stopAgent: () => apiFetch('/stop', { method: 'POST' }),
    restartAgent: () => apiFetch('/restart', { method: 'POST' }),
    updateAgent: () => apiFetch('/update', { method: 'POST' }),

    // Tunnels
    getTunnels: () => apiFetch('/tunnels').then((r) => r.tunnels || []),
    createTunnel: (data) => apiFetch('/tunnels', { method: 'POST', body: data }),
    toggleTunnel: (id, data) => apiFetch(`/tunnels/${id}`, { method: 'PATCH', body: data }),
    deleteTunnel: (id) => apiFetch(`/tunnels/${id}`, { method: 'DELETE' }),

    // Services
    scanServices: () => apiFetch('/services'),
    addCustomService: (data) => apiFetch('/services', { method: 'POST', body: data }),
    removeCustomService: (id) => apiFetch(`/services/${id}`, { method: 'DELETE' }),

    // Logs
    getLogs: () => apiFetch('/logs').then((r) => r.logs || ''),

    // Configuration
    getConfig: () => apiFetch('/config'),
    getPanelUrl: async () => window.location.origin,

    // Certificate
    rotateCertificate: () => apiFetch('/certificate/rotate', { method: 'POST' }),
    downloadCertificate: () => apiFetch('/certificate/download'),

    // Web Panel
    getPanelExposeStatus: () => apiFetch('/panel-expose-status'),
    togglePanelExpose: (enabled) =>
      apiFetch(enabled ? '/panel-expose' : '/panel-retract', { method: 'POST' }),

    // Lifecycle
    uninstallAgent: () => apiFetch('/uninstall', { method: 'POST' }),

    // External links — opens in new tab in web context
    openExternal: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      return Promise.resolve();
    },
  };
}
