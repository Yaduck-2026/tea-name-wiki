# Spec Delta

## Purpose

定義 TeaWIKI 軟體需求與開發紀錄的保存位置：需求變更以 OpenSpec change 記錄，舊的進度檔凍結為歷史，Wiki 內容操作仍記在 Wiki 紀錄。

## ADDED Requirements

### Requirement: 需求變更以 OpenSpec change 記錄

產品、網站、發布、管理介面與權限的需求變更 SHALL 以 openspec/changes 下的 change 記錄，包含提案、規格差異、任務與驗證結果；完成後 SHALL 封存並合併進 openspec/specs。

#### Scenario: 新增或修改功能

- **WHEN** 要新增或修改網站、管理介面或發布流程的行為
- **THEN** 先建立 OpenSpec change 並經使用者審閱，實作與驗證結果記在該 change 的任務中

#### Scenario: 變更完成

- **WHEN** 一個 change 的任務全部完成並驗證
- **THEN** change 被封存，主規格反映新的需求

### Requirement: 進度檔凍結為歷史

docs/progress.md SHALL 保留為 2026-11-22 以前的歷史紀錄，開頭註明已停止更新；之後的開發紀錄 MUST NOT 再追加到該檔。

#### Scenario: 完成一次開發工作

- **WHEN** 完成一次程式或規則的修改
- **THEN** 紀錄寫在對應的 OpenSpec change，docs/progress.md 內容不變

### Requirement: Wiki 內容操作仍記在 Wiki 紀錄

ingest、query、lint 與原件退役等 Wiki 內容操作 SHALL 繼續追加在 wiki/log.md，MUST NOT 改記到 OpenSpec。

#### Scenario: 匯入一份新來源

- **WHEN** AI 依使用者提供的資料完成 ingest
- **THEN** 紀錄追加在 wiki/log.md，不建立 OpenSpec change
