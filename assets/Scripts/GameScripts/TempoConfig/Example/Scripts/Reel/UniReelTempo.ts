import { _decorator, randomRangeInt, } from 'cc';
import { UniIconTempo } from './UniIconTempo';
import { PublicReelConfigTest } from '../../../../ReelTemplate/v2/Example/Scripts/PublicReelConfigTest';
import { StopType, UniReel } from '../../../../ReelTemplate/v3';
import { SymbolNumber } from '../../../../ReelTemplate/v3/Example/Scripts/SymbolNumber';
import { ReelBounceConfig } from '../../../../ReelTemplate/v3/Example/Scripts/ReelBounceConfig';

const { ccclass, property } = _decorator;

const {
    REEL_AMOUNT,
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    WILD_ID,
} = PublicReelConfigTest;

@ccclass('UniReelTempo')
export class UniReelTempo extends UniReel<SymbolNumber, UniIconTempo> {
    @property(ReelBounceConfig)
    private bounceConfig: ReelBounceConfig = null;

    protected _currentRandomData: SymbolNumber[] = [];

    public override init(reelID: number): void {
        super.init(reelID);
        this.onStartRoll = this.upBouncing;
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

        let resultData: SymbolNumber[] = [this.createRandomSymbol(), ...symbolData, ...randomData];

        for (let index = resultData.length - 1; index >= 0; index--) {
            const symbol = resultData[index];
            this.data.enqueue(symbol);
        }
    }

    public override async stopRollAsync(stopType: StopType): Promise<void> {
        await super.stopRollAsync(stopType);
        await this.downBouncing();
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
}


