# Spec Delta

## REMOVED Requirements

### Requirement: 只能手動發布

**Reason**: 使用者要求推送後自動部署；「推送不觸發部署」的行為正是要取消的部分。
**Migration**: 由新增的「推送 main 或手動觸發時發布」取代；手動執行仍保留為備用，「產生公開版本只重建 dist」的規定原封不動移到新需求中。

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: 只限 Repository 擁有者

發布 workflow（不論是推送觸發或手動觸發）SHALL 只在執行者等於 repository_owner 時執行。發布至個人 Repository 時 MUST NOT 新增其他寫入協作者。沒有經過遠端連線查核前，MUST NOT 聲稱已完成 GitHub 權限設定。

#### Scenario: 非擁有者觸發

- **WHEN** repository_owner 以外的帳號推送或手動觸發 workflow
- **THEN** 建置與部署工作都不執行
