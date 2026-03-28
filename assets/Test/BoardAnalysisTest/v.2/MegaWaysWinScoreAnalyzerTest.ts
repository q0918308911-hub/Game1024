import { MegaWaysWinData, MegaWaysWinScoreAnalyzer } from "db://assets/Scripts/ModuleEntry";

export class MegaWaysWinScoreAnalyzerTest extends MegaWaysWinScoreAnalyzer {
    /**
     * 建構子
     */
    constructor() {
        super(TestConfig.WILD_LIST, TestConfig.ODDS_LIST, TestConfig.NORMAL_SYMBOL_LIST);
    }

    /**
     * 測試單次盤面贏分資訊
     * @param iconList 盤面資料
     */
    public getWinData(iconList: number[]) {
        let totalOdd: number = 0;
        let winPos: number[] = [];
        const dataList: ClientData[] = []
        const matchMap: MegaWaysWinData[] = this.getMegaWaysWinData(iconList, TestConfig.REEL_AMOUNT, TestConfig.SYMBOL_LENGTH);
        for (let item of matchMap) {
            const winData = new ClientData(item.winSymbolID, item.odd, item.pos, item.win2DPos);
            console.log(`第${item.winSymbolID}個圖示，贏的賠率${item.odd}，贏的位置${item.pos}，輪播位置${item.oneMatchPos}，2D位置${item.win2DPos}`);
            dataList.push(winData);
        }
        for (let item of dataList) {
            totalOdd = (totalOdd + item.WinOdds).fixed();
            for (let itemPos of item.WinPos) {
                winPos.push(itemPos);
                winPos = winPos.set();
                winPos.sort((a, b) => (a - b));
            }
            for (let itemPos of item.Win2DPos) {
                console.log(`輪播${itemPos}`);
            }
        }
        console.log(`總贏分:${totalOdd},贏線位置${winPos} `);
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
    public static readonly REEL_AMOUNT = 6;
    public static readonly SYMBOL_LENGTH = 8;
    public static readonly WILD_LIST: number[] = [10];
    public static readonly NORMAL_SYMBOL_LIST: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    public static readonly SYMBOL_0_ODDS: number[] = [0, 0, 0.5, 1, 1.5, 2.5];
    public static readonly SYMBOL_1_ODDS: number[] = [0, 0, 0.45, 0.9, 1.35, 1.8];
    public static readonly SYMBOL_2_ODDS: number[] = [0, 0, 0.4, 0.8, 1.2, 1.6];
    public static readonly SYMBOL_3_ODDS: number[] = [0, 0, 0.35, 0.7, 1.05, 1.4];
    public static readonly SYMBOL_4_ODDS: number[] = [0, 0, 0.3, 0.6, 0.9, 1.2];
    public static readonly SYMBOL_5_ODDS: number[] = [0, 0, 0.25, 0.5, 0.75, 1];
    public static readonly SYMBOL_6_ODDS: number[] = [0, 0, 0.2, 0.4, 0.6, 0.8];
    public static readonly SYMBOL_7_ODDS: number[] = [0, 0, 0.15, 0.3, 0.45, 0.6];
    public static readonly SYMBOL_8_ODDS: number[] = [0, 0, 0.1, 0.2, 0.3, 0.4];
    public static readonly SYMBOL_9_ODDS: number[] = [0, 0, 0.05, 0.1, 0.15, 0.2];
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
        this.SYMBOL_9_ODDS,
    ]
}

