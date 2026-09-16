const patientList =
  document.getElementById(
    "patientList"
  );


function renderPatients() {

  patientList.innerHTML = "";


  patients.forEach((patient) => {

    const row =
      document.createElement(
        "article"
      );


    row.className =
      patient.attention
        ? "patient-row highlight"
        : "patient-row";


    row.dataset.name =
      patient.fullName;

    row.dataset.code =
      patient.id;

    row.dataset.linked =
      patient.linked;

    row.dataset.attention =
      patient.attention;

    row.dataset.viewed =
      patient.viewed;


    const displayName =
      maskPatientName(
        patient.fullName
      );


    if (patient.linked) {

      const changeHtml =
        patient.changes
          .map((change) => {

            const typeClass =
              change.type
                ? ` ${change.type}`
                : "";

            return `
              <span
                class="change-item${typeClass}"
              >
                ${change.text}
              </span>
            `;

          })
          .join("");


      row.innerHTML = `

        <div class="patient-info">

          <div class="patient-avatar">
            ${patient.fullName[0]}
          </div>

          <div class="patient-content">

            <div class="patient-title">

              <span class="patient-name">
                ${displayName}
              </span>

              <span class="queue-number">
                ${patient.queueNumber}號
              </span>

            </div>

            <span class="patient-meta">
              下午診・
              ${patient.registrationTime}
              掛號・
              ${patient.visitType}
            </span>

          </div>

        </div>


        <div>

          <span
            class="mood-status
              ${patient.statusType}"
          >
            ${patient.status}
          </span>

        </div>


        <div class="metric-block">

          <strong>
            ${patient.mood}
          </strong>

          <span>
            ${patient.moodSub}
          </span>

        </div>


        <div class="metric-block">

          <strong>
            ${patient.sleep}
          </strong>

          <span>
            ${patient.sleepSub}
          </span>

        </div>


        <div class="change-list">

          ${changeHtml}

        </div>


        <div class="updated-time">
          ${patient.updated}
        </div>


        <div class="row-action">

          <a
            href="#"
            class="view-button"
          >
            查看近況 →
          </a>

        </div>
      `;

    } else {

      row.innerHTML = `

        <div class="patient-info">

          <div class="patient-avatar">
            ${patient.fullName[0]}
          </div>

          <div class="patient-content">

            <div class="patient-title">

              <span class="patient-name">
                ${displayName}
              </span>

              <span class="queue-number">
                ${patient.queueNumber}號
              </span>

            </div>

            <span class="patient-meta">
              下午診・
              ${patient.registrationTime}
              掛號・
              ${patient.visitType}
            </span>

          </div>

        </div>


        <div>
          <span class="not-linked">
            尚未連結
          </span>
        </div>


        <div class="empty-value">
          —
        </div>

        <div class="empty-value">
          —
        </div>

        <div class="empty-value">
          無心域資料
        </div>

        <div class="empty-value">
          —
        </div>


        <div class="row-action">

          <a
            href="#"
            class="connect-button"
          >
            邀請連結
          </a>

        </div>
      `;

    }


    patientList.appendChild(row);

  });

}


renderPatients();
updateCounts();

function updateCounts() {
  const total = patients.length;

  const linked = patients.filter(
    patient => patient.linked
  ).length;

  const attention = patients.filter(
    patient => patient.attention
  ).length;

  const unread = patients.filter(
    patient => patient.linked && !patient.viewed
  ).length;


  document.getElementById(
    "filterAllCount"
  ).textContent = total;

  document.getElementById(
    "filterLinkedCount"
  ).textContent = linked;

  document.getElementById(
    "filterAttentionCount"
  ).textContent = attention;


  /* 如果上面四張卡片也要一起更新 */

  const summaryNumbers =
    document.querySelectorAll(
      ".summary-number"
    );

  if (summaryNumbers[0]) {
    summaryNumbers[0].textContent = total;
  }

  if (summaryNumbers[1]) {
    summaryNumbers[1].textContent = linked;
  }

  if (summaryNumbers[2]) {
    summaryNumbers[2].textContent = attention;
  }

  if (summaryNumbers[3]) {
    summaryNumbers[3].textContent = unread;
  }
}

/* =========================
   基本元素
========================= */

const searchInput =
  document.querySelector(".search-box input");

const filterButtons =
  document.querySelectorAll(".filter-tab");



const navItems =
  document.querySelectorAll(".nav-item");

const addPatientButton =
  document.querySelector(".secondary-button");


let currentFilter = "all";



/* =========================
   搜尋 + 篩選
========================= */

function filterPatients() {

  const keyword = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const patientRows =
  document.querySelectorAll(".patient-row");

patientRows.forEach((row) => {
    const name =
      row.dataset.name || "";

    const code =
      row.dataset.code || "";

    const linked =
      row.dataset.linked || "false";

    const attention =
      row.dataset.attention || "false";

    const viewed =
      row.dataset.viewed || "false";

    const matchesSearch =
      name.toLowerCase().includes(keyword) ||
      code.toLowerCase().includes(keyword);


    let matchesFilter = true;


    if (currentFilter === "linked") {
      matchesFilter =
        linked === "true";
    }


    if (currentFilter === "attention") {
      matchesFilter =
        attention === "true";
    }

    if (currentFilter === "unread") {
        matchesFilter =
          viewed !== "true";
    }

    if (
      matchesSearch &&
      matchesFilter
    ) {
      row.style.display = "grid";
    } else {
      row.style.display = "none";
    }

  });

}



if (searchInput) {

  searchInput.addEventListener(
    "input",
    filterPatients
  );

}



filterButtons.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      setFilter(
        button.dataset.filter || "all"
      );

    }
  );

});

function setFilter(filter) {

  currentFilter = filter;


  /* 同步上方篩選按鈕 */

  filterButtons.forEach((button) => {

    if (button.dataset.filter === filter) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

  });


  filterPatients();


  /* 自動滑到個案列表 */

  const patientsSection =
    document.querySelector(".patients-section");

  if (patientsSection) {

    patientsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}

const summaryCards =
  document.querySelectorAll(
    ".clickable-summary"
  );


summaryCards.forEach((card) => {

  card.addEventListener(
    "click",
    () => {

      const filter =
        card.dataset.summaryFilter;

      setFilter(filter);

    }
  );


  /* 支援鍵盤 Enter */

  card.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        setFilter(
          card.dataset.summaryFilter
        );

      }

    }
  );

});

/* =========================
   Sidebar active
========================= */

navItems.forEach((item) => {

  item.addEventListener(
    "click",
    (event) => {

      event.preventDefault();


      navItems.forEach((nav) => {
        nav.classList.remove("active");
      });


      item.classList.add("active");


      const filter =
        item.dataset.navFilter;


      if (filter) {
        setFilter(filter);
      }

    }
  );

});



/* =========================
   Drawer
========================= */

const patientDrawer =
  document.getElementById(
    "patientDrawer"
  );

const drawerOverlay =
  document.getElementById(
    "drawerOverlay"
  );

const closeDrawerButton =
  document.getElementById(
    "closeDrawer"
  );

const closeDrawerBottom =
  document.getElementById(
    "closeDrawerBottom"
  );


function openDrawer(row) {

  const name =
    row.dataset.name || "個案";

  document.getElementById(
    "drawerPatientName"
  ).textContent = name;


  const meta =
    row.querySelector(
      ".patient-meta"
    );

  if (meta) {
    document.getElementById(
      "drawerPatientMeta"
    ).textContent =
      meta.textContent.trim();
  }


  const status =
    row.querySelector(
      ".mood-status"
    );

  if (status) {
    document.getElementById(
      "drawerStatus"
    ).textContent =
      status.textContent.trim();
  }


  const metrics =
    row.querySelectorAll(
      ".metric-block"
    );


  if (metrics[0]) {

    const strong =
      metrics[0].querySelector(
        "strong"
      );

    const span =
      metrics[0].querySelector(
        "span"
      );

    document.getElementById(
      "drawerMood"
    ).textContent =
      strong
        ? strong.textContent
        : "-";

    document.getElementById(
      "drawerMoodSub"
    ).textContent =
      span
        ? span.textContent
        : "";

  }


  if (metrics[1]) {

    const strong =
      metrics[1].querySelector(
        "strong"
      );

    const span =
      metrics[1].querySelector(
        "span"
      );

    document.getElementById(
      "drawerSleep"
    ).textContent =
      strong
        ? strong.textContent
        : "-";

    document.getElementById(
      "drawerSleepSub"
    ).textContent =
      span
        ? span.textContent
        : "";

  }


  const changes =
    row.querySelectorAll(
      ".change-item"
    );

  const drawerChanges =
    document.getElementById(
      "drawerChanges"
    );

  drawerChanges.innerHTML = "";


  changes.forEach((change) => {

    const tag =
      document.createElement(
        "span"
      );

    tag.className =
      "drawer-tag";

    tag.textContent =
      change.textContent.trim();

    drawerChanges.appendChild(tag);

  });


  patientDrawer.classList.add(
    "show"
  );

  drawerOverlay.classList.add(
    "show"
  );

}



function closeDrawer() {

  patientDrawer.classList.remove(
    "show"
  );

  drawerOverlay.classList.remove(
    "show"
  );

}



document.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        ".view-button"
      );

    if (!button) {
      return;
    }

    event.preventDefault();

    const row =
      button.closest(
        ".patient-row"
      );

    openDrawer(row);

  }
);



closeDrawerButton.addEventListener(
  "click",
  closeDrawer
);


closeDrawerBottom.addEventListener(
  "click",
  closeDrawer
);


drawerOverlay.addEventListener(
  "click",
  closeDrawer
);



/* =========================
   Add Patient Modal
========================= */

const addPatientModal =
  document.getElementById(
    "addPatientModal"
  );

const closeAddPatientModal =
  document.getElementById(
    "closeAddPatientModal"
  );

const cancelAddPatient =
  document.getElementById(
    "cancelAddPatient"
  );

const addPatientForm =
  document.getElementById(
    "addPatientForm"
  );


function openAddPatientModal() {

  addPatientModal.classList.add(
    "show"
  );

}


function closeAddModal() {

  addPatientModal.classList.remove(
    "show"
  );

}



if (addPatientButton) {

  addPatientButton.addEventListener(
    "click",
    openAddPatientModal
  );

}


closeAddPatientModal.addEventListener(
  "click",
  closeAddModal
);


cancelAddPatient.addEventListener(
  "click",
  closeAddModal
);


addPatientModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      addPatientModal
    ) {
      closeAddModal();
    }

  }
);



/* =========================
   姓名遮罩
========================= */

function maskPatientName(fullName) {
  const name = fullName.trim();

  if (name.length === 0) {
    return "";
  }

  if (name.length === 1) {
    return name;
  }

  if (name.length === 2) {
    return name[0] + "○";
  }

  return name[0] + "○" + name[name.length - 1];
}


/* =========================
   新增個案
========================= */

addPatientForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const fullName =
      document
        .getElementById("newPatientName")
        .value
        .trim();


    const queueNumber =
      document
        .getElementById("newQueueNumber")
        .value
        .trim();


    const visitType =
      document
        .getElementById("newVisitType")
        .value;


    if (!fullName || !queueNumber) {
      showToast("請完整填寫個案資料");
      return;
    }


    const now = new Date();

    const hour =
      String(now.getHours())
        .padStart(2, "0");

    const minute =
      String(now.getMinutes())
        .padStart(2, "0");


    const registrationTime =
      `${hour}:${minute}`;


    const newPatient = {

      id:
        `P${String(
          patients.length + 1
        ).padStart(3, "0")}`,

      fullName: fullName,

      queueNumber:
        Number(queueNumber),

      registrationTime:
        registrationTime,

      visitType:
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
    };


    /* 加入資料來源 */
    patients.push(newPatient);


    /* 重新生成畫面 */
    renderPatients();


    /* 更新所有人數 */
    updateCounts();


    /* 保持目前篩選 */
    filterPatients();


    closeAddModal();

    addPatientForm.reset();


    showToast(
      `${maskPatientName(fullName)} 已新增`
    );

  }
);

/* =========================
   Invite Modal
========================= */

const inviteModal =
  document.getElementById(
    "inviteModal"
  );

const invitePatientName =
  document.getElementById(
    "invitePatientName"
  );

const inviteCode =
  document.getElementById(
    "inviteCode"
  );


document.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        ".connect-button"
      );

    if (!button) {
      return;
    }

    event.preventDefault();


    const row =
      button.closest(
        ".patient-row"
      );


    invitePatientName.textContent =
      maskPatientName(
        row.dataset.name || "個案"
      );


    inviteCode.textContent =
      "--";


    inviteModal.classList.add(
      "show"
    );
  });



function closeInviteModal() {

  inviteModal.classList.remove(
    "show"
  );

}



document
  .getElementById(
    "closeInviteModal"
  )
  .addEventListener(
    "click",
    closeInviteModal
  );


document
  .getElementById(
    "cancelInvite"
  )
  .addEventListener(
    "click",
    closeInviteModal
  );



document
  .getElementById(
    "generateInviteCode"
  )
  .addEventListener(
    "click",
    () => {

      const code =
        Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

      inviteCode.textContent =
        code;

      showToast(
        "連結代碼已產生"
      );

    }
  );



inviteModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      inviteModal
    ) {
      closeInviteModal();
    }

  }
);



/* =========================
   Toast
========================= */

const toast =
  document.getElementById(
    "toast"
  );

let toastTimer;


function showToast(message) {

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2200);

}