/**
 * seed-demo-clinical-data.js
 * Seeds one fictitious Demo patient using the same Firestore structure
 * as the production ClinicalShareService.
 */

const { admin, db } =
  require("../../moodsogood_app/functions/src/config/firebase");

const Timestamp = admin.firestore.Timestamp;
const SERVER_TS = admin.firestore.FieldValue.serverTimestamp();

// FILL THESE BEFORE RUNNING
const DEMO_UID = "jRhIarbL68XoK8Vn5bYWemSaSAr2";
const DEMO_CLINIC_ID = "lyuA5LbAHkgvgjn9y6oF";
const DEMO_PATIENT_ID = "P000004";

function assertConfigured() {
  for (const [key, value] of Object.entries({
    DEMO_UID,
    DEMO_CLINIC_ID,
    DEMO_PATIENT_ID
  })) {
    if (!value || value.includes("REPLACE_WITH_") || value.trim().length < 3) {
      throw new Error(`請先填入有效的 ${key}，只能使用專用 Demo 身分。`);
    }
  }
}

function dateId(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function atLocalTime(baseDate, hour, minute = 0) {
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    0,
    0
  );
}

function toTimestamp(date) {
  return Timestamp.fromDate(date);
}

function buildDates(days = 30) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, i) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i))
  );
}

const sleepHours = [
  7.1, 6.9, 7.3, 7.0, 6.8, 7.2, 7.0, 6.9, 7.1, 6.8,
  6.7, 6.5, 6.4, 6.2, 6.0, 6.1, 5.9,
  5.8, 5.6, 5.5, 5.2, 5.0, 4.8, 4.7,
  4.9, 4.6, 4.8, 5.1, 5.4, 5.7
];

const moods = [
  3.7, 3.6, 3.8, 3.5, 3.7, 3.6, 3.8, 3.7, 3.5, 3.6,
  3.4, 3.3, 3.4, 3.2, 3.1, 3.0, 3.1,
  2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3,
  2.4, 2.5, 2.6, 2.7, 2.8, 2.9
];

const energy = [
  3.8, 3.7, 3.8, 3.6, 3.7, 3.6, 3.7, 3.6, 3.5, 3.6,
  3.4, 3.4, 3.3, 3.2, 3.1, 3.0, 3.0,
  2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3,
  2.4, 2.5, 2.5, 2.6, 2.7, 2.8
];

const activity = [
  3.7, 3.6, 3.7, 3.6, 3.6, 3.5, 3.6, 3.6, 3.5, 3.5,
  3.4, 3.3, 3.3, 3.1, 3.0, 2.9, 2.9,
  2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2,
  2.3, 2.4, 2.5, 2.5, 2.6, 2.7
];

const appetite = [
  3.4, 3.5, 3.4, 3.5, 3.4, 3.5, 3.5, 3.4, 3.4, 3.5,
  3.4, 3.3, 3.3, 3.2, 3.2, 3.1, 3.1,
  3.0, 3.0, 2.9, 2.9, 2.8, 2.8, 2.8,
  2.9, 2.9, 3.0, 3.0, 3.1, 3.1
];

function sleepQuality(hours) {
  if (hours >= 6.8) return 4;
  if (hours >= 6.0) return 3;
  if (hours >= 5.0) return 2;
  return 1;
}

function healthEventsForDates(dates) {
  const events = [
    [17, "工作後", "最近事情比較多，但目前還能應付。",
      [{ name: "焦慮", intensity: 3 }, { name: "疲憊", intensity: 3 }],
      [{ name: "注意力下降", intensity: 2 }], { energy: 3, activity: 3, appetite: 3 }],
    [11, "睡前", "躺下後腦袋一直想隔天的事情，較難放鬆。",
      [{ name: "焦慮", intensity: 4 }],
      [{ name: "反覆思考", intensity: 4 }, { name: "入睡困難", intensity: 3 }], { energy: 3, activity: 3, appetite: 3 }],
    [8, "工作中", "同一件事情需要重看幾次才能完成。",
      [{ name: "煩躁", intensity: 4 }, { name: "焦慮", intensity: 4 }],
      [{ name: "專注下降", intensity: 4 }], { energy: 2, activity: 3, appetite: 3 }],
    [5, "重要事件", "臨時增加新的工作任務，擔心無法完成。",
      [{ name: "緊張", intensity: 5 }, { name: "焦慮", intensity: 4 }],
      [{ name: "心悸", intensity: 3 }, { name: "反覆思考", intensity: 4 }], { energy: 2, activity: 2, appetite: 3 }],
    [3, "休息中", "下班後幾乎沒有力氣做其他事情。",
      [{ name: "疲憊", intensity: 4 }, { name: "低落", intensity: 3 }],
      [{ name: "活動量下降", intensity: 4 }], { energy: 2, activity: 2, appetite: 3 }],
    [1, "睡前", "今天比前幾天稍微平靜一些，入睡前仍有些反覆思考。",
      [{ name: "焦慮", intensity: 3 }],
      [{ name: "反覆思考", intensity: 3 }], { energy: 3, activity: 3, appetite: 3 }]
  ];

  return events.map(([daysAgo, context, note, emotions, symptoms, stateChanges]) => {
    const date = dates[dates.length - 1 - daysAgo];
    const ts = atLocalTime(date, daysAgo <= 3 ? 21 : 19, 30);
    return {
      id: `demo-${dateId(date)}-${daysAgo}`,
      data: {
        timestamp: toTimestamp(ts),
        emotions,
        symptoms,
        stateChanges,
        context,
        note,
        updatedAt: toTimestamp(ts),
        source: "demo_seed",
        shareVersion: 1
      }
    };
  });
}

async function verifyDemoPatient() {
  const ref = db.collection("inneraPatients").doc(DEMO_PATIENT_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`找不到 inneraPatients/${DEMO_PATIENT_ID}`);

  const data = snap.data();
  if (String(data.clinicId || "") !== DEMO_CLINIC_ID) {
    throw new Error(`clinicId 不符：Firestore=${data.clinicId}, 設定=${DEMO_CLINIC_ID}`);
  }
  if (String(data.firebaseUid || "") !== DEMO_UID) {
    throw new Error(`firebaseUid 不符：Firestore=${data.firebaseUid}, 設定=${DEMO_UID}`);
  }
  if (data.linked !== true) {
    throw new Error(`inneraPatients/${DEMO_PATIENT_ID} 尚未 linked=true`);
  }

  return data;
}

async function seed() {
  assertConfigured();
  const patient = await verifyDemoPatient();

  const clinicShareRef = db
    .collection("clinicalShares")
    .doc(DEMO_UID)
    .collection("clinics")
    .doc(DEMO_CLINIC_ID);

  const dates = buildDates(30);

  await clinicShareRef.set({
    uid: DEMO_UID,
    clinicId: DEMO_CLINIC_ID,
    active: true,
    sleepSharingEnabled: true,
    healthEventSharingEnabled: true,
    dailyCheckInSharingEnabled: true,
    medicationSharingEnabled: true,
    sleepShareVersion: 1,
    medicationShareVersion: 1,
    grantedAt: SERVER_TS,
    lastSleepSyncAt: SERVER_TS,
    lastHealthEventSyncAt: SERVER_TS,
    lastDailyCheckInSyncAt: SERVER_TS,
    lastMedicationSyncAt: SERVER_TS,
    updatedAt: SERVER_TS
  }, { merge: true });

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const hours = sleepHours[i];

    await clinicShareRef.collection("sleepRecords").doc(dateId(date)).set({
      uid: DEMO_UID,
      clinicId: DEMO_CLINIC_ID,
      date: toTimestamp(date),
      bedTime: hours >= 6.5 ? "23:20" : hours >= 5.5 ? "00:10" : "00:50",
      sleepStart: hours >= 6.5 ? "23:45" : hours >= 5.5 ? "00:35" : "01:20",
      wakeTime: hours >= 6.5 ? "06:45" : hours >= 5.5 ? "06:20" : "06:00",
      activityWakeTime: hours >= 6.5 ? "07:00" : "06:40",
      durationMinutes: Math.round(hours * 60),
      quality: sleepQuality(hours),
      sleepConditions: hours < 5.0 ? ["入睡困難", "淺眠"] : hours < 6.0 ? ["睡眠不足"] : [],
      source: "demo_seed",
      shareVersion: 1,
      sharedAt: SERVER_TS,
      updatedAt: SERVER_TS
    }, { merge: true });

    await clinicShareRef.collection("dailyCheckIns").doc(dateId(date)).set({
      date: toTimestamp(date),
      overallMood: moods[i],
      healthStatus: {
        energy: energy[i],
        activity: activity[i],
        appetite: appetite[i]
      },
      noSpecialEvent: i < 18,
      updatedAt: toTimestamp(atLocalTime(date, 22, 0)),
      source: "demo_seed",
      shareVersion: 1
    }, { merge: true });
  }

  for (const event of healthEventsForDates(dates)) {
    await clinicShareRef.collection("healthEvents").doc(event.id).set(event.data, { merge: true });
  }

  const meds = [
    [
      "demo-med-a",
      "樂命達錠50毫克",
      "LAMOTRIGINE 50 mg",
      100,
      50,
      2,
      "mg",
      ["睡前"],
      4
    ],

    [
      "demo-med-b",
      "安保思樂錠100毫克",
      "QUETIAPINE FUMARATE",
      150,
      100,
      1.5,
      "mg",
      ["睡前"],
      24
    ],

    [
      "demo-med-c",
      "利達 樂得靜錠2毫克",
      "LORAZEPAM 2 MG",
      2,
      2,
      1,
      "mg",
      ["睡前"],
      24
    ]
  ];

  for (const [id, name, nameEn, dose, dosePerUnit, pillCount, unit, times, dayIndex] of meds) {
    await clinicShareRef.collection("medications").doc(id).set({
      uid: DEMO_UID,
      clinicId: DEMO_CLINIC_ID,
      medicationId: id,
      name,
      nameEn,
      dose,
      dosePerUnit,
      pillCount,
      unit,
      times,
      isActive: true,
      startDate: toTimestamp(dates[dayIndex]),
      lastChangeAt: toTimestamp(dates[dayIndex]),
      source: "demo_seed",
      shareVersion: 1,
      sharedAt: SERVER_TS,
      updatedAt: SERVER_TS
    }, { merge: true });
  }

  console.log("Demo clinical seed 完成。");
  console.log({
    patientId: DEMO_PATIENT_ID,
    legalName: patient.legalName || "",
    clinicId: DEMO_CLINIC_ID,
    uid: DEMO_UID,
    sleepRecords: 30,
    dailyCheckIns: 30,
    healthEvents: 6,
    medications: 3
  });
  console.log("下一步：用現有 generateClinicalSummary 對這位 Demo patient 產生正式 AI summary。");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo seed 失敗：", error?.message || error);
    process.exit(1);
  });
