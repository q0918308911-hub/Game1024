import { GameRecordAST, IconConfig, IconDataProcessor, Item, SlotDataIconData, SlotDataParser, SlotDataStringType } from "../../Scripts/ModuleEntry";

export const icons: Record<number, IconConfig> = {
    0: { src: "/images/game1015/Symbol_0.png", width: 152, height: 156 },
    1: { src: "/images/game1015/Symbol_1.png", width: 152, height: 156 },
    2: { src: "/images/game1015/Symbol_2.png", width: 152, height: 156 },
    3: { src: "/images/game1015/Symbol_3.png", width: 152, height: 156 },
    4: { src: "/images/game1015/Symbol_4.png", width: 152, height: 156 },
    5: { src: "/images/game1015/Symbol_5.png", width: 152, height: 156 },
    6: { src: "/images/game1015/Symbol_6.png", width: 152, height: 156 },
    7: { src: "/images/game1015/Symbol_7.png", width: 152, height: 156 },
    8: { src: "/images/game1015/Symbol_8.png", width: 152, height: 156 },
    9: { src: "/images/game1015/Symbol_9.png", width: 152, height: 156 },
    10: { src: "/images/game1015/Symbol_10.png", width: 152, height: 156 },
    11: { src: "/images/game1015/Symbol_11.png", width: 152, height: 156 },
    12: { src: "/images/game1015/Symbol_12.png", width: 152, height: 156 },
    13: { src: "/images/game1015/Symbol_13.png", width: 152, height: 156 },
    14: { src: "/images/game1015/Symbol_14.png", width: 152, height: 156 },
};

export class TestReSpinWithIconLayers {

    public game1015SlotParserExample(gameData: GameDataGame, bet: number): GameRecordAST {
        const test = new SlotDataParser(bet);
        let totalWin = 0;

        test.setGameMode("一般遊戲"); //設置遊戲模式
        for (let i = 0; i < gameData.ng.length; i++) {
            totalWin += gameData.ng[i].score;
            const winIconSymbolList = gameData.ng[i].winData.map(winData => winData.winIconSymbolID);
            const odds = gameData.ng[i].winData.map(winData => winData.winOdds.fixed());
            const winCombination = gameData.ng[i].winData.map(winData => winData.winCombination.fixed());
            const winIcon2DPos = this.convertIconPosInToReelPos(gameData.ng[i].winIconPos);
            //設置細單標題
            if (i === 0) {
                test.setTitle([[SlotDataStringType.text, "一般遊戲"]]);
            }
            else {
                test
                    .setTitle([
                        [SlotDataStringType.text, "一般遊戲"],
                        [SlotDataStringType.symbol, "-"],
                        [SlotDataStringType.text, "重新旋轉"],
                        [SlotDataStringType.number, i]
                    ]);
            }

            const items: Item[] = gameData.ng[i].lockIconPos.length - gameData.ng[i].winIconPos.length > 0 ? [
                [SlotDataStringType.icon, 10],
                [SlotDataStringType.symbol, "="],
                [SlotDataStringType.symbol, "("],
                [SlotDataStringType.number, 12 - gameData.ng[i].lockIconPos.length],
                [SlotDataStringType.symbol, "/"],
                [SlotDataStringType.number, 12],
                [SlotDataStringType.symbol, ")"],
            ] : [
                [SlotDataStringType.icon, 10],
                [SlotDataStringType.symbol, "="],
                [SlotDataStringType.number, 2],
                [SlotDataStringType.text, "免費遊戲"],
            ];

            //設置細單
            test
                .processIconData(ConfigGame.REEL_AMOUNT, ConfigGame.REEL_ICON_AMOUNT, gameData.ng[i].result, [
                    test.setMark(winIcon2DPos, "#ff0000"),
                ])
                .setSummary(items)
                .setDetail(gameData.ng[i].isWin, {
                    winIconSymbolList: winIconSymbolList,
                    odds: odds,
                    megaWayCombinationCount: winCombination
                })
                .setSummary([
                    [SlotDataStringType.text, "單次贏分"],
                    [SlotDataStringType.symbol, "="],
                    [SlotDataStringType.number, gameData.ng[i].score]
                ])
                .setLineSummary([
                    [SlotDataStringType.line, [
                        [SlotDataStringType.text, "總贏分"],
                        [SlotDataStringType.symbol, "="],
                        [SlotDataStringType.number, totalWin]
                    ]
                    ],
                    [SlotDataStringType.line, [
                        [SlotDataStringType.text, "Test"],
                        [SlotDataStringType.symbol, "="],
                        [SlotDataStringType.number, 3]
                    ]
                    ]
                ])
                .combineOneRoundData();
        }
        test.setRecords();

        test.setGameMode("免費遊戲");
        for (let i = 0; i < gameData.fg.length; i++) {
            for (let j = 0; j < gameData.fg[i].length; j++) {
                totalWin += gameData.fg[i][j].score;
                const winIconSymbolList = gameData.fg[i][j].winData.map(winData => winData.winIconSymbolID);
                const odds = gameData.fg[i][j].winData.map(winData => winData.winOdds.fixed());
                const winCombination = gameData.fg[i][j].winData.map(winData => winData.winCombination.fixed());
                const winIcon2DPos = this.convertIconPosInToReelPos(gameData.fg[i][j].winIconPos);
                if (j === 0) {
                    test.setTitle([
                        [SlotDataStringType.text, "免費遊戲"],
                        [SlotDataStringType.number, i + 1]
                    ]);
                }
                else {
                    test
                        .setTitle([
                            [SlotDataStringType.text, "免費遊戲"],
                            [SlotDataStringType.number, i + 1],
                            [SlotDataStringType.symbol, "-"],
                            [SlotDataStringType.text, "重新旋轉"],
                            [SlotDataStringType.number, j]
                        ]);
                }
                const addIconList = this.getAddIconList(gameData.fg[i][j].winIconPos, gameData.fg[i][j].result);
                test
                    .processIconData(ConfigGame.REEL_AMOUNT, ConfigGame.REEL_ICON_AMOUNT, gameData.fg[i][j].result, [
                        test.setMark(winIcon2DPos, "#FF0000"),
                        test.addIconList(2, ConfigGame.REEL_AMOUNT, gameData.fg[i][j].winIconPos, addIconList),
                        //this.addIconList2Example(gameData.fg[i][j].winIconPos, gameData.fg[i][j].result)
                    ])
                    .setSummary([
                        [SlotDataStringType.text, "加成倍數"],
                        [SlotDataStringType.symbol, "="],
                        [SlotDataStringType.number, gameData.fg[i][j].multiplyOdds],
                        [SlotDataStringType.symbol, "("],
                        [SlotDataStringType.number, gameData.fg[i][j].orangeHandPrintCount],
                        [SlotDataStringType.symbol, "/"],
                        [SlotDataStringType.number, 5],
                        [SlotDataStringType.symbol, ")"]
                    ])
                    .setSummary([
                        [SlotDataStringType.text, "免費旋轉局數"],
                        [SlotDataStringType.symbol, "="],
                        [SlotDataStringType.number, gameData.fg[i][j].remainCount],
                        [SlotDataStringType.symbol, "("],
                        [SlotDataStringType.number, gameData.fg[i][j].purpleHandPrintCount],
                        [SlotDataStringType.symbol, "/"],
                        [SlotDataStringType.number, 5],
                        [SlotDataStringType.symbol, ")"]
                    ])
                    .setDetail(gameData.fg[i][j].isWin, {
                        winIconSymbolList: winIconSymbolList,
                        odds: odds,
                        megaWayCombinationCount: winCombination
                    })
                    .setSummary([
                        [SlotDataStringType.text, "單次贏分"],
                        [SlotDataStringType.symbol, "="],
                        [SlotDataStringType.number, gameData.fg[i][j].score]
                    ])
                    .setSummary([
                        [SlotDataStringType.text, "總贏分"],
                        [SlotDataStringType.symbol, "="],
                        [SlotDataStringType.number, totalWin]
                    ])
                    .combineOneRoundData();
            }
            test.setRecords();
        }
        const result = test.getFinalSlotData();
        const gameRecordAST: GameRecordAST = {
            ast: result,
            icons: icons
        }
        return gameRecordAST;
    }

    private addIconList2Example(posList: number[], result: number[]): IconDataProcessor {
        return (list) => {
            const newList = [...list];
            for (let i = 0; i < posList.length; i++) {
                const pos = posList[i];
                const MeowData = new SlotDataIconData();
                MeowData.x = Math.floor(pos / ConfigGame.REEL_AMOUNT) + 1;
                MeowData.y = (pos % ConfigGame.REEL_AMOUNT) + 1;
                MeowData.icon = ConfigGame.ORANGE_SYMBOL.includes(result[pos]) ? 13 : 14;
                MeowData.z = 2;
                newList.push(MeowData);
            }
            return newList;
        };
    }

    private getAddIconList(posList: number[], result: number[]): number[] {
        const addIconList: number[] = [];
        for (let i = 0; i < posList.length; i++) {
            const pos = posList[i];
            addIconList.push(ConfigGame.ORANGE_SYMBOL.includes(result[pos]) ? 13 : 14);
        }
        return addIconList;
    }

    private convertIconPosInToReelPos(iconPos: number[]): number[][] {
        const returnPos: number[][] = Array.from({ length: ConfigGame.REEL_AMOUNT }, () => []);
        for (let i = 0; i < iconPos.length; i++) {
            let reelID = Math.floor(iconPos[i] / ConfigGame.REEL_ICON_AMOUNT);
            returnPos[reelID].push(iconPos[i] % ConfigGame.REEL_ICON_AMOUNT);
        }

        return returnPos;
    }
}

export class GameDataGame {
    public ng: RoundResult[] = [];
    public fg: RoundResult[][] = [];
    public fgWin: number = 0;
    public coin: number = 0;
    public bet: number = 0;
    public score: number = 0;
}

export class RoundResult {
    public result: number[] = [];
    public lockIconPos: number[] = [];
    public unLockStartPos: number[] = [];
    public unLockPos: number[] = [];
    public orangeHandPrintCount: number = 0;
    public purpleHandPrintCount: number = 0;
    public multiplyOdds: number = 0;
    public remainCount: number = 0;
    public isWin: boolean = false;
    public winIconPos: number[] = [];
    public winData: WinData[] = [];
    public score: number = 0;
    public odds: number = 0;
}


export class WinData {
    public winIconSymbolID: number = 0;
    public winOdds: number = 0;
    public winCombination: number = 0;
    public orangePos: number[] = [];
    public purplePos: number[] = [];
}


export enum SymbolType {
    AUMO,
    SIAMESE,
    ERHU,
    DAJU,
    D_K,
    C_K,
    D_Q,
    C_Q,
    D_J,
    C_J,
    INFORMATION
}

export namespace ConfigGame {
    export const PROJECT_NAME = "Game1015";  // 遊戲名稱
    export const REEL_AMOUNT: number = 5;  // Slot 的滾輪數
    export const REEL_ICON_AMOUNT: number = 5;  // 每個Column的icon數
    export const ALL_ICONS_AMOUNT: number = REEL_AMOUNT * REEL_ICON_AMOUNT;
    export const SYMBOL_LIST: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    export const INFORMATION_SYMBOL: number = SymbolType.INFORMATION;
    export const BOARD_ORDER: number[] = [0, 5, 10, 15, 20,
        1, 6, 11, 16, 21,
        2, 7, 12, 17, 22,
        3, 8, 13, 18, 23,
        4, 9, 14, 19, 24];
    export const DEFAULT_LOCK_POS: number[] = [0, 1, 3, 4, 5, 9, 15, 19, 20, 21, 23, 24];
    export const FG_DEFAULT_MULTIPLE: number = 2;
    export const FG_DEFAULT_FREE_SPIN: number = 2;
    export const COLLECT_MAX_HAND_PRINT: number = 5;
    export const HIGH_SCORE_SYMBOL: number[] = [SymbolType.AUMO, SymbolType.SIAMESE, SymbolType.ERHU, SymbolType.DAJU];
    export const ORANGE_SYMBOL: number[] = [SymbolType.AUMO, SymbolType.ERHU, SymbolType.D_K, SymbolType.D_Q, SymbolType.D_J];
    export const PURPLE_SYMBOL: number[] = [SymbolType.SIAMESE, SymbolType.DAJU, SymbolType.C_K, SymbolType.C_Q, SymbolType.C_J];
    export const FG_TRANSITION_WAIT_TIME: number = 5;
    export const NORMAL_NEXT_ROUND_DELAY_TIME: number = 0.5;
    export const TURBO_NEXT_ROUND_DELAY_TIME: number = 0.4;

    export const SYMBOL_0_ODDS = [0, 0, 2, 6, 20];
    export const SYMBOL_1_ODDS = [0, 0, 2, 6, 20];
    export const SYMBOL_2_ODDS = [0, 0, 1, 3, 10];
    export const SYMBOL_3_ODDS = [0, 0, 1, 3, 10];
    export const SYMBOL_4_ODDS = [0, 0, 0.32, 0.8, 1.6];
    export const SYMBOL_5_ODDS = [0, 0, 0.32, 0.8, 1.6];
    export const SYMBOL_6_ODDS = [0, 0, 0.28, 0.6, 1.2];
    export const SYMBOL_7_ODDS = [0, 0, 0.28, 0.6, 1.2];
    export const SYMBOL_8_ODDS = [0, 0, 0.24, 0.48, 1];
    export const SYMBOL_9_ODDS = [0, 0, 0.24, 0.48, 1];
    export const ODDS_LIST = [
        SYMBOL_0_ODDS,
        SYMBOL_1_ODDS,
        SYMBOL_2_ODDS,
        SYMBOL_3_ODDS,
        SYMBOL_4_ODDS,
        SYMBOL_5_ODDS,
        SYMBOL_6_ODDS,
        SYMBOL_7_ODDS,
        SYMBOL_8_ODDS,
        SYMBOL_9_ODDS
    ];
}