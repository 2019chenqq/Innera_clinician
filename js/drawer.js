


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

  const metrics = row.querySelectorAll(".metric-block");

  if (metrics[0]) {
    document.getElementById("drawerMood").textContent =
      metrics[0].querySelector("strong")?.textContent || "-";

    document.getElementById("drawerMoodSub").textContent =
      metrics[0].querySelector("span")?.textContent || "";
  }

  if (metrics[1]) {
    document.getElementById("drawerSleep").textContent =
      metrics[1].querySelector("strong")?.textContent || "-";

    document.getElementById("drawerSleepSub").textContent =
      metrics[1].querySelector("span")?.textContent || "";
  }

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
