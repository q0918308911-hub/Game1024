import { _decorator, CCFloat, instantiate, log, macro, Node } from 'cc';
import { SlotMachineViewBase } from '../../Scripts/SlotMachineViewBase';
import { ReelEvent, ReelRoundState } from '../../Scripts/Model/ReelData';
import { GameIcon } from '../../Scripts/GameIcon';
import { GameReel } from './GameReel';
import { ComponentExt, Debug } from 'db://assets/Scripts/Utils/Core';

const { ccclass, property } = _decorator;

const TIMER_UNIT = 0.1;

/**
 * 負責一局的滾輪表演
 */
@ccclass('ReelView')
export class ReelView extends SlotMachineViewBase {
    @property({ type: Node, visible: true, tooltip: '滾輪列表' })
    protected _reelNodeList: Node[] = [];

    @property({ type: CCFloat, visible: true, tooltip: '正常模式滾動時間，單位:秒', min: 0 })
    protected _normalRollTime: number = 0.5;

    @property({ type: CCFloat, visible: true, tooltip: '快速模式滾動時間，單位:秒', min: 0 })
    protected _fastRollTime: number = 0.2;

    @property({ type: CCFloat, visible: true, tooltip: '滾輪停下相隔的時間，單位:秒', min: 0 })
    protected _stopSpaceTime: number = 0.2;

    @property({ type: CCFloat, visible: true, tooltip: '滾輪聽牌停下相隔的時間，如果聽牌會取代stopSpaceTime，單位:秒', min: 0 })
    protected _readyHandRollTime: number = 1;

    public isFastModeCallback: () => boolean = null;

    public showReadyHandCallback: (reelId: number) => void = null;
    public hideReadyHandCallback: (reelId: number) => void = null;

    public getIconDataCallback: (reelID: number) => number[] = null;
    public getNextRoundDataCallback: (reelID: number) => number[] = null;

    public oneReelRollEndCallback: (reelID: number) => void = null;
    public allReelRollEndCallback: Function = null;

    protected _reels: GameReel[] = [];

    public get reelAmount(): number {
        return this._reels.length;
    }

    protected _prepareIconList: GameIcon[][] = [];
    protected _resultIconList: GameIcon[][] = [];

    protected _reelStateList: ReelRoundState[] = []; // 紀錄滾輪目前的狀態

    public get reelStateList(): ReelRoundState[] {
        return this._reelStateList;
    }

    protected _startPullIconSymbols: number[] = [];

    protected _currentRollingReelIDs: number[] = []; //紀錄當前滾動的滾輪ID

    protected _comingStopReelIndex: number = 0; //紀錄當前要停下的滾輪在currentRollingReelIDs中的索引

    protected _currentStopReelID: number = 0; //紀錄當前停下的滾輪ID

    protected _reelIsStopList: boolean[] = []; // 呼叫滾輪停下

    protected _reelIsReadyHandList: boolean[] = []; //紀錄滾輪是否進入ReadyHand的狀態

    protected _timing: number = 0;

    protected _isReceiveData: boolean = false;

    protected _nextResultData: number[][] = [];

    protected _currentReadyHandReelID: number = 99; //>=_currentReadyHandReelID的滾輪代表有ReadyHand

    public set currentReadyHandReelID(value: number) {
        if (value < this.reelAmount) {
            this._currentReadyHandReelID = value;
        }
    }

    public init(): void {
        this._reels = ComponentExt.getComps<GameReel>(this._reelNodeList, 'GameReel');
        this._reelIsStopList = Array.from({ length: this.reelAmount }, () => false);
        this._reelStateList = Array.from({ length: this.reelAmount }, () => ReelRoundState.Unknown);
        this._prepareIconList = Array.from({ length: this.reelAmount }, () => []);
        this._resultIconList = Array.from({ length: this.reelAmount }, () => []);
        this._reelIsReadyHandList = Array.from({ length: this.reelAmount }, () => false);
        this._nextResultData = Array.from({ length: this.reelAmount }, () => []);

        this.createIcon();
        this.initReel();
        this.initIcon();

        this._currentRollingReelIDs = this._reels.map((reel) => reel.reelID);
        let initIsDone: boolean = this._reelStateList.every((reelState) => reelState === ReelRoundState.Init);

        if (initIsDone) {
            Debug.Log('ReelView init done');
        }
        else {
            Debug.LogError('ReelView init fail');
        }
    }

    public override startRoll(reelIDs: number[] = this._reels.map((reel) => reel.reelID)): void {
        this.reset();

        this._currentRollingReelIDs = reelIDs;

        this.scheduleOnce(() => { //延遲一禎，確保全部滾輪一起tween
            for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
                let reelID = this._currentRollingReelIDs[index];
                this._reelStateList[reelID] = ReelRoundState.FirstRoll;
                this._reels[reelID].startOneRoundRoll();
            }

            this.startTimer();
        }, 0);
    }

    /**
     * 只是呼叫滾輪暫停，並不是直接停下
     */
    public override stopRoll(): void {
        this._isReceiveData = true;
    }

    public fastStopRoll(): void {
        this.stopAllTimer(); // 因為按下暫停會立即執行StopRoll，但正常停止的間隔時間會持續跑到callback，導致有可能會跑StopRoll兩次
        this.stopAllReelRoll();
    }

    public initIconSymbol(iconSymbolData: number[][]): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            this.changeIconSymbol(reelID, iconSymbolData[reelID], true);
        }
    }

    /**
     * 最一開始沒有上一局，所以拉條icon顯示的symbol要自己設定
     * @param startPullData 滾輪開始拉條顯示的symbol
     */
    public initStartPullSymbol(startPullData: number[]): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            this._startPullIconSymbols[reelID] = startPullData[reelID];
        }
    }

    public getIconAmount(reelID: number): number {
        let iconAmount: number = this._iconPrefabList[reelID].count;
        return iconAmount;
    }

    /**
     * 設置icon明亮度
     * @param reelID 滾輪ID
     * @param isDark true為暗，false為亮
     * @param iconIndex 指定要變更的icon，不傳入代表全部
     */
    public setIconBrightness(reelID: number, isDark: boolean, iconIndex?: number[]): void {
        let reelIconList: GameIcon[] = this._resultIconList[reelID];

        if (iconIndex) {
            for (let i = 0; i < iconIndex.length; i++) {
                let index: number = iconIndex[i];
                reelIconList[index].setBrightness(isDark);
            }
        }
        else {
            let prepareIconList: GameIcon[] = this._prepareIconList[reelID];
            let resultIconList: GameIcon[] = this._resultIconList[reelID];

            for (let index = 0; index < this._iconPrefabList[reelID].count; index++) {
                resultIconList[index].setBrightness(isDark);
                prepareIconList[index].setBrightness(isDark);
            }

            this._reels[reelID].startPullIcon.setBrightness(isDark);
            this._reels[reelID].endBounceIcon.setBrightness(isDark);
        }
    }

    protected override createIcon(): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            const iconInReelAmount = this._iconPrefabList[reelID].count * 2;
            this._iconPrefabList[reelID].createInstance(this._reels[reelID].rootNode, iconInReelAmount);
        }
    }

    protected createShowIcon(reelID: number): Node[] {
        let showIcons: Node[] = [];

        for (let index = 0; index < 2; index++) { //生成專門負責表演回拉跟回彈的icon
            let icon: Node = instantiate(this._iconPrefabList[reelID].prefab);
            icon.setParent(this._reels[reelID].rootNode);
            showIcons.push(icon);
        }

        return showIcons;
    }

    protected initReel(): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            let showIcons = this.createShowIcon(reelID);
            this._reels[reelID].onReelEvent = this.receiveReelEvent.bind(this);
            this._reels[reelID].init(reelID, this._iconPrefabList[reelID].nodeList, true, showIcons);
            this._prepareIconList[reelID] = ComponentExt.getComps<GameIcon>(this._reels[reelID].prepareIconList, 'GameIcon');
            this._resultIconList[reelID] = ComponentExt.getComps<GameIcon>(this._reels[reelID].resultIconList, 'GameIcon');
        }
    }

    protected initIcon(): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            for (let index = 0; index < this._iconPrefabList[reelID].count; index++) {
                this._prepareIconList[reelID][index].init();
                this._resultIconList[reelID][index].init();
            }
        }
    }

    protected reelHaveReadyHand(reelID: number): boolean {
        let isReadyHand = reelID >= this._currentReadyHandReelID;
        return isReadyHand;
    }

    /**
     * 狀態改變事件，可以在這裡做狀態的判斷
     * @param reelID 滾輪ID 
     * @param reelEvent 單輪滾的狀態
     * @returns 
     */
    protected receiveReelEvent(reelID: number, reelEvent: ReelEvent): void {
        if (reelEvent === ReelEvent.Init) {
            this._reelStateList[reelID] = ReelRoundState.Init;
            //Debug.Log(`第${reelID}滾輪: 初始化完成`);
        }
        else if (reelEvent === ReelEvent.Start) {
            this.reelOneRoundStart(reelID);
        }
        else if (reelEvent === ReelEvent.Update) {

        }
        else if (reelEvent === ReelEvent.End) {
            this.reelOneRoundEnd(reelID);
        }
    }

    protected reelOneRoundStart(reelID: number) {
        this.changePrepareIconSymbol(reelID);
        this.checkShowReadyHand(reelID);

        if (this._reelStateList[reelID] === ReelRoundState.FirstRoll) {
            this._reels[reelID].rollSetting(this._reelStateList[reelID]);
        }
        else if (this._reelStateList[reelID] === ReelRoundState.FinalRoll) {
            this._nextResultData[reelID] = this.getNextRoundDataCallback(reelID);
            let bounceIconPos: number = this.getIconAmount(reelID) - 1;
            let bounceIconData: number = this._nextResultData[reelID][bounceIconPos];
            this._reels[reelID].rollSetting(this._reelStateList[reelID], bounceIconData);

            this._startPullIconSymbols[reelID] = this._resultIconList[reelID][0].iconData.symbolID;

            this.checkStopNextReel();
        }
    }

    protected reelOneRoundEnd(reelID: number) {
        this._startPullIconSymbols[reelID] = this._resultIconList[reelID][0].iconData.symbolID;
        this._reels[reelID].startPullIcon.updateSymbol(this._startPullIconSymbols[reelID]);

        let symbolData: number[] = this._prepareIconList[reelID].map((icon) => icon.iconData.symbolID);
        this.changeIconSymbol(reelID, symbolData, true);

        if (this._reelStateList[reelID] === ReelRoundState.FinalRoll) {
            this.oneReelRollEnd(reelID);
            this.checkAllReelRollEnd();
        }
        else {
            if (this._reelIsStopList[reelID]) {
                this._reelStateList[reelID] = ReelRoundState.FinalRoll;
            }
            else {
                this._reelStateList[reelID] = ReelRoundState.Rolling;
            }

            this._reels[reelID].startOneRoundRoll();
        }
    }

    /**
     * 預設是從聽牌滾輪開始聽到最後輪，如果要更改條件可以在reelHaveReadyHand這個function裡面修改
     * @param reelID 滾輪ID
     */
    protected checkShowReadyHand(reelID: number): void {
        if (!this._reelIsReadyHandList[reelID]) {
            if (!this.isStopAllReel()) {
                let haveReadyHand: boolean = this.reelHaveReadyHand(reelID);
                let checkPreviousReelIsRollEnd = reelID === 0 ? true : this._reelStateList[reelID - 1] === ReelRoundState.RollEnd; // 0是第一輪，所以不用檢查上一輪
                let canShowReadyHand: boolean = haveReadyHand && checkPreviousReelIsRollEnd;

                if (canShowReadyHand) {
                    this.showReadyHandCallback?.(reelID);
                    this._reelIsReadyHandList[reelID] = true;
                }
            }
        }
    }

    protected checkHideReadyHand(reelID: number): void {
        if (this._reelIsReadyHandList[reelID]) {
            this.hideReadyHandCallback?.(reelID);
            this._reelIsReadyHandList[reelID] = false;
        }
    }

    protected oneReelRollEnd(reelID: number): void {
        let nextRoundData = this._nextResultData[reelID]; // 因為回彈會看到下一輪的資料，所以先把prepareIcon的symbol換成下一輪
        this.changeIconSymbol(reelID, nextRoundData, false);

        this.checkHideReadyHand(reelID);

        this._reelStateList[reelID] = ReelRoundState.RollEnd;

        this.oneReelRollEndCallback?.(reelID);
    }

    protected checkStopNextReel(): void {
        if (!this.isStopAllReel()) {
            this._comingStopReelIndex++; // 下一輪開始停止
            let reelID: number = this._currentRollingReelIDs?.[this._comingStopReelIndex];

            if (reelID !== undefined) {
                this._currentStopReelID = reelID;
                this.startDelayTimer();
            }
        }
    }

    protected checkAllReelRollEnd(): void {
        let _currentReelStateList = this.reelStateList.map((reelState, index) => {
            if (this._currentRollingReelIDs.includes(index)) {
                return reelState;
            }
            else {
                return null;
            }
        });

        _currentReelStateList = _currentReelStateList.filter((reelState) => reelState !== null);
        let isAllReelRollEnd: boolean = _currentReelStateList.every((reelState) => reelState === ReelRoundState.RollEnd);

        if (isAllReelRollEnd) {
            this.allReelRollEnd();
        }
    }

    protected allReelRollEnd(): void {
        this.allReelRollEndCallback?.();
    }

    protected changePrepareIconSymbol(reelID: number): void {
        if (this._nextResultData[reelID].length > 0) { // 如果有下一輪的資料，代表他在上一輪結束的時候就已經更換了，不用再跟controller要資料
            this._nextResultData[reelID].length = 0;
        }
        else {
            let symbolData: number[] = this.getIconDataCallback(reelID);
            this.changeIconSymbol(reelID, symbolData, false);
        }
    }

    protected changeIconSymbol(reelID: number, symbolData: number[], isChangeResultIcon: boolean): void {
        let allIconList = isChangeResultIcon ? this._resultIconList : this._prepareIconList;
        let reelIconList = allIconList[reelID];

        for (let index = 0; index < reelIconList.length; index++) {
            reelIconList[index].updateSymbol(symbolData[index]);
        }
    }

    protected reset(): void {
        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID = this._currentRollingReelIDs[index];
            this._reelIsStopList[reelID] = false;
            this._reelIsReadyHandList[reelID] = false;
        }

        this._currentReadyHandReelID = 99;
        this._isReceiveData = false;
        this._currentStopReelID = 0;
    }

    protected isStopAllReel(): boolean {
        let isStop: boolean = this.isFastModeCallback() || this.checkFloatIsZero(this._stopSpaceTime);
        return isStop;
    }

    protected checkDelayStopReelRoll(): void {
        this._timing += TIMER_UNIT;
        let isStopAllReel: boolean = this.isStopAllReel();
        let standardTime: number = isStopAllReel ? this._fastRollTime : this._normalRollTime;
        let isStop: boolean = this._timing >= standardTime && this._isReceiveData;

        if (isStop) {
            if (isStopAllReel) {
                this.stopAllReelRoll();
            }
            else {
                this._comingStopReelIndex = 0;
                this._currentStopReelID = this._currentRollingReelIDs[this._comingStopReelIndex];
                this.startDelayTimer(); // 第一輪開始停止
            }

            this.unschedule(this.checkDelayStopReelRoll);
            this._timing = 0;
        }
    }

    protected stopAllReelRoll(): void {
        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID: number = this._currentRollingReelIDs[index];
            this._reelIsStopList[reelID] = true;
        }
    }

    protected delayStopRoll(): void {
        this._reelIsStopList[this._currentStopReelID] = true;
        this.unschedule(this.delayStopRoll);
    }

    /**
     * 開始滾動的計時器
     */
    protected startTimer(): void {
        this.schedule(this.checkDelayStopReelRoll, TIMER_UNIT, macro.REPEAT_FOREVER);
    }

    /**
    * 呼叫延遲停止的計時器
    * @param reelID 滾輪ID
    */
    protected startDelayTimer(): void {
        let haveReadyHand: boolean = this.reelHaveReadyHand(this._currentStopReelID);
        let reelStopSpaceTime: number = this._comingStopReelIndex === 0 ? 0 : this._stopSpaceTime; //第一輪如果沒有聽牌的話就不用延遲
        let finalStopSpaceTime: number = haveReadyHand ? this._readyHandRollTime : reelStopSpaceTime;

        this.scheduleOnce(this.delayStopRoll, finalStopSpaceTime);
    }

    protected stopAllTimer(): void {
        this.unschedule(this.checkDelayStopReelRoll);
        this.unschedule(this.delayStopRoll);
    }

    protected checkFloatIsZero(floatValue: number): boolean {
        return Math.abs(floatValue) < 0.0001;
    }
}