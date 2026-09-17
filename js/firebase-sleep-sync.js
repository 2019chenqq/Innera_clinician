// firebase-sleep-sync.js
// 正式 MVP 版：不顯示測試面板。
// 使用者已登入 Firebase 時，自動讀取 clinicalShares 的近 7 筆睡眠資料，
// 並套用到 P001 的今日門診／個案近況／完整個案資料。

(function () {
  let syncInProgress = false;
  let lastSyncedUid = null;

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
      const records =
  await inneraFirebase.getPatientRecentSleepRecords({
    patientId: "P000001",
    days: 7,
    clinicId:
      window.INNERA_DEMO_CLINIC_ID ||
      "innera-demo-clinic"
  });

const summary =
  inneraFirebase.calculateSleepSummary(records);

const data = {
  records,
  summary
};

      const patientId = window.INNERA_REAL_SLEEP_PATIENT_ID || "P000001";
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
