


function openDrawer(row) {
  state.activePatientId = row.dataset.code || null;

  const selectedPatient = patients.find(
    (patient) => patient.id === state.activePatientId
  );

  if (selectedPatient && !selectedPatient.viewed) {
    selectedPatient.viewed = true;
    row.dataset.viewed = "true";
    updateCounts();
  }

  document.getElementById("drawerPatientName").textContent =
    row.dataset.name || "個案";

  const meta = row.querySelector(".patient-meta");
  if (meta) {
    document.getElementById("drawerPatientMeta").textContent =
      meta.textContent.trim();
  }

  const status = row.querySelector(".mood-status");
  if (status) {
    document.getElementById("drawerStatus").textContent =
      status.textContent.trim();
  }

    document.getElementById("drawerMood").textContent =
    selectedPatient?.currentMood || "—";

    document.getElementById("drawerMoodSub").textContent =
      selectedPatient?.currentMood
        ? "最新快速紀錄"
        : "尚無情緒紀錄";

    document.getElementById("drawerSleep").textContent =
      selectedPatient?.sleep || "—";

    document.getElementById("drawerSleepSub").textContent =
      selectedPatient?.sleepSub || "暫無睡眠資料";

    document.getElementById("drawerAiSummary").textContent =
      selectedPatient?.aiSummary?.patternSummary ||
      selectedPatient?.summary ||
      "目前沒有足夠摘要資料。";

  const drawerChanges = document.getElementById("drawerChanges");
  drawerChanges.innerHTML = "";

  row.querySelectorAll(".change-item").forEach((change) => {
    const tag = document.createElement("span");
    tag.className = "drawer-tag";
    tag.textContent = change.textContent.trim();
    drawerChanges.appendChild(tag);
  });

  document.getElementById("patientDrawer").classList.add("show");
  document.getElementById("drawerOverlay").classList.add("show");
}

function closeDrawer() {
  document.getElementById("patientDrawer")?.classList.remove("show");
  document.getElementById("drawerOverlay")?.classList.remove("show");
}

function initDrawer() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".view-button");
    if (!button) return;

    event.preventDefault();
    openDrawer(button.closest(".patient-row"));
  });

  document.getElementById("closeDrawer")
    ?.addEventListener("click", closeDrawer);

  document.getElementById("closeDrawerBottom")
    ?.addEventListener("click", closeDrawer);

  document.getElementById("drawerOverlay")
    ?.addEventListener("click", closeDrawer);
}
