use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    pub panel_url: String,
    /// Authentication method: "p12" (default) or "keychain"
    #[serde(default = "default_auth_method")]
    pub auth_method: String,
    /// Path to P12 file (used when auth_method is "p12")
    #[serde(default)]
    pub p12_path: Option<String>,
    /// P12 password (used when auth_method is "p12").
    /// skip_serializing: password should be in the OS credential store, not JSON.
    #[serde(default, skip_serializing)]
    pub p12_password: Option<String>,
    /// Keychain identity name (used when auth_method is "keychain")
    #[serde(default)]
    pub keychain_identity: Option<String>,
    /// Agent label (used when auth_method is "keychain")
    #[serde(default)]
    pub agent_label: Option<String>,
    pub domain: Option<String>,
    pub chisel_version: Option<String>,
    pub setup_at: Option<String>,
    pub updated_at: Option<String>,
}

fn default_auth_method() -> String {
    "p12".to_string()
}

pub fn agent_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not determine home directory")
        .join(".portlama")
}

pub fn config_path() -> PathBuf {
    agent_dir().join("agent.json")
}

pub fn chisel_bin_path() -> PathBuf {
    agent_dir().join("bin").join("chisel")
}

pub fn log_file_path() -> PathBuf {
    agent_dir().join("logs").join("chisel.log")
}

pub fn error_log_path() -> PathBuf {
    agent_dir().join("logs").join("chisel.error.log")
}

pub fn services_registry_path() -> PathBuf {
    agent_dir().join("services.json")
}

pub fn servers_registry_path() -> PathBuf {
    agent_dir().join("servers.json")
}

/// Minimal typed struct for entries in `servers.json`.
/// Only the fields needed for `load_effective_config`; unknown fields are ignored.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ServerRegistryEntry {
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    active: bool,
    panel_url: String,
    #[serde(default = "default_auth_method")]
    auth_method: String,
    #[serde(default)]
    p12_path: Option<String>,
    #[serde(default)]
    p12_password: Option<String>,
    #[serde(default)]
    keychain_identity: Option<String>,
    #[serde(default)]
    label: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

/// Load the effective agent configuration.
///
/// If `servers.json` exists and has an active entry, construct an `AgentConfig`
/// from that entry. Otherwise, fall back to `agent.json` (backward compatible).
pub fn load_effective_config() -> Result<AgentConfig, String> {
    let registry_path = servers_registry_path();
    if registry_path.exists() {
        let content = std::fs::read_to_string(&registry_path)
            .map_err(|e| format!("Failed to read servers.json: {}", e))?;
        let servers: Vec<ServerRegistryEntry> = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse servers.json: {}", e))?;

        if let Some(active) = servers.iter().find(|s| s.active) {
            // If p12_password is not in the JSON (migrated to credential store),
            // retrieve it using the server ID.
            let mut p12_password = active.p12_password.clone();
            if p12_password.is_none() && active.auth_method == "p12" {
                if let Some(ref id) = active.id {
                    if let Ok(Some(pw)) = crate::credentials::get_server_credential(id) {
                        p12_password = Some(pw);
                    }
                }
            }
            return Ok(AgentConfig {
                panel_url: active.panel_url.clone(),
                auth_method: active.auth_method.clone(),
                p12_path: active.p12_path.clone(),
                p12_password,
                keychain_identity: active.keychain_identity.clone(),
                agent_label: None,
                domain: active.label.clone(),
                chisel_version: None,
                setup_at: active.created_at.clone(),
                updated_at: None,
            });
        }
    }

    // Fall back to agent.json
    load_config()
}

pub fn plist_path() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        dirs::home_dir()
            .expect("Could not determine home directory")
            .join("Library/LaunchAgents/com.portlama.chisel.plist")
    }
    #[cfg(target_os = "linux")]
    {
        dirs::home_dir()
            .expect("Could not determine home directory")
            .join(".config/systemd/user/portlama-chisel.service")
    }
}

pub fn load_config() -> Result<AgentConfig, String> {
    let path = config_path();
    if !path.exists() {
        return Err("not_configured".to_string());
    }
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))
}

pub fn save_config(config: &AgentConfig) -> Result<(), String> {
    let path = config_path();
    let dir = path.parent().unwrap();
    std::fs::create_dir_all(dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    let tmp_path = path.with_extension("json.tmp");

    {
        let mut file = std::fs::File::create(&tmp_path)
            .map_err(|e| format!("Failed to create temp config: {}", e))?;
        file.write_all(json.as_bytes())
            .map_err(|e| format!("Failed to write temp config: {}", e))?;
        file.sync_all()
            .map_err(|e| format!("Failed to fsync temp config: {}", e))?;
    }

    // Set restrictive permissions before rename
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tmp_path, std::fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("Failed to set config permissions: {}", e))?;
    }

    std::fs::rename(&tmp_path, &path)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(())
}
