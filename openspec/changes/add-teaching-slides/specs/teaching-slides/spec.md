# Spec Delta

## Purpose

定義由 TeaWIKI 產生的教學型 HTML 簡報：內容只能來自已公開的 Wiki 並逐張標註依據，建置後發布到網站，讓不懂茶的人能循序理解台灣茶的基本概念。

## ADDED Requirements

### Requirement: 簡報內容以 Wiki 綜合頁保存

教學簡報的內容 SHALL 存成一頁 Wiki 綜合頁（kind 為 synthesis、synthesisType 為 slide-deck），以二級標題（`## `）分隔每張投影片。簡報 MUST NOT 另外以手寫 HTML 維護第二份內容。

#### Scenario: 修改簡報內容

- **WHEN** 要修改某張投影片的文字
- **THEN** 修改的是 wiki/syntheses/ 下的簡報頁，重新建置後網站上的簡報隨之更新

### Requirement: 每張投影片標註依據

每張投影片 SHALL 至少有一個相對連結指向已公開的 Wiki 知識頁、茶名頁或來源頁，作為該張內容的依據。缺少依據連結或連到非公開頁時，check MUST 列為錯誤。封面張除外。

#### Scenario: 投影片缺少依據

- **WHEN** 簡報頁中某張非封面投影片沒有任何指向 Wiki 頁的連結
- **THEN** npm run check 列出錯誤並以非零代碼結束

#### Scenario: 依據指向草稿

- **WHEN** 投影片的依據連結指向 status 不是 published 的頁面
- **THEN** npm run check 列出錯誤

### Requirement: 內容只取自 Wiki 已知

簡報 SHALL 只整理 Wiki 中已有、且有來源支持的內容，MUST NOT 加入 Wiki 沒有的茶知識、療效說法或商品推薦。教學用的茶名組合 SHALL 標明是示例。

#### Scenario: 撰寫茶名拆解投影片

- **WHEN** 投影片介紹「杉林溪龍鳳峽・青心烏龍・清香型・冬茶」
- **THEN** 投影片寫明這是教學組合示例，不是實際商品，且每個詞的說明都能在依據頁中找到

### Requirement: 產生過程記為 Wiki query

產生或大幅改寫簡報時，AI SHALL 先讀 wiki/index.md 與相關 Wiki 頁，並在 wiki/log.md 追加一筆 query 紀錄，列出讀取的頁面、回存的簡報頁與限制。

#### Scenario: 首次產生簡報

- **WHEN** AI 完成簡報頁
- **THEN** wiki/log.md 有一筆 query 條目，列出讀取頁與回存的簡報頁

### Requirement: 發布到網站 slides 路徑

npm run build SHALL 將簡報頁轉成 HTML 簡報，輸出到 dist/slides/。投影片中的依據連結 SHALL 連到讀者站對應的文章頁。首頁 SHALL 提供前往簡報的入口。

#### Scenario: 開啟簡報

- **WHEN** 讀者從首頁點選簡報入口
- **THEN** 開啟 slides/ 頁面，看到第一張投影片與總張數

#### Scenario: 點選依據連結

- **WHEN** 讀者點選投影片上的依據連結
- **THEN** 開啟讀者站中該 Wiki 頁的文章內容

### Requirement: 簡報瀏覽操作

簡報 SHALL 可用鍵盤左右方向鍵、畫面上的上一張／下一張按鈕翻頁，並顯示目前張數；SHALL 能直接以網址開啟指定張數；SHALL 在手機寬度可閱讀且不需水平捲動；SHALL 沿用網站的茶文化雜誌風配色。

#### Scenario: 鍵盤翻頁

- **WHEN** 讀者在簡報頁按下右方向鍵
- **THEN** 切換到下一張，張數顯示隨之更新

#### Scenario: 直接開啟第 5 張

- **WHEN** 讀者開啟網址 slides/#5
- **THEN** 直接顯示第 5 張投影片

#### Scenario: 手機閱讀

- **WHEN** 讀者以手機寬度開啟簡報
- **THEN** 文字與表格可完整閱讀，頁面不需要水平捲動
