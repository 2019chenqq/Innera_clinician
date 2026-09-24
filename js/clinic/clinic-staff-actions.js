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
      loading ? "建立邀請中..." : "寄送邀請";
  }

  async function createStaffInvite(event) {
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

    const role =
      document
        .getElementById("newStaffRole")
        ?.value || "staff";

    const department =
      document
        .getElementById("newStaffDepartment")
        ?.value.trim() || "";

    if (!displayName || !email) {
      Core.showToast(
        "請填寫姓名與 Email"
      );
      return false;
    }

    setAddStaffLoading(true);

    try {
      const functions =
        firebase
          .app()
          .functions("us-central1");

      const createInvite =
        functions.httpsCallable(
          "createStaffInvite"
        );

      const result =
        await createInvite({
          displayName,
          email,
          role,
          department
        });

      const inviteId =
        result.data?.inviteId;

      const inviteToken =
        result.data?.token;


      if (!inviteId || !inviteToken) {
        throw new Error(
          "建立邀請成功，但缺少邀請連結資料。"
        );
      }


      const activationUrl =
        new URL(
          "https://2019chenqq.github.io/Innera_clinician/staff-activate.html"
        );


      activationUrl.searchParams.set(
        "invite",
        inviteId
      );

      activationUrl.searchParams.set(
        "token",
        inviteToken
      );


      const actionCodeSettings = {
        url: activationUrl.toString(),
        handleCodeInApp: true
      };


      await firebase
        .auth()
        .sendSignInLinkToEmail(
          email,
          actionCodeSettings
        );

      console.log(
        "[Staff Invite] Email link sent:",
        {
          email,
          activationUrl: activationUrl.toString()
        }
      );

      closeAddStaffModal();

      document
        .getElementById("addClinicStaffForm")
        ?.reset();

      Core.showToast(
        `邀請已寄送至 ${email}`
      );

      await window.InneraClinicStaff.load();

    } catch (error) {
      console.error(
        "[Innera] 新增院所成員失敗",
        error
      );

      let message =
        "寄送成員邀請失敗";

      if (
        error.code ===
        "auth/unauthorized-continue-uri"
      ) {
        message =
          "邀請網址尚未加入 Firebase Authorized Domains";
      }

      if (
        error.code ===
        "auth/invalid-email"
      ) {
        message =
          "Email 格式不正確";
      }

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
    createStaffInvite,
    updateClinicStaffRole,
    disableClinicStaff,
    enableClinicStaff
  };
})();