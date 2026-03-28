import { WaysWinData, WaysWinScoreAnalyzer } from '../../../Scripts/GameScripts/BoardAnalysis/v1/WaysWinScoreAnalyzer';

export class WaysWinScoreAnalyzerTest extends WaysWinScoreAnalyzer {
    /**如果有WILD展開倍率 請修改wildMultiplier變成WILD展開倍率 ex:第三輪展開 有5倍 則 wildMultiplier = [1,1,5,1,1] */
    public wildMultiplier: number[] = Array.from({ length: TestConfig.REEL_AMOUNT }, () => 1);

    constructor() {
        super(TestConfig.WILD_LIST, TestConfig.SCORE_ICON_LIST, TestConfig.ODDS_LIST, TestConfig.PAY_TABLE);
    }

    public getWinData(iconList: number[]): void {
        let totalOdd: number = 0;
        let winPos: number[] = [];
        const lineWinDataList: ClientLineData[] = []
        const winData: WaysWinData[] = this.getWaysWinData(iconList, TestConfig.REEL_AMOUNT, TestConfig.SYMBOL_LENGTH);
        const maxOddMap: Map<number, MapWinLineInfo> = new Map<number, MapWinLineInfo>();

        for (const data of winData) {
            if (!maxOddMap.has(data.WinLineID) || maxOddMap.get(data.WinLineID).WinPos.length < data.Pos.length) { //找最長長度
                const winLineInfo: MapWinLineInfo = new MapWinLineInfo(data.SymbolID, data.Odd, data.Pos, data.Win2DPos);
                maxOddMap.set(data.WinLineID, winLineInfo);
            }
        }
        for (let item of maxOddMap) {
            const lineWinOdd: number = (item[1].WinOdds * this.getLineWildMultiplier(item[1].WinPos.length)).fixed();
            const lineWinData: ClientLineData = new ClientLineData(item[0], item[1].WinSymbolID, lineWinOdd, item[1].WinPos, item[1].Win2DPos);
            console.log(`第${item[0] + 1}線,贏線圖示:${item[1].WinSymbolID},贏線賠率:${lineWinOdd},贏線位置:${item[1].WinPos},贏線2D位置:${item[1].Win2DPos}`);
            lineWinDataList.push(lineWinData);
        }

        for (let item of lineWinDataList) {
            totalOdd = (totalOdd + item.WinOdds).fixed();
            for (let itemPos of item.WinPos) {
                winPos.push(itemPos);
                winPos = winPos.set();
                winPos.sort((a, b) => (a - b));
            }
        }

        console.log(`總贏分:${totalOdd},贏線位置${winPos}`);
    }

    private getLineWildMultiplier(length: number): number {
        let totalMultiplier: number = 1;
        for (let i = 0; i < length; i++) {
            totalMultiplier *= this.wildMultiplier[i];
        }
        return totalMultiplier;
    }
}

export class MapWinLineInfo {
    public readonly WinSymbolID: number = 0;
    public readonly WinOdds: number = 0;
    public readonly WinPos: number[] = [];
    public readonly Win2DPos: number[][] = [];

    constructor(winSymbolID: number, winOdds: number, winPos: number[], win2DPos: number[][]) {
        this.WinSymbolID = winSymbolID;
        this.WinOdds = winOdds;
        this.WinPos = winPos;
        this.Win2DPos = win2DPos;
    }
};

export class ClientLineData {
    public readonly WinLineID: number = 0;
    public readonly WinSymbolID: number = 0;
    public readonly WinOdds: number = 0;
    public readonly WinPos: number[] = [];
    public readonly Win2DPos: number[][] = [];

    constructor(winLineID: number, winSymbolID: number, winOdds: number, winPos: number[], win2DPos: number[][]) {
        this.WinLineID = winLineID;
        this.WinSymbolID = winSymbolID;
        this.WinOdds = winOdds;
        this.WinPos = winPos;
        this.Win2DPos = win2DPos;
    }
}

export class TestConfig {
    public static readonly REEL_AMOUNT = 5;
    public static readonly SYMBOL_LENGTH = 3;
    public static readonly WILD_LIST: number[] = [8];
    public static readonly SCORE_ICON_LIST: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]

    public static readonly SYMBOL_0_ODDS: number[] = [0, 0, 1.5, 7.5, 25];
    public static readonly SYMBOL_1_ODDS: number[] = [0, 0, 1, 5, 20];
    public static readonly SYMBOL_2_ODDS: number[] = [0, 0, 0.5, 2.5, 7.5];
    public static readonly SYMBOL_3_ODDS: number[] = [0, 0, 0.4, 2, 5];
    public static readonly SYMBOL_4_ODDS: number[] = [0, 0, 0.1, 0.5, 2.5];
    public static readonly SYMBOL_5_ODDS: number[] = [0, 0, 0.1, 0.5, 2.5];
    public static readonly SYMBOL_6_ODDS: number[] = [0, 0, 0.1, 0.5, 2.5];
    public static readonly SYMBOL_7_ODDS: number[] = [0, 0, 0.1, 0.5, 2.5];
    public static readonly SYMBOL_8_ODDS: number[] = [0, 0, 2.5, 12.5, 50];
    public static readonly ODDS_LIST: number[][] = [
        this.SYMBOL_0_ODDS,
        this.SYMBOL_1_ODDS,
        this.SYMBOL_2_ODDS,
        this.SYMBOL_3_ODDS,
        this.SYMBOL_4_ODDS,
        this.SYMBOL_5_ODDS,
        this.SYMBOL_6_ODDS,
        this.SYMBOL_7_ODDS,
        this.SYMBOL_8_ODDS,
    ];


    public static readonly PAY_LINE_1: number[] = [1, 4, 7, 10, 13];
    public static readonly PAY_LINE_2: number[] = [0, 3, 6, 9, 12];
    public static readonly PAY_LINE_3: number[] = [2, 5, 8, 11, 14];
    public static readonly PAY_LINE_4: number[] = [0, 4, 8, 10, 12];
    public static readonly PAY_LINE_5: number[] = [2, 4, 6, 10, 14];
    public static readonly PAY_LINE_6: number[] = [1, 3, 6, 9, 13];
    public static readonly PAY_LINE_7: number[] = [1, 5, 8, 11, 13];
    public static readonly PAY_LINE_8: number[] = [0, 3, 7, 11, 14];
    public static readonly PAY_LINE_9: number[] = [2, 5, 7, 9, 12];
    public static readonly PAY_LINE_10: number[] = [1, 5, 7, 9, 13];
    public static readonly PAY_LINE_11: number[] = [1, 3, 7, 11, 13];
    public static readonly PAY_LINE_12: number[] = [0, 4, 7, 10, 12];
    public static readonly PAY_LINE_13: number[] = [2, 4, 7, 10, 14];
    public static readonly PAY_LINE_14: number[] = [0, 4, 6, 10, 12];
    public static readonly PAY_LINE_15: number[] = [2, 4, 8, 10, 14];
    public static readonly PAY_LINE_16: number[] = [1, 4, 6, 10, 13];
    public static readonly PAY_LINE_17: number[] = [1, 4, 8, 10, 13];
    public static readonly PAY_LINE_18: number[] = [0, 3, 8, 9, 12];
    public static readonly PAY_LINE_19: number[] = [2, 5, 6, 11, 14];
    public static readonly PAY_LINE_20: number[] = [0, 5, 8, 11, 12];
    public static readonly PAY_LINE_21: number[] = [2, 3, 6, 9, 14];
    public static readonly PAY_LINE_22: number[] = [1, 5, 6, 11, 13];
    public static readonly PAY_LINE_23: number[] = [1, 3, 8, 9, 13];
    public static readonly PAY_LINE_24: number[] = [0, 5, 6, 11, 12];
    public static readonly PAY_LINE_25: number[] = [2, 3, 8, 9, 14];

    public static readonly PAY_TABLE: number[][] = [
        this.PAY_LINE_1, this.PAY_LINE_2, this.PAY_LINE_3, this.PAY_LINE_4, this.PAY_LINE_5, this.PAY_LINE_6,
        this.PAY_LINE_7, this.PAY_LINE_8, this.PAY_LINE_9, this.PAY_LINE_10, this.PAY_LINE_11, this.PAY_LINE_12,
        this.PAY_LINE_13, this.PAY_LINE_14, this.PAY_LINE_15, this.PAY_LINE_16, this.PAY_LINE_17, this.PAY_LINE_18,
        this.PAY_LINE_19, this.PAY_LINE_20, this.PAY_LINE_21, this.PAY_LINE_22, this.PAY_LINE_23, this.PAY_LINE_24,
        this.PAY_LINE_25
    ];
}