


function showLoginView() {
  document.getElementById("loginView")?.classList.remove("hidden");
  document.getElementById("appView")?.classList.add("hidden");
}

function showAppView() {
  document.getElementById("loginView")?.classList.add("hidden");
  document.getElementById("appView")?.classList.remove("hidden");
  showDashboard();
}

function initAuth() {
  const loggedIn =
    localStorage.getItem("inneraClinicianDemoLoggedIn") === "true";

  if (loggedIn) {
    showAppView();
  } else {
    showLoginView();
  }

  document.getElementById("loginForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const email =
        document.getElementById("loginEmail").value.trim();

      const password =
        document.getElementById("loginPassword").value.trim();

      if (!email || !password) {
        showToast("請輸入帳號與密碼");
        return;
      }

      localStorage.setItem(
        "inneraClinicianDemoLoggedIn",
        "true"
      );

      showAppView();
      showToast("登入成功");
    });

  document.getElementById("logoutButton")
    ?.addEventListener("click", () => {
      localStorage.removeItem(
        "inneraClinicianDemoLoggedIn"
      );

      closeDrawer();
      showLoginView();
    });
}
