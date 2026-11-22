# 製作進度

更新日期：2026-11-16。

## 已確認的專案

- 名稱：茶名有解｜台灣茶知識 Wiki。
- 六大茶類入門、台灣茶為重點，AI 協作維護，不提供即時聊天。
- 首頁以茶名拆解和六大分類為主，另外呈現近期話題。
- 自行找近 7 天公開社群討論，統整後查證，附帳號、原貼文及知識來源。
- 茶文化雜誌風；米白、深茶綠、茶褐；素材需有公開使用依據。
- 使用者已確認討論完成，並另確認遷移為 Karpathy 模式；目前已完成 Markdown Wiki 主幹與本地操作示範。
- 使用者接續要求第二步，並補充主要官方來源、白話舉例寫法，以及僅手動要求搜尋時更新 TeaWIKI。

## 階段表

| 步驟 | 內容 | 狀態 |
| --- | --- | --- |
| 1 | 正式 AGENTS.md、模板與目錄結構 | 已完成，結構檢查見下方 |
| 2 | 首批茶知識、茶名及近期話題的來源研究與查證 | 已完成；社群資料不足，提供實際觀察限制說明 |
| 2A | raw／Markdown Wiki／schema 遷移與 ingest、query、lint 示範 | 已完成本地遷移；新茶原文匯入仍待手動提供或研究授權 |
| 3 | 共用版型、公開閱讀站與管理介面 | 已完成本地版本 |
| 4 | 搜尋、分類操作及 Wiki 交叉連結 | 已完成並做瀏覽器測試 |
| 5 | 試新增一篇條目，驗證延伸流程 | 已在隔離副本驗證上傳、引用與新增草稿，未混入正式茶知識 |
| 6 | 建置、連結、操作與手機閱讀檢查 | 已完成本地測試，詳見管理測試報告 |
| 7 | GitHub 上傳與公開部署 | 尚未開始 |
| 8 | 作業繳交說明及正式連結 | 尚未開始 |

## 第一步交付

- AGENTS.md：目的、範圍、六大分類、資料格式、查證、茶名拆解、觀察規則、視覺、工作流程及驗收。
- 三種內容 JSON 模板、一筆來源模板與研究 Markdown 模板。
- 六大分類設定、空白來源目錄及圖片授權目錄。
- README、內容指南、可重複使用的 AI 指令。
- 空資料夾用 .gitkeep 保留，未放入假知識、假帳號或假來源。
- 與外層同一份討論文件同步本次確認及成果。

## 第一步當時的驗證與限制（歷史紀錄）

已用 Python 執行結構檢查並通過：7 份 JSON 均可解析；六大分類 ID 順序正確；三種內容模板具備共用欄位且狀態為 draft；必要文件及目錄存在；來源目錄及實際內容保持空白。首次透過 PowerShell 管線比較中文時受到編碼影響，改為穩定分類 ID 比對後通過。

尚無網站程式、建置工具或瀏覽器成果；不能以本步的結構檢查代替日後內容查證與網站驗收。尚未上傳 GitHub，尚無正式網址。

## 下一步

已完成 Markdown Wiki、本機管理網頁及公開閱讀版本，詳見 [操作說明](admin-guide.md) 與 [測試報告](admin-test-report.md)。下一步處理 GitHub 帳號連線及 Repository 上傳、手動 Pages 發布；目前沒有遠端成功網址。新茶研究仍只由使用者手動要求。

帳號連線等必要操作在上傳時再處理；不要求使用者現在提供密碼或金鑰。原先 ai-study-garden 草稿保留在外層，不屬於本專案。

## 第二步交付與驗證（JSON v1 歷史紀錄）

- 完成 6 篇基礎知識，六大主分類各 1 篇；每篇以口語說明並提供例子。
- 完成使用者提供的完整茶名拆解，明示組合示例及來源適用範圍。
- 完成 8 筆可讀來源及 2 份研究紀錄，主要採使用者指定的官方平台與茶改場教材。
- 近七天觀察區間：2026-11-08T22:47:19+08:00～2026-11-15T22:47:19+08:00。沒有合格社群原貼文，故提供資料不足說明，不虛構熱門話題或帳號引用。
- Python 檢查通過：8 份內容、8 筆來源，分類覆蓋、來源引用、內部 ID、茶名詞語、研究路徑及七天區間均正確。
- 尚無網站，因此未執行建置或瀏覽器檢查。published 為可供之後建置的資料狀態，不是已上線。
- 使用者補充手動更新要求後，停止追加搜尋，只整理當輪已取得資料；無排程。
- 詳細文章與檔案入口見 [研究成果摘要](research-summary.md)。

## 規則同步核對

- 使用者詢問 AGENTS.md 是否同步，已核對手動觸發、口語寫作及專有名詞舉例規則均存在。
- 本次補上使用者指定的食農平台與茶改場名稱、網址，以及引用具體文章和官方刊載版本的規則，避免只在來源目錄中記錄。
- 未追加來源搜尋或更新茶知識內容；仍停留第二步完成狀態。

## AGENTS.md 完整性檢查

- 依使用者要求，比對 AGENTS.md、指南、模板、分類與現有資料，修正七組可能誤解的規則；詳見 [檢查報告](agents-review.md)。
- 補上兩種搜尋的區別、資料狀態與網站部署的區別、複核責任、關聯與網址、觀察邊界、來源呈現及歷史內容處理。
- 修正內容指南與階段紀錄中的過期敘述，未改變已確認範圍；目前沒有新決策需要使用者確認。
- 本輪僅核對及修訂文件，不對外搜尋，不修改茶知識資料，不執行部署。

## Karpathy LLM Wiki 方向更正

- 使用者提供 Karpathy 的 llm-wiki Gist 並指定要實作此模式；已讀作者正文。
- 先前資料建置成果保留，但原規則尚缺 raw／Markdown Wiki 的主幹及 ingest／query／lint 操作流程。
- 建立架構調整方案及遷移順序，在 AGENTS.md／README 標示舊架構暫停適用。
- 上述為提出方案當時的狀態；使用者後續已確認，遷移結果見下一節。

## Markdown Wiki 遷移完成

- AGENTS.md、內容指南、任務指令與現行 Markdown 模板均已轉換為三層架構。
- 22 個 Wiki 頁面、9 個 raw 封存紀錄；舊版 8 份內容及來源目錄原檔 hashes 未變。
- 實際 ingest 示範來源為使用者原訊息，query 為已標示的本地示範，lint 分工具及內容檢視；未假稱新取得茶文章全文。
- npm run index、check、query 均實際執行。check：0 errors、8 warnings；八項提醒為外部原文未封存。
- 隔離副本能偵測 raw 原件變動及失效連結；原工作區封存未變。
- 詳情：[遷移報告](migration-v2.md)、[健康檢查](wiki-health-review.md)、[Wiki 索引](../wiki/index.md)、[操作紀錄](../wiki/log.md)。
- 未做網站、建置／預覽指令、公開發布或新一輪茶資料研究。

## 本機管理介面與公開閱讀站｜2026-11-16

- 依使用者需求完成真實寫檔的本機管理服務，包含來源上傳／下載、待整理工作、條目編輯、預覽、來源與關聯、版本還原、衝突處理、健康檢查及日誌。
- 公開閱讀站由 Markdown 建置，16 頁內容；另提供唯讀 admin 展示，不在 GitHub Pages 假裝可寫。
- npm test：10／10；Chrome 10 類互動測試通過，1440×1000 及 390×844，0 執行期例外。測試資料放隔離副本。
- 私有原件缺失的公開副本仍可建置；嚴格本地模式維持缺檔錯誤，現存原件始終比對 hash。
- 提供 run-admin.cmd、管理指南、測試報告及手動 GitHub Actions workflow。尚未上傳或部署；上架後仍需驗證遠端結果。
- AGENTS.md 及內容指南同步管理流程、草稿日誌例外、user-document 來源、公開範圍及檢查模式。

## 本機連線排查｜2026-11-16

- 使用者截圖顯示 ERR_CONNECTION_REFUSED；實際測得 127.0.0.1:4318 當時沒有可回應的服務。
- 已在正式專案啟動管理服務並保持運作；確認管理首頁、帶工作階段的資料 API 與公開預覽均回應 HTTP 200，資料 API 回傳 22 個 Wiki 頁面。
- 未修改茶資料或功能程式。服務若因終端機關閉或電腦重啟而停止，需重新執行 run-admin.cmd 或 npm run admin；本機網址不是已部署的永久網站。

## 本人管理權限｜2026-11-16

- 使用者要求只有本人可上傳／編輯，訪客唯讀。已完成本機密碼設定、登入、登出與伺服器端 API 驗證，開啟首頁不再自動取得管理權。
- 正式密碼由本人在本機初次設定，AI 未代設；scrypt 加鹽雜湊存 .local/，不進公開輸出。
- npm test 11／11；Chrome 13 類互動檢查通過。公開站仍只有靜態閱讀與無寫入能力的展示。
- GitHub workflow 限個人 Repository owner 手動執行；遠端尚未建立，無法宣稱 GitHub 協作者權限已設定完成。
- [權限設計](access-control.md)記錄本人是否也需要公開網址登入編輯的待確認問題；本輪未擅自部署雲端可寫後台。

## GitHub 上架作業｜2026-11-16

- 使用者已有 GitHub 帳號並要求協助部署；預設個人公開 Repository 名稱為 tea-name-wiki。
- 已查詢 GitHub 整合，結果為尚未安裝／連線；本機沒有可用 Git／GitHub CLI。已請使用者完成帳號連線，未索取密碼或權杖。
- 準備外層 tea-name-wiki-github.zip，排除本機登入設定、版本、原件、環境檔與 dist，保留完整原始碼及手動發布 workflow。
- 遠端 Repository、Pages 設定、Actions 執行與正式網址仍待連線後完成；尚未上線。實際封裝驗證結果另記於 github-publishing.md。
- 上傳封裝解壓副本實測：11／11 測試通過，公開檢查 0 errors、9 warnings，成功建置 16 頁；zip 共 105 個檔案，包含隱藏 workflow。

## GitHub 外掛安裝入口｜2026-11-16

使用者明確要求安裝後，已啟動 GitHub 外掛安裝入口。最新查詢仍為未安裝；本人需完成介面上的安裝、登入與帳號授權。尚未確認連線、建立遠端或部署，完成後接續既有上架工作。

補充：使用者再次要求直接安裝後，已查閱官方文件並嘗試開啟桌面 GitHub 安裝頁。先前提供安裝入口不代表安裝流程已完成；工具沒有直接安裝能力，安裝及 GitHub 帳號授權仍需本人在介面完成。

開啟安裝頁的實際命令回傳 Access is denied，未開啟成功；已提供使用者可自行點擊的安裝入口，不宣稱已安裝或連線。

## 截圖確認與 CLI 安裝嘗試｜2026-11-16

已從截圖確認使用者在 VS Code 終端機執行 Codex CLI，應使用 /plugins 而非 VS Code 擴充套件市集。發現 codex plugin add 可用並實際嘗試安裝 github@openai-curated-remote，但目前工具環境無法解析 CODEX_HOME（Could not find home directory），未安裝成功。提供 CLI 的 /plugins 操作方式；待本人完成安裝及帳號授權後繼續發布。

## 完整工具檢查與安裝實作｜2026-11-16

使用者要求直接檢查缺項並安裝；已確認缺少 Git／gh，而 Node.js、Codex 已存在。winget 無法存取，官方 release API 無法連線。已製作外層 install-github-tools.cmd／ps1，下載官方可攜工具到 .tools，再由本人完成 GitHub 授權。腳本通過語法解析，但實際執行仍在網路下載階段失敗，沒有宣稱已安裝；詳見 tool-installation-status.md。GitHub 外掛並非此 Git＋gh 路線的必要條件。

## 使用者已建立遠端倉庫｜2026-11-16

使用者截圖及提供的 URL 確認倉庫為 https://github.com/Yaduck-2026/tea-name-wiki 。截圖當時為公開空倉庫。先前「尚未建立」狀態已由本節更正，上傳與 Pages 部署仍未完成。因工具沒有遠端寫入連線，另準備外層 github-upload 的兩批網頁上傳檔案，每批不超過 100 檔；保留 workflow、規則、原始碼與文件，排除本機私有資料。以實際遠端執行成功結果更新正式網址。

## GitHub CLI 已由本人安裝｜2026-11-16

015141 截圖顯示 GitHub CLI 安裝成功，目前 gh auth login 停在 GitHub.com 選擇。已實際執行 C:/Program Files/GitHub CLI/gh.exe --version，確認 2.104.0 可用；更正先前 gh 未安裝的狀態。Git 的兩個常見安裝位置仍不存在。接續先由本人完成瀏覽器登入授權，不能把選擇登入方式視為已登入或部署成功。

## 授權完成截圖與一鍵部署腳本｜2026-11-16

015506 截圖顯示 Authentication complete，最後因無 Git executable 而停止 Git 憑證設定；使用者再次提供同一倉庫 URL。工具可讀到 Yaduck-2026 的 gh 帳號設定，但 GitHub API 回報 socket access forbidden，不能在此環境驗證權杖或發布。不要把 gh 的連線失敗摘要誤解成已證明權杖失效。

已建立外層 publish-teawiki.cmd／ps1，結合補裝 Git、本人帳號及權限檢查、隔離 clone、封裝套用、專案測試及建置、非強制 push、Pages 設定、手動部署與成功後 HTTP 驗收。語法解析通過，遠端執行未驗證；需在使用者可連網的 Windows 環境啟動。部署成功結果存外層 .tools/publish-result.json，尚不存在成功結果。

## 發布啟動檔補建與實際核對｜2026-11-16

使用者回報沒有 publish-teawiki.cmd，實際 Get-Item 亦確認外層發布檔案不存在；先前僅以語法檢查回報交付不充分。已重新以實際檔案寫入建立外層與 tea-name-wiki/publish-teawiki.cmd，並建立 .local/publishing/publish.ps1。Get-Item 確認三個檔案存在且非空，PowerShell 語法解析通過。部署腳本改為自行下載與驗證官方 MinGit，沿用已安裝 gh；成功驗收結果存 .local/publishing/publish-result.json。原先文件中的外層 publish-teawiki.ps1／install-github-tools.ps1 不再作為本次啟動依賴。

本機啟動檔在 .gitignore 中排除，發布私有工具與 clone 都存 .local，不加入公開封裝。當前沒有遠端部署成功結果。

## 發布憑證指令修正｜2026-11-16

020620 截圖顯示可攜 Git 2.56.1 已成功安裝、遠端空倉庫 clone 成功；發布停在 Local GitHub credentials（exit 129），原因為 Windows PowerShell 傳遞含空白及內嵌引號的 helper 程式路徑時拆錯參數。已改為使用程序 PATH 中的 gh，設定 !gh auth git-credential，僅作用於隔離 clone。

已用實際 Git 初始化隔離測試倉庫，執行同一憑證指令並讀回完全一致值，成功退出。另將公開封裝實際 add／commit／clone 後檢查：22 Wiki 頁、9 raw 紀錄，0 errors／9 warnings；16 頁公開建置通過，封存與舊檔 hash 保持一致。發布腳本語法檢查通過。遠端 push 與 Pages 尚未執行，需重新開啟原 publish-teawiki.cmd；沿用已安裝 Git。

## 導入 OpenSpec 需求規格管理｜2026-11-22

- 使用者要求以 OpenSpec 管理需求，維持本機 1.14.3；以 `openspec init --tools claude --language zh-TW` 初始化，產生 openspec/ 與 .claude/ 的 opsx 指令與技能，初始化未改動 AGENTS.md。
- 依使用者確認的切分：產品、網站、發布、管理介面與權限需求移到 openspec/specs 的 product-scope、public-site、publishing、admin-console、owner-access（共 37 項需求）；AGENTS.md 回到 Wiki 維護 schema（寫作、操作邊界、三層、格式、ingest、query、lint、社群查證、茶名拆解），依使用者要求不含指向 OpenSpec 的內容。
- 規格依原 AGENTS.md 第 1、2、10～12 節改寫，情境（Scenario）為需求的具體化，尚未逐條對照程式驗證。
- `openspec validate --specs --strict` 5／5 通過。本輪未修改茶知識內容、程式或網站。
- 同輪檢查：npm test 11／11 通過；npm run check 嚴格模式 3 errors，原因是 raw/articles/user-update-policy-v1.md 本機不存在（已在 .gitignore，不在 git 中），check --public 0 errors。尚未處理，待使用者決定找回原件或記錄遺失。

## Git 身分設定與推送｜2026-11-22

- 本機原無 git 身分。依使用者指定，本 repo 設定 user.name 為 Yaduck-2026；使用者要求隱藏信箱，user.email 改用 GitHub noreply 信箱，既有 commit 均未含真實信箱。
- 首次推送被拒（403）：本機 Git 與 gh 登入的是另一個 GitHub 帳號，對本 Repository 沒有寫入權限。未新增協作者；改將遠端網址加上 Yaduck-2026 帳號名稱，由使用者本人在瀏覽器登入後推送。
- 推送成功：遠端 main 為 832324c（OpenSpec 導入），以 git ls-remote 核對與本機一致。
- 公開網站尚未重新部署：workflow 只能手動執行，本輪未觸發，也未核對 Pages 設定與上線結果。
