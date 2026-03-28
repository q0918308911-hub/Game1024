import { BaseGameConfig } from '../MyUtils/BasicGameConfig/BasicGameConfig';

/**
 * 主盤面設定資料
 */
export class DefinitionGameConfigData1024 extends BaseGameConfig {

    override readonly REEL_AMOUNT = 6;
    override readonly REEL_RANDOM_LIMIT_LIST = [7, 6, 6, 6, 6, 7];//--每一軸的亂數內容長度限制
    override readonly REEL_SYMBOL_AMOUNT = -1;
    override readonly SP_REEL_ID = [6]; //--特殊軸reel id
    override readonly ICONS_LENGTH = this.REEL_AMOUNT * this.REEL_SYMBOL_AMOUNT;
    override readonly FLATTEN_REEL_ID = [0, 1, 2, 3, 4, 5]; // 攤平盤面軸分布
    //override readonly HIGH_ODDS_SYMBOL_LIST = [0, 1, 2]; // 高賠率符號列表
    //override readonly MIDDLE_ODDS_SYMBOL_LIST = [3, 4]; // 中賠率符號列表
    //override readonly LOW_ODDS_SYMBOL_LIST = [5, 6, 7, 8]; // 低賠率符號列表
    override readonly WILD_LIST = [9]; // Wild symbol ID
    override readonly SCATTER_LIST = [11]; // Scatter symbol ID
    override readonly MAXIMUM_FG_TIMES = 22;
    //override readonly REGULAR_ODDS_SYMBOL_LIST = [3, 4, 5, 6, 7, 8]; // 正常賠率的icon id(扣除wild/bonus/scatter..等其餘特殊牌)
    //override readonly FORECAST_CONDITION_REEL = 1; // 從0開始(之後的軸依序聽牌)
    //override readonly FORECAST_REEL = 2; // 從0開始(2-3軸依序聽牌)
    //override readonly FORECAST_APPEAR_REEL = [1, 2, 3]; // 從0開始 (1-3軸可以出現wild)
    override readonly SCROLLING_TEXT = ['GameMsg_1016_1_1', 'GameMsg_1016_1_2', 'GameMsg_1016_1_3']; // 遊戲內的跑馬燈
    override readonly ALL_SYMBOL_LIST_NG = [0, 1, 2, 3, 4, 5, 6, 7, 8];//--ng模式當中會出現的牌組
    override readonly ALL_SYMBOL_LIST_FG = [0, 1, 2, 3, 4, 5, 6, 7, 8];//--fg模式當中會出現的牌組
    override readonly UNIQUE_SYMBOL_LIST_NG = [[11], [11], [11], [11], [11], [11]];//--NG模式當中會出現的特殊牌組(包含wild和scatter)
    override readonly UNIQUE_SYMBOL_LIST_FG = [[], [], [], [], [], []];//--FG模式當中會出現的特殊牌組(包含wild和scatter)
    override readonly SP_BOARD = new SUP_SP_DefinitionGameConfigData1024();//--特殊盤面設定

}

export class SUP_SP_DefinitionGameConfigData1024 extends BaseGameConfig {

    override readonly REEL_AMOUNT = 1; // 特殊軸reel數量
    override readonly REEL_SYMBOL_AMOUNT = 4; // 特殊軸reel會顯示出來的icon數量
    override readonly ICONS_LENGTH = this.REEL_AMOUNT * this.REEL_SYMBOL_AMOUNT;
    override readonly REEL_RANDOM_LIMIT_LIST = [4];//--每一軸的亂數內容長度限制(副盤)
    override readonly FLATTEN_REEL_ID = [0]; // 攤平盤面軸分布
    override readonly ALL_SYMBOL_LIST_NG = [0, 1, 2, 3, 4, 5, 6, 7, 8];//--ng模式當中會出現的牌組
    override readonly ALL_SYMBOL_LIST_FG = [0, 1, 2, 3, 4, 5, 6, 7, 8];//--fg模式當中會出現的牌組
    //---FG當中主副盤都會出現wild--
    override readonly UNIQUE_SYMBOL_LIST_NG = [[9, 10]];//--特殊軸NG模式當中會出現的特殊牌組(包含wild和scatter)
    override readonly UNIQUE_SYMBOL_LIST_FG = [[9, 10, 12]];//--特殊軸FG模式當中會出現的特殊牌組(包含wild和scatter)

}