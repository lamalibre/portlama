/**
 * Tauri invoke wrapper for local plugin management.
 *
 * Provides the same interface shape as desktop-admin-client.js plugin methods
 * but routes to local_plugins.rs Tauri commands (filesystem-based, no mTLS).
 */

import { invoke } from '@tauri-apps/api/core';

export const desktopLocalPluginClient = {
  getPlugins: () => invoke('local_get_plugins'),
  getAvailablePlugins: () => invoke('local_get_available_plugins'),
  installPlugin: (packageName) => invoke('local_install_plugin', { packageName }),
  enablePlugin: (name) => invoke('local_enable_plugin', { name }),
  disablePlugin: (name) => invoke('local_disable_plugin', { name }),
  uninstallPlugin: (name) => invoke('local_uninstall_plugin', { name }),
  fetchPluginBundle: (name) => invoke('local_fetch_plugin_bundle', { name }),
  getHostStatus: () => invoke('local_get_host_status'),
  startHost: () => invoke('local_start_host'),
  stopHost: () => invoke('local_stop_host'),
  getHostLogs: () => invoke('local_get_host_logs'),
};
