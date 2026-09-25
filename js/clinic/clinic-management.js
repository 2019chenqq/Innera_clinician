// js/clinic/clinic-management.js
(function () {
  "use strict";

  function showClinicManagement() {
    document.getElementById("dashboardMain")?.classList.add("hidden");
    document.getElementById("patientDetailPage")?.classList.add("hidden");
    document.getElementById("clinicManagementPage")?.classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });
    document.getElementById("clinicManagementNav")?.classList.add("active");

    window.InneraClinicStaff?.load();
    window.InneraClinicSettings?.load();
    loadPendingInvites();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function hideClinicManagement() {
    document.getElementById("clinicManagementPage")?.classList.add("hidden");
  }

  function roleLabel(role) {
  const labels = {
    admin: "院所管理員",
    doctor: "醫師",
    nurse: "護理人員",
    staff: "行政人員"
  };

  return labels[role] || role || "—";
}


function formatInviteExpiry(milliseconds) {

  if (!milliseconds) return "—";

  const date =
    new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "zh-TW",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);
}


function renderPendingInvites(invites) {

  const list =
    document.getElementById(
      "pendingInvitesList"
    );

  const count =
    document.getElementById(
      "pendingInviteCount"
    );

  const loading =
    document.getElementById(
      "pendingInvitesLoading"
    );

  const empty =
    document.getElementById(
      "pendingInvitesEmpty"
    );

  const error =
    document.getElementById(
      "pendingInvitesError"
    );


  loading?.classList.add("hidden");
  error?.classList.add("hidden");


  if (count) {
    count.textContent =
      String(invites.length);
  }


  if (!list) return;


  list.innerHTML = "";


  if (!invites.length) {
    empty?.classList.remove("hidden");
    return;
  }


  empty?.classList.add("hidden");


  list.innerHTML =
    invites.map((invite) => {

      const expiredClass =
        invite.isExpired
          ? " expired"
          : "";


      const expiryText =
        invite.isExpired
          ? "已過期"
          : `有效至 ${formatInviteExpiry(
              invite.expiresAt
            )}`;


      return `
        <article class="pending-invite-card${expiredClass}">

          <div class="pending-invite-main">

            <div class="pending-invite-avatar">
              ${String(
                invite.displayName || "邀"
              ).slice(0, 1)}
            </div>

            <div class="pending-invite-info">

              <strong>
                ${invite.displayName || "未命名成員"}
              </strong>

              <span>
                ${invite.maskedEmail || "—"}
              </span>

            </div>

          </div>


          <div class="pending-invite-meta">

            <span class="pending-invite-role">
              ${roleLabel(invite.role)}
            </span>

            <span>
              ${invite.department || "未設定科別"}
            </span>

            <span class="pending-invite-expiry">
              ${expiryText}
            </span>
            <button
              type="button"
              class="pending-invite-resend-button"
              data-invite-id="${invite.inviteId}"
              data-invite-name="${invite.displayName || "此成員"}"
            >
              重新寄送
            </button>
            <button
              type="button"
              class="pending-invite-revoke-button"
              data-invite-id="${invite.inviteId}"
              data-invite-name="${invite.displayName || "此成員"}"
            >
              撤銷邀請
            </button>

          </div>

        </article>
      `;
    })
    .join("");
}


async function loadPendingInvites() {

  const loading =
    document.getElementById(
      "pendingInvitesLoading"
    );

  const empty =
    document.getElementById(
      "pendingInvitesEmpty"
    );

  const error =
    document.getElementById(
      "pendingInvitesError"
    );


  loading?.classList.remove("hidden");
  empty?.classList.add("hidden");
  error?.classList.add("hidden");


  try {

    const fn =
      firebase
        .app()
        .functions("us-central1")
        .httpsCallable(
          "listPendingStaffInvites"
        );


    const result =
      await fn();


    const invites =
      Array.isArray(
        result.data?.invites
      )
        ? result.data.invites
        : [];


    renderPendingInvites(invites);


  } catch (err) {

    console.error(
      "[Innera] 讀取待接受邀請失敗",
      err
    );


    loading?.classList.add("hidden");
    empty?.classList.add("hidden");
    error?.classList.remove("hidden");
  }
}

  function initClinicManagement() {
    document.getElementById("clinicManagementNav")
      ?.addEventListener("click", (event) => {
        event.preventDefault();
        showClinicManagement();
      });

    const Actions = window.InneraClinicStaffActions;
    const Settings = window.InneraClinicSettings;

    document.getElementById("addClinicStaffButton")
      ?.addEventListener("click", Actions.openAddStaffModal);
    document.getElementById("closeAddClinicStaffModal")
      ?.addEventListener("click", Actions.closeAddStaffModal);
    document.getElementById("cancelAddClinicStaff")
      ?.addEventListener("click", Actions.closeAddStaffModal);
    document.getElementById("addClinicStaffForm")
      ?.addEventListener("submit", Actions.createStaffInvite);
    document.getElementById("addClinicStaffModal")
      ?.addEventListener("click", (event) => {
        if (event.target.id === "addClinicStaffModal") Actions.closeAddStaffModal();
      });

    document
      .getElementById("pendingInvitesList")
      ?.addEventListener(
        "click",
        (event) => {

          const resendButton =
            event.target.closest(
              ".pending-invite-resend-button"
            );

          if (resendButton) {
            Actions.resendStaffInvite(
              resendButton.dataset.inviteId,
              resendButton.dataset.inviteName || "此成員"
            );
            return;
          }


          const revokeButton =
            event.target.closest(
              ".pending-invite-revoke-button"
            );

          if (revokeButton) {
            Actions.revokeStaffInvite(
              revokeButton.dataset.inviteId,
              revokeButton.dataset.inviteName || "此成員"
            );
          }
        }
      );

    document.getElementById("clinicStaffList")
      ?.addEventListener("click", (event) => {
        const disableButton = event.target.closest(".staff-disable-button");
        if (disableButton) {
          Actions.disableClinicStaff(
            disableButton.dataset.staffUid,
            disableButton.dataset.staffName || "此成員"
          );
          return;
        }
        const enableButton = event.target.closest(".staff-enable-button");
        if (enableButton) {
          Actions.enableClinicStaff(
            enableButton.dataset.staffUid,
            enableButton.dataset.staffName || "此成員"
          );
        }
      });

    document.getElementById("editClinicSettingsButton")
      ?.addEventListener("click", Settings.startEdit);
    document.getElementById("cancelClinicSettingsButton")
      ?.addEventListener("click", Settings.cancelEdit);
    document.getElementById("saveClinicSettingsButton")
      ?.addEventListener("click", Settings.save);
  }

  window.InneraClinicManagement = {
    show: showClinicManagement,
    hide: hideClinicManagement,

    loadPendingInvites,

    load: () => {
      window.InneraClinicStaff?.load();
      loadPendingInvites();
    }
  };

  document.addEventListener("DOMContentLoaded", initClinicManagement);
})();
