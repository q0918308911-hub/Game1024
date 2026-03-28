import { _decorator, CCFloat, Component, Enum, Node, randomRangeInt, RealCurve } from 'cc';
import { SymbolNumber } from '../SymbolNumber';
import { PublicReelConfigTest } from '../../../../v2/Example/Scripts/PublicReelConfigTest';
import { StopType } from '../../../Scripts/UniReel';
import { ReelBounceConfig } from '../ReelBounceConfig';
import { UniDropIconExample } from './UniDropIconExample';
import { UniDropReel } from '../../../Scripts/DropReel/UniDropReel';
import { DropType } from '../../../Scripts/DropReel/UniDropIconBase';
import { EaseType, Utility } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

const {
    REEL_AMOUNT,
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    WILD_ID,
} = PublicReelConfigTest;

enum SlotType {
    None,
    Drop,
    Rolling,
}

@ccclass('DropUniReelExample')
export class UniDropReelExample extends UniDropReel<SymbolNumber, UniDropIconExample> {
    @property(ReelBounceConfig)
    private bounceConfig: ReelBounceConfig = null;

    @property({ type: Enum(SlotType), visible: true, readonly: true })
    protected _slotType: SlotType = SlotType.None;

    @property({ type: CCFloat, tooltip: 'Icon掉落間隔的時間' })
    protected iconDropSpaceTime: number = 0.1;

    protected _currentRandomData: SymbolNumber[] = [];

    public override init(reelID: number): void {
        super.init(reelID);
        this.onStartRoll = this.upBouncing;
        this.onStartDropOut = this.setStartDropOut;
        this.onStartRefill = this.setStartRefill;
    }

    public setIconBrightness(isDark: boolean, iconIndex?: number[]): void {
        if (iconIndex) {
            for (let i = 0; i < iconIndex.length; i++) {
                let index: number = iconIndex[i];
                this._iconList[index].setBrightness(isDark);
            }
        }
        else {
            for (let index = 0; index < this._iconList.length; index++) {
                this._iconList[index].setBrightness(isDark);
            }
        }
    }

    public setData(symbolData: SymbolNumber[], randomDataLength: number): void {
        let randomData: SymbolNumber[] = [];

        for (let index = 0; index < randomDataLength; index++) { //為了間隔停止，根據randomDataLength生成隨機資料
            const symbol = this.createRandomSymbol();
            randomData.push(symbol);
        }

        let resultData: SymbolNumber[] = this._slotType === SlotType.Drop ?
            [...symbolData] :
            [this.createRandomSymbol(), ...symbolData, ...randomData];

        for (let index = resultData.length - 1; index >= 0; index--) {
            const symbol = resultData[index];
            this.data.enqueue(symbol);
        }
    }

    /**
   * 滾輪急停時呼叫，把data裡面的資料清空到剩下iconList的長度
   */
    public clearRandomData(): void {
        while (this.data.count > this.iconAmount + 2) { //把隨機資料直接移除直到剩餘伺服器資料
            let data = this.data.dequeue();
            this.destroySymbol(data);
        }
    }

    public override startRoll(): void {
        this._slotType = SlotType.Rolling;
        super.startRoll();
    }

    public override async stopRollAsync(stopType: StopType): Promise<void> {
        await super.stopRollAsync(stopType);
        await this.downBouncing();
    }

    public override async startDropRefillAsync(dropOutIds: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): Promise<void> {
        await this.dropEliminate(dropOutIds);
        await super.startDropRefillAsync(dropOutIds, ease, easedValueCustom);
    }

    public override startDropOut(idList: number[], ease?: EaseType, easedValueCustom?: RealCurve): void {
        this._slotType = SlotType.Drop;
        super.startDropOut(idList, ease, easedValueCustom);
    }

    protected upBouncing(): void {
        if (this.bounceConfig.startBounce) {
            this.resetMovements();
            this.rollingBouncingAsync(this.bounceConfig.bounceDis);
        }
    }

    protected async downBouncing(): Promise<void> {
        if (this.bounceConfig.endBounce) {
            await this.rollingBouncingAsync(-this.bounceConfig.bounceDis);
        }
    }

    protected createRandomSymbol() {
        if (this._currentRandomData.length <= 0) {
            this._currentRandomData = this.generateRandomSymbolList();
        }

        return this._currentRandomData.pop();
    }
    protected destroySymbol(symbol: SymbolNumber) {
        SymbolNumber.pool.destroy(symbol);
    }

    protected generateRandomSymbolList(): SymbolNumber[] {
        let allSymbolList = this.reelID === REEL_AMOUNT - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [...NORMAL_SYMBOLS_LIST];
        let uniqueSymbolIDList: number[] = REEL_AMOUNT - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [WILD_ID];

        let resultSymbols: SymbolNumber[] = [];

        for (let index = 0; index < this.iconAmount + 2; index++) {
            let randomIndex: number = randomRangeInt(0, allSymbolList.length);
            let symbolID: number = allSymbolList[randomIndex];

            if (uniqueSymbolIDList.length > 0 && uniqueSymbolIDList.includes(symbolID)) {
                let uniqueSymbolIndex = allSymbolList.indexOf(symbolID);
                allSymbolList.splice(uniqueSymbolIndex, 1);
            }

            let symbol = SymbolNumber.pool.instance();
            symbol.symbolID = symbolID;
            // symbol.randomValue(); 也可以他自己產生隨機資料
            resultSymbols.push(symbol);
        }

        return resultSymbols;
    }

    protected initIconSymbol(): void {
        let data = this.generateRandomSymbolList();

        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.symbol = data[index];
        }
    }

    protected async rollingBouncingAsync(dis: number): Promise<void> {
        return new Promise((resolve, reject) => {
            let downEasing = this.bounceConfig.downBounceEasing;
            let downDuration = this.bounceConfig.downBounceDuration;
            let upEasing = this.bounceConfig.upBounceEasing;
            let upDuration = this.bounceConfig.upBounceDuration;

            let downRealCurve = this.bounceConfig.useRealCurve ? this.bounceConfig.downBounceRealCurve : null;
            let upRealCurve = this.bounceConfig.useRealCurve ? this.bounceConfig.upBounceRealCurve : null;

            for (let i = 0; i < this._iconList.length; ++i) {
                this._iconList[i].moveBy(this.moveDir.multiplyScalar(dis).negative(), downDuration, downEasing, downRealCurve);
                this._iconList[i].moveBy(this.moveDir.multiplyScalar(dis), upDuration, upEasing, upRealCurve);
            }

            this._iconList[0].addCallback(() => resolve());
        })
    }

    protected override drop(ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        const dropIcons = this._iconList.filter(icon => icon.dropType !== DropType.NoDrop);

        if (!this.inverseDirection) {
            dropIcons.reverse();
        }

        for (let i = 0; i < dropIcons.length; i++) {
            if (this.iconDropSpaceTime > 0) {
                const delay = i * this.iconDropSpaceTime;
                this.scheduleOnce(() => {
                    this.runDrop(dropIcons[i], ease, easedValueCustom);
                }, delay);
            } else {
                this.runDrop(dropIcons[i], ease, easedValueCustom);
            }
        }
    }

    protected runDrop(icon: UniDropIconExample, ease: EaseType, easedValueCustom: RealCurve | null): void {
        const dropCount = this.getDropCount(icon);
        const dropDis = this.moveDir.clone().multiplyScalar(this.moveDis * dropCount);
        const dropTime = this.moveInterval * dropCount;
        icon.moveBy(dropDis, dropTime, ease, easedValueCustom);
        icon.addCallback(() => { this.dropComplete(icon); });
    }

    protected override dropComplete(dropIcon: UniDropIconExample): void {
        const isValidDrop = dropIcon.dropType !== DropType.DropOut && this.bounceConfig.endBounce;

        if (!isValidDrop) {
            this.setDropFinished(dropIcon);
            return;
        }

        this.dropBouncing(dropIcon);
    }

    protected setStartDropOut(idList: number[]): void { }

    protected setStartRefill(dropOutIds: number[]): void {
        for (let i = 0; i < dropOutIds.length; i++) {
            const index = dropOutIds[i];
            this.iconList[index].show();
        }
    }

    protected async dropEliminate(removeIdList: number[]): Promise<void> {
        for (let i = 0; i < removeIdList.length; i++) {
            const index = removeIdList[i];
            this.iconList[index].hide();
        }
        await Utility.waitPromise(0.5);
    }

    protected dropBouncing(dropIcon: UniDropIconExample): void {
        let dis = -this.bounceConfig.bounceDis
        let downEasing = this.bounceConfig.downBounceEasing;
        let downDuration = this.bounceConfig.downBounceDuration;
        let upEasing = this.bounceConfig.upBounceEasing;
        let upDuration = this.bounceConfig.upBounceDuration;
        let downRealCurve = this.bounceConfig.useRealCurve ? this.bounceConfig.downBounceRealCurve : null;
        let upRealCurve = this.bounceConfig.useRealCurve ? this.bounceConfig.upBounceRealCurve : null;

        dropIcon.moveBy(this.moveDir.multiplyScalar(dis).negative(), downDuration, downEasing, downRealCurve);
        dropIcon.moveBy(this.moveDir.multiplyScalar(dis), upDuration, upEasing, upRealCurve);
        dropIcon.addCallback(() => {
            this.setDropFinished(dropIcon);
        });
    }

    private setDropFinished(dropIcon: UniDropIconExample): void {
        dropIcon.dropType = DropType.NoDrop;
        if (this._iconList.every(icon => icon.dropType === DropType.NoDrop)) {
            this.waitForDropComplete?.();
        }
    }
}


