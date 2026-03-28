import { _decorator, CCInteger, Component, Label, Node } from 'cc';
import { UniReelTempo } from './UniReelTempo';
import { UniReelView } from '../../../../ReelTemplate/v3';
import { SymbolNumber } from '../../../../ReelTemplate/v3/Example/Scripts/SymbolNumber';

const { ccclass, property } = _decorator;

@ccclass('UniReelViewExample')
export class UniReelViewExample extends UniReelView<UniReelTempo> {
    @property(Node)
    protected readyHandList: Node[] = [];

    @property({ type: CCInteger, tooltip: '隨機資料長度，數值越大滾輪間隔停止越久' })
    protected spaceLength: number = 4;

    @property({ type: CCInteger, tooltip: '聽牌的隨機資料長度，數值越大滾輪間隔停止越久' })
    protected readyHandLength: number = 12;

    @property(Label)
    private useSymbolCountLabel: Label = null;

    @property(Label)
    private unUsedSymbolCountLabel: Label = null;

    public override init(): void {
        super.init();
        this.setReelDataCallback = this.setReelData;
        this.showReadyHandCallback = this.showReadyHand;
        this.hideReadyHandCallback = this.hideReadyHand;
    }

    public fastStopRoll(): void {
        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID = this._currentRollingReelIDs[index];
            this.reelList[reelID].clearRandomData();
        }
    }

    update(): void {
        this.useSymbolCountLabel.string = "useSymbolCount: " + SymbolNumber.pool.usedCount.toString();
        this.unUsedSymbolCountLabel.string = "unUsedSymbolCount: " + SymbolNumber.pool.unUsedCount.toString();
    }

    public setIconBrightness(reelID: number, isDark: boolean): void {
        this.reelList[reelID].setIconBrightness(isDark);
    }

    public setAllReelBrightness(isDark: boolean): void {
        for (let reelID = 0; reelID < this.reelAmount; reelID++) {
            this.reelList[reelID].setIconBrightness(isDark);
        }
    }

    /**
 * 只是呼叫滾輪暫停，並不是直接停下
 */
    public override async stopRoll(resultData: number[][], stopType: number): Promise<void> {
        await super.stopRoll(resultData, stopType);
        this.setAllReelBrightness(false);
    }

    protected showReadyHand(reelID: number): void {
        this.setAllReelBrightness(true);
        this.setIconBrightness(reelID, false);

        this.readyHandList[reelID].active = true;
    }

    protected hideReadyHand(reelID: number): void {
        if (reelID === this.reelAmount - 1) {
            this.setAllReelBrightness(false);
        }
        else {
            this.setIconBrightness(reelID, false);
        }

        this.readyHandList[reelID].active = false;
    }

    protected createSymbolData(resultData: number[]): SymbolNumber[] {
        let symbolData: SymbolNumber[] = [];

        for (let index = 0; index < resultData.length; index++) {
            let symbol = SymbolNumber.pool.instance();
            symbol.symbolID = resultData[index];
            symbolData.push(symbol);
        }

        return symbolData;
    }

    protected setReelData(reelID: number, data: number[]): void {
        let length = 0;

        if (!this.isFastModeCallback()) {
            length = this.calculateRandomDataLength(reelID);//可以在這裡加隨機資料，實現間隔暫停
        }

        let symbolData = this.createSymbolData(data);
        this.reelList[reelID].setData(symbolData, length);
    }

    protected calculateRandomDataLength(reelID: number): number {
        let needReadyHand = this._reelHaveReadyHandList[reelID];
        let order = this._currentRollingReelIDs.indexOf(reelID);

        let randomDataLength: number = 0;
        if (needReadyHand) {
            let readyHandOrder = this._currentRollingReelIDs.indexOf(this._currentReadyHandReelID);
            let frontOrder = readyHandOrder - 1 < 0 ? 0 : readyHandOrder - 1;
            randomDataLength = frontOrder * this.spaceLength + (order - readyHandOrder + 1) * this.readyHandLength;
        }
        else {
            randomDataLength = order * this.spaceLength;
        }

        return randomDataLength;
    }
}