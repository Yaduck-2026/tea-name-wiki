# Proposal

## Why

目前公開網站只能由 workflow_dispatch 手動部署：每次 push 之後，都要到 GitHub Actions 按一次 Run workflow，網站才會更新。使用者覺得這一步很麻煩，也容易忘記，導致線上內容落後本機（例如 2026-11-22 兩次都要提醒才部署）。

## What Changes

- **BREAKING（行為改變）**：推送到 `main` 分支時，自動執行既有流程：測試 → 公開模式檢查 → 建置 → 部署 GitHub Pages。不再需要手動按 Run workflow。
- 保留 workflow_dispatch 手動執行，當作重新部署或排錯時的備用入口。
- 維持不變的限制：只有 repository_owner 觸發才執行；不排程、不定期執行；workflow 不做任何內容搜尋或自動整理；任何一步失敗就不部署，線上網站維持上一版。
- 管理介面的「產生公開版本」仍只重建本機 dist，不上傳或部署（不變）。
- 更新說明文件中「推送不會自動更新網站、需手動執行 workflow」的敘述。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `publishing`：「只能手動發布」改為「推送 main 或手動觸發時發布」；擁有者限制改為同時涵蓋推送與手動觸發；新增「失敗時不部署」的情境。

## Impact

- 設定：`.github/workflows/pages.yml` 的觸發條件（新增 `push: branches: [main]`）與說明註解。
- 文件：README.md、docs/github-publishing.md。
- 不影響：網站程式、Wiki 內容、本機管理介面、測試。
- 使用上的影響：之後每次 push 到 main 都會部署；推送前要確定本機 `npm test` 與 check 都通過，否則部署會失敗（網站不會壞，只是不更新）。

## 假設（請審閱）

- 每次推送到 main 都部署，不依檔案路徑過濾（例如只改 openspec/ 也會重新部署）。理由：建置只需約半分鐘、成本低，且規則更單純，不會發生「改了卻沒更新」的情況。
- 只對 `main` 分支自動部署；其他分支不觸發。
