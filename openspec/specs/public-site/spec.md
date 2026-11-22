# public-site Specification

## Purpose

定義由 Wiki 建置的公開靜態網站：建置方式、公開白名單、連結映射、頁面必要元素、站內搜尋、圖片授權及關於頁。

## Requirements

### Requirement: 由 published Wiki 建置靜態網站

系統 SHALL 以 Node.js 20 以上，從 status 為 published 的 Wiki 頁建置靜態網站，使用共用 HTML／CSS／JavaScript，輸出至 dist/。系統 MUST NOT 由 dist 回寫 Wiki。可執行的指令以 package.json 為準，build／preview 實作後才可宣稱可執行。

#### Scenario: 執行建置

- **WHEN** 執行 npm run build
- **THEN** dist/ 只由 published Wiki 與允許的資產產生，wiki/ 內容不被修改

### Requirement: 公開白名單

公開輸出 SHALL 採白名單，只納入：已公開的概念頁、茶名頁、非 user-message 的來源摘要，以及具有 evidenceLevel 的觀察綜合頁。輸出 MUST 排除 raw、research、index、log、內部政策、示範問答、草稿、備份與私有資料。

#### Scenario: 草稿不輸出

- **WHEN** 某 Wiki 頁的 status 為 draft 或 review
- **THEN** 該頁不出現在 dist/ 的任何輸出中

#### Scenario: 指向非公開檔案的連結

- **WHEN** 公開頁內有連結指向非公開的 Wiki 頁或 raw 檔案
- **THEN** 輸出時移除該連結，只保留連結文字

### Requirement: 來源頁公開範圍

source 頁 SHALL 可公開整理摘要及外部連結，但原件 MUST NOT 因來源頁公開而一併公開；rawRefs MUST 僅供本地維護。

#### Scenario: 公開來源頁

- **WHEN** 一篇 published 的 source 頁被建置
- **THEN** 輸出包含摘要與外部網址，不包含原件內容或本機 raw 路徑

### Requirement: 子路徑部署與連結映射

網站 SHALL 支援部署在專案子路徑下。內部連結 MUST 由同一映射產生，將 Markdown 路徑轉為公開頁面位址，且 MUST NOT 曝露本機 raw 路徑。

#### Scenario: 子路徑部署

- **WHEN** 網站部署在 /tea-name-wiki/ 之類的子路徑
- **THEN** 所有內部連結與資源都能正確開啟

### Requirement: 頁面必要元素

公開頁 SHALL 保留文末來源、茶名示例的限制說明、相關條目、清楚的鍵盤焦點與表單標籤。

#### Scenario: 茶名示例頁

- **WHEN** 讀者開啟茶名示例頁
- **THEN** 頁面標明示例性質（illustrative 或 source-based）、文末列出知識來源並提供相關條目

### Requirement: 站內搜尋

訪客站內搜尋 SHALL 只查詢既有公開內容，MUST NOT 觸發對外研究或模型呼叫。查無結果時 SHALL 顯示無結果提示。

#### Scenario: 查無結果

- **WHEN** 訪客搜尋沒有任何符合的詞
- **THEN** 顯示無結果提示，不發出任何對外請求

### Requirement: 圖片出處與授權

網站使用的圖片 SHALL 在 assets/image-credits.json 記錄出處與授權。沒有使用依據的社群圖片 MUST NOT 使用；原創或生成圖片 SHALL 標示為示意。

#### Scenario: 加入新圖片

- **WHEN** 公開頁加入一張圖片
- **THEN** assets/image-credits.json 有該圖片的出處與授權紀錄

### Requirement: 關於頁

關於頁 SHALL 說明網站規則與 AI 協作流程，並提供實際 AGENTS.md 的可讀入口。

#### Scenario: 閱讀協作規則

- **WHEN** 讀者在關於頁點選 AGENTS.md 入口
- **THEN** 開啟隨網站一同輸出的 AGENTS.md 內容

### Requirement: 唯讀管理展示

公開輸出 SHALL 可包含管理介面的唯讀展示，但 MUST NOT 包含任何寫入 API 或可寫入的功能。

#### Scenario: 開啟公開管理展示

- **WHEN** 訪客開啟公開網站上的管理介面
- **THEN** 只能瀏覽公開資料，所有寫入操作都無法執行
