/* ==============================
   MVP 詳細頁資料補充
   目前仍為 Demo 假資料；未來可改由 Firebase 回傳
============================== */

const detailedPatientTemplates = {
  P001: {
    summaryLevel: "需要留意",
    summary:
      "近 7 日睡眠時間下降，情緒平均值較前期降低，並有新增用藥紀錄。建議門診時優先確認睡眠、用藥後變化與近期壓力事件。",
    quick: { mood: "2.1 / 5", sleep: "4.8 hr", energy: "2.4 / 5", days: "7 / 7" },
    trend: {
      dates: ["9/10","9/11","9/12","9/13","9/14","9/15","9/16"],
      mood: [3.2,3.0,2.9,2.7,2.5,2.2,2.1],
      sleep: [3.4,3.2,3.0,2.8,2.6,2.3,2.2],
      energy: [3.0,2.8,2.7,2.5,2.4,2.3,2.2]
    },
    medications: [
      { name: "Quetiapine", detail: "200 mg｜睡前" },
      { name: "Lamotrigine", detail: "50 mg｜晚間" }
    ],
    events: [
      { date: "09/15", title: "睡眠持續下降", text: "連續 3 日睡眠偏低，白天疲勞感增加。" },
      { date: "09/14", title: "新增用藥紀錄", text: "患者回報開始使用新的睡前藥物。" },
      { date: "09/12", title: "壓力事件", text: "記錄近期工作壓力增加，情緒明顯下降。" }
    ],
    lastVisit:
      "上次回診主要討論睡眠品質與白天疲勞，醫師請患者持續記錄睡眠、情緒與用藥後變化。",
    records: {
      daily: [
        ["09/16","2.1","4.8 hr","2.2","焦慮 3/5","早上疲累"],
        ["09/15","2.2","4.6 hr","2.3","焦慮 3/5","工作壓力"],
        ["09/14","2.5","4.9 hr","2.4","嗜睡 3/5","新增用藥"],
        ["09/13","2.7","5.4 hr","2.5","焦慮 2/5","—"],
        ["09/12","2.9","5.6 hr","2.7","壓力 3/5","工作事件"]
      ],
      symptoms: [
        ["焦慮","3 / 5","近 3 日增加"],
        ["疲勞","4 / 5","與睡眠下降同時出現"],
        ["白天嗜睡","3 / 5","新增用藥後增加"]
      ],
      sleep: [
        ["09/16","01:05","05:53","4.8 hr","2 / 5"],
        ["09/15","00:50","05:26","4.6 hr","2 / 5"],
        ["09/14","00:35","05:29","4.9 hr","2 / 5"]
      ],
      medications: [
        ["Quetiapine","200 mg","睡前","持續使用","嗜睡增加"],
        ["Lamotrigine","50 mg","晚間","持續使用","無特殊回報"]
      ]
    }
  },

  P002: {
    summaryLevel: "相對穩定",
    summary:
      "近 7 日情緒與睡眠大致穩定，未見明顯持續惡化。近期紀錄完整，可於門診確認目前治療耐受度與日常功能。",
    quick: { mood: "3.6 / 5", sleep: "6.7 hr", energy: "3.5 / 5", days: "6 / 7" },
    trend: {
      dates: ["9/10","9/11","9/12","9/13","9/14","9/15","9/16"],
      mood: [3.5,3.6,3.4,3.5,3.7,3.6,3.6],
      sleep: [3.5,3.5,3.4,3.5,3.6,3.5,3.6],
      energy: [3.4,3.5,3.3,3.4,3.6,3.5,3.5]
    },
    medications: [{ name: "Sertraline", detail: "50 mg｜早上" }],
    events: [
      { date: "09/13", title: "規律運動", text: "本週完成 3 次步行，每次約 30 分鐘。" }
    ],
    lastVisit: "上次回診整體狀態穩定，維持原治療並鼓勵規律作息與運動。",
    records: {
      daily: [
        ["09/16","3.6","6.7 hr","3.5","焦慮 1/5","無特殊事件"],
        ["09/15","3.6","6.5 hr","3.5","焦慮 1/5","散步 30 分鐘"],
        ["09/14","3.7","7.0 hr","3.6","焦慮 1/5","—"]
      ],
      symptoms: [["焦慮","1 / 5","穩定"],["疲勞","1 / 5","偶發"]],
      sleep: [
        ["09/16","23:30","06:12","6.7 hr","4 / 5"],
        ["09/15","23:50","06:20","6.5 hr","4 / 5"],
        ["09/14","23:10","06:10","7.0 hr","4 / 5"]
      ],
      medications: [["Sertraline","50 mg","早上","持續使用","無特殊回報"]]
    }
  },

  P003: {
    summaryLevel: "需要留意",
    summary:
      "近 7 日情緒波動增加、入睡時間延後，並記錄近期壓力事件。建議門診時優先確認壓力來源、睡眠節律與波動是否影響日常功能。",
    quick: { mood: "3.0 / 5", sleep: "5.9 hr", energy: "3.0 / 5", days: "7 / 7" },
    trend: {
      dates: ["9/10","9/11","9/12","9/13","9/14","9/15","9/16"],
      mood: [3.4,2.8,3.5,2.7,3.4,2.9,3.0],
      sleep: [3.5,3.3,3.2,3.0,2.9,2.8,2.9],
      energy: [3.3,3.0,3.4,2.9,3.2,3.0,3.0]
    },
    medications: [{ name: "Escitalopram", detail: "10 mg｜早上" }],
    events: [
      { date: "09/15", title: "壓力事件", text: "記錄與家庭相關的壓力事件，當日情緒明顯波動。" },
      { date: "09/13", title: "入睡延後", text: "入睡時間比平常延後約 1 小時。" }
    ],
    lastVisit: "上次回診主要討論壓力管理與睡眠節律，治療維持不變。",
    records: {
      daily: [
        ["09/16","3.0","5.9 hr","3.0","焦慮 2/5","情緒波動"],
        ["09/15","2.9","5.7 hr","3.0","焦慮 3/5","壓力事件"],
        ["09/14","3.4","6.0 hr","3.2","焦慮 2/5","—"]
      ],
      symptoms: [["焦慮","3 / 5","壓力事件後增加"],["情緒波動","3 / 5","近一週增加"]],
      sleep: [
        ["09/16","00:40","06:35","5.9 hr","3 / 5"],
        ["09/15","00:55","06:35","5.7 hr","3 / 5"],
        ["09/14","00:30","06:30","6.0 hr","3 / 5"]
      ],
      medications: [["Escitalopram","10 mg","早上","持續使用","無特殊回報"]]
    }
  }
};

function buildDefaultDetail(patient, index) {
  const baseMood = Number.parseFloat(patient.mood) || 3.3;
  const baseSleep = Number.parseFloat(patient.sleep) || 6.4;

  return {
    summaryLevel: patient.attention ? "需要留意" : "相對穩定",
    summary: patient.attention
      ? "近 7 日紀錄顯示部分指標波動增加。此為 Demo 摘要，實際產品將由患者 App 紀錄與摘要流程產生，供門診快速掌握近期變化。"
      : "近 7 日現有紀錄大致穩定，未見明顯持續惡化。此為 Demo 摘要，實際產品將由患者 App 資料產生。",
    quick: {
      mood: patient.mood || "—",
      sleep: patient.sleep || "—",
      energy: `${Math.max(1, Math.min(5, baseMood - 0.1)).toFixed(1)} / 5`,
      days: `${5 + (index % 3)} / 7`
    },
    trend: {
      dates: ["9/10","9/11","9/12","9/13","9/14","9/15","9/16"],
      mood: [-0.2,0,0.1,-0.1,0.2,-0.1,0].map(v => Math.max(1, Math.min(5, baseMood + v))),
      sleep: [-0.1,0,0.1,-0.15,0.05,-0.1,0].map(v => Math.max(1, Math.min(5, (baseSleep / 2) + v))),
      energy: [-0.1,0.05,0,-0.05,0.1,0,0.05].map(v => Math.max(1, Math.min(5, baseMood - 0.1 + v)))
    },
    medications: [{ name: "目前用藥", detail: "Demo 資料｜待串接 App" }],
    events: patient.attention
      ? [{ date: "09/15", title: "近期波動", text: "患者近況出現需要進一步確認的變化。" }]
      : [],
    lastVisit: "Demo：上次回診摘要尚未與院所病歷系統串接。",
    records: {
      daily: [
        ["09/16", patient.mood || "—", patient.sleep || "—", "3.1 / 5", "—", "Demo 紀錄"],
        ["09/15", patient.mood || "—", patient.sleep || "—", "3.0 / 5", "—", "Demo 紀錄"]
      ],
      symptoms: [["目前症狀","—","待串接 App 資料"]],
      sleep: [["09/16","—","—", patient.sleep || "—","—"]],
      medications: [["目前用藥","—","—","Demo","待串接 App 資料"]]
    }
  };
}


function attachPatientDetails(patients) {
  patients.forEach((patient, index) => {
    if (!patient.linked) return;

    const detail =
      detailedPatientTemplates[patient.id] ||
      buildDefaultDetail(patient, index);

    patient.summaryLevel = detail.summaryLevel;
    patient.summary = detail.summary;
    patient.quick = detail.quick;
    patient.trend = detail.trend;
    patient.medications = detail.medications;
    patient.events = detail.events;
    patient.lastVisit = detail.lastVisit;
    patient.records = detail.records;
  });

  return patients;
}
function applyRealSleepDataToPatient(patient, sleepData) {
  if (!patient || !sleepData) return;

  const { records, summary } = sleepData;

  // 今日門診列表
  patient.sleep =
    summary.avgDurationHours == null
      ? "—"
      : `${summary.avgDurationHours} hr`;

  patient.sleepSub =
    records.length > 0
      ? `近 ${records.length} 筆平均`
      : "暫無睡眠資料";

  // 完整個案頁快速指標
  if (patient.quick) {
    patient.quick.sleep =
      summary.avgDurationHours == null
        ? "—"
        : `${summary.avgDurationHours} hr`;
  }

  // 趨勢資料
  // 趨勢資料
// Firestore 新增的患者可能原本沒有 trend，先建立空物件。
if (!patient.trend) {
  patient.trend = {};
}

// 真實睡眠資料另外存，不覆蓋未來的情緒 / 能量資料
console.log("[Sleep Record Debug]", records[0]);
patient.trend.sleepDates = records.map((record) => {
  if (!record.id) return "";

  const parts = record.id.split("-");

  if (parts.length !== 3) return record.id;

  return `${Number(parts[1])}/${Number(parts[2])}`;
});

patient.trend.sleepHours = records.map((record) => {
  if (typeof record.durationMinutes !== "number") return null;

  return Math.round(
    (record.durationMinutes / 60) * 10
  ) / 10;
});

  // 睡眠明細表
  // 睡眠明細表
if (!patient.records) {
  patient.records = {};
}

patient.records.sleep = records
  .slice()
  .reverse()
  .map((record) => {
    const duration =
      typeof record.durationMinutes === "number"
        ? `${Math.floor(record.durationMinutes / 60)}h ${
            record.durationMinutes % 60
          }m`
        : "—";

    const quality =
      typeof record.quality === "number"
        ? `${record.quality} / 5`
        : "—";

    const sleepDate = record.dateId || record.id || "";

return [
  sleepDate
    ? sleepDate.slice(5).replace("-", "/")
    : "—",
  record.sleepStart || "—",
  record.wakeTime || "—",
  duration,
  quality
];
  });
}