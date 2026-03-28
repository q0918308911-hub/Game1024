import { _decorator, CCFloat, game, instantiate, macro, Node } from 'cc';
import { GameIcon } from './GameIcon';
import { ReelEvent, ReelRoundState } from './Model/ReelData';
import { SlotMachineViewBase } from './SlotMachineViewBase';
import { IconReel } from './IconReel';
import { ComponentExt, Debug } from 'db://assets/Scripts/Utils/Core';

const { ccclass, property } = _decorator;

/**
 * 負責一局的滾輪表演
 */
@ccclass('IconReelView')
export class IconReelView extends SlotMachineViewBase {
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

    protected _reels: IconReel[] = [];

    public get reelAmount(): number {
        return this._reels.length;
    }

    protected _prepareIconList: GameIcon[] = [];
    protected _resultIconList: GameIcon[][] = [];

    protected _reelStateList: ReelRoundState[] = []; // 紀錄滾輪目前的狀態

    public get reelStateList(): ReelRoundState[] {
        return this._reelStateList;
    }

    protected _startPullIconSymbols: number[] = [];

    protected _currentRollingReelIDs: number[] = []; //紀錄當前滾動的滾輪ID

    public get currentRollingReelIDs(): number[] {
        return this._currentRollingReelIDs;
    }

    protected _comingStopReelIndex: number = 0; //紀錄當前要停下的滾輪在currentRollingReelIDs中的索引

    protected _currentStopReelID: number = 0; //紀錄當前停下的滾輪ID

    protected _reelIsStopList: boolean[] = []; // 呼叫滾輪停下

    protected _reelIsReadyHandList: boolean[] = []; //紀錄滾輪是否進入ReadyHand的狀態

    protected _isReceiveData: boolean = false;

    protected _randomSymbolData: number[][] = []; //隨機盤面

    protected _finalResultData: number[][] = []; //最終盤面

    protected _nextResultData: number[][] = []; //下一輪盤面，為了回彈

    protected _currentReadyHandReelID: number = 99; //>=_currentReadyHandReelID的滾輪代表有ReadyHand

    public set currentReadyHandReelID(value: number) {
        if (value < this.reelAmount) {
            this._currentReadyHandReelID = value;
        }
    }

    public init(): void {
        this._reels = ComponentExt.getComps<IconReel>(this._reelNodeList, 'IconReel');
        this._reelIsStopList = Array.from({ length: this.reelAmount }, () => false);
        this._reelStateList = Array.from({ length: this.reelAmount }, () => ReelRoundState.Unknown);
        this._resultIconList = Array.from({ length: this.reelAmount }, () => []);
        this._reelIsReadyHandList = Array.from({ length: this.reelAmount }, () => false);
        this._finalResultData = Array.from({ length: this.reelAmount }, () => []);
        this._randomSymbolData = Array.from({ length: this.reelAmount }, () => []);
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
        this.fastStopAllReel();
    }

    public initIconSymbol(iconSymbolData: number[][]): void {
        for (let reelID = 0; reelID < this._resultIconList.length; reelID++) {
            const iconList = this._resultIconList[reelID];

            for (let index = 0; index < iconList.length; index++) {
                const icon = iconList[index];
                icon.updateSymbol(iconSymbolData[reelID][index]);
            }
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
            for (let index = 0; index < this._iconPrefabList[reelID].count; index++) {
                reelIconList[index].setBrightness(isDark);
            }

            this._reels[reelID].startPullIcon.setBrightness(isDark);
            this._reels[reelID].endBounceIcon.setBrightness(isDark);
        }
    }

    protected override createIcon(): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            const iconInReelAmount = this._iconPrefabList[reelID].count;
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
            this._reels[reelID].init(reelID, this._iconPrefabList[reelID].nodeList, false, showIcons);
            this.updateIconList(reelID);
        }
    }

    protected initIcon(): void {
        for (let reelID = 0; reelID < this._reels.length; reelID++) {
            for (let index = 0; index < this.getIconAmount(reelID); index++) {
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
        else if (reelEvent === ReelEvent.End) {
            this.reelOneRoundEnd(reelID);
        }
    }

    protected reelOneRoundStart(reelID: number): void {
        this.changePrepareIconSymbol(reelID);
        this.checkShowReadyHand(reelID);

        if (this._reelStateList[reelID] === ReelRoundState.FirstRoll) {
            let startPullSymbol = this._startPullIconSymbols[reelID];
            this._reels[reelID].rollSetting(this._reelStateList[reelID], startPullSymbol);
        }
    }

    protected async reelOneRoundEnd(reelID: number): Promise<void> {
        this.updateIconList(reelID);

        if (this.checkReelIsFinalRoll(reelID)) {
            await this.reelStartBounce(reelID);
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

    protected async reelStartBounce(reelID: number): Promise<void> {
        if (this._reels[reelID].gameReelData.endBounce) {
            this._nextResultData[reelID] = this.getNextRoundDataCallback(reelID);
            let length = this._nextResultData[reelID].length;
            let bounceSymbol = this._nextResultData[reelID][length - 1];
            this._prepareIconList[reelID].updateSymbol(bounceSymbol);

            await this._reels[reelID].startBounce();
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
        this.updateIconOriginSiblingIndex(reelID);
        this.checkHideReadyHand(reelID);

        this._reelStateList[reelID] = ReelRoundState.RollEnd;

        this.oneReelRollEndCallback?.(reelID);
    }

    protected updateIconList(reelID: number): void {
        let iconList = ComponentExt.getComps<GameIcon>(this._reels[reelID].iconNodeList, 'GameIcon');
        this._resultIconList[reelID] = iconList.slice(1, iconList.length);
        this._prepareIconList[reelID] = this._reels[reelID].endBounceIcon;
    }

    protected updateIconOriginSiblingIndex(reelID: number): void {
        const iconList = this._resultIconList[reelID];

        for (let index = 0; index < iconList.length; index++) {
            const icon = iconList[index];
            icon.originSiblingIndex = icon.node.getSiblingIndex();
        }
    }

    protected checkReelIsFinalRoll(reelID: number): boolean {
        let isFinalRoll: boolean = this._reelStateList[reelID] === ReelRoundState.FinalRoll;
        let isLastIcon: boolean = this._finalResultData[reelID].length <= 0; //資料全部被取走，那就是最後一輪了

        return isFinalRoll && isLastIcon;
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
        let symbolID = this.getIconSymbolData(reelID);
        let prepareIcon = this._prepareIconList[reelID];
        prepareIcon.updateSymbol(symbolID);
    }

    protected getIconSymbolData(reelID: number): number {
        let symbolData: number[] = [];

        if (this._reelStateList[reelID] === ReelRoundState.FinalRoll) {
            if (this._finalResultData[reelID].length <= 0) { //最後一輪，要拿伺服器的資料
                this._finalResultData[reelID] = this.getIconDataCallback(reelID);
                this._startPullIconSymbols[reelID] = this._resultIconList[reelID][0].iconData.symbolID;
                this.checkStopNextReel();
            }

            symbolData = this._finalResultData[reelID];
        }
        else if (this._nextResultData[reelID].length > 0) {// 如果有下一輪的資料，那就先換
            symbolData = this._nextResultData[reelID];
        }
        else {
            if (this._randomSymbolData[reelID].length <= 0) {
                this._randomSymbolData[reelID] = this.getIconDataCallback(reelID);
            }

            symbolData = this._randomSymbolData[reelID];
        }

        return symbolData.pop();
    }

    protected reset(): void {
        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID = this._currentRollingReelIDs[index];
            this._reelIsStopList[reelID] = false;
            this._reelIsReadyHandList[reelID] = false;
        }

        this._finalResultData = Array.from({ length: this.reelAmount }, () => []);
        this._randomSymbolData = Array.from({ length: this.reelAmount }, () => []);

        this._currentReadyHandReelID = 99;
        this._isReceiveData = false;
        this._currentStopReelID = 0;
    }

    protected isStopAllReel(): boolean {
        let isStop: boolean = this.isFastModeCallback() || this.checkFloatIsZero(this._stopSpaceTime);
        return isStop;
    }

    protected stopReel(): void {
        if (this.isStopAllReel()) {
            this.fastStopAllReel();
        }
        else {
            this._comingStopReelIndex = 0;
            this._currentStopReelID = this._currentRollingReelIDs[this._comingStopReelIndex];
            this.startDelayTimer(); // 第一輪開始停止
        }
    }

    protected fastStopAllReel(): void {
        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID: number = this._currentRollingReelIDs[index];
            this._reelIsStopList[reelID] = true;
        }
    }

    protected stopOneReel(): void {
        this._reelIsStopList[this._currentStopReelID] = true;
    }

    /**
     * 開始滾動的計時器
     */
    protected startTimer(): void {
        let startTime = game.totalTime;
        let standardTime: number = this.isStopAllReel() ? this._fastRollTime : this._normalRollTime;
        standardTime *= 1000;

        let callback = () => {
            let isStop: boolean = (game.totalTime - startTime) >= standardTime && this._isReceiveData;

            if (isStop) {
                this.stopReel();
                this.unschedule(callback);
            }
        }

        this.schedule(callback, 0, macro.REPEAT_FOREVER);
    }

    /**
    * 呼叫延遲停止的計時器
    * @param reelID 滾輪ID
    */
    protected startDelayTimer(): void {
        let haveReadyHand: boolean = this.reelHaveReadyHand(this._currentStopReelID);
        let reelStopSpaceTime: number = this._comingStopReelIndex === 0 ? 0 : this._stopSpaceTime; //第一輪如果沒有聽牌的話就不用延遲
        let finalStopSpaceTime: number = haveReadyHand ? this._readyHandRollTime : reelStopSpaceTime;
        finalStopSpaceTime *= 1000;
        let startTime = game.totalTime;

        let callback = () => {
            let fillTime: boolean = game.totalTime - startTime >= finalStopSpaceTime;

            if (fillTime) {
                this.stopOneReel();
                this.unschedule(callback);
            }
        };

        this.schedule(callback, 0, macro.REPEAT_FOREVER);
    }

    protected checkFloatIsZero(floatValue: number): boolean {
        return Math.abs(floatValue) < 0.0001;
    }
}