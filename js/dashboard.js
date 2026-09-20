

function renderPatients() {
  const patientList = document.getElementById("patientList");
  if (!patientList) return;

  patientList.innerHTML = "";

  const sortedPatients = [...patients].sort((a, b) => {
    const queueA = Number.isFinite(Number(a.queueNumber))
      ? Number(a.queueNumber)
      : Number.MAX_SAFE_INTEGER;
    const queueB = Number.isFinite(Number(b.queueNumber))
      ? Number(b.queueNumber)
      : Number.MAX_SAFE_INTEGER;

    return queueA - queueB;
  });

  sortedPatients.forEach((patient) => {
    const row = document.createElement("article");

    row.className = patient.attention
      ? "patient-row highlight"
      : "patient-row";

    row.dataset.name = patient.fullName;
    row.dataset.code = patient.id;
    row.dataset.linked = patient.linked;
    row.dataset.attention = patient.attention;
    row.dataset.viewed = patient.viewed;

    const displayName = maskPatientName(patient.fullName);

    if (patient.linked) {
      const domainStatuses = Object.values(patient.aiSummary?.domains || {})
        .map((domain) => typeof domain?.status === "string" ? domain.status.trim() : "")
        .map((status) => status.replace(/^[\s↑↓↗↘→↔⚠⚠️•·:：-]+/u, "").trim())
        .filter((status) => status && status !== "資料不足");
      const changedStatuses = domainStatuses.filter((status) => !status.includes("穩定"));
      const displayStatus = patient.attention === true
        ? "需要留意"
        : changedStatuses.length
          ? "近期有變化"
          : domainStatuses.length ? "相對穩定" : "資料不足";

      const changeHtml = patient.changes
        .map((change) => {
          const typeClass = change.type ? ` ${change.type}` : "";

          return `
            <span class="change-item${typeClass}">
              ${change.text}
            </span>
          `;
        })
        .join("");

      row.innerHTML = `
        <div class="patient-info">
          <div class="patient-avatar">${patient.fullName[0]}</div>

          <div class="patient-content">
            <div class="patient-title">
              <span class="patient-name">${displayName}</span>
              <span class="queue-number">${patient.queueNumber}號</span>
            </div>

            <span class="patient-meta">
              下午診・${patient.registrationTime} 掛號・${patient.visitType}
            </span>
          </div>
        </div>

        <div>
          <span class="mood-status ${patient.statusType}">
            ${displayStatus}
          </span>
        </div>

        <div class="metric-block">
          <strong>
            ${patient.currentMoodCompact || patient.currentMood || "—"}
          </strong>
          <span>
            ${patient.currentMood ? "最新快速紀錄" : "尚無情緒紀錄"}
          </span>
        </div>

        <div class="metric-block">
          <strong>${patient.sleep}</strong>
          <span>${patient.sleepSub}</span>
        </div>

        <div class="change-list">${changeHtml}</div>

        <div class="updated-time">${patient.updated}</div>

        <div class="row-action">
          <a href="#" class="view-button">查看近況 →</a>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="patient-info">
          <div class="patient-avatar">${patient.fullName[0]}</div>

          <div class="patient-content">
            <div class="patient-title">
              <span class="patient-name">${displayName}</span>
              <span class="queue-number">${patient.queueNumber}號</span>
            </div>

            <span class="patient-meta">
              下午診・${patient.registrationTime} 掛號・${patient.visitType}
            </span>
          </div>
        </div>

        <div><span class="not-linked">尚未連結</span></div>
        <div class="empty-value">—</div>
        <div class="empty-value">—</div>
        <div class="empty-value">無心域資料</div>
        <div class="empty-value">—</div>

        <div class="row-action">
          <a href="#" class="connect-button">邀請連結</a>
        </div>
      `;
    }

    patientList.appendChild(row);
  });
}

function updateCounts() {
  const total = patients.length;
  const linked = patients.filter((patient) => patient.linked).length;
  const attention = patients.filter((patient) => patient.attention).length;
  const unread = patients.filter(
    (patient) => patient.linked && !patient.viewed
  ).length;

  const allCount = document.getElementById("filterAllCount");
  const linkedCount = document.getElementById("filterLinkedCount");
  const attentionCount = document.getElementById("filterAttentionCount");

  if (allCount) allCount.textContent = total;
  if (linkedCount) linkedCount.textContent = linked;
  if (attentionCount) attentionCount.textContent = attention;

  const summaryNumbers = document.querySelectorAll(".summary-number");

  if (summaryNumbers[0]) summaryNumbers[0].textContent = total;
  if (summaryNumbers[1]) summaryNumbers[1].textContent = linked;
  if (summaryNumbers[2]) summaryNumbers[2].textContent = attention;
  if (summaryNumbers[3]) summaryNumbers[3].textContent = unread;
}

function filterPatients() {
  const searchInput = document.querySelector(".search-box input");
  const keyword = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  document.querySelectorAll(".patient-row").forEach((row) => {
    const name = row.dataset.name || "";
    const code = row.dataset.code || "";
    const linked = row.dataset.linked || "false";
    const attention = row.dataset.attention || "false";
    const viewed = row.dataset.viewed || "false";

    const matchesSearch =
      name.toLowerCase().includes(keyword) ||
      code.toLowerCase().includes(keyword);

    let matchesFilter = true;

    if (state.currentFilter === "linked") {
      matchesFilter = linked === "true";
    }

    if (state.currentFilter === "attention") {
      matchesFilter = attention === "true";
    }

    if (state.currentFilter === "unread") {
      matchesFilter = linked === "true" && viewed !== "true";
    }

    row.style.display =
      matchesSearch && matchesFilter
        ? "grid"
        : "none";
  });
}

function setFilter(filter) {
  state.currentFilter = filter;

  document.querySelectorAll(".filter-tab").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filter === filter
    );
  });

  filterPatients();

  document.querySelector(".patients-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function initDashboard() {
  renderPatients();
  updateCounts();

  document.querySelector(".search-box input")
    ?.addEventListener("input", filterPatients);

  document.querySelectorAll(".filter-tab").forEach((button) => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter || "all");
    });
  });

  document.querySelectorAll(".clickable-summary").forEach((card) => {
    const activate = () => {
      setFilter(card.dataset.summaryFilter || "all");
    };

    card.addEventListener("click", activate);

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });

      item.classList.add("active");

      if (item.dataset.navFilter) {
        // Sidebar 的 Dashboard 類項目被點擊時，先離開其他頁面。
        window.InneraClinicManagement?.hide();
        document.getElementById("patientDetailPage")?.classList.add("hidden");
        document.getElementById("dashboardMain")?.classList.remove("hidden");

        setFilter(item.dataset.navFilter);
      }
    });
  });
}
