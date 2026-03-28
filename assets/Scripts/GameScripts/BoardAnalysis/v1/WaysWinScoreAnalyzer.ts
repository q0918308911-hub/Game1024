export class WaysWinScoreAnalyzer {
    protected readonly wild: number[];
    protected readonly iconList: number[];
    protected readonly payLine: number[][];
    protected readonly payTable: number[][];
    protected reelAmount: number;
    protected symbolLength: number;
    protected isGetAllConnect: boolean = false;

    /**
     * @param wild WILD圖示
     * @param iconList 中獎圖示表 (將有賠率的連線中獎圖示放入，一定要丟WILD!，SCATTER請另外算)
     * @param oddList  賠率表 (一定要丟入WILD的賠率表，如果WILD沒有賠率,則WILD的賠率表設定為[0, 0, 0, 0, 0])
     * @param payTable 連線表
     */
    constructor(wild: number[], iconList: number[], oddList: number[][], payTable: number[][]) {
        this.wild = wild;
        this.iconList = iconList;
        this.payTable = oddList;
        this.payLine = payTable;
    }

    /**
     * @param iconData 盤面
     * @param reelAmount 滾輪數量
     * @param symbolLength 單一輪有幾個圖示
     * @returns 中獎線號,圖示中獎，賠率，位置,2D位置
     */
    public getWaysWinData(iconData: number[], reelAmount: number, symbolLength: number, getAllConnect: boolean = false): WaysWinData[] {
        this.reelAmount = reelAmount;
        this.symbolLength = symbolLength;
        this.isGetAllConnect = getAllConnect;
        return this.getWaysWinDataList(iconData);
    }

    protected getWaysWinDataList(iconData: number[]): WaysWinData[] {
        const winDataList: WaysWinData[] = [];
        for (let i = 0; i < this.payLine.length; i++) {
            const line: number[] = this.payLine[i];
            const result: Map<number, PayLineData> = this.calculateOneLine(line, iconData);
            if (result) {
                for (let [key, value] of result) {
                    const pos2DData: number[][] = this.convertWinIndexTo2DArray(value.Pos);
                    const winData: WaysWinData = new WaysWinData(i, key, value.Odd, value.Pos, pos2DData);
                    winDataList.push(winData);
                }
            }
        }
        return winDataList;
    }

    /**
     * @param line 單一連線位置
     * @param iconData 盤面
     * @returns 單一條線中，中獎圖示，中獎圖示的賠率，位置
     */
    protected calculateOneLine(line: number[], iconData: number[]): Map<number, PayLineData> {
        const lineMap: Map<number, PayLineData> = new Map<number, PayLineData>();
        const initPos: number = line[0];
        let tempOdds: number = 0;
        let tempSymbolId: number = iconData[initPos];
        for (let i = 1; i < line.length; i++) {
            const linePos: number = line[i];
            const symbolID: number = iconData[linePos];
            const isEqual: boolean = this.wild.includes(symbolID) || tempSymbolId === symbolID || this.wild.includes(tempSymbolId);
            const isLegal: boolean = this.iconList.includes(symbolID) && this.iconList.includes(tempSymbolId);
            if (isLegal && isEqual) {
                tempSymbolId = this.wild.includes(symbolID) ? tempSymbolId : symbolID;
                const newLineOdds: number = this.payTable[tempSymbolId][i];
                if ((newLineOdds >= tempOdds) || this.isGetAllConnect) {
                    tempOdds = this.payTable[tempSymbolId][i];
                    let posList: number[] = [];
                    posList.push(...line.slice(0, i + 1));
                    posList = posList.set();
                    let payLineData: PayLineData = new PayLineData(posList, tempOdds);
                    if (tempOdds > 0) {
                        lineMap.set(tempSymbolId, payLineData);
                    }
                }
            }
            else {
                break;
            }
        }
        return lineMap;
    }

    protected convertWinIndexTo2DArray(winIconPos: number[]): number[][] {
        let resultData: number[][] = Array.from({ length: this.reelAmount }, () => []);
        for (let index = 0; index < winIconPos.length; index++) {
            let reelID = Math.floor(winIconPos[index] / this.symbolLength);
            let pos = winIconPos[index] % this.symbolLength;
            resultData[reelID].push(pos);
        }

        return resultData;
    }
}

export class WaysWinData {
    public readonly WinLineID: number;
    public readonly SymbolID: number;
    public readonly Odd: number;
    public readonly Pos: number[];
    public readonly Win2DPos: number[][];

    constructor(winLineID: number, symbolID: number, odd: number, pos: number[], Win2DPos: number[][]) {
        this.WinLineID = winLineID;
        this.SymbolID = symbolID;
        this.Odd = odd;
        this.Pos = pos;
        this.Win2DPos = Win2DPos;
    }
}

class PayLineData {
    public readonly Pos: number[];
    public readonly Odd: number;

    constructor(pos: number[], odd: number) {
        this.Pos = pos;
        this.Odd = odd;
    }
}
