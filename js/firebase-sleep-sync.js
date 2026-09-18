// firebase-sleep-sync.js
// 正式 MVP 版：不顯示測試面板。
// 使用者已登入 Firebase 時，自動讀取 clinicalShares 的近 7 筆睡眠資料，
// 並套用到 P001 的今日門診／個案近況／完整個案資料。

(function () {
  let syncInProgress = false;
  let lastSyncedUid = null;
async function getPatientSleepRecords(patientId, days = 7) {
  if (!patientId) {
    throw new Error("patientId 不可為空。");
  }

  if (typeof firebase === "undefined") {
    throw new Error("Firebase SDK 尚未載入。");
  }

  const db = firebase.firestore();

  // 1. 用 Innera Patient ID 找到對應 App UID
  const patientSnap = await db
    .collection("inneraPatients")
    .doc(patientId)
    .get();

  if (!patientSnap.exists) {
    throw new Error(`找不到患者：${patientId}`);
  }

  const patientData = patientSnap.data();

  if (!patientData?.linked || !patientData?.firebaseUid) {
    throw new Error(`患者 ${patientId} 尚未完成心域連結。`);
  }

  const patientUid = patientData.firebaseUid;

  const clinicId =
    window.INNERA_DEMO_CLINIC_ID ||
    "innera-demo-clinic";

console.log("[Sleep Debug] patientId =", patientId);
console.log("[Sleep Debug] firebaseUid =", patientUid);
console.log("[Sleep Debug] clinicId =", clinicId);

  // 2. 讀取患者分享給目前院所的睡眠資料
  const snapshot = await db
  .collection("clinicalShares")
  .doc(patientUid)
  .collection("clinics")
  .doc(clinicId)
  .collection("sleepRecords")
  .limit(days)
  .get();

  // 趨勢圖要由舊到新排列
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    .reverse();
}
  async function syncRealSleepData() {
    if (syncInProgress) return;

    const inneraFirebase = window.InneraFirebase;
    if (!inneraFirebase) {
      console.warn("[Innera] InneraFirebase 尚未載入，略過睡眠同步。");
      return;
    }

    const user = inneraFirebase.currentUser;
    if (!user) {
      console.info("[Innera] Firebase 尚未登入，不同步 clinicalShares。");
      return;
    }

    syncInProgress = true;

    try {
      const patientId =
  window.INNERA_REAL_SLEEP_PATIENT_ID ||
  "P000001";

const records =
  await getPatientSleepRecords(patientId, 7);

const summary =
  inneraFirebase.calculateSleepSummary(records);

const data = {
  records,
  summary
};

        const patient =
        Array.isArray(window.patients)
          ? window.patients.find((item) => item.id === patientId)
          : (typeof patients !== "undefined"
              ? patients.find((item) => item.id === patientId)
              : null);

      if (!patient) {
        console.warn(`[Innera] 找不到要套用真實睡眠資料的個案：${patientId}`);
        return;
      }

      if (typeof applyRealSleepDataToPatient !== "function") {
        console.warn("[Innera] applyRealSleepDataToPatient 尚未載入。");
        return;
      }

      applyRealSleepDataToPatient(patient, data);
      window.INNERA_REAL_SLEEP_DATA = data;

      if (typeof renderPatients === "function") {
        renderPatients();
      }

// 如果目前正在查看這位病人的完整個案頁，
// Firebase 睡眠載入完成後立即重新渲染。
const detailPage =
  document.getElementById("patientDetailPage");

if (
  typeof state !== "undefined" &&
  state.activePatientId === patientId &&
  detailPage &&
  !detailPage.classList.contains("hidden") &&
  typeof renderPatientDetail === "function"
) {
  renderPatientDetail(patient);
}

      document.dispatchEvent(
        new CustomEvent("innera-real-sleep-loaded", {
          detail: {
            patientId,
            ...data
          }
        })
      );

      lastSyncedUid = user.uid;

      console.info(
        `[Innera] 真實睡眠同步完成：${data.summary?.recordCount ?? 0} 筆，` +
        `平均 ${data.summary?.avgDurationHours ?? "—"} 小時`
      );
    } catch (error) {
      console.error("[Innera] 真實睡眠同步失敗：", error);
    } finally {
      syncInProgress = false;
    }
  }

  function initSleepSync() {
    try {
      if (!window.InneraFirebase) {
        console.warn("[Innera] 找不到 InneraFirebase，無法初始化睡眠同步。");
        return;
      }

      window.InneraFirebase.init();

      firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
          lastSyncedUid = null;
          console.info("[Innera] Firebase 尚未登入，等待登入後再同步睡眠資料。");
          return;
        }

        if (lastSyncedUid === user.uid && window.INNERA_REAL_SLEEP_DATA) {
          return;
        }

        syncRealSleepData();
      });
    } catch (error) {
      console.error("[Innera] Firebase 睡眠同步初始化失敗：", error);
    }
  }

  window.InneraSleepSync = {
    refresh: syncRealSleepData
  };

  document.addEventListener("DOMContentLoaded", initSleepSync);
})();
