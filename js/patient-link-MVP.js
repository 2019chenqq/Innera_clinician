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
    legalName,
    queueNumber = null,
    visitType = null
  }) {
    const user = authUser();
    const firestore = db();
    const clinicId = activeClinicId();

    const cleanLegalName =
      String(legalName || "").trim();

    if (!cleanLegalName) {
      throw new Error("請輸入患者姓名");
    }

    const counterRef =
      firestore
        .collection("inneraCounters")
        .doc("patients");

    return firestore.runTransaction(
      async (tx) => {
        const counterSnap =
          await tx.get(counterRef);

        const current =
          counterSnap.exists
            ? Number(
                counterSnap.data().lastNumber || 0
              )
            : 0;

        const next = current + 1;

        const patientId =
          formatPatientId(next);

        const patientRef =
          firestore
            .collection("inneraPatients")
            .doc(patientId);

        tx.set(
          counterRef,
          {
            lastNumber: next,
            updatedAt:
              firebase.firestore.FieldValue
                .serverTimestamp()
          },
          { merge: true }
        );

        tx.set(
          patientRef,
          {
            patientId,

            legalName:
              cleanLegalName,

            clinicId,

            // App 兌換之前都是 null
            firebaseUid: null,

            linked: false,

            linkedAt: null,

            // MVP 門診欄位；
            // 未來可由掛號系統覆蓋
            queueNumber:
              queueNumber == null
                ? null
                : Number(queueNumber),

            visitType:
              visitType || null,

            createdByUid:
              user.uid,

            createdAt:
              firebase.firestore.FieldValue
                .serverTimestamp(),

            updatedAt:
              firebase.firestore.FieldValue
                .serverTimestamp()
          }
        );

        return {
          patientId,
          legalName: cleanLegalName,
          clinicId
        };
      }
    );
  }

  async function createInvite({
    patientId,
    expiresHours = 24
  }) {
    const user = authUser();

    const firestore = db();
    const clinicId = activeClinicId();

    const cleanPatientId =
      String(patientId || "").trim();

    if (!cleanPatientId) {
      throw new Error("缺少患者編號");
    }

    const patientRef =
      firestore
        .collection("inneraPatients")
        .doc(cleanPatientId);

    const patientSnap =
      await patientRef.get();

    if (!patientSnap.exists) {
      throw new Error(
        `找不到患者 ${cleanPatientId}`
      );
    }

    const patient =
      normalizePatient(patientSnap);

    assertSameClinic(patient);

    if (patient.linked === true) {
      throw new Error(
        "此患者已經連結心域"
      );
    }

    let code = null;
    let inviteRef = null;

    for (let i = 0; i < 8; i++) {
      const candidate =
        randomInviteCode();

      const ref =
        firestore
          .collection("inneraInvites")
          .doc(candidate);

      const snap =
        await ref.get();

      if (!snap.exists) {
        code = candidate;
        inviteRef = ref;
        break;
      }
    }

    if (!code || !inviteRef) {
      throw new Error(
        "無法產生唯一邀請碼，請再試一次"
      );
    }

    const numericExpiresHours =
      Number(expiresHours);

    const safeExpiresHours =
      Number.isFinite(numericExpiresHours) &&
      numericExpiresHours > 0
        ? numericExpiresHours
        : 24;

    const expiresAt =
      new Date(
        Date.now() +
        safeExpiresHours *
          60 *
          60 *
          1000
      );

    await inviteRef.set({
      code,

      patientId:
        cleanPatientId,

      clinicId,

      legalName:
        patient.legalName || "",

      status:
        "unused",

      usedByUid:
        null,

      usedAt:
        null,

      expiresAt:
        firebase.firestore.Timestamp
          .fromDate(expiresAt),

      createdByUid:
        user.uid,

      createdAt:
        firebase.firestore.FieldValue
          .serverTimestamp()
    });

    return {
      code,
      patientId: cleanPatientId,
      legalName:
        patient.legalName || "",
      expiresAt
    };
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
