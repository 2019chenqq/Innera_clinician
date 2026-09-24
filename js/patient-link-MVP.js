// patient-link-MVP.js
// 心域 B2B MVP：
// 1. 建立心域患者編號 P000001...
// 2. 建立一次性邀請碼
// 3. 監聽患者是否已在 App 兌換
// 4. 依目前登入者的 clinicId 隔離院所資料
//
// 前置條件：
// - 已載入 Firebase compat SDK
// - 已載入 firebase-config.js
// - 已登入 Firebase Auth
// - auth.js 已設定 window.INNERA_CURRENT_STAFF / window.INNERA_ACTIVE_CLINIC_ID
//
// Firestore collections:
// inneraCounters/patients
// inneraPatients/{patientId}
// inneraInvites/{CODE}

(function () {
  "use strict";

  function db() {
    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK 尚未載入");
    }

    return firebase.firestore();
  }

  function authUser() {
    const user = firebase.auth().currentUser;

    if (!user) {
      throw new Error("請先登入醫療端 Firebase 帳號");
    }

    return user;
  }

  function activeClinicId() {
    const clinicId =
      window.INNERA_CURRENT_STAFF?.clinicId ||
      window.INNERA_ACTIVE_CLINIC_ID;

    if (!clinicId) {
      throw new Error("目前登入帳號沒有院所資訊");
    }

    return String(clinicId).trim();
  }

  function formatPatientId(n) {
    return `P${String(n).padStart(6, "0")}`;
  }

  function randomInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(8);

    crypto.getRandomValues(bytes);

    return Array.from(
      bytes,
      (n) => chars[n % chars.length]
    ).join("");
  }

  function normalizePatient(snapshot) {
    if (!snapshot?.exists) return null;

    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }

  function assertSameClinic(patient) {
    const clinicId = activeClinicId();

    if (!patient) {
      throw new Error("找不到患者資料");
    }

    if (!patient.clinicId) {
      throw new Error("此患者尚未設定所屬院所");
    }

    if (patient.clinicId !== clinicId) {
      throw new Error("你沒有操作此患者的權限");
    }

    return clinicId;
  }

  async function createPatient({
    legalName
  }) {
    authUser();

    const cleanLegalName =
      String(legalName || "").trim();

    if (!cleanLegalName) {
      throw new Error("請輸入患者姓名");
    }

    const result =
      await firebase
        .app()
        .functions("us-central1")
        .httpsCallable(
          "createClinicPatient"
        )({
          legalName: cleanLegalName
        });

    return result.data;
  }

  async function createInvite({
    patientId,
    expiresHours = 24
  }) {
    authUser();
    const result = await firebase.app().functions("us-central1")
      .httpsCallable("createClinicInvite")({ patientId, expiresHours });
    return { ...result.data, expiresAt: new Date(result.data.expiresAt) };
  }

  function watchPatient(
    patientId,
    onChange,
    onError = null
  ) {
    authUser();

    const clinicId =
      activeClinicId();

    const cleanPatientId =
      String(patientId || "").trim();

    if (!cleanPatientId) {
      throw new Error("缺少患者編號");
    }

    return db()
      .collection("inneraPatients")
      .doc(cleanPatientId)
      .onSnapshot(
        (snap) => {
          if (!snap.exists) return;

          const patient =
            normalizePatient(snap);

          if (
            patient.clinicId !== clinicId
          ) {
            console.warn(
              "[Innera] 阻擋跨院所患者監聽",
              {
                patientId:
                  cleanPatientId,
                activeClinicId:
                  clinicId,
                patientClinicId:
                  patient.clinicId
              }
            );

            return;
          }

          if (
            typeof onChange === "function"
          ) {
            onChange(patient);
          }
        },
        (error) => {
          console.error(
            "[Innera] 患者監聽失敗",
            error
          );

          if (
            typeof onError === "function"
          ) {
            onError(error);
          }
        }
      );
  }

  async function getPatient(patientId) {
    authUser();

    const cleanPatientId =
      String(patientId || "").trim();

    if (!cleanPatientId) {
      throw new Error("缺少患者編號");
    }

    const snap =
      await db()
        .collection("inneraPatients")
        .doc(cleanPatientId)
        .get();

    if (!snap.exists) {
      return null;
    }

    const patient =
      normalizePatient(snap);

    assertSameClinic(patient);

    return patient;
  }

  async function listClinicPatients() {
    authUser();

    const clinicId =
      activeClinicId();

    const snap =
      await db()
        .collection("inneraPatients")
        .where(
          "clinicId",
          "==",
          clinicId
        )
        .get();

    return snap.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data()
      })
    );
  }

  window.InneraPatientLinkMVP = {
    createPatient,
    createInvite,
    watchPatient,
    getPatient,
    listClinicPatients
  };
})();
