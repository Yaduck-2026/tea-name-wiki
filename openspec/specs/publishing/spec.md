# publishing Specification

## Purpose

定義上傳 GitHub 與部署公開網站的方式：只能手動觸發、只限 Repository 擁有者、上傳前檢查公開範圍，並以實際結果交付。

## Requirements

### Requirement: 只能手動發布

GitHub 發布流程 SHALL 只由 workflow_dispatch 手動啟動，MUST NOT 排程執行，也 MUST NOT 進行內容搜尋或自動整理。管理介面的「產生公開版本」SHALL 只重建 dist，MUST NOT 上傳或部署。

#### Scenario: 推送程式碼

- **WHEN** 有新的 commit 推送到 Repository
- **THEN** 不會自動觸發建置或部署

#### Scenario: 管理介面產生公開版本

- **WHEN** 管理者按下「產生公開版本」
- **THEN** 只更新本機 dist/，沒有任何上傳或部署動作

### Requirement: 只限 Repository 擁有者

手動 workflow SHALL 只在執行者等於 repository_owner 時執行。發布至個人 Repository 時 MUST NOT 新增其他寫入協作者。沒有經過遠端連線查核前，MUST NOT 聲稱已完成 GitHub 權限設定。

#### Scenario: 非擁有者觸發

- **WHEN** repository_owner 以外的帳號觸發 workflow
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
