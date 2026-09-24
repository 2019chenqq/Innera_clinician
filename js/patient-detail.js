const recordHeaders = {
  sleep: ["日期", "入睡", "起床", "總睡眠", "主觀品質"]
};

function formatDetailAverageSleep(value) {
  const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*(?:hr|h|小時)?$/i);
  return match ? `${Number(match[1]).toFixed(1)} hr` : (value || "—");
}

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


/* =====================================================
   Clinical Pattern UI
   - 先使用 patient 上的 clinicalDomains / clinicalPattern 等資料
   - 尚未串接 App 時，自動使用 Demo fallback
   - 不改動既有睡眠與藥物資料結構
===================================================== */

function escapeClinicalText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getClinicalDemoData(patient) {
  const quick = patient?.quick || {};
  const energy = quick.energy || "3.2 / 5";
  const mood = quick.mood || patient?.mood || "3.0 / 5";

  return {
    domains: {
      drive: {
        label: "Drive",
        status: "↓ 下降",
        tone: "watch",
        summary: `能量 ${energy}，活動量較近期基準下降`,
        indicators: ["能量", "活動量", "睡眠需求"]
      },
      cognition: {
        label: "Cognition",
        status: "⚠ 需確認",
        tone: "watch",
        summary: "文字紀錄提及反覆思考與專注下降",
        indicators: ["思緒速度", "專注", "反覆思考"]
      },
      mood: {
        label: "Mood",
        status: "↑ 波動增加",
        tone: "watch",
        summary: `目前情緒 ${mood}，近期焦慮感增加`,
        indicators: ["低落", "焦慮", "易怒 / 興奮"]
      },
      behavior: {
        label: "Behavior",
        status: "↓ 活動下降",
        tone: "down",
        summary: "外出與日常活動較近期減少",
        indicators: ["活動量", "外出", "日常功能"]
      }
    },
    pattern: {
      dates: ["09/13", "09/14", "09/15", "09/16", "09/17", "09/18", "09/19"],
      drive: ["→", "→", "↗", "↗", "↑", "→", "→"],
      cognition: ["穩定", "反覆思考", "專注↓", "專注↓", "思緒較多", "思緒較多", "穩定"],
      mood: ["→", "↘", "↘", "波動", "波動", "↗", "→"],
      behavior: ["→", "→", "↘", "↘", "外出↓", "活動↓", "→"]
    },
    medicationChanges: []
  };
}

function getClinicalViewModel(patient) {
  return {
    domains:
      patient?.aiSummary?.domains ||
      patient?.clinicalDomains ||
      {},

    pattern:
      patient?.clinicalPattern ||
      patient?.pattern ||
      {},

    symptoms:
      Array.isArray(patient?.symptoms)
        ? patient.symptoms
        : [],

    medicationChanges:
      Array.isArray(patient?.medicationChanges)
        ? patient.medicationChanges
        : []
  };
}

function ensureClinicalStyles() {
  if (document.getElementById("inneraClinicalStyles")) return;

  const style = document.createElement("style");
  style.id = "inneraClinicalStyles";
  style.textContent = `
    .clinical-section {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #e6eaf0;
      border-radius: 14px;
      background: #fff;
    }
    .clinical-section h3 {
      margin: 0 0 6px;
      color: #172238;
      font-size: 17px;
    }
    .clinical-section-copy {
      margin: 0 0 16px;
      color: #7a8699;
      font-size: 13px;
      line-height: 1.6;
    }
    .clinical-period-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }

    .clinical-period-heading .clinical-section-copy {
      margin-bottom: 0;
    }

    .clinical-period-badge {
      flex: 0 0 auto;
      padding: 5px 9px;
      border-radius: 999px;
      background: #eef3fb;
      color: #4f76b8;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }

    .clinical-period-summary {
      display: grid;
      gap: 0;
      border-top: 1px solid #edf0f5;
    }

    .clinical-period-row {
      display: grid;
      grid-template-columns: 100px minmax(0, 160px) minmax(0, 1fr);
      gap: 16px;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid #edf0f5;
    }

    .clinical-period-row:last-child {
      border-bottom: 0;
    }

    .clinical-period-name {
      color: #172238;
      font-size: 13px;
      font-weight: 800;
    }

    .clinical-period-status {
      justify-self: start;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 5px 9px;
      border-radius: 999px;
      background: #eef3fb;
      color: #4f76b8;
      font-size: 11px;
      font-weight: 800;
      white-space: normal;
      overflow-wrap: anywhere;
      line-height: 1.6;
    }

    .clinical-period-status.watch {
      background: #fff5df;
      color: #a66f17;
    }

    .clinical-period-status.down {
      background: #eef4f2;
      color: #547b70;
    }

    .clinical-period-status.stable {
      background: #f3f5f8;
      color: #667085;
    }

    .clinical-period-copy {
      min-width: 0;
      overflow-wrap: anywhere;
      color: #465368;
      font-size: 13px;
      line-height: 1.7;
    }

    .clinical-pattern-insight {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #f7f9fc;
      border: 1px solid #edf0f5;
    }

    .clinical-pattern-insight span {
      display: block;
      margin-bottom: 5px;
      color: #8a95a7;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .03em;
    }

    .clinical-pattern-insight strong {
      color: #2e3a54;
      font-size: 13px;
      line-height: 1.7;
      font-weight: 700;
    }

    .clinical-domain-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .clinical-domain-card {
      min-width: 0;
      padding: 15px;
      border-radius: 12px;
      background: #f7f9fc;
      border: 1px solid #edf0f5;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .clinical-domain-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .clinical-domain-name {
      font-size: 13px;
      font-weight: 800;
      color: #2e3a54;
    }
    .clinical-domain-status {
      padding: 4px 8px;
      border-radius: 999px;
      background: #eef3fb;
      color: #4f76b8;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .clinical-domain-status.watch {
      background: #fff5df;
      color: #a66f17;
    }
    .clinical-domain-status.down {
      background: #eef4f2;
      color: #547b70;
    }
    .clinical-domain-summary-label,
    .clinical-domain-indicator-label {
      display: block;
      margin-bottom: 6px;
      color: #8a95a7;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .03em;
    }

    .clinical-domain-summary {
      margin: 0;
      color: #465368;
      font-size: 13px;
      line-height: 1.65;
      min-height: 44px;
    }
    .clinical-domain-indicators {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 14px;
      padding-top: 0;
      align-content: flex-start;
    }
    .clinical-domain-indicators span {
      padding: 4px 7px;
      border-radius: 7px;
      background: #fff;
      color: #7a8699;
      font-size: 11px;
      border: 1px solid #e6eaf0;
    }

    .clinical-domain-indicators .clinical-domain-indicator-label {
      flex-basis: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      color: #8a95a7;
      font-weight: 700;
    }
    .clinical-pattern-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #f7f9fc;
      color: #667085;
      font-size: 12px;
      line-height: 1.5;
    }

    .clinical-pattern-legend strong {
      color: #2e3a54;
      font-weight: 800;
    }

    .timeline-kind {
      display: inline-block;
      margin-left: 8px;
      padding: 3px 7px;
      border-radius: 999px;
      background: #eef3fb;
      color: #4f76b8;
      font-size: 11px;
      font-weight: 700;
      vertical-align: middle;
    }

    .timeline-kind.medication {
      background: #fff5df;
      color: #a66f17;
    }

    .clinical-pattern-wrap {
      overflow-x: auto;
    }
    .clinical-pattern-table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
      font-size: 12px;
    }
    .clinical-pattern-table th,
    .clinical-pattern-table td {
      padding: 10px 9px;
      border-bottom: 1px solid #edf0f5;
      text-align: center;
      vertical-align: middle;
    }
    .clinical-pattern-table th:first-child,
    .clinical-pattern-table td:first-child {
      position: sticky;
      left: 0;
      z-index: 1;
      background: #fff;
      text-align: left;
      font-weight: 800;
      color: #2e3a54;
    }
    .clinical-pattern-table thead th {
      color: #8a95a7;
      font-weight: 700;
    }
    .clinical-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .clinical-list {
      display: grid;
      gap: 9px;
      margin-top: 12px;
    }
    .clinical-list-row {
      display: grid;
      grid-template-columns: minmax(90px, 1fr) minmax(0, 2fr);
      gap: 10px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #edf0f5;
      font-size: 13px;
    }
    .clinical-list-row:last-child { border-bottom: 0; }
    .clinical-list-name { font-weight: 700; color: #2e3a54; }
    .clinical-list-muted { color: #7a8699; }
    .clinical-med-change {
      padding: 11px 0;
      border-bottom: 1px solid #edf0f5;
    }
    .clinical-med-change:last-child { border-bottom: 0; }
    .clinical-med-change strong {
      display: block;
      color: #2e3a54;
      font-size: 13px;
    }
    .clinical-med-change span,
    .clinical-med-change p {
      margin: 3px 0 0;
      color: #7a8699;
      font-size: 12px;
      line-height: 1.55;
    }
    @media (max-width: 1100px) {
      .clinical-domain-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 700px) {
      .clinical-period-heading {
        flex-direction: column;
        gap: 8px;
      }

      .clinical-period-row {
        grid-template-columns: 1fr;
        gap: 7px;
      }

      .clinical-domain-grid,
      .clinical-detail-grid { grid-template-columns: 1fr; }
      .clinical-list-row {
        grid-template-columns: 1fr auto;
      }
      .clinical-list-row .clinical-list-muted {
        grid-column: 1 / -1;
      }
    }
  `;

  document.head.appendChild(style);
}

function ensureClinicalSections() {
  ensureClinicalStyles();

  let root = document.getElementById("clinicalDataLayer");
  if (root) return root;

  root = document.createElement("div");
  root.id = "clinicalDataLayer";
  root.innerHTML = `
    <section class="clinical-section clinical-period-section">
      <div class="clinical-period-heading">
        <div>
          <h3>期間變化</h3>
          <p class="clinical-section-copy">整合 Drive、Cognition、Mood、Behavior 與睡眠，快速掌握本次回診前的整體變化。</p>
        </div>
        <span class="clinical-period-badge">近 30 日</span>
      </div>

      <div id="clinicalPeriodSummary" class="clinical-period-summary"></div>
    </section>

    <div id="clinicalImportantEventsMount"></div>


    <section class="clinical-section">
      <h3>主要症狀</h3>
      <p class="clinical-section-copy">整理近期反覆出現或需要注意的症狀變化。</p>
      <div id="clinicalSymptoms"></div>
    </section>
  `;

  const trendTarget = document.getElementById("detailTrendChart");
  const trendCard = trendTarget?.closest(".detail-card");

  if (trendCard?.parentNode) {
    trendCard.parentNode.insertBefore(root, trendCard);
  } else {
    const detailPage = document.getElementById("patientDetailPage");
    detailPage?.appendChild(root);
  }

  // 把原本的「近期重要事件」卡移到四面向摘要後、Clinical pattern 前。
  const eventTimeline = document.getElementById("detailEventTimeline");
  const eventCard = eventTimeline?.closest(".detail-card");
  const eventMount = document.getElementById("clinicalImportantEventsMount");

  if (eventCard && eventMount && eventCard.parentNode !== eventMount) {
    eventMount.appendChild(eventCard);
  }

  return root;
}


function renderClinicalPeriodSummary(patient, clinical) {
  const target = document.getElementById("clinicalPeriodSummary");
  if (!target) return;

  const domains = clinical?.domains || {};
  const sleepText =
    formatDetailAverageSleep(patient?.quick?.sleep ?? patient?.sleep ?? "目前沒有足夠睡眠資料");

  const rows = [
    {
      name: "Drive",
      status: domains.drive?.status || "資料不足",
      tone: domains.drive?.tone || "",
      copy: domains.drive?.summary || "目前沒有足夠資料"
    },
    {
      name: "Cognition",
      status: domains.cognition?.status || "資料不足",
      tone: domains.cognition?.tone || "",
      copy: domains.cognition?.summary || "目前沒有足夠資料"
    },
    {
      name: "Mood",
      status: domains.mood?.status || "資料不足",
      tone: domains.mood?.tone || "",
      copy: domains.mood?.summary || "目前沒有足夠資料"
    },
    {
      name: "Behavior",
      status: domains.behavior?.status || "資料不足",
      tone: domains.behavior?.tone || "",
      copy: domains.behavior?.summary || "目前沒有足夠資料"
    },
    {
      name: "Sleep",
      status: domains.sleep?.status || (patient?.sleepSub?.includes("下降") ? "↓ 下降" : "近期變化"),
      tone: domains.sleep ? "" : (patient?.sleepSub?.includes("下降") ? "down" : "stable"),
      copy: domains.sleep?.summary || `平均睡眠 ${sleepText}；${patient?.sleepSub || "持續觀察近期睡眠變化"}`
    }
  ];

  const overallPattern =
    patient?.aiSummary?.patternSummary ||
    patient?.clinicalPatternSummary ||
    "睡眠、情緒、驅力與行為的變化可搭配近期重要事件一起閱讀，協助判斷是否出現同步或連續變化。";

  target.innerHTML = `
    ${rows.map((row) => `
      <div class="clinical-period-row">
        <div class="clinical-period-name">${escapeClinicalText(row.name)}</div>
        <div class="clinical-period-status ${escapeClinicalText(row.tone || "")}">
          ${escapeClinicalText(row.status)}
        </div>
        <div class="clinical-period-copy">${escapeClinicalText(row.copy)}</div>
      </div>
    `).join("")}

    <div class="clinical-pattern-insight">
      <span>整體 pattern</span>
      <strong>${escapeClinicalText(overallPattern)}</strong>
    </div>
  `;
}

function renderClinicalDomains(domains = {}) {
  const target = document.getElementById("clinicalDomainGrid");
  if (!target) return;

  const order = ["drive", "cognition", "mood", "behavior"];

  target.innerHTML = order.map((key) => {
    const item = domains[key] || {};
    const indicators = Array.isArray(item.indicators) ? item.indicators : [];

    return `
      <article class="clinical-domain-card">
        <div class="clinical-domain-top">
          <span class="clinical-domain-name">${escapeClinicalText(item.label || key)}</span>
          <span class="clinical-domain-status ${escapeClinicalText(item.tone || "")}">${escapeClinicalText(item.status || "資料不足")}</span>
        </div>
        <span class="clinical-domain-summary-label">近期摘要</span>
        <p class="clinical-domain-summary">${escapeClinicalText(item.summary || "目前沒有足夠資料")}</p>
        <div class="clinical-domain-indicators">
          <span class="clinical-domain-indicator-label">觀察指標</span>
          ${indicators.map((indicator) => `<span>${escapeClinicalText(indicator)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderClinicalPattern(pattern = {}) {
  const target = document.getElementById("clinicalPattern");
  if (!target) return;

  const dates = Array.isArray(pattern.dates) ? pattern.dates : [];
  if (!dates.length) {
    target.innerHTML = `<p class="empty-detail">目前沒有 pattern 資料</p>`;
    return;
  }

  const rows = [
    ["Drive", pattern.drive || []],
    ["Cognition", pattern.cognition || []],
    ["Mood", pattern.mood || []],
    ["Behavior", pattern.behavior || []]
  ];

  target.innerHTML = `
    <table class="clinical-pattern-table">
      <thead>
        <tr>
          <th>面向</th>
          ${dates.map((date) => `<th>${escapeClinicalText(date)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, values]) => `
          <tr>
            <td>${label}</td>
            ${dates.map((_, index) => `<td>${escapeClinicalText(values[index] ?? "—")}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderClinicalSymptoms(symptoms = []) {
  const target = document.getElementById("clinicalSymptoms");
  if (!target) return;

  if (!symptoms.length) {
    target.innerHTML = `<p class="empty-detail">目前沒有症狀資料</p>`;
    return;
  }

  target.innerHTML = `
    <div class="clinical-list">
      ${symptoms.map((item) => `
        <div class="clinical-list-row">
          <span class="clinical-list-name">${escapeClinicalText(item.name)}</span>
          ${[item.summary, item.note, item.pattern].find((text) => typeof text === "string" && text.trim())
            ? `<span class="clinical-list-muted">${escapeClinicalText([item.summary, item.note, item.pattern].find((text) => typeof text === "string" && text.trim()))}</span>`
            : ""}
        </div>
      `).join("")}
    </div>
  `;
}


function renderImportantEvents(patient, medicationChanges = []) {
  const target = document.getElementById("detailEventTimeline");
  if (!target) return;

  const normalEvents = Array.isArray(patient?.aiSummary?.importantEvents)
    ? patient.aiSummary.importantEvents.slice(0, 5).map((event) => ({
        date: event.date || "",
        title: event.title || "重要事件",
        text: event.summary || "",
        kind: event.category ? `AI 摘要 · ${event.category}` : "AI 摘要",
        kindClass: ""
      }))
    : Array.isArray(patient?.events)
    ? patient.events.map((event) => ({
        date: event.date || "",
        title: event.title || "重要事件",
        text: event.text || event.description || "",
        kind: event.type || "重要事件",
        kindClass: ""
      }))
    : [];

  const medicationEvents = Array.isArray(medicationChanges)
    ? medicationChanges.map((item) => ({
        date: item.date || "",
        title: item.title || item.medication || "藥物調整",
        text:
          item.detail ||
          [item.from, item.to].filter(Boolean).join(" → ") ||
          item.note ||
          "",
        subtext: item.note || "",
        kind: "藥物調整",
        kindClass: "medication"
      }))
    : [];

  const events = [...normalEvents, ...medicationEvents]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  target.innerHTML = events.length
    ? events.map((event) => `
        <div class="timeline-item">
          <div class="timeline-date">${escapeClinicalText(event.date)}</div>
          <div class="timeline-axis"></div>
          <div class="timeline-content">
            <strong>
              ${escapeClinicalText(event.title)}
              <span class="timeline-kind ${escapeClinicalText(event.kindClass || "")}">
                ${escapeClinicalText(event.kind)}
              </span>
            </strong>
            ${event.text ? `<p>${escapeClinicalText(event.text)}</p>` : ""}
            ${event.subtext && event.subtext !== event.text
              ? `<p class="clinical-list-muted">${escapeClinicalText(event.subtext)}</p>`
              : ""}
          </div>
        </div>
      `).join("")
    : `
      <div class="empty-detail-block">
        <strong>近期沒有重大事件紀錄</strong>
        <p>目前資料中沒有需要特別標記的事件或藥物調整。</p>
      </div>
    `;
}

function renderClinicalMedicationChanges(changes = []) {
  const target = document.getElementById("clinicalMedicationChanges");
  if (!target) return;

  if (!changes.length) {
    target.innerHTML = `<p class="empty-detail">近期沒有藥物變動紀錄</p>`;
    return;
  }

  target.innerHTML = changes.map((item) => `
    <div class="clinical-med-change">
      <strong>${escapeClinicalText(item.date || "")} ${escapeClinicalText(item.title || item.medication || "藥物變動")}</strong>
      <span>${escapeClinicalText(item.detail || [item.from, item.to].filter(Boolean).join(" → "))}</span>
      ${item.note ? `<p>${escapeClinicalText(item.note)}</p>` : ""}
    </div>
  `).join("");
}

function renderClinicalDataLayer(patient) {
  ensureClinicalSections();

  const clinical = getClinicalViewModel(patient);
  renderClinicalPeriodSummary(patient, clinical);
  renderImportantEvents(patient, clinical.medicationChanges);
  renderClinicalSymptoms(clinical.symptoms);
}

function showDashboard() {
  document.getElementById("dashboardMain")?.classList.remove("hidden");
  document.getElementById("patientDetailPage")?.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPatientDetail(patient) {
  const currentRole =
    window.INNERA_CURRENT_STAFF?.role || "";

  if (currentRole !== "doctor") {
    showToast("臨床資料僅限醫師查看");
    return;
  }

  if (!patient || !patient.linked) {
    showToast("此個案尚未連結心域");
    return;
  }

  state.activePatientId = patient.id;
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

  const detailDomainStatuses = Object.values(
    patient.aiSummary?.domains || {}
    )
    .map((domain) =>
        typeof domain?.status === "string"
        ? domain.status.trim()
        : ""
    )
    .map((status) =>
        status
        .replace(/^[\s↑↓↗↘→↔⚠⚠️•·:：-]+/u, "")
        .trim()
    )
    .filter(
        (status) =>
        status &&
        status !== "資料不足"
    );

    const detailChangedStatuses =
    detailDomainStatuses.filter(
        (status) => !status.includes("穩定")
    );

    const detailSummaryLevel =
    patient.attention === true
        ? "需要留意"
        : detailChangedStatuses.length
        ? "近期有變化"
        : detailDomainStatuses.length
            ? "相對穩定"
            : "資料不足";

    document.getElementById("detailSummaryLevel").textContent =
    detailSummaryLevel;
  document.getElementById("detailSummaryText").textContent =
    patient.aiSummary?.patternSummary || patient.summary || "目前沒有足夠摘要資料。";

  const tags = [...new Set([
    patient.status,
    ...(patient.changes || []).map((change) => change.text)
  ].filter((tag) => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag && !["已連結心域", "尚未連結", "linked", "connected"].includes(tag.toLowerCase())))];

  document.getElementById("detailHeaderTags").innerHTML =
    tags.map((tag) => `<span>${escapeClinicalText(tag)}</span>`).join("");

  document.getElementById("detailChangeGrid").innerHTML =
    [
      { label: "目前情緒", value: patient.currentMood || "—" },
      { label: "平均睡眠", value: formatDetailAverageSleep(patient.sleep) },
      {
        label: "近期狀態",
        value: escapeClinicalText([...new Set(getClinicalViewModel(patient).symptoms
          .map((item) => item?.name).filter((name) => typeof name === "string" && name.trim()))]
          .slice(0, 3).join("、") || "資料不足")
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
    quick.avgMood || "—";

  document.getElementById("detailAvgSleep").textContent =
    formatDetailAverageSleep(quick.sleep ?? patient.sleep);

  document.getElementById("detailSleepRecordCount").textContent =
    Array.isArray(patient.records?.sleep) ? `${patient.records.sleep.length} 筆` : "—";

  document.getElementById("detailRecordDays").textContent =
    quick.days || "—";

  const medications = Array.isArray(patient.medications) ? patient.medications : [];
  const visibleMedications = medicationListExpanded
    ? medications
    : medications.slice(0, 4);
  const medicationList =
    document.getElementById("detailMedicationList");

    medicationList.innerHTML =
    visibleMedications.map((med) => {

        const name =
        String(med?.name ?? "").trim();

        const nameEn =
        String(
            med?.nameEn ??
            med?.genericName ??
            ""
        ).trim();

        const primaryName =
        nameEn ||
        name ||
        "未命名藥物";

        const secondaryName =
        name &&
        name !== primaryName
            ? `<span class="detail-medication-name">${escapeMedicationText(name)}</span>`
            : "";

        let doseText = "";

        if (
        med?.dose !== null &&
        med?.dose !== undefined &&
        String(med.dose).trim()
        ) {
        const rawDose =
            String(med.dose).trim();

        const unit =
            String(med?.unit ?? "").trim();

        const doseAlreadyHasUnit =
            /[a-zA-Zµμ%]/.test(rawDose);

        doseText =
            doseAlreadyHasUnit || !unit
            ? rawDose
            : `${rawDose} ${unit}`;
        }

        if (
        !doseText &&
        med?.dosePerUnit !== null &&
        med?.dosePerUnit !== undefined
        ) {
        const unit =
            String(med?.unit ?? "").trim();

        doseText =
            `${med.dosePerUnit}${unit ? ` ${unit}` : ""}`;
        }

        const timesText =
        Array.isArray(med?.times)
            ? med.times
                .map((item) => String(item).trim())
                .filter(Boolean)
                .join("、")
            : String(med?.times ?? "").trim();

        const detail =
        [doseText, timesText]
            .filter(Boolean)
            .join("｜") ||
        "—";

        return `
        <div class="detail-medication-item">
            <strong class="detail-medication-generic">
            ${escapeMedicationText(primaryName)}
            </strong>

            ${secondaryName}

            <span class="detail-medication-detail">
            ${escapeMedicationText(detail)}
            </span>
        </div>
        `;
    }).join("") ||
    `<p class="empty-detail">目前沒有用藥資料</p>`;

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

  renderClinicalDataLayer(patient);
  renderDetailTrend(patient.trend);
  renderSleepRecords(patient);
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
     第一張：整體情緒
     Y 軸固定 1～5
  ===================================== */

  function renderStateChart() {
    const dates = trend.moodDates || [];

    if (!dates.length) {
      return `
        <p class="empty-detail">
          目前沒有整體情緒趨勢
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

    const labelCount = 5;

const labelIndexes =
  dates.length <= labelCount
    ? dates.map((_, index) => index)
    : Array.from({ length: labelCount }, (_, i) =>
        Math.round(
          (i * (dates.length - 1)) /
          (labelCount - 1)
        )
      );

const xLabels = labelIndexes
  .map((index) => `
    <text
      x="${x(index)}"
      y="${height - 12}"
      text-anchor="middle"
      font-size="11"
      fill="#8e99aa"
    >
      ${dates[index]}
    </text>
  `)
  .join("");

    return `
      <div class="detail-subtrend">

        <div class="detail-subtrend-header">
          <div>
            <strong>整體情緒</strong>
            <span>Daily Check-in · 1～5 分</span>
          </div>

          <div class="detail-subtrend-legend">
            <span>
              <i style="background:#4f76b8"></i>
              情緒
            </span>

          </div>
        </div>

        <svg
          class="detail-trend-svg"
          viewBox="0 0 ${width} ${height}"
          role="img"
          aria-label="近期整體情緒趨勢"
        >

          ${horizontalLines}
          ${xLabels}

          <polyline
            fill="none"
            stroke="#4f76b8"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="${points(trend.overallMood)}"
          />

          ${(trend.overallMood || []).map((value, index) => `
            <circle cx="${x(index)}" cy="${y(value)}" r="4" fill="#4f76b8">
              <title>${escapeMedicationText(dates[index])}：整體情緒 ${value}/5</title>
            </circle>
          `).join("")}

        </svg>
      </div>
    `;
  }


  /* =====================================
     第二張：真實睡眠時數
  ===================================== */

  function renderSleepChart() {
  // 優先使用 Firebase 真實睡眠資料；
  // 若尚未載入，則使用 Demo trend 的日期與睡眠資料。
  const hasRealSleep =
    Array.isArray(trend.sleepDates) &&
    trend.sleepDates.length > 0 &&
    Array.isArray(trend.sleepHours) &&
    trend.sleepHours.length > 0;

  const dates = hasRealSleep
    ? trend.sleepDates
    : (trend.dates || []);

  const values = hasRealSleep
    ? trend.sleepHours
    : (trend.sleep || []);

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

    const labelCount = 5;

const labelIndexes =
  dates.length <= labelCount
    ? dates.map((_, index) => index)
    : Array.from({ length: labelCount }, (_, i) =>
        Math.round(
          (i * (dates.length - 1)) /
          (labelCount - 1)
        )
      );

const xLabels = labelIndexes
  .map((index) => `
    <text
      x="${x(index)}"
      y="${height - 12}"
      text-anchor="middle"
      font-size="11"
      fill="#8e99aa"
    >
      ${dates[index]}
    </text>
  `)
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
<span>${hasRealSleep ? "心域 App 真實紀錄" : "Demo 模擬資料"}</span>
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
          aria-label="近期睡眠時數趨勢"
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

function renderSleepRecords(patient) {
  const rows =
    patient.records?.sleep || [];

  const headers =
    recordHeaders.sleep;

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
      : `<p class="empty-detail">目前沒有睡眠紀錄</p>`;
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
