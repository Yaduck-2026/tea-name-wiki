# Proposal

## Why

`raw/articles/user-update-policy-v1.md` 已不再使用，也不在本機，導致 `npm run check` 嚴格模式一直有 3 個錯誤。現行規則只有「原件遺失 = 錯誤」，沒有「刻意不再保留原件」的合法狀態；而 raw 封存與 log 都不能改寫，所以不能用刪紀錄或改 hash 的方式消掉錯誤。

同時，專案的開發規格已搬進 OpenSpec，但開發紀錄仍寫在 `docs/progress.md`，AGENTS.md 也還要求每次討論同步 progress。使用者決定之後的開發規格與紀錄都改用 OpenSpec。

## What Changes

- 新增「退役原件」狀態：raw/manifest.json 的紀錄可標記 `retired`（日期與原因），保留原本的路徑與 SHA-256 作為歷史。
- `npm run check` 嚴格模式：已退役的原件不存在時不列錯誤；若檔案仍在，照樣核對 hash。只有 log 可以保留指向已退役原件的舊連結，其他 Wiki 頁指向已退役原件仍列錯誤。
- 來源頁的 `originalAvailable` 改表示「目前是否可取得原件」：原件退役後設為 false，與 manifest 的檢查改為依退役狀態比對。
- 退役 `user-update-policy-v1.md`：manifest 標記退役；來源頁移除原件連結並說明已退役，摘要與相關頁內容不變；log 追加退役紀錄，不改寫 2026-11-15 的舊紀錄。
- 開發紀錄改由 OpenSpec change（提案、設計、任務、封存）保存；`docs/progress.md` 加上停止更新說明後凍結為歷史紀錄。
- AGENTS.md 移除「先讀 progress」與「每次討論同步 progress 與外層討論檔」的規定，並新增原件退役的維護規則；依使用者要求，AGENTS.md 不提及 OpenSpec。
- 內容指南同步退役規則與新增資料流程；README 將 progress 標為歷史紀錄。

## Capabilities

### New Capabilities

- `development-records`：軟體需求與開發紀錄的保存方式——以 OpenSpec change 記錄需求變更、實作與驗證，`docs/progress.md` 為凍結的歷史紀錄，Wiki 內容操作仍記在 wiki/log.md。

### Modified Capabilities

- `admin-console`：「檢查模式」需求改為——嚴格模式對已退役原件的缺檔不列錯誤，未退役的缺檔仍是錯誤。

## Impact

- 程式：`scripts/check.mjs`（退役判斷、log 例外、originalAvailable 比對）；`tests/admin.test.mjs` 新增退役情境測試。管理服務透過同一個 check 取得結果，不需另改；原件下載已依 `originalAvailable` 拒絕，不需另改。
- 資料：`raw/manifest.json`（一筆加 `retired`，hash 不變）、`wiki/sources/user-update-policy.md`、`wiki/log.md`（追加）。
- 規則與文件：AGENTS.md、docs/content-guide.md、docs/progress.md、README.md。
- 公開網站：user-message 來源本來就不輸出，知識頁不變；但建置會一併輸出 AGENTS.md，線上 AGENTS.md 要手動重新部署才會更新。

## 假設（請審閱）

- 來源頁 `user-update-policy` 與綜合頁 `manual-update-policy` 保留：手動更新政策仍有效，只是不再保留原始訊息檔。
- 部署或排錯這類沒有需求變更的操作，不另外寫紀錄檔；以 git 歷史與 GitHub Actions 紀錄為準。
