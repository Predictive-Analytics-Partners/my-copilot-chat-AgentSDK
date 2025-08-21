/* ------------------------------------------------------------------ */
/*  0.  Node-style polyfill so the SDK never trips over “process”.     */
/*      (Must come FIRST, before other imports.)                      */
/* ------------------------------------------------------------------ */
import process from "process";          // ← run once at module load
window.process = process;               // makes globalThis.process available

/* ------------------------------------------------------------------ */
/*  1.  Imports                                                       */
/* ------------------------------------------------------------------ */
import { PublicClientApplication, LogLevel } from "@azure/msal-browser";
import { CopilotStudioClient } from "@microsoft/agents-copilotstudio-client";

/* ------------------------------------------------------------------ */
/*  2.  Your Copilot Studio & Entra IDs                               */
/* ------------------------------------------------------------------ */
const settings = {
  environmentId: "Default-a40337c2-25ad-43e3-9d2f-32f6f1ffa83d",
  agentIdentifier: "cr2d1_insightsAgent",                    // From CP Studio metadata
  tenantId: "a40337c2-25ad-43e3-9d2f-32f6f1ffa83d",
  appClientId: "0115e105-20c3-4c8d-b654-1a4ef1da448d"       // AppClientID from Entra App registration
};
const scopes = ["https://api.powerplatform.com/.default"];
const copilotScopes = ["https://api.powerplatform.com/CopilotStudio.Copilots.Invoke"];
const powerBiScopes = ["https://analysis.windows.net/powerbi/api/.default"];


/* ------------------------------------------------------------------ */
/*  3.  MSAL setup (v 3+)                                             */
/* ------------------------------------------------------------------ */
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: settings.appClientId,
    authority: `https://login.microsoftonline.com/${settings.tenantId}`,
    redirectUri: window.location.origin + "/"      // http://localhost:5173/
  },
  system: { loggerOptions: { logLevel: LogLevel.Warning } }
});

/* ------------------------------------------------------------------ */
/*  4.  Globals we keep around                                        */
/* ------------------------------------------------------------------ */
let copilotClient;
let conversationId;
let powerBiToken; // Store PowerBI token separately


/* ---------------------- tiny DOM helpers -------------------------- */
function add(cls, text) {
  const div = Object.assign(document.createElement("div"), {
    className: cls,
    textContent: text
  });
  document.getElementById("messages").appendChild(div);
  div.scrollIntoView();
}

/* ------------------------------------------------------------------ */
/*  5.  Sign-in flow                                                  */
/* ------------------------------------------------------------------ */
async function signIn() {
  try {
    console.log("Starting sign-in process...");
    
    // Step 1: Get Copilot Studio token
    console.log("Requesting Copilot Studio scopes:", copilotScopes);
    const copilotAuthResult = await msalInstance.loginPopup({
      scopes: copilotScopes,
      prompt: "select_account"
    });

    console.log("Copilot Studio auth successful, token acquired");

    // Step 2: Get PowerBI token silently (since user is already signed in)
    console.log("Requesting PowerBI scopes:", powerBiScopes);
    try {
      const powerBiAuthResult = await msalInstance.acquireTokenSilent({
        scopes: powerBiScopes,
        account: copilotAuthResult.account
      });
      powerBiToken = powerBiAuthResult.accessToken;
      console.log("PowerBI token acquired silently");
    } catch (silentError) {
      console.log("Silent acquisition failed, requesting PowerBI token via popup");
      const powerBiAuthResult = await msalInstance.acquireTokenPopup({
        scopes: powerBiScopes,
        account: copilotAuthResult.account
      });
      powerBiToken = powerBiAuthResult.accessToken;
      console.log("PowerBI token acquired via popup");
    }

    // Step 3: Create Copilot client with Copilot Studio token
    console.log("Creating Copilot client with settings:", {
      ...settings,
      appClientId: "REDACTED"  // Don't log sensitive info
    });

    copilotClient = new CopilotStudioClient(settings, copilotAuthResult.accessToken);

    console.log("Starting conversation...");
    const startAct = await copilotClient.startConversationAsync(true);
    conversationId = startAct.conversation.id;
    console.log("Conversation started:", conversationId);

    document.getElementById("signin").style.display = "none";
    document.getElementById("chatArea").style.display = "block";

    add("sys", "Signed in! Both Copilot Studio and PowerBI tokens acquired.");
    add("sys", "Suggested actions:");
    startAct.suggestedActions?.actions.forEach(a => add("bot", a.value));
  } catch (e) {
    console.error("Detailed auth error:", {
      name: e.name,
      message: e.message,
      errorCode: e.errorCode,
      subError: e.subError,
      correlationId: e?.correlationId
    });
    alert(`Sign-in failed: ${e.message}`);
  }
}
/* ------------------------------------------------------------------ */
/*  6.  Send a message                                                */
/* ------------------------------------------------------------------ */
async function sendMessage() {
  if (!copilotClient) return;

  const box  = document.getElementById("userInput");
  const text = box.value.trim();
  if (!text) return;

  add("you", text);
  box.value = "";
  try {
    const replies = await copilotClient.askQuestionAsync(text, conversationId);
    replies.forEach(({ text: t }) => t && add("bot", t));
  } catch (error) {
    console.error("Error sending message:", error);
    add("sys", "Error: " + error.message);
  }
}

/* ------------------------------------------------------------------ */
/*  7.  One-time bootstrap (needed from MSAL v 3 upward)              */
/* ------------------------------------------------------------------ */
async function initMsal() {
  await msalInstance.initialize();                 // <- new in v 3
  await msalInstance.handleRedirectPromise();      // safe even with pop-ups

  /* hook up buttons only after MSAL is ready */
  document.getElementById("signin").addEventListener("click", signIn);
  document.getElementById("send").addEventListener("click",  sendMessage);
}
initMsal();
