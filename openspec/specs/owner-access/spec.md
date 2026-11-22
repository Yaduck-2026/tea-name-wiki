# owner-access Specification

## Purpose

定義只有本人可上傳、編輯，其餘訪客唯讀的權限機制：本機密碼工作階段、密碼儲存、受保護資源與信任前提。

## Requirements

### Requirement: 只有本人可寫入

只有本人 SHALL 能上傳與編輯，其他訪客唯讀。公開版本 MUST NOT 部署寫入 API；前端停用按鈕不算權限驗證；管理密碼與 GitHub 權杖 MUST NOT 嵌入靜態檔。

#### Scenario: 訪客開啟公開網站

- **WHEN** 訪客開啟公開網站或公開的管理展示
- **THEN** 只能閱讀，沒有任何可用的寫入端點

### Requirement: 密碼工作階段驗證

本機管理 API SHALL 只在通過密碼工作階段驗證後才可使用，開啟管理首頁 MUST NOT 直接取得管理權。未登入時只能使用登入狀態查詢、首次設定與登入流程。

#### Scenario: 未登入讀取資料

- **WHEN** 未登入的請求呼叫 /api/state 或任一寫入 API
- **THEN** 回應 401，不回傳資料也不寫入

### Requirement: 首次設定由本人完成

管理密碼 SHALL 由本人第一次在本機設定。AI MUST NOT 代設、猜測密碼，也 MUST NOT 要求使用者在聊天中傳送密碼。密碼已設定後 MUST NOT 允許重複設定。

#### Scenario: 重複設定

- **WHEN** 已有密碼時再次呼叫首次設定
- **THEN** 請求被拒絕，原密碼不變

### Requirement: 密碼儲存

密碼 SHALL 以 scrypt 加獨立 salt 雜湊後存於 .local/admin-auth.json，只保存雜湊，MUST NOT 記錄輸入的明文。

#### Scenario: 設定密碼後

- **WHEN** 本人完成密碼設定
- **THEN** .local/admin-auth.json 只含 salt 與雜湊，任何檔案或日誌都沒有明文密碼

### Requirement: 工作階段限制

工作階段 cookie SHALL 設為 HttpOnly 與 SameSite=Strict，最長八小時。登出或服務重啟後工作階段 MUST 失效。登入失敗 SHALL 觸發暫時限制。

#### Scenario: 登出

- **WHEN** 本人登出後再用原 cookie 呼叫 API
- **THEN** 請求被拒絕

#### Scenario: 連續登入失敗

- **WHEN** 短時間內多次輸入錯誤密碼
- **THEN** 系統暫時拒絕後續登入嘗試

### Requirement: 受保護資源與來源檢查

原件、管理資料、版本及所有寫入 API SHALL 受工作階段保護。服務 SHALL 檢查 Origin、Host 並拒絕跨來源請求。

#### Scenario: 跨來源請求

- **WHEN** 其他網站的頁面向本機管理服務送出請求
- **THEN** 請求被拒絕

### Requirement: 信任前提與對外存取

此機制 SHALL 以本人控制本機 Windows 帳號與檔案為前提，不是雲端身分服務。若需要從公開網址登入寫入，MUST 先確認部署與驗證方式，MUST NOT 將本機服務直接對外暴露。

#### Scenario: 要求公開網址編輯

- **WHEN** 需求變成要從公開網址登入編輯
- **THEN** 先提出部署與驗證方案供本人確認，不直接開放本機服務
