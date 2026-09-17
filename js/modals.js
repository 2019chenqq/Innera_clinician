

let activeInvitePatientId = null;
function openAddPatientModal() {
  document.getElementById("addPatientModal")?.classList.add("show");
}

function closeAddModal() {
  document.getElementById("addPatientModal")?.classList.remove("show");
}

function closeInviteModal() {
  document.getElementById("inviteModal")?.classList.remove("show");
}

function initModals() {
  const addPatientModal = document.getElementById("addPatientModal");
  const addPatientForm = document.getElementById("addPatientForm");
  const inviteModal = document.getElementById("inviteModal");

  document.querySelector(".secondary-button")
    ?.addEventListener("click", openAddPatientModal);

  document.getElementById("closeAddPatientModal")
    ?.addEventListener("click", closeAddModal);

  document.getElementById("cancelAddPatient")
    ?.addEventListener("click", closeAddModal);

  addPatientModal?.addEventListener("click", (event) => {
    if (event.target === addPatientModal) {
      closeAddModal();
    }
  });

  addPatientForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName =
    document.getElementById("newPatientName").value.trim();

  const queueNumberRaw =
    document.getElementById("newQueueNumber").value.trim();

  const visitType =
    document.getElementById("newVisitType").value;

  if (!fullName || !queueNumberRaw) {
    showToast("請完整填寫個案資料");
    return;
  }

  const queueNumber = Number(queueNumberRaw);

  if (!Number.isFinite(queueNumber) || queueNumber <= 0) {
    showToast("掛號號碼格式不正確");
    return;
  }

  if (
    !window.InneraPatientLinkMVP ||
    typeof window.InneraPatientLinkMVP.createPatient !== "function"
  ) {
    console.error(
      "[Innera] 找不到 InneraPatientLinkMVP.createPatient"
    );
    showToast("新增個案功能尚未載入");
    return;
  }

  const submitButton =
    addPatientForm.querySelector('button[type="submit"]');

  const originalText =
    submitButton?.textContent || "新增個案";

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "新增中...";
    }

    const created =
      await window.InneraPatientLinkMVP.createPatient({
        legalName: fullName,
        queueNumber,
        visitType
      });

    console.info(
      "[Innera] 新增患者成功：",
      created
    );

    if (
      window.InneraPatientSync &&
      typeof window.InneraPatientSync.refresh === "function"
    ) {
      await window.InneraPatientSync.refresh();
    }

    closeAddModal();
    addPatientForm.reset();

    const patientId =
      created?.patientId ||
      created?.id ||
      "";

    showToast(
      patientId
        ? `${maskPatientName(fullName)} 已新增（${patientId}）`
        : `${maskPatientName(fullName)} 已新增`
    );
  } catch (error) {
    console.error(
      "[Innera] 新增個案失敗：",
      error
    );

    showToast(
      `新增失敗：${error.message}`
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".connect-button");
    if (!button) return;

    event.preventDefault();

    const row = button.closest(".patient-row");

activeInvitePatientId =
  row?.dataset.code || null;

document.getElementById("invitePatientName").textContent =
  maskPatientName(row?.dataset.name || "個案");

    document.getElementById("inviteCode").textContent = "--";

    inviteModal?.classList.add("show");
  });

  document.getElementById("closeInviteModal")
    ?.addEventListener("click", closeInviteModal);

  document.getElementById("cancelInvite")
    ?.addEventListener("click", closeInviteModal);

  document.getElementById("generateInviteCode")
  ?.addEventListener("click", async () => {
    if (!activeInvitePatientId) {
      showToast("找不到個案編號");
      return;
    }

    if (
      !window.InneraPatientLinkMVP ||
      typeof window.InneraPatientLinkMVP.createInvite !== "function"
    ) {
      console.error(
        "[Innera] 找不到 InneraPatientLinkMVP.createInvite"
      );
      showToast("邀請功能尚未載入");
      return;
    }

    const button =
      document.getElementById("generateInviteCode");

    const originalText =
      button?.textContent || "產生代碼";

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "產生中...";
      }

      const invite =
        await window.InneraPatientLinkMVP.createInvite({
          patientId: activeInvitePatientId
        });

      const code =
        invite?.code || "";

      if (!code) {
        throw new Error("未取得邀請碼");
      }

      document.getElementById(
        "inviteCode"
      ).textContent = code;

      console.info(
        "[Innera] 邀請碼建立成功：",
        invite
      );

      showToast("連結代碼已產生");
    } catch (error) {
      console.error(
        "[Innera] 建立邀請碼失敗：",
        error
      );

      showToast(
        `產生失敗：${error.message}`
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
}
