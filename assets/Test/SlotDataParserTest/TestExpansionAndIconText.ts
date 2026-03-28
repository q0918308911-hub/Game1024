import { GameRecordAST, IconConfig, IconDataProcessor, Item, Line, SlotDataGameModeType, SlotDataIconData, SlotDataParser, SlotDataStringType } from "../../Scripts/ModuleEntry";

export const icons: Record<number, IconConfig> = {
    0: { src: "/images/game1014/Symbol_0.png", width: 152, height: 156 },
    1: { src: "/images/game1014/Symbol_1.png", width: 152, height: 156 },
    2: { src: "/images/game1014/Symbol_2.png", width: 152, height: 156 },
    3: { src: "/images/game1014/Symbol_3.png", width: 152, height: 156 },
    4: { src: "/images/game1014/Symbol_4.png", width: 152, height: 156 },
    5: { src: "/images/game1014/Symbol_5.png", width: 152, height: 156 },
    6: { src: "/images/game1014/Symbol_6.png", width: 152, height: 156 },
    7: { src: "/images/game1014/Symbol_7.png", width: 152, height: 156 },
    8: { src: "/images/game1014/Symbol_8.png", width: 152, height: 156 },
    9: { src: "/images/game1014/Symbol_9.png", width: 152, height: 156 },
    10: { src: "/images/game1014/Symbol_10.png", width: 152, height: 156 },
    11: { src: "/images/game1014/Symbol_11_mini.png", width: 152, height: 156 },
    12: { src: "/images/game1014/Symbol_11_major.png", width: 152, height: 156 },
};

export class TestExpansionAndIconText {

    public game1014SlotParserExample(gameResult: GameResultData): GameRecordAST {
        const parser = new SlotDataParser(gameResult.Bet);
        let freeGameCount = 0;
        let bonusGameCount = 0;
        let totalWin = 0;
        let currentGameMode: SlotDataGameModeType = SlotDataGameModeType.normal;
        for (let i = 0; i < gameResult.RoundData.length; i++) {
            const roundData = gameResult.RoundData[i];
            const isFGOverToBG = i > gameResult.LastFGIndex;
            const roundTitle = this.getGameTitle(roundData.GameMode, currentGameMode, bonusGameCount, freeGameCount);
            const lineList = this.getDetailDescriptionList(roundData.WinData.DetailWinData, gameResult.Bet);
            const iconList = roundData.IconList.length !== 7 ? roundData.IconList : this.elongatedArray(roundData.IconList);
            const merges = roundData.IconList.length !== 7 ? Array(15).fill(0) : [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0];
            const hasBigGameIcon = roundData.IconList.length === 7;
            const win = (roundData.WinData.AllWinOdd * gameResult.Bet).fixed();
            totalWin += win;
            const roundWinItem = this.getWinDescription("單次贏分", win);
            const totalWinItem = this.getWinDescription("總贏分", totalWin);
            if (roundData.GameMode === GameMode.NormalGame || (isFGOverToBG)) {
                currentGameMode = SlotDataGameModeType.normal;
                parser.setGameMode(currentGameMode);
            }
            else if (roundData.GameMode === GameMode.FreeGame && currentGameMode !== SlotDataGameModeType.free) {
                currentGameMode = SlotDataGameModeType.free;
                parser.setGameMode(currentGameMode);
            }
            else if (roundData.GameMode === GameMode.BonusGame && currentGameMode !== SlotDataGameModeType.bonus) {
                currentGameMode = SlotDataGameModeType.bonus;
                parser.setGameMode(currentGameMode);
            }
            parser.setTitle(roundTitle)
            parser.processIconData(GameConfig.ROW, GameConfig.COLUMNS, iconList, [
                parser.setMark(roundData.WinData.AllWin2DPos, '#97aadfff'),
                parser.mergesIconData(merges),
                this.setIconText(gameResult.Bet, hasBigGameIcon),
            ])
            parser.setDetailDescription(lineList)
            parser.setSummary(roundWinItem)
            parser.setSummary(totalWinItem)
            parser.combineOneRoundData();
            parser.setRecords();
        }
        const finalSltData = parser.getFinalSlotData();
        const gameRecordAST: GameRecordAST = {
            ast: finalSltData,
            icons: icons
        }
        return gameRecordAST;
    }

    private getGameTitle(gameMode: GameMode, currentGameMode: SlotDataGameModeType, bonusGameCount: number, freeGameCount: number): Item[] {
        if (gameMode === GameMode.FreeGame) {
            bonusGameCount = 0;
            freeGameCount++;
            return [
                [SlotDataStringType.text, currentGameMode],
                [SlotDataStringType.number, freeGameCount.toString()]
            ];
        }
        else if (gameMode === GameMode.BonusGame) {
            bonusGameCount++;
            return [
                [SlotDataStringType.text, currentGameMode],
                [SlotDataStringType.number, bonusGameCount.toString()]
            ];
        }
        else {
            return [
                [SlotDataStringType.text, currentGameMode]
            ];
        }
    }

    private getDetailDescriptionList(detailData: DetailWinData[], bet: number): Line[] {
        const descriptionList: Line[] = [];
        for (let i = 0; i < detailData.length; i++) {
            if (detailData[i].WinLineNumber !== -1) {
                const line: Line =
                    [
                        SlotDataStringType.line, [
                            [SlotDataStringType.icon, detailData[i].WinIcon],
                            [SlotDataStringType.number, bet],
                            [SlotDataStringType.symbol, "*"],
                            [SlotDataStringType.number, detailData[i].WinOdd],
                            [SlotDataStringType.symbol, "="],
                            [SlotDataStringType.number, (detailData[i].WinOdd * bet).fixed()],
                            [SlotDataStringType.symbol, "("],
                            [SlotDataStringType.text, "線"],
                            [SlotDataStringType.number, detailData[i].WinLineNumber + 1],
                            [SlotDataStringType.symbol, ")"]
                        ]
                    ]
                descriptionList.push(line);
            }
        }
        return descriptionList;
    }

    private getWinDescription(text: string, score: number): Item[] {
        return [
            [SlotDataStringType.text, text],
            [SlotDataStringType.symbol, "="],
            [SlotDataStringType.number, score]
        ]
    }

    private elongatedArray(data: number[]) {
        const newData: number[] = [...data];
        const thirdElement: number = newData[3];
        newData.splice(4, 0, ...Array(8).fill(thirdElement));
        return newData;
    }

    private setIconText(bet: number, hasBigGameIcon: boolean): IconDataProcessor {
        return (list: SlotDataIconData[]) => {
            const newIconLIst = [...list];
            for (let i = 0; i < newIconLIst.length; i++) {
                if (newIconLIst[i].icon >= IconList.BG1) {
                    const isBigIcon = hasBigGameIcon && i === 3;
                    const text = this.formatScoreWithSuffix(newIconLIst[i].icon, bet, isBigIcon);
                    if (newIconLIst[i].icon === IconList.BG_MAJOR) {
                        newIconLIst[i].icon = 12;
                    }
                    else if (newIconLIst[i].icon === IconList.BG_MINI) {
                        newIconLIst[i].icon = 11;
                    }
                    else {
                        newIconLIst[i].icon = IconList.BG1;
                    }
                    newIconLIst[i].text = text;
                    newIconLIst[i].textSize = isBigIcon ? 6 : 2;
                }
            }
            return newIconLIst;
        }
    }

    private formatScoreWithSuffix(symbolId: number, bet: number, isBigIcon: boolean): string {
        const suffixes = ['', 'k', 'm', 't'];
        let suffixIndex = 0;
        let multiple = (isBigIcon) ? GameConfig.BigMoonIconMultiplier : 1;
        let score = GameConfig.getBGMultiplier(symbolId) * bet * multiple;

        while (score >= GameConfig.Thousand && suffixIndex < suffixes.length - 1) {
            score /= GameConfig.Thousand;
            suffixIndex++;
        }
        return score.fixed() + suffixes[suffixIndex];
    }
}


export class GameResultData {
    public readonly RoundData: RoundData[] = [];
    public readonly LastFGIndex: number = 0;
    public readonly FinalWin: number = 0;
    public readonly Bet: number = 0;
    public readonly FinalWinOdds: number = 0;

    constructor(roundData: RoundData[], finalWinOdds: number, lastFGIndex: number, bet: number) {
        this.RoundData = roundData;
        this.FinalWinOdds = finalWinOdds;
        this.LastFGIndex = lastFGIndex;
        this.Bet = bet;
        this.FinalWin = (finalWinOdds * bet).fixed();
    }
}

export class RoundData {
    public readonly GameMode: GameMode;
    public readonly IconList: number[] = [];
    public readonly ReadyHandData: ReadyHandData = null;
    public readonly WinData: GameWinData = null;
    public readonly ReelSingleData: ReelIconIndexData = null;
    public readonly FlagData: FlagData = null;
    public readonly SpecialGameCount: number = 0;
    public readonly BGTriggerData: DetailWinData[] = [];

    constructor(gameMode: GameMode, iconList: number[], readyHandIndex: ReadyHandData, winData: GameWinData
        , reelSingleData: ReelIconIndexData, flagData: FlagData, showGameCount: number, bgTriggerData: DetailWinData[]) {
        this.GameMode = gameMode;
        this.IconList = iconList;
        this.ReadyHandData = readyHandIndex;
        this.WinData = winData;
        this.ReelSingleData = reelSingleData;
        this.FlagData = flagData;
        this.SpecialGameCount = showGameCount;
        this.BGTriggerData = bgTriggerData;
    }
}

export class ReadyHandData {
    public readonly ReadyHandIndex: number = 0;
    public readonly FGReadyHandIndex: number = 0;
    public readonly BGReadyHandIndex: number = 0;

    constructor(readyHandIndex: number, fgReadyHand: number, bgReadyHand: number) {
        this.ReadyHandIndex = readyHandIndex;
        this.FGReadyHandIndex = fgReadyHand;
        this.BGReadyHandIndex = bgReadyHand;
    }
}

export class GameWinData {
    public readonly AllWinPos: number[] = [];
    public readonly AllWinOdd: number = 0;
    public readonly AllWin2DPos: number[][] = [];
    public readonly DetailWinData: DetailWinData[] = [];

    constructor(winIndex: number[], winOdd: number, allWin2DPos: number[][], detailWinData: DetailWinData[]) {
        this.AllWinPos = winIndex;
        this.AllWinOdd = winOdd;
        this.AllWin2DPos = allWin2DPos;
        this.DetailWinData = detailWinData;
    }
}

export class DetailWinData {
    public readonly WinIcon: number = 0;
    public readonly WinOdd: number = 0;
    public readonly WinLineNumber: number = 0;
    public readonly WinPos: number[] = [];
    public readonly Win2DPos: number[][] = [];

    constructor(winIcon: number, winOdd: number, winLineNumber: number, winPos: number[], win2DPos: number[][]) {
        this.WinIcon = winIcon;
        this.WinOdd = winOdd;
        this.WinLineNumber = winLineNumber;
        this.WinPos = winPos;
        this.Win2DPos = win2DPos;
    }
}

export class ReelIconIndexData {
    public readonly FGIcon: number[][] = [];
    public readonly BGIcon: number[][] = [];

    constructor(fgIndex: number[][], bgIndex: number[][]) {
        this.FGIcon = fgIndex;
        this.BGIcon = bgIndex;
    }
}

export class FlagData {
    public readonly HasFG: boolean = false;
    public readonly HasBG: boolean = false;
    public readonly HasBGFull: boolean = false;

    constructor(hasFG: boolean, hasBG: boolean, hasBGFull: boolean = false) {
        this.HasFG = hasFG;
        this.HasBG = hasBG;
        this.HasBGFull = hasBGFull;
    }
}

export enum GameMode {
    NormalGame = 0,
    FreeGame = 1,
    BonusGame = 2,
}

export enum IconList {
    Man = 0,
    Woman,
    Gun,
    Shoe,
    A,
    K,
    Q,
    J,
    DoubleGun,
    Badge,
    BG1,
    BG2,
    BG3,
    BG4,
    BG5,
    BG6,
    BG7,
    BG8,
    BG10,
    BG14,
    BG16,
    BG18,
    BG20,
    BG_MINI,
    BG_MAJOR,
    BGNull,
}

export namespace GameConfig {
    export const ROW: number = 3;
    export const COLUMNS: number = 5;
    export const FREE_GAME_COLUMNS: number = 3;
    export const SECOND_ROUND_INIT: number = 2;
    export const Thousand: number = 1000;
    export const BigMoonIconMultiplier: number = 9;

    export const ICON_NUMBER: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 9];
    export const BG_RandomICON_NUMBER: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7];
    export const WILD_NUMBER: number[] = [IconList.Badge];
    export const FREE_GAME_ICON_START_IDX = IconList.DoubleGun;
    export const BONUS_GAME_ICON_START_IDX = IconList.BG1;
    export const NG_Icon_Number: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    export const BG_Icon_Number: number[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    export const Free_GAME_ODDS: number[] = [1];
    export const BONUS_GAME_ODDS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 10, 14, 16, 18, 20, 30, 100, 0];
    export const MegaWIN_ODDS: number[] = [1000];
    export const SYMBOL_0_ODDS: number[] = [0, 0, 1, 10, 20];
    export const SYMBOL_1_ODDS: number[] = [0, 0, 0.8, 6, 16];
    export const SYMBOL_2_ODDS: number[] = [0, 0, 0.6, 4, 12];
    export const SYMBOL_3_ODDS: number[] = [0, 0, 0.4, 2, 8];
    export const SYMBOL_4_ODDS: number[] = [0, 0, 0.4, 0.8, 2];
    export const SYMBOL_5_ODDS: number[] = [0, 0, 0.2, 0.8, 2];
    export const SYMBOL_6_ODDS: number[] = [0, 0, 0.2, 0.8, 2];
    export const SYMBOL_7_ODDS: number[] = [0, 0, 0.2, 0.8, 2];
    export const SYMBOL_8_ODDS: number[] = [0, 0, 0, 0, 0];
    export const SYMBOL_9_ODDS: number[] = [0, 0, 1, 10, 20];
    export const ODDS_LIST: number[][] = [
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

    export const PAY_LINE_1: number[] = [1, 4, 7, 10, 13];
    export const PAY_LINE_2: number[] = [0, 3, 6, 9, 12];
    export const PAY_LINE_3: number[] = [2, 5, 8, 11, 14];
    export const PAY_LINE_4: number[] = [0, 4, 8, 10, 12];
    export const PAY_LINE_5: number[] = [2, 4, 6, 10, 14];
    export const PAY_LINE_6: number[] = [1, 3, 6, 9, 13];
    export const PAY_LINE_7: number[] = [1, 5, 8, 11, 13];
    export const PAY_LINE_8: number[] = [0, 3, 7, 11, 14];
    export const PAY_LINE_9: number[] = [2, 5, 7, 9, 12];
    export const PAY_LINE_10: number[] = [1, 5, 7, 9, 13];
    export const PAY_LINE_11: number[] = [1, 3, 7, 11, 13];
    export const PAY_LINE_12: number[] = [0, 4, 7, 10, 12];
    export const PAY_LINE_13: number[] = [2, 4, 7, 10, 14];
    export const PAY_LINE_14: number[] = [0, 4, 6, 10, 12];
    export const PAY_LINE_15: number[] = [2, 4, 8, 10, 14];
    export const PAY_LINE_16: number[] = [1, 4, 6, 10, 13];
    export const PAY_LINE_17: number[] = [1, 4, 8, 10, 13];
    export const PAY_LINE_18: number[] = [0, 3, 8, 9, 12];
    export const PAY_LINE_19: number[] = [2, 5, 6, 11, 14];
    export const PAY_LINE_20: number[] = [0, 5, 8, 11, 12];
    export const PAY_LINE_21: number[] = [2, 3, 6, 9, 14];
    export const PAY_LINE_22: number[] = [1, 5, 6, 11, 13];
    export const PAY_LINE_23: number[] = [1, 3, 8, 9, 13];
    export const PAY_LINE_24: number[] = [0, 5, 6, 11, 12];
    export const PAY_LINE_25: number[] = [2, 3, 8, 9, 14];

    export const PAY_TABLE: number[][] = [
        PAY_LINE_1, PAY_LINE_2, PAY_LINE_3, PAY_LINE_4, PAY_LINE_5, PAY_LINE_6,
        PAY_LINE_7, PAY_LINE_8, PAY_LINE_9, PAY_LINE_10, PAY_LINE_11, PAY_LINE_12,
        PAY_LINE_13, PAY_LINE_14, PAY_LINE_15, PAY_LINE_16, PAY_LINE_17, PAY_LINE_18,
        PAY_LINE_19, PAY_LINE_20, PAY_LINE_21, PAY_LINE_22, PAY_LINE_23, PAY_LINE_24,
        PAY_LINE_25
    ];

    export function getBGMultiplier(icon: number): number {
        return BONUS_GAME_ODDS[icon - BONUS_GAME_ICON_START_IDX];
    }
}

