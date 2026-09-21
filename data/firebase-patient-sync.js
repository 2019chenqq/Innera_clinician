// firebase-patient-sync.js
// MVP：即時監聽 Firestore inneraPatients，讓患者新增／連結狀態變更後
// 醫療端不需重新整理即可更新。
// 每次快照以目前院所的 Firestore 患者取代陣列內容。

(function () {
  let unsubscribePatients = null;
  let clinicRetryTimer = null;

  function getClinicId() {
    return window.INNERA_CURRENT_STAFF?.clinicId || window.INNERA_ACTIVE_CLINIC_ID;
  }

  function safeString(value, fallback = "") {
    const text = value == null ? "" : String(value).trim();
    return text || fallback;
  }

  function formatUpdatedTime(value) {
    if (!value) return "—";

    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "剛剛";
    if (diffMinutes < 60) return `${diffMinutes} 分鐘前`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} 小時前`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} 天前`;

    return `${date.getMonth() + 1}/${date.getDate()}`;
  }


  function toNumber(value, fallback = 9999) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function getPatientList() {
    if (Array.isArray(window.patients)) {
      return window.patients;
    }

    if (typeof patients !== "undefined" && Array.isArray(patients)) {
      return patients;
    }

    return null;
  }

  function firestorePatientToUi(data, docId) {
    const linked = data.linked === true;

    return {
      id: safeString(data.patientId, docId),
      fullName: safeString(data.legalName, "未命名個案"),

      queueNumber: toNumber(data.queueNumber, 9999),
      registrationTime: safeString(data.registrationTime, "—"),
      visitType: safeString(data.visitType, "複診"),

      linked,
      attention: data.attention === true,
      viewed: data.viewed === true,

      status: null,
      statusType: linked ? "stable" : null,

      mood: linked ? "—" : null,
      moodSub: linked ? "尚未串接" : null,

      sleep: linked ? "—" : null,
      sleepSub: linked ? "讀取中" : null,

      changes: [],

      updatedAt: data.updatedAt || null,
      updated: linked ? formatUpdatedTime(data.updatedAt) : "—",

      firebaseUid: data.firebaseUid || null,
      clinicId: data.clinicId || getClinicId(),

      // 用來辨識這筆是 Firestore 同步進來的患者。
      source: "firestore"
    };
  }

  function renderAfterSync() {
    if (typeof renderPatients === "function") {
      renderPatients();
    }

    if (typeof updateCounts === "function") {
      updateCounts();
    }

    if (typeof filterPatients === "function") {
      filterPatients();
    }
  }

  function applySnapshot(snapshot) {
    const list = getPatientList();
    if (!list) throw new Error("找不到前端 patients 陣列。");

    list.length = 0;
    snapshot.docs.forEach((doc) => {
      const incoming =
        firestorePatientToUi(doc.data(), doc.id);

      list.push(incoming);
    });

    renderAfterSync();

    console.info(
      `[Innera] Firestore 患者即時同步：${snapshot.size} 筆。`
    );

    document.dispatchEvent(
      new CustomEvent("innera-patients-synced", {
        detail: {
          count: snapshot.size,
          clinicId: getClinicId()
        }
      })
    );
  }

  function startRealtimePatientSync() {
    const service = window.InneraFirebase;

    if (!service) {
      console.warn(
        "[Innera] InneraFirebase 尚未載入，略過患者即時同步。"
      );
      return;
    }

    const user = service.currentUser;

    if (!user) {
      console.info(
        "[Innera] Firebase 尚未登入，等待登入後再啟動患者即時同步。"
      );
      return;
    }

    // 避免重複建立監聽器。
    if (unsubscribePatients) {
      unsubscribePatients();
      unsubscribePatients = null;
    }

    clearTimeout(clinicRetryTimer);
    const clinicId = getClinicId();
    if (!clinicId) {
      console.warn("[Innera] clinicId 尚未就緒，略過患者即時同步並等待院所資訊。");
      clinicRetryTimer = setTimeout(startRealtimePatientSync, 1000);
      return;
    }
    const db = firebase.firestore();

    unsubscribePatients = db
      .collection("inneraPatients")
      .where("clinicId", "==", clinicId)
      .onSnapshot(
        (snapshot) => {
          try {
            applySnapshot(snapshot);
          } catch (error) {
            console.error(
              "[Innera] 套用患者即時資料失敗：",
              error
            );
          }
        },
        (error) => {
          console.error(
            "[Innera] Firestore 患者即時監聽失敗：",
            error
          );
        }
      );

    console.info(
      `[Innera] 已啟動患者即時監聽：${clinicId}`
    );
  }

  function stopRealtimePatientSync() {
    clearTimeout(clinicRetryTimer);
    if (unsubscribePatients) {
      unsubscribePatients();
      unsubscribePatients = null;

      console.info(
        "[Innera] 已停止患者即時監聽。"
      );
    }
  }

  function initPatientSync() {
    try {
      if (!window.InneraFirebase) {
        console.warn(
          "[Innera] 找不到 InneraFirebase，無法初始化患者同步。"
        );
        return;
      }

      window.InneraFirebase.init();

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          startRealtimePatientSync();
        } else {
          stopRealtimePatientSync();
        }
      });
    } catch (error) {
      console.error(
        "[Innera] 患者即時同步初始化失敗：",
        error
      );
    }
  }

  window.InneraPatientSync = {
    // 保留 refresh 名稱，避免其他程式壞掉。
    refresh: async function () {
      startRealtimePatientSync();
    },
    start: startRealtimePatientSync,
    stop: stopRealtimePatientSync
  };

  document.addEventListener(
    "DOMContentLoaded",
    initPatientSync
  );
})();
