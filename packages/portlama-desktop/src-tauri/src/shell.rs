use crate::api::curl_panel;
use crate::config;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// --- URL encoding helper ---

/// Percent-encode a string for safe use in URL path segments.
/// Encodes all characters except unreserved ones (A-Z, a-z, 0-9, '-', '.', '_', '~').
fn url_encode(s: &str) -> String {
    let mut encoded = String::with_capacity(s.len());
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                encoded.push(byte as char);
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    encoded
}

// --- Structs ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandBlocklist {
    pub hard_blocked: Vec<String>,
    pub restricted: HashMap<String, bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellPolicy {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub allowed_ips: Vec<String>,
    pub denied_ips: Vec<String>,
    pub max_file_size: Option<u64>,
    pub inactivity_timeout: Option<u32>,
    pub command_blocklist: Option<CommandBlocklist>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellConfig {
    pub enabled: bool,
    pub policies: Vec<ShellPolicy>,
    pub default_policy: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellSession {
    pub id: String,
    pub admin_label: Option<String>,
    pub agent_label: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnableResult {
    pub ok: bool,
    pub label: String,
    pub shell_enabled_until: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentCertInfo {
    pub label: String,
    pub shell_enabled_until: Option<String>,
    pub shell_policy: Option<String>,
    pub revoked: bool,
    pub capabilities: Vec<String>,
}

// --- API response wrappers ---

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionsResponse {
    sessions: Vec<ShellSession>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PoliciesResponse {
    policies: Vec<ShellPolicy>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentCertsResponse {
    agents: Vec<AgentCertRaw>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentCertRaw {
    label: String,
    shell_enabled_until: Option<String>,
    shell_policy: Option<String>,
    revoked: bool,
    capabilities: Option<Vec<String>>,
}

// --- Tauri commands ---

#[tauri::command]
pub async fn get_shell_config() -> Result<ShellConfig, String> {
    let cfg = config::load_config()?;
    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "GET", "/api/shell/config", None)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse shell config: {} — body: {}", e, body))
}

#[tauri::command]
pub async fn update_shell_config(
    enabled: Option<bool>,
    default_policy: Option<String>,
) -> Result<serde_json::Value, String> {
    let cfg = config::load_config()?;

    let mut payload = serde_json::Map::new();
    if let Some(val) = enabled {
        payload.insert("enabled".to_string(), serde_json::Value::Bool(val));
    }
    if let Some(val) = default_policy {
        payload.insert(
            "defaultPolicy".to_string(),
            serde_json::Value::String(val),
        );
    }

    let json_body = serde_json::Value::Object(payload).to_string();

    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "PATCH", "/api/shell/config", Some(&json_body))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse shell config: {} — body: {}", e, body))
}

#[tauri::command]
pub async fn get_shell_policies() -> Result<Vec<ShellPolicy>, String> {
    let cfg = config::load_config()?;
    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "GET", "/api/shell/policies", None)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    let data: PoliciesResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse policies: {} — body: {}", e, body))?;
    Ok(data.policies)
}

#[tauri::command]
pub async fn create_shell_policy(policy: ShellPolicy) -> Result<ShellPolicy, String> {
    let cfg = config::load_config()?;
    let json_body = serde_json::to_string(&policy)
        .map_err(|e| format!("Failed to serialize policy: {}", e))?;

    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "POST", "/api/shell/policies", Some(&json_body))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse policy: {} — body: {}", e, body))
}

#[tauri::command]
pub async fn update_shell_policy(
    policy_id: String,
    updates: ShellPolicy,
) -> Result<ShellPolicy, String> {
    let cfg = config::load_config()?;
    let path = format!("/api/shell/policies/{}", url_encode(&policy_id));
    let json_body = serde_json::to_string(&updates)
        .map_err(|e| format!("Failed to serialize policy updates: {}", e))?;

    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "PATCH", &path, Some(&json_body))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse policy: {} — body: {}", e, body))
}

#[tauri::command]
pub async fn delete_shell_policy(policy_id: String) -> Result<String, String> {
    let cfg = config::load_config()?;
    let path = format!("/api/shell/policies/{}", url_encode(&policy_id));

    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "DELETE", &path, None)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    result?;
    Ok(format!("Policy {} deleted", policy_id))
}

#[tauri::command]
pub async fn enable_agent_shell(
    label: String,
    duration_minutes: u32,
    policy_id: Option<String>,
) -> Result<EnableResult, String> {
    let cfg = config::load_config()?;
    let path = format!("/api/shell/enable/{}", url_encode(&label));
    let mut payload = serde_json::json!({ "durationMinutes": duration_minutes });
    if let Some(pid) = policy_id {
        payload["policyId"] = serde_json::Value::String(pid);
    }
    let json_body = payload.to_string();

    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "POST", &path, Some(&json_body))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse enable result: {} — body: {}", e, body))
}

#[tauri::command]
pub async fn disable_agent_shell(label: String) -> Result<String, String> {
    let cfg = config::load_config()?;
    let path = format!("/api/shell/enable/{}", url_encode(&label));

    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "DELETE", &path, None)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    result?;
    Ok(format!("Shell access disabled for {}", label))
}

#[tauri::command]
pub async fn get_shell_sessions() -> Result<Vec<ShellSession>, String> {
    let cfg = config::load_config()?;
    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "GET", "/api/shell/sessions", None)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    let data: SessionsResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse sessions: {} — body: {}", e, body))?;
    Ok(data.sessions)
}

#[tauri::command]
pub async fn get_agent_certs() -> Result<Vec<AgentCertInfo>, String> {
    let cfg = config::load_config()?;
    let result = tokio::task::spawn_blocking(move || {
        curl_panel(&cfg, "GET", "/api/certs/agent", None)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    let body = result?;
    let data: AgentCertsResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse agent certs: {} — body: {}", e, body))?;

    Ok(data
        .agents
        .into_iter()
        .map(|a| AgentCertInfo {
            label: a.label,
            shell_enabled_until: a.shell_enabled_until,
            shell_policy: a.shell_policy,
            revoked: a.revoked,
            capabilities: a.capabilities.unwrap_or_else(|| vec!["tunnels:read".to_string()]),
        })
        .collect())
}
