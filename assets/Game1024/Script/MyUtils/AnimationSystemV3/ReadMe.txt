Update log:
Info:V2與V3版本不相容

V3:
1.新增支援多軌播放-spineController重構
(舊版V1 V2只支援一次一軌道,每次播放其他的就會去<全部>清除軌道)
「先播、獲取狀態、再跳轉」

2.SpineSequencePlay 從獨立的class當中整併回spineController

=======spineController=====================================================================
<核心設計特色>
標籤化查找系統 (Tag-based Resolution)：
外部呼叫只需提供「標籤」或「狀態名稱」，由內部的 Resolver 自動對應到物理播放參數。

多軌道狀態管理 (Multi-track State Management)：
支持多個 Track 同時播放，且每個軌道擁有獨立的狀態備份、還原與 timeScale 控制。

非同步流程控制 (Async/Await Flow)：
Promise 機制，解決動畫銜接的 Callback Hell，使邏輯清晰連貫。

事務性資料還原 (Transactional Recovery)：
播放期間可動態覆蓋動畫屬性，播完後自動將資料還原回面板初始設定，確保不污染全域狀態。

中心化事件分發 (Centralized Event Dispatcher)：
全局唯一 Spine 監聽器，同時支撐「序列廣播」、「關鍵影格監聽」與「播放完結回調」。

主要對外方法 (API)
1. 單體播放 (Single Play)
playAni(value: PlaySelector):
標準播放模式，支援傳入標籤、ID 或標籤物件。

playAniInPromise(value: PlaySelector): Promise<void>：
非同步播放模式，等待動畫播完（包含重複次數）後才會 resolve。

stopAll() / stopWith(options)：
強制停止所有或指定軌道的動畫。

2. 序列播放 (Sequence Play)
playSequence(sequenceId: string, loopWhole?: boolean)：
核心序列邏輯，依序播放清單中的多組動畫。

playSequenceInPromise(sequenceId: string): Promise<void>：
以非同步方式執行整組序列。

playSequenceWithCallBack(callback, sequenceId)：
傳統 Callback 接口，適合與舊有代碼接軌。

3. frameEvent監聽 (Frame Event)
setKeyFrameEvent(eventName, listener)：
註冊特定幀事件的回調。

removeKeyFrameEvent(eventName, listener)：
移除監聽。

clearKeyFrameEvent()：
清空所有自定義事件監聽，但保留系統內部的序列廣播功能。

3.內部維護與機制
reSetPlayInfoToOriginData(targetName)：
將 _targetName2Prop 的資料重置回面板初始快照，防止動態修改造成邏輯靈異。

onSpineEventReceived：單一入口事件處理器，負責分發 KeyFrame 邏輯與 Node 全域事件。

forceToDoBeforeDestroy：完善的銷毀機制，自動釋放所有 Pending 狀態的 Promise，避免記憶體洩漏與邏輯死結。


4.進階播放控制方法 (Advanced Controls)

