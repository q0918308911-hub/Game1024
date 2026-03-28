//--以下interface定義了遊戲流程中所有共通邏輯與流程事件的接口
//--可以在不同的類型的遊戲當中自由的選擇要組合實作哪一種interface

/**
 * @author Eric 20250805
 * @description: 基本遊戲流程管理介面
 * - 定義了遊戲流程中所有共通邏輯與流程事件的接口。
 * - 所有具體 GameViewManager 應繼承本類並實作 abstract 方法。
 * - 包含遊戲模式管理、場景切換、返回大廳等功能。
 * - 這個介面是遊戲流程的核心，
 */
export interface IBasicGameViewManager {
    //beforeInit(): void;
    init(): void;
    goBackLobby(): void;
    changeScene(sceneName?: string): void;
}

/**
 * @author Eric 20250805
 * @description: 基本遊戲流程介面
 * - 定義了遊戲流程中所有共通邏輯與流程事件的接口。
 * - 所有具體 GameViewManager 應繼承本類並實作 abstract 方法。
 */
export interface IGameProcess<P, S, G = null> {
    isAutoSpinMode: boolean; //---是否為自動模式---
    registerSystem(): void;
    startSpin(other?: any): void;//---玩家按下spin按鈕(空白按鍵)---
    stopSpin(slotData: S, other?: any): void; //---玩家按下stop按鈕(空白按鍵)---
    onStopBtnClickHandler(): void; //---玩家按下stop按鈕---
    //--在auto模式下要去開起startSpin的計時器在資料回來後須等待計時器完成才能接續流程
    setAutoModeTimer(): Promise<void>;
    // 回合處理
    processNormalRound(): Promise<void>;//--結束這一round
    processRound(gameState: G, slotData: S): Promise<void>//--FG&reSpine回合處理(開轉前的資料處理)
    checkConditionForRoundStep(): number;//--計算下一輪開始要暫停多久
    processRollToStopTime(gameState: G): number//--取得滾動到停止的時間處理20251214
    checkNextRound(): Promise<void>//--回合檢查與資料準備
    /**
     * 1.gameRoot有更新都會送進來更新
     * 2.在購買FG後要顯示總購買金額,當FG結束後要回復預設金額
     * @param value 下注金額
     */
    setPlayerBetValue(betValue: number): void;//---玩家下注金額改變時,更新下注金額
    setServerReceiveData(processData: P): void;
    setServerReceiveDataIncremental(data: P, state: G, updateAll?: boolean): void;//--20260108新增: 用來處理server回傳資料是增量式(分段)更新的情況
    setStartAutoSpinMode(isAuto: boolean): void; //---玩家按下自動按鈕---
    newRoundDataToStopSpin(): Promise<void>//-//--寫完server新的資料後會呼叫這個方法
    //--20260316
    //--寫資料
    setOtherActionData(data: any): void;//--用來處理其他類型的資料(例如說挑戰遊戲的資料)
    setOtherActionWithBetData(data: any): void;//--用來處理其他類型的資料(例如說進入FG後的資料)
    //--寫完資料的後續行為
    afterReceiveOtherAction(): void;//--用來處理收到其他類型資料後的行為(例如說收到挑戰遊戲的資料後要開起挑戰遊戲的面板)
    afterReceiveOtherActionWithBet(): void;//--用來處理收到其他類型資料後的行為(例如說收到進入FG的資料後要開起FG的面板)
}

export interface ITestMode {
    runTest(value?: any): Promise<void>;
}

/**
 * @author Eric 20250805
 * @description: 購買FG的流程
 * - 這個介面定義了購買FG的流程方法。
 * - 需要實作購買FG的相關邏輯。
 * 如果你的遊戲有該功能，請實作這個介面。
 */
export interface IBuyFgProcess {
    isBuyFG: boolean;//---是否購買FG的狀態
    reOpenFgBtn(): void;//---購買FG資格不符合or結束FG,重新開啟按鈕
    setCurrentBetAndOpenBuyFG(): void;//---開啟購買FG的介面,需要更新玩家當前的下注額度
    getBuyFgPanelIsOpen(): boolean;//---購買FG的介面是否開啟
    setFgState(isBuyFG: boolean): void;//---購買FG的狀態
    setFGTotalBetForThisRound(fgBetValue: number): void;//---購買FG的倍率
}
