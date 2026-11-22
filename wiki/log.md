---
id: "log"
kind: "log"
title: "TeaWIKI 操作紀錄"
summary: "依時間追加 ingest、query、lint 與更正的紀錄。"
status: "published"
updated: "2026-11-22"
sources: []
related: ["index"]
provenance: "operation-log"
---

# TeaWIKI 操作紀錄

本紀錄內文只追加。updated 可隨追加更新；歷史段落不改寫，錯誤另追加更正。

## [2026-11-15] migration | JSON v1 轉 Markdown Wiki

- 執行依據：使用者確認 Karpathy 模式遷移方案。
- 內容：6 篇概念、1 個茶名示例、1 份觀察限制、8 頁來源摘要；保留 ID 與既有引用。
- [舊版 hashes](../docs/legacy/json-v1/original-hashes.json)用於確認原資料未變。
- 本輪只整理既有資料，未重新取得八份外部原文；raw/references 為定位紀錄，不是全文。不可當成新完成的八次 ingest。
- 入口：[索引](index.md)、[總覽](overview.md)。

## [2026-11-15] ingest | 使用者的手動更新指示

- 原始資料：[使用者訊息](../raw/articles/user-update-policy-v1.md)，為專案需求而非茶事實來源。
- 建立[來源摘要](sources/user-update-policy.md)與[更新政策](syntheses/manual-update-policy.md)，同步[總覽](overview.md)、[索引](index.md)及 [AGENTS.md](../AGENTS.md)。
- 原始訊息封存後以 SHA-256 記錄；錯字保留原件，摘要只解釋意思。
- 結論：手動觸發新研究，站內查詢不連外；本地匯入示範不代表已完成新茶文章全文匯入。

## [2026-11-15] query | 品種與茶類的示範問題

- 性質：依已確認遷移方案做一次 query 回存示範，不是使用者實際提問。
- 已讀：[索引](index.md)、[青心烏龍](cultivars/qingxin-oolong.md)、[六大茶類](tea-types/six-tea-types.md)；答案引用既有來源頁。
- 成果：[問答示範](syntheses/qingxin-vs-tea-type.md)，為兩篇知識補回連結並更新索引。
- 限制：使用現有整理，不重新讀取外部原文，不推斷實際商品。

## [2026-11-15] lint | 遷移後結構與知識一致性

- 實際執行 npm run index、npm run check、npm run query -- 青心烏龍。
- check：22 頁、9 筆封存、0 errors、8 warnings。提醒為外部原文未封存，未隱藏。
- 已修復：在[總覽](overview.md)補上[社群觀察](syntheses/social-observation-2026-11-15.md)的閱讀入口，移除孤立頁警告。
- 隔離副本負向測試可拒絕原件改動及失效連結；未修改原工作區封存。
- [健康檢查詳情](../docs/wiki-health-review.md)區分工具與內容判斷；[遷移報告](../docs/migration-v2.md)列已完成及缺口。
- 尚未做：外部原文重查、新茶原件匯入、網站與部署。不自動開始新搜尋。

## [2026-11-16] maintenance | 本機管理介面與公開閱讀版本

- 依使用者要求製作管理網頁：原件上傳／下載、待整理工作、Markdown 編輯／預覽、版本還原、衝突檢查、健康檢查與日誌。
- 編輯及上傳先在暫存副本驗證，再保存到正式資料夾；原件不開放修改，測試檔僅存在隔離測試副本。
- 實際完成 npm test（10／10）及 Chrome 互動驗證（10 類、0 執行期例外）；建置 16 頁公開內容及唯讀管理展示。
- [操作說明](../docs/admin-guide.md)、[測試報告](../docs/admin-test-report.md)、[GitHub 發布準備](../docs/github-publishing.md)。
- 尚未上傳 Repository 或執行遠端部署，未查找新茶資料；現有八筆來源原文未封存的限制維持。

## [2026-11-16] maintenance | 本人登入管理，公開訪客唯讀

- 依使用者要求補上管理密碼設定、登入、登出及伺服器端工作階段驗證；不再僅憑開首頁取得管理權。
- 密碼由本人在本機初次設定，AI 未代設；設定檔與工作階段不公開。上傳、編輯、還原、原件與管理資料均需登入。
- 自動測試 11／11、Chrome 13 類互動通過；測試密碼只用在隔離副本。公開版無寫入 API。
- [權限設計](../docs/access-control.md)、[操作說明](../docs/admin-guide.md)。GitHub 實際 owner／協作者權限仍待上架時確認。
- 新版服務重啟後，實測未登入管理讀取及寫入回應 401，公開預覽仍可閱讀；正式密碼尚待本人設定。

## [2026-11-22] maintenance | 使用者訊息原件退役

- 退役檔案：raw/articles/user-update-policy-v1.md（2026-11-15 ingest 時封存）。使用者表示不再使用，原件也已不在本機。
- raw/manifest.json 該紀錄加註 retired（日期、原因），路徑與 SHA-256 不變；未刪除紀錄、未重算 hash。
- 修改[來源摘要](sources/user-update-policy.md)：originalAvailable 改為 false、移除原件連結並說明退役；摘要、[更新政策](syntheses/manual-update-policy.md)與總覽內容不變。
- 本紀錄上方 2026-11-15 ingest 條目的原件連結保留原樣，不改寫歷史；該連結已無法開啟。
- 限制：原始訊息全文已無法重讀，日後只能依來源摘要理解當時的指示。check 嚴格模式 0 errors。

## [2026-11-22] ingest | 重新取得並匯入 8 份外部來源原文

- 授權：使用者明確授權連網重抓既有 8 份來源；未搜尋其他來源。
- 取得：2026-11-22T14:40:18+08:00 下載，8 份皆 HTTP 200。原件存於 raw/articles/*-v2（6 份 HTML、2 份 PDF），manifest 追加 8 筆 web-capture 紀錄與 SHA-256；v1 定位紀錄保留不改。
- 來源：[逗陣來識茶](sources/moa-tea-intro.md)、[冬片仔知多少](sources/moa-winter-harvest.md)、[特色茶分類及加工製程](sources/moa-tea-process.md)、[臺茶風味輪](sources/moa-flavor-wheel.md)、[青心烏龍](sources/ntsec-qingxin.md)、[尋茶趣教案](sources/school-tea-practice.md)、[茶改場教材](sources/tbrs-taiwan-tea-handout.md)、[業者商品頁](sources/teawei-longfengxia.md)。8 頁來源摘要改寫為原文日期、重點、支持範圍與限制，originalAvailable 改為 true。
- 閱讀與核對：抽出原文文字，由 4 個子代理逐份比對現有 Wiki 說法並附原文行號／頁碼；主要結論與所有新寫入的數字由主流程回到原文抽查確認。
- 修正：[六大茶類](tea-types/six-tea-types.md)原標題「別只猜茶湯顏色」與原文「依色澤及湯色分類」有落差，已改寫；[東方美人](specialties/oriental-beauty.md)「著蜒」段原本引用的逗陣來識茶沒有此說法，改只引茶改場教材；[青心烏龍](cultivars/qingxin-oolong.md)補上原本漏列的條形包種茶；[問答示範](syntheses/qingxin-vs-tea-type.md)同步修正六大茶類說法。
- 補充：[沖泡入門](brewing/brewing-basics.md)加入茶壺法時間、茶量、水溫與冷泡比例；[清香型、焙香型](styles/light-and-roasted-styles.md)加入生茶／熟茶；[茶名裡的地名](origins/taiwan-tea-origins.md)加入五大茶區與高山茶定義；[茶名示例](tea-names/shanlinxi-qingxin-winter-example.md)加入冬茶時間、冬片區別；[總覽](overview.md)更新證據限制。
- 衝突：採收次數「每年 7 次」（逗陣來識茶）與「約 4 至 5 次」（冬片仔知多少）兩說並列；製程簡介「八大特色茶類」卻只列六項，以實際列出者為準。
- 未採用：教案的健康說法與成分釋出比較、業者頁的「芬多精、活氧」成因與海拔、價格、排行。
- 限制：原文只代表 2026-11-22 當時的網頁版本；業者頁只支持產地寫法；raw/articles 只存在本機、不進 GitHub。check：22 頁、17 筆封存、0 errors、0 warnings。

## [2026-11-22] query | 產生教學簡報「從茶名讀懂台灣茶」

- 目的：作業要求以 Wiki 為知識來源製作教學型 HTML 簡報（使用者經 OpenSpec 變更 add-teaching-slides 確認範圍）。
- 讀取：[索引](index.md)、[茶名示例](tea-names/shanlinxi-qingxin-winter-example.md)、[茶名裡的地名](origins/taiwan-tea-origins.md)、[青心烏龍](cultivars/qingxin-oolong.md)、[清香型、焙香型](styles/light-and-roasted-styles.md)、[六大茶類](tea-types/six-tea-types.md)、[東方美人](specialties/oriental-beauty.md)、[沖泡入門](brewing/brewing-basics.md)，以及 8 頁來源摘要的標題與範圍。
- 回存：[教學簡報：從茶名讀懂台灣茶](syntheses/tea-name-slides.md)，synthesisType 為 slide-deck，共 15 張；每張以「依據」連到 Wiki 頁。另在[總覽](overview.md)加上入口說明。
- 核對：60 個關鍵說法逐一對照引用頁，全部有依據；未加入 Wiki 以外的知識、療效或商品推薦。
- 限制：簡報是 Wiki 的再整理，不是新的查證；茶名為教學組合示例。未連網、未搜尋新資料。check：23 頁、0 errors、0 warnings。

## [2026-11-22] maintenance | 教學簡報第 7 張加入範例茶名

- 依使用者要求，在[教學簡報](syntheses/tea-name-slides.md)第 7 張「白話翻譯」的標題下方加上範例「杉林溪龍鳳峽・青心烏龍・清香型・冬茶」，再接白話翻譯。
- 只調整版面與呈現順序，沒有新增茶知識；依據頁不變。check：0 errors。

## [2026-11-22] maintenance | 教學簡報加入圖片

- 依使用者要求，在[教學簡報](syntheses/tea-name-slides.md)第 1、3、8、9、11、12 張加入使用者提供的 AI 生成圖片（壓縮為 JPG，原始 PNG 只留本機）；出處登記在 assets/image-credits.json。
- 第 4、5 張原圖有與 Wiki 矛盾的內容（臺茶 18 號誤標為紅烏龍、青心烏龍「適應性強」；製程漏殺菁且順序錯），未使用，改顯示預留框，待使用者重生。
- 圖中文字未經本站查證者，圖說一律標明；投影片文字仍只取自 Wiki。第 9 張改為標題加圖片，原文字改寫為替代文字，內容不變。
- 限制：生成工具名稱待使用者補充。check：0 errors、2 warnings（第 4、5 張待補圖）。

## [2026-11-22] maintenance | 教學簡報第 4、5 張換上重生圖片

- 使用者依本站提供、只含 Wiki 已查證文字的 prompt 重生第 4 張（品種）與第 5 張（風格）圖片；圖中文字逐字對照[青心烏龍](cultivars/qingxin-oolong.md)與[清香型、焙香型](styles/light-and-roasted-styles.md)，一致，出處標為已查證。
- 使用者告知 8 張圖片皆以 GPT 生圖產生，已補入 assets/image-credits.json。簡報不再有預留框。
