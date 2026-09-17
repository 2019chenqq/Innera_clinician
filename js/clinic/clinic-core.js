// js/clinic/clinic-core.js
(function () {
  "use strict";

  function getDb() {
    if (!window.InneraFirebase) {
      throw new Error("InneraFirebase 尚未載入");
    }
    window.InneraFirebase.init();
    return firebase.firestore();
  }

  function getCurrentStaff() {
    return window.INNERA_CURRENT_STAFF || null;
  }

  function showToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    if (typeof window.InneraUI?.showToast === "function") {
      window.InneraUI.showToast(message);
    }
  }

  window.InneraClinicCore = {
    getDb,
    getCurrentStaff,
    showToast
  };
})();
