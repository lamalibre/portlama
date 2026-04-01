use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::Instant;

/// In-memory user access session store.
/// Stores the session token, username, domain, and expiry.
static USER_SESSION: std::sync::LazyLock<Mutex<Option<UserSession>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

/// Stores the domain from the last `user_access_start_login` call.
/// Used to verify the deep link callback domain matches what we initiated,
/// preventing an attacker from crafting a deep link with a malicious domain.
static PENDING_LOGIN_DOMAIN: std::sync::LazyLock<Mutex<Option<String>>> =
    std::sync::LazyLock::new(|| Mutex::new(None));

#[derive(Clone, Serialize, Deserialize)]
pub struct UserSession {
    pub token: String,
    pub username: String,
    pub domain: String,
    pub panel_url: String,
    #[serde(skip)]
    pub expires_at_instant: Option<Instant>,
    pub expires_at: String,
}

/// Store a user session in memory.
fn store_session(session: UserSession) {
    let mut store = USER_SESSION.lock().unwrap();
    *store = Some(session);
}

/// Get the current user session if valid (not expired).
/// Clears expired sessions from memory to avoid retaining stale credentials.
fn get_session() -> Option<UserSession> {
    let mut store = USER_SESSION.lock().unwrap();
    if let Some(ref session) = *store {
        if let Some(expiry) = session.expires_at_instant {
            if Instant::now() >= expiry {
                *store = None;
                return None;
            }
        }
        return Some(session.clone());
    }
    None
}

/// Clear the user session.
fn clear_session() {
    let mut store = USER_SESSION.lock().unwrap();
    *store = None;
}

/// Make an HTTP request to the panel (no mTLS, plain HTTPS via reqwest).
/// Uses the user access session Bearer token for authentication.
fn panel_request(
    method: &str,
    url: &str,
    body: Option<&str>,
    token: Option<&str>,
) -> Result<String, String> {
    // User-access routes go through panel.<domain> which has a valid Let's Encrypt cert.
    // Only disable cert verification for IP-based URLs (self-signed).
    let is_ip_url = url.contains("://") && {
        let host_part = url.split("://").nth(1).unwrap_or("");
        let host = host_part.split('/').next().unwrap_or("").split(':').next().unwrap_or("");
        host.parse::<std::net::Ipv4Addr>().is_ok() || host.parse::<std::net::Ipv6Addr>().is_ok()
    };
    let client = reqwest::blocking::Client::builder()
        .danger_accept_invalid_certs(is_ip_url)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let mut req = match method {
        "GET" => client.get(url),
        "POST" => client.post(url),
        "DELETE" => client.delete(url),
        _ => return Err(format!("Unsupported method: {}", method)),
    };

    if let Some(tok) = token {
        req = req.header("Authorization", format!("Bearer {}", tok));
    }

    if let Some(b) = body {
        req = req.header("Content-Type", "application/json").body(b.to_string());
    }

    let resp = req
        .send()
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = resp.status();

    // Check for refreshed session token in response header.
    // The server sends this when the session's lastActivity is stale (>60s).
    if let Some(refreshed) = resp.headers().get("x-user-session") {
        if let Ok(new_token) = refreshed.to_str() {
            let mut store = USER_SESSION.lock().unwrap();
            if let Some(ref mut session) = *store {
                session.token = new_token.to_string();
            }
        }
    }

    let text = resp
        .text()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        // Try to extract error message from JSON response
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
            if let Some(err) = json.get("error").and_then(|e| e.as_str()) {
                return Err(err.to_string());
            }
        }
        // Truncate safely at a char boundary to avoid panic on multi-byte UTF-8
        let truncated = if text.len() <= 200 {
            &text
        } else {
            let end = text.char_indices()
                .take_while(|(i, _)| *i < 200)
                .last()
                .map(|(i, c)| i + c.len_utf8())
                .unwrap_or(0);
            &text[..end]
        };
        return Err(format!("Request failed with status {}: {}", status, truncated));
    }

    Ok(text)
}

// --- Tauri commands ---

/// Validate that a domain string is a safe hostname (no URL-significant characters).
fn validate_domain(domain: &str) -> Result<(), String> {
    if domain.is_empty() || domain.len() > 253 {
        return Err("Invalid domain".to_string());
    }
    // Only allow alphanumeric, hyphens, and dots (standard domain characters)
    for ch in domain.chars() {
        if !ch.is_ascii_alphanumeric() && ch != '-' && ch != '.' {
            return Err("Domain contains invalid characters".to_string());
        }
    }
    // Must not start or end with hyphen or dot
    if domain.starts_with('-') || domain.starts_with('.') || domain.ends_with('-') || domain.ends_with('.') {
        return Err("Invalid domain format".to_string());
    }
    Ok(())
}

/// Open the system browser to the Authelia login page for user access authorization.
/// Stores the expected domain so the deep link callback can verify it.
#[tauri::command]
pub async fn user_access_start_login(domain: String) -> Result<(), String> {
    validate_domain(&domain)?;

    // Store the expected domain BEFORE opening the browser so the callback
    // can verify the domain from the deep link matches what we initiated.
    {
        let mut store = PENDING_LOGIN_DOMAIN.lock().unwrap();
        *store = Some(domain.clone());
    }

    let url = format!("https://auth.{}/api/user-access/authorize", domain);

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open browser: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open browser: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open browser: {}", e))?;
    }

    Ok(())
}

/// Exchange a one-time token for a user session.
/// Called after the deep link callback delivers the OTP from Authelia login.
/// The domain from the deep link is verified against the domain stored during
/// `user_access_start_login` to prevent deep link domain injection attacks.
#[tauri::command]
pub async fn user_access_exchange_token(
    token: String,
    domain: String,
) -> Result<serde_json::Value, String> {
    // Verify the domain matches what we initiated in start_login
    {
        let mut pending = PENDING_LOGIN_DOMAIN.lock().unwrap();
        match pending.take() {
            Some(expected) if expected == domain => {
                // Domain matches — proceed
            }
            Some(_) => {
                return Err("Domain mismatch — possible deep link injection".to_string());
            }
            None => {
                return Err("No pending login — initiate login first".to_string());
            }
        }
    }

    let domain_clone = domain.clone();
    let token_clone = token.clone();

    tokio::task::spawn_blocking(move || {
        let url = format!("https://panel.{}/api/user-access/exchange", domain_clone);
        let body = serde_json::json!({ "token": token_clone }).to_string();
        let resp_text = panel_request("POST", &url, Some(&body), None)?;

        let resp: serde_json::Value = serde_json::from_str(&resp_text)
            .map_err(|e| format!("Failed to parse exchange response: {}", e))?;

        let session_token = resp
            .get("sessionToken")
            .and_then(|v| v.as_str())
            .ok_or("Missing sessionToken in response")?
            .to_string();

        let username = resp
            .get("username")
            .and_then(|v| v.as_str())
            .ok_or("Missing username in response")?
            .to_string();

        let expires_at = resp
            .get("expiresAt")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        // Calculate expiry instant (12 hours from now as fallback)
        let expiry_instant = Instant::now() + std::time::Duration::from_secs(12 * 60 * 60);

        let panel_url = format!("https://panel.{}", domain);

        store_session(UserSession {
            token: session_token,
            username: username.clone(),
            domain: domain.clone(),
            panel_url,
            expires_at_instant: Some(expiry_instant),
            expires_at: expires_at.clone(),
        });

        Ok(serde_json::json!({
            "ok": true,
            "username": username,
            "domain": domain,
            "expiresAt": expires_at,
        }))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

/// Get the current user session info, or null if not logged in / expired.
#[tauri::command]
pub async fn user_access_get_session() -> Result<serde_json::Value, String> {
    match get_session() {
        Some(session) => Ok(serde_json::json!({
            "username": session.username,
            "domain": session.domain,
            "expiresAt": session.expires_at,
        })),
        None => Ok(serde_json::Value::Null),
    }
}

/// Log out the current user session.
#[tauri::command]
pub async fn user_access_logout() -> Result<(), String> {
    clear_session();
    Ok(())
}

/// List granted plugins for the authenticated user.
#[tauri::command]
pub async fn user_access_get_plugins() -> Result<serde_json::Value, String> {
    tokio::task::spawn_blocking(|| {
        let session = get_session().ok_or("Not logged in")?;
        let url = format!("{}/api/user-access/plugins", session.panel_url);
        let resp_text = panel_request("GET", &url, None, Some(&session.token))?;

        let resp: serde_json::Value = serde_json::from_str(&resp_text)
            .map_err(|e| format!("Failed to parse plugins response: {}", e))?;
        Ok(resp)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

/// Consume a grant and generate an enrollment token for plugin installation.
#[tauri::command]
pub async fn user_access_enroll_plugin(
    grant_id: String,
) -> Result<serde_json::Value, String> {
    tokio::task::spawn_blocking(move || {
        let session = get_session().ok_or("Not logged in")?;
        let url = format!("{}/api/user-access/enroll", session.panel_url);
        let body = serde_json::json!({ "grantId": grant_id }).to_string();
        let resp_text = panel_request("POST", &url, Some(&body), Some(&session.token))?;

        let resp: serde_json::Value = serde_json::from_str(&resp_text)
            .map_err(|e| format!("Failed to parse enroll response: {}", e))?;
        Ok(resp)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

/// Install a plugin locally after consuming a grant.
/// Orchestrates: enroll → local plugin install (reusing local_plugins infrastructure).
#[tauri::command]
pub async fn user_access_install_plugin(
    grant_id: String,
    package_name: String,
) -> Result<serde_json::Value, String> {
    // Step 1: Consume grant and get enrollment token
    let enroll_result = user_access_enroll_plugin(grant_id).await?;

    // Verify the package_name matches the grant's pluginName to prevent
    // a user from consuming a grant for one plugin but installing another.
    let granted_plugin = enroll_result
        .get("pluginName")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if granted_plugin != package_name {
        return Err(format!(
            "Package mismatch: grant is for '{}' but '{}' was requested",
            granted_plugin, package_name
        ));
    }

    let _enrollment_token = enroll_result
        .get("enrollmentToken")
        .and_then(|v| v.as_str())
        .ok_or("Missing enrollmentToken in enroll response")?
        .to_string();

    let label = enroll_result
        .get("label")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    // Step 2: Install the plugin locally using existing local plugin infrastructure
    crate::local_plugins::local_install_plugin(package_name.clone()).await?;

    Ok(serde_json::json!({
        "ok": true,
        "label": label,
        "pluginName": package_name,
    }))
}
