// js/clinic/clinic-settings.js
(function () {
  "use strict";

  const Core = window.InneraClinicCore;
  let originalClinicSettings = null;

  async function loadClinicSettings() {
    const currentStaff = Core.getCurrentStaff();
    if (!currentStaff) throw new Error("尚未取得登入者院所資料");

    const clinicId = currentStaff.clinicId;
    if (!clinicId) throw new Error("目前帳號沒有 clinicId");

    const loading = document.getElementById("clinicSettingsLoading");
    const errorBox = document.getElementById("clinicSettingsError");
    const content = document.getElementById("clinicSettingsContent");

    loading?.classList.remove("hidden");
    errorBox?.classList.add("hidden");
    content?.classList.add("hidden");

    try {
      const snapshot = await Core.getDb().collection("clinics").doc(clinicId).get();
      if (!snapshot.exists) throw new Error("找不到院所設定資料");

      const clinic = snapshot.data();
      const values = {
        clinicSettingName: clinic.clinicName || "",
        clinicSettingId: clinicId,
        clinicSettingPhone: clinic.phone || "",
        clinicSettingDepartment: clinic.defaultDepartment || "",
        clinicSettingAddress: clinic.address || ""
      };

      Object.entries(values).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
      });

      const inviteStatus = document.getElementById("clinicSettingInviteStatus");
      const inviteEnabled = clinic.allowPatientInvite === true;
      if (inviteStatus) {
        inviteStatus.textContent = inviteEnabled ? "允許" : "未允許";
        inviteStatus.classList.toggle("enabled", inviteEnabled);
        inviteStatus.classList.toggle("disabled", !inviteEnabled);
      }

      const activeStatus = document.getElementById("clinicSettingActiveStatus");
      const active = clinic.active === true;
      if (activeStatus) {
        activeStatus.textContent = active ? "啟用中" : "已停用";
        activeStatus.classList.toggle("enabled", active);
        activeStatus.classList.toggle("disabled", !active);
      }

      content?.classList.remove("hidden");
    } catch (error) {
      console.error("[Innera] 院所設定載入失敗", error);
      errorBox?.classList.remove("hidden");
    } finally {
      loading?.classList.add("hidden");
    }
  }

  function setClinicSettingsEditMode(editing) {
    const currentStaff = Core.getCurrentStaff();
    if (!currentStaff || currentStaff.role !== "admin") return;

    [
      "clinicSettingName",
      "clinicSettingPhone",
      "clinicSettingDepartment",
      "clinicSettingAddress"
    ].forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      if (editing) input.removeAttribute("readonly");
      else input.setAttribute("readonly", "");
    });

    document.getElementById("editClinicSettingsButton")
      ?.classList.toggle("hidden", editing);
    document.getElementById("cancelClinicSettingsButton")
      ?.classList.toggle("hidden", !editing);
    document.getElementById("saveClinicSettingsButton")
      ?.classList.toggle("hidden", !editing);
  }

  function startEditClinicSettings() {
    const currentStaff = Core.getCurrentStaff();
    if (!currentStaff || currentStaff.role !== "admin") {
      Core.showToast("只有院所管理員可以修改院所設定");
      return;
    }

    originalClinicSettings = {
      clinicName: document.getElementById("clinicSettingName")?.value || "",
      phone: document.getElementById("clinicSettingPhone")?.value || "",
      defaultDepartment: document.getElementById("clinicSettingDepartment")?.value || "",
      address: document.getElementById("clinicSettingAddress")?.value || ""
    };
    setClinicSettingsEditMode(true);
  }

  function cancelEditClinicSettings() {
    if (!originalClinicSettings) {
      setClinicSettingsEditMode(false);
      return;
    }

    const values = {
      clinicSettingName: originalClinicSettings.clinicName,
      clinicSettingPhone: originalClinicSettings.phone,
      clinicSettingDepartment: originalClinicSettings.defaultDepartment,
      clinicSettingAddress: originalClinicSettings.address
    };
    Object.entries(values).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
    setClinicSettingsEditMode(false);
  }

  async function saveClinicSettings() {
    const currentStaff = Core.getCurrentStaff();
    if (!currentStaff || currentStaff.role !== "admin") {
      Core.showToast("只有院所管理員可以修改院所設定");
      return;
    }

    const clinicId = currentStaff.clinicId;
    const clinicName = document.getElementById("clinicSettingName")?.value.trim() || "";
    const phone = document.getElementById("clinicSettingPhone")?.value.trim() || "";
    const defaultDepartment = document.getElementById("clinicSettingDepartment")?.value.trim() || "";
    const address = document.getElementById("clinicSettingAddress")?.value.trim() || "";

    if (!clinicName) {
      Core.showToast("院所名稱不可為空");
      return;
    }

    const saveButton = document.getElementById("saveClinicSettingsButton");
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "儲存中...";
    }

    try {
      await Core.getDb().collection("clinics").doc(clinicId).update({
        clinicName,
        phone,
        defaultDepartment,
        address,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setClinicSettingsEditMode(false);
      Core.showToast("院所設定已更新");
      await loadClinicSettings();
    } catch (error) {
      console.error("[Innera] 儲存院所設定失敗", error);
      Core.showToast("儲存院所設定失敗");
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "儲存設定";
      }
    }
  }

  window.InneraClinicSettings = {
    load: loadClinicSettings,
    startEdit: startEditClinicSettings,
    cancelEdit: cancelEditClinicSettings,
    save: saveClinicSettings
  };
})();
