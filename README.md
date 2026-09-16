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
