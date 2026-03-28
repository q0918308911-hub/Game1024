/**
 * @author Eric 20250805
 * @description: 基本遊戲流程管理介面
 */
import { Component, _decorator } from "cc";
import { IBasicGameViewManager, IGameProcess, IBuyFgProcess, ITestMode } from "./IBasicGameViewManager";
import { WinScoreData } from "../../MyUtils/BasicGameDataDefinition/BasicGameDataDefinition";
import { IProcessSlotData, BasicProcessSlotData } from "../BasicProcessServerData/IProcessSlotData";
import { IBasicProcessServerData, RoundStep } from '../BasicProcessServerData/IBasicProcessServerData';
import { GameState, ShowBottomTextStatus } from '../GameStateConfigDef/GameStateConfigDef';
import { NotifyCation } from '../EventSystem/NotifyCation';
import { GameViewEvents, NotifySubject } from '../BasicGameEvent/EventTypesDefinition';
import { GameUtilsTools } from "../GameUtilsTool";
import { GenericUIManager } from "../ReferencePathForMyUtils";
import { IBasicGameModeManager } from './IBasicGameModeManager';
import { BasicGameStepDelayTime } from '../BasicStepDelayTimeList/BasicGameStepDelayTime';
import { FlowAbortManager } from "../AsyncScope/FlowAbortManager";
import { IAsyncProcess } from "../AsyncScope/Definitions/IAsyncProcess";
import { IFlowProcess } from "../AsyncScope/Definitions/IFlowProcess";
import { IBaseGameProcessKey } from "../AsyncScope/Definitions/IFlowProcessKeys";
import { BasicGameFlowProcessKey } from "../AsyncScope/Definitions/BasicGameFlowProcessKey";
import { AsyncScope } from '../AsyncScope/AsyncScope';
import { UniSlotMachine, UniReelView, IReel, NewFlashModeEnum } from "db://assets/Scripts/ModuleEntry";

/*
    P extends BasicProcessSlotData,
    S extends IProcessSlotData,
    G extends GameState = GameState,
    D extends IBasicProcessServerData<P, S, G> = IBasicProcessServerData<P, S, G>
    */
/*
export enum GameProcess {
    CORE_MAIN_PROCESS = 'CORE_MAIN_PROCESS',//-主要遊戲流程
}*/
const { ccclass, property } = _decorator;

@ccclass('BasicSlotGameViewManager')
export abstract class BasicSlotGameViewManager<
    Srv extends BasicProcessSlotData,         // server原始資料
    Out extends IProcessSlotData,             // 解析後的回合資料
    G extends GameState = GameState,
    D extends IBasicProcessServerData<Srv, Out, G> = IBasicProcessServerData<Srv, Out, G>
> extends Component implements IGameProcess<Srv, Out, G>, IBasicGameViewManager, ITestMode, IAsyncProcess, IFlowProcess {

    @property({ type: UniSlotMachine, visible: true, displayName: 'Slot Machine', tooltip: 'slotMachine' })
    protected _slotMachine!: UniSlotMachine<UniReelView<IReel>>;

    protected _gameModeManager: IBasicGameModeManager;
    /**移動與紀錄處理後的ServerProcessData */
    protected _processedServerData: D | null = null;
    /** 是否為這一輪的狀態*/
    protected _isThisRound: boolean = false;
    /**是否開始計算這一輪的得分 */
    protected _startGetScoreInThisRound: boolean = false;
    /** 延遲動畫取消函式(for 延遲中斷時,阻斷tweenPromise resolve) */
    protected _delayTweenCancel: (() => void) | undefined;
    /** 遊戲步驟延遲時間列表 */
    protected _gameStepDelayTimeList: BasicGameStepDelayTime;
    protected _flowMgr: FlowAbortManager;
    protected _flowKeys: IBaseGameProcessKey;
    protected _currentTurboSpeed: boolean = false; //---是否為Turbo模式
    protected _isStop: boolean = false;//--是否已經按下stop按鈕(startSpin會關閉)
    protected _isRollEnd: boolean = false;//--是否已經全部滾輪停止
    protected _isInterrupting: boolean = false;
    protected _async: AsyncScope;//--註冊管理使用promise/delayTime工具  
    protected _autoTimerPromise: Promise<void> | null = null;

    isAutoSpinMode: boolean = false; //---是否為自動模式---
    /**在初始化之前執行的邏輯 */
    abstract beforeInit(): void
    /** 初始化遊戲流程管理器*/
    public init(): void {
        this._flowMgr = FlowAbortManager.getInstance();
        this._flowKeys = BasicGameFlowProcessKey;
        this._async = AsyncScope.getInstance();
    }

    public registerSystem(): void {
        //const flowKey = this._flowKeys.CORE_MAIN_PROCESS;
        //const signal = this._async.createAbortScope(flowKey, this.onFlowAbortCallback);
    }

    //============================== 測試模式狀態 ==============================
    runTest(value?: any): Promise<void> {

        const evtData = {
            eventType: GameViewEvents.SET_BOTTOM_TEXT,
            eventData: {
                status: ShowBottomTextStatus.NO_WIN
                //value: totalMultiplierValue,
            }
        }
        NotifyCation.getInstance().emitSync(NotifySubject.GAME_VIEW_SUBJECT, evtData.eventType, evtData);
        return null;

    }

    //============================== 模式與狀態 ==============================
    //---返回大廳的邏輯<目前沒用到,之後用到再補吧>---
    goBackLobby(): void {

    }
    //---切換場景的邏輯<目前沒用到,之後再補吧>---
    changeScene(sceneName?: string): void {
    }


    //---在初始化之前執行的邏輯---
    //============================== 模式與狀態 ==============================

    //==================interface<IFlowProcess>========================
    //--取消
    public getFlowKeyGroups(processKey?: string): string[][] {
        const defaultProcessGroup: string[][] = [];
        switch (processKey) {
            case this._flowKeys.CORE_MAIN_PROCESS:
                //--這邊要照順序塞,代表這是主要的遊戲流程(有順序性)
                defaultProcessGroup.push([
                    BasicGameFlowProcessKey.START_ROLL,
                    BasicGameFlowProcessKey.STOP_ROLL,
                    BasicGameFlowProcessKey.BEFORE_ALL_REEL_ROLL_END,
                    BasicGameFlowProcessKey.SHOW_RESULT_AFTER_ROLL,
                    BasicGameFlowProcessKey.PROCESS_ROUND,
                    BasicGameFlowProcessKey.PROCESS_NORMAL_ROUND,
                    //BasicGameFlowProcessKey.OTHER
                ]);
                break;
        }

        return defaultProcessGroup;
    }
    public buildFlowStages(processKey?: string): string[] {

        const stages: string[] = [];
        for (const group of this.getFlowKeyGroups(processKey)) {
            for (const key of group) {
                const val = this._flowKeys[key];
                if (val) stages.push(val as string);
            }
        }
        return stages;
    }
    //==================interface<IAsyncProcess>========================
    public onFlowAbortCallback = (flowKey: string) => {

    };

    //============================== 加速timeScale狀態 ==============================
    public abstract setGameTimeScale(): void//--這邊單純通知就好了,因為GameTimeScale是靜態的直接取值即可

    public abstract setTwoLevelTurboMode(turboMode: NewFlashModeEnum): void
    //============================== 加速timeScale狀態 ==============================

    //============================== 盤面資料接收 =============================
    //---寫入server新的資料---
    public setServerReceiveData(processData: Srv): void {
        //--重置資料
        this._processedServerData.setServerReceiveData(processData);
    }

    //---20260108新增: 用來處理server回傳資料是增量式(分段)更新的情況---
    public setServerReceiveDataIncremental(data: Srv, state: G, updateAll: boolean = true): void {
        //--重置資料
        this._processedServerData.setServerReceiveDataIncremental(data, state, updateAll);
    }
    //--override-20260316新增: 用來處理其他類型的資料(例如說挑戰遊戲的資料)
    public setOtherActionData(data: any): void {

    }
    //--override-20260316新增: 用來處理其他類型的資料(例如說進入FG後的資料)
    public setOtherActionWithBetData(data: any): void {

    }

    //--20260316新增: 動態設定自定義屬性(這些屬性不會直接放在類別上,而是放在一個Map裡面,避免與既有屬性衝突)---
    public setServerDynamicProperty<T = any>(key: string, value: T): void {
        this._processedServerData.setDynamicProperty(key, value);
    }

    //--寫完資料的後續行為
    //--用來處理收到其他類型資料後的行為(例如說收到挑戰遊戲的資料後要開起挑戰遊戲的面板)
    public afterReceiveOtherAction(): void {

    }
    //--用來處理收到其他類型資料後的行為(例如說收到進入FG的資料後要開起FG的面板)
    public afterReceiveOtherActionWithBet(): void {

    }

    //----重置資料準備新一輪
    protected resetDataForNewRound(): void {

    }
    //============================== 盤面資料接收 =============================

    //============================== 下注與FG面板 =============================

    //---玩家下注金額改變時,更新下注金額
    abstract setPlayerBetValue(betValue: number): void


    //============================== 下注與FG面板 =============================

    //============================== slotMachine控制 =========================

    //---玩家按下自動按鈕---
    abstract setStartAutoSpinMode(isAuto: boolean): void

    //--在向Server要資料前開啟轉動計時,在Server資料回來後要等這個計時器結束才會繼續流程
    public setAutoModeTimer(): Promise<void> {

        const gameState = this._processedServerData.getCurrentStep()!;
        let currentState;
        if (gameState == null) {
            currentState = GameState.NORMAL;
        } else {
            currentState = gameState.state;
        }
        //--這邊因為要踩在全部停止的時間是要吻合企劃在做停止的時間點(這邊1階段是0.8秒,2階段是0.5秒.....)
        let delayTime = this.processRollToStopTime(currentState);

        this._autoTimerPromise = this.addTweenDelay(delayTime).then(() => {
            //--delay---
            this._autoTimerPromise = null;
        });
        return this._autoTimerPromise;

    }

    //--寫完server新的資料後會呼叫這個方法(gameController要接起來)
    public async newRoundDataToStopSpin(): Promise<void> {

        if (this._autoTimerPromise) {
            await this._autoTimerPromise;
        }
        const step = this._processedServerData.getCurrentData();
        this.stopSpin(step);

    }
    //---玩家按下spin按鈕(空白按鍵)---
    public startSpin(other?: any): void {

        try {
            GenericUIManager.instance.setMainUIToSpinMode();//---spin按鈕上鎖,變成stopSpin按鈕
        } catch (error) {
            console.log('uiObject not found or setMainUIToSpinMode error:', error);
            //console.warn('[BasicSlotGameViewManager] GenericUIManager instance not found or setMainUIToSpinMode error:', error);
        }

        this.reSetDataForBeforeSpin(other).then(() => {
            this.doStartSpin();
        });
    }
    //--接上slotMachine.startRoll
    protected doStartSpin(): void {

        this._isStop = false; //---每次spin都要重置這個
        this._isRollEnd = false;
        this._isInterrupting = false; //---重置中斷狀態
    }
    //--清除相關資料
    protected abstract reSetDataForBeforeSpin(other?: any): Promise<void>;

    //--全部停止後的處理(在表演前)
    protected abstract beforeAllReelRollEnd(): Promise<void>;
    //---玩家按下stop按鈕(空白按鍵)---
    public async stopSpin(slotData: Out, other?: any): Promise<void> {

        if (this._isStop) return;
        if (!slotData) return; // slotData 為 null，直接退出（不會設 _isStop）
        this._isStop = true;
        this.beforeStopSpin();
        await this.doStopSpin(slotData);
        this._isRollEnd = true;
        await this.beforeAllReelRollEnd();
        //--20250827---
        /**
         * 這裡要再多一個表演前要處理的事情
         * 例如:秀甚麼鬼東西或是特殊模式的開啟(再算分前)
         */
        this.processAfterAllReelRollEnd();
    }

    //---玩家按下stop按鈕---
    /**
     * 需要檢查流程再進行相對的處理,目前這樣是等於每次都去getCurrentStepForClick
     */
    public onStopBtnClickHandler(): void {
        //--玩家按下後gameRoot會處理...
        //--20251016--現在stop按鈕都要常駐狀態
        GenericUIManager.instance.setMainUIStopBtnEnabled();//...直接被拿掉了..真的很機掰

        if (this._isRollEnd) {

            if (!this._isInterrupting) {
                this._isInterrupting = true;
                this.changeInterruptingStatus();
                this._async.abortAll();
                //--可取消
                NotifyCation.getInstance().emitSync(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.INTERRUPT_PROCESS, true);
            }

        } else {

            this._slotMachine.stopRollCallBack();
        }

    }
    //--這裡會開始真的呼叫stopSpin
    protected abstract doStopSpin(slotData: Out): Promise<void>;

    protected abstract changeInterruptingStatus(): void;

    protected beforeStopSpin(): any {
        //---在玩家按下stop之前要做的事
        //--要拿該局資料直接跟_processedServerData.getCurrentData拿
        //---例如:擷取資料之類的
        return null;
    }

    //============================== slotMachine控制 =========================

    //============================== 回合處理(after stopRoll) =================

    protected async processAfterAllReelRollEnd(): Promise<void> {
        //--await處理完的slot停止
        const totalWinScore = this.calculateTotalWinScore();//--感覺可以省了

        if (totalWinScore > 0) {
            //--關閉面板按鈕準備接表演 
            this._startGetScoreInThisRound = true;

        } else {
            //--通知下一把 
            //---沒有中獎的情況下要做的事情
            if (!this._startGetScoreInThisRound) {
                const evtData = {
                    eventType: GameViewEvents.SET_BOTTOM_TEXT,
                    eventData: {
                        status: ShowBottomTextStatus.NO_WIN
                        //value: totalMultiplierValue,
                    }
                }
                NotifyCation.getInstance().emitSync(NotifySubject.GAME_VIEW_SUBJECT, evtData.eventType, evtData);
            }
        }
        //return;
        //--統一處理表演(不管有沒有得分)
        await this.doShowResultAfterStopRoll();
        //return;
        this.checkNextRound();
    }
    //---表演處理一定要實作
    protected abstract doShowResultAfterStopRoll(): Promise<void>;

    /**
     * 正常結束這一round的處理
     * 當fg和reSpine的資料都清空後(或是為空)即進入結束這一round的處理
     */
    public async processNormalRound(freeEnd?: boolean): Promise<void> {

        this._isThisRound = false; //--這一輪結束後要重置為false
        this._isInterrupting = false; //---重置中斷狀態
        this.resetDataForNewRound();//--重置資料相關處理
        const delayRoundStep = this.checkConditionForRoundStep();

        await this.addTweenDelay(delayRoundStep);

        //--通知gameController 開始下一round
        NotifyCation.getInstance().emitSync(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.SHOW_END, null);
    }
    //--freeGame/reSpine的處理 
    public async processRound(gameState: G, slotData: Out): Promise<void> {

        this.prepareForNextRound();

        if (!this._startGetScoreInThisRound) {
            GenericUIManager.instance.showBottomTextStartSpin();//-spin按鈕狀態
        }
        //--局間停頓時間
        const delayRoundStep = this.checkConditionForRoundStep();
        const signal = this._async.createAbortScope(this._flowKeys.PROCESS_ROUND);
        const cancel = () => {

        }

        const waitPromise = this._async.waitSecondsTracked(delayRoundStep, this._flowKeys.PROCESS_ROUND, cancel, true, signal, this._flowKeys.PROCESS_ROUND);
        await waitPromise.promise;

        this._isInterrupting = false; //---重置中斷狀態


        /**
         * 這是給 this._slotMachineController.stopRollCallBack
         * 使用的資料,因為他會直接灌進stopSpin裡面
         */
        //this.changeGameMode(gameState);
        this._processedServerData.setSpinIndexForTemporary();

        this.startSpin();
        //--要滾多久的時間

        let delay = this.processRollToStopTime(gameState).fixed();
        await this.addTweenDelay(delay);
        this.stopSpin(this._processedServerData.getCurrentStepForClick()?.data!);
    }

    //--取得滾動到停止的時間處理(就是要滾動多久的時間-20251214)
    abstract processRollToStopTime(gameState: G): number;

    abstract checkConditionForRoundStep(): number;//--計算下一輪開始要暫停多久

    //--20260129-new因78企劃新的需求要將計算FG/RS次數提前算
    protected abstract beforeProcessNewRoundData(): void;

    public async checkNextRound(): Promise<void> {

        //--注意NG->FG的狀況
        this.beforeProcessNewRoundData();//--提前處理相關局之中的特殊計次資料
        //--檢查是否有下一round,有的話自己會進位(this._roundIdx++)
        if (this._processedServerData.setRoundIdx()) {
            //--進位後就直接取出下一把資料
            const step = this._processedServerData.getCurrentStep()!;
            switch (step.state) {

                case GameState.NORMAL:
                    this.processRound(step.state, step.data);
                    break;


                case GameState.RE_SPINE:
                    // ... re-spin 邏輯
                    await this.beforeProcessReSpinRound(step);
                    this.processRound(step.state, step.data);
                    break;

                case GameState.FREE_GAME:
                    // ... FG 邏輯
                    await this.beforeProcessFGRound(step);
                    this.processRound(step.state, step.data);
                    break;

                //--第一筆資料就被取走了,所以這邊是不可能進到case:NORMAL
                //--若之後如果要在 timeline 尾端塞 NORMAL 當終止步，就會走到這裡(目前沒有)
                default:
                    console.warn('[GameViewManager] Unknown GameState:', step.state);
                    this.finalizeToNormal();
                    // 視情況做降級處理
                    //this.changeGameMode(GameState.NORMAL);
                    //this.processRound(GameState.NORMAL, step.data);
                    break;
            }

        } else {
            //--結束
            if (!this.checkSpConditionForFinalizeToNormal()) {
                this.finalizeToNormal();
            } else {
                //--進入後續的比倍或是相關特殊模式的流程(如果有的話)
                await this.beforeProcessSpRound();
                this.processSpRound();
            }

        }

    }


    /**
     * 20260317新增:檢查是否吻合回到Normal的條件
     * 在兩段式要牌的流程中,NG與FG的盤面資料會被分開.
     * 所以在跑step位移資料時,發現NG的index到底後,在原始流程下會進到finalizeToNormal.
     * 這邊切出分支是為了之後如果有特殊的條件才會進行finalizeToNormal的流程,
     * 如果沒有就直接結束不進入finalizeToNormal
     * 
     * @returns 
     */
    protected checkSpConditionForFinalizeToNormal(): boolean {
        return true;
    }

    /**
     * 20260317新增: 不進入finalizeToNormal的流程,用來走兩段式取牌
     * @returns 
     */
    protected async beforeProcessSpRound(): Promise<void> {
        return Promise.resolve();
    }
    /**
     * 20260317新增: 兩段式取牌的流程,在這個流程裡面會有一段是走SP的流程,
     * 在SP流程結束後會再接回正常的流程
     * 
     */
    protected processSpRound(): void {

    }

    protected async finalizeToNormal(): Promise<void> {
        await this.beforeProcessNormalRound();
        this.processNormalRound();
    }

    protected prepareForNextRound(): any {
        //--準備下一個NG/FG或ReSpin的資料
        return null;
    }
    //--已經是新round的資料了
    protected beforeProcessReSpinRound(value?: RoundStep<Out, G>): Promise<void> {
        //--處理ReSpin之前要做的事
        //---例如:擷取資料之類的
        return Promise.resolve();
    }
    //--結束該round資料前處理.準備跟Server要下一round的資料
    protected beforeProcessNormalRound(): Promise<void> {
        //--處理回到Normal(整把結束FG->NG要資料)之前要做的事
        //---例如:擷取資料之類的
        return Promise.resolve();
    }
    //--已經是新round的資料了
    protected beforeProcessFGRound(value?: RoundStep<Out, G>): Promise<void> {
        //--處理FG之前要做的事
        //---例如:擷取資料之類的
        return Promise.resolve();
    }

    //============================== 回合處理(after stopRoll) =================


    //============================== 分數相關資料處理 ==========================

    protected calculateTotalWinScore(): number {
        //---計算這一輪的總分---
        const roundScore = this._processedServerData.getThisRoundTotalWinScore();
        return roundScore;
    }

    protected createWinScoreData(): WinScoreData {

        const thisRoundBetInfo = this._processedServerData.getRoundBetAndOdds();
        return {
            baseOdds: 0, // 待刪除
            totalOdd: thisRoundBetInfo.odds,//--裡面的資料如果是fg的話,他已經是乘上倍率的值(每一輪)
            betValue: thisRoundBetInfo.betValue,
            multiplier: null//--有的話自己接出來時做
        };
    }

    //============================== 分數相關資料處理 ==========================

    //============================== other ====================================
    protected async addTweenDelay(time?: number): Promise<void> {
        let t = time;
        if (!time) {
            t = 0;
        }
        const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(t);
        this._delayTweenCancel = delay.cancel;
        await delay.promise; // 等待延遲完成
        this._delayTweenCancel = null; // 清掉
    }
    //============================== other ====================================

}

//--擁有購買FG功能的遊戲流程管理器
export abstract class BasicSlotWithBuyFG<P extends BasicProcessSlotData, S extends IProcessSlotData> extends BasicSlotGameViewManager<P, S> implements IBuyFgProcess {
    isBuyFG: boolean;//---是否購買FG的狀態
    public abstract reOpenFgBtn(): void;
    public abstract setCurrentBetAndOpenBuyFG(): void;
    public abstract getBuyFgPanelIsOpen(): boolean;
    public abstract setFgState(isBuyFG: boolean): void;
    public abstract setFGTotalBetForThisRound(fgBetValue: number): void;
}


