// js/auth.js

(function () {
  let currentStaff = null;

  function getFirebase() {
    if (!window.InneraFirebase) {
      throw new Error("InneraFirebase 尚未載入");
    }

    window.InneraFirebase.init();

    return {
      auth: firebase.auth(),
      db: firebase.firestore()
    };
  }


  function showLoginView() {
    const loginView =
      document.getElementById("loginView");

    const appView =
      document.getElementById("appView");

    if (loginView) {
      loginView.classList.remove("hidden");
    }

    if (appView) {
      appView.classList.add("hidden");
    }
  }


  function showAppView() {
    const loginView =
      document.getElementById("loginView");

    const appView =
      document.getElementById("appView");

    if (loginView) {
      loginView.classList.add("hidden");
    }

    if (appView) {
      appView.classList.remove("hidden");
    }

    if (typeof showDashboard === "function") {
      showDashboard();
    }
  }


  function setLoginError(message = "") {
    const element =
      document.getElementById("loginError");

    if (element) {
      element.textContent = message;
    }
  }


  function setLoginLoading(loading) {
    const button =
      document.getElementById("loginButton");

    if (!button) return;

    button.disabled = loading;

    button.textContent =
      loading
        ? "登入中..."
        : "登入醫療端";
  }


 async function loadStaffProfile(user) {
  const { db } = getFirebase();

  console.log("[Innera] 登入 UID =", user.uid);
  console.log("[Innera] 登入 Email =", user.email);

  const snapshot =
    await db
      .collection("clinicStaff")
      .doc(user.uid)
      .get();

  if (!snapshot.exists) {
    throw new Error(
      "此帳號尚未建立院所人員資料"
    );
  }

  const profile = snapshot.data();


  // 相容舊格式 active:false
  // 與新格式 status:"inactive"
  if (
    profile.active === false ||
    profile.status === "inactive"
  ) {
    throw new Error(
      "此院所帳號已停用"
    );
  }


  if (!profile.clinicId) {
    throw new Error(
      "此帳號尚未設定所屬院所"
    );
  }


  // ========================================
  // 檢查院所是否仍啟用
  // ========================================

  const clinicSnapshot =
    await db
      .collection("clinics")
      .doc(profile.clinicId)
      .get();


  if (!clinicSnapshot.exists) {
    throw new Error(
      "找不到所屬院所資料"
    );
  }


  const clinic =
    clinicSnapshot.data();


  if (clinic.status !== "active") {
    throw new Error(
      "此院所目前已停用，請聯絡心域平台管理員"
    );
  }


  return {
    uid: user.uid,
    email: user.email,

    ...profile,

    // 順便把正式院所資料帶進去
    clinicName:
      clinic.name ||
      profile.clinicName ||
      profile.clinicId,

    clinicCode:
      clinic.clinicCode || null,

    clinicStatus:
      clinic.status
  };
}


  function renderStaffProfile(staff) {
    const clinicName =
      document.getElementById(
        "currentClinicName"
      );

    const staffName =
      document.getElementById(
        "currentStaffName"
      );

    const staffRole =
      document.getElementById(
        "currentStaffRole"
      );

    const staffAvatar =
      document.getElementById(
        "currentStaffAvatar"
      );


    if (clinicName) {
      clinicName.textContent =
        staff.clinicName ||
        staff.clinicId ||
        "院所";
    }


    if (staffName) {
      staffName.textContent =
        staff.name ||
        staff.displayName ||
        staff.email ||
        "院所人員"
    }


    if (staffRole) {
      const roleLabels = {
        admin: "院所管理員",
        clinic_admin: "院所管理員",
        doctor: staff.department || "醫師",
        nurse: "護理人員",
        staff: "行政人員"
      };

      staffRole.textContent =
        roleLabels[staff.role] ||
        staff.department ||
        "院所人員";
    }


    if (staffAvatar) {
      const name =
        staff.name ||
        staff.displayName ||
        staff.email ||
        "?";

      staffAvatar.textContent =
        name.charAt(0);
    }
  }


  async function handleLoggedInUser(user) {
    try {
      const staff =
        await loadStaffProfile(user);

      currentStaff = staff;


      // 提供給整個醫療端使用
      window.INNERA_CURRENT_STAFF =
        staff;

      window.INNERA_ACTIVE_CLINIC_ID =
        staff.clinicId;


      renderStaffProfile(staff);

      showAppView();


      console.info(
        "[Innera] 院所人員登入",
        {
          uid: staff.uid,
          clinicId: staff.clinicId,
          role: staff.role
        }
      );

    } catch (error) {

      console.error(
        "[Innera] 院所帳號驗證失敗",
        error
      );

      const { auth } = getFirebase();

      await auth.signOut();

      currentStaff = null;

      window.INNERA_CURRENT_STAFF = null;
      window.INNERA_ACTIVE_CLINIC_ID = null;

      showLoginView();

      setLoginError(
        error.message ||
        "無法驗證院所帳號"
      );
    }
  }


  async function login(email, password) {
    const { auth } = getFirebase();

    setLoginLoading(true);
    setLoginError("");

    try {

      await auth.signInWithEmailAndPassword(
        email,
        password
      );

      // 不需要 showAppView
      // onAuthStateChanged 會接手

    } catch (error) {

      console.error(
        "[Innera] 登入失敗",
        error
      );


      let message =
        "登入失敗，請確認帳號與密碼";


      switch (error.code) {

        case "auth/invalid-email":
          message =
            "帳號格式不正確";
          break;

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          message =
            "帳號或密碼錯誤";
          break;

        case "auth/too-many-requests":
          message =
            "登入失敗次數過多，請稍後再試";
          break;

        case "auth/user-disabled":
          message =
            "此帳號已被停用";
          break;
      }


      setLoginError(message);

    } finally {

      setLoginLoading(false);

    }
  }


  async function logout() {
    const { auth } = getFirebase();

    await auth.signOut();
  }


  function initLoginForm() {

    const loginForm =
      document.getElementById(
        "loginForm"
      );


    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();


          const email =
            document
              .getElementById(
                "loginEmail"
              )
              .value
              .trim();


          const password =
            document
              .getElementById(
                "loginPassword"
              )
              .value;


          if (!email || !password) {

            setLoginError(
              "請輸入帳號與密碼"
            );

            return;
          }


          await login(
            email,
            password
          );

        }
      );
    }

    const demoButton =
        document.getElementById("fillDemoLogin");

      if (demoButton) {
        demoButton.addEventListener("click", () => {
          const emailInput =
            document.getElementById("loginEmail");

          const passwordInput =
            document.getElementById("loginPassword");

          if (emailInput) {
            emailInput.value = "demo@innera.tw";
          }

          if (passwordInput) {
            passwordInput.value = "555555";
          }

          setLoginError("");
        });
      }

    const logoutButton =
      document.getElementById(
        "logoutButton"
      );


    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        async () => {

          try {

            await logout();

          } catch (error) {

            console.error(
              "[Innera] 登出失敗",
              error
            );

          }

        }
      );
    }
  }


  function initAuthState() {

    const { auth } =
      getFirebase();


    auth.onAuthStateChanged(
      async (user) => {

        if (!user) {

          currentStaff = null;

          window.INNERA_CURRENT_STAFF =
            null;

          window.INNERA_ACTIVE_CLINIC_ID =
            null;

          showLoginView();

          return;
        }


        await handleLoggedInUser(
          user
        );

      }
    );
  }


  function init() {

    try {

      getFirebase();

      initLoginForm();

      initAuthState();

    } catch (error) {

      console.error(
        "[Innera] Auth 初始化失敗",
        error
      );

      showLoginView();

      setLoginError(
        "登入系統初始化失敗"
      );

    }
  }


  window.InneraClinicalAuth = {

    init,

    login,

    logout,

    get currentStaff() {
      return currentStaff;
    }

  };


  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();