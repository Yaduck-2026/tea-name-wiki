# product-scope Specification

## Purpose

定義茶名有解｜TeaWIKI 的產品範圍：以台灣茶為主的繁體中文知識庫，介紹六大茶類，從完整茶名拆解連到知識。Markdown Wiki 是內容主檔，公開網站只是閱讀介面。

## Requirements

### Requirement: 台灣茶繁體中文知識庫

系統 SHALL 以台灣茶為主、以繁體中文介紹六大茶類，並讓讀者能從完整茶名拆解連到相關知識頁。

#### Scenario: 從茶名拆解進入知識

- **WHEN** 讀者開啟一篇完整茶名拆解頁
- **THEN** 頁面依原順序列出每個詞的角色與白話解釋，並連到相關知識頁

### Requirement: 固定六大導覽分類

網站導覽 SHALL 依 config/categories.json 固定為六個主分類：台灣產地 origins、品種 cultivars、茶類 tea-types、特色製法／茶款 specialties、製作風格 styles、沖泡 brewing。採收季節等屬性 MUST 作為標籤，不得新增第七個主分類。

#### Scenario: 顯示主分類

- **WHEN** 讀者瀏覽首頁或知識索引
- **THEN** 只看到上述六個主分類，順序與 config/categories.json 一致

#### Scenario: 季節不成為主分類

- **WHEN** 茶名包含「冬茶」等採收季節詞
- **THEN** 季節以標籤呈現，導覽仍維持六個主分類

### Requirement: 首頁內容

首頁 SHALL 以完整茶名拆解與六大分類為主，另設近期話題區。

#### Scenario: 開啟首頁

- **WHEN** 讀者開啟首頁
- **THEN** 可看到茶名拆解入口、六大分類入口與近期話題

### Requirement: 最低內容覆蓋

公開內容 SHALL 至少包含每個主分類各一篇基礎知識、一個茶名示例，以及說明網站與查證方法的關於頁。

#### Scenario: 分類皆有內容

- **WHEN** 讀者點選任一主分類
- **THEN** 至少有一篇已公開的基礎知識頁

### Requirement: 茶文化雜誌風視覺

網站 SHALL 採用茶文化雜誌風：米白、深茶綠、茶褐配色，大標題與留白，各頁使用共用版型。網站 SHALL 能在手機寬度閱讀，並可只用鍵盤操作。

#### Scenario: 手機閱讀

- **WHEN** 讀者以手機寬度開啟任一頁
- **THEN** 版面可正常閱讀，不需要水平捲動

#### Scenario: 鍵盤操作

- **WHEN** 讀者只用鍵盤瀏覽
- **THEN** 連結、搜尋與表單都能取得焦點並操作，且焦點清楚可見

### Requirement: 不納入的功能

系統 MUST NOT 提供即時模型聊天、會員或商城功能，且 MUST NOT 需要模型 API 金鑰才能建置或閱讀。

#### Scenario: 無金鑰建置

- **WHEN** 在沒有任何模型 API 金鑰的環境執行建置
- **THEN** 建置與閱讀功能完整可用
