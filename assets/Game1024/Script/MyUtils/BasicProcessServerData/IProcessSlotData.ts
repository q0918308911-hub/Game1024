export interface IMachPosInfo {
    realSymbolID: number; //--圖示id(真實在盤面上呈現的)
    reelIndex: number; //--軸的index
    iconIndex: number; //--圖示在軸上的位置
}
export interface IMatchInfoForRound {
    odd: number;//--這條線中獎的賠率
    /**
     * 有可是多維陣列的情況
     * 在重複相同的symbol的情況下,會把相同的symbol的連線資料放在一起
     */
    matchPos: IMachPosInfo[];//--會有多條線中線的情況
    winSymbolID: number;//--匹配到的那個symbol id(wild有可能取代成這個)
    isWild: boolean;//--是否是wild取代牌而中線(中線表演要的)
    winLineID: number; //--對應連線的編號清單(這個是用來做表演用的)
    winWays: number;//--這條線中獎的組合數(連線數)
    multiplier: number;//--這條線的倍數(有些遊戲會有倍數的概念)--後期加工組裝(每款遊戲都不同)
}

//export type Direction = 'upward' | 'downward' | 'unknown';

export enum Direction {
    UPWARD = 'upward',
    DOWNWARD = 'downward',
    UNKNOWN = 'unknown'
}


export interface IRoundDataReelInfo {
    symbolData1ds: number[];//--盤面資料(原始的一維陣列)
    symbolData2ds: number[][];//--原始盤面資料(2D陣列)
    haveForecast: boolean;//--是否有預測
}
//--將wild的資料獨立出來
export interface IWildData {
    wildCount: number;//--wild的數量
    wildIndex: {
        reelIndex: number,
        iconIndex: number
    }[];//--wild的index
}

export interface IScatterData {
    scatterCount: number;//--scatter的數量
    scatterIndex: {
        reelIndex: number,
        iconIndex: number
    }[];//--scatter的index
}

//======wildGroup===========================================================
export interface IMatchWildGroupResult {
    reelIndex: number;//--有wild的軸
    groupIndex: number;//--這一組的index
    matchIndices: number[];//--這一組wild相連的index
    direction: Direction;//--這一組wild的方向(向上或向下)
    startIndex: number;//--這一組wild的起始位置
}

export interface IRoundDataWithWildInfo extends IRoundDataReelInfo {
    wildGroup: IMatchWildGroupResult[];//--wild相連的群組資料(包含方向性和起始位置)
}

//--放變形前後的資料(算分前準備..算分要拿位移後的資料)
export interface IMovementGridData extends IRoundDataWithWildInfo {
    afterMovedSymbolData2ds: number[][];//--移動後的盤面資料(2D陣列)
    afterMovedSymbolData1ds: number[];//--攤平後的盤面資料(1D陣列)
}




//--移動後才開始算分
export interface IProcessSlotData {

    betValue: number;
    totalOdd: number;//-這個是目前這個資料的總賠率(在FG當中是要乘上multiplier)
    winLine: IMatchInfoForRound[];
    reelInfo: IRoundDataReelInfo;//--盤面資料(一般狀態)
    multiplier: number;//--倍數(只有fg會用到)
    round: number;//--第幾局

    //scatterCount: number;//--scatter的數量(原有盤面持有的數量)
    //scatterCountForNew: number;//--scatter的數量(單局新增(位移後))
    //beginningWholeWildCount: number;//--初始盤面整輪wild的數量
    //beginningReSpinCount: number;//--初始盤面reSpin的次數
    //afterMovedWholeWildCount: number;//--移動後的盤面wild的數量(新增)
    //afterMovedReSpinCount: number;//--移動後的盤面reSpin的次數(新增)
    //--FG計算方式->scatter=1, wholeWild=1,相加後的次數3=7局,4=9局,5=11局
    //freeGameCount: number;//--freeGame的次數(截至目前為止的累計)
    //freeGameCountForNew: number;//--freeGame的次數(單局新增)
    //reelInfo: IMovementGridData;//---盤面資料(包含一班狀態和位移後的狀態)

}



export interface IProcessFGData extends IProcessSlotData {
    roundSingleScore: number;//--單局的總額(金額)
    totalFGRoundScore: number;//--總額(所有局數的總額(累積)) 
}



export class BasicProcessSlotData {
    public reSpinReelInfo: IProcessSlotData[] = [];//--reSpine 這邊有多少就塞多少IProcessSlotData進去
    public freeGameReelInfo: IProcessSlotData[] = []; //--freeGame 這邊有多少就塞多少IProcessFGData
    public ngReelInfo: IProcessSlotData[] = [];//--NG使用的,消除類型遊戲一局會有多個
    public allRoundOdds: number = 0;//----這個是目前這個資料的總賠率(NG+FG+reSpine)
    public totalOddsForNg: number = 0;//--ng的總賠率
    public totalOddsForReSpin: number = 0;//--reSpin的總賠率
    public totalOddsForFG: number = 0;//--fg的總賠率
    public betValue: number = 0;//--default=0

    /**
     * 20260108
     * 當前的round與下一把不同時,就代表無法在消除,要旋轉盤面清除資料了
     * PS:清除盤面開啟下一輪旋轉不代表整張表用完了,直到整張表的資料取完後
     * 才需要再向server要新的資料
     *  這兩個相加才是真正的FG局數(spin4_fgCount+totalFgRounds)
     */
    public totalFgRounds: number = 0;//--fg的總局數
    public totalNgRounds: number = 0;//--ng的總局數
}