import { WaysWinData, WaysWinScoreAnalyzer } from "db://assets/Scripts/ModuleEntry";

export class WaysWinScoreAnalyzerTest extends WaysWinScoreAnalyzer {
    /**先算完分後乘倍率 請修改wildMultiplier變成WILD展開倍率 ex:第三輪展開 有5倍 則 wildMultiplier = [1,1,5,1,1] */
    public multiplierList: number[] = Array.from({ length: TestConfig.REEL_AMOUNT }, () => 1);

    /** 如果有WILD要先承上賠率倍數 請修改multipleWildPosList */
    public multipleWildPosList: number[] = [];

    /**
     * 建構子
     */
    constructor() {
        super(TestConfig.SCORE_ICON_LIST, TestConfig.ODDS_LIST, TestConfig.PAY_TABLE, WaysWinScoreAnalyzerTest.getConnectCondition);
    }

    /**
     * 獲取單條線上(最大賠率)的中獎資訊
     * @param dataList 工具回傳的單條線上所有的中獎資訊
     * @returns 最終結果
     */
    public getBiggerWinData(dataList: WaysWinData[]): WaysWinData {
        let temp: WaysWinData = null;
        for (let item of dataList) {
            if (temp === null || temp.odd < item.odd) {
                temp = item;
            }
        }
        return temp;
    }

    /**
     * 獲取單條線上(同倍率取最長 或者 取倍率最高)的中獎資訊
     * @param dataList 工具回傳的單條線上所有的中獎資訊
     * @returns 最終結果
     */
    public getLongerWinData(dataList: WaysWinData[]): WaysWinData {
        let temp: WaysWinData = null;
        for (let item of dataList) {
            if (temp === null || (temp.pos.length < item.pos.length && temp.odd === item.odd) || (temp.odd < item.odd)) {
                temp = item;
            }
        }
        return temp;
    }

    /**
     * 獲取單條線上(先乘上賠率倍數 再做賠率比較 取最大中獎)的中獎資訊
     * @param dataList 工具回傳的單條線上所有的中獎資訊
     * @returns 最終結果
     */
    public getHasWildMultiplierWinData(dataList: WaysWinData[]): WaysWinData {
        let temp: WaysWinData = null;
        for (let item of dataList) {
            const lineWildOdd = this.getHasLineWildMultiplier(item.pos, this.multipleWildPosList);
            item.odd = (item.odd * lineWildOdd).fixed();
            if (temp === null || temp.odd < item.odd) {
                temp = item;
            }
        }
        return temp;
    }

    /**
     * 獲取單條線上有特殊圖示的賠率倍數
     * @param winPos 贏線位置
     * @param multipleWildPosList WILD位置 
     * @returns 最終賠率倍數
     */
    private getHasLineWildMultiplier(winPos: number[], multipleWildPosList: number[]): number {
        let wildOdd: number = 1;
        const wildMultiplierPos: Set<number> = new Set(multipleWildPosList);
        for (let i = 0; i < winPos.length; i++) {
            if (wildMultiplierPos.has(winPos[i])) {
                wildOdd = (wildOdd * 2).fixed();
            }
        }
        return wildOdd.fixed();
    }

    /**
     * 取得連線條件,並回傳贏的圖示,若是不中則回傳負數
     * @param mainSymbolID 當前圖示
     * @param nextSymbolID 下一個圖示
     * @returns 贏的圖示
     */
    private static getConnectCondition(mainSymbolID: number, nextSymbolID: number): number {
        const wild = [8];
        const isEqual: boolean = wild.includes(nextSymbolID) || mainSymbolID === nextSymbolID || wild.includes(mainSymbolID);
        const isLegal: boolean = TestConfig.SCORE_ICON_LIST.includes(nextSymbolID) && TestConfig.SCORE_ICON_LIST.includes(mainSymbolID);
        if (!isLegal || !isEqual) {
            return -1;//回傳負數代表不中
        }
        else {
            return wild.includes(nextSymbolID) ? mainSymbolID : nextSymbolID;
        }
    }

    /**
     * 測試單次盤面贏線資訊
     * @param iconList 中獎圖示表
     */
    public getWinData(iconList: number[]): void {
        let totalOdd: number = 0;
        let winPos: number[] = [];
        const lineWinDataList: ClientLineData[] = [];
        this.multipleWildPosList = [];//如果有WILD要先承上倍數 請先修改multipleWildPosList
        const winData: WaysWinData[] = this.getWaysAllWinData(iconList, TestConfig.REEL_AMOUNT, TestConfig.SYMBOL_LENGTH, this.getBiggerWinData.bind(this));

        for (let item of winData) {
            const lineWinOdd: number = (item.odd * this.getLineMultiplier(item.pos.length)).fixed();
            const lineWinData: ClientLineData = new ClientLineData(item.winLineID, item.symbolID, lineWinOdd, item.pos, item.win2DPos);
            console.log(`第${item.winLineID}線,贏線圖示:${item.symbolID},贏線賠率:${lineWinOdd},贏線位置:${item.pos},贏線2D位置:${item.win2DPos}`);
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

    /**
     * 取得最後的加權倍數
     * @param length 
     * @returns 當條線的加權過後的倍數
     */
    private getLineMultiplier(length: number): number {
        let totalMultiplier: number = 1;
        for (let i = 0; i < length; i++) {
            totalMultiplier *= this.multiplierList[i];
        }
        return totalMultiplier;
    }
}

/**
 * 測試用ClientLineData
 */
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

/**
 * 測試用config
 */
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