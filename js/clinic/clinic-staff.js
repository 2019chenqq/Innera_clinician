// js/clinic/clinic-staff.js
(function () {
  "use strict";

  const Core = window.InneraClinicCore;
  function isClinicAdmin(staff) {
  return staff?.role === "admin" || staff?.role === "clinic_admin";
}

  function roleLabel(staff) {
  const roleLabels = {
    admin: "院所管理員",
    clinic_admin: "院所管理員",
    doctor: "醫師",
    nurse: "護理人員",
    staff: "行政人員"
  };

  return roleLabels[staff.role] || staff.role || "院所人員";
}

  function isStaffActive(staff) {
    return !(
      staff.active === false ||
      staff.status === "inactive"
    );
  }

  function statusLabel(staff) {
    return isStaffActive(staff)
      ? "啟用中"
      : "已停用";
  }
  function getRoleLabel(role) {
    const roleLabels = {
      admin: "院所管理員",
      clinic_admin: "院所管理員",
      doctor: "醫師",
      nurse: "護理人員",
      staff: "行政人員"
    };

    return roleLabels[role] || role || "院所人員";
  }

  function roleMenuItems(selectedRole) {
    const roles = [
      ["admin", "院所管理員"],
      ["doctor", "醫師"],
      ["nurse", "護理人員"],
      ["staff", "行政人員"]
    ];

    return roles
      .map(([value, label]) => `
        <button
          type="button"
          class="staff-role-option ${
            value === selectedRole ? "selected" : ""
          }"
          data-role="${value}"
        >
          <span>${label}</span>
          ${
            value === selectedRole
              ? '<i class="bi bi-check2"></i>'
              : ""
          }
        </button>
      `)
      .join("");
  }
  function renderStaffList(staffList) {
  const list = document.getElementById("clinicStaffList");
  const empty = document.getElementById("clinicStaffEmpty");
  const count = document.getElementById("managementStaffCount");

  const currentStaff = Core.getCurrentStaff();
  const canManageStaff = isClinicAdmin(currentStaff);

  if (!list) return;

    if (count) count.textContent = String(staffList.length);

    if (!staffList.length) {
      list.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }

    empty?.classList.add("hidden");

    list.innerHTML = staffList.map((staff) => {
      const name =
        staff.name ||
        staff.displayName ||
        staff.email ||
        "未命名成員";
      const avatar = name.charAt(0);
      const department = staff.department || "未設定科別";
      const statusClass =
        isStaffActive(staff)
          ? "active"
          : "inactive";
      const isCurrentUser =
        currentStaff?.uid === staff.uid;

      const canEditRole =
        canManageStaff &&
        !isCurrentUser &&
        isStaffActive(staff);
      return `
        <article class="clinic-staff-card">
          <div class="clinic-staff-main">
            <div class="clinic-staff-avatar">${avatar}</div>
            <div class="clinic-staff-info">
              <strong>${name}</strong>
              <span>${staff.email || "未設定 Email"}</span>
            </div>
          </div>
          <div class="clinic-staff-actions">
            <div class="clinic-staff-meta">
              <span class="staff-meta-item">
                <i class="bi bi-person-badge"></i>
                ${
                  canEditRole
                    ? `
                      <div
                        class="staff-role-dropdown"
                        data-staff-uid="${staff.uid}"
                        data-staff-name="${name}"
                        data-original-role="${staff.role}"
                      >
                        <button
                          type="button"
                          class="staff-role-trigger"
                          aria-expanded="false"
                        >
                          <span class="staff-role-trigger-label">
                            ${getRoleLabel(staff.role)}
                          </span>

                          <i class="bi bi-chevron-down"></i>
                        </button>

                        <div class="staff-role-menu">
                          ${roleMenuItems(staff.role)}
                        </div>
                      </div>
                    `
                    : roleLabel(staff)
                }
              </span>
              <span class="staff-meta-item">
                <i class="bi bi-hospital"></i>
                ${department}
              </span>
              <span class="staff-status ${statusClass}">
                ${statusLabel(staff)}
              </span>
            </div>
            ${
              canManageStaff && !isCurrentUser
                ? (
                    !isStaffActive(staff)
                      ? `
                        <button
                          type="button"
                          class="staff-enable-button"
                          data-staff-uid="${staff.uid}"
                          data-staff-name="${name}">
                          啟用
                        </button>
                      `
                      : `
                        <button
                          type="button"
                          class="staff-disable-button"
                          data-staff-uid="${staff.uid}"
                          data-staff-name="${name}">
                          停用
                        </button>
                      `
                  )
                : ""
            }
          </div>
        </article>
      `;
    }).join("");
    list
      .querySelectorAll(".staff-role-dropdown")
      .forEach((dropdown) => {

        const trigger =
          dropdown.querySelector(
            ".staff-role-trigger"
          );

        const menu =
          dropdown.querySelector(
            ".staff-role-menu"
          );

        const label =
          dropdown.querySelector(
            ".staff-role-trigger-label"
          );

        if (!trigger || !menu || !label) {
          return;
        }

        trigger.addEventListener(
          "click",
          (event) => {

            event.stopPropagation();

            document
              .querySelectorAll(
                ".staff-role-dropdown.open"
              )
              .forEach((otherDropdown) => {
                if (otherDropdown !== dropdown) {
                  otherDropdown.classList.remove("open");

                  otherDropdown
                    .querySelector(".staff-role-trigger")
                    ?.setAttribute(
                      "aria-expanded",
                      "false"
                    );
                }
              });

            const isOpen =
              dropdown.classList.toggle("open");

            trigger.setAttribute(
              "aria-expanded",
              String(isOpen)
            );
          }
        );

        menu
          .querySelectorAll(
            ".staff-role-option"
          )
          .forEach((option) => {

            option.addEventListener(
              "click",
              async (event) => {

                event.stopPropagation();

                const staffUid =
                  dropdown.dataset.staffUid;

                const staffName =
                  dropdown.dataset.staffName ||
                  "院所成員";

                const originalRole =
                  dropdown.dataset.originalRole;

                const nextRole =
                  option.dataset.role;

                if (
                  !staffUid ||
                  !nextRole ||
                  nextRole === originalRole
                ) {
                  dropdown.classList.remove("open");

                  trigger.setAttribute(
                    "aria-expanded",
                    "false"
                  );

                  return;
                }

                dropdown.classList.remove("open");

                trigger.setAttribute(
                  "aria-expanded",
                  "false"
                );

                trigger.disabled = true;

                const success =
                  await window
                    .InneraClinicStaffActions
                    .updateClinicStaffRole(
                      staffUid,
                      staffName,
                      nextRole
                    );

                if (!success) {
                  trigger.disabled = false;
                }
              }
            );
          });
        });

document.addEventListener(
  "click",
  () => {
    document
      .querySelectorAll(
        ".staff-role-dropdown.open"
      )
      .forEach((dropdown) => {
        dropdown.classList.remove("open");

        dropdown
          .querySelector(".staff-role-trigger")
          ?.setAttribute(
            "aria-expanded",
            "false"
          );
      });
  }
);
  }

  async function loadClinicStaff() {
    const currentStaff = Core.getCurrentStaff();
    if (!currentStaff) throw new Error("尚未取得登入者院所資料");

    const canManageStaff = isClinicAdmin(currentStaff);

    const addStaffButton = document.getElementById("addClinicStaffButton");

    if (addStaffButton) {
      addStaffButton.classList.toggle("hidden", !canManageStaff);
    }

    const clinicId = currentStaff.clinicId;
    if (!clinicId) throw new Error("目前帳號沒有 clinicId");

    const loading = document.getElementById("clinicStaffLoading");
    const clinicName = document.getElementById("managementClinicName");
    const subtitle = document.getElementById("clinicManagementSubtitle");

    loading?.classList.remove("hidden");
    if (clinicName) clinicName.textContent = currentStaff.clinicName || clinicId;
    if (subtitle) {
      subtitle.textContent = currentStaff.clinicName
        ? `${currentStaff.clinicName}的院所成員與帳號資料`
        : "院所成員與帳號資料";
    }

    try {
      const snapshot = await Core.getDb()
        .collection("clinicStaff")
        .where("clinicId", "==", clinicId)
        .get();

      const staffList = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }));

      staffList.sort((a, b) => {
  const aActive = isStaffActive(a);
  const bActive = isStaffActive(b);

  if (aActive && !bActive) return -1;
  if (!aActive && bActive) return 1;

  return String(
    a.name ||
    a.displayName ||
    a.email ||
    ""
  ).localeCompare(
    String(
      b.name ||
      b.displayName ||
      b.email ||
      ""
    ),
    "zh-Hant"
  );
});

      renderStaffList(staffList);
      console.info(`[Innera] 院所成員載入成功：${staffList.length} 人`);
    } catch (error) {
      console.error("[Innera] 院所成員載入失敗", error);
      const list = document.getElementById("clinicStaffList");
      if (list) {
        list.innerHTML = `<div class="clinic-staff-error">無法讀取院所成員資料</div>`;
      }
    } finally {
      loading?.classList.add("hidden");
    }
  }

  window.InneraClinicStaff = {
    load: loadClinicStaff,
    render: renderStaffList
  };
})();
