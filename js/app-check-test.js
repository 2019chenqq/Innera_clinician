"use strict";

(function () {
  const config = window.INNERA_FIREBASE_CONFIG;
  const siteKey = window.INNERA_APP_CHECK_SITE_KEY;
  const sdk = window.firebase;
  const retry = document.getElementById("retry-token");
  let appCheck = null;
  let running = false;
  let phase = "configuration";

  function show(id, value) {
    document.getElementById(id).textContent = String(value);
  }

  // Diagnostic errors may include token-bearing URLs or nested SDK details.
  // Redact token/credential fields and the full site key; never log raw errors.
  function redact(value) {
    let text = String(value);
    if (typeof siteKey === "string" && siteKey) text = text.split(siteKey).join("[site key]");
    return text
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]")
      .replace(/((?:token|password|secret|credential|authorization|private[_-]?key)\s*[=:]\s*)[^\s&,]+/gi, "$1[redacted]");
  }

  function customData(value) {
    const seen = new WeakSet();
    try {
      return JSON.stringify(value ?? null, (key, item) => {
        if (/token|password|secret|credential|authorization|private.?key/i.test(key)) return "[redacted]";
        if (typeof item === "string") return redact(item);
        if (item && typeof item === "object") {
          if (seen.has(item)) return "[circular]";
          seen.add(item);
        }
        return item;
      }, 2);
    } catch {
      return "[customData could not be serialized]";
    }
  }

  function diagnostic() {
    show("diagnostic", JSON.stringify({
      origin: location.origin,
      userAgent: navigator.userAgent,
      firebaseSdkVersion: sdk?.SDK_VERSION ?? "unavailable",
      projectId: config?.projectId ?? null,
      appCheckExists: typeof sdk?.appCheck === "function",
      siteKeyPrefix: typeof siteKey === "string" ? siteKey.slice(0, 8) : null,
      timestamp: new Date().toISOString(),
    }, null, 2));
  }

  function reportError(error) {
    const details = {
      phase,
      name: redact(error?.name ?? "Error"),
      code: redact(error?.code ?? "unavailable"),
      message: redact(error?.message ?? String(error)),
      customData: customData(error?.customData),
    };
    show("error-name", details.name);
    show("error-code", details.code);
    show("error-message", details.message);
    show("error-data", details.customData);
    console.log("[AppCheck Test] Token failed", details);
    if (error?.stack) console.error(redact(error.stack));
  }

  async function testToken() {
    if (!appCheck || running) return;
    running = true;
    retry.disabled = true;
    phase = "getToken";
    diagnostic();
    show("token-result", "取得中：getToken(true)");
    for (const id of ["error-name", "error-code", "error-message", "error-data"]) show(id, "—");
    try {
      const result = await appCheck.getToken(true);
      const summary = {
        status: "success",
        "token exists": typeof result.token === "string" && result.token.length > 0,
        "token length": typeof result.token === "string" ? result.token.length : 0,
        ...(typeof result.expireTimeMillis === "number" ? { expireTimeMillis: result.expireTimeMillis } : {}),
      };
      show("token-result", JSON.stringify(summary, null, 2));
      console.log("[AppCheck Test] Token success", summary);
    } catch (error) {
      show("token-result", "failed");
      reportError(error);
    } finally {
      running = false;
      retry.disabled = false;
    }
  }

  retry.addEventListener("click", testToken);
  show("project-id", config?.projectId ?? "missing");
  show("site-key-exists", typeof siteKey === "string" && Boolean(siteKey.trim()));
  diagnostic();
  try {
    if (!config || typeof siteKey !== "string" || !siteKey.trim()) {
      throw new Error("Missing Demo Firebase config or App Check site key.");
    }
    if (config.projectId !== "innera-demo") throw new Error("Test page requires innera-demo.");
    phase = "firebase-init";
    if (!sdk || typeof sdk.initializeApp !== "function") throw new Error("Firebase app SDK not loaded.");
    if (sdk.apps.length) throw new Error("Unexpected existing Firebase app on isolated test page.");
    const app = sdk.initializeApp(config);
    show("firebase-status", "initialized");
    console.log("[AppCheck Test] Firebase initialized");
    phase = "app-check-init";
    if (typeof sdk.appCheck !== "function") throw new Error("App Check SDK not loaded.");
    appCheck = sdk.appCheck(app);
    appCheck.activate(new sdk.appCheck.ReCaptchaEnterpriseProvider(siteKey), true);
    show("app-check-status", "initialized");
    console.log("[AppCheck Test] App Check initialized");
    void testToken();
  } catch (error) {
    if (phase === "firebase-init") show("firebase-status", "failed");
    if (phase === "app-check-init") show("app-check-status", "failed");
    show("token-result", "stopped before token test");
    reportError(error);
  }
})();
