// js/clinic-management.js

(function () {

  function getDb() {
    if (!window.InneraFirebase) {
      throw new Error("InneraFirebase 尚未載入");
    }

    window.InneraFirebase.init();

    return firebase.firestore();
  }


  function getCurrentStaff() {
    return window.INNERA_CURRENT_STAFF || null;
  }


  function roleLabel(staff) {

    const roleLabels = {
      admin: "院所管理員",
      doctor: "醫師",
      nurse: "護理人員",
      staff: "行政人員"
    };

    return (
      roleLabels[staff.role] ||
      staff.role ||
      "院所人員"
    );
  }


  function statusLabel(staff) {
    return staff.active === false
      ? "已停用"
      : "啟用中";
  }


  function renderStaffList(staffList) {

    const list =
      document.getElementById(
        "clinicStaffList"
      );

    const empty =
      document.getElementById(
        "clinicStaffEmpty"
      );

    const count =
      document.getElementById(
        "managementStaffCount"
      );


    if (!list) return;


    count.textContent =
      String(staffList.length);


    if (!staffList.length) {

      list.innerHTML = "";

      empty?.classList.remove(
        "hidden"
      );

      return;
    }


    empty?.classList.add(
      "hidden"
    );


    list.innerHTML =
      staffList
        .map((staff) => {

          const name =
            staff.displayName ||
            staff.email ||
            "未命名成員";


          const avatar =
            name.charAt(0);


          const department =
            staff.department ||
            "未設定科別";


          const statusClass =
            staff.active === false
              ? "inactive"
              : "active";


 return `
  <article class="clinic-staff-card">

    <div class="clinic-staff-main">

      <div class="clinic-staff-avatar">
        ${avatar}
      </div>

      <div class="clinic-staff-info">

        <strong>
          ${name}
        </strong>

        <span>
          ${staff.email || "未設定 Email"}
        </span>

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

        <span
          class="
            staff-status
            ${statusClass}
          "
        >
          ${statusLabel(staff)}
        </span>

      </div>

      ${
  staff.active === false
    ? `
      <button
        type="button"
        class="staff-enable-button"
        data-staff-uid="${staff.uid}"
        data-staff-name="${name}"
      >
        啟用
      </button>
    `
    : `
      <button
        type="button"
        class="staff-disable-button"
        data-staff-uid="${staff.uid}"
        data-staff-name="${name}"
      >
        停用
      </button>
    `
}

    </div>

  </article>
`;
        })
        .join("");
  }


  async function loadClinicStaff() {

    const currentStaff =
      getCurrentStaff();


    if (!currentStaff) {
      throw new Error(
        "尚未取得登入者院所資料"
      );
    }


    const clinicId =
      currentStaff.clinicId;


    if (!clinicId) {
      throw new Error(
        "目前帳號沒有 clinicId"
      );
    }


    const loading =
      document.getElementById(
        "clinicStaffLoading"
      );


    const clinicName =
      document.getElementById(
        "managementClinicName"
      );


    const subtitle =
      document.getElementById(
        "clinicManagementSubtitle"
      );


    if (loading) {
      loading.classList.remove(
        "hidden"
      );
    }


    if (clinicName) {
      clinicName.textContent =
        currentStaff.clinicName ||
        clinicId;
    }


    if (subtitle) {
      subtitle.textContent =
        currentStaff.clinicName
          ? `${currentStaff.clinicName}的院所成員與帳號資料`
          : "院所成員與帳號資料";
    }


    try {

      const db = getDb();


      const snapshot =
        await db
          .collection("clinicStaff")
          .where(
            "clinicId",
            "==",
            clinicId
          )
          .get();


      const staffList =
        snapshot.docs.map(
          (doc) => ({
            uid: doc.id,
            ...doc.data()
          })
        );


      staffList.sort(
        (a, b) => {

          if (
            a.active !== false &&
            b.active === false
          ) {
            return -1;
          }

          if (
            a.active === false &&
            b.active !== false
          ) {
            return 1;
          }


          return String(
            a.displayName || ""
          ).localeCompare(
            String(
              b.displayName || ""
            ),
            "zh-Hant"
          );

        }
      );


      renderStaffList(
        staffList
      );


      console.info(
        `[Innera] 院所成員載入成功：${staffList.length} 人`
      );


    } catch (error) {

      console.error(
        "[Innera] 院所成員載入失敗",
        error
      );


      const list =
        document.getElementById(
          "clinicStaffList"
        );


      if (list) {
        list.innerHTML = `
          <div class="clinic-staff-error">
            無法讀取院所成員資料
          </div>
        `;
      }


    } finally {

      if (loading) {
        loading.classList.add(
          "hidden"
        );
      }

    }
  }


  function showClinicManagement() {

    const managementPage =
      document.getElementById(
        "clinicManagementPage"
      );


    const dashboard =
      document.getElementById(
        "dashboardMain"
      );


    const patientDetail =
      document.getElementById(
        "patientDetailPage"
      );


    if (dashboard) {
      dashboard.classList.add(
        "hidden"
      );
    }


    if (patientDetail) {
      patientDetail.classList.add(
        "hidden"
      );
    }


    if (managementPage) {
      managementPage.classList.remove(
        "hidden"
      );
    }


    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(
        (item) =>
          item.classList.remove(
            "active"
          )
      );


    const nav =
      document.getElementById(
        "clinicManagementNav"
      );


    nav?.classList.add(
      "active"
    );


    loadClinicStaff();


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function hideClinicManagement() {

    const page =
      document.getElementById(
        "clinicManagementPage"
      );

    page?.classList.add(
      "hidden"
    );

  }

function openAddStaffModal() {

  const staff =
    window.INNERA_CURRENT_STAFF;

  if (!staff) {
    return;
  }


  if (staff.role !== "admin") {

    if (typeof showToast === "function") {
      showToast(
        "只有院所管理員可以新增成員"
      );
    }

    return;
  }


  document
    .getElementById(
      "addClinicStaffModal"
    )
    ?.classList.add("show");
}


function closeAddStaffModal() {

  document
    .getElementById(
      "addClinicStaffModal"
    )
    ?.classList.remove("show");

}


function setAddStaffLoading(loading) {

  const button =
    document.getElementById(
      "submitAddClinicStaff"
    );


  if (!button) return;


  button.disabled =
    loading;


  button.textContent =
    loading
      ? "建立中..."
      : "建立帳號";
}


async function createClinicStaff(event) {

  event.preventDefault();


  const displayName =
    document
      .getElementById(
        "newStaffName"
      )
      .value
      .trim();


  const email =
    document
      .getElementById(
        "newStaffEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "newStaffPassword"
      )
      .value;


  const role =
    document
      .getElementById(
        "newStaffRole"
      )
      .value;


  const department =
    document
      .getElementById(
        "newStaffDepartment"
      )
      .value
      .trim();


  if (
    !displayName ||
    !email ||
    !password
  ) {

    if (typeof showToast === "function") {
      showToast(
        "請填寫姓名、Email 與密碼"
      );
    }

    return;
  }


  setAddStaffLoading(true);


  try {

    const functions =
  firebase
    .app()
    .functions("us-central1");


    const createStaff =
      functions.httpsCallable(
        "createClinicStaff"
      );


    const result =
      await createStaff({
        displayName,
        email,
        password,
        role,
        department
      });


    console.info(
      "[Innera] 新增院所成員成功",
      result.data
    );


    closeAddStaffModal();


    document
      .getElementById(
        "addClinicStaffForm"
      )
      ?.reset();


    if (typeof showToast === "function") {
      showToast(
        `${displayName} 已建立`
      );
    }


    // 重新讀取成員列表
    await loadClinicStaff();


  } catch (error) {

    console.error(
      "[Innera] 新增院所成員失敗",
      error
    );


    let message =
      "建立院所成員失敗";


    if (
      error.code ===
      "functions/already-exists"
    ) {
      message =
        "這個 Email 已經有帳號";
    }


    if (
      error.code ===
      "functions/permission-denied"
    ) {
      message =
        "你沒有新增院所成員的權限";
    }


    if (
      typeof showToast === "function"
    ) {
      showToast(message);
    }


  } finally {

    setAddStaffLoading(false);

  }
}
async function disableClinicStaff(
  staffUid,
  staffName
) {

  const currentStaff =
    window.INNERA_CURRENT_STAFF;


  if (!currentStaff) {
    return;
  }


  if (currentStaff.role !== "admin") {

    if (typeof showToast === "function") {
      showToast(
        "只有院所管理員可以停用成員"
      );
    }

    return;
  }


  if (
    currentStaff.uid === staffUid
  ) {

    if (typeof showToast === "function") {
      showToast(
        "不能停用自己的帳號"
      );
    }

    return;
  }


  const confirmed =
    window.confirm(
      `確定要停用 ${staffName} 嗎？`
    );


  if (!confirmed) {
    return;
  }


  try {

    const functions =
      firebase
        .app()
        .functions("us-central1");


    const disableStaff =
      functions.httpsCallable(
        "disableClinicStaff"
      );


    await disableStaff({
      staffUid
    });


    if (typeof showToast === "function") {
      showToast(
        `${staffName} 已停用`
      );
    }


    await loadClinicStaff();


  } catch (error) {

    console.error(
      "[Innera] 停用院所成員失敗",
      error
    );


    let message =
      "停用院所成員失敗";


    if (
      error.code ===
      "functions/permission-denied"
    ) {
      message =
        "你沒有停用院所成員的權限";
    }


    if (
      error.code ===
      "functions/not-found"
    ) {
      message =
        "找不到這位院所成員";
    }


    if (
      typeof showToast === "function"
    ) {
      showToast(message);
    }

  }
}
async function enableClinicStaff(
  staffUid,
  staffName
) {

  const currentStaff =
    window.INNERA_CURRENT_STAFF;


  if (!currentStaff) {
    return;
  }


  if (currentStaff.role !== "admin") {

    if (typeof showToast === "function") {
      showToast(
        "只有院所管理員可以啟用成員"
      );
    }

    return;
  }


  const confirmed =
    window.confirm(
      `確定要重新啟用 ${staffName} 嗎？`
    );


  if (!confirmed) {
    return;
  }


  try {

    const functions =
      firebase
        .app()
        .functions("us-central1");


    const enableStaff =
      functions.httpsCallable(
        "enableClinicStaff"
      );


    await enableStaff({
      staffUid
    });


    if (typeof showToast === "function") {
      showToast(
        `${staffName} 已重新啟用`
      );
    }


    await loadClinicStaff();


  } catch (error) {

    console.error(
      "[Innera] 啟用院所成員失敗",
      error
    );


    let message =
      "啟用院所成員失敗";


    if (
      error.code ===
      "functions/permission-denied"
    ) {
      message =
        "你沒有啟用院所成員的權限";
    }


    if (
      error.code ===
      "functions/not-found"
    ) {
      message =
        "找不到這位院所成員";
    }


    if (
      typeof showToast === "function"
    ) {
      showToast(message);
    }

  }
}

  function initClinicManagement() {

  const nav =
    document.getElementById(
      "clinicManagementNav"
    );


  nav?.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      showClinicManagement();

    }
  );


  // 新增成員
  document
    .getElementById(
      "addClinicStaffButton"
    )
    ?.addEventListener(
      "click",
      openAddStaffModal
    );


  // 關閉新增成員 Modal
  document
    .getElementById(
      "closeAddClinicStaffModal"
    )
    ?.addEventListener(
      "click",
      closeAddStaffModal
    );


  document
    .getElementById(
      "cancelAddClinicStaff"
    )
    ?.addEventListener(
      "click",
      closeAddStaffModal
    );


  // 建立新成員
  document
    .getElementById(
      "addClinicStaffForm"
    )
    ?.addEventListener(
      "submit",
      createClinicStaff
    );


  // 點 Modal 背景關閉
  document
    .getElementById(
      "addClinicStaffModal"
    )
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target.id ===
          "addClinicStaffModal"
        ) {
          closeAddStaffModal();
        }

      }
    );


  // 成員列表：停用 / 啟用
  document
    .getElementById(
      "clinicStaffList"
    )
    ?.addEventListener(
      "click",
      (event) => {

        const disableButton =
          event.target.closest(
            ".staff-disable-button"
          );


        if (disableButton) {

          const staffUid =
            disableButton.dataset.staffUid;

          const staffName =
            disableButton.dataset.staffName ||
            "此成員";


          disableClinicStaff(
            staffUid,
            staffName
          );

          return;
        }


        const enableButton =
          event.target.closest(
            ".staff-enable-button"
          );


        if (enableButton) {

          const staffUid =
            enableButton.dataset.staffUid;

          const staffName =
            enableButton.dataset.staffName ||
            "此成員";


          enableClinicStaff(
            staffUid,
            staffName
          );

        }

      }
    );

}


window.InneraClinicManagement = {
  show: showClinicManagement,
  hide: hideClinicManagement,
  load: loadClinicStaff
};


document.addEventListener(
  "DOMContentLoaded",
  initClinicManagement
);

})();