        
 <動畫轉移持有控制權的流程示意圖> 
 1.ISymbolOwnerAgent讓需要交互持有動畫的系統實踐
 2.各系統透過依賴注入(dependency injection)的方式將SymbolAniHandoffManager注入
 3.注入後註冊自己
 4.透過使用SymbolAniHandoffManager(改介面注入)操作介面方法
 5.ISymbolAniMediator來操作取得動畫資料與取得動畫物件+修飾動畫實體屬性     
        
        
                 ┌─────────────────────────────┐
                 │   GameInit / DI Container   │
                 │  綁定與注入：                │
                 │  ICrossSystemSymbolAniService
                 │  → CrossSystemAniServiceFacade
                 └───────────────┬─────────────┘
                                 │ inject
     uses interface              │
┌──────────────────────────┐     │      ┌──────────────────────────┐
│ SlotMachineControl (SMC) │◀────┘      │ ShowAniController (SAC)  │
│  implements ISymbolOwner │            │  implements ISymbolOwner │
└────────────┬─────────────┘            └────────────┬─────────────┘
             │  ICrossSystemSymbolAniService                 ▲
             │  (介面呼叫)                                    │  ICrossSystemSymbolAniService
        ▼                                                    │  (介面呼叫)
      ┌──────────────────────────────────────────┐           │
      │   CrossSystemAniServiceFacade            │◀──────────┘
      │   (implements ICrossSystemSymbolAniService)          Facade
      │  ──────────────────────────────────────── │
      │  + createAndRegister(info, owner)         │
      │  + handoff({reelIndex,iconIndex}, newOwn) │
      │  + decorateNode(target, playData)         │
      │  + setTargetGroup(target, groupId)        │
      │  + buildPlayData(info)                    │  ← 供「先比對再取節點」用
      └───────────────┬──────────────────────────┘
                      │ uses
                      ▼
          ┌───────────────────────────────┐
          │ AniBuilderMediator            │  ← 取 PlayData / 取 Node / decorate
          │  - buildPlayData(info)       │
          │  - requestNodeByInput(info)  │
          │  - decorate(node, playData)  │
          │  - setAniGroup(node, group)  │
          └───────────────┬──────────────┘
                          │ uses
                          ▼
          ┌───────────────────────────────┐
          │ IProcessSlotSymbolAniData     │  ← 規則/命名/prefabKey/compareKey
          └───────────────────────────────┘
                          │ prefabKey
                          ▼
          ┌───────────────────────────────┐
          │ AniObjectPoolManager          │  ← 物件池取 Node
          └───────────────────────────────┘

                      and
                      ▼
          ┌───────────────────────────────┐
          │ SymbolAniHandoffManager<I>    │  ← 位置所有權交接
          │  - register(info, owner)      │  (info 至少含 reelIndex, iconIndex)
          │  - handoff(info, newOwner)    │  → beforeRelease/afterAcquire
          │  - getOwner / unregister      │
          └───────────────────────────────┘

=========================================================================================================

20251221-新版本架構圖

=========================================================================================================

      ┌──────────────────────────────────────────┐
      │         GameInit / DI Container          │
      │  負責綁定：ICrossSystemSymbolAniService  │
      │  配置：Setters (注入各 Manager 實例/類別) │
      └───────────────────┬──────────────────────┘
                          │ inject (Facade Instance)
    Uses Interface        │
┌──────────────────────────┐          ┌──────────────────────────┐
│  SlotMachineControl (SMC)│◀─────────┼──────────▶  ShowAniController (SAC) │
│ implements:              │          │ implements:              │
│ - ISymbolOwnerAgent      │          │ - ISymbolOwnerAgent      │
│ - IFunctionOwnerAgent    │          │ - IFunctionOwnerAgent    │
└────────────┬─────────────┘          └────────────┬─────────────┘
             │                                     │
             │     ICrossSystemSymbolAniService    │
             └───────────────────┐    │    ┌───────┘
                                 ▼    ▼    ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │                   CrossSystemAniServiceFacade                    │
      │            (implements ICrossSystemSymbolAniService)             │
      ├──────────────────────────────────────────────────────────────────┤
      │  [Data Layer]      [Animation Layer]    [Command Layer]          │
      │  + registerData()  + handoff()          + processFunc()          │
      │  + unRegister()    + multiHandoff()     + returnData()           │
      ├─────────┬───────────────────┬───────────────────┬────────────────┤
      │ 使用    │ 使用 (Internal)   │ 使用 (Internal)   │ 使用 (Internal)│
      ▼         ▼                   ▼                   ▼                │
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│ SymbolData   ││ AniHandoff   ││ DataSync     ││ SystemHandoff││ AniBuilder   │
│ CtrlManager  ││ Manager      ││ Manager      ││ Manager      ││ Mediator     │
│ (資料增刪查改)││ (Node 搬遷)  ││ (純資料同步) ││ (跨系統指令) ││ (物件產出)   │
└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘
       │               │               │               │               │
       └───────────────┴───────┬───────┴───────────────┴───────────────┘
                               │ 共用 (Shared DB)
                               ▼
                ┌───────────────────────────────┐
                │     SymbolRegistryCenter      │
                │ - Registry <Key, {info, id}>  │
                │ - Owners   <Id, Agent>        │
                └───────────────────────────────┘         

<比較>
-舊版架構-

設計模式:      單一經理人 (Monolithic)
互動模式:      只有所有權轉移 (Push/Pull)
效能:          逐筆處理，開銷較大
擴充性:        增加新功能需改動核心
Agent 要求:    強制實作所有動畫介面

-新版架構- (重構後)

設計模式:      組合式經理人 (Modular Facade)
互動模式:      轉移、推播、指令三線並行
效能:          支援 Map 批量推播，效能優化
擴充性:        可透過注入新 Manager Class 擴充
Agent 要求:    依據需求實作 (Symbol 或 Function)

<特色>

1. 專業分工的經理人機制 (Specialized Managers)
Facade 內部不再寫死邏輯，而是將任務分派給具備特定職責的組件：

SymbolDataCtrlManager: 負責最基礎的資料操作。利用 Pick<T, K> 實現「最小資訊索引」，執行註冊、註銷與查詢。

SymbolAniHandoffManager: 專職處理 Node 的「搬家」。負責驅動 beforeRelease 與 afterAcquire 的非同步流程，達成控制權轉移。

SyncDataHandoffManager: 專注於高效資料同步。實現高性能、無副作用的「狀態推播」。

SystemHandoffManager: 處理與動畫無關的「純邏輯指令」。透過 IFunctionOwnerAgent 進行跨系統功能調用。

2. 資料中心化 (Centralized Registry)
所有的 Manager 現在都共享同一個 SymbolRegistryCenter。

單一真相來源：保證不論是指令流還是動畫流，獲取的 Owner 與狀態都是同步的。

輕量化設計：註冊表僅紀錄 (Reel:Icon:ID) -> OwnerID 的映射，不干涉邏輯。

3. 依賴注入與 Facade 路由器 (DI & Facade Router)
解耦實作：Facade 不寫死 Manager 實作。透過 setManager(Class)，可在不同專案中注入自定義的 Manager（例如：在 2D 與 3D 專案中更換不同的 Handoff 邏輯）。

路由器角色：Facade 簡化為「指揮官」，對外提供單一窗口，對內進行高效分流。

4. 精確的型別約束 (Type Safety)
介面分離：明確區分「持有動畫的 Agent (ISymbolOwnerAgent)」與「執行指令的 Agent (IFunctionOwnerAgent)」。

動態安全：透過泛型約束與強制轉型技術，確保 TOwner 即使只是一個 IBaseOwner，也能在執行特定動作前通過型別檢查，避免執行時期錯誤。

quick star up 

// 1. 建立資料中心
const db = new SymbolRegistryCenter<TReelInfo, IBaseOwner>();

// 2. 初始化 Facade
const facade = new CrossSystemServiceFacade(db);

// 3. 注入所需的專業管理器 (Dependency Injection)
facade.setSymbolDataCtrlManager(SymbolDataCtrlManager);
facade.setHandoffManager(SymbolAniHandoffManager);
facade.setSyncManager(SyncDataHandoffManager);

----handoff----
// 當 WinShow 系統想要接手滾輪上的某個符號
const targetSymbol = { reelIndex: 0, iconIndex: 1, symbolId: 10 };
await facade.handoff(targetSymbol, winShowAgent);