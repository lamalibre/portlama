# setup-agent

> Started at `2026-03-20 11:03:06 UTC` — log level **1**


---

# Portlama E2E — Agent VM Setup


| Key | Value |
|-----|-------|
| **Host IP** | `192.168.2.94` |
| **Test Domain** | `test.portlama.local` |

🔵 `11:03:06` **[1/5] Configuring /etc/hosts...**  
✅ `11:03:06` /etc/hosts configured with test.portlama.local entries  
🔵 `11:03:06` **[2/5] Installing Chisel...**  
ℹ️ `11:03:06` Downloading Chisel v1.11.5...  
<details>
<summary>✅ <code>11:03:07</code> Download Chisel v1.11.5</summary>

```
$ curl -sL -o /tmp/chisel-bJ1F3V.gz https://github.com/jpillora/chisel/releases/download/v1.11.5/chisel_1.11.5_linux_arm64.gz

```
</details>

<details>
<summary>✅ <code>11:03:07</code> Extract Chisel archive</summary>

```
$ gunzip -f /tmp/chisel-bJ1F3V.gz

```
</details>

✅ `11:03:07` Chisel installed: 1.11.5  
🔵 `11:03:07` **[3/5] Setting up agent P12 certificate...**  
✅ `11:03:07` Agent P12 installed at ~/.portlama/client.p12  
✅ `11:03:07` PEM files extracted to ~/.portlama/  
🔵 `11:03:07` **[4/5] Verifying panel connectivity...**  
✅ `11:03:07` Panel is reachable via agent P12 certificate  
✅ `11:03:07` Panel is reachable via domain: panel.test.portlama.local  
🔵 `11:03:07` **[5/5] Installing Python 3...**  
✅ `11:03:07` Python 3 already installed: Python 3.12.3  

---

# Agent VM Setup Summary


| Key | Value |
|-----|-------|
| **Host IP** | `192.168.2.94` |
| **Test Domain** | `test.portlama.local` |
| **Chisel** | `1.11.5` |
| **Python** | `Python 3.12.3` |
| **Agent P12** | `~/.portlama/client.p12` |
| **Agent PEM Cert** | `~/.portlama/client.crt` |
| **Agent PEM Key** | `~/.portlama/client.key` |
| **Panel reachable** | `yes` |

✅ `11:03:07` The agent VM is ready for E2E tests.  
