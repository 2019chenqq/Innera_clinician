// firebase-config.js
// 把這裡的設定換成「同一個 Firebase 專案」的 Web App 設定。
// Firebase Console → 專案設定 → 您的應用程式 → Web App → SDK 設定與配置。

window.INNERA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAzx45aWvwhwkhAaxFleStLNF9qzqDXYIo",
  authDomain: "innera-demo.firebaseapp.com",
  projectId: "innera-demo",
  storageBucket: "innera-demo.firebasestorage.app",
  messagingSenderId: "37801791582",
  appId: "1:37801791582:web:61c4f41594ddd411fae4cf"
};

window.INNERA_APP_CHECK_SITE_KEY =
  "6LcwceEtAAAAAAkZT1URHQrFswrL0NPCWrEqq6Gt";

// 目前測試用院所 ID，要跟 App 端 ClinicalShareService 寫入時一致。
window.INNERA_DEMO_CLINIC_ID = "innera-demo-clinic";

window.INNERA_ENV = {
  activationUrl: "https://clinician.innerahealthcare.com/staff-activate-demo.html"
};