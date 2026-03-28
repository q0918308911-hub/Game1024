import { _decorator, Asset, Node, sp } from "cc";
import {
    AnimationController,
    AnimationControllersPoolManager,
    AnimationStateType,
    AniSysTools,
    BasicShowAniProcess,
    DYN_NODE_PROPERTIES,
    FunctionType, GameState,
    GameUtilsTools,
    IAnimationControl,
    ICrossSystemSymbolAniService,
    IFunctionOwnerAgent,
    IGameMode,
    IMachPosInfo,
    IMatchInfoForRound,
    IPlayAniData,
    IPropertyTransferAgent,
    IPropertyTransferData,
    IReelInfo,
    ISyncDataAgent,
    ISyncDatatype,
    NotifyCation,
    NotifySubject,
    WinScoreData
} from "../../ReferencePath";
import { SymbolOwnerAgentID } from "../../DefinitionGameData1024/GameGlobalData1024";
import { SyncBackProcessType1024, SyncDataType1024 } from "../../CrossSys1024/SyncData1024/SyncDataDef1024";
import { MonkFxCtrl } from "../MonkFx/MonkFxCtrl";
import { ShakeCamera } from "../../MyUtils/BasicEffect/Components/ShakeCamera";
import { SymbolAniMediatorHooks1024 } from "../../CrossSys1024/AniMediator1024/SymbolAniMediatorHooks1024";
import { MultiAniController } from "../../MyUtils/AnimationSystemV3/Components/MultiAniController";
import { Call_Function_Type } from "../../CrossSys1024/CrossSystem1024/DefinitionFunctionType";
import { SymbolOpacityEffect } from "./SymbolOpacity/SymbolOpacityEffect";
import { FindComponent } from "../../MyUtils/FindComponent";
import { IStateCondition } from "../../DefinitionGameData1024/GameConfigInstance1024";
import { WayAniCtrl } from "../WayAni/WayAniCtrl";
import { JpShowCtrl1024 } from "../JpShowController/JpShowCtrl1024";
import { WinScoreCtrlCore } from "../WinScoreAniCtrl/WinScoreCtrlCore";
import { GameEventType1024 } from "../../DefinitionGameData1024/GameEventTypeDef1024";
import { FG_MultipleCount_Display } from "../UI/FG/FG_MultipleCount_Display";
import { FG_TimesCount_Display } from "../UI/FG/FG_TimesCount_Display";
import { TransFGCloud } from "../TransFGCloud/TransFGCloud";

export interface IGroupAniData {
    odd: number,//--那一線的賠率
    winWays: number,//--該輪中線way數量
}

const enum STAGE_ID {
    SYMBOL_SHOW_CONTAINER = 'symbolShowContainer',
    AWARD_BOX_SHOW_CONTAINER = 'awardShowContainer',//--連線的外框
    MONK_FX_SHOW_CONTAINER = 'monkFxShowContainer',//--唐三藏特效容器
    SP4_ANI_SHOW_CONTAINER = 'spin4ShowContainer'//--spin4特效容器
}


const enum DEFAULT_GROUP {
    AWARD = 99,//--連線框
    WILD = 98,//--wild
    SCATTER = 97,//--scatter
    MONK = 96,//--唐三藏
    SPIN4 = 95//--spin4
}
const enum PREFAB_ID {
    AWARD_BOX = 'AwardBox',
    SP4_ANI = 'icon_12_inGame'
}
const { ccclass, property } = _decorator;

@ccclass('ShowAniProcessController1024')
export class ShowAniProcessController1024 extends BasicShowAniProcess<IMatchInfoForRound, WinScoreData, IPlayAniData> implements IFunctionOwnerAgent, ISyncDataAgent, IPropertyTransferAgent, IGameMode {

    @property({ type: ShakeCamera, visible: true, displayName: 'ShakeCamera', tooltip: "震動攝影機" })
    private _shakeCameraEffect: ShakeCamera = null;

    @property({ type: WinScoreCtrlCore, visible: true, displayName: "WinScore", tooltip: "得分動畫控制器" })
    private _winScore: WinScoreCtrlCore = null;

    @property({ type: FG_MultipleCount_Display, visible: true, displayName: "FG_MultipleCount_Display", tooltip: "免費遊戲倍數顯示控制器" })
    private _fgMultipleCount: FG_MultipleCount_Display = null;

    @property({ type: WayAniCtrl, visible: true, displayName: "WayAniCtrl", tooltip: "Way動畫控制器" })
    private _wayAniCtrl: WayAniCtrl = null;

    @property({ type: TransFGCloud, visible: true, displayName: 'TransFGCloud', tooltip: "FG轉場畫控制器" })
    private _transFGCloud: TransFGCloud = null;

    @property({ type: FG_TimesCount_Display, visible: true, displayName: "FG_TimesCount_Display", tooltip: "免費遊戲次數顯示控制器" })
    private _fgTimesCount: FG_TimesCount_Display = null;

    @property({ type: JpShowCtrl1024, visible: true, displayName: "JpShowCtrl1024", tooltip: "大獎控制器" })
    private _jpShowCtrl: JpShowCtrl1024 = null;

    //--查找使用的ownerID
    public readonly ownerId: number = SymbolOwnerAgentID.ShowAniController;
    /**
     * DI進來的動畫服務facade
     * @param _crossSystemSymbolAniService IDirtyCrossSysServiceFacade
     */
    private _crossSystemSymbolAniService: ICrossSystemSymbolAniService<IReelInfo, Node, string> = null;
    private _aryIGameMode: IGameMode[] = [];

    private _currentRoundOdds: number = 0;//--目前這一局的總賠率(累加用)

    private _monkFxCtrl: MonkFxCtrl = null;
    private _transAniWinBox: Map<number, number>;//-換算變形ANI用的
    //--清除的時候要清掉
    private _mapWinScoreGroupData: Map<string, { IAniData: IPlayAniData, group: number[] }> = new Map();
    private _mapGroupAniData: Map<number, IGroupAniData> = new Map();
    //--buildAnimation
    private _symbolAniDecorate: SymbolAniMediatorHooks1024;
    private _prefabKey = new Map<number, string>([
        [0, 'icon_00_inGame'],
        [1, 'icon_01_inGame'],
        [2, 'icon_02_inGame'],
        [3, 'icon_03_inGame'],
        [4, 'icon_04_inGame'],
        [5, 'icon_05_inGame'],
        [6, 'icon_06_inGame'],
        [7, 'icon_07_inGame'],
        [8, 'icon_08_inGame'],
        [9, 'icon_09_inGame'],
        [10, 'icon_10_inGame'],
        [11, 'icon_11_inGame'],
        [12, 'icon_12_inGame']
    ]);

    private _addingTaskPromise: Promise<void> | null = null;
    private _gameStateCondition: IStateCondition = null; // 判斷當前與下一把的狀態關係
    private _currentGameState: GameState = GameState.NULL;

    set gameStateCondition(value: IStateCondition) {
        this._gameStateCondition = value;
    }

    public register(): void {
        //--<寫入遊戲步驟延遲時間列表(單位-秒)>--
        this._winScore.register();
        this._jpShowCtrl.register();
    }

    public override init(): void {
        super.init();
        //--變形長度換算
        this._transAniWinBox = new Map<number, number>([
            [7, 1],
            [6, 2],
            [5, 3],
            [4, 4],
            [3, 5],
            [2, 6],
        ]);

        this._monkFxCtrl = new MonkFxCtrl(this._aniNodeStageContainerMap[STAGE_ID.MONK_FX_SHOW_CONTAINER]);
        this._symbolAniDecorate = new SymbolAniMediatorHooks1024();

    }

    public registerService(value: ICrossSystemSymbolAniService<IReelInfo, Node, string>): void {

        this._crossSystemSymbolAniService = value;
        this._crossSystemSymbolAniService.registerYourself(this);
        this._aryIGameMode.push(this._wayAniCtrl);
        this._aryIGameMode.push(this._winScore);
        NotifyCation.getInstance().on(NotifySubject.GAME_ANI_PROCESS_SUBJECT, GameEventType1024.FG_SHOW_MULTIPLIER_EVENT, this.onShowFGMultiplier, this);
    }

    //===================interface<IGameMode>===================
    public changeGameState(value: GameState): void {
        // 實作遊戲狀態變更邏輯
        this._currentGameState = value;
        for (const gameMode of this._aryIGameMode) {
            gameMode.changeGameState(value);
        }
    }

    //====================abstract methods=======================

    //--要資料全部重置(call server)
    public resetAllData(): void {
        this._currentRoundOdds = 0;
        this.resetRoundData();
        this.resetWayAni();
    }

    //--這個太特殊了---
    public resetWayAni(): void {
        this._wayAniCtrl.resetWayAni();//--這個是整局結束才要清除
    }

    /**
    * 取得總得分，預設從 winScoreData 解析(這一round的這一把)
    * @param winScoreData 
    * @returns 
    */
    protected getTotalScore(winScoreData: WinScoreData): number {
        return (winScoreData.totalOdd * winScoreData.betValue).fixed();
    }

    protected getMultiplier(winScoreData: WinScoreData): number {
        return winScoreData.multiplier;
    }

    /**
    * 因為企劃要求在底下顯示得分的欄位是要在round當中累加的
    * @returns 
    */
    protected calculateCurrentRoundOdds(winScoreData?: WinScoreData): number {

        this._currentRoundOdds += winScoreData?.totalOdd ?? 0;
        const wd = {
            baseOdds: winScoreData?.baseOdds,
            totalOdd: this._currentRoundOdds,
            betValue: winScoreData?.betValue,
            multiplier: winScoreData?.multiplier
        };
        const returnScore = this.getTotalScore(wd);
        return returnScore;
    }


    //====================abstract methods=======================
    //==========================<跨系統指令接口>interface IFunctionOwnerAgent===========================

    public crossProcess(processType: FunctionType): void {

    }
    // 接手後要做的事
    public crossMultiProcess(processType: FunctionType[]): void {

    }
    public crossReturnData(processType: FunctionType): any {

    }
    public crossMultiReturnData(processType: FunctionType[]): any {

    }

    //==========================<快速資料同步接口>interface ISyncDataAgent===================================

    public getAcquiredData(info: ISyncDatatype): ISyncDatatype | null {
        //----抽取座標後直接轉移資料--這樣太慢了


        return null;
    }

    public getAcquiredMultiData(infos: ISyncDatatype[]): ISyncDatatype[] | null {
        //----抽取座標後直接轉移資料

        return null;
    }

    public onDataReceived(info: ISyncDatatype): void {
        //----抽取座標後直接轉移資料
        return;
    }

    public onDataMultiReceived(infos: ISyncDatatype[]): void {
        //----抽取座標後直接轉移資料
        console.log();
        /*
        //--速度太慢了..棄用
        switch (infos[0].backProcessType) {
            case SyncBackProcessType1024.CREATOR_WIN_SYMBOL:
                this.addSymbolAndAwardBox(infos);
                break;

            case SyncBackProcessType1024.CREATOR_MONK_EFFECT:
                this.createMonkFx(infos);
                break;
        }*/
    }

    //==========================<快速轉移屬性接口>interface IPropertyTransferAgent===================================
    public applyProperties<T = any>(obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T>): void {

    }

    public applyMultiProperties<T = any>(applications: Array<{ obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T> }>): void {

        if (applications.length === 0) return;

        // 透過 backProcessType 分流
        const backProcessType = applications[0].transferData?.backProcessType;

        // 組裝成 ISyncDatatype 格式
        const syncDataList: ISyncDatatype[] = [];

        for (const app of applications) {
            const syncData: ISyncDatatype = {
                info: app.transferData.info,
                type: SyncDataType1024.SYNC_DATA_WORLD_POS,
                backProcessType: app.transferData.backProcessType,
                ownerId: this.ownerId,
                payload: app.transferData.payload, // 直接使用已組裝好的 payload
                others: app.transferData.args?.[0] || {}
            };

            syncDataList.push(syncData);
        }


        switch (backProcessType) {
            case SyncBackProcessType1024.CREATOR_WIN_SYMBOL:
                this.addSymbolAndAwardBox(syncDataList);
                break;

            case SyncBackProcessType1024.CREATOR_MONK_EFFECT:
                this.createMonkFx(syncDataList);
                break;

            case SyncBackProcessType1024.CREATOR_SPIN4_EFFECT:
                this.addSpin4FXAni(syncDataList);
                break;

            default:
                console.warn(`[ShowAniProcessController1024] 未處理的 backProcessType: ${backProcessType}`);
                break;
        }
    }


    //=====================================<清除流程>=================================================

    /**
     * server資料回來後新一局開始start spin時可以呼叫
     * (這邊可以開始做不同的狀態判斷)
     * step1: 清除所有正在播放的動畫
     * step2: 清除輪播資料
     * step3: cancelAllDelays?.();--取消所有延遲
     * step4: 清理safeResolve
     * step5: 依照條件選擇特殊清除(現在在特殊模式下)或是一般清除
    */

    /**step.1 子類實作：停止分數/框線等（原本的 _winScore.stopWinScoreAni + 其他） */
    protected stopAndPauseWinAni(): void {

        this._winScore.stopToDefault();//--停止秀線...
        this._winScore.cleanPreviousAni();
    }

    /**step.2子類決定如何處理清除輪播資料 */
    public stopMultipleSequence(): void {
        //this._mapGroupAniData.clear();
    }

    /**step.5-1 子類決定這回合是否需要「特殊清理」（例：Wild 正在工作） */
    /**
     * TIPS:
     * 1.RS模式當中isLock的wild會被釘死在場上,所以不需要交還slotMachine(doSpecialCleanupForNewStart)
     * 2.RS模式結束後isLock的wild需要交還slotMachine(doRegularCleanupForNewStart)
     * 
     * @returns 
     */
    protected isSpecialCleanupNeededForNewStart(): boolean {

        return false;
        /*
        if (!this._gameStateCondition) {
            return false;//--交還釘死的wild
        } else if (this._gameStateCondition.isDifferentStateNext) {
            if (this._gameStateCondition.nextRoundState === GameState.NORMAL ||
                this._gameStateCondition.nextRoundState === GameState.FREE_GAME ||
                this._gameStateCondition.nextRoundState === null//--server資料還沒回來(全新局)
            ) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }*/

    }
    /**step.5-2 子類實作：特殊清理（例：可移除/關 Wild → 全清 + resetWild） */
    protected async doSpecialCleanupForNewStart(): Promise<void> {
        //--wild為1*4的狀態就會被釘在場上,所以不需要交回slotMachine<排除1*4的wild>

    }


    /**step.5-3 子類實作：一般清理（例：全部清除） */
    protected async doRegularCleanupForNewStart(): Promise<void> {

        for (let i: number = this._aryRunningNode.length - 1; i >= 0; i--) {
            const aniNode = this._aryRunningNode[i];
            const prefabId = aniNode[DYN_NODE_PROPERTIES.PREFAB_ID];
            aniNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL].goBackToDefault();
            this.removeSingleNodeData(aniNode);
            aniNode.removeFromParent();
            AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, aniNode);
            this._aryRunningNode.splice(i, 1);

        }
    }


    /**
     * TIPS:
     * 1.在新一局開始前，清除所有正在播放的動畫(尚未交還動畫,只有停止播放)
     * 2.不會執行任何交還map的動作
     * 3.不呼叫會持續輪播最後一把的中線輪播(如果有的話)
     */
    public async cleanAllPlayingBeforeNewStart(): Promise<void> {

        this._abortPlaySequence = true;
        this.stopMultipleSequence();
        this.stopAndPauseWinAni();
        this.cancelAllDelays?.();
        this.safeResolve?.();
        this.processResetAni();
    }

    //--強制移除所有動畫(這邊是直接移除,不交還slotMachine,直接進pool)
    public stopAndRemoveAllAnis(): void {
        //--先放空好了,目前沒用到
    }


    //--停止垂直動畫(特殊角色需求)
    public stopShowVerticalAni(): void {
        return;
    }
    //--停止標準表演動畫(特殊角色需求)
    public stopShowAnimation(): void {
        return;
    }

    //--強制中斷連線中動畫(單純的指線/框的動畫)
    public stopAndHideConnectBoxAni(): void {

        /*
        for (const group of this._aryRunningNode) {
            if (group[DYN_NODE_PROPERTIES.GROUP_ID].includes(DEFAULT_GROUP_AWARD)) {
                const aniInterfaceComponent = AniSysTools.findAndGetIAniComponent(group) as IAnimationControl;
                aniInterfaceComponent.goBackToDefault();//--直接回到預設狀態
                group.active = false;
            }
        }*/
    }
    //--20260102:強制停止/重置其他動畫
    public stopAndResetOtherAni(): void {
        //this._wayAniCtrl.resetWayAni();//--這個是整局結束才要清除
    }

    //=====================================<清除流程>=================================================

    //=====================================遊戲獨有方法===============================================
    public showWayNum(value: number): void {
        this._wayAniCtrl.showWayNum(value);
    }

    public setWayLabel(value: number): void {
        this._wayAniCtrl.setScoreLabel(value);
    }

    public showWaysAni(wayNum: number): void {
        this._wayAniCtrl.playWayAni(wayNum);
    }

    public setTotalFGCount(value: number): void {
        this._fgTimesCount.setTotalFGCount(value);
    }

    public setFGCount(value: number): void {
        this._fgTimesCount.setFGCount(value);
    }

    public resetFGCount(): void {
        this._fgTimesCount.reset();
    }

    public async openCloudGoFG(): Promise<void> {
        await this._transFGCloud.openCloudGoFG();
    }

    public async openCloudOutFG(): Promise<void> {
        await this._transFGCloud.openCloudOutFG();
    }

    public async closeCloud(): Promise<void> {
        await this._transFGCloud.closeCloud();
    }

    private createMonkFx(infos: ISyncDatatype[]): void {

        this.addMonkAni(infos);
        this._monkFxCtrl.creatorMonkFxNode(infos);
    }

    public async playMonkFx(monkReelList: number[]): Promise<void> {

        if (this._addingTaskPromise) {
            await this._addingTaskPromise;
        }
        await this.playMonkAni();
        await this._monkFxCtrl.playMonkFx(monkReelList, { firstTrigger: 70, secondTrigger: 90 });
        this._monkFxCtrl.removeAllMonkFxNode();
    }

    public async playSpin4FX(spin4IconList: number[]): Promise<void> {

        this.processSpin4FXData(spin4IconList);//--轉移屬性資料
        if (this._addingTaskPromise) {
            await this._addingTaskPromise;
        }

        const spin4Ani = this.getAniNodeListByGroups([DEFAULT_GROUP.SPIN4]);
        const p: Promise<void>[] = [];
        const aniState = { aniState: AnimationStateType.Win };
        for (let i: number = 0; i < spin4Ani.length; i++) {
            const comp = spin4Ani[i][DYN_NODE_PROPERTIES.ANIMATION_CTRL] as AnimationController;
            if (comp) {
                p.push(comp.playAniInPromise(aniState));
            }
        }
        await Promise.allSettled(p);
        this.stopAndRemoveAnisByGroup(DEFAULT_GROUP.SPIN4);

    }


    public shakeCamera(): void {
        if (this._shakeCameraEffect) {
            this._shakeCameraEffect.shakeWithFrequency();
        }
    }
    //--fg顯示倍數事件(搖攝影機)--
    private onShowFGMultiplier = (eventData: any): void => {
        this.shakeCamera();
    }

    private async playMonkAni(): Promise<void> {

        const aniGroups = this.getAniNodeListByGroups([DEFAULT_GROUP.MONK]);
        const totalPlayTime = 1;
        const targetPercentage = 70;
        const Promises: Promise<any>[] = [];
        let completedCount = aniGroups.length;

        for (const group of aniGroups) {
            group.active = true;
            const aniInterfaceComponent = group[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as AnimationController;
            aniInterfaceComponent.playAni(AnimationStateType.Win);

            const aniPromise = aniInterfaceComponent.waitUntilPercentage(
                targetPercentage,
                AnimationStateType.Win,
                () => {
                    completedCount--;
                    if (completedCount === 0) {
                        this.removeAllMonkAni();
                    }
                }
            );

            const p = GameUtilsTools.withTimeout(
                aniPromise,
                //0.2,
                totalPlayTime,//--防死亡timeout(也是這輪能用的總時間)
                //1.1,
                { node: group.name, playKey: AnimationStateType.Win },
                'playAniGroup',
                true //--超時也resolve---這邊要想一下,NG/FG的差異
            )

            Promises.push(
                p.promise
            );

        }
        await Promise.all(Promises);

    }

    private removeAllMonkAni(): void {

        for (let i: number = this._aryRunningNode.length - 1; i >= 0; i--) {

            if (this._aryRunningNode[i][DYN_NODE_PROPERTIES.GROUP_ID].includes(DEFAULT_GROUP.MONK)) {
                const aniNode = this._aryRunningNode[i];
                const prefabId = aniNode[DYN_NODE_PROPERTIES.PREFAB_ID];
                aniNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL].goBackToDefault();
                this.removeSingleNodeData(aniNode);
                aniNode.removeFromParent();
                AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, aniNode);
                this._aryRunningNode.splice(i, 1);
            }
        }

    }

    private async addSpin4FXAni(infos: ISyncDatatype[]): Promise<void> {

        let resolveTask: Function;
        this._addingTaskPromise = new Promise(res => resolveTask = res);
        const debugInfo = infos;
        const containerId: string = STAGE_ID.SP4_ANI_SHOW_CONTAINER;
        console.log();
        try {

            const currentTasks: Promise<any>[] = [];
            for (let i = 0; i < infos.length; i++) {

                const infoTarget = infos[i];
                const IAniData: IPlayAniData = {
                    tokenId: `${Date.now().toString(36)}_${i}`,
                    aniId: '',
                    reelIndex: infoTarget.payload.reelIndex,
                    iconIndex: infoTarget.payload.iconIndex,
                    symbolId: infoTarget.payload.symbolId,
                    containerNodeId: containerId,
                    prefabKey: PREFAB_ID.SP4_ANI,
                    groupId: DEFAULT_GROUP.SPIN4,
                    wPos: infoTarget.payload.worldPosition,
                    otherData: {}
                }

                const targetAni = AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(PREFAB_ID.SP4_ANI);
                this._symbolAniDecorate.decorate(targetAni, IAniData);
                const aniPromise = this.addAnimationData(targetAni, IAniData, []);
                currentTasks.push(aniPromise);
                if (currentTasks.length > 0) {
                    await Promise.allSettled(currentTasks);
                    console.log();
                }
            }

        } finally {
            if (resolveTask) resolveTask();
            this._addingTaskPromise = null;
        }



    }

    private async addMonkAni(infos: ISyncDatatype[]): Promise<void> {

        let resolveTask: Function;
        this._addingTaskPromise = new Promise(res => resolveTask = res);
        try {
            let containerId: string = STAGE_ID.MONK_FX_SHOW_CONTAINER;
            let container: Node;
            const debugInfo = infos;
            const currentTasks: Promise<any>[] = [];

            for (let i = 0; i < infos.length; i++) {
                //let targetGroupData: { IAniData: IPlayAniData, group: number[] };
                const infoTarget = infos[i];
                const identify = {
                    //key: key,
                    maxLens: 4//-要取出的長度大小
                };
                const prefabKey = this._prefabKey.get(infoTarget.payload.symbolId);

                const IAniData: IPlayAniData = {
                    tokenId: `${Date.now().toString(36)}_${i}`,
                    aniId: '',
                    reelIndex: infoTarget.payload.reelIndex,
                    iconIndex: infoTarget.payload.iconIndex,
                    symbolId: infoTarget.payload.symbolId,
                    containerNodeId: containerId,
                    prefabKey: prefabKey,
                    groupId: DEFAULT_GROUP.MONK,
                    wPos: infoTarget.payload.worldPosition,
                    otherData: identify
                }

                const targetAni = AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(prefabKey);

                let aniTransSizeId = '4';
                this._symbolAniDecorate.decorate(targetAni, IAniData);
                targetAni[DYN_NODE_PROPERTIES.OTHER] = aniTransSizeId;
                const aniPromise = this.addAnimationData(targetAni, IAniData, []);
                currentTasks.push(aniPromise);
            }

            if (currentTasks.length > 0) {
                await Promise.allSettled(currentTasks);
                console.log();
            }
        } finally {
            if (resolveTask) resolveTask();
            this._addingTaskPromise = null;
        }
    }

    private async addSymbolAndAwardBox(infos: ISyncDatatype[]): Promise<void> {

        let resolveTask: Function;
        this._addingTaskPromise = new Promise(res => resolveTask = res);

        try {
            let containerId: string = '';
            let container: Node;
            const debugInfo = infos;
            const currentTasks: Promise<any>[] = []; // 本次執行的任務暫存
            for (let i = 0; i < infos.length; i++) {
                const infoPayLoad = infos[i];
                //const symbolInfo=this.getSymbolInfoData(infoPayLoad);
                let symbolInfo;
                let targetGroupData: { IAniData: IPlayAniData, group: number[] };
                if (this._mapWinScoreGroupData.has(infoPayLoad.others.key)) {
                    targetGroupData = this._mapWinScoreGroupData.get(infoPayLoad.others.key);
                    symbolInfo = targetGroupData.IAniData;
                    //symbolInfo.groupId=-1;
                    symbolInfo.wPos = null;

                }
                if (symbolInfo) {

                    if (containerId != symbolInfo.containerNodeId) {
                        containerId = symbolInfo.containerNodeId;
                        container = this._aniNodeStageContainerMap[containerId];
                    }
                    //--取得要變形的大小(symbol使用)
                    //let aniTransSizeId=this._transAniWinBox.get(symbolInfo.otherData.maxLens)+'';
                    let aniTransSizeId = symbolInfo.otherData.maxLens + '';
                    const targetGroupId = targetGroupData.group;
                    symbolInfo.wPos = infoPayLoad.payload.worldPosition;
                    const prefabKey = this._prefabKey.get(symbolInfo.symbolId);
                    //symbolInfo.tokenId=Date.now().toString(36);--雷-速度太快會取出同樣的時間
                    symbolInfo.tokenId = `${Date.now().toString(36)}_${i}`;
                    symbolInfo.prefabKey = prefabKey;

                    const targetAni = AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(prefabKey);
                    this._symbolAniDecorate.decorate(targetAni, symbolInfo);
                    targetAni[DYN_NODE_PROPERTIES.OTHER] = aniTransSizeId;
                    const aniPromise = this.addAnimationData(targetAni, symbolInfo, targetGroupId);
                    currentTasks.push(aniPromise);

                }
            }

            if (currentTasks.length > 0) {
                await Promise.allSettled(currentTasks);
                console.log();
            }

        } finally {
            if (resolveTask) resolveTask();
            this._addingTaskPromise = null;
        }

    }




    /**
     * 透過同步資料取得符號資訊
     * @param info 
     */

    private getSymbolInfoData(info: ISyncDatatype): IPlayAniData | null {

        if (this._mapWinScoreGroupData.has(info.others.key)) {
            const target = this._mapWinScoreGroupData.get(info.others.key)
            let aniData = target.IAniData;
            aniData.groupId = -1;
            aniData.wPos = null;
            return aniData;
        }
        return null;
    }


    //=====================================<標準表演流程>=================================================
    /**
     * 分數結算統一入口<runShowProcess>
     * step1: 沒有得分直接走playNoWinInThisRound流程
     * step2: 有得分走playWinInThisRound流程<播放全部>
     * step3: 檢查大獎條件checkBigWinCondition
     * step4: 播放得分動畫showWinScoreAni|播放大獎動畫showBigWinAni
     * step5: GUI下方顯示得分showScoreForBottomText(第一階段秀全部完成)
     * step5-2 checkGoThroughCondition是否跳過輪播
     * step6: 輪播檢查(開鎖)processBeforePlaySequence
     * step7: 播放輪播動畫playMultipleSequence
     */


    /**step1. 沒有得分直接走playNoWinInThisRound流程*/
    public async playNoWinInThisRound(lines?: IMatchInfoForRound[]): Promise<void> {

        //const delayTime = this._gameStepDelayTimeList.get(cfg => cfg.result?.noWinWait);
        const delayTime = 0.2;//-暫時先這樣20260107
        await this._async.waitSecondsRaw(delayTime);
    }

    /**step2. 有得分直接走全部播放流程*/
    //-winScoreData是這一局的全部,每一條線的在lines裡面
    public async playWinInThisRound(winScoreData: WinScoreData, lines?: IMatchInfoForRound[]): Promise<void> {

        if (this._addingTaskPromise) {
            await this._addingTaskPromise;
        }


        //--秀全部
        //GameUtilsTools.debugLog(DEBUG_TITLE, 'playWinInThisRound', { winScoreData, lines, mapWinScoreGroupData: this._mapWinScoreGroupData, mapGroupAniData: this._mapGroupAniData });
        //-關閉全部的亮度
        //-關閉全部的亮度
        this._crossSystemSymbolAniService.processOwnerFunction({
            ownerId: SymbolOwnerAgentID.SlotMachine,
            name: Call_Function_Type.SET_ALL_REEL_BRIGHTNESS,
            args: [true]
        });

        //return;
        let showAllGroups = this.getAllGroups();
        const aniGroups = this.getAniNodeListByGroups(showAllGroups);
        let aryProcess: { promise: Promise<void>, ani: IAnimationControl, target: Node }[] = [];
        //const totalPlayTime = this._gameStepDelayTimeList.get(cfg => cfg.result?.totalShowWin);
        const totalPlayTime = 1;
        const Promises: Promise<any>[] = [];
        const aniTargetId = 'Root_AniSymbol';

        for (const group of aniGroups) {
            group.active = true;
            const aniInterfaceComponent = group[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as MultiAniController;
            aniInterfaceComponent.getAniCtrlById(aniTargetId).node.active = true;//--燃燒退場會關閉active
            const aniState = { aniState: group[DYN_NODE_PROPERTIES.OTHER] + '' }
            //aniInterfaceComponent.playAniById(aniTargetId,{value:aniState}); 
            const aniPromise = aniInterfaceComponent.playAniInPromiseById(aniTargetId, aniState);

            const p = GameUtilsTools.withTimeout(
                aniPromise,
                //0.2,
                totalPlayTime,//--防死亡timeout(也是這輪能用的總時間)
                //1.1,
                { node: group.name, playKey: aniState },
                'playAniGroup',
                true //--超時也resolve---這邊要想一下,NG/FG的差異
            )

            Promises.push(
                p.promise
            );

        }
        const results = await Promise.all(Promises);
        //this.doRefillAniBeforeSlotMachineReFill();
    }

    //--一邊消除一邊做補牌動畫的處理
    public async doRefillAniBeforeSlotMachineReFill(): Promise<void> {

        this._crossSystemSymbolAniService.processOwnerFunction({
            ownerId: SymbolOwnerAgentID.SlotMachine,
            name: Call_Function_Type.SET_ALL_REEL_BRIGHTNESS,
            args: [false]
        });

        let showAllGroups = this.getAllGroups();
        const aniGroups = this.getAniNodeListByGroups(showAllGroups);
        const aniTargetId = 'Root_SpAward';
        const symbolTargetTd = 'Root_AniSymbol';
        //const promises: Promise<any>[] = [];
        for (const group of aniGroups) {
            const aniInterfaceComponent = group[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as MultiAniController;
            const aniState = { aniState: group[DYN_NODE_PROPERTIES.OTHER] + '' }
            aniInterfaceComponent.playAniById(aniTargetId, { value: aniState });
            //const p = aniInterfaceComponent.playAniInPromiseById(aniTargetId, aniState);
            //promises.push(p);
            const symbolTarget = aniInterfaceComponent.getAniCtrlById(symbolTargetTd);
            if (symbolTarget) {
                const compOpacity = FindComponent.findComponentInChildren<SymbolOpacityEffect>(symbolTarget.node, SymbolOpacityEffect);
                if (compOpacity) {
                    compOpacity.closeContainerTween(0.05);
                }
            }
        }

        const waitTargets = aniGroups.map(group => ({
            controller: group[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as MultiAniController,
            aniCtrlId: aniTargetId,
            spineIndex: 0,      // 第一个 Spine
            percentage: 70,    // 等待播放完成70%
            trackIndex: 0
        }));

        await MultiAniController.waitUntilMultiSpinePercentage(waitTargets);
    }

    /**
     * 處理要中斷的相關初始
     */
    private doWinInThisRoundAsyncProcess(): void {
        //const flowKey = BasicShowResultProcessKey.RunShowProcess;
        //const signal = this._async.createAbortScope(flowKey);
    }

    /**step3. 檢查大獎條件*/
    protected checkBigWinCondition(winScoreData: WinScoreData): boolean {
        //return winScoreData.totalOdd >= SPECIAL_WIN_THRESHOLD;
        return false;
    };

    /**step4-1. 播放得分動畫(數字)*/
    public override async showWinScoreAni(score: number, multiplier: number, showBottomText: boolean = false): Promise<void> {
        //--顯示得分動畫
        this._winScore.register();
        super.showWinScoreAni(score, multiplier, showBottomText);
        if (this._currentGameState === GameState.FREE_GAME) {
            await this._winScore.showFGWinScoreIn(score, multiplier);
            this._fgMultipleCount.addFGMultipleCount(multiplier);
        } else {
            await this._winScore.showFinalScoreIn(score, multiplier);
        }
    }
    //--重置得分動畫
    public resetWinSore(): void {
        this._winScore.reset();
    }

    private async showWinScoreIn(score: number): Promise<void> {

        //await this._winScore.showFinalScoreIn(score);
    }

    private async showWinScoreOut(): Promise<void> {
        //await this._winScore.showFinalScoreOut();
    }

    //**step4-2. 播放大獎動畫*/
    public async showBigWinAni(winScoreData: WinScoreData, lines?: IMatchInfoForRound[]): Promise<void> {

        /*
        const gameState = GlobalAccessReader.getGlobalData(GameGlobalKeys.GameState);
        if (gameState != GameState.FREE_GAME) {
            this.resetAniDuringWin();
            const odds = winScoreData.totalOdd;
            const betValue = winScoreData.betValue;
            await this._jpShowCtrl.showJPWin(odds, betValue);
        }*/
    }

    //--處理大贏動畫的流程
    protected override async processBigWin(): Promise<void> {

    }

    //**step4-3. 是否直接跳過輪播*/
    protected checkGoThroughCondition(): boolean {

        return false;
    };


    //**step5. 輪播前的準備工作(不輪播就直接resolve開鎖)*/
    /**
     * 1.this._mapGroupAniData(這個只有group/odd/lineType的資料描述) 
     * 2.this._mapWinScoreGroupData(這個有key(在盤面位置)跟groupId的對應/IAniData的資料描述)
     */

    public async processBeforePlaySequence(): Promise<void> {
        //---要處理FG的狀態下,就不進行輪播了,直接資料全部交還slotMachine

        //GameUtilsTools.debugLog(DEBUG_TITLE, 'processBeforePlaySequence', { resetNode, mapGroupAniData: this._mapGroupAniData, mapWinScoreGroupData: this._mapWinScoreGroupData });
        //--轉移控制權(多個物件)--改成直接reset狀態,控制權轉移在new round才會發生

    }

    //**step5-1. 還原動畫控制器狀態(不交還slotMachine)*/
    public async processResetAni(): Promise<void> {


    }


    //**step6. 播放輪播動畫*/
    public override async playMultipleSequence(): Promise<void> {

        await super.playMultipleSequence();
        //============開始執行輪播=================================================

    }

    //--在全秀之後要走的分支
    public playOtherWinShowAni(): void {

    }
    //--播放wild動畫
    public playWildAni(): void {

    }
    //--播放bonus動畫
    public playBonusAni(): void {

    }

    //--播放垂直的動畫
    public showAndWaitForVerticalAni(totalScore: number): Promise<void> {
        return Promise.resolve();
    }

    public playShowAnimation(): void {
        return;
    }


    //=====================================<標準表演流程>=================================================


    //==================解析winScoreData===========
    /**
     * <<<TODO--LOCK的資料每局要清掉group,再產生新的得分資料時,先檢查是否存在
     * 如果存在把group塞進去>>>
     * slotMachine裡面的gameIcon在上下各有一個的預備格,所以實際索引上要+1
     * 在這裡處理每一行的得分資料
     * PS-在鎖定的狀態下map裡面是不會有wild的資料, groupId要在這邊先塞起來!!!!!
     * reBuildIPlayDataFromKeyString--->這個可以把key塞回IPlayAniData
     * @param winLineData IMatchInfoForRound 中線資料
     * @param maxLens number 盤面每軸的最大長度(用來決定消除動畫的大小)
     * @returns 
     */

    protected async processWinScoreData(winLineData: IMatchInfoForRound[], otherInfo?: any): Promise<void> {

        this._mapWinScoreGroupData.clear();
        this._mapGroupAniData.clear();
        let maxLens: number[] = otherInfo as number[];

        const debugWinLineData = winLineData;
        const debugOtherInfo = otherInfo;
        const transferDataList: IPropertyTransferData<Node>[] = [];
        //const handOffObjs: ISyncDatatype[] = [];

        for (let i = 0; i < winLineData.length; i++) {

            const machPos: IMachPosInfo[] = winLineData[i].matchPos;
            this._mapGroupAniData.set(i, { odd: winLineData[i].odd, winWays: winLineData[i].winWays } as IGroupAniData);

            for (let j = 0; j < machPos.length; j++) {

                const symbolData = machPos[j];
                const key = `${symbolData.reelIndex}:${symbolData.iconIndex + 1}:${symbolData.realSymbolID}`;


                if (this._mapWinScoreGroupData.has(key)) {
                    this._mapWinScoreGroupData.get(key).group.push(i); // 如果已經處理過，則將當前的groupId加入到已存在的資料中
                    continue; // 已經處理過，跳過
                }

                //const playDataKey= `${machPos[j].reelIndex}:${machPos[j].iconIndex}`;
                //const playData=this.reBuildIPlayDataFromKeyString(playDataKey,true);
                const reelInfo = {
                    reelIndex: symbolData.reelIndex,
                    iconIndex: symbolData.iconIndex + 1,
                    symbolId: symbolData.realSymbolID
                }

                const identify = {
                    key: key,
                    maxLens: maxLens[machPos[j].reelIndex]//-要取出的長度大小
                };

                /*
                const sync = {
                    info: reelInfo,
                    type: SyncDataType1024.SYNC_DATA_WORLD_POS,
                    backProcessType: SyncBackProcessType1024.CREATOR_WIN_SYMBOL,
                    ownerId: this.ownerId,
                    others: {
                        key: key
                    }
                } as ISyncDatatype;
                */
                const transferData: IPropertyTransferData<Node> = {
                    info: reelInfo,
                    targetOwnerId: this.ownerId,
                    propertyKeys: ['worldPosition'], // 要提取的屬性
                    backProcessType: SyncBackProcessType1024.CREATOR_WIN_SYMBOL,
                    args: [{ key: key }] // 額外的識別資料
                };


                const IAniData: IPlayAniData = {
                    tokenId: '',
                    aniId: '',
                    reelIndex: symbolData.reelIndex,
                    iconIndex: symbolData.iconIndex,
                    symbolId: symbolData.realSymbolID,
                    containerNodeId: STAGE_ID.SYMBOL_SHOW_CONTAINER,
                    otherData: identify
                }

                //handOffObjs.push(sync);
                transferDataList.push(transferData);
                //--資料回來組裝用的(依靠key去找位置)
                this._mapWinScoreGroupData.set(key, { IAniData: IAniData, group: [i] });

            }

        }

        /*
        if (handOffObjs.length > 0) {
            this._crossSystemSymbolAniService.pushMultiDataToTarget(handOffObjs);
        }*/

        if (transferDataList.length > 0) {
            this._crossSystemSymbolAniService.transferMultiObjectProperties(transferDataList);
        }


    }

    private processSpin4FXData(spin4List: number[]): void {

        const transferDataList: IPropertyTransferData<Node>[] = [];
        for (let i = 0; i < spin4List.length; i++) {
            const reelInfo: IReelInfo = {
                reelIndex: 6,
                iconIndex: spin4List[i],
                symbolId: 12 //--spin4的symbolId固定12
            };

            const transferData: IPropertyTransferData<Node> = {
                info: reelInfo,
                targetOwnerId: this.ownerId,
                propertyKeys: ['worldPosition'], // 要提取的屬性
                backProcessType: SyncBackProcessType1024.CREATOR_SPIN4_EFFECT,
                args: [{}] // 可以根據需要添加額外識別資料
            };
            transferDataList.push(transferData);
        }

        if (transferDataList.length > 0) {
            this._crossSystemSymbolAniService.transferMultiObjectProperties(transferDataList);
        }
    }

    private getAllGroups(): number[] {

        const groups: number[] = [];
        this._mapGroupAniData.forEach((groupData, groupId) => {
            groups.push(groupId);
        });
        return groups;
    }


    //--根據key重建IPlayAniData
    /**
     * 
     * @param key 
     * @param iconIndexIsPlusOne 要不要-1(預設不要)
     * @returns 
     */
    private reBuildIPlayDataFromKeyString(key: string, iconIndexIsPlusOne: boolean = false): IReelInfo {

        const parts = key.trim().split(":");
        if (parts.length < 3) {
            throw new Error(`Invalid key format: "${key}"`);
        }

        const reelIndex = Number(parts[0]);
        let iconIndex = Number(parts[1]);

        if (![reelIndex, iconIndex].every(Number.isInteger)) {
            throw new Error(`Key must contain integers: "${key}"`);
        }

        if (iconIndexIsPlusOne) {
            iconIndex -= 1;
        }

        const registerData: IReelInfo = {
            reelIndex,
            iconIndex
        };

        return registerData;
    }





}