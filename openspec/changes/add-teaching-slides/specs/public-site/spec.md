# Spec Delta

## MODIFIED Requirements

### Requirement: 公開白名單

公開輸出 SHALL 採白名單，只納入：已公開的概念頁、茶名頁、非 user-message 的來源摘要、具有 evidenceLevel 的觀察綜合頁，已公開的教學簡報（只輸出到 slides/，不列入讀者站的文章資料），以及簡報引用且已登記出處的圖片。輸出 MUST 排除 raw、research、index、log、內部政策、示範問答、草稿、備份與私有資料。

#### Scenario: 草稿不輸出

- **WHEN** 某 Wiki 頁的 status 為 draft 或 review
- **THEN** 該頁不出現在 dist/ 的任何輸出中

#### Scenario: 指向非公開檔案的連結

- **WHEN** 公開頁內有連結指向非公開的 Wiki 頁或 raw 檔案
- **THEN** 輸出時移除該連結，只保留連結文字

#### Scenario: 教學簡報的輸出位置

- **WHEN** 已公開的教學簡報頁被建置
- **THEN** 它只出現在 dist/slides/，不出現在 public-data.json 的文章列表中
