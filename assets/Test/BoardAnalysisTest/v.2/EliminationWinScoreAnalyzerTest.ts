import { EliminationWinData, EliminationWinScoreAnalyzer } from "../../../Scripts/ModuleEntry";

export class EliminationWinScoreAnalyzerTest extends EliminationWinScoreAnalyzer {
    /**
     * 建構子
     */
    constructor() {
        super(TestConfig.ODDS_LIST, TestConfig.ConnectNumber, EliminationWinScoreAnalyzerTest.getConnectCondition);
    }

    /**
     * 消除成功條件(判斷mainSymbolID是否算在中獎的範圍內，如果要WILD也算，請把WILD圖示加進去SCORE_ICON_LIST，記得賠率那邊也要有WILD的賠率)
     * @param mainSymbolID 主圖示ID
     * @returns 符合消除條件回傳true 不符合回傳false
     */
    private static getConnectCondition(mainSymbolID: number): boolean {
        return TestConfig.SCORE_ICON_LIST.includes(mainSymbolID) ? true : false;
    }

    /**
     * 測試單次盤面贏分資訊
     * @param iconList 盤面資料
     */
    public getWinData(iconList: number[]): void {
        let totalOdd: number = 0;
        let winPos: number[] = [];
        const dataList: ClientData[] = [];
        const winData: EliminationWinData[] = this.getEliminationWinData(iconList, TestConfig.REEL_AMOUNT, TestConfig.SYMBOL_LENGTH, TestConfig.WILD_LIST);
        for (let item of winData) {
            const winData = new ClientData(item.SymbolID, item.Odd, item.Pos, item.Win2DPos);
            console.log(`第${item.SymbolID}個圖示，贏的賠率${item.Odd}，贏的位置${item.Pos}，2D位置${item.Win2DPos}`);
            dataList.push(winData);
        }
        for (let item of dataList) {
            totalOdd = (totalOdd + item.WinOdds).fixed();
            for (let itemPos of item.WinPos) {
                winPos.push(itemPos);
                winPos = winPos.set();
                winPos.sort((a, b) => (a - b));
            }
        }
        console.log(`總贏分:${totalOdd},贏線位置${winPos} `);
        console.log(JSON.stringify(winData));
    }

}

/**
 * 測試用Data
 */
export class ClientData {
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
}

/**
 * 測試用config
 */
export class TestConfig {
    public static readonly REEL_AMOUNT = 5;
    public static readonly SYMBOL_LENGTH = 5;
    public static readonly WILD_LIST: number[] = [8];
    public static readonly SCORE_ICON_LIST: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    public static readonly ConnectNumber: number[] = [5, 6, 7, 8, 9, 11, 13];

    public static readonly SYMBOL_0_ODDS: number[] = [1, 1.5, 2, 3, 10, 30, 100];
    public static readonly SYMBOL_1_ODDS: number[] = [0.5, 0.7, 1, 1.5, 5, 15, 50];
    public static readonly SYMBOL_2_ODDS: number[] = [0.5, 0.7, 1, 1.5, 5, 15, 50];
    public static readonly SYMBOL_3_ODDS: number[] = [0.3, 0.4, 0.5, 0.7, 2.5, 7.5, 25];
    public static readonly SYMBOL_4_ODDS: number[] = [0.3, 0.4, 0.5, 0.7, 2.5, 7.5, 25];
    public static readonly SYMBOL_5_ODDS: number[] = [0.1, 0.2, 0.3, 0.5, 1.5, 5, 15];
    public static readonly SYMBOL_6_ODDS: number[] = [0.1, 0.2, 0.3, 0.5, 1.5, 5, 15];
    public static readonly SYMBOL_7_ODDS: number[] = [0.1, 0.2, 0.3, 0.5, 1.5, 5, 15];
    public static readonly SYMBOL_8_ODDS: number[] = [1, 1, 1, 1, 1, 1, 1];
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
}