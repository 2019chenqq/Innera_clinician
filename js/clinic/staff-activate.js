(function () {
  "use strict";

  const ROLE_LABELS = {
    admin: "院所管理員",
    doctor: "醫師",
    nurse: "護理人員",
    staff: "行政人員"
  };


  function getElement(id) {
    return document.getElementById(id);
  }


  function showError(message) {
    const status =
      getElement("activationStatus");

    if (!status) return;

    status.textContent = message;
    status.classList.add("error");
    status.style.display = "block";
  }


  function hideStatus() {
    const status =
      getElement("activationStatus");

    if (!status) return;

    status.style.display = "none";
  }


  function formatExpiry(milliseconds) {

    const date =
      new Date(milliseconds);


    if (Number.isNaN(date.getTime())) {
      return "—";
    }


    return new Intl.DateTimeFormat(
      "zh-TW",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(date);
  }

    async function completeEmailLinkSignIn() {

    const auth =
        firebase.auth();


    // 不是 Firebase Email Sign-in Link，
    // 就代表只是一般 invitation preview。
    if (
        !auth.isSignInWithEmailLink(
        window.location.href
        )
    ) {
        return false;
    }


    const params =
        new URLSearchParams(
        window.location.search
        );


    const inviteId =
        String(
        params.get("invite") || ""
        ).trim();


    const token =
        String(
        params.get("token") || ""
        ).trim();


    if (!inviteId || !token) {
        showError(
        "邀請資料不完整，無法完成 Email 驗證。"
        );
        return true;
    }


    try {

        const functions =
        firebase
            .app()
            .functions("us-central1");


        const getActivationEmail =
        functions.httpsCallable(
            "getStaffInviteActivationEmail"
        );


        const emailResult =
        await getActivationEmail({
            inviteId,
            token
        });


        const email =
        String(
            emailResult.data?.email || ""
        )
            .trim()
            .toLowerCase();


        if (!email) {
        throw new Error(
            "Missing activation email."
        );
        }


        const credential =
        await auth.signInWithEmailLink(
            email,
            window.location.href
        );


        const user =
        credential.user;


        await user.reload();


        console.log(
        "[Innera] Staff Email Link sign-in success",
        {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
        }
        );


        if (!user.emailVerified) {
        showError(
            "Email 驗證尚未完成，請重新開啟邀請信中的連結。"
        );
        return true;
        }


        const status =
        getElement("activationStatus");


        if (status) {
        status.classList.remove("error");
        status.style.display = "block";
        status.textContent =
            "Email 驗證完成，帳號身分已確認。";
        }


        return true;


    } catch (error) {

        console.error(
        "[Innera] Staff Email Link sign-in failed",
        error
        );


        let message =
        "Email 驗證失敗，請重新開啟邀請信中的連結。";


        if (
        error.code ===
        "auth/invalid-action-code"
        ) {
        message =
            "這個驗證連結已失效或已使用。";
        }


        if (
        error.code ===
        "auth/expired-action-code"
        ) {
        message =
            "這個驗證連結已過期。";
        }


        if (
        error.code ===
        "auth/invalid-email"
        ) {
        message =
            "邀請 Email 資料不正確。";
        }


        showError(message);

        return true;
    }
    }
  async function loadInvitation() {

    // -----------------------------------------------------
    // 1. Firebase 初始化
    // -----------------------------------------------------

    if (typeof firebase === "undefined") {
      showError("Firebase 尚未載入，請稍後重新整理頁面。");
      return;
    }


    if (!window.INNERA_FIREBASE_CONFIG) {
      showError("Firebase 設定不存在。");
      return;
    }


    if (!firebase.apps.length) {
      firebase.initializeApp(
        window.INNERA_FIREBASE_CONFIG
      );
    }


    // -----------------------------------------------------
    // 2. 從 URL 取得 invite / token
    // -----------------------------------------------------

    const params =
      new URLSearchParams(
        window.location.search
      );


    const inviteId =
      String(
        params.get("invite") || ""
      ).trim();


    const token =
      String(
        params.get("token") || ""
      ).trim();

    if (!inviteId || !token) {
      showError(
        "邀請連結不完整，請確認你開啟的是完整的邀請網址。"
      );
      return;
    }


    // -----------------------------------------------------
    // 3. 呼叫 getStaffInvite
    // -----------------------------------------------------

    try {

      const functions =
        firebase
          .app()
          .functions("us-central1");


      const getStaffInvite =
        functions.httpsCallable(
          "getStaffInvite"
        );


      const result =
        await getStaffInvite({
          inviteId,
          token
        });


      const invite =
        result.data;


      if (!invite?.valid) {
        showError(
          "此邀請無效或已失效。"
        );
        return;
      }


      // ---------------------------------------------------
      // 4. 顯示有限邀請資訊
      // ---------------------------------------------------

      getElement(
        "inviteClinicName"
      ).textContent =
        invite.clinicDisplayName ||
        "受邀院所";


      getElement(
        "inviteDisplayName"
      ).textContent =
        invite.displayName ||
        "—";


      getElement(
        "inviteEmail"
      ).textContent =
        invite.maskedEmail ||
        "—";

      getElement(
        "inviteRole"
      ).textContent =
        ROLE_LABELS[invite.role] ||
        invite.role ||
        "—";


      getElement(
        "inviteExpiry"
      ).textContent =
        formatExpiry(
          invite.expiresAt
        );


      hideStatus();


      getElement(
        "inviteContent"
      )?.classList.add("show");


    } catch (error) {

      console.error(
        "[Innera] Staff invitation load failed",
        error
      );


      let message =
        "無法讀取這份邀請。";


      if (
        error.code ===
        "functions/not-found"
      ) {
        message =
          "找不到這份邀請，可能已經失效。";
      }


      if (
        error.code ===
        "functions/permission-denied"
      ) {
        message =
          "邀請連結無效。";
      }


      if (
        error.code ===
        "functions/failed-precondition"
      ) {
        message =
          error.message ||
          "這份邀請已使用或已過期。";
      }


      showError(message);
    }
  }

  document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // 先初始化 Firebase
    if (
      typeof firebase !== "undefined" &&
      window.INNERA_FIREBASE_CONFIG &&
      !firebase.apps.length
    ) {
      firebase.initializeApp(
        window.INNERA_FIREBASE_CONFIG
      );
    }


    // 若目前網址是 Firebase Email Link，
    // 先完成登入與 Email 驗證。
    const handledEmailLink =
      await completeEmailLinkSignIn();


    // 不論是否剛完成驗證，
    // 都再載入 invitation 顯示資訊。
    await loadInvitation();


    if (handledEmailLink) {

      const user =
        firebase.auth().currentUser;


      if (
        user?.emailVerified === true
      ) {
        const status =
          getElement("activationStatus");

        if (status) {
          status.classList.remove("error");
          status.style.display = "block";
          status.textContent =
            "Email 驗證完成，下一步請設定你的登入密碼。";
        }
      }
    }
  }
);

})();