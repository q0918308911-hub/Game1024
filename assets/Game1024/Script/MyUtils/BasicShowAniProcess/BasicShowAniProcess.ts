import { Node } from 'cc';
import { IBasicShowAniProcess } from "./IBasicShowAniProcess";
import { AnimationNodesControllerBase } from "../AnimationSystemV3/AnimationNodesControllerBase";
import { IGameMode } from '../BasicGameViewManager/IBasicGameModeManager';
import { GameState } from '../GameStateConfigDef/GameStateConfigDef';
import { NotifyCation } from '../EventSystem/NotifyCation';
import { GameViewEvents, NotifySubject } from '../BasicGameEvent/EventTypesDefinition';
import { ShowBottomTextStatus } from '../GameStateConfigDef/GameStateConfigDef';
import { GameUtilsTools } from '../GameUtilsTool';
import { DYN_NODE_PROPERTIES } from "../AnimationSystemV3/ReferencePathForAnimationSysV3";
import { AsyncScope } from '../AsyncScope/AsyncScope';
import { FlowAbortManager } from '../AsyncScope/FlowAbortManager';
import { BasicShowResultProcessKey } from '../AsyncScope/Definitions/BasicGameFlowProcessKey';
import { IShowResultProcessKey } from '../AsyncScope/Definitions/IFlowProcessKeys';
import { BasicGameStepDelayTime } from '../BasicStepDelayTimeList/BasicGameStepDelayTime';
import { IAsyncProcess } from '../AsyncScope/Definitions/IAsyncProcess';
import { IFlowProcess } from '../AsyncScope/Definitions/IFlowProcess';
//--要在繼承AnimationNodesControllerBase的類別中實作這個介面

export const DEBUG_TITLE = 'BasicShowAniProcess';
export const DEBUG_TITLE2 = 'BasicShowAniProcess_debug';
//--這邊作抽象流程控制,上面透過繼承和加入轉接器的介面來實作

export interface LayerSpec {
    level: number,//--排列的順序權
    conditionSymbolGroup: number[]
}
//--流程群組的key
export enum ShowFlowKeyGroups {

    PASS_SEQUENCE = 'PASS_SEQUENCE',//--直接跳過輪播的條件
    RUN_SHOW_PROCESS = 'RUN_SHOW_PROCESS',
    TEST = 'TEST'
}
//--流程中會用到的條件key
export enum ProcessConditions {
    IS_PASS_SEQUENCE = 'IS_PASS_SEQUENCE',//--直接跳過輪播的條件
    IS_BIG_WIN = 'IS_BIG_WIN',//--有大獎的條件
    IS_SHOW_WIN = 'IS_SHOW_WIN'//--秀得分的條件
}

/**
 * TIMatchInfo=IMatchInfoForRound
 * TWinScore=WinScoreData
 * TIProcessInput=IProcessInput
 * 
 */
export abstract class BasicShowAniProcess<TIMatchInfo, TWinScore, TIProcessInput> extends
    AnimationNodesControllerBase<TIProcessInput>
    implements IBasicShowAniProcess<TIMatchInfo, TWinScore>, IGameMode, IAsyncProcess, IFlowProcess {

    protected _arySortLayerSymbol: LayerSpec[] = [];
    protected _async: AsyncScope;//--註冊管理使用promise/delayTime工具       
    protected _abortPlaySequence: boolean = false; // 是否中止播放序列
    protected _scoreData: TWinScore; // 當前得分資料
    protected _linesData: TIMatchInfo[] = []; // 當前中線資料

    protected _gameStepDelayTimeList: BasicGameStepDelayTime; // 遊戲步驟延遲時間列表
    protected _flowMgr: FlowAbortManager; // FlowAbortManager 
    //--基礎流程keyMap
    protected _flowKeys: IShowResultProcessKey;
    protected _processTimeCount: Map<string, { time: number, end: boolean }> = new Map();
    protected _mapInterruptProcess: Map<string, boolean> = new Map();
    protected _cloneScoreData: any = null;
    protected _previousHasWin: boolean = false;//--前一輪是否得分(節奏企劃78的需求)

    constructor() {
        super();
    }



    //-註冊時間計時器
    protected registerTimeCount(tK: string): void {

        if (!this._processTimeCount.has(tK)) {
            this._processTimeCount.set(tK, { time: 0, end: false });
        }
    }

    protected removeTimeCount(tK: string): void {

        if (this._processTimeCount.has(tK)) {
            this._processTimeCount.delete(tK);
        }
    }

    protected startTimeCount(tK: string): void {

        if (this._processTimeCount.has(tK)) {
            this._processTimeCount.set(tK, { time: Date.now(), end: false });
        }
    }

    protected endTimeCount(tK: string): number | null {

        if (this._processTimeCount.has(tK)) {
            const target = this._processTimeCount.get(tK);
            if (target.time && target.time > 0 && !target.end) {
                const duration = Date.now() - target.time;
                this._processTimeCount.set(tK, { time: duration, end: true });
                return duration;
            } else if (target.time && target.time > 0 && target.end) {
                return target.time;
            }
        }
        return null;
    }
    //===================  流程 Abort 管理 ===================
    //==================interface<IAsyncProcess>========================
    public onFlowAbortCallback = (flowKey: string) => {

        GameUtilsTools.debugLog('BasicShowAniProcess', `[AbortCallback] 流程 ${flowKey} 被中止`);
        if (this._mapInterruptProcess.has(flowKey)) {
            this._mapInterruptProcess.set(flowKey, true);
        }
        if (flowKey === 'RunShowProcess') this._abortPlaySequence = true;
    };

    //--註冊取消的函示
    protected onCancelAsync = (label: string) => {
        GameUtilsTools.debugLog(DEBUG_TITLE, `[onCancel] 取消函式被呼叫`, { label });
    }

    protected handleFlowAbort(flowKey: string): void {
        switch (flowKey) {
            case 'RunShowProcess':
                this._abortPlaySequence = true;
                GameUtilsTools.debugLog(DEBUG_TITLE, `[HandleAbort] RunShowProcess 被中止`);
                break;
            case 'CleanAllPlaying':
                GameUtilsTools.debugLog(DEBUG_TITLE, `[HandleAbort] CleanAllPlaying 被中止`);
                break;
            default:
                GameUtilsTools.debugLog(DEBUG_TITLE, `[HandleAbort] 未知流程中止`, { flowKey });
        }
    }


    //==================interface<IFlowProcess>========================

    /**
     * <目前先擱置>
     * override 你可以自己定義要註冊的流程關鍵字群組
     * TIPS:
     * 這裡是定義「流程群組」的地方
     * 每個群組內是「多個流程關鍵字」的陣列
     * 每個群組代表一個完整的流程
     * 每個流程內的關鍵字會依序執行
     * 你可以各種花式組合
     * e.g:
     * [[ABCD],[ACF]...]=一個流程
     * @returns 
     */
    public getFlowKeyGroups(processKey?: ShowFlowKeyGroups): string[][] {

        const defaultProcessGroup: string[][] = [];
        switch (processKey) {
            case ShowFlowKeyGroups.RUN_SHOW_PROCESS:
                defaultProcessGroup.push([
                    BasicShowResultProcessKey.playNoWinInThisRound,
                    BasicShowResultProcessKey.ShowBigWin,
                    BasicShowResultProcessKey.PlayWinRound,
                    BasicShowResultProcessKey.ShowWinScore,
                    BasicShowResultProcessKey.ShowWinScoreForBottomText,
                    BasicShowResultProcessKey.ProcessResetAni,
                    BasicShowResultProcessKey.ProcessBeforePlaySequence
                ]);
                break;
        }

        return defaultProcessGroup;
    }

    //-建立流程階段陣列--<目前先擱置>
    public buildFlowStages(processKey?: ShowFlowKeyGroups): string[] {

        const stages: string[] = [];
        for (const group of this.getFlowKeyGroups(processKey)) {
            for (const key of group) {
                const val = this._flowKeys[key];
                if (val) stages.push(val as string);
            }
        }
        return stages;
    }

    //===================interface<IGameMode>===================
    abstract changeGameState(value: GameState): void;

    //===================interface<IBasicShowAniProcess>===================
    //--初始化流程
    public init(): void {

        this._async = AsyncScope.getInstance();
        //this._flowMgr = new FlowAbortManager(this._async, this._onFlowAbortCallback);
        this._flowMgr = FlowAbortManager.getInstance();
        this._flowKeys = BasicShowResultProcessKey;
    }

    public cancelAllDelays(): void {
        this._async?.cancelAll();
    }
    // 註冊流程其他的系統從這邊初始起來
    abstract register(): void;

    /**
     * server資料回來後新一局開始start spin時可以呼叫
     * (這邊可以開始做不同的狀態判斷)
     */
    public async cleanAllPlayingAniForNewStart(): Promise<void> {

        this._abortPlaySequence = true;
        // 3) 通用：清 winLines、重置旗標
        this.stopMultipleSequence();    // 例：this.winLinesGroupData = [];
        this.stopAndPauseWinAni();  //--強制暫停所有得分動畫
        this.stopAndHideConnectBoxAni();//--強制中斷連線中動畫(單純的指線/框的動畫)
        this.stopAndResetOtherAni?.();//--20260102:強制停止/重置其他動畫
        // 4) 通用：取消延遲/timeout、解掉懸掛 promise（base 已提供工具）
        this.cancelAllDelays?.();
        this.safeResolve?.();
        // 5) 分支：由子類決定「特殊」或「一般」清理
        if (this.isSpecialCleanupNeededForNewStart()) {
            await this.doSpecialCleanupForNewStart();
        } else {
            await this.doRegularCleanupForNewStart();
        }
    }
    //--重置資料(還在該局內)
    public resetRoundData(): void {

        this._scoreData = null;
        this._linesData = [];
        this._flowMgr?.reset();
    }
    //=====跳過流程=====
    //--跳過目前的流程(包含動畫)
    public skipCurrentProcess(): void {
        //GameUtilsTools.debugLog(DEBUG_TITLE, 'skipCurrentProcess', '手動跳過目前流程');
        this._async.resolveAllPending();
        this.safeResolve();
        this._abortPlaySequence = true;
    }

    //--重置所有資料(包含該局內的)
    abstract resetAllData(): void;
    //--在新一局開始前，清除所有正在播放的動畫(尚未交還動畫,只有停止播放)
    abstract cleanAllPlayingBeforeNewStart(): Promise<void>;
    //子類決定這回合是否需要「特殊清理」（例：Wild 正在工作）
    protected abstract isSpecialCleanupNeededForNewStart(): boolean;
    //子類實作：特殊清理（例：可移除/關 Wild → 全清 + resetWild）
    protected abstract doSpecialCleanupForNewStart(): Promise<void>;
    //子類實作：一般清理（例：NG/FG → 刪但保留高賠率回 GameIcon）
    protected abstract doRegularCleanupForNewStart(): Promise<void>;
    //子類實作：強制停止分數/框線等（原本的 _winScore.stopWinScoreAni + 其他）
    protected abstract stopAndPauseWinAni(): void;
    //--強制移除所有動畫
    abstract stopAndRemoveAllAnis(): void;
    abstract playNoWinInThisRound(lines?: TIMatchInfo[]): Promise<void>;
    abstract playWinInThisRound(winScoreData: TWinScore, lines?: TIMatchInfo[]): Promise<void>;

    //--強制中斷連線中動畫(單純的指線/框的動畫)
    abstract stopAndHideConnectBoxAni(): void;
    //--20260102:強制停止/重置其他動畫
    abstract stopAndResetOtherAni(): void;

    //--顯示底部文字
    public showScoreForBottomText(score: number): void {

        if (score > 0) {
            const evtData = {
                eventType: GameViewEvents.SET_BOTTOM_TEXT,
                eventData: {
                    status: ShowBottomTextStatus.WIN,
                    value: score
                }
            }
            NotifyCation.getInstance().emitSync(NotifySubject.GAME_VIEW_SUBJECT, evtData.eventType, evtData);
        }
    }

    //===================interface<IBasicShowAniProcess>===================

    protected abstract processWinScoreData(winLineData: TIMatchInfo[], otherInfo?: any): Promise<void>;

    //=====資料處理與交換=====
    public async beforeProcessWinScoreData(winScoreData: TWinScore, lines: TIMatchInfo[] = [], otherInfo?: any): Promise<{ hasWin: boolean, bigWin: boolean }> {
        //--在處理得分資料前的動作(可修改資料)
        if (winScoreData == null) {
            GameUtilsTools.debugLog('BasicShowAniProcess_debug', 'beforeProcessWinScoreData', { winScoreData });
        }
        this._cloneScoreData = GameUtilsTools.deepClone(winScoreData);
        this._scoreData = winScoreData;
        this._linesData = lines;
        this.resetWinSore();
        //---先解析資料,這樣中斷流程時才好處理
        let checkScoreProcess = this.hasWin(winScoreData);
        const bigWinCondition = this.checkBigWinCondition(winScoreData);
        if (checkScoreProcess) {
            await this.processWinScoreData(lines, otherInfo); // 處理得分資料
        }
        return { hasWin: checkScoreProcess, bigWin: bigWinCondition };

    }
    /**外部統一入口,解析得分,T=IMatchInfoForRound */
    //public async runShowProcess(winScoreData?: W, lines?: T[]): Promise<boolean> {
    public async runShowProcess(showWinFlag: boolean): Promise<boolean> {
        //---建立流程
        const flowKey = BasicShowResultProcessKey.RunShowProcess;
        const passSequence = this.checkGoThroughCondition();
        const bigWinCondition = this.checkBigWinCondition(this._scoreData);//--實際用的
        //@ts-ignore
        //this._scoreData.totalOdd = 210;//--測試用
        //const bigWinCondition = true;
        //--流程計時器開啟
        this.registerTimeCount(flowKey);
        this.startTimeCount(flowKey);

        if (!showWinFlag) {
            this._previousHasWin = false;
            await this.playNoWinInThisRound();
            return false;
        }

        //==============================<基礎全播流程>===============================================
        // 有得分 → 播放當局得分流程<全播>
        if (bigWinCondition) {
            // === 有大獎 ===
            this._previousHasWin = true;
            await this.processBigWin();

        } else {

            this._previousHasWin = true;
            const playWinPromise = this.playWinInThisRound(this._scoreData, this._linesData);
            const currentScore = this.getTotalScore(this._scoreData);
            const multiplier = this.getMultiplier(this._scoreData);
            const showScorePromise = this.showWinScoreAni(currentScore, multiplier, true);
            //-讓兩個都完成
            await Promise.allSettled([playWinPromise, showScorePromise]);

        }

        //=======20251118:修改流程結束後的輪播條件=======
        const sequenceFlag = (passSequence) ? false : true;

        await this.processResetAni();

        this.endTimeCount(flowKey);
        this.removeTimeCount(flowKey);
        return sequenceFlag;

    }

    //--輪播動畫
    public async playMultipleSequence(): Promise<void> {
        await this.processBeforePlaySequence();
    }

    //--顯示得分動畫
    public async showWinScoreAni(score: number, multiplier?: number, showBottomText?: boolean): Promise<void> {
        //--顯示得分動畫
        if (showBottomText) {
            this.showScoreForBottomText(this.calculateCurrentRoundOdds(this._scoreData));
        }
    }

    //--處理大贏動畫的流程
    protected async processBigWin(): Promise<void> {

        await this.showBigWinAni(this._scoreData);
        await this.playWinInThisRound(this._scoreData, this._linesData);
    }
    //--處理一般贏動畫的流程
    protected async processNormalWin(): Promise<void> {
        return null;
    }
    //--是否直接跳過輪播
    protected abstract checkGoThroughCondition(): boolean;

    protected abstract checkBigWinCondition(winScoreData: TWinScore): boolean;
    //--輪播前的準備工作(如果是FG就直接resolve,讓外面解鎖開始按鈕)
    abstract processBeforePlaySequence(): Promise<void>;
    //--重置動畫狀態
    abstract processResetAni(): Promise<void>;
    //--停止輪播
    abstract stopMultipleSequence(): void;
    //--重置得分
    abstract resetWinSore(): void;
    //--在全秀之後要走的分支
    abstract playOtherWinShowAni(): void;
    //--播放wild動畫
    abstract playWildAni(): void;
    //--播放bonus動畫
    abstract playBonusAni(): void;
    //--顯示大獎動畫
    abstract showBigWinAni(winScoreData: TWinScore, lines?: TIMatchInfo[]): Promise<void>;
    //--播放垂直的動畫
    abstract showAndWaitForVerticalAni(totalScore: number): Promise<void>
    abstract stopShowVerticalAni(): void
    abstract playShowAnimation(): void;
    abstract stopShowAnimation(): void;

    //========================<testMode>=====================================
    public runTest(value?: any): Promise<void> | void {

    }

    // ==============================
    // ===== 可選擴充的工具方法 =====
    // ==============================
    /** 確保動畫層級排序正確 */
    /**
     *  interface LayerSpec
        {
            level:number,//--排列的順序權
            conditionSymbolGroup:number[]
        }
        按照 level 升序排列，並將符合條件的節點放入對應的層級中。    
     */
    protected sortAnimationLayer(): void {
        if (this._arySortLayerSymbol.length > 0) {
            //-按層級降冪排列(level越小,顯示越上面)
            const sortedLayers = [...this._arySortLayerSymbol].sort((a, b) => b.level - a.level);
            const buckets: Map<number, Node[]> = new Map();
            for (const layer of sortedLayers) {
                buckets.set(layer.level, []);
            }

            for (const item of this._aryRunningNode) {
                const id = item[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO].symbolId;
                if (id === undefined) continue;
                for (const layer of sortedLayers) {
                    if (layer.conditionSymbolGroup.includes(id)) {
                        buckets.get(layer.level)!.push(item);
                        break;
                    }
                }
            }

            let idx = 0;
            for (const layer of sortedLayers) {
                const nodes = buckets.get(layer.level);
                if (!nodes) continue;
                for (const n of nodes) {
                    n.setSiblingIndex(idx++);
                }
            }
        }
    }
    /** 
     * 延遲動畫取消函式(for 延遲中斷時,阻斷tweenPromise resolve)
     * --這個是不會注入asyncScope的,要自己管理(不受asyncScope影響)
     */
    protected _delayTweenCancel: (() => void) | undefined;
    /** promise resolve 函式**/
    protected _resolvePromise: (() => void) | undefined;

    //取得總得分，預設從 winScoreData 解析(這一Round的單獨這一把)
    protected abstract getTotalScore(winScoreData: TWinScore): number;
    protected abstract getMultiplier(winScoreData: TWinScore): number;
    //依照企劃要求不同可以自己決定要秀累計的分數或是單獨這一把的分數
    protected abstract calculateCurrentRoundOdds(winScoreData?: TWinScore): number;

    //檢查是否有得分，預設 >0 即視為中獎 
    protected hasWin(winScoreData: TWinScore): boolean {
        return this.getTotalScore(winScoreData) > 0;
    }

    /**
     * 取消全部改用 async scope 的 promise
     * @param t 單位:秒
     */
    protected async addTweenDelay(t: number): Promise<void> {

        const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(t);
        this._delayTweenCancel = delay.cancel;
        await delay.promise; // 等待延遲完成
        this._delayTweenCancel = null; // 清掉
    }

    /**統一把global promise方法掛進同個地方處理,不要散落一地 */
    protected setPendingResolve(res: () => void): void {
        this.safeResolve();
        this._resolvePromise = res;
    }

    /**你懂得.... */
    protected safeResolve(): void {
        if (this._resolvePromise) {
            const r = this._resolvePromise;
            this._resolvePromise = undefined;
            try { r(); } catch { }
        }
    }
}