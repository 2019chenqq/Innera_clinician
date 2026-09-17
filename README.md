# Innera Clinician — 分檔版本

## 結構

- `index.html`：畫面結構
- `style.css`：目前全部樣式
- `data/patients.js`：門診列表用個案基本資料
- `data/patient-details.js`：完整個案頁 Demo 詳細資料
- `js/state.js`：共用狀態
- `js/ui.js`：Toast 等 UI 小工具
- `js/dashboard.js`：首頁列表、排序、搜尋、篩選、統計
- `js/drawer.js`：右側個案近況 Drawer
- `js/modals.js`：新增個案、邀請連結
- `js/patient-detail.js`：完整個案頁與圖表/紀錄
- `js/auth.js`：Demo 登入/登出
- `js/app.js`：啟動入口

## 注意
這版改成 ES Modules，所以請用 VS Code Live Server 或 GitHub Pages 開啟，
不要直接雙擊 `index.html` 用 `file://` 開啟。

# Innera Firestore Patients MVP

這一版把 P000001 從 patients.js 的手動 hard-code 移除，
改成登入 Firebase 後自動讀取：

inneraPatients
  -> where clinicId == innera-demo-clinic
  -> merge 到前端 patients
  -> renderPatients()
  -> updateCounts()

## 要替換 / 新增的檔案

1. 用這包的 patients.js 覆蓋原本 patients.js
2. 用這包的 dashboard.js 覆蓋原本 dashboard.js
3. 新增 firebase-patient-sync.js 到醫療端網站資料夾

## index.html script 順序

firebase-patient-sync.js 必須放在：
- Firebase SDK
- firebase-config.js
- firebase-service.js
- patients.js
- dashboard.js

之後。

建議：
<script src="firebase-config.js"></script>
<script src="firebase-service.js"></script>
<script src="patients.js"></script>
<script src="dashboard.js"></script>
<script src="firebase-patient-sync.js"></script>

你原本的 firebase-sleep-sync.js / firebase-medication-sync.js
放在 firebase-patient-sync.js 後面會比較穩。

## 成功訊息

重新整理並登入後 Console 應出現：

[Innera] Firestore 患者同步完成：1 筆。

然後「今日個案」應自動看到：
鄭○芩 / P000001

不再需要手動把 P000001 寫進 patients.js。

Innera 患者即時同步 MVP

1. 用 firebase-patient-sync.js 覆蓋你目前 js/firebase-patient-sync.js
2. 保持 index.html 的 script 順序：
   patients.js
   dashboard.js
   firebase-patient-sync.js
   firebase_sleep_sync.js
   firebase_medication-sync.js

3. Ctrl + Shift + R 重新整理。

測試：
- 醫療端開著 P000002，應顯示「尚未連結」
- App 輸入 P000002 的邀請碼並完成連結
- 不要重新整理醫療端
- 幾秒內 P000002 應自動變成「已連結心域」

Console 預期：
[Innera] 已啟動患者即時監聽：innera-demo-clinic
[Innera] Firestore 患者即時同步：2 筆。

注意：
這版只做患者主檔/linked 狀態即時更新，不會自動串 P000002 的睡眠與用藥。
