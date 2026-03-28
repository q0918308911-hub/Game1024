┌─────────────────────────────────────────────┐
│                 AsyncScope                  │
│─────────────────────────────────────────────│
│  ┌──────────────────────────────────────┐   │
│  │ 1️ Abort 控制管理 (多群組支援)       │   │
│  │--------------------------------------│   │
│  │ _abortControllers: Map<string, IAbortGroup>│
│  │                                         │
│  │  createAbortScope(key, onAbort?) ───────┼─▶ 建立 AbortController 群組
│  │     ↳ 存入 controller + callback        │
│  │                                         │
│  │  abortAll(targetKey?) ──────────────────┼─▶ 呼叫對應 AbortController.abort()
│  │     ↳ 執行 callback(key)                │
│  │     ↳ 同步取消所有綁定相同 signal 任務  │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 2️ Cancel 任務追蹤管理                │   │
│  │--------------------------------------│   │
│  │ _cancelList: ICancelableTask[]       │   │
│  │ trackCancel(task) ───────────────────┼─▶ 註冊可取消任務
│  │ untrackCancel(task) ────────────────┼─▶ 移除任務追蹤
│  │ cancelAll() / cancelBySource()      │   │
│  │                                     │   │
│  │ 每個任務都可關聯 AbortSignal / Key  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 3️ Deferred / SafeResolve 管理       │   │
│  │--------------------------------------│   │
│  │ _resolveMap: Map<string, {resolve}>  │   │
│  │ createDeferredFor(key) ──────────────┼─▶ 生成手動控制的 Promise
│  │ safeResolve(key?) / clearPending()   │   │
│  │ safeResolve()                        │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 4️ Timeout / 等待系統                │   │
│  │--------------------------------------│   │
│  │ waitSecondsCancelable(sec, signal?)  │   │
│  │ waitSecondsRaw(sec)                  │   │
│  │ waitSecondsTracked(duration, label)  │   │
│  │ deferTaskWithCancelableDelay()       │   │
│  │ withTimeout(ogPromise, sec, ...)     │   │
│  │     ↳ 包裝 GameUtilsTools.withTimeout│   │
│  │     ↳ 在 _cancelList 追蹤            │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 5️ Abort + Timeout 任務整合         │   │
│  │--------------------------------------│   │
│  │ runWithAbort(task, signal, label) ───┼─▶ 允許外部任務受 AbortSignal 控制
│  │     ↳ Promise.race([任務, timeout, cancelGate])│
│  │ makeCancelGate(signal) ──────────────┼─▶ 回傳可等待 signal.abort 的 Promise
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 6️ Debug / Lifecycle 管理           │   │
│  │--------------------------------------│   │
│  │ DEBUG_TITLE = 'AsyncScope'           │   │
│  │ GameUtilsTools.debugLog()            │   │
│  │     ↳ createAbortScope()             │   │
│  │     ↳ abortAll()                     │   │
│  │     ↳ cancelAll()                    │   │
│  │ reset() / dispose()                  │   │
│  │ resolveAllPending()                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
<樹狀結構功能分類>
TIPS:計時器採用creator內建的tween系統,讓非component物件也能使用
AsyncScope
├── Promise lifecycle 管理
│    ├── withTimeout() → 防掛自動 resolve
│    ├── waitSecondsCancelable() → Tween-based delay
│    ├── waitSecondsTracked() → Label-based 可中斷 delay
│    └── deferTaskWithCancelableDelay() → 延遲任務包裝
│
├── 取消控制
│    ├── cancelAll() / cancelByLabel() / cancelBySource()
│    ├── resolveAllPending() / safeResolve()
│    └── trackCancel() / untrackCancel()
│
└── AbortScope 群組管理
     ├── createAbortScope(key, callback)
     ├── abortAll(key?) → 廣播中止
     └── makeCancelGate(signal)


<abortAll 層>
(範圍)-同群組（共用 signal 的任務） 
(控制方式)-廣播中止
(代表方法)-abortAll() / runWithAbort()
(使用時機)-整個遊戲階段跳過 / 強制中止
(範例)-中止 `ShowWin` 群組動畫與特效  
(結果)-該群組立即中止、callback 執行

<Cancel 任務層>
(範圍)-當前 AsyncScope 追蹤的所有任務
(控制方式)-cancel()
(代表方法)-waitSecondsCancelable() / cancelAll()
(使用時機)-個別延遲、動畫、timeout
(範例)-關閉所有 delay / timeout    
(結果)-所有任務的 cancel() 被呼叫

<safeResolve 層>
(範圍)-Deferred 或 wait 任務 
(控制方式)-resolve()
(代表方法)-safeResolve() / clearPending()
(使用時機)-強制完成 / skip 流程
(範例)-提前 resolve 所有 pending promise    
(結果)-resolve

<Tracked Task 層>
(範圍)-外部掛載任務
(控制方式)-skip()
(代表方法)-trackTask() / resolveAllTrackedTasks()
(使用時機)-統一 skip 目前進行中的任務

<TIPS>
這是一個可以單獨使用與群體控制的等待工具,裡面集合了會需要用到的方法

<執行流程示意圖>

玩家觸發跳過(Skip)
        │
        ▼
GameViewManager
  → 呼叫 _async.abortAll('ShowWin')
        │
        ▼
AsyncScope
  → 找出 key='ShowWin' 的 controller
  → controller.abort()
  → 執行 callback('ShowWin')
  → 呼叫所有持有相同 signal 的 cancel()
        │
        ▼
子系統動畫 (BasicShowAniProcess / Controllers)
  → Promise.resolve()
  → 動畫提前結束、UI歸位



<範例>
const showSignal = this._async.createAbortScope('ShowWin', (key)=>{
    GameUtilsTools.debugLog('BasicShowAniProcess', `[AbortCallback] ${key}`, { reason: 'UserSkip' });
});

// 綁定 signal 給多個任務
await Promise.all([
    this._async.waitSecondsCancelable(1.2, showSignal),
    this._async.withTimeout(this.playWinInThisRound(), 5, { phase: 'win' }, 'playWin', false, undefined, showSignal)
]);

// 玩家按下 Skip → 統一中止
this._async.abortAll('ShowWin');
