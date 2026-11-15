# 茶名有解｜台灣茶知識 Wiki

從一個完整茶名開始，拆解產地、品種與風格。以台灣茶為主，提供六大茶類入門；AI 依規則維護 Markdown 知識，網站之後從 Wiki 產生。

## 目前狀態

已依確認的 Karpathy LLM Wiki 方案完成本地架構遷移：raw 來源版本、wiki 知識主檔、AGENTS.md 維護規則。已遷移 8 份內容與 8 個外部來源紀錄，並以使用者提供的更新訊息示範匯入及本地問答回存。

**本機管理網頁與公開閱讀站已製作並測試，尚未上傳 GitHub 或部署。** 八份外部原文尚未封存；製作網站不代表已重新查證。

## 開啟管理工作台

Windows 雙擊 [run-admin.cmd](run-admin.cmd)，再開啟 [http://127.0.0.1:4318](http://127.0.0.1:4318)。也可在專案資料夾執行 `npm run admin`。服務需保持運作，停止按 Ctrl+C。

管理功能現在需要本人密碼登入。首次使用在本機自行設定，沒有預設密碼；訪客仍可看公開閱讀站。密碼雜湊存 .local/，不提交 GitHub。詳見 [權限設計與驗證](docs/access-control.md)。

功能包含原件上傳／下載、待整理清單、知識編輯、Markdown 預覽、狀態與引用管理、版本還原、健康檢查、操作紀錄與公開版本產生。上傳不會自動生成已查證內容；PDF 僅封存，沒有 OCR 或模型整合。

詳見 [操作說明](docs/admin-guide.md)、[測試報告](docs/admin-test-report.md)、[GitHub 發布準備](docs/github-publishing.md)。

## 開始閱讀

- [Wiki 索引](wiki/index.md)：分類及每頁摘要。
- [知識總覽](wiki/overview.md)：從茶名開始的閱讀路線。
- [操作紀錄](wiki/log.md)：實際 migration、ingest、query、lint 歷程。
- [AGENTS.md](AGENTS.md)：AI 的協作規則。
- [內容指南](docs/content-guide.md)、[任務指令](docs/ai-prompts.md)。
- [遷移結果](docs/migration-v2.md)、[製作進度](docs/progress.md)。

## 如何操作

1. 你提供資料或要求搜尋，AI 保存來源，再整合已有知識頁與關聯，更新 index 和 log。
2. 你提問，AI 先讀索引及相關頁回答；明確要求存回時，才保存為比較或綜合頁。
3. 你要求檢查，AI 做結構檢查與內容檢視，留下未解決問題。

不自動更新、不定期排程。站內搜尋及本地指令不對外找資料；新研究仍須手動要求。首版沒有網站模型聊天，不需 API 金鑰。Obsidian 可選，不是必要依賴。

## 本地指令

需要 Node.js 20 以上，使用內建模組，無須 npm install。

- `npm run check`：檢查 Wiki 結構、連結、索引、來源及 raw hashes；不判斷茶知識真偽。
- `npm run index`：由現有頁面更新本地 index.md，不搜尋、不做內容摘要生成；使用各頁已寫好的 summary。
- `npm run query -- 青心烏龍`：本地關鍵字查找，列出頁面；不是自動回答引擎。

- `npm run admin`：啟動本機寫入管理介面。
- `npm run build`：產生 dist/ 公開閱讀站與唯讀管理展示。
- `npm test`：隔離副本的 API／資料與公開輸出測試。
- `npm run test:browser`：本機 Chrome／Edge 實際操作測試，驗證腳本需 Node.js 22 以上及可用瀏覽器。

管理介面「使用說明」也可產生公開版本；本機服務運作時，從右上「公開閱讀」或 /preview/ 預覽。不直接雙擊 HTML 檔，避免缺少服務而無法讀取資料。

## 主檔與歷史資料

- raw/：封存來源，manifest 留存 hashes。references 是定位資料，不是原文。
- wiki/：Markdown 知識唯一主檔，sources 內為可修訂摘要。
- templates/*.md：現行內容模板；config/：六大分類。
- content/、sources/registry.json、templates/*.json：保留的舊版歷史資料，不再編輯或供網站讀取。
- docs/legacy/json-v1/：舊規則及原檔 hashes。

不要重新執行歷史 migrate-v1.py 覆寫已維護的 Wiki；它在 index 存在時會拒絕執行。

## 公開與資料界線

raw 原件預設不提交 GitHub，也不自動放入網站；發布前另做範圍審查。網站只輸出可公開 Wiki 與必要資產，來源頁提供整理及外部連結，不公開本地原件路徑。

GitHub Repository：[Yaduck-2026/tea-name-wiki](https://github.com/Yaduck-2026/tea-name-wiki)，已由使用者建立；專案上傳尚未完成。公開網站：尚未部署。.github/workflows/pages.yml 已準備手動測試、建置與 Pages 發布流程，遠端尚未執行。上傳以本資料夾為根目錄，不包含外層 ai-study-garden 草稿。
