import { _decorator, CCString, Component, director } from 'cc';
import { BetData } from '../Networks/BetData';
import { SlotRelayLang, GameSetting } from '../Definition';
import { NetworkEvent, NetworkHandler, PlayerInfo } from '../Networks';
import { ConditionLine, GenericUIManager, MessageBox, NewFlashModeEnum } from '../GenericUI/Scripts';
import { AnimationTimeScaleTuner, GameTimeScale, SpineTimeScaleTuner } from '../TimeScale';
import { ConditionLineData, ConditionType } from '../../GameScripts/GenericUI/Scripts';
import { AdditionalPurchaseType } from '../../NetAgent/CConnectManager/CConnectDefine';
import { Localization } from '../Localization';
import { ErrorCode, MessageReplaceFlag } from '../../ErrorHandler/ErrorHandleDefine';
import { ErrorHandler } from '../../ErrorHandler/ErrorHandler';
import { Utility, Debug } from "../../Utils/Core";

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    public betValue: number = -1; // 下注金額，初始先設定為-1，要設定下注額度列表後才能決定
    public finalBalance: number = 0;
    public balanceAfterSpin: number = 0; // 下注後得分前的餘額
    protected gameNumber: number = 0;
    protected isOnline: boolean = true;


    @property(CCString)
    protected playerToken: string = "TestPlayer001"

    protected conditionAreaIndex: number = 1;

    public onReceiveBetCallback: (betData: BetData) => void = null;
    public forceChangeLanguage: (langKey: SlotRelayLang) => void = null;

    protected autoSpinAreasCustomData: any[] = [];
    protected checkAutoNextData: any = {};

    public init(gameNumber: number, isOnline: boolean) {
        this.gameNumber = gameNumber;
        this.isOnline = isOnline;
        this.betValue = PlayerInfo.betValueList[0];
        GenericUIManager.instance.setBetValue(this.betValue)
        NetworkHandler.instance.addEventListener(NetworkEvent.Bet, this.onReceiveBet.bind(this));
        NetworkHandler.instance.addEventListener(NetworkEvent.SpinFail, this.onSpinFail.bind(this));
        GameTimeScale.onTimeScaleChangeCallback = this.onTimeScaleChange.bind(this);
        GenericUIManager.instance.onSetMainUIToSpinModeCallback = this.onSetMainUIToSpinMode.bind(this);
        GenericUIManager.instance.onSetMainUIToNormalModeCallback = this.onSetMainUIToNormalMode.bind(this);
        GenericUIManager.instance.setTwoLevelTurboMode(true);

        if (this.isOnline) {
            if (!NetworkHandler.instance.isLogin) {
                GenericUIManager.instance.setBottomText("H5Post");
            }
        }
        else {
            GenericUIManager.instance.setBottomText("Offline Mode");
        }

    }

    public onUpdateBetValue(betValue: number) {
        this.betValue = betValue;
    }

    public onStartSpin() {

    }

    public onStartAuto(autoTimes: number) {
        this.getAutoSpinAreasCustomData();
        this.setStartAutoSpinInitData();
    }

    protected getAutoSpinAreasCustomData(): void {
        this.autoSpinAreasCustomData = GenericUIManager.instance.getAutoSpinAreasCustomData();
    }

    protected setStartAutoSpinInitData(): void {
        // 設置第一次檢查 auto spin 的資料，需要時可覆寫
        this.checkAutoNextData = {
            balance: PlayerInfo.balance,
        };
    }

    /**
     * 啟用某一個條件時檢查條件是否符合規範
     * @returns 
     */
    public checkConditionValid(conditionLine: ConditionLine): boolean {
        this.setStartAutoSpinInitData();
        if (conditionLine.isMeetsStopCondition(this.checkAutoNextData)) {
            const conditionLineData = conditionLine.getConditionLineData();
            if (conditionLineData.conditionType === ConditionType.LessThan && conditionLineData.targetAttributeKey === 'balance') {
                this.showBalanceLessThanThresholdMessage();
            } else if (conditionLineData.conditionType === ConditionType.GreaterThan && conditionLineData.targetAttributeKey === 'balance') {
                this.showThresholdMustGreaterThanBalanceMessage();
            }
            return false;
        }
        return true;
    }

    /**
     * 開啟 auto UI 時的事件處理
     */
    public onShowAutoUI(): void {
        this.getAutoSpinAreasCustomData();
        const conditionAreasData: ConditionLineData[] = this.autoSpinAreasCustomData[this.conditionAreaIndex];

        if (conditionAreasData && Array.isArray(conditionAreasData)) {
            // // 取得 "餘額大於" 條件資訊
            // const shouldCloseConditionIndexes: number[] = [];
            // let greaterThanBalanceCondition: ConditionLineData | null = null;
            // const greaterThanBalanceConditionIndex = conditionAreasData.findIndex((data) =>
            //     data?.enable
            //     && data?.conditionType === ConditionType.GreaterThan
            //     && data?.targetAttributeKey === 'balance'
            // );
            // if (greaterThanBalanceConditionIndex > -1) {
            //     greaterThanBalanceCondition = conditionAreasData[greaterThanBalanceConditionIndex];
            // }

            // // 取得 "餘額小於" 條件資訊
            // let lessThanBalanceCondition: ConditionLineData | null = null;
            // const lessThanBalanceConditionIndex = conditionAreasData.findIndex((data) =>
            //     data?.enable
            //     && data?.conditionType === ConditionType.LessThan
            //     && data?.targetAttributeKey === 'balance'
            // );
            // if (lessThanBalanceConditionIndex > -1) {
            //     lessThanBalanceCondition = conditionAreasData[lessThanBalanceConditionIndex];
            // }

            // if (lessThanBalanceCondition && onShowAutoUIPlayerData.balance < (lessThanBalanceCondition.threshold as number)) {
            //     shouldCloseConditionIndexes.push(lessThanBalanceConditionIndex);
            // } else if (greaterThanBalanceCondition && onShowAutoUIPlayerData.balance > (greaterThanBalanceCondition.threshold as number)) {
            //     shouldCloseConditionIndexes.push(greaterThanBalanceConditionIndex);
            // }

            // 取消勾選所有所有選項
            const shouldCloseConditionIndexes: number[] = Array.from({ length: conditionAreasData.length }, (_, index) => index);
            GenericUIManager.instance.disableAutoSpinConditions(this.conditionAreaIndex, shouldCloseConditionIndexes);
        }
    }

    /**
     * 回傳開啟 auto UI 時有哪些資料要交給停止設定區塊判斷是否取消勾選
     * @returns 
     */
    protected getDataOnShowAutoUI(): any {
        return {
            balance: PlayerInfo.balance,
        };
    }

    public sendBet(bet: number, additionalPurchaseType: AdditionalPurchaseType = AdditionalPurchaseType.None) {
        NetworkHandler.instance.send(NetworkEvent.Bet, this.gameNumber, bet, PlayerInfo.balance, additionalPurchaseType, this.playerToken);
    }

    public onReceiveBet(betData: BetData) {
        this.finalBalance = betData.coin;
        // 下注後得分前的餘額 先計算為balance減掉下注金額，如果還有購買FG等機制要重新計算
        this.balanceAfterSpin = PlayerInfo.balance - betData.bet;
        PlayerInfo.balance = this.finalBalance;

        if (this.isOnline) {
            let debugText = `${betData.spinId}`;
            if (NetworkHandler.instance.demo !== true) {
                GenericUIManager.instance.setBottomText(debugText);
            }
        }

        this.onReceiveBetCallback?.(betData);
    }


    public onSpinFail(spinId: string) {
        // 下注失敗時紀錄單號
        GenericUIManager.instance.setBottomText(spinId);
    }

    protected checkBalanceEnough(): boolean {
        if (PlayerInfo.balance < this.betValue) {
            this.showBankruptcyError();
            return false;
        }
        return true;
    }

    protected showBankruptcyError() {
        ErrorHandler.Instance.TriggerError(ErrorCode.Client_BetBankruptcy, true);
    }

    protected showBalanceLessThanThresholdMessage() {
        // "餘額小於設定值"
        const title = Localization.instance.t('ErrorTitle.Default_Title');
        let content = Localization.instance.t('AutoSpinMessage.Balance_Less_Than_Threshold');
        content = content.replace(MessageReplaceFlag, '');
        MessageBox.instance.showMsgBox(title, content, true);
    }

    protected showThresholdMustGreaterThanBalanceMessage() {
        // "設定值需大於餘額"
        const title = Localization.instance.t('ErrorTitle.Default_Title');
        let content = Localization.instance.t('AutoSpinMessage.Threshold_Must_GreaterThan_Balance');
        content = content.replace(MessageReplaceFlag, '');
        MessageBox.instance.showMsgBox(title, content, true);
    }

    public setupBeforeGame() {
        // 繼承之後可以複寫此方法，自定義出現Continue按鈕前的遊戲初始化
        // 這個Promise完成後才會出現Continue按鈕
        return Promise.resolve();
    }

    public getLastPlantData(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 取得一開始的卡片資料
            this.fetchLastPlantData()
                .then((base64Data: string) => {
                    // 取得初始盤面
                    this.onReceiveLastPlantData(base64Data);
                    resolve();
                })
                .catch((error) => {
                    Debug.LogError(`取得初始盤面失敗: ${error}`);
                    resolve();
                });
        });
    }

    protected onReceiveLastPlantData(base64Data: string) {
        // 繼承後可以覆寫此方法，實作取得初始盤面後的邏輯
        // 例如把盤面資料傳給GameLogic

    }

    protected onTimeScaleChange() {
        // 當遊戲時間縮放改變時，可以在這裡做一些處理
        // 例如更新UI或是其他需要根據時間縮放調整的邏輯
        let items = director.getScene().getComponentsInChildren(SpineTimeScaleTuner);
        for (let item of items) {
            item.tuneAnimationByTimeScale();
        }

        let animationsItems = director.getScene().getComponentsInChildren(AnimationTimeScaleTuner);
        for (let item of animationsItems) {
            item.tuneAnimationByTimeScale();
        }
    }

    protected onSetMainUIToSpinMode() {
        // 當主UI進入Spin模式時，可以在這裡做一些處理

        // 當遊戲開始時，關閉Timeout計時器
        NetworkHandler.instance.setTimeoutTimerFlag(false);
    }

    protected onSetMainUIToNormalMode() {
        // 當主UI回到Normal模式時，可以在這裡做一些處理

        // 當遊戲結束時，開啟Timeout計時器
        NetworkHandler.instance.setTimeoutTimerFlag(true);
    }

    public onNewFlashBtnSwitch(mode: NewFlashModeEnum) {

    }

    public get langEnum(): SlotRelayLang {
        return GameSetting.gameLang;
    }

    private fetchLastPlantData(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (NetworkHandler.instance.isLogin) {
                let base64Data = Utility.uint8ArrayToBase64(PlayerInfo.lastPlant);
                resolve(base64Data);
            }
            else {
                NetworkHandler.instance.sendGameLoginFetch(this.playerToken, this.gameNumber)
                    .then((base64Data: string) => {
                        resolve(base64Data);
                    });
            }
        });
    }

    public onContinueBtnClick(): void {
        // 繼承後可以覆寫此方法，實作點擊繼續按鈕後的邏輯
        // 例如Start 頁面按下進入後要發出語音
    }
}


