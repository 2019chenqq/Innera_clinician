// patient-link-mvp.js
// 心域 B2B MVP：
// 1. 建立心域患者編號 P000001...
// 2. 建立一次性邀請碼
// 3. 監聽患者是否已在 App 兌換
//
// 前置條件：
// - 已載入 Firebase compat SDK
// - 已載入 firebase-config.js
// - 已登入 Firebase Auth
//
// Firestore collections:
// inneraCounters/patients
// inneraPatients/{patientId}
// inneraInvites/{CODE}

(function () {
  const CLINIC_ID =
    window.INNERA_DEMO_CLINIC_ID || "innera-demo-clinic";

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

  function formatPatientId(n) {
    return `P${String(n).padStart(6, "0")}`;
  }

  function randomInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (n) => chars[n % chars.length]).join("");
  }

  async function createPatient({ legalName, queueNumber = null, visitType = null }) {
    const user = authUser();
    const firestore = db();

    const counterRef = firestore.collection("inneraCounters").doc("patients");

    return firestore.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const current = counterSnap.exists
        ? Number(counterSnap.data().lastNumber || 0)
        : 0;

      const next = current + 1;
      const patientId = formatPatientId(next);
      const patientRef = firestore.collection("inneraPatients").doc(patientId);

      tx.set(counterRef, {
        lastNumber: next,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      tx.set(patientRef, {
        patientId,
        legalName: String(legalName || "").trim(),
        clinicId: CLINIC_ID,

        // App 兌換之前都是 null
        firebaseUid: null,
        linked: false,
        linkedAt: null,

        // MVP 門診欄位；未來可由掛號系統覆蓋
        queueNumber: queueNumber == null ? null : Number(queueNumber),
        visitType: visitType || null,

        createdByUid: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { patientId, legalName: String(legalName || "").trim() };
    });
  }

  async function createInvite({ patientId, expiresHours = 24 }) {
    authUser();
    const firestore = db();

    const patientRef = firestore.collection("inneraPatients").doc(patientId);
    const patientSnap = await patientRef.get();

    if (!patientSnap.exists) {
      throw new Error(`找不到患者 ${patientId}`);
    }

    const patient = patientSnap.data();
    if (patient.linked === true) {
      throw new Error("此患者已經連結心域");
    }

    // 避免極低機率撞碼
    let code = null;
    let inviteRef = null;

    for (let i = 0; i < 8; i++) {
      const candidate = randomInviteCode();
      const ref = firestore.collection("inneraInvites").doc(candidate);
      const snap = await ref.get();
      if (!snap.exists) {
        code = candidate;
        inviteRef = ref;
        break;
      }
    }

    if (!code || !inviteRef) {
      throw new Error("無法產生唯一邀請碼，請再試一次");
    }

    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

    await inviteRef.set({
      code,
      patientId,
      clinicId: patient.clinicId || CLINIC_ID,
      legalName: patient.legalName || "",

      status: "unused",
      usedByUid: null,
      usedAt: null,

      expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return {
      code,
      patientId,
      legalName: patient.legalName || "",
      expiresAt
    };
  }

  function watchPatient(patientId, onChange) {
    authUser();
    return db()
      .collection("inneraPatients")
      .doc(patientId)
      .onSnapshot((snap) => {
        if (!snap.exists) return;
        onChange({ id: snap.id, ...snap.data() });
      });
  }

  async function getPatient(patientId) {
    authUser();
    const snap = await db().collection("inneraPatients").doc(patientId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  async function listClinicPatients() {
    authUser();
    const snap = await db()
      .collection("inneraPatients")
      .where("clinicId", "==", CLINIC_ID)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  window.InneraPatientLinkMVP = {
    createPatient,
    createInvite,
    watchPatient,
    getPatient,
    listClinicPatients
  };
})();
