# 內容與來源指南

本文件說明 `AGENTS.md` 的資料格式。模板中的佔位文字與 null 是草稿狀態，不是正式內容；只有 `content/` 中通過發布條件的 published 資料才會在後續網站公開。

## 1. 選擇模板

### 先用讀者聽得懂的話說明

文章用自然、白話的口語繁體中文。第一次提到專有名詞，採「名詞 → 一句白話解釋 → 具體例子」；有必要再補細節。每篇至少一個例子，可以直接放在 section 的 paragraphs 或 bullets，不必增加新欄位。

例如解釋資料分類時，可以用教學情境：「假設你在茶包裝上看到幾個詞，先問：哪個是在說從哪裡來？哪個是在說用什麼品種？不要把整串名稱當成同一種分類。」實際茶知識例子仍要查證，不能只因說法順口就寫成事實。

比喻之後回到名詞本身，說明哪些是相似處、哪些不能直接套用。避免術語密集、沒有解釋的縮寫，以及沒有來源的絕對說法。

| 用途 | 複製來源 | 放置位置 |
| --- | --- | --- |
| 長期知識 | `templates/wiki.json` | `content/wiki/<id>.json` |
| 完整茶名拆解 | `templates/tea-name.json` | `content/tea-names/<id>.json` |
| 近期話題／觀察限制說明 | `templates/digest.json` | `content/digests/<id>.json` |
| 研究紀錄 | `templates/research.md` | `research/YYYY-MM-DD-topic.md` |
| 一筆來源 | `templates/source.json` | 填寫後加入 `sources/registry.json` 陣列 |

既有青心烏龍條目為 `content/wiki/qingxin-oolong.json`，`id` 為 `qingxin-oolong`。新增相同主題前應先查看並維護這份內容，不再建立同義副本。

## 2. 共用欄位

| 欄位 | 格式與限制 |
| --- | --- |
| kind | 固定為 wiki、tea-name、digest 之一 |
| id | 小寫英文、數字、連字號；以英文字母開頭，全站唯一，等於檔名 |
| title／summary | 繁體中文純文字，不留待填提示 |
| status | draft → review → published；只有完成查證與檢查才進 published |
| updated | 草稿可 null；公開內容必須為實際修改日 YYYY-MM-DD |
| relatedIds | 其他條目的 ID 陣列，不重複或自我引用；目標必須存在，公開內容只指向 published 條目 |
| sourceIds | 本篇使用的來源 ID 清單，去重；所有局部引用都包含在此清單 |

知識條目的 `categoryId` 必填且使用 config 中的 ID；`secondaryCategoryIds` 可空，不重複主分類。`aliases` 是供搜尋使用的別名。

section 的 `paragraphs`、`bullets` 為字串陣列；有事實性內容的 section 應以其 `sourceIds` 指出支持來源。知識條目至少有三個有內容的 section，涵蓋概念、應用及容易混淆的地方；可依題目調整標題。

published 代表可供建置，不代表網站已上線或內容已經使用者逐篇核准。執行 AI 必須先做來源與內容複核，寫入研究紀錄，再通過實際可用的結構檢查。未實作建置器時，明確區分已做的人工／AI 查核與尚未能做的網站驗證。

`aliases` 目前只適用 wiki；其他 kind 不自行增加此欄位。共用段落只能用模板中已有欄位；若未來新增欄位，須同時更新本指南、模板、檢查器與呈現程式。

## 3. 完整茶名

- `exampleType` 為 `illustrative`（組合教學示例）或 `source-based`（來源中存在的完整名稱）。前者明示為示例，後者附原茶名的實際來源。
- `originalName` 保留名稱；`terms` 依序拆解，不補入名稱沒有的資訊。
- `role` 是詞語角色，`categoryId` 是主分類 ID，`entryId` 是相關知識條目 ID，三者用途不同。
- 季節標籤的 `categoryId` 可 null；尚無相關條目的 `entryId` 也可 null，呈現純文字即可。
- 公開茶名範例的每個詞都需 `verification: verified`、非空說明及可讀來源。
- verified 查的是詞語角色與解釋，不是整款商品或產地履歷；示例性質與 limitations 必須在公開頁可見。
- `plainLanguage` 只合併已查證資訊；`limitations` 記錄例外、示例性質或名稱無法判斷的部分。

## 4. 近期話題

- `observation.start`、`end`、`researchedAt` 使用帶 `+08:00` 的 ISO 8601 日期時間。start 與 end 相距 7 天，以研究結束時間為 end。
- 同批結束時定稿 end，之後查找另開一批。貼文發布時間須落在含首尾的區間內；日期未含時分者，只有整日完全落入區間才納入，否則記為無法判定。
- `platforms` 記實際查找平台，`keywords` 記實際查詢詞，不填預計做但未做的查詢。
- `includedPostCount` 為合格去重貼文數，`independentAccountCount` 為其中不同發文帳號數；研究檔另記可辨識參與知識回覆的帳號及統計定義，不混用兩者。
- `comparisonBasis` 記實際可見的比較依據；若留言不可讀就說明不能判定知識相關留言數。
- `researchFile` 為專案根目錄相對路徑，必須指向存在的研究紀錄。
- `evidenceLevel: verified-topic` 代表可讀近期原貼文與查證來源已支持統整，不表示熱門排名已成立；需要社群與非社群查證來源。
- `evidenceLevel: insufficient-data` 僅提供真實觀察限制說明。可在沒有合格來源時用空 sourceIds，但不能放無來源茶知識結論；必須填寫觀察、查詢、限制與研究紀錄。
- 不發布空白話題模板。資料不足的公開頁也要有清楚標題、摘要、實際紀錄與說明。

## 5. 來源目錄

每筆來源填寫 `templates/source.json`，加入 registry 陣列，`id` 不重複。後續網站由 registry 產生文末來源與段落引用。

| 欄位 | 要求 |
| --- | --- |
| type | social、official、research、professional |
| title／author／url | 真實來源標題、作者／機構、支持說法的原始頁面 HTTP(S) 連結 |
| publishedAt | 來源提供的日期或時間；取不到為 null，limitations 說明 |
| accessedAt | 真實查閱時間，ISO 8601 並帶時區 |
| accessStatus | pending、readable、restricted、unavailable；公開知識只能引用 readable 作為已核對證據 |
| platform／accountHandle／accountUrl | social 必填；accountUrl 不能取代原貼文 url，其他類型可 null |
| identityCheck | 社群帳號身分核對依據，或明記尚未確認，不能只憑名稱稱官方 |
| supports | 來源支持的具體說法之簡短摘要，不能空列連結 |
| limitations | 日期不明、品牌適用範圍、無法看到留言等限制 |

首次研究先以來源填補 registry，再由內容引用。找不到符合條件的來源時，不建立假的來源紀錄；把疑問留在 research。

話題文章在文末分別列社群來源與查證來源；基礎知識不強迫補社群帳號。readable 表示查閱當時可讀，不是永久可用保證；檢查器不因確認網址格式就聲稱已重新閱讀原文。

## 6. 圖片紀錄

使用圖片時，在 `assets/image-credits.json` 陣列新增：`id`、`path`、`creator`、`sourceUrl`、`license`、`licenseUrl`、`accessedAt`、`alt`、`illustrative`。path 為專案內相對路徑；原創素材的外部網址可 null，需說明創作者與使用依據。

先確認使用依據才放入公開資產。暫時找不到圖，可採原創插圖，不使用無授權的社群照片填補。

## 7. 新增內容完成清單

1. 確認無重複條目，使用正確模板與分類。
2. 研究檔記錄實際查詢、來源、限制及查證結果。
3. 填來源目錄、正文及局部引用，補相關條目 ID。
4. 檢查名稱、日期、範圍及未解決疑問；不要只看語句通順。
5. 經複核後轉 published；草稿保持不可公開。
6. 建置器完成後執行 check、build，確認新增頁與索引可用。
7. 更新 progress 和討論文件，報告改動與未做的驗證。

工具是否已建立請查看實際 package.json 與 progress。check／build 應只使用本地資料，不自動對外搜尋；沒有執行的建置或瀏覽器檢查不能宣稱通過。
