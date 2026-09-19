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
                ${roleLabel(staff)}
              </span>
              <span class="staff-meta-item">
                <i class="bi bi-hospital"></i>
                ${department}
              </span>
              <span class="staff-status ${statusClass}">
                ${statusLabel(staff)}
              </span>
            </div>
            ${canManageStaff ? (
  !isStaffActive(staff) ? `
    <button
      type="button"
      class="staff-enable-button"
      data-staff-uid="${staff.uid}"
      data-staff-name="${name}">
      啟用
    </button>
  ` : `
    <button
      type="button"
      class="staff-disable-button"
      data-staff-uid="${staff.uid}"
      data-staff-name="${name}">
      停用
    </button>
  `
) : ""}
          </div>
        </article>
      `;
    }).join("");
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
