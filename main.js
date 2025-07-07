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
  environmentId: "Agent ID",
  agentIdentifier: "Agent Schema ",
  tenantId: "Tenant ID",
  appClientId: "client ID"
};
const scopes = ["https://api.powerplatform.com/.default"];

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
    const { accessToken } = await msalInstance.loginPopup({
      scopes,
      prompt: "select_account"
    });

    copilotClient = new CopilotStudioClient(settings, accessToken);

    const startAct = await copilotClient.startConversationAsync(true);
    conversationId = startAct.conversation.id;

    document.getElementById("signin").style.display = "none";
    document.getElementById("chatArea").style.display = "block";

    add("sys", "Signed in! Suggested actions:");
    startAct.suggestedActions?.actions.forEach(a => add("bot", a.value));
  } catch (e) {
    console.error(e);
    alert("Sign-in failed – see console for details.");
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

  const replies = await copilotClient.askQuestionAsync(text, conversationId);
  replies.forEach(({ text: t }) => t && add("bot", t));
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
