(function () {
  let syncing = false;

  function patientList() {
    if (Array.isArray(window.patients)) return window.patients;
    return typeof patients !== "undefined" && Array.isArray(patients) ? patients : [];
  }

  function shortDate(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
    return `${value.getMonth() + 1}/${value.getDate()}`;
  }

const nonImportantContexts = new Set([
  "休息中",
  "活動中",
  "剛起床",
  "用餐後",
  "now",
  "today",
  "現在",
  "快速紀錄"
]);

function isImportantHealthEvent(event) {
  const context = String(event?.context || "").trim();
  const note = String(event?.note || "").trim();

  if (!context && !note) return false;

  if (nonImportantContexts.has(context)) {
    return note.length > 0;
  }

  return true;
}

  function updateRecentChanges(patient) {
    function shortenStatus(status) {
      const text = String(status || "")
        .replace(/^[\s↑↓↗↘→↔⚠⚠️•·:：-]+/u, "")
        .trim();

      if (!text || text === "資料不足" || text.includes("穩定")) {
        return "";
      }

      if (text.includes("情緒波動")) return "情緒波動";
      if (text.includes("動力不足")) return "動力不足";
      if (text.includes("疲倦")) return "疲倦";
      if (text.includes("焦慮")) return "焦慮增加";
      if (text.includes("低落")) return "情緒低落";

      if (text.includes("睡眠") && text.includes("下降")) {
        return "睡眠下降";
      }

      if (text.includes("睡眠") && text.includes("增加")) {
        return "睡眠增加";
      }

      // 已經夠短才直接使用
      if (text.length <= 8) {
        return text;
      }

      return "";
    }

    const statuses = Object.values(patient.aiSummary?.domains || {})
      .map((domain) => shortenStatus(domain?.status))
      .filter(Boolean);

    patient.changes = [...new Set(statuses)]
      .slice(0, 2)
      .map((text) => ({
        text,
        type: ""
      }));
  }

  async function syncHealthData() {
    if (syncing || !window.InneraFirebase?.currentUser) return;
    const patientId = window.INNERA_REAL_SLEEP_PATIENT_ID || "P000001";
    const patient = patientList().find((item) => item.id === patientId);
    if (!patient) return;

    syncing = true;
    const previousSummary = patient.aiSummary;
    try {
      const clinicId = patient.clinicId || window.INNERA_ACTIVE_CLINIC_ID ||
        window.INNERA_DEMO_CLINIC_ID || "innera-demo-clinic";
      const [
        healthEvents,
        dailyCheckIns,
        aiSummary
      ] = await Promise.all([
        InneraFirebase.getPatientHealthEvents({
          patientId,
          days: 30,
          clinicId
        }),

        InneraFirebase.getPatientDailyCheckIns({
          patientId,
          days: 30,
          clinicId
        }),

        InneraFirebase.getPatientAiSummary({
          patientId,
          clinicId
        }).catch((error) => {
          console.warn("[Innera] AI Summary 讀取失敗：", error);
          return null;
        })
      ]);

      const formatItems = (items = []) => items.map((item) =>
        `${item.name || "—"} ${item.intensity ?? "—"}/5`
      ).join("、") || "—";
      patient.records ||= {};
      patient.records.quick = healthEvents.map((event) => [
        shortDate(event.timestamp) || "—",
        formatItems(event.emotions),
        formatItems(event.symptoms),
        event.context || "—",
        event.note || "—"
      ]);
      const symptomCounts = new Map();
      healthEvents.forEach((event) => {
        (event.symptoms || []).forEach((symptom) => {
          const name = symptom.name || "—";
          const entry = symptomCounts.get(name) || { name, count: 0, max: null, date: null };
          entry.count += 1;
          if (typeof symptom.intensity === "number" && Number.isFinite(symptom.intensity)) {
            entry.max = entry.max === null ? symptom.intensity : Math.max(entry.max, symptom.intensity);
          }
          if (event.timestamp instanceof Date && !Number.isNaN(event.timestamp.getTime()) &&
              (!entry.date || event.timestamp > entry.date)) entry.date = event.timestamp;
          symptomCounts.set(name, entry);
        });
      });
      patient.records.symptoms = [...symptomCounts.values()]
        .sort((a, b) => b.count - a.count)
        .map((item) => [item.name, item.count, item.max === null ? "—" : `${item.max}/5`, shortDate(item.date) || "—"]);
      const moodCheckIns = dailyCheckIns
        .filter((item) => typeof item.overallMood === "number" && Number.isFinite(item.overallMood) &&
          item.date instanceof Date && !Number.isNaN(item.date.getTime()))
        .sort((a, b) => a.date - b.date);
      patient.trend ||= {};
      patient.trend.moodDates = moodCheckIns.map((item) => shortDate(item.date));
      patient.trend.overallMood = moodCheckIns.map((item) => item.overallMood);

      const latest = healthEvents[0];
      if (latest) {
        function formatEmotions(emotions, limit) {
        const sorted = [...(emotions || [])]
          .sort((a, b) => (b?.intensity ?? 0) - (a?.intensity ?? 0));

        const shown = sorted.slice(0, limit);

        const text = shown
          .map((item) => {
            const name = item?.name || "未命名情緒";
            return item?.intensity == null
              ? name
              : `${name} ${item.intensity}/5`;
          })
          .join("、");

        const remaining = sorted.length - shown.length;

        return remaining > 0
          ? `${text} +${remaining}`
          : text;
      }
        patient.currentMoodCompact = latest.emotions.length
          ? formatEmotions(latest.emotions, 2)
          : "—";

        patient.currentMoodDrawer = latest.emotions.length
          ? formatEmotions(latest.emotions, 3)
          : "—";

        patient.currentMood = latest.emotions.length
          ? formatEmotions(latest.emotions, 99)
          : "—";
        patient.symptoms = latest.symptoms;
        const seen = new Set();

        const importantEvents = healthEvents
          .filter(isImportantHealthEvent)
          .filter((event) => {
            const date = shortDate(event.timestamp);
            const context = String(event.context || "").trim();

            const key = `${date}|${context}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
          })
          .slice(0, 5);

        patient.events = importantEvents.map((event) => ({
          date: shortDate(event.timestamp),
          title: event.context || "重要事件",
          text: event.note || "",
          type: "快速紀錄"
        }));
      }
      // Do not overwrite a newly generated summary with an older in-flight read.
      if (patient.aiSummary === previousSummary) patient.aiSummary = aiSummary || null;
      updateRecentChanges(patient);
      const moodValues = dailyCheckIns
        .map((item) => Number(item.overallMood))
        .filter(Number.isFinite);
      patient.quick ||= {};
      patient.quick.avgMood = moodValues.length
        ? `${(moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length).toFixed(1)} / 5`
        : "—";
      const distinctDays = new Set(
        dailyCheckIns.map((item) => item.date?.toISOString().slice(0, 10)).filter(Boolean)
      ).size;
      patient.quick.days = `${distinctDays} / 30`;

      if (typeof renderPatients === "function") renderPatients();
      const detailPage = document.getElementById("patientDetailPage");
      if (typeof state !== "undefined" && state.activePatientId === patientId &&
          detailPage && !detailPage.classList.contains("hidden") &&
          typeof renderPatientDetail === "function") {
        renderPatientDetail(patient);
      }
      console.info(`[Innera] 真實健康資料同步完成：${healthEvents.length} 筆快速紀錄、${dailyCheckIns.length} 筆 Check-in。`);
    } catch (error) {
      console.error("[Innera] 真實健康資料同步失敗：", error);
    } finally {
      syncing = false;
    }
  }

  function init() {
    window.InneraFirebase.init();
    firebase.auth().onAuthStateChanged((user) => {
      if (user) syncHealthData();
    });
    document.addEventListener("innera-patients-synced", syncHealthData);
    document.addEventListener("innera-ai-summary-generated", (event) => {
      const { patientId, clinicId, summary } = event.detail;
      const patient = patientList().find((item) => item.id === patientId);
      const activeClinicId = patient?.clinicId || window.INNERA_ACTIVE_CLINIC_ID ||
        window.INNERA_DEMO_CLINIC_ID || "innera-demo-clinic";
      if (!patient || activeClinicId !== clinicId) return;
      patient.aiSummary = summary;
      updateRecentChanges(patient);
      if (typeof renderPatients === "function") renderPatients();
      const detailPage = document.getElementById("patientDetailPage");
      if (typeof state !== "undefined" && state.activePatientId === patientId &&
          detailPage && !detailPage.classList.contains("hidden") &&
          typeof renderPatientDetail === "function") {
        renderPatientDetail(patient);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
