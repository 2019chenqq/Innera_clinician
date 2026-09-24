// js/clinic/clinic-staff-actions.js
(function () {
  "use strict";

  const Core = window.InneraClinicCore;

  const DEMO_CLINIC_ID = "lyuA5LbAHkgvgjn9y6oF";

  function isClinicAdmin(staff) {
    return (
      staff?.role === "admin" ||
      staff?.role === "clinic_admin"
    );
  }

  function isDemoClinic(staff) {
    return staff?.clinicId === DEMO_CLINIC_ID;
  }

  function openAddStaffModal() {
    const staff = Core.getCurrentStaff();

    if (!staff) return false;

    if (!isClinicAdmin(staff)) {
      Core.showToast("只有院所管理員可以新增成員");
      return false;
    }

    if (isDemoClinic(staff)) {
      Core.showToast(
        "展示環境不開放新增院所成員。"
      );
      return false;
    }

    document
      .getElementById("addClinicStaffModal")
      ?.classList.add("show");
  }

  function closeAddStaffModal() {
    document
      .getElementById("addClinicStaffModal")
      ?.classList.remove("show");
  }

  function setAddStaffLoading(loading) {
    const button =
      document.getElementById("submitAddClinicStaff");

    if (!button) return;

    button.disabled = loading;
    button.textContent =
      loading ? "建立中..." : "建立帳號";
  }

  async function createClinicStaff(event) {
    event.preventDefault();

    const currentStaff = Core.getCurrentStaff();

    if (!currentStaff) return false;

    if (!isClinicAdmin(currentStaff)) {
      Core.showToast("只有院所管理員可以新增成員");
      return false;
    }

    if (isDemoClinic(currentStaff)) {
      Core.showToast(
        "展示環境不開放新增院所成員。"
      );
      closeAddStaffModal();
      return false;
    }

    const displayName =
      document
        .getElementById("newStaffName")
        ?.value.trim() || "";

    const email =
      document
        .getElementById("newStaffEmail")
        ?.value.trim() || "";

    const password =
      document
        .getElementById("newStaffPassword")
        ?.value || "";

    const role =
      document
        .getElementById("newStaffRole")
        ?.value || "staff";

    const department =
      document
        .getElementById("newStaffDepartment")
        ?.value.trim() || "";

    if (!displayName || !email || !password) {
      Core.showToast(
        "請填寫姓名、Email 與密碼"
      );
      return false;
    }

    setAddStaffLoading(true);

    try {
      const functions =
        firebase
          .app()
          .functions("us-central1");

      const createStaff =
        functions.httpsCallable(
          "createClinicStaff"
        );

      await createStaff({
        displayName,
        email,
        password,
        role,
        department
      });

      closeAddStaffModal();

      document
        .getElementById("addClinicStaffForm")
        ?.reset();

      Core.showToast(
        `${displayName} 已建立`
      );

      await window.InneraClinicStaff.load();

    } catch (error) {
      console.error(
        "[Innera] 新增院所成員失敗",
        error
      );

      let message =
        "建立院所成員失敗";

      if (
        error.code ===
        "functions/already-exists"
      ) {
        message =
          "這個 Email 已經有帳號";
      }

      if (
        error.code ===
        "functions/permission-denied"
      ) {
        message =
          "你沒有新增院所成員的權限";
      }

      Core.showToast(message);

    } finally {
      setAddStaffLoading(false);
    }
  }
async function updateClinicStaffRole(
  staffUid,
  staffName,
  role
) {
  const currentStaff =
    Core.getCurrentStaff();

  if (!currentStaff) return false;

  if (!isClinicAdmin(currentStaff)) {
    Core.showToast(
      "只有院所管理員可以修改成員角色"
    );
    return false;
  }

  if (isDemoClinic(currentStaff)) {
    Core.showToast(
      "展示環境不開放修改院所成員角色。"
    );
    return false;
  }

  if (currentStaff.uid === staffUid) {
    Core.showToast(
      "院所至少需要保留一位啟用中的管理員"
    );
    return false;
  }

  const allowedRoles = [
    "admin",
    "doctor",
    "nurse",
    "staff"
  ];

  if (!allowedRoles.includes(role)) {
    Core.showToast(
      "角色設定不正確"
    );
    return false;
  }

  try {

    const fn =
      firebase
        .app()
        .functions("us-central1")
        .httpsCallable(
          "updateClinicStaffRole"
        );

    const result =
      await fn({
        staffUid,
        role
      });

    if (result.data?.changed === false) {
      Core.showToast(
        `${staffName} 的角色沒有變更`
      );
      return true;
    }

    Core.showToast(
      `${staffName} 的角色已更新`
    );

    await window.InneraClinicStaff.load();
    return true;
  } catch (error) {

    console.error(
      "[Innera] 修改院所成員角色失敗",
      error
    );

    let message =
      "修改院所成員角色失敗";

    if (
      error.code ===
      "functions/permission-denied"
    ) {
      message =
        "你沒有修改院所成員角色的權限";
    }

    if (
      error.code ===
      "functions/not-found"
    ) {
      message =
        "找不到這位院所成員";
    }

    if (
      error.code ===
      "functions/failed-precondition"
    ) {
      message =
        "不能修改自己的角色";
    }

    Core.showToast(message);
    return false;
  }
}
  async function disableClinicStaff(
    staffUid,
    staffName
  ) {
    const currentStaff =
      Core.getCurrentStaff();

    if (!currentStaff) return false;

    if (!isClinicAdmin(currentStaff)) {
      Core.showToast(
        "只有院所管理員可以停用成員"
      );
      return false;
    }

    if (currentStaff.uid === staffUid) {
      Core.showToast(
        "不能停用自己的帳號"
      );
      return false;
    }

    if (
      !window.confirm(
        `確定要停用 ${staffName} 嗎？`
      )
    ) {
      return false;
    }

    try {
      const fn =
        firebase
          .app()
          .functions("us-central1")
          .httpsCallable(
            "disableClinicStaff"
          );

      await fn({ staffUid });

      Core.showToast(
        `${staffName} 已停用`
      );

      await window.InneraClinicStaff.load();

    } catch (error) {
      console.error(
        "[Innera] 停用院所成員失敗",
        error
      );

      let message =
        "停用院所成員失敗";

      if (
        error.code ===
        "functions/permission-denied"
      ) {
        message =
          "你沒有停用院所成員的權限";
      }

      if (
        error.code ===
        "functions/not-found"
      ) {
        message =
          "找不到這位院所成員";
      }

      Core.showToast(message);
    }
  }

  async function enableClinicStaff(
    staffUid,
    staffName
  ) {
    const currentStaff =
      Core.getCurrentStaff();

    if (!currentStaff) return false;

    if (!isClinicAdmin(currentStaff)) {
      Core.showToast(
        "只有院所管理員可以啟用成員"
      );
      return false;
    }

    if (
      !window.confirm(
        `確定要重新啟用 ${staffName} 嗎？`
      )
    ) {
      return false;
    }

    try {
      const fn =
        firebase
          .app()
          .functions("us-central1")
          .httpsCallable(
            "enableClinicStaff"
          );

      await fn({ staffUid });

      Core.showToast(
        `${staffName} 已重新啟用`
      );

      await window.InneraClinicStaff.load();

    } catch (error) {
      console.error(
        "[Innera] 啟用院所成員失敗",
        error
      );

      let message =
        "啟用院所成員失敗";

      if (
        error.code ===
        "functions/permission-denied"
      ) {
        message =
          "你沒有啟用院所成員的權限";
      }

      if (
        error.code ===
        "functions/not-found"
      ) {
        message =
          "找不到這位院所成員";
      }

      Core.showToast(message);
    }
  }

  window.InneraClinicStaffActions = {
    openAddStaffModal,
    closeAddStaffModal,
    createClinicStaff,
    updateClinicStaffRole,
    disableClinicStaff,
    enableClinicStaff
  };
})();