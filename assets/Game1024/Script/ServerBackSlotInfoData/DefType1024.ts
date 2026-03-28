import { IProcessSlotData, IWildData, IScatterData, BasicProcessSlotData } from "../MyUtils/BasicProcessServerData/IProcessSlotData";
import { ITwoDCoordinate } from "./ProcessDataTools";
import { AwardData } from "./CalculatePayTable1024";

export interface ISpMonkList {
    reelIndex: number; //--有唐僧的軸
    iconIndex: number; //--唐僧的icon index
    //additionalWildIndex: number[]; //--這是要顯示新補牌的wild
}

export interface ITemporaryRoundData {


    //--20260318 NEW:新增比倍資料
    isSuccessDoubleGame: boolean;//--是否比倍成功
    doubleGameResultFgCount: number;//--比倍遊戲結果的FG局數(預設狀態是-1,代表還沒進行比倍遊戲)

    betValue: number;
    totalOdd: number;//-這個是目前這個資料的總賠率(在FG當中是要乘上multiplier)
    //symbolData1ds: number[];//--盤面資料(原始的一維陣列)
    symbolData2ds: number[][];//--原始盤面資料(2D陣列)
    round: number;//--第幾局
    winDataList: AwardData,
    spin4Count: number;//--spin4的數量
    reFillData: {
        reFillTopInfo: {//--上方副盤的資料
            removeData: number[],
            reFillData: number[]
        },
        reFillInfo: { reel: number, data: number[] }[]
    };
    scatterInfo: {
        scatterCount: number;//--scatter的數量
        scatterIndex: {
            reelIndex: number,
            iconIndex: number
        }[];//--scatter的index
    }
    wildInfo: {
        //symbolData1ds: number[];//--盤面資料(原始的一維陣列)
        symbolData2ds: number[][];//--原始盤面資料(2D陣列)-填充後的盤面
        reFillData: {
            reFillTopInfo: {//--上方副盤的資料(--記錄捕牌軸(副盤)與填充資料)
                removeData: number[],//-紀錄被移除的<軸-位置>資料
                reFillData: number[]//--紀錄補入的<對應symbol>資料(他不會對應位置,會從後面補)
            },
            reFillInfo: { reel: number, data: number[] }[],
            //--wild重新填充
            reFillWildInfo: {
                reel: number,//--wild補牌的軸
                data: number[],//--整軸的補牌資料(完整)
                wildCount: number,//--wild補牌數量
                wildIndex: number[]//--wild補牌所在位置
            }[]

        };
        scatterInfo: {
            scatterCount: number;//--scatter的數量
            scatterIndex: {
                reelIndex: number,
                iconIndex: number
            }[];//--scatter的index
        }
        winDataList: AwardData,
    };
}


export interface IMoveReFillData {

    next: number[][], //---board(after refill)
    reFillTopInfo: {
        removeData: number[],
        reFillData: number[]
    };
    reFillInfo: { reel: number, data: number[] }[],
    index: number//--slice index
}

export interface IDropWildInfo extends IProcessSlotData {
    monkInfo: {
        reelIndex: number, //--有唐僧的軸
        iconIndex: number
    }[], //--唐僧的icon index}[]; 
    wildInfo: IWildData,
    scatterInfo: IScatterData
}

//--注單顯示使用
export interface IDropRecord extends IProcessSlotData {

    monkInfo: {
        reelIndex: number, //--有唐僧的軸
        iconIndex: number
    }[],

    wildReFill: IDropWildInfo;//--有無wild補牌的資料
    scatterInfo: IScatterData;
}


//--遊戲當中使用
export interface IInGameRoundRecord extends IProcessSlotData {

    //--光頭仔出現的位置
    monkInfo: {
        reelIndex: number, //--有唐僧的軸
        iconIndex: number
    }[], //--唐僧的icon index}[]; 
    topReelSymbolData1ds: number[];//--副盤的軸資料(reelIndex=6(上方軸))
    //-光頭仔要補wild的資料
    wildReFill: {
        allReFillWildData: number[][],
        //---整盤面要補的軸內2d容資料
        reelContentData: { reelIndex: number, iconIndex: number }[][],
        wildFillInfo: { reelIndex: number, iconIndex: number, symbolID: number }[][],
    };

    //--主盤再填充資料(這個會放有得分消除的資料)
    reFillWinDataInfo: { reFillData: number[][], removeData: number[][] },
    //--副盤再填充資料(這個就會放有得分消除的資料)
    reFillTop: { reFillData: number[], removeData: number[] },
    //wildInfo: IWildData,
    scatterInfo: IScatterData,
    spin4Count: number;//--spin4的數量
}


export class BetRecordInfo extends BasicProcessSlotData {

    //--20260323 NEW:辨識目前資料的狀態,NG=2,FG=4,double=5
    public currentDataState: number = -1;
    //--總scatter數量(在NG當中這是獲得FG的依據(4個即滿足條件),在FG當中這是總scatter數量)
    public totalScatterCount: number = 0;
    //--總FG次數(這個指的是進入FG獲得的次數--NG和FG都會寫在這裡,差別只是NG當中是進入挑戰遊戲的顯示數量,FG當中是總FG次數)
    public getFGCountForScatter: number = 0;//--總FG次數(這個指的是進入FG獲得的次數)
    public spin4_fgCount: number = 0;//--symbol 副盤中出現Spin+4次數
    public totalMultiplier: number = 0;//--總倍數(FG才有)
    public totalOddsForFGRaw: number = 0;//--FG原始總賠率(未乘倍數)
    //--20260318 NEW:新增比倍資料
    public isSuccessDoubleGame: boolean = false;//--是否比倍成功
    public doubleGameResultFgCount: number = -1;//--比倍遊戲結果的FG局數
    //--20260323 NEW:新增比倍遊戲歷史紀錄
    //--比倍遊戲歷史紀錄([0,10,0,18.....])..奇數固定=0,偶數才是比倍結果的FG局數.兩個一組紀錄當次的結果
    public doubleGameHistory: number[] = [];
    public doubleGameMaxFgCount: number = 0;//--比倍遊戲最高FG局數(這個是用來判斷是否要進入比倍遊戲的依據之一)

}