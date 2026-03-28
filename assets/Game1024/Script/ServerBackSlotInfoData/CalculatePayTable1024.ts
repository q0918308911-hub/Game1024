import { MegaWaysWinScoreAnalyzer, MegaWaysWinData } from 'db://assets/Scripts/GameScripts/BoardAnalysis/v1';

export class CalculatePayTable1024 extends MegaWaysWinScoreAnalyzer {

    constructor() {
        super(Game1024PayConfig.WILD_LIST, Game1024PayConfig.ODDS_LIST, Game1024PayConfig.NORMAL_SYMBOL_LIST);
    }

    public getWindData(iconData: number[]): AwardData {
        const clientDataList: ClientData[] = [];
        let totalOdd = 0;
        const machMap: MegaWaysWinData[] = this.getMegaWaysWinData(iconData, Game1024PayConfig.REEL_AMOUNT, Game1024PayConfig.SYMBOL_LENGTH);

        //--winData{pos=一維陣列的位置,win2DPos=二維陣列的位置(依照順序從頭開始排列)}
        /**
         * Win2DPos=[1][2][3][4][5]
         * 每個陣列表示每個reel依照順序(要相連才會達成.所以一定照順序排列)
         * 每個陣列表示每個reel,裡面的數字表示該symbol在reel裡面的index的圖示位置
         */

        for (let i: number = 0; i < machMap.length; i++) {
            const item = machMap[i];
            //--攤平2dPos
            //const flatWin2DPos = item.win2DPos.reduce((acc, row) => acc.concat(row), []);
            const winData = new ClientData(item.WinSymbolID, item.Odd, item.Pos, item.Win2DPos);
            winData.waysCount = this.getWaysCountFrom2DPos(item.Win2DPos);
            totalOdd = (totalOdd + item.Odd).fixed();
            clientDataList.push(winData);
        }

        const finalData = new AwardData();
        finalData.totalOdd = totalOdd;
        finalData.dataList = clientDataList;
        return finalData;
    }

    //--取得連線軸的組合數
    private getWaysCountFrom2DPos(win2DPos: number[][]): number {

        let waysCount = 1;
        for (let i = 0; i < win2DPos.length; i++) {
            const reelPos = win2DPos[i];
            if (reelPos.length > 0) {
                waysCount *= reelPos.length;
            } else {
                //--中斷
                break;
            }
        }
        return waysCount;
    }
}

export class ClientData {

    public readonly WinSymbolID: number = 0;
    public readonly WinOdds: number = 0;
    public readonly WinPos: number[] = [];
    public readonly Win2DPos: number[][] = [];
    public waysCount: number = 0;


    constructor(winSymbolID: number, winOdds: number, winPos: number[], win2DPos: number[][]) {

        this.WinSymbolID = winSymbolID;
        this.WinOdds = winOdds;
        this.WinPos = winPos;//--1ds index
        this.Win2DPos = win2DPos;//--這個是每一軸的第幾個(沒有就是空的)-2ds

    }
}

export class AwardData {

    public totalOdd: number = 0;
    public dataList: ClientData[] = [];

}

export class Game1024PayConfig {

    public static readonly REEL_AMOUNT = 6;
    public static readonly SYMBOL_LENGTH = 8;
    public static readonly NORMAL_SYMBOL_LIST: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    //--PS-wild9=經書,wild10=唐僧(不算分但是要非常小小它的位置)
    public static readonly WILD_LIST: number[] = [9];//--WILD 
    public static readonly SYMBOL_0_ODDS: number[] = [0, 0.2, 0.5, 1, 2.5, 5];//--孫悟空
    public static readonly SYMBOL_1_ODDS: number[] = [0, 0, 0.4, 0.8, 2, 4];//--八戒
    public static readonly SYMBOL_2_ODDS: number[] = [0, 0, 0.3, 0.6, 1.5, 3];//--沙悟淨
    public static readonly SYMBOL_3_ODDS: number[] = [0, 0, 0.2, 0.4, 1, 2];//--白龍馬
    public static readonly SYMBOL_4_ODDS: number[] = [0, 0, 0.1, 0.2, 0.5, 1];//--A
    public static readonly SYMBOL_5_ODDS: number[] = [0, 0, 0.08, 0.16, 0.4, 0.8];//--K
    public static readonly SYMBOL_6_ODDS: number[] = [0, 0, 0.06, 0.12, 0.3, 0.6];//--Q
    public static readonly SYMBOL_7_ODDS: number[] = [0, 0, 0.05, 0.1, 0.25, 0.5];//--J
    public static readonly SYMBOL_8_ODDS: number[] = [0, 0, 0.04, 0.08, 0.2, 0.4];//--10
    public static readonly ODDS_LIST: number[][] = [
        this.SYMBOL_0_ODDS,
        this.SYMBOL_1_ODDS,
        this.SYMBOL_2_ODDS,
        this.SYMBOL_3_ODDS,
        this.SYMBOL_4_ODDS,
        this.SYMBOL_5_ODDS,
        this.SYMBOL_6_ODDS,
        this.SYMBOL_7_ODDS,
        this.SYMBOL_8_ODDS
    ]

}

