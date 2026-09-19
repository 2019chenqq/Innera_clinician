// js/clinic/clinic-settings.js
(function () {
  "use strict";

  const Core = window.InneraClinicCore;

  let originalClinicSettings = null;


  // ========================================
  // 判斷是否為院所管理員
  // 相容舊版 admin 與新版 clinic_admin
  // ========================================
  function isClinicAdmin(staff) {
    return (
      staff &&
      (
        staff.role === "admin" ||
        staff.role === "clinic_admin"
      )
    );
  }


  // ========================================
  // 載入院所設定
  // ========================================
  async function loadClinicSettings() {

    const currentStaff =
      Core.getCurrentStaff();


    if (!currentStaff) {
      throw new Error(
        "尚未取得登入者院所資料"
      );
    }


    const clinicId =
      currentStaff.clinicId;


    if (!clinicId) {
      throw new Error(
        "目前帳號沒有 clinicId"
      );
    }


    const loading =
      document.getElementById(
        "clinicSettingsLoading"
      );

    const errorBox =
      document.getElementById(
        "clinicSettingsError"
      );

    const content =
      document.getElementById(
        "clinicSettingsContent"
      );


    loading?.classList.remove(
      "hidden"
    );

    errorBox?.classList.add(
      "hidden"
    );

    content?.classList.add(
      "hidden"
    );


    try {

      const snapshot =
        await Core
          .getDb()
          .collection("clinics")
          .doc(clinicId)
          .get();


      if (!snapshot.exists) {
        throw new Error(
          "找不到院所設定資料"
        );
      }


      const clinic =
        snapshot.data();


      // ========================================
      // 新版資料格式
      //
      // name       = 院所名稱
      // clinicCode = CL00001
      // status     = active / inactive
      //
      // 同時保留舊欄位 fallback
      // ========================================

      const values = {

        clinicSettingName:
          clinic.name ||
          clinic.clinicName ||
          "",

        clinicSettingId:
          clinic.clinicCode ||
          clinic.code ||
          "",

        clinicSettingPhone:
          clinic.phone ||
          "",

        clinicSettingDepartment:
          clinic.defaultDepartment ||
          "",

        clinicSettingAddress:
          clinic.address ||
          ""
      };


      Object
        .entries(values)
        .forEach(
          ([id, value]) => {

            const input =
              document.getElementById(
                id
              );

            if (input) {
              input.value =
                value;
            }
          }
        );


      // ========================================
      // 患者邀請狀態
      // ========================================

      const inviteStatus =
        document.getElementById(
          "clinicSettingInviteStatus"
        );


      const inviteEnabled =
        clinic.allowPatientInvite === true;


      if (inviteStatus) {

        inviteStatus.textContent =
          inviteEnabled
            ? "允許"
            : "未允許";


        inviteStatus.classList.toggle(
          "enabled",
          inviteEnabled
        );

        inviteStatus.classList.toggle(
          "disabled",
          !inviteEnabled
        );
      }


      // ========================================
      // 院所狀態
      // ========================================

      const activeStatus =
        document.getElementById(
          "clinicSettingActiveStatus"
        );


      const active =
        clinic.status === "active" ||
        clinic.active === true;


      if (activeStatus) {

        activeStatus.textContent =
          active
            ? "啟用中"
            : "已停用";


        activeStatus.classList.toggle(
          "enabled",
          active
        );

        activeStatus.classList.toggle(
          "disabled",
          !active
        );
      }


      content?.classList.remove(
        "hidden"
      );


    } catch (error) {

      console.error(
        "[Innera] 院所設定載入失敗",
        error
      );


      errorBox?.classList.remove(
        "hidden"
      );


    } finally {

      loading?.classList.add(
        "hidden"
      );
    }
  }


  // ========================================
  // 編輯模式
  // ========================================
  function setClinicSettingsEditMode(
    editing
  ) {

    const currentStaff =
      Core.getCurrentStaff();


    if (
      !isClinicAdmin(
        currentStaff
      )
    ) {
      return;
    }


    [
      "clinicSettingName",
      "clinicSettingPhone",
      "clinicSettingDepartment",
      "clinicSettingAddress"

    ].forEach((id) => {

      const input =
        document.getElementById(id);


      if (!input) {
        return;
      }


      if (editing) {
        input.removeAttribute(
          "readonly"
        );
      } else {
        input.setAttribute(
          "readonly",
          ""
        );
      }
    });


    // clinicCode 永遠不可修改
    document
      .getElementById(
        "clinicSettingId"
      )
      ?.setAttribute(
        "readonly",
        ""
      );


    document
      .getElementById(
        "editClinicSettingsButton"
      )
      ?.classList.toggle(
        "hidden",
        editing
      );


    document
      .getElementById(
        "cancelClinicSettingsButton"
      )
      ?.classList.toggle(
        "hidden",
        !editing
      );


    document
      .getElementById(
        "saveClinicSettingsButton"
      )
      ?.classList.toggle(
        "hidden",
        !editing
      );
  }


  // ========================================
  // 開始編輯
  // ========================================
  function startEditClinicSettings() {

    const currentStaff =
      Core.getCurrentStaff();


    if (
      !isClinicAdmin(
        currentStaff
      )
    ) {

      Core.showToast(
        "只有院所管理員可以修改院所設定"
      );

      return;
    }


    originalClinicSettings = {

      clinicName:
        document
          .getElementById(
            "clinicSettingName"
          )
          ?.value || "",

      phone:
        document
          .getElementById(
            "clinicSettingPhone"
          )
          ?.value || "",

      defaultDepartment:
        document
          .getElementById(
            "clinicSettingDepartment"
          )
          ?.value || "",

      address:
        document
          .getElementById(
            "clinicSettingAddress"
          )
          ?.value || ""
    };


    setClinicSettingsEditMode(
      true
    );
  }


  // ========================================
  // 取消編輯
  // ========================================
  function cancelEditClinicSettings() {

    if (!originalClinicSettings) {

      setClinicSettingsEditMode(
        false
      );

      return;
    }


    const values = {

      clinicSettingName:
        originalClinicSettings
          .clinicName,

      clinicSettingPhone:
        originalClinicSettings
          .phone,

      clinicSettingDepartment:
        originalClinicSettings
          .defaultDepartment,

      clinicSettingAddress:
        originalClinicSettings
          .address
    };


    Object
      .entries(values)
      .forEach(
        ([id, value]) => {

          const input =
            document.getElementById(
              id
            );

          if (input) {
            input.value =
              value;
          }
        }
      );


    setClinicSettingsEditMode(
      false
    );
  }


  // ========================================
  // 儲存
  // ========================================
  async function saveClinicSettings() {

    const currentStaff =
      Core.getCurrentStaff();


    if (
      !isClinicAdmin(
        currentStaff
      )
    ) {

      Core.showToast(
        "只有院所管理員可以修改院所設定"
      );

      return;
    }


    const clinicId =
      currentStaff.clinicId;


    const clinicName =
      document
        .getElementById(
          "clinicSettingName"
        )
        ?.value
        .trim() || "";


    const phone =
      document
        .getElementById(
          "clinicSettingPhone"
        )
        ?.value
        .trim() || "";


    const defaultDepartment =
      document
        .getElementById(
          "clinicSettingDepartment"
        )
        ?.value
        .trim() || "";


    const address =
      document
        .getElementById(
          "clinicSettingAddress"
        )
        ?.value
        .trim() || "";


    if (!clinicName) {

      Core.showToast(
        "院所名稱不可為空"
      );

      return;
    }


    const saveButton =
      document.getElementById(
        "saveClinicSettingsButton"
      );


    if (saveButton) {

      saveButton.disabled =
        true;

      saveButton.textContent =
        "儲存中...";
    }


    try {

      await Core
        .getDb()
        .collection("clinics")
        .doc(clinicId)
        .update({

          // 新版正式欄位
          name:
            clinicName,

          phone,

          defaultDepartment,

          address,

          updatedAt:
            firebase
              .firestore
              .FieldValue
              .serverTimestamp()
        });


      setClinicSettingsEditMode(
        false
      );


      Core.showToast(
        "院所設定已更新"
      );


      await loadClinicSettings();


    } catch (error) {

      console.error(
        "[Innera] 儲存院所設定失敗",
        error
      );


      Core.showToast(
        "儲存院所設定失敗"
      );


    } finally {

      if (saveButton) {

        saveButton.disabled =
          false;

        saveButton.textContent =
          "儲存設定";
      }
    }
  }


  window.InneraClinicSettings = {

    load:
      loadClinicSettings,

    startEdit:
      startEditClinicSettings,

    cancelEdit:
      cancelEditClinicSettings,

    save:
      saveClinicSettings
  };

})();