# Design

## Context

動機見 proposal.md。現況：

- `scripts/build.mjs` 從 published Wiki 依白名單挑頁，用 `scripts/markdown.mjs` 轉 HTML，寫出 `public-data.json` 給讀者站（`site/reader.*`）使用。synthesis 頁只有帶 `evidenceLevel` 的才會公開。
- `markdown.mjs` 支援標題、段落、清單、表格、引言、連結；文字先跳脫，不執行原始 HTML、不顯示圖片。
- `scripts/check.mjs` 已會檢查所有相對連結是否存在、公開頁不可連到草稿。
- AGENTS.md 規定「搜尋資料及網站由 Wiki 生成，不人工維護第二份內容」，以及 query 成果可回存到 `syntheses/`。
- 網站已設定 push 到 main 自動部署。

## Goals / Non-Goals

**Goals:**

- 一份給初學者的教學簡報，內容可追溯到 Wiki，並隨建置自動上線。
- 一份獨立的 loop／graph 說明文件。

**Non-Goals:**

- 不做動畫、演講者備註、匯出 PDF／PPTX。圖片只在簡報支援（2026-11-22 追加），讀者站文章仍不顯示圖片。
- 不新增或修改茶知識內容；Wiki 缺的內容就不放進簡報。
- 不做通用的多份簡報管理介面（目前只有一份）。

## Decisions

**1. 簡報內容存成 Wiki 綜合頁，而不是手寫 HTML。**
檔案：`wiki/syntheses/tea-name-slides.md`，`kind: synthesis`、`synthesisType: "slide-deck"`、`provenance: "wiki-query"`。H1 與第一個 `## ` 之前的文字是封面；之後每個 `## ` 是一張投影片；結尾的「維護註記」照既有慣例不輸出。
- 理由：符合「不維護第二份內容」與「query 成果回存 Wiki」；依據連結直接沿用 check 的相對連結檢查；之後修改簡報就是改 Markdown。
- 替代方案：在 `site/` 手寫 `slides/index.html`。內容會變成 Wiki 之外的第二份知識，引用也要另寫解析，不採用。

**2. 建置時另外輸出簡報，不放進讀者站的文章資料。**
build 另外挑出 `synthesisType === "slide-deck"` 且 published 的頁面，把每張投影片用 `renderMarkdown` 轉成 HTML（連結規則與讀者站相同，但前綴改成 `../#article/<id>`，指向讀者站），寫成 `dist/slides/deck.json`；版型 `site/slides.html`、`slides.css`、`slides.js` 複製到 `dist/slides/`。這頁沒有 `evidenceLevel`，所以原本的白名單本來就不會把它放進 `public-data.json`，不需改動既有挑選邏輯。

**3. 「依據：」段落以樣式區分。**
撰寫慣例沿用其他 Wiki 頁：每張投影片的依據寫成以「依據：」開頭的段落。slides.js 把這類段落加上較小的字級與分隔線，當作投影片的出處列。

**4. check 新增投影片依據規則。**
對 `synthesisType === "slide-deck"` 的頁面：去掉「維護註記」後，以 `## ` 切分；封面以外的每張投影片至少要有一個連結解析到 kind 為 concept、tea-name 或 source，且 status 為 published 的 Wiki 頁，否則報錯「投影片缺少依據」。

**5. 翻頁與網址。**
slides.js 讀 `deck.json`，以 `location.hash`（`#1`～`#N`）記錄目前張數；支援左右方向鍵、PageUp/PageDown、Home/End 與畫面按鈕；換頁時把焦點移到投影片標題，方便鍵盤與螢幕閱讀器使用。配色沿用 `reader.css` 的米白、深茶綠、茶褐。

**6. 流程說明文件。**
`docs/llm-wiki-loop.md`，用 Mermaid 流程圖（GitHub 會直接顯示）畫出：使用者授權 → 取得原文（raw）→ ingest（來源摘要、整合知識頁、index、log）→ check／lint → query（讀 index 與相關頁）→ 撰寫並回存簡報頁 → check → build → push 自動部署。文中回答三個問題：哪些步驟會重複、哪裡會檢查或重新生成、為什麼這樣設計；並以本專案實際發生的例子說明（例如核對原文後修正六大茶類說法、退役原件、CI 測試擋下部署）。

**7. 投影片圖片（2026-11-22 追加）。**
- 語法：投影片中單獨一行 `![替代文字](../../assets/images/<檔名>)`。build 在轉 Markdown 前把這一行抽出，不交給 `renderMarkdown`（讀者站與管理預覽維持不顯示圖片），改存成投影片資料的 `image` 欄位：`{ src, alt, caption, missing }`。
- 檔案存在：複製到 `dist/slides/images/`，`src` 為 `images/<檔名>`；圖說取自出處表。檔案不存在：`missing: true`，slides.js 顯示虛線「圖片預留」框與替代文字。
- 版面：有圖又有文字時，桌機以兩欄（文字左、圖右）呈現，手機改為標題、圖、文字的順序；只有標題、圖片與「依據」的投影片，圖片置中放大。
- 出處表 `assets/image-credits.json`：每筆 `{ file, caption, kind: "ai-generated"|"original"|"licensed", tool, createdAt, textVerified, original, notes }`；`kind` 為 ai-generated 或 original 時圖說前加「示意圖：」，`textVerified` 為 false 時圖說後加未查證提醒。
- 檔案大小：原始 PNG（約 2 MB）只留本機（以 .gitignore 排除 `assets/images/*.png`），網站使用 Windows .NET 轉出的寬 1200 像素 JPG。
- 替代方案：直接用原始 PNG，每張約 2 MB、共約 17 MB，手機載入太慢，不採用。

## 投影片圖片清單（2026-11-22 使用者提供）

| 張 | 檔名（網站用） | 狀態 |
| --- | --- | --- |
| 1 封面 | slide-01-cover.jpg | 使用；照片，無文字 |
| 3 產地 | slide-03-origin.jpg | 使用；圖中 9 個產地與標點未經查證 |
| 4 品種 | slide-04-cultivar.jpg | 使用第二版；第一版把臺茶 18 號標成紅烏龍、稱青心烏龍適應性強，已依只含 Wiki 文字的 prompt 重生，圖中文字已查證 |
| 5 風格 | slide-05-style.jpg | 使用第二版；第一版製程漏殺菁、順序錯，已重生，圖中文字已查證 |
| 8 六大茶類 | slide-08-tea-colors.jpg | 使用；代表茶與風味描述未經查證 |
| 9 發酵程度 | slide-09-ferment.jpg | 使用；內容與 Wiki 一致，本張改為標題＋圖片，原文字改寫為替代文字 |
| 11 東方美人 | slide-11-leafhopper.jpg | 使用；「防禦機制」「紅褐色為關鍵特徵」未經查證 |
| 12 沖泡 | slide-12-brewing.jpg | 使用；只有短標語 |

## 簡報大綱（草案，實作時依 query 結果微調）

1. 封面：從茶名讀懂台灣茶
2. 一個茶名，其實是四個問題（展示完整茶名與四格拆解表）
3. 產地：杉林溪龍鳳峽——茶名裡的地名、五大茶區、高山茶 1,000 公尺
4. 品種：青心烏龍——品種不等於茶類、大葉種與小葉種
5. 風格：清香型與焙香型——生茶與熟茶
6. 茶季：冬茶——冬茶與冬片不同
7. 白話翻譯：把整個茶名說成一句話，並說明這是教學示例
8. 六大茶類：名稱看顏色，分辨靠製程
9. 另一個「六」：台灣特色茶六類風味輪
10. 特色茶例子：東方美人與著蜒
11. 沖泡：先看泡法再看秒數（杯泡、茶壺法、冷泡對照）
12. 讀茶名的提醒：名稱能告訴你什麼、不能告訴你什麼
13. 小練習：試著拆解「阿里山・青心烏龍」
14. 這份簡報的資料來源（列出依據的來源頁）

## Risks / Trade-offs

- [Markdown 只有基本格式，視覺較樸素] → 以大標題、表格、留白與雜誌風配色彌補；本次不加圖片。
- [AI 撰寫時加入 Wiki 沒有的說法] → 撰寫時逐張對照依據頁；check 只能確認「有依據連結」，不能確認內容正確，因此實作時另做逐張人工式核對並在 log 記錄。
- [內容太多，初學者讀不完] → 每張投影片控制在一個重點、約 3～5 行或一張小表格。

## Migration Plan

實作完成、本機測試與檢查通過後 commit 並 push 到 main，自動部署會發布 slides/。回復方式：revert 該 commit。
