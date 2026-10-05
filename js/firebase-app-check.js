// Loaded by Demo pages only. The site key is public frontend configuration.
(function () {
  const attemptedApps = new WeakSet();

  window.INNERA_INIT_APP_CHECK = function (app) {
    if (!window.INNERA_APP_CHECK_SITE_KEY ||
        typeof firebase === "undefined" ||
        typeof firebase.appCheck !== "function" || !app || attemptedApps.has(app)) {
      return;
    }

    // Mark before activation so repeated init calls cannot activate twice,
    // including when activation throws. Auth/Firestore/Functions still proceed.
    attemptedApps.add(app);
    try {
      firebase.appCheck(app).activate(
        new firebase.appCheck.ReCaptchaEnterpriseProvider(
          window.INNERA_APP_CHECK_SITE_KEY
        ),
        true
      );
      console.info("[Innera] App Check initialized");
    } catch (error) {
      console.error("[Innera] App Check initialization failed", error);
    }
  };
})();
