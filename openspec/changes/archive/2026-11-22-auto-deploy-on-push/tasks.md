# Tasks

## 1. Workflow 觸發條件

- [x] 1.1 在 `.github/workflows/pages.yml` 的 `on:` 加上 `push: branches: [main]`，保留 `workflow_dispatch`；更新開頭註解為「推送 main 或手動執行時建置與發布；不做內容搜尋、不排程」。build 與 deploy 的擁有者條件不變。驗證：以 Node 讀檔確認 `on` 區塊同時含 push（branches 只有 main）與 workflow_dispatch，且沒有 schedule、pull_request

## 2. 文件

- [x] 2.1 更新 docs/github-publishing.md：發布步驟改為「推送 main 會自動部署，手動 Run workflow 為備用」，修改「workflow 僅在手動啟動時運作」與「workflow 保持手動」兩處敘述。驗證：文件中不再有「需手動重新執行工作流程」之類的過期說法
- [x] 2.2 更新 README.md「公開與資料界線」中「推送不會自動更新網站」的敘述，並在第 37 行旁註明「不自動更新」指的是茶內容研究，不是網站部署。驗證：README 對部署的描述與新的 workflow 一致

## 3. 整體驗證

- [x] 3.1 本機執行 `npm test`、`node scripts/check.mjs --public`、`npm run build`，皆通過（推送後 workflow 會跑同樣的步驟）。驗證：測試全過、公開檢查 0 errors、建置成功
- [x] 3.2 （實作時發現並經使用者同意追加）修正 `tests/admin.test.mjs` 的退役測試：原本要求嚴格檢查完全 0 錯誤，在不含 raw/articles 原件的 GitHub 環境會失敗並擋下部署；改為只斷言沒有與退役原件相關的錯誤或警告。驗證：本機與模擬 CI 環境（移除 raw/articles）的 `npm test` 皆 12/12 通過

## Workflow follow-up

- commit 並 push 到 main 後，用 `gh run list` 確認出現 event 為 push、結論為 success 的執行，並核對線上網站已是最新內容。
- 確認後封存此 change（`/opsx:archive`）。
