import { _decorator, CCBoolean, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotMachineData')
export class SlotMachineData extends Component {
    /**所有可能出現的符號 */
    public allSymbolList: number[] = [];

    /** 每輪所有可能出現的符號，會根據每輪不能出現的符號來運算最終的符號 */
    public everyReelAllSymbolList: number[][] = [];

    /**每輪只會出現一次的符號 */
    public uniqueSymbolList: number[][] = [];

    /**每輪不能出現的符號 */
    public noAppearSymbolList: number[][] = [];

    /**每輪不能同時出現這個陣列裡面的符號 */
    public noSameReelSymbolList: number[][] = [];

    /**每輪初始的符號，沒有資料的話就是隨機生成 */
    public initSymbolList: number[][] = [];

    /**
     * 
     * @param reelAmount 滾輪總數
     * @param allIconList 所有可能出現的符號
     */
    public init(reelAmount: number): void {
        this.everyReelAllSymbolList = Array.from({ length: reelAmount }, () => []);

        this.updateEveryReelAllSymbolList();
    }

    public updateEveryReelAllSymbolList(): void {
        for (let reelID = 0; reelID < this.everyReelAllSymbolList.length; reelID++) {
            this.everyReelAllSymbolList[reelID] = [...this.allSymbolList];

            if (this.noAppearSymbolList[reelID]) {
                this.everyReelAllSymbolList[reelID] =
                    this.everyReelAllSymbolList[reelID].filter((symbolID) => !this.noAppearSymbolList[reelID].includes(symbolID));
            }
        }
    }

    public getAllSymbols(reelID: number): number[] {
        let allSymbolList: number[] = [];

        if (this.everyReelAllSymbolList[reelID]) {
            allSymbolList = [...this.everyReelAllSymbolList[reelID]];
        }

        return allSymbolList;
    }

    public getUniqueSymbols(reelID: number): number[] {
        let uniqueSymbolList: number[] = [];

        if (this.uniqueSymbolList[reelID]) {
            uniqueSymbolList = [...this.uniqueSymbolList[reelID]];
        }

        return uniqueSymbolList;
    }

    public getNoSameReelSymbols(reelID: number): number[] {
        let noSameReelSymbolList: number[] = [];

        if (this.noSameReelSymbolList[reelID]) {
            noSameReelSymbolList = [...this.noSameReelSymbolList[reelID]];
        }

        return noSameReelSymbolList;
    }

    public getNoAppearSymbols(reelID: number): number[] {
        let noAppearSymbolList: number[] = [];

        if (this.noAppearSymbolList[reelID]) {
            noAppearSymbolList = [...this.noAppearSymbolList[reelID]];
        }

        return noAppearSymbolList;
    }
}

export class SlotMachineDataQueue {
    protected _queue: number[][] = [];

    public get queue(): number[][] {
        return this._queue;
    }

    public push(data: number[]): void {
        this._queue.push(data);
    }

    public shift(): number[] {
        return this._queue.shift();
    }

    public isEmpty(): boolean {
        return this._queue.length === 0;
    }

    public insert(index: number, data: number[]): void {
        this._queue.splice(index, 0, data);
    }

    public getData(index: number): number[] {
        return this._queue[index];
    }

    public clear(): void {
        this._queue = [];
    }
}

// export class ReelSymbolData {
//     public symbolData: number[] = [];
//     public isResultData: boolean = false;

//     public isEmpty(): boolean {
//         return this.symbolData.length === 0;
//     }

//     public getBounceSymbolID(): number {
//         return this.symbolData[this.symbolData.length - 1];
//     }

//     /**
//      * 
//      * @returns 是伺服器資料並且是最後一個
//      */
//     public isFinalData(): boolean {
//         return this.isResultData && this.isEmpty();
//     }
// }

// export class SymbolData {
//     public symbolID: number = -1;
//     public bounceSymbolID: number = -1;
//     public pullSymbolID: number = -1;
//     public isFinal: boolean = false;
// }