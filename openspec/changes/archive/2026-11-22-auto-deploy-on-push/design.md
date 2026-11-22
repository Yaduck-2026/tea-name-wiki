# Design

## Context

動機見 proposal.md。現況：`.github/workflows/pages.yml` 只有 `on: workflow_dispatch`；build 與 deploy 兩個 job 都有 `if: github.actor == github.repository_owner`；build 依序執行 `npm test` → `node scripts/check.mjs --public` → `npm run build`，任一步失敗 job 即失敗，deploy 依賴 build（`needs: build`）所以不會執行。`concurrency: group: pages, cancel-in-progress: false`。Repository 是 Yaduck-2026 的個人倉庫，沒有其他寫入協作者。

## Goals / Non-Goals

**Goals:**

- push 到 main 即自動部署，沿用現有的測試、檢查、建置步驟與擁有者限制。

**Non-Goals:**

- 不加排程（schedule）、不加 pull_request 觸發。
- 不改建置內容、不改網站程式。
- 不在本機 git hook 或 push 後自動呼叫 `gh workflow run`。

## Decisions

**1. 在 workflow 加上 `push: branches: [main]`，保留 `workflow_dispatch`。**
- 替代方案：本機推送後由 AI 或腳本執行 `gh workflow run`。需要本機 gh 以 Yaduck-2026 登入（目前 gh 登入的是另一個帳號），且只在透過特定腳本推送時才有效，不採用。

**2. 擁有者檢查沿用 `github.actor == github.repository_owner`。**
推送觸發時 `github.actor` 是推送者帳號；個人倉庫只有擁有者能推送到 main，所以條件在兩種觸發方式下都成立，不需另外改寫。

**3. 不使用 paths 過濾。**
建置約半分鐘，每次推送都部署成本很低；加上過濾規則反而可能漏掉需要更新的檔案（例如 AGENTS.md 也會輸出到網站）。

**4. concurrency 維持 `cancel-in-progress: false`。**
連續推送時排隊依序部署，最後一次推送的內容會是最後部署的版本；不中途取消正在執行的 Pages 部署，避免部署中斷。

## Risks / Trade-offs

- [推送了未通過測試的 commit] → build job 失敗、不部署，線上維持上一版；Actions 會顯示紅色失敗，需修正後再推送。
- [推送觸發時 checkout 的 raw/articles 原件不在 Repository] → 已用 `check.mjs --public` 可攜模式處理，缺少的私有原件只列警告，目前已驗證可通過。
- [日後若改用組織倉庫] → repository_owner 會是組織名稱，擁有者條件不再成立；docs/github-publishing.md 已註明需另指定允許的使用者。

## Migration Plan

1. 修改 workflow 並更新文件，commit 後 push 到 main。
2. 這次 push 本身就會觸發第一次自動部署；以 `gh run list` 確認觸發方式為 push、結論為 success，並確認線上內容已更新。
回復方式：revert 該 commit 即恢復只能手動部署。
