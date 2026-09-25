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

  function showPasswordMessage(
    text,
    isError = false
    ) {

    const message =
        getElement("passwordSetupMessage");

    if (!message) return;


    message.textContent = text;

    message.style.display = "block";

    message.style.background =
        isError
        ? "#fff4f3"
        : "#eef4ff";

    message.style.color =
        isError
        ? "#984b45"
        : "#3f5fbf";
    }

    function showPasswordSetupIfReady() {

    const user =
        firebase.auth().currentUser;


    if (
        !user ||
        user.emailVerified !== true
    ) {
        return false;
    }


    const section =
        getElement("passwordSetupSection");


    if (section) {
        section.style.display = "block";
    }


    return true;
    }

    async function activateStaffAccount() {

        const button =
            getElement("activateStaffButton");


        const password =
            String(
            getElement("staffPassword")?.value || ""
            );


        const passwordConfirm =
            String(
            getElement("staffPasswordConfirm")?.value || ""
            );


        if (password.length < 8) {
            showPasswordMessage(
            "密碼至少需要 8 碼。",
            true
            );
            return;
        }


        if (password !== passwordConfirm) {
            showPasswordMessage(
            "兩次輸入的密碼不一致。",
            true
            );
            return;
        }


        const user =
            firebase.auth().currentUser;


        if (!user) {
            showPasswordMessage(
            "登入狀態已失效，請重新開啟邀請信中的連結。",
            true
            );
            return;
        }


        if (user.emailVerified !== true) {
            showPasswordMessage(
            "請先完成 Email 驗證。",
            true
            );
            return;
        }


        const {
            inviteId,
            token
        } = getInviteContext();


        if (!inviteId || !token) {
            showPasswordMessage(
            "邀請資料不完整，請重新開啟邀請連結。",
            true
            );
            return;
        }


        if (button) {
            button.disabled = true;
            button.textContent = "啟用中...";
        }


        try {

            // ---------------------------------------------------
            // 1. 由受邀者自己設定 Firebase Auth 密碼
            // ---------------------------------------------------

            await user.updatePassword(
            password
            );


            // ---------------------------------------------------
            // 2. 正式接受 Staff Invite
            // ---------------------------------------------------

            const acceptStaffInvite =
            firebase
                .app()
                .functions("us-central1")
                .httpsCallable(
                "acceptStaffInvite"
                );


            const result =
            await acceptStaffInvite({
                inviteId,
                token
            });


            if (!result.data?.success) {
            throw new Error(
                "Staff invitation acceptance failed."
            );
            }


            // ---------------------------------------------------
            // 3. 完成
            // ---------------------------------------------------

            const passwordSection =
            getElement(
                "passwordSetupSection"
            );


            if (passwordSection) {
            passwordSection.style.display =
                "none";
            }


            const status =
            getElement("activationStatus");


            if (status) {

            status.classList.remove("error");

            status.style.display = "block";

            status.textContent =
                "帳號啟用完成，你現在已經可以登入心域醫療端。";
            }

        } catch (error) {

            console.error(
            "[Innera] Staff account activation failed",
            error
            );


            let message =
            "帳號啟用失敗，請稍後再試。";


            if (
            error.code ===
            "auth/weak-password"
            ) {
            message =
                "密碼強度不足，請設定更安全的密碼。";
            }


            if (
            error.code ===
            "auth/requires-recent-login"
            ) {
            message =
                "驗證狀態已逾時，請重新開啟邀請信中的連結。";
            }


            if (
            error.code ===
            "functions/already-exists"
            ) {
            message =
                "這個帳號已經是此院所成員。";
            }


            if (
            error.code ===
            "functions/failed-precondition"
            ) {
            message =
                error.message ||
                "目前無法接受這份邀請。";
            }


            if (
            error.code ===
            "functions/permission-denied"
            ) {
            message =
                "目前登入帳號與受邀帳號不一致。";
            }


            showPasswordMessage(
            message,
            true
            );


        } finally {

            if (button) {
            button.disabled = false;
            button.textContent =
                "完成帳號啟用";
            }
        }
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
    function getInviteContext() {

    const params =
        new URLSearchParams(
        window.location.search
        );


    let inviteId =
        String(
        params.get("invite") || ""
        ).trim();


    let token =
        String(
        params.get("token") || ""
        ).trim();


    // 一般 invitation URL
    if (inviteId && token) {
        return {
        inviteId,
        token
        };
    }


    // Firebase Email Link 會把原 activation URL
    // 放在 continueUrl 裡
    const continueUrlRaw =
        String(
        params.get("continueUrl") || ""
        ).trim();


    if (!continueUrlRaw) {
        return {
        inviteId: "",
        token: ""
        };
    }


    try {

        const continueUrl =
        new URL(
            continueUrlRaw
        );


        inviteId =
        String(
            continueUrl.searchParams.get("invite") || ""
        ).trim();


        token =
        String(
            continueUrl.searchParams.get("token") || ""
        ).trim();


        return {
        inviteId,
        token
        };


    } catch (error) {

        console.error(
        "[Innera] Invalid continueUrl",
        error
        );


        return {
        inviteId: "",
        token: ""
        };
    }
    }
    async function completeEmailLinkSignIn() {

    const auth =
        firebase.auth();


    // 一般 invitation preview 不需要做 Firebase sign-in。
    if (
        !auth.isSignInWithEmailLink(
        window.location.href
        )
    ) {
        return "none";
    }


    const {
        inviteId,
        token
    } = getInviteContext();


    if (!inviteId || !token) {
        showError(
        "邀請資料不完整，無法完成 Email 驗證。"
        );

        return "error";
    }


    try {

        const functions =
        firebase
            .app()
            .functions("us-central1");


        // 後端驗證 invite/token 後，
        // 才取得完整受邀 Email。
        const getActivationEmail =
        functions.httpsCallable(
            "getStaffInviteActivationEmail"
        );


        const result =
        await getActivationEmail({
            inviteId,
            token
        });


        const email =
        String(
            result.data?.email || ""
        )
            .trim()
            .toLowerCase();


        if (!email) {
        throw new Error(
            "Activation email missing."
        );
        }


        const credential =
        await auth.signInWithEmailLink(
            email,
            window.location.href
        );


        const user =
        credential.user;


        if (!user) {
        throw new Error(
            "Firebase user missing after Email Link sign-in."
        );
        }


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

        return "error";
        }


        // Firebase action code 已使用完成，
        // 把網址整理回乾淨的 invitation URL。
        const cleanUrl =
        new URL(
            "staff-activate.html",
            window.location.href
        );


        cleanUrl.searchParams.set(
        "invite",
        inviteId
        );


        cleanUrl.searchParams.set(
        "token",
        token
        );


        window.history.replaceState(
        {},
        "",
        cleanUrl.toString()
        );


        return "success";


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
        "functions/permission-denied"
        ) {
        message =
            "邀請驗證資料不正確。";
        }


        showError(message);

        return "error";
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

    const {
      inviteId,
      token
      } = getInviteContext();

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

    getElement(
        "activateStaffButton"
        )?.addEventListener(
        "click",
        activateStaffAccount
        );

    // Firebase 初始化
    if (
      typeof firebase !== "undefined" &&
      window.INNERA_FIREBASE_CONFIG &&
      !firebase.apps.length
    ) {
      firebase.initializeApp(
        window.INNERA_FIREBASE_CONFIG
      );
    }


    // 如果是從 Email Link 進來，
    // 先完成 Firebase sign-in / Email verification。
    const emailLinkResult =
      await completeEmailLinkSignIn();


    // Email Link 本身失敗時，
    // 保留錯誤畫面，不要再被 loadInvitation 蓋掉。
    if (emailLinkResult === "error") {
      return;
    }


    // 驗證成功或只是一般 invite preview，
    // 才繼續顯示 invitation。
    await loadInvitation();
    showPasswordSetupIfReady();

    if (emailLinkResult === "success") {

      const user =
        firebase.auth().currentUser;


      if (user?.emailVerified === true) {

        const status =
          getElement("activationStatus");


        if (status) {

          status.classList.remove("error");

          status.style.display =
            "block";

          status.textContent =
            "Email 驗證完成，下一步請設定你的登入密碼。";
        }
         showPasswordSetupIfReady();
      }
    }
  }
);

})();