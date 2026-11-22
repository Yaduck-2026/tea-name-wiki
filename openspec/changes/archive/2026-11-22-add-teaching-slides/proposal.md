# Proposal

## Why

作業第二步要求「讓 AI 使用 Wiki 作為知識來源，製作一份教學型 HTML 簡報，讓原本不熟悉主題的人理解基本概念」；第三步要求說明 loop／graph 設計。目前 Wiki 已完成 8 份來源的 ingest，但還沒有簡報，也沒有說明整條流程的文件。

## What Changes

- 新增教學簡報「從茶名讀懂台灣茶」，對象是完全不懂茶的人：以「杉林溪龍鳳峽・青心烏龍・清香型・冬茶」為主軸，逐詞帶出產地、品種、製作風格、茶季，再補六大茶類、特色茶與沖泡，最後是讀茶名的提醒與小練習。
- 簡報內容由 AI 執行一次 Wiki query（先讀 index、再讀相關頁）後撰寫，存成一頁 Wiki 綜合頁（`wiki/syntheses/` 下，synthesisType 為 slide-deck），每張投影片都以相對連結標註依據的 Wiki 頁；這次 query 記在 wiki/log.md。
- 建置時把這頁轉成可瀏覽的 HTML 簡報，輸出到網站 `slides/`：可用鍵盤與點擊翻頁、手機可讀、沿用網站的茶文化雜誌風；首頁加上簡報入口。push 到 main 後隨自動部署上線。
- 檢查程式新增規則：簡報的每張投影片至少要有一個指向已公開 Wiki 頁的依據連結，否則 check 失敗。
- 投影片可放圖片（2026-11-22 追加）：簡報頁用 Markdown 圖片語法指定圖片；檔案存在時顯示圖片與圖說，不存在時顯示「圖片預留」框。圖片登記在 `assets/image-credits.json`。使用者決定採用 AI 生成、圖中帶文字的資訊圖：圖說一律標明「AI 生成示意圖，圖中文字未經本站查證，以投影片文字與依據頁為準」；與 Wiki 明確矛盾的圖不得使用，需重生。網站使用壓縮後的 JPG，原始 PNG 只留在本機。
- 另寫一份獨立文件說明本專案的 loop／graph：資料如何取得、ingest、查詢、整理、檢查、再產生簡報；回答「哪些步驟會重複、哪裡要檢查或重新生成、為什麼這樣設計」。這份文件不放進簡報。

## Capabilities

### New Capabilities

- `teaching-slides`：由 Wiki 產生的教學簡報——內容來源與引用規則、投影片格式、建置輸出位置、瀏覽操作、更新方式。

### Modified Capabilities

- `public-site`：「公開白名單」加入教學簡報的輸出（`slides/`）；簡報頁本身不出現在讀者站的文章列表中。

## Impact

- 新增：`wiki/syntheses/` 下的簡報頁、`site/slides.html`／`slides.css`／`slides.js`（簡報版型）、`docs/` 下的流程說明文件。
- 修改：`scripts/build.mjs`（輸出 slides/）、`scripts/check.mjs`（投影片依據規則）、`site/reader.js`（首頁入口）、`tests/admin.test.mjs`（建置與檢查測試）、wiki/index.md 與 wiki/log.md。
- 圖片（追加）：`assets/images/` 下的網頁用 JPG、`assets/image-credits.json`；build 複製被引用的圖片到 `dist/slides/images/`，check 新增圖片規則。
- 不影響：既有知識頁內容、管理介面的寫入功能、發布流程。
- 簡報只整理 Wiki 已有、且有來源的內容；不新增茶知識、不連網查資料。

## 假設（請審閱）

- 簡報約 12～15 張投影片，繁體中文、白話口語，專有名詞先解釋再舉例。
- 茶名示例沿用 Wiki 既有的教學組合，明示不是實際商品。
- 流程說明文件放在 `docs/`，只存在 Repository（GitHub 上可直接閱讀），不發布到網站；需要時再另提變更放上網站。
