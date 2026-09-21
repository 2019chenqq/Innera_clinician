// firebase-service.js
// Classic script 版本，搭配 Firebase compat CDN。
// 作用：
// 1. 使用 Google 登入同一個 Firebase 專案
// 2. 讀取 clinicalShares/{uid}/clinics/{clinicId}/sleepRecords
// 3. 回傳整理好的近 30 日睡眠資料

(function () {
  let app = null;
  let auth = null;
  let db = null;

  function assertFirebaseLoaded() {
    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK 尚未載入，請先確認 index.html 的 Firebase CDN script。");
    }
  }

  function assertConfig() {
    const config = window.INNERA_FIREBASE_CONFIG;
    if (!config) {
      throw new Error("找不到 INNERA_FIREBASE_CONFIG。");
    }

    const missing = Object.entries(config)
      .filter(([, value]) => !value || String(value).startsWith("PASTE_"))
      .map(([key]) => key);

    if (missing.length) {
      throw new Error(`Firebase 設定尚未完成：${missing.join(", ")}`);
    }
  }

  function init() {
    assertFirebaseLoaded();
    assertConfig();

    if (!firebase.apps.length) {
      app = firebase.initializeApp(window.INNERA_FIREBASE_CONFIG);
    } else {
      app = firebase.app();
    }

    auth = firebase.auth();
    db = firebase.firestore();

    return { app, auth, db };
  }

  function getAuth() {
    if (!auth) init();
    return auth;
  }

  function getDb() {
    if (!db) init();
    return db;
  }

  async function signInWithGoogle() {
    const authInstance = getAuth();

    if (authInstance.currentUser) {
      return authInstance.currentUser;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await authInstance.signInWithPopup(provider);
    return result.user;
  }

  async function signOut() {
    await getAuth().signOut();
  }

  function timestampToDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    return new Date(value);
  }

  function formatDateId(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function normalizeSleepDoc(doc) {
    const data = doc.data();
    const date = timestampToDate(data.date);

    return {
      id: doc.id,
      date,
      dateId: formatDateId(date) || doc.id,
      bedTime: data.bedTime ?? null,
      sleepStart: data.sleepStart ?? null,
      wakeTime: data.wakeTime ?? null,
      activityWakeTime: data.activityWakeTime ?? null,
      durationMinutes:
        typeof data.durationMinutes === "number" ? data.durationMinutes : null,
      quality: typeof data.quality === "number" ? data.quality : null,
      sleepConditions: Array.isArray(data.sleepConditions)
        ? data.sleepConditions
        : []
    };
  }

  async function getRecentSleepRecords({
  days = 30,
  clinicId
} = {}) {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("尚未登入 Firebase。");
  }

  const targetClinicId =
    clinicId ||
    window.INNERA_ACTIVE_CLINIC_ID;

  if (!targetClinicId) {
    throw new Error("缺少 clinicId");
  }

  const snapshot = await getDb()
    .collection("clinicalShares")
    .doc(user.uid)
    .collection("clinics")
    .doc(targetClinicId)
    .collection("sleepRecords")
    .get();

  const records = snapshot.docs
    .map(normalizeSleepDoc)
    .sort((a, b) =>
      a.id.localeCompare(b.id)
    );

  return records.slice(-days);
}

  async function getPatientRecentSleepRecords({
    patientId,
    days = 30,
    clinicId
  } = {}) {
    if (!getAuth().currentUser) {
      throw new Error("尚未登入 Firebase。");
    }

    if (!patientId) {
      throw new Error("patientId 不可為空");
    }

    const patientSnap = await getDb()
      .collection("inneraPatients")
      .doc(patientId)
      .get();

    if (!patientSnap.exists) {
      throw new Error(`找不到患者：${patientId}`);
    }

    const patient = patientSnap.data();

    if (!patient.linked || !patient.firebaseUid) {
      throw new Error("此患者尚未連結心域");
    }

    const targetClinicId =
      clinicId ||
      window.INNERA_ACTIVE_CLINIC_ID;

    if (!targetClinicId) {
      throw new Error("缺少 clinicId");
    }

    const snapshot = await getDb()
      .collection("clinicalShares")
      .doc(patient.firebaseUid)
      .collection("clinics")
      .doc(targetClinicId)
      .collection("sleepRecords")
      .get();

    const records = snapshot.docs
      .map(normalizeSleepDoc)
      .sort((a, b) =>
        a.id.localeCompare(b.id)
      );

    return records.slice(-days);
  }

  async function getPatientHealthEvents({ patientId, days = 30, clinicId } = {}) {
    if (!getAuth().currentUser) throw new Error("尚未登入 Firebase。");
    if (!patientId) throw new Error("patientId 不可為空");
    const patientSnap = await getDb().collection("inneraPatients").doc(patientId).get();
    if (!patientSnap.exists) throw new Error(`找不到患者：${patientId}`);
    const patient = patientSnap.data();
    if (!patient.linked || !patient.firebaseUid) throw new Error("此患者尚未連結心域");
    const targetClinicId =
      clinicId ||
      window.INNERA_ACTIVE_CLINIC_ID;

    if (!targetClinicId) {
      throw new Error("缺少 clinicId");
    }
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - Math.max(0, days - 1));
    const snapshot = await getDb()
      .collection("clinicalShares").doc(patient.firebaseUid)
      .collection("clinics").doc(targetClinicId)
      .collection("healthEvents")
      .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(since))
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        timestamp: timestampToDate(data.timestamp),
        emotions: Array.isArray(data.emotions) ? data.emotions : [],
        symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
        stateChanges: data.stateChanges || {},
        context: data.context || "",
        note: data.note || ""
      };
    });
  }

  async function getPatientDailyCheckIns({ patientId, days = 30, clinicId } = {}) {
    if (!getAuth().currentUser) throw new Error("尚未登入 Firebase。");
    if (!patientId) throw new Error("patientId 不可為空");
    const patientSnap = await getDb().collection("inneraPatients").doc(patientId).get();
    if (!patientSnap.exists) throw new Error(`找不到患者：${patientId}`);
    const patient = patientSnap.data();
    if (!patient.linked || !patient.firebaseUid) throw new Error("此患者尚未連結心域");
    const targetClinicId =
      clinicId ||
      window.INNERA_ACTIVE_CLINIC_ID;

    if (!targetClinicId) {
      throw new Error("缺少 clinicId");
    }
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - Math.max(0, days - 1));
    const snapshot = await getDb()
      .collection("clinicalShares").doc(patient.firebaseUid)
      .collection("clinics").doc(targetClinicId)
      .collection("dailyCheckIns")
      .where("date", ">=", firebase.firestore.Timestamp.fromDate(since))
      .orderBy("date", "desc")
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: timestampToDate(data.date),
        overallMood: data.overallMood,
        healthStatus: data.healthStatus,
        noSpecialEvent: data.noSpecialEvent === true
      };
    });
  }

async function getPatientAiSummary({
  patientId,
  clinicId
} = {}) {
  if (!getAuth().currentUser) {
    throw new Error("尚未登入 Firebase。");
  }

  if (!patientId) {
    throw new Error("patientId 不可為空");
  }

  const patientSnap = await getDb()
    .collection("inneraPatients")
    .doc(patientId)
    .get();

  if (!patientSnap.exists) {
    throw new Error(`找不到患者：${patientId}`);
  }

  const patient = patientSnap.data();

  if (!patient.linked || !patient.firebaseUid) {
    throw new Error("此患者尚未連結心域");
  }

  const targetClinicId =
    clinicId ||
    window.INNERA_ACTIVE_CLINIC_ID;

    if (!targetClinicId) {
      throw new Error("缺少 clinicId");
    }

  const summarySnap = await getDb()
    .collection("clinicalShares")
    .doc(patient.firebaseUid)
    .collection("clinics")
    .doc(targetClinicId)
    .collection("aiSummaries")
    .doc("current")
    .get();

  if (!summarySnap.exists) {
    return null;
  }

  return summarySnap.data();
}

  async function getPatientMedications({
    patientId,
    clinicId
  } = {}) {
    if (!getAuth().currentUser) {
      throw new Error("尚未登入 Firebase。");
    }

    if (!patientId) {
      throw new Error("patientId 不可為空");
    }

    const patientSnap = await getDb()
      .collection("inneraPatients")
      .doc(patientId)
      .get();

    if (!patientSnap.exists) {
      throw new Error(`找不到患者：${patientId}`);
    }

    const patient = patientSnap.data();

    if (!patient.linked || !patient.firebaseUid) {
      throw new Error("此患者尚未連結心域");
    }

    const targetClinicId =
      clinicId ||
      window.INNERA_ACTIVE_CLINIC_ID;

    if (!targetClinicId) {
      throw new Error("缺少 clinicId");
    }

    const snapshot = await getDb()
      .collection("clinicalShares")
      .doc(patient.firebaseUid)
      .collection("clinics")
      .doc(targetClinicId)
      .collection("medications")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  function calculateSleepSummary(records) {
    const durationValues = records
      .map((r) => r.durationMinutes)
      .filter((value) => typeof value === "number");

    const qualityValues = records
      .map((r) => r.quality)
      .filter((value) => typeof value === "number");

    const avgDurationMinutes = durationValues.length
      ? Math.round(
          durationValues.reduce((sum, value) => sum + value, 0) /
            durationValues.length
        )
      : null;

    const avgQuality = qualityValues.length
      ? Math.round(
          (qualityValues.reduce((sum, value) => sum + value, 0) /
            qualityValues.length) *
            10
        ) / 10
      : null;

    return {
      recordCount: records.length,
      avgDurationMinutes,
      avgDurationHours:
        avgDurationMinutes == null
          ? null
          : Math.round((avgDurationMinutes / 60) * 10) / 10,
      avgQuality
    };
  }

  async function loadMyRecentSleep({ days = 30, clinicId } = {}) {
    const records = await getRecentSleepRecords({ days, clinicId });
    return {
      records,
      summary: calculateSleepSummary(records)
    };
  }

  window.InneraFirebase = {
    init,
    signInWithGoogle,
    signOut,

    getRecentSleepRecords,
    getPatientRecentSleepRecords,
    getPatientHealthEvents,
    getPatientDailyCheckIns,
    getPatientAiSummary,
    getPatientMedications,

    calculateSleepSummary,
    loadMyRecentSleep,

    get currentUser() {
      return getAuth().currentUser;
    }
  };
})();
