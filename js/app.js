






attachPatientDetails(patients);

initDashboard();
initDrawer();
initModals();
initPatientDetail();
initAuth();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
    closeAddModal();
    closeInviteModal();
  }
});
