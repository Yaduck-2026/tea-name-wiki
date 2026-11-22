# Tasks

## 1. 檢查器：投影片依據規則

- [x] 1.1 在 `scripts/check.mjs` 加入 slide-deck 規則：去掉「維護註記」後以 `## ` 切分，封面以外每張至少一個連結指向 published 的 concept、tea-name 或 source 頁，否則報「投影片缺少依據」。驗證：1.2 的測試通過
- [x] 1.2 在 `tests/admin.test.mjs` 新增測試：隔離副本中建立一頁 slide-deck，(a) 每張都有依據時 check 無相關錯誤；(b) 刪掉某張的依據連結時報錯；(c) 依據指向草稿時報錯。驗證：`npm test` 全部通過

## 2. 建置與簡報版型

- [x] 2.1 新增 `site/slides.html`、`site/slides.css`、`site/slides.js`：讀取 `deck.json`，支援方向鍵／PageUp／PageDown／Home／End 與按鈕翻頁、`#N` 網址、張數顯示、換頁焦點移到標題、「依據：」段落樣式、手機寬度不水平捲動，配色沿用讀者站。驗證：2.3 建置後在瀏覽器實際操作（見 4.2）
- [x] 2.2 修改 `scripts/build.mjs`：挑出 published 的 slide-deck 頁，切分投影片、以 `renderMarkdown` 轉 HTML（連結改指向 `../#article/<id>`，非公開連結只留文字），寫出 `dist/slides/deck.json` 並複製版型檔；確認該頁不在 `public-data.json`。驗證：2.4 的測試通過
- [x] 2.3 在 `site/reader.js` 首頁加入「教學簡報」入口，連到 `./slides/`。驗證：建置後首頁 HTML 程式含此連結
- [x] 2.4 在 `tests/admin.test.mjs` 新增建置測試：有 slide-deck 頁時 `dist/slides/index.html`、`deck.json` 存在，張數正確，連結指向 `../#article/`，且 `public-data.json` 不含該頁。驗證：`npm test` 全部通過

## 3. 簡報內容（Wiki query）

- [x] 3.1 依 AGENTS.md query 流程讀 wiki/index.md 與相關頁（茶名示例、六個分類頁、相關來源頁），依 design 大綱撰寫 `wiki/syntheses/tea-name-slides.md`：白話口語、名詞先解釋再舉例、每張一個重點、每張以「依據：」連到依據頁、茶名組合標明示例、不加入 Wiki 沒有的說法。驗證：`npm run check` 0 errors
- [x] 3.2 逐張核對：每張的每個事實句都能在其依據頁找到；把核對結果（張數、有無修正）寫進簡報頁的「維護註記」。驗證：核對清單無未解決項
- [x] 3.3 執行 `npm run index` 更新索引，並在 wiki/log.md 追加 query 紀錄（讀取頁、回存簡報頁、限制）。驗證：index 含簡報頁、log 只有新增行

## 4. 流程說明文件與整體驗證

- [x] 4.1 撰寫 `docs/llm-wiki-loop.md`：Mermaid 流程圖，並回答「哪些步驟會重複、哪裡檢查或重新生成、為什麼這樣設計」，附本專案實例；README 文件清單加上連結。驗證：文件含流程圖與三個問題的答案
- [x] 4.2 執行 `npm test`、`npm run check`、`node scripts/check.mjs --public`、`npm run build`；在瀏覽器實際開啟 `dist/slides/`（桌機與手機寬度）測試鍵盤翻頁、`#5` 直接開啟、依據連結跳到讀者站文章。驗證：全部通過；若無法操作瀏覽器，明確回報哪些項目未驗證
  - 實測結果（Chrome，本機靜態伺服器）：封面與 15 張正常顯示；方向鍵、End、Home、「下一張」按鈕、`#5` 直接開啟、依據連結跳到讀者站文章、首頁入口皆正常；390 寬 iframe 逐張檢查 15 張皆無水平捲動；主控台無錯誤。視窗無法縮小（resize 未生效），手機寬度改以 390×844 iframe 驗證。
  - 實測中發現並修正：(1) 快速連按方向鍵會漏掉翻頁（改為按鍵當下更新張數）；(2) 封面分頁標題重複；(3) 翻頁後標題出現焦點框（只對標題取消，按鈕與連結保留）。另修正 1.2／2.4 測試未考慮真實簡報頁存在的問題。

## 5. 投影片圖片（2026-11-22 追加）

- [x] 5.1 以 Windows .NET 將使用者提供的 PNG 轉為寬 1200 像素 JPG（04、05 不轉），`.gitignore` 排除 `assets/images/*.png`；建立 `assets/image-credits.json` 紀錄。驗證：每張 JPG 小於 500 KB，出處表每筆欄位齊全
- [x] 5.2 修改 `scripts/build.mjs`：抽出投影片中的圖片行，產生 `image` 欄位（存在時複製到 `dist/slides/images/`，不存在時 `missing`），圖說依出處表組合示意與未查證提醒。驗證：5.5 測試通過
- [x] 5.3 修改 `site/slides.js`、`slides.css`：顯示圖片與圖說、預留框、兩欄／置中版面。驗證：5.7 瀏覽器實測
- [x] 5.4 修改 `scripts/check.mjs`：圖片路徑須在 assets/images、每張最多一張、存在的圖片須有出處紀錄（錯誤）、缺檔只列提醒。驗證：5.5 測試通過
- [x] 5.5 在 `tests/admin.test.mjs` 新增測試：缺出處報錯、缺檔為預留且只提醒、建置複製圖片並產生圖說。驗證：`npm test` 全部通過
- [x] 5.6 在簡報頁 8 張投影片加入圖片行；第 9 張保留標題與依據，文字改寫為圖片替代文字。驗證：`npm run check` 0 errors，提醒只有 04、05 缺檔
- [x] 5.7 瀏覽器實測：有圖、預留框、只有圖片的第 9 張、手機寬度。驗證：記錄結果；無法驗證的項目明確回報
  - 實測結果（Chrome）：6 張圖片皆載入、第 4、5 張顯示預留框、第 9 張為置中圖片版面；390 寬 iframe 中第 1、3、4、9、12 張順序為標題、圖、內文，皆無水平捲動。實測中把「只有圖片」版面的圖高限制為畫面 68%，避免要捲動才看得到整張。資訊圖小字在手機上偏小但可讀。

## Workflow follow-up

- commit 並 push 到 main，確認自動部署成功、線上 slides/ 可開啟。
- 使用者審閱簡報內容後封存此 change（`/opsx:archive`）。
