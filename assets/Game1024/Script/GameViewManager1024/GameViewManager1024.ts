import { _decorator, Component, Game, Node, Tween } from 'cc';
import {
    BasicProcessSlotData,
    BasicSlotGameViewManager,
    GameState,
    IProcessSlotData,
    IProcessInput,
    NewFlashModeEnum,
    IReelInfo,
    IBaseOwner,
    CrossSystemServiceFacade,
    IPlayAniData,
    ISymbolAniKey,
    SyncDataHandoffManager,
    SystemHandoffManager,
    AnimationControllersPoolManager,
    SpeedTimeMode,
    PrefabAdapter,
    SymbolRegistryCenter,
    SymbolDataCtrlManager,
    GameUtilsTools,
    WinScoreData,
    IMatchInfoForRound,
    ISyncDatatype,
    NotifyCation,
    NotifySubject,
    PropertyTransferManager,
    IPropertyTransferData,
    IBasicGameModeManager,
    ShowContainerWithResizeManager,
    GenericUIManager,
    BasicGameGlobalData

} from '../ReferencePath';
import { ProcessDataAfterServer1024 } from '../ProcessDataAfterServer1024/ProcessDataAfterServer1024';
//import { ProcessSlotSymbolAniData1024 } from '../CrossSys1024/AniMediator1024/ProcessSlotSymbolAniData1024';
import { SymbolAniMediatorHooks1024 } from '../CrossSys1024/AniMediator1024/SymbolAniMediatorHooks1024';
import { BasicGameModeManager } from '../MyUtils/BasicGameViewManager/BasicGameModeManager';
import { UniSlotMachine1024 } from '../Slot/UniSlotMachine1024';
import { ShowAniProcessController1024 } from '../GameDisplay1024/ShowAniProcessController/ShowAniProcessController1024';
import { BetRecordInfo, IInGameRoundRecord } from '../ServerBackSlotInfoData/DefType1024';
import { SyncBackProcessType1024, SyncDataType1024 } from '../CrossSys1024/SyncData1024/SyncDataDef1024';
import { GameGlobalData, GameGlobalKeys, SymbolOwnerAgentID } from '../DefinitionGameData1024/GameGlobalData1024';
import { ChallengeEventStatus, GameEventType1024, GO_FG_TransitionEventStatus, MonkFxEventType } from '../DefinitionGameData1024/GameEventTypeDef1024';
import { DefinitionGameConfigData, IStateCondition } from '../DefinitionGameData1024/GameConfigInstance1024';
import { SlotGUICtrl } from '../GameDisplay1024/UI/SlotGUICtrl';
import { FgBoardCtrl1024 } from '../GameDisplay1024/FgBoardCtrl/FgBoardCtrl1024';
import { GambleCtrl } from '../GameDisplay1024/GambleCtrl/GambleCtrl';
import { GLOBAL_DATA_WRITE_KEY } from '../MyUtils/BasicGlobalDataState/GlobalDataWriteKey';
import { GlobalAccessWriter } from '../DefinitionGameData1024/AccessDefs/GlobalAccessWriter';
import { ServerResType } from '../DefinitionGameData1024/OtherTypesDef';


//import { IBaseOwner } from '../MyUtils/HandoffManager/HandoffDef/IBaseOwnerDef';
//import { SymbolHandoffDataCenter } from '../MyUtils/HandoffManager/HandoffData/SymbolHandoffDataCenter';
//import { SymbolHandoffDataCenter } from '../MyUtils/HandoffManager/HandoffData/SymbolHandoffDataCenter';
//const NO_SPIN_ROUND = 'REFILL_ROUND';
const enum RESET_DATA_TYPE {
    NO_SPIN_SAME_ROUND,
    SPIN_SAME_ROUND,
    SPIN_NEW_ROUND,
}

const {
    MAXIMUM_FG_TIMES//22--最大挑戰次數
} = DefinitionGameConfigData

const { ccclass, property } = _decorator;

@ccclass('GameViewManager1024')
export class GameViewManager1024 extends BasicSlotGameViewManager<BasicProcessSlotData, IProcessSlotData, GameState, ProcessDataAfterServer1024> {

    @property({ type: PrefabAdapter, visible: true, displayName: 'PrefabAdapter', tooltip: '將要在objPool運作的prefab掛入' })
    private _prefabAdapter: PrefabAdapter = new PrefabAdapter();

    @property({ type: ShowAniProcessController1024, visible: true, displayName: 'ShowAniProcessController1024', tooltip: '秀動畫流程控制器' })
    private _basicShowAniProcess: ShowAniProcessController1024 = null;

    @property({ type: ShowContainerWithResizeManager, visible: true, displayName: 'ShowContainerWithResizeManager', tooltip: '管理面板顯示模式' })
    private _showContainerManager: ShowContainerWithResizeManager = null;

    @property({ type: SlotGUICtrl, visible: true, displayName: 'SlotGUICtrl', tooltip: 'SlotGUICtrl' })
    private _slotGUICtrl: SlotGUICtrl = null;

    @property({ type: FgBoardCtrl1024, visible: true, displayName: 'FgBoardCtrl1024', tooltip: 'FG結算/次數面板' })
    private _fgUIBoard: FgBoardCtrl1024 = null;

    @property({ type: GambleCtrl, visible: true, displayName: 'GambleCtrl', tooltip: '挑戰遊戲控制器' })
    private _gambleCtrl: GambleCtrl = null;

    private _crossSysFacade: CrossSystemServiceFacade<IReelInfo, any, string, IPlayAniData, ISymbolAniKey, IBaseOwner>;
    private _flashToSpeedMap: Record<NewFlashModeEnum, SpeedTimeMode>;
    private _isNewRound: boolean = false; //---每次都要重置這個,因為每次都會有新的round資料
    //private onReFillWildHandler:(eventData:any)=>void;
    private _waitTasks: Promise<void>[] = [];
    private _waitScAniTasks: Promise<void>[] = [];

    /**
     * 20260317-NEW:用來控制挑戰遊戲卡在beforeProcessFGRound中間的流程
     * 當server資料寫完後會觸發這個resolve讓流程繼續往下走
     * 1.checkNextRound
     * 2.beforeProcessFGRound
     * 3.等待這個resolve
     * 4.processRound
     */
    private _challengeFgResolve: (() => void) | null = null;

    //===============================初始化遊戲流程管理器====================================
    public override init(): void {

        super.init();

        this._flashToSpeedMap = {
            [NewFlashModeEnum.None]: SpeedTimeMode.NORMAL,
            [NewFlashModeEnum.NewFlash1]: SpeedTimeMode.Lv1,
            [NewFlashModeEnum.NewFlash2]: SpeedTimeMode.Lv2
        };

        const handoffDb = new SymbolRegistryCenter<IReelInfo, IBaseOwner>();
        /*
        const processor: ProcessSlotSymbolAniData1024 = new ProcessSlotSymbolAniData1024();
        const hooks: SymbolAniMediatorHooks1024 = new SymbolAniMediatorHooks1024();
        const aniBuilderMediator = new AniBuilderMediator<IReelInfo, any, string, IPlayAniData, ISymbolAniKey>(
            processor,
            AnimationControllersPoolManager.getInstance(),
            hooks
        );*/
        //--注入新版的跨系統服務
        this._crossSysFacade = new CrossSystemServiceFacade<IReelInfo, any, string, IPlayAniData, ISymbolAniKey, IBaseOwner>(handoffDb);
        //this._crossSysFacade.setHandoffManager(SymbolAniHandoffManager);//--owner轉移(這次不需要)
        this._crossSysFacade.setSymbolDataCtrlManager(SymbolDataCtrlManager);//--符號資料操作
        //this._crossSysFacade.setMediator(aniBuilderMediator);//--prefab產生器
        this._crossSysFacade.setSyncManager(SyncDataHandoffManager);//--純資料交換
        this._crossSysFacade.setSysCrossServiceManager(SystemHandoffManager);//--跨系統功能調用
        this._crossSysFacade.setPropertyTransferManager(PropertyTransferManager);//--物件屬性轉移管理器

        //--初始化slotMachine
        this._slotMachine.init();
        //--server資料查找庫
        this._processedServerData = new ProcessDataAfterServer1024();
        //--遊戲狀態管理
        this._gameModeManager = new BasicGameModeManager();
        //--動畫控制器管理
        this._basicShowAniProcess.init();
        //--面板顯示管理(做漸變反黑等效果)
        this._slotGUICtrl.init(this._showContainerManager);
        //--動畫物件池管理
        AnimationControllersPoolManager.getInstance().init();
        //--面板顯示管理(本次不需要tween漸變的轉場效果-PS:default是有的)
        this._showContainerManager.clearTweenStates();
    }

    //===============================註冊相關交互系統(要先完成初始化才開始注入)================
    public override registerSystem(): void {

        super.registerSystem();
        if (this._prefabAdapter) {
            AnimationControllersPoolManager.getInstance().setPrefabForPropertyList(this._prefabAdapter.prefabForPropertyList);
        }
        //--要在這邊注入mediator(因為slotMachine/_basicShowAniProcess是走property進來的,引擎自己幫我建構了)
        this._basicShowAniProcess.registerService(this._crossSysFacade);
        //--註冊slotMachine需要的
        (this._slotMachine as UniSlotMachine1024).registerService(this._crossSysFacade);
        (this._slotMachine as UniSlotMachine1024).oneReelRollEndCallBack = this._oneReelRollEndCallBackFromSlot;
        (this._slotMachine as UniSlotMachine1024).registerStartRollCallBack();

        this._basicShowAniProcess.register();
        //--註冊遊戲狀態流程管理
        this._gameModeManager.addGameMode(this._basicShowAniProcess);
        this._gameModeManager.addGameMode(this._showContainerManager);
        this._gameModeManager.addGameMode(this._slotGUICtrl);
        this._gameModeManager.addGameMode(this._fgUIBoard);

        NotifyCation.getInstance().on(NotifySubject.GAME_ANI_PROCESS_SUBJECT, GameEventType1024.REFILL_WILD_EVENT, this.onReFillWildHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_ANI_PROCESS_SUBJECT, GameEventType1024.FG_OUT_BACK_EVENT, this.onFGOutBackHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_ANI_PROCESS_SUBJECT, GameEventType1024.CHALLENGE_EVENT, this.onChallengeHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_ANI_PROCESS_SUBJECT, GameEventType1024.CLOUD_TRANSITION_EVENT, this.onCloudTransitionHandler, this);

        this._gameModeManager.changeAllGameState(GameState.NORMAL);
        this._showContainerManager.afterRegister();
        //this._gameModeManager.changeAllGameState(GameState.FREE_GAME);
        const globalDataStore = BasicGameGlobalData.getInstance<GameGlobalData>();
        globalDataStore.init({
            GameState: GameState.BEGIN//--遊戲狀態 
            /**
             * 如果要新增其他屬性直接寫在GameGlobalData1024.ts裡面
             * 
             *  */
        });
        const globalDataWriter = globalDataStore.createWriter(GLOBAL_DATA_WRITE_KEY);
        GlobalAccessWriter.register(globalDataStore, globalDataWriter);
    }

    //============================== serverData控制 =========================
    /**寫入新的一round資料 */
    /**
     * 這邊預設寫進serverProcessData裡面會全部更新roundIndex的資料
     * @param serverData 
     */

    public override setServerReceiveData(serverData: BasicProcessSlotData): void {
        super.setServerReceiveData(serverData);
        const state = this._processedServerData.getCurrentState();
        if (state === GameState.NORMAL) {
            this._isNewRound = true; //---每次都要重置這個,因為每次都會有新的round資料
        }

    }

    /**
     * 20260108 新增: 用來處理server回傳資料是增量式(分段)更新的情況
     * FG要跟NG分開取資料,所以新增這個方法-
     * 因為FG會在挑戰遊戲結束後才會獲取,所以會跟NG分開取
     * @param data 
     * @param state 
     * @param updateAll 資料全部刷新true/增量式更新false(就只更新新增的部分)
     */

    public override setServerReceiveDataIncremental(data: BasicProcessSlotData, state: GameState, updateAll: boolean = true): void {
        //--重置資料
        //--這邊直接塞gameState進去讓它知道是哪一種狀態的資料
        //const currentState = GlobalAccessWriter.getGlobalData(GameGlobalKeys.GameState);
        //--for test
        //this._processedServerData.setServerReceiveDataIncremental(data, GameState.FREE_GAME, updateAll);
        //this._processedServerData.setServerReceiveDataIncremental(data, state, updateAll);
        super.setServerReceiveDataIncremental(data, state, updateAll);
        if (state === GameState.NORMAL) {
            this._isNewRound = true; //---每次都要重置這個,因為每次都會有新的round資料
        }
    }

    //--serverBack double game的資料(挑戰遊戲會呼叫sendOtherAction來取得次數)    
    public override setOtherActionData(data: any): void {
        const value = data as BetRecordInfo;
        //const value = data as number;
        this._processedServerData.setDynamicProperty(ServerResType.DoubleGameData, value.doubleGameResultFgCount);
    }


    //===============================抽象類別必須實作的部分==================================
    /**在初始化之前執行的邏輯 */
    public beforeInit(): void {
        // Implement specific logic for GameViewManager1016
    }

    //--這邊單純通知就好了,因為GameTimeScale是靜態的直接取值即可
    public setGameTimeScale(): void {

    }

    public setTwoLevelTurboMode(turboMode: NewFlashModeEnum): void {

    }

    public setPlayerBetValue(betValue: number): void {

    }

    public setStartAutoSpinMode(isAuto: boolean): void {

    }


    /**
     * 清除相關資料<startSpin之前會call>
     * @param other 
     */
    protected async reSetDataForBeforeSpin(other?: any): Promise<void> {

        //--目前還沒掛上UI物件,所以先try catch避免報錯
        try {
            this._currentTurboSpeed = GenericUIManager.instance.isTurboOn;//--每次startSpin都要更新目前的加速狀態
        } catch (error) {
            console.log('uiObject not found or isTurboOn error:', error);
            this._currentTurboSpeed = false;
        }

        await this._basicShowAniProcess.cleanAllPlayingAniForNewStart();

        this._basicShowAniProcess.resetRoundData();

        if (other != RESET_DATA_TYPE.NO_SPIN_SAME_ROUND) {
            this._crossSysFacade.releaseAll(); //--清除盤面資料
            this._basicShowAniProcess.resetWayAni();
        }

        if (!this._isThisRound || other === RESET_DATA_TYPE.SPIN_SAME_ROUND) {
            this._basicShowAniProcess.stopAndRemoveAllAnis();
        }
    }



    protected changeInterruptingStatus(): void {

    }


    protected override doStartSpin(): void {
        super.doStartSpin();
        /*
        GlobalAccessWriter.setGlobalData(GameGlobalKeys.InterruptProcess, this._isInterrupting);
        //this._timeBaseTest = Date.now();
        //--關閉/開啟整個盤面亮度(true=變暗/false=正常)
        (<UniSlotMachine1016>this._slotMachine).setAllLight(false);
        //this._slotMachine.startRoll(turboSpeed, [0]);
        //console.log('====================doStartSpin================');
        AudioManager.instance.playSound(SoundList.Spin, SOUND_TYPE.ONE_SHOT, AudioSourceList.BtnAS);
     
        (<UniSlotMachine1016>this._slotMachine).resetReelViewData();//--為了做到RS第0軸聽牌效果,提前重置軸資料
     
        const currentState = GlobalAccessWriter.getGlobalData(GameGlobalKeys.GameState);
        if (currentState === GameState.RE_SPINE) {
            const readyHands = this._processedServerData.getReadyToHandForThisRound();
            if (readyHands.length > 0) {
                (<UniSlotMachine1016>this._slotMachine).multiSetReadyHand(readyHands);
            }
        }*/
        this._slotMachine.startRoll(this._currentTurboSpeed);
    }

    public async stopSpin(slotData: IProcessSlotData, other?: any): Promise<void> {

        if (other != undefined) {
            //--強制停止
            if (other == RESET_DATA_TYPE.NO_SPIN_SAME_ROUND) {
                this.beforeStopSpin();
                await this.beforeAllReelRollEnd();
            } else {
                return;
            }

        } else {

            if (this._isStop) return;
            if (!slotData) return; // slotData 為 null，直接退出（不會設 _isStop）
            this._isStop = true;
            this.beforeStopSpin();
            await this.doStopSpin(slotData);
            this._isRollEnd = true;
            await this.beforeAllReelRollEnd();
        }
        //--20250827---
        /**
         * 這裡要再多一個表演前要處理的事情
         * 例如:秀甚麼鬼東西或是特殊模式的開啟(再算分前)
         */
        this.processAfterAllReelRollEnd();


    }

    //--這邊的資料已經是抽出來的資料了
    protected override beforeStopSpin(): any {
        //---在玩家按下stop之前要做的事
        //--開始設定readyHand
        //--這邊是要找fg的round資料...不是找wild
        //(<UniSlotMachine1016>this._slotMachine).multiSetReadyHand([2, 4]);
        //--放入聽牌軸資訊



        //---例如:擷取資料之類的算_currentWildCardData的資料
        //--跟_processedServerData.getCurrentData拿該round的資料
        //const currentRoundData: IProcessSlotData = this._processedServerData.getCurrentData();
        //const readyHands = this._processedServerData.getReadyToHandForThisRound();

        //const isHasNex = this._processedServerData.hasNext;
        //const nowStepIndex = this._processedServerData.getOrderInCurrentState();
        //console.log('check_ProcessDataStepInfo:' + currentState + '-<hasNex>-' + isHasNex + '-<index>-' + nowStepIndex);

        return null;
    }

    //--這裡會開始真的呼叫stopSpin(這邊的資料已經是抽出來的資料了)IProcessSlotData
    protected override async doStopSpin(slotData: IProcessSlotData, other?: any): Promise<void> {

        if (!slotData) return;
        const roundData: IInGameRoundRecord = slotData as IInGameRoundRecord;
        const subBoard = JSON.parse(JSON.stringify(roundData.topReelSymbolData1ds));
        const mainBoard = JSON.parse(JSON.stringify(roundData.reelInfo.symbolData2ds));
        mainBoard.push(subBoard);
        await (this._slotMachine as UniSlotMachine1024).stopRoll(mainBoard);

        /*
        if (!slotData) return;
        const wildCardData = slotData.reelInfo.wildGroup;
        //--從getCurrentData取該局資料
        //this._currentwildCardData = wildCardData; //--存要塞進去處理的特殊牌資料
        const cloneCards = GameUtilsTools.deepClone(slotData.reelInfo.symbolData2ds);
        await (<UniSlotMachine1016>this._slotMachine).stopRoll(cloneCards, wildCardData);
        */
        //let currentTime = Date.now();
        //let testTime = currentTime - this._timeBaseTest;
        //GameUtilsTools.debugLog(DEBUG_TITLE_TIME_BASE, 'beforeAllReelRollEnd_Time', { testTime }, 'log');
    }


    //private createMonkSyncData(indexList: number[]): ISyncDatatype[] {
    /**
     * change:20260101---改成PropertyTransferData-屬性轉移速度更快,不需要查找了
     * @param indexList 
     * @returns 
     */
    private createMonkSyncData(indexList: number[]): IPropertyTransferData<Node>[] {

        const transferDataList: IPropertyTransferData<Node>[] = [];

        for (let i = 0; i < indexList.length; i++) {
            const reelInfo: IReelInfo = {
                reelIndex: 6,
                iconIndex: indexList[i],
                symbolId: 10 //--唐僧的symbolId固定10
            };

            const transferData: IPropertyTransferData<Node> = {
                info: reelInfo,
                targetOwnerId: SymbolOwnerAgentID.ShowAniController,
                propertyKeys: ['worldPosition'], // 要提取的屬性
                backProcessType: SyncBackProcessType1024.CREATOR_MONK_EFFECT,
                args: [{}] // 可以根據需要添加額外識別資料
            };

            transferDataList.push(transferData);
        }

        return transferDataList;
        /*
        const infoList: ISyncDatatype[] = [];
        for (let i = 0; i < indexList.length; i++) {
            const reelInfo: IReelInfo = {
                reelIndex: 6,
                iconIndex: indexList[i],
                symbolId: 10//--唐僧的symbolId固定10
            };
            const info: ISyncDatatype = {
                info: reelInfo,
                type: SyncDataType1024.SYNC_DATA_WORLD_POS,
                backProcessType: SyncBackProcessType1024.CREATOR_MONK_EFFECT,
                ownerId: SymbolOwnerAgentID.ShowAniController
            };
            infoList.push(info);
        }
     
        return infoList;
        */
    }


    private onReFillWildHandler = (eventData: any): void => {

        const { status, value, triggerTime, iconIndex } = eventData.eventData;

        console.log(`[GameViewManager] 收到補牌事件:`, {
            status,
            triggerReels: value,
            time: triggerTime,
            fromIcon: iconIndex
        });

        switch (status) {

            case MonkFxEventType.FIRST_TRIGGER:
                // 開始補牌流程
                this._waitTasks.push(
                    (this._slotMachine as UniSlotMachine1024).updateExpand(value)
                );
                this._basicShowAniProcess.shakeCamera();
                break;

            case MonkFxEventType.SECOND_TRIGGER:
                // 補牌完成（如果需要）
                console.log('[GameViewManager] 補牌完成');
                //this._slotGUICtrl.closeTweenDark();
                break;

        }
        /*
        this._waitTasks.push(
            (this._slotMachine as UniSlotMachine1024).updateExpand(eventData.eventData.value)
        );
        this._basicShowAniProcess.shakeCamera();
        */
    }

    //---slot callback(單軸停止)
    private _oneReelRollEndCallBackFromSlot = async (reelID: number) => {

        if (reelID >= 6) return;//--副盤不處理
        const currentReelLen = this._processedServerData.getCurrentBoardReelLen(reelID);
        console.log('check_currentReelLen:', reelID, currentReelLen);
        this._basicShowAniProcess.showWayNum(currentReelLen);
        const scAniPromise = (this._slotMachine as UniSlotMachine1024).getScAniPromise(reelID);
        if (scAniPromise) {
            //this._waitScAniTasks.set(reelID, scAniPromise);
            this._waitScAniTasks.push(scAniPromise);
        }
        console.log('_oneReelRollEndCallBackFromSlot', reelID);
    }
    //--全部停止後的處理(在表演前)
    protected async beforeAllReelRollEnd(): Promise<void> {

        const wildReFillData = this._processedServerData.getReFillWildData();
        const testCurrentRoundData = this._processedServerData.getCurrentData();

        if (wildReFillData) {

            //--變暗/變亮處理
            //(this._slotMachine as UniSlotMachine1024).setIconLight(6, wildReFillData.excludeMonkIcon, true);
            //(this._slotMachine as UniSlotMachine1024).setReelsLight(wildReFillData.excludedReel, true);  

            //--座標轉換抽出光頭的worldPosition
            this._waitTasks.push(
                this.processMonkReelDarkEffect(
                    wildReFillData.excludedReel,
                    wildReFillData.excludeMonkIcon,
                    wildReFillData.monkIndexList,
                    wildReFillData.triggerMonkReel,
                    wildReFillData.wildReFill.wildFillInfo
                )
            );
            /*
            const transferDataList = this.createMonkSyncData(wildReFillData.monkIndexList);
            this._crossSysFacade.transferMultiObjectProperties(transferDataList);
     
            this._waitTasks.push(this._basicShowAniProcess.playMonkFx(wildReFillData.triggerMonkReel));
            (this._slotMachine as UniSlotMachine1024).setWildExtraInfo(wildReFillData.wildReFill.wildFillInfo)
            */
        }

        if (this._waitTasks.length > 0) {

            await Promise.allSettled(this._waitTasks);
            this._waitTasks = [];
        }

        if (this._waitScAniTasks.length > 0) {
            await Promise.allSettled(this._waitScAniTasks);
            this._waitScAniTasks = [];
        }
        //(this._slotMachine as UniSlotMachine1024).setAllLight(false);
        console.log();
    }

    private async processMonkReelDarkEffect(
        excludedReel: number[],
        excludedMonks: number[],
        monkIndexList: number[],
        triggerMonkReel: number[],
        wildFillInfo: any
    ): Promise<void> {

        //(this._slotMachine as UniSlotMachine1024).setIconLightTween(6, excludedMonks, true);
        //(this._slotMachine as UniSlotMachine1024).setReelsLightTween(excludedReel, true);
        //--取背景和框  
        //this._slotGUICtrl.openTweenDark();

        // Step 2: 座標轉換抽出光頭的 worldPosition
        const transferDataList = this.createMonkSyncData(monkIndexList);
        this._crossSysFacade.transferMultiObjectProperties(transferDataList);
        // Step 3: 設置 wild 額外資訊
        (this._slotMachine as UniSlotMachine1024).setWildExtraInfo(wildFillInfo);
        // Step 4: 播放 monk 動畫（包含兩個觸發點）
        // 注意：closeTweenDark() 會在 SECOND_TRIGGER 事件中執行
        await this._basicShowAniProcess.playMonkFx(triggerMonkReel);

    }

    /**
     * 表演處理一定要實作
     * TIPS-得分資料在這邊拆掉送進去processShowAniController裡面
     * @returns 
     */
    protected async doShowResultAfterStopRoll(): Promise<void> {

        const currentRoundData: {
            winLine: IMatchInfoForRound[],
            reelLens: number[],
            reFillWinDataInfo: { reFillData: number[][], removeData: number[][] },
            reFillTop: { reFillData: number[], removeData: number[] },
            sp4IndexTop: number[]
        } = this._processedServerData.getCurrentRoundWinData();


        //--寫入當前與下一把的狀態(是否進入輪播使用)
        const gameStateCondition: IStateCondition = this.getGameStateCondition();
        this._basicShowAniProcess.gameStateCondition = gameStateCondition;

        const winScoreData: WinScoreData = this.createWinScoreData();
        //let useSequence = false;
        let roundWinData: { hasWin: boolean, bigWin: boolean };
        roundWinData = await this._basicShowAniProcess.beforeProcessWinScoreData(winScoreData, currentRoundData.winLine, currentRoundData.reelLens);
        console.log();

        if (roundWinData.hasWin) {
            //beforeShowWinDelay = this._gameStepDelayTimeList.get(cfg => cfg.result?.beforeShowWin);
            //await this.addTweenDelay(beforeShowWinDelay);
        }


        /*
        let runShowPromise: Promise<boolean> | undefined;
        if (gameStateCondition.currentRoundState === GameState.FREE_GAME) {
            runShowPromise = this._basicShowAniProcess.runShowProcess(roundWinData.hasWin);
        } else {
            await this._basicShowAniProcess.runShowProcess(roundWinData.hasWin);
        }*/
        await this._basicShowAniProcess.runShowProcess(roundWinData.hasWin);


        if (currentRoundData.reFillWinDataInfo.reFillData.length > 0 ||
            currentRoundData.reFillTop.reFillData.length > 0) {
            //--有要做refill drop
            const mainFinalData = currentRoundData.reFillWinDataInfo.reFillData;
            const mainRemoveData = currentRoundData.reFillWinDataInfo.removeData;
            const subFinalData = currentRoundData.reFillTop.reFillData;
            const subRemoveData = currentRoundData.reFillTop.removeData;
            //--隱藏消除牌(setSymbol的時候會再打開)    
            (this._slotMachine as UniSlotMachine1024).setVisibleDropIcon(mainRemoveData, subRemoveData, false);
            // 1. 消除動畫播放完成
            await this._basicShowAniProcess.doRefillAniBeforeSlotMachineReFill();
            // 2. 補牌
            await (this._slotMachine as UniSlotMachine1024).startReFillDrop(
                { reFill: mainFinalData, remove: mainRemoveData },
                { reFill: subFinalData, remove: subRemoveData }
            );

            const scAniPromise = (this._slotMachine as UniSlotMachine1024).getBoardScAniPromises();
            if (scAniPromise) {
                this._waitScAniTasks = scAniPromise;
                await Promise.allSettled(this._waitScAniTasks);
                this._waitScAniTasks = [];
            }
        }

        //--消除結束之後要再補上spin4的加局演出
        if (currentRoundData.sp4IndexTop.length > 0) {

            //--抽座標出來讓showAniProcess播
            //await (this._slotMachine as UniSlotMachine1024).playSP4Ani(currentRoundData.sp4IndexTop);
            if (gameStateCondition.currentRoundState == GameState.FREE_GAME) {
                await this._basicShowAniProcess.playSpin4FX(currentRoundData.sp4IndexTop);
                const extraFGRound = currentRoundData.sp4IndexTop.length * 4;
                this._basicShowAniProcess.setFGCount(extraFGRound);//--count FG
                await this.addTweenDelay(0.5);
            }


            //console.log();
            //--這邊要接上spin4加局後的處理(左側面板更新+4局)
        }



        /*
        if (runShowPromise) {
            await runShowPromise;
        }*/
        //--drop---

        console.log();
        return;
    }



    //--取得滾動到停止的時間處理(就是要滾動多久的時間-20251214)
    public processRollToStopTime(gameState: GameState, dataType?: RESET_DATA_TYPE): number {

        if (dataType) {
            return 0.2;
        } else {
            if (gameState === GameState.FREE_GAME) {
                if (dataType === RESET_DATA_TYPE.SPIN_SAME_ROUND) {
                    //--同局換盤
                    return 0.3;//--要滾動比較久一點
                } else if (dataType === RESET_DATA_TYPE.NO_SPIN_SAME_ROUND) {
                    //--消除
                } else if (dataType === RESET_DATA_TYPE.SPIN_NEW_ROUND) {
                    //--要新局
                }

            }

        }
        return 0.2;
    }

    //--計算下一輪開始要暫停多久
    public checkConditionForRoundStep(): number {
        return 0;
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
    protected override checkSpConditionForFinalizeToNormal(): boolean {

        const currentState = this._processedServerData.getCurrentState();
        let returnValue = false;
        if (currentState === GameState.NORMAL) {
            const { canGoFG } = this._processedServerData.getCurrentFGCondition();
            //--准許進入FG的條件達成
            returnValue = canGoFG;
        }
        return returnValue;
    }

    /**
    * 
    *  //--這邊要接挑戰遊戲開始前的處理
    /**
     * 1.先檢查是否可以進入挑戰遊戲
     * https://www.youtube.com/watch?v=fmrtXkvgBBM&t=185s
     * A:Y-挑戰遊戲-(淡入UI)-PS效果不好就用雲
     *     結束接step.2(不用淡出-直接雲去蓋掉)
     * B:N-直接跳step.2(不用淡出-直接雲去蓋掉)
     * 2.轉場(雲)-播完
     * 3.開面板(次數)
     * <TIPS>
     * 只要在NG當中符合進入FG的條件(NG中獲得4-6個SC)
     * 4Scatter=10局
     * 5Scatter=14局
     * 6Scatter=18局
     * 7Scatter=22局--直接取牌不進挑戰遊戲
     * 8Scatter=26局--直接取牌不進挑戰遊戲
     * 9Scatter=30局--直接取牌不進挑戰遊戲
     * 不管有無進入挑戰遊戲都必須call Server來取FG的盤面,否則server會視為沒有完成該局
        =========================================================================
     * 20260317新增: 不進入finalizeToNormal的流程
     * 用來走兩段式取牌
     * PS:因為NG與FG的盤面是切開的,checkNextRound不會在NG結束後進入到GameState.FREE_GAME
     * 的支線(因為沒有FG的資料)
     * @returns 
    */
    protected override async beforeProcessSpRound(): Promise<void> {

        return new Promise<void>(async (resolve) => {
            //---把resolve存在外面讓它可以被挑戰遊戲結束的事件呼叫
            this._challengeFgResolve = resolve;
            const { sc, fg, canGoFG } = this._processedServerData.getCurrentFGCondition();
            const currentState = this._processedServerData.getCurrentState();
            if (canGoFG && currentState === GameState.NORMAL) {
                //--檢查fg次數,達到最高上限就不進挑戰遊戲
                if (fg < MAXIMUM_FG_TIMES) {
                    //--開啟挑戰遊戲
                    this._gambleCtrl.goOpenGambleUI(fg);
                } else {
                    //--call server叫第二次取牌
                    const callServerStatus = ChallengeEventStatus.CALL_SERVER_TO_FG;
                    let evtData = {
                        eventType: GameEventType1024.CHALLENGE_EVENT,
                        eventData: {
                            status: callServerStatus
                        }
                    };

                    NotifyCation.getInstance().emitSync(
                        NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                        evtData.eventType,
                        evtData
                    );

                }
            }
        });
    }
    /**
     * 20260317新增: 兩段式取牌的流程,在這個流程裡面會有一段是走SP的流程,
     * 在SP流程結束後會再接回正常的流程
     */
    protected override processSpRound(): void {
        const currentState = this._processedServerData.getCurrentState();
        if (currentState === GameState.NORMAL) {
            //--如果還在NG,代表挑戰失敗了
            this.finalizeToNormal();
            return;
        }
        const step = this._processedServerData.getCurrentStep()!;
        //--這邊接回第一把FG
        this.processRound(step.state, step.data);
    }



    //--20260316新增: server back用來處理其他類型的資料(例如說進入FG後的資料)
    public override afterReceiveOtherActionWithBet(): void {
        //--進入FG的資料回來了,開始FG的流程
        const totalFGRound = this._processedServerData.getTotalFGRoundCount();

        this.initFgRound(totalFGRound).then(() => {

            GlobalAccessWriter.setGlobalData(
                GameGlobalKeys.GameState, GameState.FREE_GAME
            );
            //--改變遊戲狀態要補上
            if (this._challengeFgResolve) {
                this._challengeFgResolve();
                this._challengeFgResolve = null;
                /*
                這邊resolve就會接著往下一個流程走了   
                checkNextRound 
                processRound
                */
                //--
            }

        });
    }

    //--20260316新增:server back寫入挑戰遊戲面板的次數資料
    public override afterReceiveOtherAction(): void {
        //--擷取當下FG次數,然後把它傳進去挑戰遊戲面板
        const fgCountAfterChallenge = this._processedServerData.getDynamicProperty(ServerResType.DoubleGameData);
        this._gambleCtrl.setGambleResult(fgCountAfterChallenge);

    }

    private async initFgRound(fgTimes: number): Promise<void> {
        //--開啟FG面板
        //const totalFGRound = this._processedServerData.getTotalFGRoundCount();
        this._fgUIBoard.setBoardMode(GameState.FREE_GAME);
        await this._basicShowAniProcess.openCloudGoFG();
        this._gameModeManager.changeAllGameState(GameState.FREE_GAME);
        this._basicShowAniProcess.setTotalFGCount(fgTimes);
        await this._fgUIBoard.openFGUIBoard(fgTimes);
    }

    //--雲朵轉場的事件處理
    private onCloudTransitionHandler = (eventData: any): void => {

        const { status } = eventData.eventData;
        switch (status) {
            case GO_FG_TransitionEventStatus.TRANS_IN:
                this._gambleCtrl.closeGambleUI();//--關閉挑戰遊戲UI
                break;
        }
    }



    //--挑戰遊戲專用的事件處理
    private onChallengeHandler = (eventData: any): void => {

        const { status } = eventData.eventData;
        switch (status) {
            case ChallengeEventStatus.SELECT_BOOK:
            case ChallengeEventStatus.ENTER_FG:
                //this.initFgRound();
                //--SELECT_BOOK:挑戰遊戲call server
                //--ENTER_FG:取牌再call server 一次
                let callServerStatus = (status === ChallengeEventStatus.SELECT_BOOK) ? ChallengeEventStatus.CALL_SERVER_TO_CHALLENGE : ChallengeEventStatus.CALL_SERVER_TO_FG;
                let evtData = {
                    eventType: GameEventType1024.CHALLENGE_EVENT,
                    eventData: {
                        status: callServerStatus
                    }
                };

                NotifyCation.getInstance().emitSync(
                    NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                    evtData.eventType,
                    evtData
                );

                break;

            case ChallengeEventStatus.BACK_TO_NG:
                this._gambleCtrl.backToNgAndCloseGambleUI();
                //--賭輸了,直接回到NG,結束這一局
                if (this._challengeFgResolve) {
                    this._challengeFgResolve();
                    this._challengeFgResolve = null;
                    /*
                    這邊resolve就會接著往下一個流程走了   
                    checkNextRound 
                    processRound
                    */
                    //--
                }
                break;

        }

    }
    //--目前用不到,先空著
    protected beforeProcessNewRoundData(): void {
        //--可以用於在計算每一回合前先行處理(詳見底層流程checkNextRound)
        return;
    }
    //===============================抽象類別必須實作的部分==================================
    //===============================下一回合前處理=========================================
    protected override prepareForNextRound(): any {

        const currentState = this._processedServerData.getCurrentState();//--這邊之後要改掉
        if (currentState === GameState.FREE_GAME) {
            this._basicShowAniProcess.setFGCount(-1);//--count FG
        }

        //--這邊已經是改變了global變數的情況下
        /*
        const state = GlobalAccessWriter.getGlobalData(GameGlobalKeys.GameState);
        if (state === GameState.FREE_GAME) {
            this._fgUI.setFGCount(-1);//--count FG
     
        } else if (state === GameState.RE_SPINE) {
            // Prepare for ReSpin
            this._ngUI.setReSpinCount(-1);//--count reSpin
        }*/
    }

    public override async processRound(gameState: GameState, slotData: IProcessSlotData): Promise<void> {

        /*
        if (!this._startGetScoreInThisRound) {
            GenericUIManager.instance.showBottomTextStartSpin();//-spin按鈕狀態
        }*/
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
        //--要滾多久的時間
        let delay = this.processRollToStopTime(gameState).fixed();
        //--取得目前遊戲狀態條件
        const gameStateCondition = this.getGameStateCondition();

        /**
         * 同一個資料區間(ng/fg)的陣列內切換
         * <TIPS>:
         * 如果前一round沒有得分(無消除),但是該資料陣列還有資料尚未到最後一筆.
         * 即代表要表演next round的滾動效果(該盤面死盤了,要重刷盤面)
         */
        if (!gameStateCondition.isDifferentStateNext && !gameStateCondition.isFinal) {
            //--這邊的資料已經是nextRound的狀態了,所以要判斷前一把是否為<無>得分
            const isSameRound = this._processedServerData.checkDataIsSameRound();

            //if (!gameStateCondition.prevHasOdds ||
            //    (gameStateCondition.prevHasOdds && gameStateCondition.isPrevWildReFill)
            //) 
            if (!isSameRound) {

                /**
                 * 20260202-
                 * 這裡要再確認wild補牌後,第一次消除後
                 * 是否還有後續的消除...
                 * 目前這裡的判斷是第一次消除後,就沒有資料可以消除
                 * 20260326-
                 * 如果遇到wild補牌後,過了第一次消除,但後面還有資料可以消除的情況下:
                 * 舊有的判斷就會直接轉到一下輪..GG
                 */
                //--等待
                await this.addTweenDelay(0.3);
                //--改變局數
                this.prepareForNextRound();
                //--滾動
                this.startSpin(RESET_DATA_TYPE.SPIN_SAME_ROUND);
                await this.addTweenDelay(0.3);
                const testData = this._processedServerData.getCurrentStepForClick().data!;
                this.stopSpin(this._processedServerData.getCurrentStepForClick()?.data!);

            } else {
                //--不滾動(還有牌可以補)
                this.reSetDataForBeforeSpin(RESET_DATA_TYPE.NO_SPIN_SAME_ROUND);
                await this.addTweenDelay(delay);
                this.stopSpin(null, RESET_DATA_TYPE.NO_SPIN_SAME_ROUND);
            }

        } else {

            /**
             * 20260324-TIPS
             * 這邊是資料的最後一筆.
             * 但資料的裁切會把補牌後完整的盤面放在下一筆資料.此時會有兩種狀態
             * 1.補牌完後的狀態,此時也沒有得分
             * 2.前一筆資料無補牌資料,但最後一筆資料與前一筆資料不相同
             * 所以判斷是要過濾掉<情況1>的狀態,不然看起來會像又再轉了一次相同的盤面
             */

            //if (gameStateCondition.isFinal && gameStateCondition.nextRoundState == null) {
            //if (gameStateCondition.prevHasReFill && gameStateCondition.nextRoundState == null) {
            if (!gameStateCondition.prevHasOdds && gameStateCondition.nextRoundState == null) {
                /**
                 * 1.前一把有得分一定會有補牌的狀態,所以應該不需要檢查補牌狀態
                 * 2.<待測試>前一把沒有得分但是有wild補牌的情況
                 */
                const hasNext = this._processedServerData.hasNext;
                const data = this._processedServerData.getCurrentData();
                if (data && !hasNext) {

                    this.prepareForNextRound();
                    this.startSpin(RESET_DATA_TYPE.SPIN_SAME_ROUND);
                    await this.addTweenDelay(0.5);
                    this.stopSpin(this._processedServerData.getCurrentStepForClick()?.data!);
                }
            } else {
                this.processAfterAllReelRollEnd();
            }
        }

    }

    //--結束該round資料前處理.準備跟Server要下一round的資料
    protected override async beforeProcessNormalRound(): Promise<void> {

        const previousState = this._processedServerData.getPrevState();
        console.log();
        if (previousState === GameState.FREE_GAME) {
            //--秀結算面板
            const totalRoundScoreInfo: { betValue: number, odds: number, score: number } = this._processedServerData.getALLRoundTotalScoreAndBetFixed();
            this._fgUIBoard.setBoardMode(GameState.NORMAL);
            await this._fgUIBoard.openFGUIBoard(totalRoundScoreInfo.score);
            console.log();
        }

    }

    private _fgOutBackPromise: Promise<void> | null = null;

    private onFGOutBackHandler = (eventData: any): void => {
        this._fgOutBackPromise = this._basicShowAniProcess.openCloudOutFG();
        //this._basicShowAniProcess.openCloudToFG();
    }



    //----重置資料準備新一輪(跟server要資料前)
    protected override async resetDataForNewRound(): Promise<void> {

        //--要清掉上輪的面板資料
        //console.log('check_resetDataForNewRound', this._processedServerData.getCurrentState());
        /*
       
        GlobalAccessWriter.setGlobalData(GameGlobalKeys.RoundTotalOdds, 0);
        */
        GlobalAccessWriter.setGlobalData(
            GameGlobalKeys.GameState, GameState.NORMAL
        );
        this._isInterrupting = false; //---重置中斷狀態
        //GlobalAccessWriter.setGlobalData(GameGlobalKeys.InterruptProcess, this._isInterrupting);
        //(<UniSlotMachine1016>this._slotMachine).reSetLockReels();
        this._basicShowAniProcess.resetAllData();
        this._processedServerData.clearAllData();
        //let currentGameState = GlobalAccessWriter.getGlobalData(GameGlobalKeys.GameState);
        //--註冊遊戲收發狀態改變接收者...
        if (this._fgOutBackPromise) {
            await this._fgOutBackPromise;
            this._fgOutBackPromise = null;
        }
        this._gameModeManager.changeAllGameState(GameState.NORMAL);
        await this._basicShowAniProcess.closeCloud();
        console.log();

    }

    private getGameStateCondition(): IStateCondition {

        const currentGameState = this._processedServerData.getCurrentState();
        const nextGameState = this._processedServerData.getNextStepGameState();
        const isFinalRound = this._processedServerData.getIsLastStep();
        const nexNew = (currentGameState != nextGameState) ? true : false;
        const prevData: IInGameRoundRecord = this._processedServerData.getPrevData() as IInGameRoundRecord;
        const prevHasOdds = prevData ? (prevData.totalOdd && prevData.totalOdd > 0) : false;
        const isPWildReFill = prevData && prevData.wildReFill ? true : false;
        //--20260324 NEW 取得前一把的所有補牌狀態(只會檢查是否有補牌,不會檢查補牌的內容)
        const prevReFillDataStatus = this._processedServerData.getPrevReFillDataInfo();
        const prevHasReFill = (prevReFillDataStatus.hasReFillTopDataInfo || prevReFillDataStatus.hasReFillWinDataInfo) ? true : false;

        if (isPWildReFill) {
            //console.log();
        }
        //-wildReFillData.wildReFill.wildFillInfo
        const gameStateCondition: IStateCondition =
        {
            currentRoundState: currentGameState,
            nextRoundState: nextGameState,
            isDifferentStateNext: nexNew,
            isFinal: isFinalRound,
            isPrevWildReFill: isPWildReFill,//-上一把是否有wild補牌
            prevHasOdds: prevHasOdds,//--上一把是否有得分
            prevHasReFill: prevHasReFill//--上一把是否有補牌
        }
        return gameStateCondition;

    }

    protected override createWinScoreData(): WinScoreData {

        const thisRoundBetInfo = this._processedServerData.getRoundBetAndOdds();
        return {
            baseOdds: 0, // 待刪除
            totalOdd: thisRoundBetInfo.odds,//--裡面的資料如果是fg的話,他已經是乘上倍率的值(每一輪)
            betValue: thisRoundBetInfo.betValue,
            multiplier: thisRoundBetInfo.multiplier//--有的話自己接出來時做
        };
    }

    //============================== testMode 狀態 =========================
    override async runTest(value?: any): Promise<void> {

        //--for test--
        //this.openChallengeGameUi();
        return;
        this.setServerReceiveDataIncremental(value, GameState.FREE_GAME, true);
        await this.beforeProcessFGRound(null);
        await this.prepareForNextRound();
        this._slotMachine.startRoll(this._currentTurboSpeed);
        await this.addTweenDelay(0.5);
        this.newRoundDataToStopSpin();

        return;
        this._slotMachine.startRoll(this._currentTurboSpeed);
        //this.setServerReceiveData(value);
        this.setServerReceiveDataIncremental(value, GameState.FREE_GAME, true);
        const totalFGRound = this._processedServerData.getTotalFGRoundCount();
        this._basicShowAniProcess.setTotalFGCount(totalFGRound);
        await this.addTweenDelay(0.5);
        this.newRoundDataToStopSpin();

        /*
        this.setServerReceiveData(value);
        const subBoard = JSON.parse(JSON.stringify(value.topReelSymbolData1ds));
        const mainBoard = JSON.parse(JSON.stringify(value.reelInfo.symbolData2ds));
        mainBoard.push(subBoard);
     
        this._slotMachine.startRoll(false);
        await GameUtilsTools.DeferByTweenPromise(0.2);
        this.stopSpin(value);
        //await this._slotMachine.stopRoll(mainBoard);//--深拷貝
        */

        /*
        if (value.wildReFill) {
            //--拿target.wildReFill.wildFillInfo的資料去做補牌
            if (value.wildReFill.wildFillInfo) {
                const excludedReel = this.fastPickExcludeReel(value.wildReFill.wildFillInfo);
                const monkInfo = value.monkInfo;
     
                const excludeMonkIcon = this.fastPickExcludeIcon(value.monkInfo);
                (this._slotMachine as UniSlotMachine1024).setIconLight(6, excludeMonkIcon, true);
                (this._slotMachine as UniSlotMachine1024).setReelsLight(excludedReel, true);
                await (this._slotMachine as UniSlotMachine1024).setWildExtraInfo(value.wildReFill.wildFillInfo);
                this._crossSysFacade.debugCheckAllOwners();
     
            }
        }*/


    }

    //---for test---


}


