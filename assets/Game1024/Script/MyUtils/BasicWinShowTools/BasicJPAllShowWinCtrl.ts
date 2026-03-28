import { _decorator, CCFloat, CCInteger, Component, Game, Node } from 'cc';
import { BasicJpUIBoard } from './components/BasicJpUIBoard';
import { JpDigitsAniNumber } from './components/JpDigitsAniNumber';
import { I4WinAnimationStateType, WinType } from './Definitions/ShowWinDef';
import { JpSoundController } from './components/JpSoundController';
//import { AudioManager, SOUND_TYPE } from 'db://assets/Scripts/Audio/AudioManager';
import { GameUtilsTools } from '../GameUtilsTool';
import { BasicGameStepDelayTime } from '../BasicStepDelayTimeList/BasicGameStepDelayTime';
import { IJpInterruptTime } from './Definitions/ShowWinDef';
import { AsyncScope } from '../AsyncScope/AsyncScope';
import { AudioManager } from 'db://assets/Scripts/ModuleEntry';
import { BasicAllJpUIBoard } from './components/BasicAllJpUIBoard';
const DEBUG_LOG_TITLE = 'BasicJPAllShowWinCtrl';
const { ccclass, property } = _decorator;
const SIGNAL_KEY = 'JPSHOW_SIGNAL';
@ccclass('BasicJPAllShowWinCtrl')
export class BasicJPAllShowWinCtrl extends Component {

    @property({ type: BasicAllJpUIBoard, visible: true, displayName: '大獎顯示All4Win', tooltip: '大獎顯示BasicJpUIBoard' })
    protected _all4Win: BasicAllJpUIBoard = null;

    @property({ type: JpDigitsAniNumber, visible: true, displayName: 'JP數字顯示', tooltip: 'JP數字顯示' })
    protected _jpDigitsAniNumber: JpDigitsAniNumber = null;

    @property({ type: JpSoundController, visible: true, displayName: 'JP音效控制器', tooltip: 'JP音樂' })
    protected _jpSoundController: JpSoundController = null; //---音效控制

    @property({ type: Node, visible: true, displayName: 'blockSensor', tooltip: '點擊空白處感應區' })
    protected _blockSensor: Node = null;

    @property({ type: CCFloat, visible: true, displayName: 'winScore duringTime', tooltip: '跑分動畫持續時間' })
    protected _winScoreDuringTime: number = 4.8;//--預設跑分動畫持續時間

    @property({ type: CCFloat, visible: true, displayName: 'winAniLoop duringTime', tooltip: '進場後面板持續時間' })
    protected _winAniLoopDuringTime: number = 2.0;//--預設進場後動畫轉換持續時間

    protected _currentJpType: WinType = null;
    //protected _currentJpBoard: BasicJpUIBoard = null;
    protected _onlyOnceFlag: boolean = false; //---結尾聲用的(因為動畫與公版的聲音對不起來)
    protected _musicFadeOutComplete: () => void = null; // 音樂淡出完成的回調函式
    protected _resolvePromise: (() => void) | undefined; // (非同步,主要靠這個resolve來讓外面的流程繼續)
    protected _mapJpTypeToBoard: Map<WinType, BasicJpUIBoard> = new Map<WinType, BasicJpUIBoard>();
    protected _dirtyFlag: boolean = false;
    protected _frameEventCallBack: () => void = null;//--給可能需要用到frame event的子類別用的
    //protected _gameStepDelayTimeList: BasicGameStepDelayTime;
    protected _startTime: number = 0;
    //protected _canInterruptTime: number = 0;//--可以被阻斷的時間
    //private _async: AsyncScope;
    //--紀錄每個類型的中斷時間資料
    protected _interruptTimeData: Map<WinType, IJpInterruptTime>;
    protected _isInterrupted: boolean = false;  // 中斷檢查
    protected _isProcessingClick: boolean = false; // 防止重入的Flag
    protected _firstClickAborted: boolean = false; // 第一次點擊是否被中斷

    set frameEventCallBack(value: () => void) {
        this._frameEventCallBack = value;
    }

    constructor() {
        super();
    }

    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        this.init();
    }

    protected start(): void {

        this._all4Win?.init();
        this._all4Win.current4WinAniStateType = this.get4WinAniStateType();
        this.goBackToDefault();
        this.setLabelNode();
        /*
        this._mapJpTypeToBoard.set(WinType.BigWin, this._bigWin);
        this._mapJpTypeToBoard.set(WinType.SuperWin, this._superWin);
        this._mapJpTypeToBoard.set(WinType.EpicWin, this._epicWin);
        this._mapJpTypeToBoard.set(WinType.MegaWin, this._megaWin);
        */
        //--測試關閉


        this._all4Win.node.active = false;
        this.node.active = false;
        //this.node.parent.active = false;

    }

    //--override it
    protected setLabelNode(): void {

    }

    //--override it
    protected goBackToDefault(): void {

    }

    //--override it
    protected get4WinAniStateType(): I4WinAnimationStateType {
        //--去寫I4WinAnimationStateType
        //this._all4Win.current4WinAniStateType={}
        return null;
    }

    //--這邊改成外部注入-todo-20251023
    //--override it
    public register(...args): void {
        //this._async = AsyncScope.getInstance();
        //this.setInterruptTimeData();
    }

    public init(): void {
        if (!this._dirtyFlag) return;
    }

    public reset(): void {

        this._currentJpType = null;
        //this._currentJpBoard = null;
        this._onlyOnceFlag = false;
        this._resolvePromise = undefined;
        this.goBackToDefault();

        if (this._all4Win.node) {
            this._all4Win.node.active = false;
        }
        this.node.active = false;
        //this.node.parent.active = false;
        this._startTime = 0;
    }

    public async showJPWin(odds: number, totalBet: number): Promise<void> {
        this._startTime = Date.now();//--記錄開始時間(阻斷的時候會需要用到)
        /*
        const registerSignalTime=this._gameStepDelayTimeList.get(cfg=>cfg.Jackpot?.interruptTime);
        const signal=this._async.createAbortScope(SIGNAL_KEY);
        this.scheduleOnce(() => {
 
        },registerSignalTime);
        */


        return new Promise(async (resolve, reject) => {

            this.reset();
            this.node.active = true;
            this.node.parent.active = true;
            this._resolvePromise = resolve;
            this._onlyOnceFlag = false; //---重置結尾聲
            this._isInterrupted = false;
            this._firstClickAborted = false;

            this._currentJpType = this.getJpType(odds);
            if (this._currentJpType === null) {
                GameUtilsTools.debugLog(DEBUG_LOG_TITLE, 'showJPWin', { odds, totalBet });
                return;
            }

            this.setInterruptTimeData();
            this._all4Win.current4WinType = this._currentJpType;
            this.addFrameEventCallBack();
            //--流程-4.8S跑分 2秒停留Loop
            this._blockSensor?.on(Node.EventType.TOUCH_END, this.blockBtnClickHandler);

            const totalScore = (odds * totalBet).fixed();
            //====step1 進場動畫+播放音效===============================
            this.processBoardIn();//--播放動畫
            this.processPlayJPSound();//--播放音效
            this.fadeInOrOutBGMusic(1);//--fade out

            //====step2 跑分動畫========================================
            await this.processRunScoreLabel(totalScore);
            //--檢查中斷
            if (this._isInterrupted) {
                //GameUtilsTools.debugLog(DEBUG_LOG_TITLE, '[showJPWin] Interrupted after runScore');
                return;
            }

            //====step3 wait loop========================================
            const loopDurationTime = this._all4Win.jackpotLoopDuration;
            await this._all4Win.waitLoopDuration(loopDurationTime);

            if (this._isInterrupted) {
                //GameUtilsTools.debugLog(DEBUG_LOG_TITLE, '[showJPWin] Interrupted during loopDuration');
                return;
            }

            //====step4 out and end process========================================

            this.fadeInOrOutBGMusic(0);//--fade in
            this.onScoreRunEnd(false);
            await this.processBoardGoLoopAndClose();

            this.fadeOutFinish();
            this.finishAndRemove();
        });
    }



    //-中斷目前的流程
    public interruptProcess(): void {

    }

    //--override it
    protected addFrameEventCallBack(): void {

    }

    //-override it(要把要跑的label傳進去)
    protected async processRunScoreLabel(value: number): Promise<void> {
        await this._jpDigitsAniNumber.showJpDigitsAniNumber(value);
    }

    protected setInterruptTimeData(): void {

        if (!this._interruptTimeData) {
            console.warn('InterruptTimeData not initialized!');
            return;
        }
        if (this._currentJpType === null || this._currentJpType === undefined) {
            console.warn('CurrentJpType not set!');
            return;
        }
        const config = this._interruptTimeData.get(this._currentJpType);
        if (!config) {
            console.warn('No config for type:', this._currentJpType);
            return;
        }
        this._all4Win.jackpotLoopDuration = config.loopDurationTime;
        this._all4Win.fastLoopDuration = config.fastLoopDuration;
        this._jpDigitsAniNumber.duration = config.runDurationTime;
    }

    protected getJpType(odds: number): WinType {

        let type: WinType = null;
        if (odds >= 25 && odds <= 50) {
            type = WinType.BigWin;
        } else if (odds > 50 && odds <= 100) {
            type = WinType.SuperWin;
        } else if (odds > 100 && odds <= 200) {
            type = WinType.MegaWin;
        } else if (odds > 200) {
            type = WinType.EpicWin;
        }
        return type;
    }

    protected canProcessClick(): { canProcess: boolean; reason?: string } {
        const currentTime = Date.now() - this._startTime;
        const canInterruptTime = this._interruptTimeData.get(this._currentJpType)?.canInterruptTime;

        if (currentTime < canInterruptTime) {
            return { canProcess: false, reason: 'too_early' };
        }

        if (this._all4Win.isClosing) {
            return { canProcess: false, reason: 'already_closing' };
        }

        if (this._isProcessingClick) {
            return { canProcess: false, reason: 'processing' };
        }

        return { canProcess: true };
    }

    protected async handleFirstClick(): Promise<void> {

        this._isProcessingClick = true;//--?
        this._isInterrupted = true;//標記流程被中斷

        this._jpDigitsAniNumber.showFinishWinScore();// 強制結束跑分
        this.onScoreRunEnd(true);// 結束音效
        this.fadeInOrOutBGMusic(0);// 恢復背景音樂
        //--process board ani -->LOOP 
        // <注意> 會await，在等待期間用戶可以第二次點擊
        await this.processAniOnClick();

        if (!this._firstClickAborted) {

            this.cleanupAndFinish();
            // 移除監聽器（不需要第三次點擊了）
            if (this._blockSensor.hasEventListener(Node.EventType.TOUCH_END, this.blockBtnClickHandler)) {
                this._blockSensor.off(Node.EventType.TOUCH_END, this.blockBtnClickHandler);
            }
        }
    }

    protected async handleSecondClick(): Promise<void> {

        this._firstClickAborted = true;//--第一次點擊被中止
        // 移除監聽器（不需要第三次點擊了）
        this._blockSensor.off(Node.EventType.TOUCH_END, this.blockBtnClickHandler);
        // 直接call click處理（會中斷 Loop 等待，播放 Out）
        await this.processAniOnClick();
        this.cleanupAndFinish();
    }

    protected cleanupAndFinish(): void {
        this.fadeOutFinish();
        this.finishAndRemove();
    }

    protected blockBtnClickHandler = async (): Promise<void> => {

        const validation = this.canProcessClick();
        if (!validation.canProcess) {
            return;
        }

        // === 判斷是第一次還是第二次點擊 ===
        const isSecondClick = this._all4Win.isInLoop && this._all4Win.isInLoopStage;

        try {
            if (isSecondClick) {
                await this.handleSecondClick();
            } else {
                await this.handleFirstClick();
            }
        } finally {
            this._isProcessingClick = false;
        }

    }

    protected finishAndRemove(): void {

        if (this._blockSensor.hasEventListener(Node.EventType.TOUCH_END, this.blockBtnClickHandler)) {
            this._blockSensor.off(Node.EventType.TOUCH_END, this.blockBtnClickHandler);
        }
        if (this._resolvePromise) {
            this._resolvePromise();
            this._resolvePromise = undefined;
        }
        this._all4Win?.goBackToDefault();
        this._musicFadeOutComplete = null;
        this.reset();
    }

    protected fadeOutFinish(): void {
        //this._jpAniController.closeAndStop();
        this._jpDigitsAniNumber.stopJpDigitsAniNumber();
    }
    //=============================<處理動畫相關程序>================================================================================
    //--override it
    protected async processBoardOut(): Promise<void> {
        await this._all4Win.forceOutBoard();
        //this.fadeOutFinish();
    }

    //--override it
    protected processBoardIn(): Promise<void> {

        return Promise.resolve();
    }

    protected async processBoardGoLoopAndClose(): Promise<void> {
        await this._all4Win.goLoopAndClose();
    }

    protected async processAniOnClick(): Promise<void> {
        //await this._currentJpBoard.onClickDuringJpAni();
        await this._all4Win.onClickForceOutJpAni();
    }


    //=============================<處理聲音相關程序>================================================================================
    //--override it
    protected processPlayJPSound(): void {
        this._jpSoundController?.playJPSound(this._currentJpType);//--播放音效
    }

    protected onScoreRunEnd = (isClickEnd: boolean): void => {

        if (isClickEnd) {
            this._jpSoundController?.stopSound();
        }
        if (!this._onlyOnceFlag) {
            this._onlyOnceFlag = true; //---只播放一次
            this._jpSoundController?.playSoundEnd(isClickEnd);
        }
    }

    //--0=fadeIn, 1=fadeOut
    protected fadeInOrOutBGMusic(value: number): void {
        return;
        const startVolume = (value == 0) ? 0 : 1;
        const endVolume = (value == 0) ? 1 : 0;
        this._musicFadeOutComplete = null;
        if (value == 1) {
            //--fade out
            this._musicFadeOutComplete = () => {
                //---ready
                AudioManager.instance.pauseMusic();
                this._musicFadeOutComplete = null;
            }
        } else {
            //-fade in
            AudioManager.instance.resumeMusic();
        }
        AudioManager.instance.fadeMusicVolume(startVolume, endVolume, 0.5, this._musicFadeOutComplete);
    }

}


