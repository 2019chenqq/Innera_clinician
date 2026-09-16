


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

  addPatientForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName =
      document.getElementById("newPatientName").value.trim();

    const queueNumber =
      document.getElementById("newQueueNumber").value.trim();

    const visitType =
      document.getElementById("newVisitType").value;

    if (!fullName || !queueNumber) {
      showToast("請完整填寫個案資料");
      return;
    }

    const now = new Date();
    const registrationTime =
      `${String(now.getHours()).padStart(2, "0")}:` +
      `${String(now.getMinutes()).padStart(2, "0")}`;

    patients.push({
      id: `P${String(patients.length + 1).padStart(3, "0")}`,
      fullName,
      queueNumber: Number(queueNumber),
      registrationTime,
      visitType,
      linked: false,
      attention: false,
      viewed: false,
      status: null,
      statusType: null,
      mood: null,
      moodSub: null,
      sleep: null,
      sleepSub: null,
      changes: [],
      updated: "—"
    });

    renderPatients();
    updateCounts();
    filterPatients();

    closeAddModal();
    addPatientForm.reset();

    showToast(`${maskPatientName(fullName)} 已新增`);
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".connect-button");
    if (!button) return;

    event.preventDefault();

    const row = button.closest(".patient-row");

    document.getElementById("invitePatientName").textContent =
      maskPatientName(row.dataset.name || "個案");

    document.getElementById("inviteCode").textContent = "--";

    inviteModal?.classList.add("show");
  });

  document.getElementById("closeInviteModal")
    ?.addEventListener("click", closeInviteModal);

  document.getElementById("cancelInvite")
    ?.addEventListener("click", closeInviteModal);

  document.getElementById("generateInviteCode")
    ?.addEventListener("click", () => {
      const code = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      document.getElementById("inviteCode").textContent = code;
      showToast("連結代碼已產生");
    });

  inviteModal?.addEventListener("click", (event) => {
    if (event.target === inviteModal) {
      closeInviteModal();
    }
  });
}
