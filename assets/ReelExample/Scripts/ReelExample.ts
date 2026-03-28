import { _decorator, Component, game, macro, Node, randomRangeInt, v2 } from 'cc';
import { IconExample } from './IconExample';
import { RunTimeData } from './DataSetting/RunTimeData';
import { ReelSettingData } from './DataSetting/ReelSettingData';
import { GameModeExample } from './DataSetting/ControllerSettingData';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import { SymbolEventType } from './DataSetting/SymbolEvent';
import { LayoutType, ReelBounceConfig, StopType, SymbolNumber, UniReel } from '../../Scripts/ModuleEntry';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('ReelExample')
@executeInEditMode()
export class ReelExample extends UniReel<SymbolNumber, IconExample> {
    @property(ReelBounceConfig)
    private bounceConfig: ReelBounceConfig = null;

    public override moveInterval: number;

    protected _currentRandomData: SymbolNumber[] = [];
    private reelSettingData: ReelSettingData = null;

    public init(reelID: number): void {
        this.reelSettingData = RunTimeData.instance.reelData;
        this._iconAmount = this.reelSettingData.iconAmount;

        this.layoutType = this.reelSettingData.layoutType;
        this.inverseDirection = this.reelSettingData.inverseDirection;
        this.iconSize = v2(this.reelSettingData.iconSize.x, this.reelSettingData.iconSize.y);
        this.iconSpacing = this.reelSettingData.iconSpacing;

        super.init(reelID);
        this.onStartRoll = this.upBouncing;
        this.onStopRoll = this.setIconBlur.bind(this, false);
    }

    public getResultIconList(): IconExample[] {
        return this.iconList.slice(1, this.iconList.length - 1);
    }

    update(): void {
        if (EDITOR_NOT_IN_PREVIEW) {
            this.initLayout();
            this.reelSettingData = RunTimeData.instance.reelData;

            if (this.reelSettingData) {
                this.layoutType = this.reelSettingData.layoutType;
                this.inverseDirection = this.reelSettingData.inverseDirection;
                this.iconSize = v2(this.reelSettingData.iconSize.x, this.reelSettingData.iconSize.y);
                this.iconSpacing = this.reelSettingData.iconSpacing;
            }
        }

        if (this.reelSettingData) {
            this.bounceConfig.startBounce = this.reelSettingData.startBounce;
            this.bounceConfig.endBounce = this.reelSettingData.endBounce;
            this.bounceConfig.useRealCurve = this.reelSettingData.useRealCurve;
            this.bounceConfig.downBounceEasing = this.reelSettingData.downBounceEasing;
            this.bounceConfig.downBounceRealCurve = this.reelSettingData.downBounceRealCurve;
            this.bounceConfig.downBounceDuration = this.reelSettingData.downBounceDuration;
            this.bounceConfig.upBounceEasing = this.reelSettingData.upBounceEasing;
            this.bounceConfig.upBounceRealCurve = this.reelSettingData.upBounceRealCurve;
            this.bounceConfig.upBounceDuration = this.reelSettingData.upBounceDuration;
            this.bounceConfig.bounceDis = this.reelSettingData.bounceDis;

            this.moveInterval = RunTimeData.instance.controllerData.gameMode === GameModeExample.NG ?
                this.reelSettingData.ngMoveInterval : this.reelSettingData.fgMoveInterval;
        }
    }

    public override  startRoll(): void {
        this.reset();
        this.setIconBlur(true);
        super.startRoll();
    }

    private setIconBlur(isBlur: boolean): void {
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.setIsBlur(isBlur);
        }
    }

    public setData(symbolData: SymbolNumber[], randomDataLength: number): void {
        let randomData: SymbolNumber[] = [];

        for (let index = 0; index < randomDataLength; index++) { //為了間隔停止，根據randomDataLength生成隨機資料
            const symbol = this.createRandomSymbol();
            randomData.push(symbol);
        }

        let resultData: SymbolNumber[] = [this.createRandomSymbol(), ...symbolData, ...randomData];

        for (let index = resultData.length - 1; index >= 0; index--) {
            const symbol = resultData[index];
            this.data.enqueue(symbol);
        }
    }

    public override async stopRollAsync(stopType: StopType): Promise<void> {
        await super.stopRollAsync(stopType);

        if (this.bounceConfig.endBounce) {
            await this.bouncingAsync(this.bounceConfig.bounceDis, true);
            this.onBounceMax();
            await this.bouncingAsync(this.bounceConfig.bounceDis, false);
        }

        this.onRollEnd();
    }

    public upBouncing(): void {
        if (this.bounceConfig.startBounce) {
            this.resetMovements();
            this.bouncingAsync(this.bounceConfig.bounceDis, false);
            this.bouncingAsync(this.bounceConfig.bounceDis, true);
        }
    }

    private bouncingAsync(dis: number, isDown: boolean): Promise<void> {
        return new Promise<void>((resolve) => {
            let easing = isDown ? this.bounceConfig.downBounceEasing : this.bounceConfig.upBounceEasing;
            let duration = isDown ? this.bounceConfig.downBounceDuration : this.bounceConfig.upBounceDuration;
            let realCurve = this.bounceConfig.useRealCurve ? (isDown ? this.bounceConfig.downBounceRealCurve : this.bounceConfig.upBounceRealCurve) : null;

            let moveDir = this.moveDir.multiplyScalar(dis);

            if (!isDown) {
                moveDir = moveDir.negative();
            }

            for (let i = 0; i < this._iconList.length; ++i) {
                this._iconList[i].moveBy(moveDir, duration, easing, realCurve);
            }

            this._iconList[0].addCallback(() => resolve());
        });
    }

    private onBounceMax(): void {
        this.onSymbolEvent(SymbolEventType.OnBounceMax);
    }

    private onRollEnd(): void {
        this.onSymbolEvent(SymbolEventType.RollEnd);
    }

    public onSymbolEvent(symbolEvent: SymbolEventType): void {
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];

            const symbolID = icon.symbol.symbolID;
            let symbolData = this.reelSettingData.symbolDataList[symbolID];
            let event = symbolData.eventList.find((event) => event.eventType === symbolEvent);

            if (event) {
                icon.playAnim(event.animName);

                if (symbolEvent === SymbolEventType.ReadyHand) {
                    icon.setBrightness(false);
                }
            }
        }
    }

    public stopPlayWin(): void {
        for (let index = 0; index < this.iconList.length; index++) {
            this.iconList[index].stopPlayWin();
        }
    }

    public clearRandomData(): void {
        while (this.data.count > this.iconAmount + 1) { //把隨機資料直接移除直到剩餘伺服器資料
            let symbol = this.data.dequeue();
            this.destroySymbol(symbol);
        }
    }

    public setIconBrightness(isDark: boolean): void {
        for (let index = 0; index < this._iconList.length; index++) {
            this._iconList[index].setBrightness(isDark);
        }
    }

    public showReadyHand(duration: number): void {
        let readyHandRealCurve = this.reelSettingData.readyHandRealCurve;
        let startTime = game.totalTime;
        let durationMs = duration * 1000;

        let callback = () => {
            let progress = (game.totalTime - startTime) / durationMs;

            for (let index = 0; index < this.iconList.length; index++) {
                const icon = this.iconList[index];
                icon.timeScale = readyHandRealCurve.evaluate(progress);
            }

            if (progress >= 1) {
                this.unschedule(callback);
            }
        };

        this.schedule(callback, 0, macro.REPEAT_FOREVER);
    }

    protected generateRandomIconData(): SymbolNumber[] {
        let resultSymbols: SymbolNumber[] = [];

        for (let index = 0; index < this.iconAmount + 2; index++) {
            let symbolID: number = randomRangeInt(0, this.reelSettingData.symbolDataList.length);
            let symbol = SymbolNumber.pool.instance();
            symbol.symbolID = symbolID;
            resultSymbols.push(symbol);
        }

        return resultSymbols;
    }

    protected override initIconSymbol(): void {
        let data = this.generateRandomIconData();

        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.symbol = data[index];
        }
    }

    private reset(): void {
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.timeScale = 1;
            icon.setBrightness(false);
        }
    }

    private onLayoutChange(layoutType: LayoutType): void {
        if (layoutType === LayoutType.Vertical) {

        }
        else {

        }
    }

    protected createRandomSymbol(): SymbolNumber {
        if (this._currentRandomData.length <= 0) {
            this._currentRandomData = this.generateRandomIconData();
        }

        return this._currentRandomData.pop();
    }

    protected destroySymbol(symbol: SymbolNumber): void {
        SymbolNumber.pool.destroy(symbol);
    }
}


