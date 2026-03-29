use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;

use crate::config;

/// Default port for the local plugin host.
const LOCAL_HOST_PORT: u32 = 9293;

/// Guard against concurrent installs of the same package.
static INSTALLING_LOCAL: std::sync::LazyLock<Mutex<HashSet<String>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashSet::new()));

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalPluginEntry {
    pub name: String,
    #[serde(default)]
    pub display_name: Option<String>,
    pub package_name: String,
    pub version: String,
    #[serde(default)]
    pub description: Option<String>,
    pub status: String,
    #[serde(default)]
    pub capabilities: Option<Vec<String>>,
    #[serde(default)]
    pub modes: Option<Vec<String>>,
    #[serde(default)]
    pub packages: Option<serde_json::Value>,
    #[serde(default)]
    pub panel: Option<serde_json::Value>,
    #[serde(default)]
    pub config: Option<serde_json::Value>,
    #[serde(default)]
    pub installed_at: Option<String>,
    #[serde(default)]
    pub enabled_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalPluginRegistry {
    pub plugins: Vec<LocalPluginEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CuratedPlugin {
    pub name: String,
    pub package_name: String,
    pub description: String,
    pub icon: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalHostStatus {
    pub running: bool,
    pub pid: Option<u32>,
    pub port: u32,
}

// ---------------------------------------------------------------------------
// Plugin manifest (read from portlama-plugin.json)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PluginManifest {
    name: String,
    #[serde(default)]
    display_name: Option<String>,
    #[serde(default)]
    version: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    capabilities: Option<serde_json::Value>,
    #[serde(default)]
    modes: Option<Vec<String>>,
    #[serde(default)]
    packages: Option<serde_json::Value>,
    #[serde(default)]
    panel: Option<serde_json::Value>,
    #[serde(default)]
    config: Option<serde_json::Value>,
}

// ---------------------------------------------------------------------------
// Curated plugin list
// ---------------------------------------------------------------------------

fn curated_plugins() -> Vec<CuratedPlugin> {
    vec![
        CuratedPlugin {
            name: "herd".into(),
            package_name: "@lamalibre/portlama-herd".into(),
            description: "Zero-config LLM inference pooling".into(),
            icon: "cpu".into(),
        },
        CuratedPlugin {
            name: "shell".into(),
            package_name: "@lamalibre/portlama-shell".into(),
            description: "Secure remote terminal via tmux".into(),
            icon: "terminal".into(),
        },
        CuratedPlugin {
            name: "sync".into(),
            package_name: "@lamalibre/portlama-sync".into(),
            description: "Bidirectional file sync".into(),
            icon: "folder".into(),
        },
        CuratedPlugin {
            name: "gate".into(),
            package_name: "@lamalibre/portlama-gate".into(),
            description: "VPN tunnel management".into(),
            icon: "shield".into(),
        },
    ]
}

// ---------------------------------------------------------------------------
// Registry persistence (mirrors agents.rs patterns)
// ---------------------------------------------------------------------------

fn load_local_plugin_registry() -> Result<LocalPluginRegistry, String> {
    let path = config::local_plugins_path();
    if !path.exists() {
        return Ok(LocalPluginRegistry { plugins: vec![] });
    }
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read local plugins registry: {}", e))?;
    let registry: LocalPluginRegistry = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse local plugins registry: {}", e))?;
    Ok(registry)
}

fn save_local_plugin_registry(registry: &LocalPluginRegistry) -> Result<(), String> {
    let path = config::local_plugins_path();
    let dir = path.parent().unwrap();
    std::fs::create_dir_all(dir)
        .map_err(|e| format!("Failed to create local plugins directory: {}", e))?;

    let json = serde_json::to_string_pretty(registry)
        .map_err(|e| format!("Failed to serialize local plugins registry: {}", e))?;

    let tmp_path = path.with_extension("json.tmp");

    {
        let mut file = std::fs::File::create(&tmp_path)
            .map_err(|e| format!("Failed to create temp registry: {}", e))?;
        file.write_all(json.as_bytes())
            .map_err(|e| format!("Failed to write temp registry: {}", e))?;
        file.write_all(b"\n")
            .map_err(|e| format!("Failed to write trailing newline: {}", e))?;
        file.sync_all()
            .map_err(|e| format!("Failed to fsync temp registry: {}", e))?;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tmp_path, std::fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("Failed to set registry permissions: {}", e))?;
    }

    std::fs::rename(&tmp_path, &path)
        .map_err(|e| format!("Failed to save local plugins registry: {}", e))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Find the node binary.
fn find_node() -> Result<String, String> {
    let output = Command::new("which")
        .arg("node")
        .output()
        .map_err(|e| format!("Failed to find node: {}", e))?;
    if !output.status.success() {
        return Err("Node.js not found in PATH. Install Node.js 20+ to use local plugins.".into());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Ensure ~/.portlama/local/ has a package.json for npm.
fn ensure_local_dir() -> Result<PathBuf, String> {
    let dir = config::local_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create local plugins dir: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o700))
            .map_err(|e| format!("Failed to set dir permissions: {}", e))?;
    }

    let pkg_json = dir.join("package.json");
    if !pkg_json.exists() {
        std::fs::write(&pkg_json, "{\"private\":true}\n")
            .map_err(|e| format!("Failed to create package.json: {}", e))?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&pkg_json, std::fs::Permissions::from_mode(0o600))
                .map_err(|e| format!("Failed to set package.json permissions: {}", e))?;
        }
    }

    Ok(dir)
}

/// Validate a plugin name (same rules as panel-server).
fn validate_plugin_name(name: &str) -> Result<(), String> {
    if name.is_empty() || !name.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
        return Err(format!("Invalid plugin name: \"{}\". Must contain only lowercase letters, numbers, and hyphens.", name));
    }

    let reserved = [
        "health", "onboarding", "invite", "enroll", "tunnels", "sites", "system",
        "services", "logs", "users", "certs", "invitations", "plugins", "tickets", "settings",
    ];
    if reserved.contains(&name) {
        return Err(format!("Plugin name \"{}\" is reserved", name));
    }

    Ok(())
}

/// Read a manifest from installed node_modules.
fn read_manifest(local_dir: &std::path::Path, package_name: &str) -> Result<PluginManifest, String> {
    // Compute path: @lamalibre/foo → node_modules/@lamalibre/foo/portlama-plugin.json
    let manifest_path = local_dir
        .join("node_modules")
        .join(package_name)
        .join("portlama-plugin.json");

    let content = std::fs::read_to_string(&manifest_path)
        .map_err(|e| format!("No valid portlama-plugin.json found in \"{}\": {}", package_name, e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse portlama-plugin.json: {}", e))
}

/// Normalize capabilities from manifest (handles flat array or { agent: [...] } format).
fn normalize_capabilities(val: Option<&serde_json::Value>) -> Vec<String> {
    match val {
        Some(serde_json::Value::Array(arr)) => {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        }
        Some(serde_json::Value::Object(obj)) => {
            obj.get("agent")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default()
        }
        _ => vec![],
    }
}

// ---------------------------------------------------------------------------
// Service management
// ---------------------------------------------------------------------------

/// launchd label for the local host service.
const LOCAL_HOST_PLIST_LABEL: &str = "com.portlama.local-plugin-host";

#[cfg(target_os = "macos")]
fn local_host_plist_path() -> PathBuf {
    dirs::home_dir()
        .expect("Could not determine home directory")
        .join("Library/LaunchAgents/com.portlama.local-plugin-host.plist")
}

fn get_local_host_service_status() -> (bool, Option<u32>) {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("launchctl")
            .arg("list")
            .output();

        match output {
            Ok(o) if o.status.success() => {
                let stdout = String::from_utf8_lossy(&o.stdout);
                for line in stdout.lines() {
                    let cols: Vec<&str> = line.split('\t').collect();
                    if cols.len() >= 3 && cols[2] == LOCAL_HOST_PLIST_LABEL {
                        let pid = cols[0].trim().parse::<u32>().ok();
                        return (true, pid);
                    }
                }
                (false, None)
            }
            _ => (false, None),
        }
    }

    #[cfg(target_os = "linux")]
    {
        let unit = "portlama-local-plugin-host";
        let output = Command::new("systemctl")
            .args(["--user", "is-active", unit])
            .output();

        let running = output
            .as_ref()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim() == "active")
            .unwrap_or(false);

        let pid = if running {
            Command::new("systemctl")
                .args(["--user", "show", unit, "--property=MainPID"])
                .output()
                .ok()
                .and_then(|o| String::from_utf8(o.stdout).ok())
                .and_then(|s| {
                    s.trim()
                        .strip_prefix("MainPID=")
                        .and_then(|p| p.parse::<u32>().ok())
                })
                .filter(|&p| p > 0)
        } else {
            None
        };

        (running, pid)
    }
}

/// Find the local-plugin-host-entry.js path via the portlama-agent package.
fn find_host_entry_path() -> Result<String, String> {
    let node = find_node()?;

    // Try to find the portlama-agent package location
    let output = Command::new(&node)
        .args(["-e", "try{console.log(require.resolve('@lamalibre/portlama-agent/src/local-plugin-host-entry.js'))}catch{process.exit(1)}"])
        .output()
        .map_err(|e| format!("Failed to resolve host entry: {}", e))?;

    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() && std::path::Path::new(&path).exists() {
            return Ok(path);
        }
    }

    // Fallback: try global npm root
    let npm_output = Command::new("npm")
        .args(["root", "-g"])
        .output()
        .map_err(|e| format!("Failed to find npm root: {}", e))?;

    if npm_output.status.success() {
        let root = String::from_utf8_lossy(&npm_output.stdout).trim().to_string();
        let entry = format!("{}/{}",
            root,
            "@lamalibre/portlama-agent/src/local-plugin-host-entry.js"
        );
        if std::path::Path::new(&entry).exists() {
            return Ok(entry);
        }
    }

    Err("Could not find local-plugin-host-entry.js. Ensure @lamalibre/portlama-agent is installed.".into())
}

fn start_local_host_service() -> Result<(), String> {
    let node = find_node()?;
    let entry = find_host_entry_path()?;
    let logs_dir = config::local_logs_dir();
    std::fs::create_dir_all(&logs_dir)
        .map_err(|e| format!("Failed to create logs dir: {}", e))?;

    #[cfg(target_os = "macos")]
    {
        let log_file = config::local_host_log_file();
        let error_log = logs_dir.join("host.error.log");
        let plist_path = local_host_plist_path();

        // Generate plist
        let plist = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{label}</string>

    <key>ProgramArguments</key>
    <array>
        <string>{node}</string>
        <string>{entry}</string>
        <string>--port</string>
        <string>{port}</string>
    </array>

    <key>KeepAlive</key>
    <true/>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>{log}</string>

    <key>StandardErrorPath</key>
    <string>{error_log}</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
"#,
            label = LOCAL_HOST_PLIST_LABEL,
            node = xml_escape(&node),
            entry = xml_escape(&entry),
            port = LOCAL_HOST_PORT,
            log = xml_escape(&log_file.to_string_lossy()),
            error_log = xml_escape(&error_log.to_string_lossy()),
        );

        let plist_dir = plist_path.parent().unwrap();
        std::fs::create_dir_all(plist_dir)
            .map_err(|e| format!("Failed to create LaunchAgents dir: {}", e))?;

        let tmp = plist_path.with_extension("plist.tmp");
        std::fs::write(&tmp, &plist)
            .map_err(|e| format!("Failed to write plist: {}", e))?;
        std::fs::rename(&tmp, &plist_path)
            .map_err(|e| format!("Failed to rename plist: {}", e))?;

        let output = Command::new("launchctl")
            .args(["load", &plist_path.to_string_lossy()])
            .output()
            .map_err(|e| format!("Failed to load service: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("launchctl load failed: {}", stderr));
        }
    }

    #[cfg(target_os = "linux")]
    {
        let log_file = config::local_host_log_file();
        let error_log = logs_dir.join("host.error.log");
        let unit_dir = dirs::home_dir()
            .expect("Could not determine home directory")
            .join(".config/systemd/user");
        std::fs::create_dir_all(&unit_dir)
            .map_err(|e| format!("Failed to create systemd user dir: {}", e))?;

        let unit_path = unit_dir.join("portlama-local-plugin-host.service");
        let unit = format!(
            r#"[Unit]
Description=Portlama Local Plugin Host
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart="{node}" "{entry}" --port {port}
Restart=always
RestartSec=5
StandardOutput=append:{log}
StandardError=append:{error_log}
Environment=PATH=/usr/local/bin:/usr/bin:/bin
NoNewPrivileges=true
ReadWritePaths={logs_dir}

[Install]
WantedBy=default.target
"#,
            node = node,
            entry = entry,
            port = LOCAL_HOST_PORT,
            log = log_file.to_string_lossy(),
            error_log = error_log.to_string_lossy(),
            logs_dir = logs_dir.to_string_lossy(),
        );

        let tmp = unit_path.with_extension("service.tmp");
        std::fs::write(&tmp, &unit)
            .map_err(|e| format!("Failed to write unit file: {}", e))?;
        std::fs::rename(&tmp, &unit_path)
            .map_err(|e| format!("Failed to rename unit file: {}", e))?;

        let _ = Command::new("systemctl")
            .args(["--user", "daemon-reload"])
            .output();

        let output = Command::new("systemctl")
            .args(["--user", "enable", "--now", "portlama-local-plugin-host"])
            .output()
            .map_err(|e| format!("Failed to start service: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("systemctl enable failed: {}", stderr));
        }
    }

    Ok(())
}

fn stop_local_host_service() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let plist_path = local_host_plist_path();
        if plist_path.exists() {
            let _ = Command::new("launchctl")
                .args(["unload", &plist_path.to_string_lossy()])
                .output();
        }
    }

    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("systemctl")
            .args(["--user", "disable", "--now", "portlama-local-plugin-host"])
            .output();
    }

    Ok(())
}

fn restart_local_host_service() -> Result<(), String> {
    stop_local_host_service()?;
    // Small delay to let the process exit cleanly
    std::thread::sleep(std::time::Duration::from_millis(500));
    start_local_host_service()
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

/// Read tail of a log file.
fn read_tail(path: &std::path::Path, lines: usize) -> String {
    if !path.exists() {
        return String::new();
    }
    Command::new("tail")
        .args(["-n", &lines.to_string(), &path.to_string_lossy().to_string()])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default()
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn local_get_plugins() -> Result<LocalPluginRegistry, String> {
    tokio::task::spawn_blocking(load_local_plugin_registry)
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_get_available_plugins() -> Result<Vec<CuratedPlugin>, String> {
    Ok(curated_plugins())
}

#[tauri::command]
pub async fn local_install_plugin(package_name: String) -> Result<LocalPluginEntry, String> {
    // Validate scope
    if !package_name.starts_with("@lamalibre/") {
        return Err("Only @lamalibre/ scoped packages are allowed".into());
    }

    // Validate the portion after scope to prevent path traversal
    let pkg_suffix = &package_name["@lamalibre/".len()..];
    if pkg_suffix.is_empty()
        || !pkg_suffix.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '.' || c == '_' || c == '-')
        || !pkg_suffix.starts_with(|c: char| c.is_ascii_lowercase() || c.is_ascii_digit())
        || !pkg_suffix.ends_with(|c: char| c.is_ascii_lowercase() || c.is_ascii_digit())
    {
        return Err("Invalid package name".into());
    }

    // Concurrency guard
    {
        let mut set = INSTALLING_LOCAL.lock().unwrap();
        if !set.insert(package_name.clone()) {
            return Err(format!("Installation of {} is already in progress", package_name));
        }
    }

    let pkg = package_name.clone();
    let result = tokio::task::spawn_blocking(move || {
        let local_dir = ensure_local_dir()?;

        // Check if already installed
        let registry = load_local_plugin_registry()?;
        if registry.plugins.iter().any(|p| p.package_name == pkg) {
            return Err(format!("Plugin \"{}\" is already installed", pkg));
        }

        // Hard cap to prevent disk exhaustion
        if registry.plugins.len() >= 20 {
            return Err("Maximum of 20 local plugins allowed".into());
        }

        // npm install --ignore-scripts
        let _node = find_node()?; // Validate node is available
        let output = Command::new("npm")
            .args(["install", "--ignore-scripts", &pkg])
            .current_dir(&local_dir)
            .output()
            .map_err(|e| format!("npm install failed: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("npm install failed: {}", stderr));
        }

        // Read manifest
        let manifest = match read_manifest(&local_dir, &pkg) {
            Ok(m) => m,
            Err(e) => {
                // Clean up on failure
                let _ = Command::new("npm")
                    .args(["uninstall", &pkg])
                    .current_dir(&local_dir)
                    .output();
                return Err(e);
            }
        };

        // Validate name
        if let Err(e) = validate_plugin_name(&manifest.name) {
            let _ = Command::new("npm")
                .args(["uninstall", &pkg])
                .current_dir(&local_dir)
                .output();
            return Err(e);
        }

        // Check for duplicate name (different package, same manifest name)
        if registry.plugins.iter().any(|p| p.name == manifest.name) {
            let _ = Command::new("npm")
                .args(["uninstall", &pkg])
                .current_dir(&local_dir)
                .output();
            return Err(format!("A plugin named \"{}\" is already installed", manifest.name));
        }

        // Check local mode support
        let modes = manifest.modes.clone().unwrap_or_else(|| vec!["server".into(), "agent".into()]);
        if !modes.iter().any(|m| m == "local") {
            let _ = Command::new("npm")
                .args(["uninstall", &pkg])
                .current_dir(&local_dir)
                .output();
            return Err(format!("Plugin \"{}\" does not support local mode", manifest.name));
        }

        // Create plugin data dir
        let plugin_dir = config::local_plugins_dir().join(&manifest.name);
        std::fs::create_dir_all(&plugin_dir)
            .map_err(|e| format!("Failed to create plugin dir: {}", e))?;

        // Build entry
        let capabilities = normalize_capabilities(manifest.capabilities.as_ref());
        let entry = LocalPluginEntry {
            name: manifest.name,
            display_name: manifest.display_name,
            package_name: pkg,
            version: manifest.version.unwrap_or_else(|| "unknown".into()),
            description: manifest.description,
            status: "disabled".into(),
            capabilities: Some(capabilities),
            modes: Some(modes),
            packages: manifest.packages,
            panel: manifest.panel,
            config: manifest.config,
            installed_at: Some(chrono::Utc::now().to_rfc3339()),
            enabled_at: None,
        };

        // Save to registry
        let mut registry = load_local_plugin_registry()?;
        registry.plugins.push(entry.clone());
        save_local_plugin_registry(&registry)?;

        Ok(entry)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    // Release concurrency guard
    {
        let mut set = INSTALLING_LOCAL.lock().unwrap();
        set.remove(&package_name);
    }

    result
}

#[tauri::command]
pub async fn local_uninstall_plugin(name: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let mut registry = load_local_plugin_registry()?;
        let index = registry
            .plugins
            .iter()
            .position(|p| p.name == name)
            .ok_or_else(|| format!("Plugin \"{}\" not found", name))?;

        let plugin = &registry.plugins[index];
        if plugin.status == "enabled" {
            return Err(format!("Plugin \"{}\" must be disabled before uninstalling", name));
        }

        let pkg = plugin.package_name.clone();
        if !pkg.starts_with("@lamalibre/") {
            return Err("Registry corruption: invalid package scope".into());
        }

        // npm uninstall
        let local_dir = config::local_dir();
        let _ = Command::new("npm")
            .args(["uninstall", &pkg])
            .current_dir(&local_dir)
            .output();

        // Remove plugin data dir
        let plugin_dir = config::local_plugins_dir().join(&name);
        let _ = std::fs::remove_dir_all(&plugin_dir);

        registry.plugins.remove(index);
        save_local_plugin_registry(&registry)?;

        Ok(format!("Plugin {} uninstalled", name))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_enable_plugin(name: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let mut registry = load_local_plugin_registry()?;
        let plugin = registry
            .plugins
            .iter_mut()
            .find(|p| p.name == name)
            .ok_or_else(|| format!("Plugin \"{}\" not found", name))?;

        if plugin.status != "enabled" {
            plugin.status = "enabled".into();
            plugin.enabled_at = Some(chrono::Utc::now().to_rfc3339());
            save_local_plugin_registry(&registry)?;
        }

        // Restart the host to pick up the newly enabled plugin
        let (running, _) = get_local_host_service_status();
        if running {
            restart_local_host_service()?;
        } else {
            start_local_host_service()?;
        }

        Ok(format!("Plugin {} enabled", name))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_disable_plugin(name: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let mut registry = load_local_plugin_registry()?;
        let plugin = registry
            .plugins
            .iter_mut()
            .find(|p| p.name == name)
            .ok_or_else(|| format!("Plugin \"{}\" not found", name))?;

        if plugin.status != "disabled" {
            plugin.status = "disabled".into();
            plugin.enabled_at = None;
            save_local_plugin_registry(&registry)?;
        }

        // Restart the host to unmount the disabled plugin
        let (running, _) = get_local_host_service_status();
        if running {
            restart_local_host_service()?;
        }

        Ok(format!("Plugin {} disabled", name))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_fetch_plugin_bundle(name: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let registry = load_local_plugin_registry()?;
        let plugin = registry
            .plugins
            .iter()
            .find(|p| p.name == name)
            .ok_or_else(|| format!("Plugin \"{}\" not found", name))?;

        let server_pkg = plugin.packages
            .as_ref()
            .and_then(|p| p.get("server"))
            .and_then(|v| v.as_str())
            .ok_or_else(|| format!("Plugin \"{}\" has no server package", name))?;

        if !server_pkg.starts_with("@lamalibre/") {
            return Err("Server package scope violation".into());
        }

        let panel_path = config::local_dir()
            .join("node_modules")
            .join(server_pkg)
            .join("panel.js");

        std::fs::read_to_string(&panel_path)
            .map_err(|e| format!("Failed to read panel bundle: {}", e))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_get_host_status() -> Result<LocalHostStatus, String> {
    tokio::task::spawn_blocking(|| {
        let (running, pid) = get_local_host_service_status();
        Ok(LocalHostStatus {
            running,
            pid,
            port: LOCAL_HOST_PORT,
        })
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_start_host() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let (running, _) = get_local_host_service_status();
        if running {
            return Ok("Local plugin host is already running".into());
        }
        start_local_host_service()?;
        Ok("Local plugin host started".into())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_stop_host() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        stop_local_host_service()?;
        Ok("Local plugin host stopped".into())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn local_get_host_logs() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let log = config::local_host_log_file();
        let error_log = config::local_logs_dir().join("host.error.log");

        let stdout_log = read_tail(&log, 200);
        let stderr_log = read_tail(&error_log, 200);

        let mut combined = String::new();
        if !stderr_log.is_empty() {
            combined.push_str(&stderr_log);
        }
        if !stdout_log.is_empty() {
            if !combined.is_empty() {
                combined.push('\n');
            }
            combined.push_str(&stdout_log);
        }
        Ok(combined)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}
