import { _decorator, CCBoolean, CCFloat, Component, Node, profiler, SpriteFrame } from 'cc';
import { GameState, TransitionsState, ShowBottomTextStatus } from '../GameStateConfigDef/GameStateConfigDef';
import { BasicSlotGameViewManager } from '../BasicGameViewManager/BasicGameViewManager';
import { BasicProcessSlotData, IProcessSlotData } from '../BasicProcessServerData/IProcessSlotData';
import { NotifyCation } from '../ReferencePathForMyUtils';
import { GameViewEvents, NotifySubject } from '../BasicGameEvent/EventTypesDefinition';
import { GameUtilsTools } from '../GameUtilsTool';
import { AsyncScope } from '../../MyUtils/AsyncScope/AsyncScope';
import { GameController, GenericUIManager, BetData, PlayerInfo, NetworkHandler, NewFlashModeEnum, BuyFeatureMode, Localization, BuyFeatureCardInfo, NetworkEvent } from 'db://assets/Scripts/ModuleEntry';
import { AdditionalPurchaseType } from 'db://assets/Scripts/NetAgent/CConnectManager/CConnectDefine';
//import { AdditionalPurchaseType } from '../../ReferencePath';

const { ccclass, property } = _decorator;

@ccclass('AbstractBasicGameController')
/**
 * 抽象控制器，定義 Slot 遊戲流程中所有共通邏輯與流程事件的接口。
 * - 所有具體 GameController 應繼承本類並實作 abstract 方法。
 * - 本類負責統一處理例如 showBottomText 等共用方法。
 */
export abstract class AbstractBasicGameController<P extends BasicProcessSlotData,
    S extends IProcessSlotData,
    G extends GameState = GameState>
    extends GameController {

    @property({ type: BasicSlotGameViewManager, visible: true, displayName: 'BasicGameViewManager', tooltip: '基本遊戲流程管理器' })
    protected _gameViewManager!: BasicSlotGameViewManager<P, S, G>;

    @property({ type: CCFloat, visible: true, displayName: 'Game Cycle Delay', tooltip: '遊戲循環延遲時間,單位(秒)' })
    protected _gameCycleDelay: number = 0;

    @property({ type: CCBoolean, visible: true, displayName: 'LocalTest', tooltip: '啟用LocalTest模式' })
    protected _isLocalTest: boolean = false;


    protected _beforeBuyFgBetValue: number = 0;//---轉完FG之後要回復的下注金額
    protected _isBuyFg: boolean = false;//---是否是購買FG的狀態
    protected _fgFinalBet: number = 0;//---購買FG的倍率
    protected _accumulationScoreBySingleRound: number = 0;//---有FG的狀態下,底下顯示的得分數需要累加
    protected _gettingFgInRound: boolean = false;//---是否在FG的狀態下,底下顯示的得分數需要累加
    protected _useVersion: boolean = false;//---是否使用測試版本號
    protected _strVersion: string = '';//---版本號
    protected _signalFlowKey: string = 'GAME_CYCLE_SIGNAL_FLOW_KEY';//---遊戲循環signalFlow key 
    protected _async: AsyncScope;//--註冊管理使用promise/delayTime工具 
    protected _interruptingGameCycle: boolean = false;//--是否在中斷遊戲循環中 

    //--20260316NEW:使用sendOtherAction傳送額外的動作與資料給server
    @property({ type: CCBoolean, displayName: 'Use Send Other Action', tooltip: '是否啟用sendOtherAction傳送額外的動作與資料給server', visible: true })
    protected _useSendOtherAction: boolean = false;//--是否啟用sendOtherAction傳送額外的動作與資料給server

    //--20260316 NEW:使用sendOtherActionWithBet傳送額外的資料給server(包含下注金額)
    @property({ type: CCBoolean, displayName: 'Use Send Other Action With Bet', tooltip: '是否啟用sendOtherActionWithBet傳送額外的資料給server(包含下注金額)', visible: true })
    protected _useSendOtherActionWithBet: boolean = false;//--是否啟用sendOtherActionWithBet傳送額外的資料給server(包含下注金額)


    //--20260309 NEW:購買特色/額外押注
    @property({ type: CCBoolean, displayName: 'Use Buy Feature', tooltip: '是否啟用購買特色功能', visible: true })
    protected _useBuyFeature: boolean = false;//--是否啟用購買特色功能

    @property({ type: CCFloat, displayName: 'Extra Bet Ratio', tooltip: '額外押注倍率(例如80倍就填80)', visible: true })
    protected _extraBetRatio: number = 0;//--額外押注倍率 

    @property({ type: [SpriteFrame], displayName: 'Buy Feature Icons', tooltip: '購買特色圖示(SpriteFrame)', visible: true })
    protected _buyFeatureIcons: SpriteFrame[] = [];//--購買特色圖示(SpriteFrame)

    protected _betRatio: number = 0;//--購買特色後的倍率
    protected _purchaseType: AdditionalPurchaseType = AdditionalPurchaseType.None;//--購買類型


    //=======================<GameController function>=============================================================


    public override onUpdateBetValue(betValue: number): void {
        super.onUpdateBetValue(betValue);
        this._gameViewManager.setPlayerBetValue(betValue);
    }

    //=======================<GameRoot call back>==================================================================

    public override init(gameNumber: number, isOnline: boolean): void {

        super.init(gameNumber, isOnline);
        this.processGameModeData();
        this.initForOtherSystem();
        this._async = AsyncScope.getInstance();
        //---stop btn from gameUI callback---
        GenericUIManager.instance.onStopBtnClickCallback = this.onStopBtnClickHandler;
        //---購買特色--
        this.initBuyFeature();
        //--這個gameRoot會做別的事情..包含set GameTimeScale--所以直接override 不要另外assign新方法
        //GenericUIManager.instance.onNewFlashBtnSwitch = this.onTestTurboFlashMode;
        //-----訂閱view的NotifyCation的事件--- 
        NotifyCation.getInstance().on(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.SHOW_END, this.onGameViewShowEndEventHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.MANUAL_NO_WIN, this.onGameViewManualEndEventHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.BUY_FG, this.onGameViewBuyFgEventHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.SET_BOTTOM_TEXT, this.onSetBottomTextEventHandler, this);
        NotifyCation.getInstance().on(NotifySubject.GAME_VIEW_SUBJECT, GameViewEvents.GET_CURRENT_BET, this.onGetCurrentBetEventHandler, this);
        //--20260316 NEW:訂閱額外動作的事件
        if (this._useSendOtherAction) {
            NetworkHandler.instance.addEventListener(NetworkEvent.OtherAction, this.onSendOtherActionEvtHandler);
        }

        if (this._useSendOtherActionWithBet) {
            NetworkHandler.instance.addEventListener(NetworkEvent.OtherActionWithBet, this.onSendOtherActionWithBetEvtHandler);
        }

    }

    //---購買特色---
    protected initBuyFeature() {

        if (!this._useBuyFeature) return;
        GenericUIManager.instance.setExtraBetOpen(this._extraBetRatio);
        GenericUIManager.instance.setExtraBetTipText(Localization.instance.t('ExtraBet_Tip_Text'));

        let card = new BuyFeatureCardInfo();
        card.title = Localization.instance.t('BuyFeature_Card_Title');
        card.content = Localization.instance.t('BuyFeature_Card_Content');
        card.icon = this._buyFeatureIcons[0];
        card.multiply = 80;//--不確定每款遊戲選擇的卡片倍率會是多少?(等同extraBetRatio)

        GenericUIManager.instance.setBuyFeatureCardInfo([card]);
        GenericUIManager.instance.setBuyBonusOpen();
        GenericUIManager.instance.onBuyFeatureModeChangeCallback = this.onBuyFeatureModeChange.bind(this);
    }

    //--to U:依照不同牌的情況你可以override
    protected onBuyFeatureModeChange(mode: BuyFeatureMode, multiply: number, cardIndex: number): void {
        this._betRatio = multiply;

        if (mode === BuyFeatureMode.BuyBonus) {
            if (cardIndex === 0) {
                this._purchaseType = AdditionalPurchaseType.FG;
            }
        } else if (mode === BuyFeatureMode.ExtraBet) {
            this._purchaseType = AdditionalPurchaseType.RiseFGRate;
        } else {
            this._purchaseType = AdditionalPurchaseType.None;
        }
    }

    protected processGameModeData(): void {

        this._useVersion = true;
        if (this._isLocalTest) {
            GameUtilsTools.useDebugLog = true;
            this.isOnline = false;
            profiler.showStats();

        } else {
            profiler.hideStats();//--關閉相關測試面板
            GameUtilsTools.useDebugLog = false;
        }
    }


    /**
     * 設定是否啟用2階加速模式。(預設false)
     * @param value true:開啟2階加速,false:關閉2階加速
     */
    protected setTwoLevelTurboMode(value: boolean): void {
        GenericUIManager.instance.setTwoLevelTurboMode(value);
    }


    public override setupBeforeGame() {

        this.doSomethingSettingBeforeGame();
        if (this._useVersion) {
            GenericUIManager.instance.setVersion(this._strVersion);

        }
        return Promise.resolve();
    }

    //--override it---在setupBeforeGame之前要做的事情
    protected doSomethingSettingBeforeGame(): void {

    }



    //==============<view NotifyCation>=======================================================================================

    /**
    * 這邊要等到全部的動作都做完(得分的表演)
    * 才會call這個function
    * <這一round結束,與Server要求下一把的資料>
    */
    protected onGameViewShowEndEventHandler = async () => {
        // Handle the event when the game view shows the end state
        this.processInShowEndEvent();
        this._interruptingGameCycle = false;
        GenericUIManager.instance.setBalance(PlayerInfo.balance);
        /*
        const signal = this._async.createAbortScope(this._signalFlowKey);
        const cancel = () => {
            console.log();
            this._interruptingGameCycle = true;
        }
        const inHandle = this._async.waitSecondsTracked(this._gameCycleDelay, this._signalFlowKey, cancel, true, signal, this._signalFlowKey);
        await inHandle.promise;
        */
        this.setAutoNextRound();
        this.checkAutoNext();
    }

    /**遊戲中顯示底下的文字 */
    protected onSetBottomTextEventHandler = (sub) => {
        //-sub.eventType裡面有eventType可以辨識
        this.showBottomText(sub.eventData.status, sub.eventData.value);
    }
    /**結束一局，沒有自動，回到Idle狀態時，要Call這個Function，隨機顯示一個文字 */
    protected onGameViewManualEndEventHandler = () => {
        this.showBottomText(ShowBottomTextStatus.NO_WIN);
    }




    //==============<view NotifyCation>=======================================================================================

    //=======================<GenericUI EVENT>=====================================================================
    //空白按鍵也會啟動這個(空白按鍵也會啟動,一次啟動spin下一次啟動stopSpin)
    public override onStartSpin(): void {
        this.clickStartSpinProcess();
    }

    protected clickStartSpinProcess(): void {
        GenericUIManager.instance.setMainUIStopBtnEnabled();
        this.startSpin();
    }

    //玩家主動按下stopSpin按鈕(空白按鍵也會啟動,一次啟動spin下一次啟動stopSpin)
    protected onStopBtnClickHandler = () => {
        this._gameViewManager.onStopBtnClickHandler();
    }

    protected startSpin(): void {
        this.resetRoundData();
        if (this.checkBalanceAndProcessBtn()) {
            return;//--錢不夠就return
        }
        //---顯示開始spin的字樣(中間下面顯示遊戲流程狀態?的label)
        this.showBottomText(ShowBottomTextStatus.ROLLING);
        this._gameViewManager.startSpin();
        this._gameViewManager.setAutoModeTimer();

        this.sendDataToServer(this._purchaseType);
    }

    //=======================<GameRoot call back>==================================================================

    /**
    * autoSpin按鈕被按下時啟動
    */
    public override onStartAuto(autoTimes: number): void {
        super.onStartAuto(autoTimes);
        this._gameViewManager.setStartAutoSpinMode(true);
        this.checkAutoNext();
    }

    /**
     * 在checkAutoNext呼叫前執行(公版UI需要的)
     * isEnterFeatureGame===>這邊指的是有<轉場切換的那一個東西(機制?流程)>
     * 就是屬於特色遊戲,所以有可能是FG,也有可能是bonus game之類的
     */
    protected setAutoNextRound(): void {
        this.checkAutoNextData = {
            isEnterFeatureGame: false,//---是否進入FG/特色遊戲(不一定只有FG)
            odd: 0,//--單一局的總odds(整駝的賠率,就是你在checkScore的totalOdds)
            balance: PlayerInfo.balance,
        };
    }


    /** networkManager會call這個function */
    public override onReceiveBet(betData: BetData): void {

        this.finalBalance = betData.coin;
        if (this._isBuyFg) {
            //--購買fg前的處理
        } else {
            this.balanceAfterSpin = PlayerInfo.balance - betData.bet;
        }
        PlayerInfo.balance = this.finalBalance;

        if (this.isOnline) {
            let debugText = `${betData.spinId}`;
            if (NetworkHandler.instance.demo !== true) {
                GenericUIManager.instance.setBottomText(debugText);
            }
        }

        GenericUIManager.instance.setBalance(this.balanceAfterSpin);
        this.processReceiveBet(betData);
    }

    // 20260316 NEW:Handle the event when other actions are sent
    protected onSendOtherActionEvtHandler = (action: number, base64Data: string) => {
        this.processOtherActionData(action, base64Data);
    }

    // 20260316 NEW:Handle the event when other actions with bet are sent
    protected onSendOtherActionWithBetEvtHandler = (action: number, betData: BetData) => {
        this.processOtherActionWithBetData(action, betData);
    }



    //========================<processServerData>==================================================================
    protected sendDataToServer(purchaseType: AdditionalPurchaseType, buyFGBetValue?: number): void {

        if (!this.isOnline) {
            //--local test
            this.callServerInLocalTest();
        } else {

            if (purchaseType === AdditionalPurchaseType.FG) {
                //--do something fo buyFG
                //--購買fg的金額
                if (buyFGBetValue === undefined) {
                    buyFGBetValue = this.getBuyFGBetValue();
                }
                this.callServerWithFG(buyFGBetValue);
            } else {
                //--do something for normal spin
                this.callServerWithOutFG(purchaseType);
            }
        }
    }

    protected checkAutoNext(): void {

        //-確認是否還有下一局的freeGame
        if (GenericUIManager.instance.checkAutoStatus(this.checkAutoNextData)) {
            this.startSpin();
        } else {
            //--沒有下一局的freeGame就要停止auto mode,將spin按鈕切回正常狀態
            /*
            if (this._interruptingGameCycle) {
            //--待觀察..好像是按鈕在切換狀態的瞬間被按下會有問題    
            this._interruptingGameCycle = false;
                this.clickStartSpinProcess();
            } else {
                GenericUIManager.instance.setMainUIToNormalMode();
                this._gameViewManager.setStartAutoSpinMode(false);
            }*/

            GenericUIManager.instance.setMainUIToNormalMode();
            this._gameViewManager.setStartAutoSpinMode(false);

        }
    }

    //=======================<others>=====================================================================
    //--20260309-NEW
    protected override checkBalanceEnough(): boolean {
        if (PlayerInfo.balance < this.betValue * this._betRatio) {
            this.showBankruptcyError();
            return false;
        }
        return true;
    }
    protected checkBalanceAndProcessBtn(): boolean {

        if (!this.checkBalanceEnough()) {
            if (GenericUIManager.instance.isAutoMode) {
                GenericUIManager.instance.stopAutoMode();
                GenericUIManager.instance.setMainUIToNormalMode();//---spin按鈕回到正常狀態
            }
            return true;
        }
        return false;
    }


    protected showBottomText(status: ShowBottomTextStatus, value?: any): void {

        switch (status) {
            case ShowBottomTextStatus.NO_WIN:
                // 結束一局，沒有自動，回到Idle狀態時，要Call這個Function，隨機顯示一個文字
                if (!GenericUIManager.instance.isAutoMode) {
                    //-showBottomTextIdle
                    GenericUIManager.instance.showBottomTextIdle();//--秀跑馬燈
                } else {
                    GenericUIManager.instance.showBottomTextEmpty();//--清空
                }

                break;
            case ShowBottomTextStatus.ROLLING:
                GenericUIManager.instance.showBottomTextStartSpin();
                break;
            case ShowBottomTextStatus.WIN:
                let showScore: number = 0;
                //--有FG的情況下FG的得分面板要顯示的跟bottomText一樣(從NG一路累加)
                if (this._gettingFgInRound) {
                    this._accumulationScoreBySingleRound += value;
                    showScore = this._accumulationScoreBySingleRound;
                } else {
                    showScore = value;
                }
                GenericUIManager.instance.showBottomTextWinScore(showScore);
                break;
            case ShowBottomTextStatus.IDLE:
                // 結束一局，沒有自動，回到Idle狀態時，要Call這個Function，隨機顯示一個文字
                GenericUIManager.instance.showBottomTextIdle();
                break;
            case ShowBottomTextStatus.DEBUG:
                //GenericUIManager.instance.show(value);
                GenericUIManager.instance.setBottomText(value);
                break;
        }
    }

    //=======================<override abstract function>=====================================================================

    //--game root 在init末端呼叫,你可以override來準備你要處理的事情    
    //public abstract override setupBeforeGame(): Promise<void>
    //--在這邊初始化在此類別當中沒有啟動的系統(processServerData,gameViewManager.....)
    protected abstract initForOtherSystem(): void;
    //-after <onGameViewShowEndEventHandler>
    protected abstract processInShowEndEvent(): void;
    //-after <onReceiveBet>
    protected abstract processReceiveBet(betData: BetData): void;
    //-after <onSendOtherActionEvtHandler>-20260316新增
    protected abstract processOtherActionData(action: number, base64Data: string): void;
    //-after <onSendOtherActionWithBetEvtHandler>-20260316新增
    protected abstract processOtherActionWithBetData(action: number, betData: BetData): void;




    //--override it---reset ur server data
    //-e.g:this._currentSlotInfo.resetRoundData();
    protected abstract resetRoundData(): void

    //--正常流程會呼叫的方法
    protected callServerWithOutFG(purchaseType: AdditionalPurchaseType): void {
        this.sendBet(this.betValue, purchaseType)
    }
    /**購買FG前的處理 */
    protected callServerWithFG(buyFGBetValue: number): void {
        //---這邊的buyFGBetValue其實就等於this.betValue
        this.sendBet(buyFGBetValue, AdditionalPurchaseType.FG);
    }

    protected sendOtherAction(action: number, content: number[] = []): void {

        if (!this.isOnline) {
            this.callSendOtherActionLocalTest();
        } else {
            let gameNumber = this.gameNumber;
            let playerToken = this.playerToken;
            NetworkHandler.instance.sendOtherAction(gameNumber, playerToken, action, content);
        }

    }

    protected sendOtherActionWithBet(action: number, content: number[] = []): void {

        if (!this.isOnline) {
            this.callSendOtherActionWithBetLocalTest();
        } else {
            let gameNumber = this.gameNumber;
            let playerToken = this.playerToken;
            let bet = this.betValue;
            let balance = PlayerInfo.balance;
            NetworkHandler.instance.sendOtherActionWithBet(gameNumber, bet, balance, playerToken, action, content);
        }
    }

    //------override it--------
    protected getBuyFGBetValue(): number {
        //---這邊的buyFGBetValue其實就等於this.betValue
        return this.betValue;
    }

    protected callServerInLocalTest(): void {

    }
    //--20260318 NEW:呼叫SendOtherAction的local test
    protected callSendOtherActionLocalTest(): void {

    }

    //--20260318 NEW:呼叫SendOtherActionWithBet的local test
    protected callSendOtherActionWithBetLocalTest(): void {

    }


    /**購買FG的事件 */
    protected onGameViewBuyFgEventHandler = (sub) => {

    }

    /**FG的事件 */
    protected onGetCurrentBetEventHandler = (sub) => {

    }





}


