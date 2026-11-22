# publishing Specification

## Purpose

定義上傳 GitHub 與部署公開網站的方式：推送 main 或手動觸發、只限 Repository 擁有者、失敗不部署、上傳前檢查公開範圍，並以實際結果交付。

## Requirements

### Requirement: 推送 main 或手動觸發時發布

GitHub 發布流程 SHALL 在推送到 main 分支時自動執行，也 SHALL 保留 workflow_dispatch 手動執行作為備用。發布流程 MUST NOT 排程執行，也 MUST NOT 進行內容搜尋或自動整理。管理介面的「產生公開版本」SHALL 只重建 dist，MUST NOT 上傳或部署。

#### Scenario: 推送到 main

- **WHEN** 擁有者推送新的 commit 到 main 分支
- **THEN** 自動執行測試、公開模式檢查、建置與 GitHub Pages 部署，不需要手動按 Run workflow

#### Scenario: 推送到其他分支

- **WHEN** 有 commit 推送到 main 以外的分支
- **THEN** 不觸發建置或部署

#### Scenario: 手動重新部署

- **WHEN** 擁有者在 Actions 頁面手動執行 workflow
- **THEN** 以 main 目前的內容重新測試、建置並部署

#### Scenario: 管理介面產生公開版本

- **WHEN** 管理者按下「產生公開版本」
- **THEN** 只更新本機 dist/，沒有任何上傳或部署動作

### Requirement: 失敗時不部署

發布流程中的測試、公開模式檢查或建置任一步失敗時，SHALL 停止流程且 MUST NOT 部署；線上網站 SHALL 維持上一次成功部署的版本。

#### Scenario: 測試失敗

- **WHEN** 推送後 npm test 有任何一項失敗
- **THEN** 不執行建置與部署，GitHub Actions 顯示失敗，線上網站內容不變

### Requirement: 只限 Repository 擁有者

發布 workflow（不論是推送觸發或手動觸發）SHALL 只在執行者等於 repository_owner 時執行。發布至個人 Repository 時 MUST NOT 新增其他寫入協作者。沒有經過遠端連線查核前，MUST NOT 聲稱已完成 GitHub 權限設定。

#### Scenario: 非擁有者觸發

- **WHEN** repository_owner 以外的帳號推送或手動觸發 workflow
- **THEN** 建置與部署工作都不執行

### Requirement: 上傳前檢查公開範圍

公開網站與公開 Repository 的範圍 SHALL 分開處理，上傳 GitHub 前也 MUST 依白名單檢查。Repository MUST NOT 包含金鑰、管理密碼、GitHub 權杖、.local/ 內容，或被忽略的 raw/articles、raw/social 原件。

#### Scenario: 公開副本缺少私有原件

- **WHEN** 在不含 raw/articles、raw/social 的公開副本執行 check --public
- **THEN** 缺少的原件只列為提醒，存在的原件仍核對 hash，檢查可通過

### Requirement: 以實際結果交付

發布流程 SHALL 在部署前執行測試、公開模式檢查與建置。交付時 MUST 以實際成功結果與網址為準，MUST NOT 把預期網址說成已上線。

#### Scenario: 部署尚未成功

- **WHEN** workflow 尚未執行成功
- **THEN** 回報中不提供正式網址，也不聲稱網站已上線
