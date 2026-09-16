




const recordHeaders = {
  daily: ["日期", "情緒", "睡眠", "能量", "症狀", "備註"],
  symptoms: ["症狀", "程度", "近期變化"],
  sleep: ["日期", "入睡", "起床", "總睡眠", "主觀品質"],
  medications: ["藥物", "劑量", "時間", "狀態", "主觀回報"]
};

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

  document.getElementById("detailMedicationList").innerHTML =
    (patient.medications || [])
      .map(
        (med) => `
          <div class="detail-medication-item">
            <strong>${med.name}</strong>
            <span>${med.detail}</span>
          </div>
        `
      )
      .join("") ||
    `<p class="empty-detail">目前沒有用藥資料</p>`;

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

  if (!trend || !trend.dates?.length) {
    target.innerHTML =
      `<p class="empty-detail">目前沒有趨勢資料</p>`;
    return;
  }

  const width = 760;
  const height = 250;
  const left = 42;
  const right = 24;
  const top = 18;
  const bottom = 40;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const x = (index) =>
    left + (plotW * index) /
      Math.max(1, trend.dates.length - 1);

  const y = (value) =>
    top + plotH - ((value - 1) / 4) * plotH;

  const points = (values = []) =>
    values
      .map((value, index) => `${x(index)},${y(value)}`)
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
          x="${left - 14}"
          y="${y(value) + 4}"
          text-anchor="middle"
          font-size="11"
          fill="#8e99aa"
        >${value}</text>
      `
    )
    .join("");

  const xLabels = trend.dates
    .map(
      (date, index) => `
        <text
          x="${x(index)}"
          y="${height - 12}"
          text-anchor="middle"
          font-size="11"
          fill="#8e99aa"
        >${date}</text>
      `
    )
    .join("");

  target.innerHTML = `
    <svg
      class="detail-trend-svg"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="近七日趨勢圖"
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
        stroke="#d0a04d"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        points="${points(trend.sleep)}"
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
