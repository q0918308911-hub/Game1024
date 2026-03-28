export class BaseGameConfig {

    public readonly SPECIAL_SYMBOL_LIST: number[] = [];//--特殊模式下才會出現的
    public readonly REEL_RANDOM_LIMIT_LIST: number[] = [];//--每一軸的亂數內容限制
    public readonly REEL_SYMBOL_AMOUNT: number = 0;// reel會顯示出來的icon數量 
    public readonly SP_REEL_ID: number[] = [];//--特殊軸reel id
    public readonly REEL_AMOUNT: number = 0;// 幾個reel(幾個軸)
    public readonly ICONS_LENGTH: number = 0;//盤面總數
    public readonly FLATTEN_REEL_ID: number[] = [];//攤平盤面軸分布
    public readonly WILD_LIST: number[] = [];
    public readonly SCATTER_LIST: number[] = [];
    public readonly BONUS_MULTIPLIER: { [key: number]: number } = {};
    public readonly BONUS_MULTIPLIER_REDUCE: { [key: number]: number } = {};
    public readonly FORECAST_REEL: number = -1;//聽牌軸出現位置(從0開始計算)
    public readonly FORECAST_CONDITION_REEL: number = -1;//啟動聽牌的條件軸(從0開始計算)
    public readonly FORECAST_APPEAR_REEL: number[] = [];//wild可以出現的軸
    public readonly DEFAULT_FG_ROUNDS: number = 0;  // FG預設的次數
    public readonly CLEAR_SYMBOL_LIST: number[] = [];  // 在旋轉期間必須保持清晰狀態的symbol id
    public readonly HIGH_ODDS_SYMBOL_LIST: number[] = []; // 高賠率的icon id (wild不算在內)
    public readonly MIDDLE_ODDS_SYMBOL_LIST: number[] = []; // 中賠率的icon id (wild不算在內)
    public readonly LOW_ODDS_SYMBOL_LIST: number[] = []; // 低賠率的icon id (wild不算在內)
    public readonly REGULAR_ODDS_SYMBOL_LIST: number[] = []; // 正常賠率的icon id(扣除wild/bonus/scatter..等其餘特殊牌)
    public readonly ODD: number[] = [];//--企劃書寫的賠率表
    public readonly SCROLLING_TEXT: string[] = [];//--遊戲下方的跑馬燈訊息
    public readonly BUY_FG_MULTIPLIER: number = 70;//--購買FG的倍率
    public readonly SPECIAL_WIN_THRESHOLD: number = 25;//--大獎的門檻值
    public readonly ALL_SYMBOL_LIST_NG: number[] = [];//--ng模式當中會出現的牌組
    public readonly ALL_SYMBOL_LIST_RE: number[] = [];//--reSpin模式當中會出現的牌組
    public readonly ALL_SYMBOL_LIST_FG: number[] = [];//--fg模式當中會出現的牌組
    public readonly UNIQUE_SYMBOL_LIST_NG: number[][] = [];//--NG模式當中會出現的特殊牌組(包含wild和scatter)
    public readonly UNIQUE_SYMBOL_LIST_RE: number[][] = [];//--RE模式當中會出現的特殊牌組(包含wild和scatter)
    public readonly UNIQUE_SYMBOL_LIST_FG: number[][] = [];//--FG模式當中會出現的特殊牌組(包含wild和scatter)
    public readonly MAXIMUM_FG_TIMES: number = 0;//--FG的最大局數限制
    //=======================特殊軸===============================================
    /**
     * 特殊軸,有別於主盤面的額外盤面(主副盤之分,或是特殊軸的設定)
     */
    public readonly SP_BOARD: BaseGameConfig = null;//--特殊盤面設定
}