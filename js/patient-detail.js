const recordHeaders = {
  daily: ["日期", "情緒", "睡眠", "能量", "症狀", "備註"],
  symptoms: ["症狀", "程度", "近期變化"],
  sleep: ["日期", "入睡", "起床", "總睡眠", "主觀品質"],
  medications: ["藥物", "劑量", "時間", "狀態", "主觀回報"]
};

let medicationListExpanded = false;

function escapeMedicationText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showDashboard() {
  document.getElementById("dashboardMain")?.classList.remove("hidden");
  document.getElementById("patientDetailPage")?.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPatientDetail(patient) {
  if (!patient || !patient.linked) {
    showToast("此個案尚未連結心域");
    return;
  }

  state.activePatientId = patient.id;
  state.activeRecordTab = "daily";
  medicationListExpanded = false;

  renderPatientDetail(patient);

  document.getElementById("dashboardMain")?.classList.add("hidden");
  document.getElementById("patientDetailPage")?.classList.remove("hidden");

  closeDrawer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPatientDetail(patient) {
  const displayName = maskPatientName(patient.fullName);

  document.getElementById("detailAvatar").textContent =
    patient.fullName[0] || "個";

  document.getElementById("detailPatientName").textContent =
    displayName;

  document.getElementById("detailQueue").textContent =
    `${patient.queueNumber}號`;

  document.getElementById("detailPatientMeta").textContent =
    `下午診・${patient.registrationTime} 掛號・${patient.visitType}・${patient.id}`;

  document.getElementById("detailSummaryLevel").textContent =
    patient.summaryLevel ||
    (patient.attention ? "需要留意" : "相對穩定");

  document.getElementById("detailSummaryText").textContent =
    patient.summary || "目前沒有摘要資料。";

  const tags = [
    patient.status,
    ...(patient.changes || []).map((change) => change.text)
  ].filter(Boolean);

  document.getElementById("detailHeaderTags").innerHTML =
    tags.map((tag) => `<span>${tag}</span>`).join("");

  document.getElementById("detailChangeGrid").innerHTML =
    [
      { label: "目前情緒", value: patient.mood || "—" },
      { label: "平均睡眠", value: patient.sleep || "—" },
      {
        label: "近期變化",
        value: patient.changes?.[0]?.text || "無明顯變化"
      }
    ]
      .map(
        (item) => `
          <div class="detail-change-item">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `
      )
      .join("");

  const quick = patient.quick || {};

  document.getElementById("detailAvgMood").textContent =
    quick.mood || patient.mood || "—";

  document.getElementById("detailAvgSleep").textContent =
    quick.sleep || patient.sleep || "—";

  document.getElementById("detailAvgEnergy").textContent =
    quick.energy || "—";

  document.getElementById("detailRecordDays").textContent =
    quick.days || "—";

  const medications = Array.isArray(patient.medications) ? patient.medications : [];
  const visibleMedications = medicationListExpanded
    ? medications
    : medications.slice(0, 4);
  const medicationList = document.getElementById("detailMedicationList");
  medicationList.innerHTML = visibleMedications.map((med) => {
    const genericName = String(med?.genericName ?? "").trim();
    const name = String(med?.name ?? "").trim();
    const primaryName = genericName || name || "未命名藥物";
    const secondaryName = genericName && name && name !== genericName
      ? `<span class="detail-medication-name">${escapeMedicationText(name)}</span>`
      : "";
    return `
      <div class="detail-medication-item">
        <strong class="detail-medication-generic">${escapeMedicationText(primaryName)}</strong>
        ${secondaryName}
        <span class="detail-medication-detail">${escapeMedicationText(med?.detail || "—")}</span>
      </div>
    `;
  }).join("") || `<p class="empty-detail">目前沒有用藥資料</p>`;

  if (medications.length > 4) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "detail-medication-toggle";
    toggle.textContent = medicationListExpanded
      ? "收合"
      : `查看全部 ${medications.length} 筆`;
    toggle.addEventListener("click", () => {
      medicationListExpanded = !medicationListExpanded;
      renderPatientDetail(patient);
    });
    medicationList.appendChild(toggle);
  }

  document.getElementById("detailLastVisit").textContent =
    patient.lastVisit || "目前沒有上次回診摘要。";

  document.getElementById("detailEventTimeline").innerHTML =
    (patient.events || []).length
      ? patient.events
          .map(
            (event) => `
              <div class="timeline-item">
                <div class="timeline-date">${event.date}</div>
                <div class="timeline-axis"></div>
                <div class="timeline-content">
                  <strong>${event.title}</strong>
                  <p>${event.text}</p>
                </div>
              </div>
            `
          )
          .join("")
      : `
        <div class="empty-detail-block">
          <strong>近期沒有重大事件紀錄</strong>
          <p>目前資料中沒有需要特別標記的事件。</p>
        </div>
      `;

  renderDetailTrend(patient.trend);
  renderRecordTab(patient);
  updateViewedButton(patient);
}

function renderDetailTrend(trend) {
  const target = document.getElementById("detailTrendChart");

  if (!target) return;

  if (!trend) {
    target.innerHTML =
      `<p class="empty-detail">目前沒有趨勢資料</p>`;
    return;
  }

  const width = 760;
  const height = 230;

  const left = 48;
  const right = 24;
  const top = 18;
  const bottom = 40;

  const plotW = width - left - right;
  const plotH = height - top - bottom;


  /* =====================================
     共用 X 軸
  ===================================== */

  function createX(dates) {
    return (index) =>
      left +
      (plotW * index) /
        Math.max(1, dates.length - 1);
  }


  /* =====================================
     第一張：情緒 + 能量
     Y 軸固定 1～5
  ===================================== */

  function renderStateChart() {
    const dates = trend.dates || [];

    if (!dates.length) {
      return `
        <p class="empty-detail">
          目前沒有情緒與能量趨勢
        </p>
      `;
    }

    const x = createX(dates);

    const y = (value) =>
      top +
      plotH -
      ((value - 1) / 4) * plotH;

    const points = (values = []) =>
      values
        .slice(0, dates.length)
        .map((value, index) => {
          if (typeof value !== "number") return null;

          return `${x(index)},${y(value)}`;
        })
        .filter(Boolean)
        .join(" ");

    const horizontalLines = [1, 2, 3, 4, 5]
      .map(
        (value) => `
          <line
            x1="${left}"
            y1="${y(value)}"
            x2="${width - right}"
            y2="${y(value)}"
            stroke="#e6eaf0"
            stroke-width="1"
          />

          <text
            x="${left - 16}"
            y="${y(value) + 4}"
            text-anchor="middle"
            font-size="11"
            fill="#8e99aa"
          >
            ${value}
          </text>
        `
      )
      .join("");

    const xLabels = dates
      .map(
        (date, index) => `
          <text
            x="${x(index)}"
            y="${height - 12}"
            text-anchor="middle"
            font-size="11"
            fill="#8e99aa"
          >
            ${date}
          </text>
        `
      )
      .join("");

    return `
      <div class="detail-subtrend">

        <div class="detail-subtrend-header">
          <div>
            <strong>情緒與能量</strong>
            <span>1～5 分</span>
          </div>

          <div class="detail-subtrend-legend">
            <span>
              <i style="background:#4f76b8"></i>
              情緒
            </span>

            <span>
              <i style="background:#73988c"></i>
              能量
            </span>
          </div>
        </div>

        <svg
          class="detail-trend-svg"
          viewBox="0 0 ${width} ${height}"
          role="img"
          aria-label="近七日情緒與能量趨勢"
        >

          ${horizontalLines}
          ${xLabels}

          <polyline
            fill="none"
            stroke="#4f76b8"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="${points(trend.mood)}"
          />

          <polyline
            fill="none"
            stroke="#73988c"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="${points(trend.energy)}"
          />

        </svg>
      </div>
    `;
  }


  /* =====================================
     第二張：真實睡眠時數
  ===================================== */

  function renderSleepChart() {
    const dates =
      trend.sleepDates || [];

    const values =
      trend.sleepHours || [];

    if (!dates.length || !values.length) {
      return `
        <div class="detail-subtrend">
          <div class="detail-subtrend-header">
            <div>
              <strong>睡眠時數</strong>
              <span>心域 App 紀錄</span>
            </div>
          </div>

          <p class="empty-detail">
            目前沒有睡眠趨勢資料
          </p>
        </div>
      `;
    }

    const x = createX(dates);

    const numericValues =
      values.filter(
        (value) => typeof value === "number"
      );

    const maxValue =
      numericValues.length
        ? Math.max(...numericValues)
        : 12;

    // 至少顯示到 12 小時
    // 若真的超過 12，再自動擴張
    const yMax =
      Math.max(
        12,
        Math.ceil(maxValue / 2) * 2
      );

    const y = (value) =>
      top +
      plotH -
      (value / yMax) * plotH;

    const points = values
      .slice(0, dates.length)
      .map((value, index) => {
        if (typeof value !== "number") return null;

        return `${x(index)},${y(value)}`;
      })
      .filter(Boolean)
      .join(" ");

    const step = yMax / 4;

    const ticks = [
      0,
      step,
      step * 2,
      step * 3,
      yMax
    ];

    const horizontalLines = ticks
      .map(
        (value) => `
          <line
            x1="${left}"
            y1="${y(value)}"
            x2="${width - right}"
            y2="${y(value)}"
            stroke="#e6eaf0"
            stroke-width="1"
          />

          <text
            x="${left - 18}"
            y="${y(value) + 4}"
            text-anchor="middle"
            font-size="11"
            fill="#8e99aa"
          >
            ${Number(value.toFixed(1))}h
          </text>
        `
      )
      .join("");

    const xLabels = dates
      .map(
        (date, index) => `
          <text
            x="${x(index)}"
            y="${height - 12}"
            text-anchor="middle"
            font-size="11"
            fill="#8e99aa"
          >
            ${date}
          </text>
        `
      )
      .join("");

    const circles = values
      .slice(0, dates.length)
      .map((value, index) => {
        if (typeof value !== "number") return "";

        return `
          <circle
            cx="${x(index)}"
            cy="${y(value)}"
            r="4.5"
            fill="#d0a04d"
          >
            <title>
              ${dates[index]}：${value} 小時
            </title>
          </circle>
        `;
      })
      .join("");

    return `
      <div class="detail-subtrend detail-sleep-trend">

        <div class="detail-subtrend-header">
          <div>
            <strong>睡眠時數</strong>
            <span>心域 App 真實紀錄</span>
          </div>

          <div class="detail-subtrend-legend">
            <span>
              <i style="background:#d0a04d"></i>
              小時
            </span>
          </div>
        </div>

        <svg
          class="detail-trend-svg"
          viewBox="0 0 ${width} ${height}"
          role="img"
          aria-label="近七日睡眠時數趨勢"
        >

          ${horizontalLines}
          ${xLabels}

          <polyline
            fill="none"
            stroke="#d0a04d"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="${points}"
          />

          ${circles}

        </svg>

      </div>
    `;
  }


  target.innerHTML = `
    <div class="detail-trend-stack">
      ${renderStateChart()}
      ${renderSleepChart()}
    </div>
  `;
}

function renderRecordTab(patient) {
  const rows =
    patient.records?.[state.activeRecordTab] || [];

  const headers =
    recordHeaders[state.activeRecordTab] || [];

  document.querySelectorAll(".record-tab").forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.dataset.recordTab === state.activeRecordTab
    );
  });

  document.getElementById("detailRecordContent").innerHTML =
    rows.length
      ? `
        <div class="detail-table-wrap">
          <table class="detail-record-table">
            <thead>
              <tr>
                ${headers.map((header) => `<th>${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      ${row.map((cell) => `<td>${cell}</td>`).join("")}
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
      : `<p class="empty-detail">目前沒有此類紀錄</p>`;
}

function updateViewedButton(patient) {
  const button = document.getElementById("markViewedButton");
  if (!button) return;

  button.textContent =
    patient.viewed ? "已查看" : "標記已查看";

  button.classList.toggle(
    "viewed",
    patient.viewed
  );
}

function initPatientDetail() {
  document.getElementById("openFullPatient")
    ?.addEventListener("click", () => {
      const patient = patients.find(
        (item) => item.id === state.activePatientId
      );

      showPatientDetail(patient);
    });

  document.getElementById("backToDashboard")
    ?.addEventListener("click", showDashboard);

  document.getElementById("printPatientSummary")
    ?.addEventListener("click", () => window.print());

  document.querySelectorAll(".record-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeRecordTab = tab.dataset.recordTab;

      const patient = patients.find(
        (item) => item.id === state.activePatientId
      );

      if (patient) {
        renderRecordTab(patient);
      }
    });
  });

  document.getElementById("markViewedButton")
    ?.addEventListener("click", () => {
      const patient = patients.find(
        (item) => item.id === state.activePatientId
      );

      if (!patient) return;

      patient.viewed = true;

      updateViewedButton(patient);
      renderPatients();
      updateCounts();
      filterPatients();

      showToast("已標記為查看");
    });
}
