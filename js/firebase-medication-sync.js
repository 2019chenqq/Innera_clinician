// Firebase 登入後，將指定心域患者的目前分享用藥套用至完整個案頁。
// MVP：透過 P000001 -> inneraPatients.firebaseUid -> clinicalShares/{uid}/.../medications

(function () {
  function displayText(value) {
    return value == null || String(value).trim() === ""
      ? ""
      : String(value).trim();
  }

  function toPatientMedication(medication) {
    const genericName = displayText(medication?.nameEn);
    const name = displayText(medication?.name) || "未命名藥物";
    const dose = displayText(medication?.dose);
    const unit = displayText(medication?.unit);

    const times = Array.isArray(medication?.times)
      ? medication.times.map(displayText).filter(Boolean).join("、")
      : displayText(medication?.times);

    const detail =
      [dose ? [dose, unit].filter(Boolean).join(" ") : "", times]
        .filter(Boolean)
        .join("｜") || "—";

    return {
      genericName,
      name,
      detail
    };
  }

  async function getPatientMedications(patientId) {
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

    // 2. 用患者 App UID 讀取分享給該院所的用藥
    const snapshot = await db
      .collection("clinicalShares")
      .doc(patientUid)
      .collection("clinics")
      .doc(clinicId)
      .collection("medications")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async function syncMedications() {
    try {
      const service = window.InneraFirebase;
      const user = service?.currentUser;

      if (!service) {
        console.warn("[Innera] InneraFirebase 尚未載入，略過用藥同步。");
        return;
      }

      if (!user) {
        console.info("[Innera] Firebase 尚未登入，等待登入後再同步用藥。");
        return;
      }

      const patientId =
        window.INNERA_REAL_SLEEP_PATIENT_ID ||
        "P000001";

      const medications =
        await getPatientMedications(patientId);

      const patient =
        Array.isArray(window.patients)
          ? window.patients.find((item) => item.id === patientId)
          : (typeof patients !== "undefined"
              ? patients.find((item) => item.id === patientId)
              : null);

      if (!patient) {
        throw new Error(`找不到 ${patientId} 個案資料。`);
      }

      patient.medications =
        medications.map(toPatientMedication);

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

      console.info(
        `[Innera] ${patientId} 真實用藥載入成功：${medications.length} 筆。`
      );
    } catch (error) {
      console.error(
        "[Innera] 真實用藥載入失敗：",
        error
      );
    }
  }

  function initMedicationSync() {
    try {
      if (!window.InneraFirebase) {
        console.warn(
          "[Innera] 找不到 InneraFirebase，無法初始化用藥同步。"
        );
        return;
      }

      window.InneraFirebase.init();

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          syncMedications();
        }
      });
    } catch (error) {
      console.error(
        "[Innera] Firebase 用藥同步初始化失敗：",
        error
      );
    }
  }

  window.InneraMedicationSync = {
    refresh: syncMedications
  };

  document.addEventListener(
    "DOMContentLoaded",
    initMedicationSync
  );
})();
