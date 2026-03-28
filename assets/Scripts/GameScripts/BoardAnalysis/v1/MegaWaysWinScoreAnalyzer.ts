export class MegaWaysWinScoreAnalyzer {
    protected readonly wild: number[];
    protected readonly payTable: number[][];
    protected readonly iconList: number[];
    protected reelAmount: number;
    protected symbolLength: number;

    /**
     * @param wild WILD圖示
     * @param oddList 賠率表
     * @param iconList 中獎圖示表 (將有賠率的連線中獎圖示放入，SCATTER請另外算)
     */
    constructor(wild: number[], oddList: number[][], iconList: number[]) {
        this.wild = wild;
        this.iconList = iconList;
        this.payTable = oddList;
    }

    /**
     * @param iconData 盤面
     * @param reelAmount 滾輪數量
     * @param symbolLength 單一輪有幾個圖示
     * @return 中獎圖示,賠率,贏的位置,輪播位置，中獎2D位置
     */
    public getMegaWaysWinData(iconData: number[], reelAmount: number, symbolLength: number): MegaWaysWinData[] {
        this.reelAmount = reelAmount;
        this.symbolLength = symbolLength;
        const icon2DData: number[][] = this.convertSymbolTo2DArray(iconData);
        return this.megaWaysWinData(icon2DData);
    }

    protected megaWaysWinData(icon2DData: number[][]): MegaWaysWinData[] {
        let matchWinData: MegaWaysWinData[] = [];
        for (let icon of this.iconList) {
            const oneIconMatchMap: Map<number, PayLineData> = this.calculateOneIconMegaWays(icon, icon2DData);
            for (const [key, value] of oneIconMatchMap) {
                const Win2DPos: number[][] = this.convertWinIndexTo2DArray(value.Pos);
                const winData: MegaWaysWinData = new MegaWaysWinData(key, value.Odd, value.Pos, value.OneMatchPos, Win2DPos);
                matchWinData.push(winData);
            }
        }
        return matchWinData;
    }

    protected calculateOneIconMegaWays(icon: number, icon2DData: number[][]): Map<number, PayLineData> {
        const oneIconMatchMap: Map<number, PayLineData> = new Map<number, PayLineData>();
        let combinedWire: number[][] = Array.from({ length: 0 }, () => []);
        let AllPosList: number[] = [];
        let tempOdds: number = 0;
        let tempCount: number = 1;//計算分出去的條數
        for (let i = 0; i < this.reelAmount; i++) {
            const newLineOdds: number = this.payTable[icon][i];
            const hasWild: boolean = this.wild.some(value => icon2DData[i].includes(value));//如果需要WILD都要匹配 some=>every
            if (icon2DData[i].includes(icon) || hasWild) {
                let winPos: number[] = [];
                const pos: number[] = icon2DData[i].indexesOf(icon).map((x) => x + (i * this.symbolLength));
                AllPosList = this.mergeTwoArrays(AllPosList, pos);
                winPos = this.mergeTwoArrays(winPos, pos);
                if (hasWild) {
                    const wildPos: number[] = this.getWildPos(icon2DData[i], (i * this.symbolLength));
                    AllPosList = this.mergeTwoArrays(AllPosList, wildPos);
                    winPos = this.mergeTwoArrays(winPos, wildPos);
                }
                combinedWire = this.getCombinedWireArray(combinedWire, winPos);
                const oneReelMatchCount: number = icon2DData[i].count(icon) + this.getWildCount(icon2DData[i]);
                tempCount = (tempCount * oneReelMatchCount).fixed();
                tempOdds = (newLineOdds * tempCount).fixed();
                if (tempOdds > 0) {
                    const payLineData: PayLineData = new PayLineData(AllPosList, tempOdds, combinedWire);
                    oneIconMatchMap.set(icon, payLineData);
                }
            }
            else {
                break;
            }
        }
        return oneIconMatchMap;
    }

    protected getWildPos(iconList: number[], startPos: number): number[] {
        let wildPosList: number[] = [];
        for (let i = 0; i < this.wild.length; i++) {
            const wildPos: number[] = iconList.indexesOf(this.wild[i]).map((x) => x + startPos);
            wildPosList = wildPosList.concat(wildPos);
        }
        return wildPosList;
    }

    protected getWildCount(iconList: number[]): number {
        let wildTotal: number = 0;;
        for (let i = 0; i < this.wild.length; i++) {
            const wildCount: number = iconList.count(this.wild[i]);
            wildTotal += wildCount;
        }
        return wildTotal;
    }

    protected convertSymbolTo2DArray(iconData: number[]): number[][] {
        let resultData: number[][] = [];

        for (let index = 0; index < this.reelAmount; index++) {
            resultData[index] = iconData.slice(index * this.symbolLength, (index + 1) * this.symbolLength);
        }
        return resultData;
    }

    protected getCombinedWireArray(combinedWire: number[][], posList: number[]): number[][] {
        if (combinedWire.length === 0) {
            combinedWire = posList.map((value) => [value]);
            return combinedWire;
        }
        const newArray: number[][] = [];

        for (let item of combinedWire) {
            for (let pos of posList) {
                newArray.push([...item, pos]);
            }
        }
        combinedWire = newArray.map((arr) => [...arr]);
        return combinedWire;
    }

    private mergeTwoArrays(targetArray: number[], inputArray: number[]): number[] {
        targetArray = targetArray.concat(inputArray);
        targetArray = targetArray.set();
        return targetArray;
    }

    protected convertWinIndexTo2DArray(winIconPos: number[]): number[][] {
        let resultData: number[][] = Array.from({ length: this.reelAmount }, () => []);
        for (let index = 0; index < winIconPos.length; index++) {
            let reelID: number = Math.floor(winIconPos[index] / this.symbolLength);
            let pos: number = winIconPos[index] % this.symbolLength;
            resultData[reelID].push(pos);
        }

        return resultData;
    }
}

export class MegaWaysWinData {
    public readonly WinSymbolID: number;
    public readonly Odd: number;
    public readonly Pos: number[];
    public readonly Win2DPos: number[][];
    public readonly OneMatchPos: number[][];

    constructor(winSymbolIDodd: number, odd: number, pos: number[], oneMatchPos: number[][], win2DPos: number[][]) {
        this.WinSymbolID = winSymbolIDodd;
        this.Odd = odd;
        this.Pos = pos;
        this.OneMatchPos = oneMatchPos;
        this.Win2DPos = win2DPos;
    }
}

class PayLineData {
    public readonly Pos: number[] = [];
    public readonly Odd: number = 0;
    public readonly OneMatchPos: number[][] = [];

    constructor(pos: number[], odd: number, oneMatchPos: number[][]) {
        this.Pos = pos;
        this.Odd = odd;
        this.OneMatchPos = oneMatchPos;
    }
}

