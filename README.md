# Copilot Studio Chat – Agents SDK + Vite

> A single-page web chat that lets authenticated users talk to any published **Copilot Studio agent**  
> Built with: **Vite 5**, **@microsoft/agents-copilotstudio-client**, and **MSAL Browser v3**

---

## ✨ Live demo (optional)

If you enabled GitHub Pages / Azure Static Web Apps for this repo, link it here.

---

## 🖼️ What you get

| Feature | Details |
|---------|---------|
| **Interactive sign-in** | MSAL v3 popup flow (SPA) – no page reloads |
| **Token exchange** | Uses delegated *CopilotStudio.Copilots.Invoke* scope via Power Platform API |
| **Conversation startup** | Calls `startConversationAsync(true)` and shows suggested actions |
| **Minimal UI** | Vanilla HTML/CSS so it’s easy to restyle or embed |
| **Works offline** | Production bundle is pure static files (drop into any web host) |

---




## 🚀 Quick-start (I just want to run it)

1. **Download a release ZIP** (or clone the repo).  
2. Open a terminal in the folder and run:

   ```bash
   npm install          # one-time
   npm run dev          # opens http://localhost:5173

## Create an Entra Single-Page Application app
Azure portal → Microsoft Entra ID → App registrations → New registration

Name: Copilot Chat SPA → Accounts in this organization only

Redirect URI (SPA): http://localhost:5173/ → Register

API permissions → Add → APIs my organization uses → Power Platform API →
Delegated → CopilotStudio.Copilots.Invoke → Add → Grant admin consent

Copy the Application (client) ID and paste into appClientId.

## Replace the placeholders in src/main.js
🔑 Configure your own tenant (once per environment) by changining src/main.js
Environment ID	Copilot Studio Settings → Advanced → Metadata	environmentId
Agent schema name	Same screen as above	agentIdentifier
Tenant ID (GUID)	Entra Overview → Tenant ID	tenantId
Client ID (GUID)	From your SPA app registration (instructions below)	appClientId

Save → npm run dev again. The popup now shows your tenant branding and reaches your agent.

## Developer Tasks
| Task                                      | Command           |
| ----------------------------------------- | ----------------- |
| Start dev server (hot reload)             | `npm run dev`     |
| Lint (optional)                           | `npm run lint`    |
| Production build (static files → `/dist`) | `npm run build`   |
| Preview production bundle locally         | `npm run preview` |

## 🌐 Deploying the static bundle
After npm run build you get this tree:
dist/
 ├─ index.html
 ├─ assets/
 │   ├─ main-xxxxxxxx.js
 │   └─ vendor-xxxxxxxx.js
 └─ …
Upload dist/ to:

GitHub Pages (branch or /docs folder)

Azure Static Web Apps / Blob Storage

Any on-premises or cloud web server (IIS, Nginx, Apache …)

No server-side code or node runtime is required.

## Customize Further
| Want to…                       | How                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Change look & feel**         | Edit `index.html` & inline CSS (vanilla)                                                                                      |
| **Add speech**                 | Wire Web Speech API or Azure Cognitive Speech inside `sendMessage()`                                                          |
| **Reuse token elsewhere**      | `msalInstance.acquireTokenSilent({ scopes })` gives you a Power Platform API access-token you can forward to your own backend |
| **Use a different build tool** | The source is plain ES modules; swap Vite for React, Next.js, Rollup… — keep the polyfills                                    |



