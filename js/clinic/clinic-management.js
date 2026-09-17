// js/clinic/clinic-management.js
(function () {
  "use strict";

  function showClinicManagement() {
    document.getElementById("dashboardMain")?.classList.add("hidden");
    document.getElementById("patientDetailPage")?.classList.add("hidden");
    document.getElementById("clinicManagementPage")?.classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });
    document.getElementById("clinicManagementNav")?.classList.add("active");

    window.InneraClinicStaff?.load();
    window.InneraClinicSettings?.load();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function hideClinicManagement() {
    document.getElementById("clinicManagementPage")?.classList.add("hidden");
  }

  function initClinicManagement() {
    document.getElementById("clinicManagementNav")
      ?.addEventListener("click", (event) => {
        event.preventDefault();
        showClinicManagement();
      });

    const Actions = window.InneraClinicStaffActions;
    const Settings = window.InneraClinicSettings;

    document.getElementById("addClinicStaffButton")
      ?.addEventListener("click", Actions.openAddStaffModal);
    document.getElementById("closeAddClinicStaffModal")
      ?.addEventListener("click", Actions.closeAddStaffModal);
    document.getElementById("cancelAddClinicStaff")
      ?.addEventListener("click", Actions.closeAddStaffModal);
    document.getElementById("addClinicStaffForm")
      ?.addEventListener("submit", Actions.createClinicStaff);

    document.getElementById("addClinicStaffModal")
      ?.addEventListener("click", (event) => {
        if (event.target.id === "addClinicStaffModal") Actions.closeAddStaffModal();
      });

    document.getElementById("clinicStaffList")
      ?.addEventListener("click", (event) => {
        const disableButton = event.target.closest(".staff-disable-button");
        if (disableButton) {
          Actions.disableClinicStaff(
            disableButton.dataset.staffUid,
            disableButton.dataset.staffName || "此成員"
          );
          return;
        }

        const enableButton = event.target.closest(".staff-enable-button");
        if (enableButton) {
          Actions.enableClinicStaff(
            enableButton.dataset.staffUid,
            enableButton.dataset.staffName || "此成員"
          );
        }
      });

    document.getElementById("editClinicSettingsButton")
      ?.addEventListener("click", Settings.startEdit);
    document.getElementById("cancelClinicSettingsButton")
      ?.addEventListener("click", Settings.cancelEdit);
    document.getElementById("saveClinicSettingsButton")
      ?.addEventListener("click", Settings.save);
  }

  window.InneraClinicManagement = {
    show: showClinicManagement,
    hide: hideClinicManagement,
    load: () => window.InneraClinicStaff?.load()
  };

  document.addEventListener("DOMContentLoaded", initClinicManagement);
})();
