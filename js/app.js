






attachPatientDetails(patients);

initDashboard();
initDrawer();
initModals();
initPatientDetail();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
    closeAddModal();
    closeInviteModal();
  }
});
