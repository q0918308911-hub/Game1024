import {
    BinaryBuffer,
    Utility,
    IntArray,
    HalfByte_IntArray,
    CalculatePayTable1024,
    AwardData,
    ClientData,
    GameState
} from '../ReferencePath';

import { ProcessDataTools } from '../ServerBackSlotInfoData/ProcessDataTools';
import { ITwoDCoordinate } from "../ServerBackSlotInfoData/ProcessDataTools";
import { BasicProcessSlotData, IMatchInfoForRound, IMachPosInfo, IRoundDataReelInfo, IWildData } from '../MyUtils/BasicProcessServerData/IProcessSlotData';
import { IDropRecord, ITemporaryRoundData, IMoveReFillData, IInGameRoundRecord, IDropWildInfo, BetRecordInfo } from '../ServerBackSlotInfoData/DefType1024';

export interface TesRoundData {
    roundData: number[][]
    awardData: AwardData
}

export interface TestCheckScoreResult {
    roundData: TesRoundData[];
    totalWinScore: number;
}

const REEL_AMOUNT = 6;
const SYMBOL_LENGTH = 8;
const SP_MONK_SYMBOL_ID = 10;//--唐僧symbolID
const SP_SCATTER_SYMBOL_ID = 11;//--scatter symbolID
const SP_SPIN4_SYMBOL_ID = 12;//--spin+4 symbolID
const MONK_DELETE_REEL_INDEX = 1;//--消除唐僧的軸index(當唐僧進入第一軸,且主盤有消除時要將唐僧刪除再補牌)
const WILD_LIST = [9];//--經書symbolID
const MAX_WILD_REEL_COUNT = 6;//--最多補牌wild軸上限數量(超過就不補了)
const ENCODING_FACTOR = 100; // 用百位數來編碼實例 ID(情非得已之下才用)
/**
 *  1. 各階段皆會按照觸發的如來佛(SC)圖示數量，顯示已獲得的FG局數。
    2. 各階段開始前，玩家皆可選擇是否進行FREE GAME挑戰遊戲，或直接進入FG。
    PS:特殊牌型只在FG當中獲得:
    <SPIN+4：僅出現於FG副盤。每出現一個SPIN+4圖示，即可增加4局FG局數>
 */
const FG_TIMES_FOR_SCATTER: { [key: number]: number } =
{
    4: 10,
    5: 14,
    6: 18
}
//--20260323 NEW:在封包頭會塞這一張單所代表的遊戲狀態
const GAME_STATE_FOR_PACKET_HEADER: { [key: number]: GameState } =
{
    36: GameState.NORMAL,
    40: GameState.DOUBLE_GAME,
    41: GameState.FREE_GAME,//--正常結束
    42: GameState.ERROR//--斷線(非正常結束)
}

export class ProcessSlotData1024 {

    private _calculatePayTable1024: CalculatePayTable1024;
    private _processDataTools: ProcessDataTools;
    //--每一個唐僧,都可以發動1-4軸補牌機制,每一軸只能發動一次(每一個唐僧最多發動四次)
    private _fuckingMonkSet: Map<number, Set<number>> = new Map<number, Set<number>>();
    private _scatterUniqueSet: Set<number> = new Set<number>();//--紀錄該round的唯一scatter數量(每產生一個就推一個進去)
    private _currentNGCardsInfo: ITemporaryRoundData[];//--ng的盤面資料(parse後拆完盤面資料2ds)
    private _currentReSpinCardsInfo: ITemporaryRoundData[];//--reSpin的盤面資料(parse後拆完盤面資料2ds)
    private _currentFGCardsInfo: ITemporaryRoundData[];//--FG的盤面資料(parse後拆完盤面資料2ds)
    private _currentBase64Data: string = '';//--for test check
    private _ogDataIntAry: HalfByte_IntArray;
    private _monkCountRound: number = 0;
    //--20260313修改後的server資料結構(向後位移10個字節取出盤面資料)
    private _packetHeader: number = 0;//--檔頭(先留著)
    private _purchaseType: number = 0;//--加購類型(先留著)
    private _firstStageBetAmount: number = 0;//--第一段押注額(FG要牌在server res是不會回bet,他會夾在這裡)
    private _doubleGameResultFgCount: number = -1;//--比倍遊戲結果的FG局數(先留著)
    private _isSuccessDoubleGame: boolean = false;//--是否比倍成功(先留著)
    private _currentDoubleGameCardInfo: ITemporaryRoundData[];//--目前比倍遊戲結果的FG局數(先留著)
    private _historyDoubleGameRecords: number[];//--歷程包(比倍紀錄)的資料(先留著)
    private _maxDoubleGameValue: number = 0;//--抽出挑戰遊戲最大值備用(先留著)

    constructor() {

        this._calculatePayTable1024 = new CalculatePayTable1024();
        this._processDataTools = new ProcessDataTools();
    }

    /**
        base 64>>
        VWVURSI4JxNTEINSQTBwMiuA

        拆出來後排列的內容::NG-無得分
        [
            5,5,5,6,4,5,--->左到右的reel資料長度
            PS-2-5軸的第一筆資料為上橫擺欄位需要的,所以實際reel資料是從第2筆開始算起
            5,4,2,2,8, --->第 1 軸
            3,7,2,3,1, -->第2軸
            3,5,0,1,3, -->第3軸
            8,2,5,1,4,0, -->第4軸
            3,0,7,2, -->第5軸
            3,11,2,0,8 -->第6軸
        ]
        */
    /**
     * base64:
     ZGRWJUY5N7YnEXNjcnaAYzCIdSgC
     waygame--
     只有2->他是2條就算分了,其他3條
     下面為4條中線12(wild)34軸
     [
     
         4,6,4,6,6,5,-->盤面長度資訊
         5,2,6,4,       --->第 1 軸
         9(W),3,7,3,6,11<scatter-11(企劃書是寫scatter,但在協議那個網址上寫FG)>, --->第2軸
         7,2,1,1,          --->第 3 軸
         3,7,3,6,2,7,   --->第 4 軸
         6,7,0,8,3,6,  --->第 5 軸
         0,3,8,8,5,     --->第 6 軸
         7,--->補1
         8,--->補2
         2,--->補3
         2,--->補4
         0
     ]
     */
    private _currentBet: number = 0;

    public resetRoundData(): void {

        this._currentBet = 0;
        this._fuckingMonkSet.clear();
        this._scatterUniqueSet.clear();
        this._currentNGCardsInfo = [];
        this._currentReSpinCardsInfo = [];
        this._currentFGCardsInfo = [];
        this._ogDataIntAry = null;
        this._monkCountRound = 0;
        //--20260316NEW-
        this._doubleGameResultFgCount = -1;
        this._isSuccessDoubleGame = false;
        this._packetHeader = 0;
        this._purchaseType = 0;
        this._firstStageBetAmount = 0;
        this._historyDoubleGameRecords = [];
        this._maxDoubleGameValue = 0;
        this._currentDoubleGameCardInfo = [];

    }

    public testSPSymbol(buffer: BinaryBuffer): boolean {
        const len = buffer.getCount();
        //const lens = buffer.getArrayBuffer().byteLength;
        this._ogDataIntAry = new HalfByte_IntArray(len);
        this._ogDataIntAry.Parse(buffer);
        let remainData = this._ogDataIntAry.value.slice();
        if (remainData.includes(SP_SPIN4_SYMBOL_ID)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 20260323 NEW:統一入口來設定資料(不管是NG/FG/比倍結果),
     * 之後在裡面再切分不同的資料處理邏輯
     * @param buffer 
     * @param betValue 
     * @param gameState 
     */
    public setProcessServerData(buffer: BinaryBuffer, betValue?: number): void {

        const dataLength = buffer.getCount();
        if (dataLength <= 2) {
            console.log('<資料長度:', dataLength, '>');
            return this.processDoubleGameData(buffer);
        }

        // 長度>10=NG/FG的資料
        console.log('檢測資料內容,長度:', buffer, dataLength);
        this.setNewRoundData(buffer, betValue);
    }
    /**
     * 20260108-新增逐一填入roundData的資料
     * PS-因為Server會將NG和FG兩筆資料分開送進來
     * (NG進FG卡了一個挑戰遊戲,遊戲的結果會影響到FG的內容所以不會一次全送進來)
     * 20260119--特殊規則:
     * 在FG當中symbol11=spin4+=12要換牌
     * 因為11不會出現在FG(只會出現在NG當中)
     * 20260313-修改後的server資料結構(向後位移10個字節取出盤面資料)
     * 
        另外要注意的是，當[第一段押注]結果有判斷到FG
        就必須走 [比倍] or [第二段取牌]，否則再來第一段就會回失敗
        
        <當 比倍 結果的免費局數=0，就無法送 [第二段取牌]，送了一樣會回失敗>
        
        [第二段取牌]的Content格式: byte[]，目前只會放[免費局數]
        假設10局賭14局成功，會收到[14]，賭失敗則是[0]
        
        原本[第一段押注]、[第二段取牌]的盤面，前面要再多解幾個項目
        若前端用不到，可以直接平移10個Byte
        
        原本: 盤面(Byte[])
        新的:
        1.NG:封包頭(Byte), 加購類型(Byte), 第一段押注額(Double), 盤面(Byte[])
        2.FG:封包頭(Byte), 加購類型(Byte), 第一段押注額(Double), 歷程包(Bytes含長度), 盤面(Bytes讀到底)
     * 
     * @param buffer 
     * @param betValue 
     */
    public setNewRoundData(buffer: BinaryBuffer, betValue?: number): void {

        this.resetRoundData();
        this._currentBet = betValue;
        //let afterCuttingBuffer = this.getDataAfterCutting(buffer, gameState);
        const cuttingResult = this.getDataAfterCutting(buffer);
        let afterCuttingBuffer = cuttingResult.remainingData;
        const gameState = cuttingResult.gameState;
        //--如果是FG的資料,就把betValue改成第一段押注額(因為FG要牌在server res是不會回bet,他會夾在這裡)
        if (gameState === GameState.FREE_GAME) {
            this._currentBet = this._firstStageBetAmount;
        }
        //const len = buffer.getCount();
        //const lens = buffer.getArrayBuffer().byteLength;
        const len = afterCuttingBuffer.getCount();
        this._ogDataIntAry = new HalfByte_IntArray(len);
        this._ogDataIntAry.Parse(afterCuttingBuffer);
        let remainData = this._ogDataIntAry.value.slice();

        const currentRoundData: ITemporaryRoundData[] = [];
        console.log('---setNewRoundData---', remainData);

        let extraCardInfo = remainData;
        let roundIndex = 0;
        let testLens = 0;
        while (extraCardInfo.length > 0) {

            if (extraCardInfo.length == 1 && extraCardInfo[0] === 0) {
                break;//--這是用來湊長度的0(最後一筆資料了)
            }
            roundIndex++;
            const extraCutData: { cardsInfo: ITemporaryRoundData[], remainData: number[] } = this.processByteAfterDecodeBuffer(
                { value: extraCardInfo } as HalfByte_IntArray,
                roundIndex,
                gameState
            );

            //this._currentFGCardsInfo.push(...extraCutData.cardsInfo);
            currentRoundData.push(...extraCutData.cardsInfo);
            testLens = currentRoundData.length;
            if (testLens === 15) {
                console.log();
            }

            extraCardInfo = extraCutData.remainData;
        }

        if (gameState == GameState.NORMAL) {
            this._currentNGCardsInfo = currentRoundData;
        } else if (gameState == GameState.FREE_GAME) {
            this._currentFGCardsInfo = currentRoundData;
        }


        console.log('----NG Round Data----', this._currentNGCardsInfo);
        console.log('----FG Round Data----', this._currentFGCardsInfo);
    }


    /**
     * 20260323修改,不在依賴外部帶入gameState,
     * 而是直接從封包頭來判斷目前的gameState!
     * PS:FG與NG的差別在於FG有<比倍歷史紀錄>,NG則無,且檔頭資料結構會標註
     * 36=NG,40=比倍,41=FG,42=斷線結束(非正常結束)
     * @param buffer 
     * @returns 
     */
    public getDataAfterCutting(buffer: BinaryBuffer): {
        remainingData: BinaryBuffer,
        gameState: GameState
    } {

        let remainingData: BinaryBuffer = null;

        let detectedGameState: GameState = GameState.NORMAL; // 預設為 NG
        //-封包頭(Byte), 加購類型(Byte), 第一段押注額(Double)=10bytes
        buffer.setReadPosition(10);//--向後位移10個字節
        let skippedData1 = buffer.getBytesRanged(0, 10);
        //--解析前面10個字節的資料(如果有需要的話)
        this.processPurchaseAndFirstBetData(skippedData1);
        const packetHeader = GAME_STATE_FOR_PACKET_HEADER[this._packetHeader] || GameState.NORMAL;

        //--判斷要再加入判斷封包頭的類型來確認
        if (packetHeader === GameState.FREE_GAME) {

            detectedGameState = GameState.FREE_GAME;
            //--嘗試取出歷程記錄(比倍紀錄)(2Bytes含長度), index= 10
            let [success, offset] = buffer.getPositiveNumber(2);

            if (success) {
                if (offset > 0) {
                    //--這是<歷程包(比倍紀錄)>
                    //--getBytesRanged這個API<=0會回傳null
                    let skippedData2 = buffer.getBytesRanged(12, offset);
                    //--解析歷程包(比倍紀錄)的資料(如果有需要的話)
                    this.processHistoryDoubleGame(skippedData2);
                    //--繼續往後位移跳過歷程包
                    buffer.skipBytes(offset);
                }
            }
            //--後面就是剩餘盤面資料
            remainingData = buffer.getBytes(-1);

        } else if (packetHeader === GameState.NORMAL) {
            //--後面就是剩餘盤面資料
            remainingData = buffer.getBytes(-1);
        } else if (packetHeader === GameState.ERROR) {
            //--斷線結束狀態
            throw new Error('Error Data Received! Detected game state from packet header indicates an error state. Please check the data and connection.');
        }

        return {
            remainingData: remainingData,
            gameState: detectedGameState
        };
    }

    private processPurchaseAndFirstBetData(buffer: BinaryBuffer): void {

        let [success1, packetHeader] = buffer.getUint8();
        if (success1) {
            //--20260323這邊改存目前的遊戲狀態(NG=36,FG=41/42,比倍=40)
            this._packetHeader = packetHeader;
        }
        // 加購(Byte)
        let [success2, purchaseType] = buffer.getUint8();
        if (success2) {
            this._purchaseType = purchaseType;
        }
        // 第一段押注 (Double) 
        let [success3, betAmount] = buffer.getFloat64();
        if (success3) {
            this._firstStageBetAmount = betAmount;
        }
    }

    /**
     * 20260323 NEW:新增解析歷程包(比倍紀錄)的資料格式
     * 這邊是給予前端用來顯示比倍紀錄的資料格式
     * 歷程包(Bytes含長度)=(封包數量)2Byte, [選擇位置(Byte), 免費局數(Byte)]* N
     * e.g:
     * [0,14,0,18]
     * 奇數位置固定為0(H5專屬),偶數位置為比倍結果...
     * [0,0]
     * 這種情況下代表不玩挑戰遊戲直接進入FG
     * @param buffer 
     */
    private processHistoryDoubleGame(buffer: BinaryBuffer): void {

        let historyRecords = buffer.getBytesArrayAll();
        console.log('<歷程包(比倍紀錄)解析>', historyRecords);
        this._historyDoubleGameRecords = historyRecords;
        //--抽出挑戰遊戲最大值備用
        let maxValue = 0;
        for (let i = 1; i < historyRecords.length; i += 2) {
            if (historyRecords[i] > maxValue) {
                maxValue = historyRecords[i];
            }
        }
        this._maxDoubleGameValue = maxValue;

        //--這是直接選擇進入挑戰遊戲的狀態
        if (maxValue == 0) {
            this._maxDoubleGameValue = 0;//--這邊再確認一次,如果是直接進入FG的狀態,就把maxDoubleGameValue設為0(雖然理論上他應該就是0)
        }
    }

    /**
     * [第二段取牌]的Content格式: byte[]，目前只會放[免費局數]
     * 假設10局賭14局成功，會收到[14]，賭失敗則是[0]
     * @param buffer 
     */
    public processDoubleGameData(buffer: BinaryBuffer): void {

        this.resetRoundData();
        let testLen = buffer.getCount();
        console.log('check double game buffer MAX len', testLen);

        const resultFgData = buffer.getUint8()[1];
        this._doubleGameResultFgCount = resultFgData;
        this._isSuccessDoubleGame = resultFgData > 0 ? true : false;
        let currentRoundData: ITemporaryRoundData = this.createNewRoundDataTemplate();
        currentRoundData.isSuccessDoubleGame = this._isSuccessDoubleGame;
        currentRoundData.doubleGameResultFgCount = this._doubleGameResultFgCount;
        this._currentDoubleGameCardInfo = [currentRoundData];
        console.log('check double game data', resultFgData);
        //return resultFgData;
    }


    public getCloneData(): BasicProcessSlotData {

        return null;

    }


    /**
     * 20260318 NEW<新增比倍遊戲結果的資料格式>:
     * (這個是用來給比倍遊戲結果的資料用的,資料結構沿用,
     * 只是他只會紀錄比倍遊戲結果的FG局數和是否比倍成功,其他資料就先放null或預設值) 
     * isSuccessDoubleGame
     * doubleGameResultFgCount
     * 
     */
    public getGameDoubleGameResultData(): BetRecordInfo {

        const recordData = new BetRecordInfo();
        recordData.isSuccessDoubleGame = this._isSuccessDoubleGame;
        recordData.doubleGameResultFgCount = this._doubleGameResultFgCount;
        //--20260323 NEW:寫入目前的遊戲狀態(比倍結果)
        recordData.currentDataState = GameState.DOUBLE_GAME;
        recordData.doubleGameMaxFgCount = this._maxDoubleGameValue;
        recordData.doubleGameHistory = this._historyDoubleGameRecords;
        console.log('check double game result data', recordData);
        return recordData;
    }

    /**
     * 20260323 NEW:統一從這個入口來取資料
     * @returns BetRecordInfo
     */
    public getGameRoundData(): BetRecordInfo {

        const recordData = new BetRecordInfo();
        if (this._currentDoubleGameCardInfo.length > 0) {

            return this.getGameDoubleGameResultData();

        } else {

            const recordNg: IInGameRoundRecord[] = this.processInGameRoundRecord(this._currentNGCardsInfo);
            const totalOddsForNG: number = this.processTotalOddsForGameRound_NG(recordNg);
            //--這遊戲沒有rs
            const recordFG: IInGameRoundRecord[] = this.processInGameRoundRecord(this._currentFGCardsInfo);
            const fgOddsInfo: { totalOdds: number, totalMultiplier: number, totalOddsRaw: number } = this.processTotalOddsForGameRound_FG(recordFG);
            const fgSpin4Count: number = this.processTotalSpinFourCountForRound(recordFG);
            const totalOddsForFG: number = fgOddsInfo.totalOdds;
            const totalMultiplier: number = fgOddsInfo.totalMultiplier;
            const totalOddsRaw: number = fgOddsInfo.totalOddsRaw;
            const totalOdds: number = (totalOddsForNG + totalOddsForFG).fixed();
            const totalScatterCount: number = this._scatterUniqueSet.size;
            const totalFGCount: number = this.getFinalFGTimes(totalScatterCount);

            recordData.ngReelInfo = recordNg;
            recordData.totalOddsForNg = totalOddsForNG;
            recordData.freeGameReelInfo = recordFG;
            recordData.totalOddsForFG = totalOddsForFG;
            recordData.totalMultiplier = totalMultiplier;
            recordData.totalOddsForFGRaw = totalOddsRaw;
            recordData.allRoundOdds = totalOdds;
            recordData.totalScatterCount = totalScatterCount;
            recordData.getFGCountForScatter = totalFGCount;
            recordData.reSpinReelInfo = null;
            recordData.totalOddsForReSpin = null;
            recordData.betValue = this._currentBet;
            //--因為取資料會分兩段(NG/FG)所以這邊要注意totalNgRounds和totalFgRounds
            if (this._currentNGCardsInfo.length > 0) {
                recordData.totalNgRounds = this._currentNGCardsInfo[this._currentNGCardsInfo.length - 1].round;
                recordData.totalFgRounds = 0;
                recordData.spin4_fgCount = 0;
                recordData.currentDataState = GameState.NORMAL;//--寫入目前的遊戲狀態(NG)

            } else if (this._currentFGCardsInfo.length > 0) {
                recordData.totalNgRounds = 0;
                //--這邊要減去spin4_fgCount的數量(好在遊戲當中動態累加起來)
                recordData.spin4_fgCount = fgSpin4Count;
                const extraSpin4Count = fgSpin4Count * 4;//--一個多4局
                const realRounds = this._currentFGCardsInfo[this._currentFGCardsInfo.length - 1].round;
                recordData.totalFgRounds = realRounds - extraSpin4Count;
                //--這兩個相加才是真正的FG局數(spin4_fgCount+extraSpin4Count)
                recordData.currentDataState = GameState.FREE_GAME;//--寫入目前的遊戲狀態(FG)

            }
            console.log('check recordData', recordData);
            return recordData;
        }
    }

    //---擷取注單使用
    public getBettingRecordList(): BetRecordInfo {

        const recordData = new BetRecordInfo();
        const recordNg: IDropRecord[] = this.processBettingRecord(this._currentNGCardsInfo);
        const totalOddsForNG: number = this.processTotalOddsForRound(this._currentNGCardsInfo);
        //--這遊戲沒有rs
        const totalOddsForFG: number = this.processTotalOddsForRound(this._currentFGCardsInfo);
        const totalOdds: number = (totalOddsForNG + totalOddsForFG).fixed();
        const totalScatterCount: number = this._scatterUniqueSet.size;
        const totalFGCount: number = this.getFinalFGTimes(totalScatterCount);

        recordData.ngReelInfo = recordNg;
        recordData.totalOddsForNg = totalOddsForNG;
        recordData.allRoundOdds = totalOdds;
        recordData.totalScatterCount = totalScatterCount;
        recordData.getFGCountForScatter = totalFGCount;
        recordData.reSpinReelInfo = null;
        recordData.totalOddsForReSpin = null;

        return recordData;
    }

    //--給測試使用的檢查分數
    public getCheckScore(): number {

        const totalRoundOddsForNG = this.processTotalOddsForRound(this._currentNGCardsInfo);
        //const totalRoundOddsForFG 
        return totalRoundOddsForNG;
    }

    //--遊戲當中使用的
    private processInGameRoundRecord(data: ITemporaryRoundData[]): IInGameRoundRecord[] {

        const recordList: IInGameRoundRecord[] = [];

        for (let i: number = 0; i < data.length; i++) {
            //--所有的2維位置資料,副盤都轉成reelIndex=6的軸
            const info: IInGameRoundRecord = {
                betValue: 0,
                totalOdd: 0,
                round: 0,
                monkInfo: null,//--有唐僧的軸(注單要顯示就要先給)
                //wildInfo: null,
                scatterInfo: null,
                winLine: null,
                reelInfo: null,
                topReelSymbolData1ds: null,
                //--wild補牌資料
                wildReFill: null,
                //--主盤再填充資料
                reFillWinDataInfo: null,
                //--副盤再填充資料
                reFillTop: null,
                multiplier: 0,
                spin4Count: 0
            }

            /*
            let wildReFillData:{
                reel: number,//--wild補牌的軸
                data: number[],//--整軸的補牌資料(完整)
                wildCount: number,//--wild補牌數量
                wildIndex: number[]//--wild補牌所在位置  
            };*/

            const roundData = data[i];
            //--還原編碼
            const baseSymbolData2ds = this.decodeRawBoardSymbols(roundData.symbolData2ds.slice());//--解碼10/11
            const mainBoardData = this.cutExtraBoardData(this.getMainBoardData(baseSymbolData2ds));
            //--要塞反的方向(setData的資料會倒著塞進去)
            const topBoardData = this.cutExtraBoardData([this.getTopBoardReverseData(baseSymbolData2ds)])[0];
            const monkInfo = this.getOnlyMonkDataForGame(topBoardData);


            info.monkInfo = monkInfo;
            info.reelInfo = {
                symbolData1ds: null,
                symbolData2ds: mainBoardData,//--解碼裁切後symbol,
                haveForecast: false
            }
            info.topReelSymbolData1ds = topBoardData;//--副盤的軸資料(裁切反轉過)(reelIndex=6(上方軸))
            let totalOdds = 0;
            //--這個有包含副盤得資料--reelIndex=6
            let winDataInfo: IMatchInfoForRound[];
            //--這是主盤的資料
            let reFillWinDataInfo: { reFillData: number[][], removeData: number[][] } = { reFillData: [], removeData: [] };
            //--這是副盤補牌資料(目前資料不是塞反的)
            let reFillTop: { reFillData: number[], removeData: number[] } = { reFillData: [], removeData: [] };

            let scatterInfo: { scatterCount: number, scatterIndex: { reelIndex: number, iconIndex: number }[] } = { scatterCount: null, scatterIndex: null };
            //--有要補牌wild(補牌都在每一輪的開始(消除->下一輪->補牌->消除->下一輪....))
            if (roundData.wildInfo) {
                //--1.先補(reFillData.reFillWildInfo這裡面會放該round要補的wild)
                if (roundData.wildInfo.reFillData.reFillWildInfo) {
                    //--wild補牌-- 
                    info.wildReFill = this.setReFillWildInGame(roundData.wildInfo.reFillData.reFillWildInfo);
                }

                //--再消除補牌
                if (roundData.wildInfo.winDataList) {
                    winDataInfo = this.getWindDataForGame(roundData.wildInfo.winDataList, roundData.wildInfo.symbolData2ds);
                    //--消除補牌後的<主盤>資料
                    reFillWinDataInfo.reFillData = this.getReFillDataForGame(roundData.wildInfo.reFillData.reFillInfo);
                    reFillWinDataInfo.removeData = this.getWinRemoveDataForGame(winDataInfo);
                    totalOdds = roundData.wildInfo.winDataList.totalOdd;
                }

                //--要補牌副盤
                if (roundData.wildInfo.reFillData.reFillTopInfo) {
                    reFillTop = this.getTopReFillDataForGame(roundData.wildInfo.reFillData.reFillTopInfo);
                }

                if (roundData.wildInfo.scatterInfo.scatterCount != null && roundData.wildInfo.scatterInfo.scatterIndex != null) {
                    scatterInfo.scatterCount = roundData.wildInfo.scatterInfo.scatterCount;
                    scatterInfo.scatterIndex = this.getScatterDataForGame(roundData.wildInfo.scatterInfo.scatterIndex);
                    //info.scatterInfo.scatterCount=roundData.wildInfo.scatterInfo.scatterCount;
                    //info.scatterInfo.scatterIndex=this.getScatterDataForGame(roundData.wildInfo.scatterInfo.scatterIndex);
                }
                console.log();


            } else {
                //--沒有補牌wild
                if (roundData.winDataList) {

                    winDataInfo = this.getWindDataForGame(roundData.winDataList, roundData.symbolData2ds);
                    reFillWinDataInfo.reFillData = this.getReFillDataForGame(roundData.reFillData.reFillInfo);
                    reFillWinDataInfo.removeData = this.getWinRemoveDataForGame(winDataInfo);
                    totalOdds = roundData.winDataList.totalOdd;
                }
                //--末盤的時候沒有
                if (roundData.reFillData != null) {

                    if (roundData.reFillData.reFillTopInfo != null) {
                        reFillTop = this.getTopReFillDataForGame(roundData.reFillData.reFillTopInfo);
                    }
                }

                if (roundData.scatterInfo != null) {

                    if (roundData.scatterInfo.scatterCount != null && roundData.scatterInfo.scatterIndex != null) {
                        scatterInfo.scatterCount = roundData.scatterInfo.scatterCount;
                        scatterInfo.scatterIndex = this.getScatterDataForGame(roundData.scatterInfo.scatterIndex);
                    }
                }


            }

            info.betValue = roundData.betValue;
            info.totalOdd = totalOdds;
            info.winLine = winDataInfo;
            info.reFillWinDataInfo = reFillWinDataInfo;
            info.reFillTop = reFillTop;
            info.scatterInfo = scatterInfo;
            info.round = roundData.round;
            info.spin4Count = roundData.spin4Count;
            recordList.push(info);

        }


        return recordList;
    }



    private processBettingRecord(data: ITemporaryRoundData[]): IDropRecord[] {

        const recordList: IDropRecord[] = [];

        for (let i = 0; i < data.length; i++) {
            const info: IDropRecord = {
                betValue: 0,
                totalOdd: 0,
                round: 0,
                monkInfo: null,//--有唐僧的軸(注單要顯示就要先給)
                scatterInfo: null,
                winLine: null,
                reelInfo: null,
                wildReFill: null,
                multiplier: 0//--倍數(只有fg會用到)

            }
            const roundData = data[i];
            const baseSymbolData2ds = this.decodeRawBoardSymbols(roundData.symbolData2ds);//--解碼唐僧symbol,

            info.monkInfo = this.getOnlyMonkDataForRecord(roundData.symbolData2ds);
            info.reelInfo = {
                symbolData1ds: null,
                symbolData2ds: baseSymbolData2ds,//--解碼後唐僧symbol,
                haveForecast: false
            }
            let flatSymbolData;

            if (roundData.wildInfo) {
                //--有wildInfo
                const wildSymbolData2ds = this.decodeRawBoardSymbols(roundData.wildInfo.symbolData2ds);//--解碼唐僧symbol
                //--wild補牌資料
                /**
                 * reFillWildInfo:{
                 *   reel:number,//--wild補牌的軸
                 *   data:number[],//--整軸的補牌資料(完整)
                 *   wildCount:number,//--wild補牌數量
                 */
                const wildReFillData = this.getMonkDataForRecord(roundData.wildInfo.reFillData.reFillWildInfo);

                const wildInfo = {
                    wildCount: wildReFillData.wildCount,
                    wildIndex: wildReFillData.wildInfo
                };

                const scatterInfo = roundData.wildInfo.scatterInfo;

                flatSymbolData = this._processDataTools.getFlatArrayFrom2Ds(roundData.wildInfo.symbolData2ds)
                const awardData_wild = this.getWindDataForRecord(roundData.wildInfo.winDataList, flatSymbolData);

                info.wildReFill = {
                    betValue: roundData.betValue,
                    totalOdd: roundData.wildInfo.winDataList.totalOdd,
                    round: 0,
                    winLine: awardData_wild,
                    reelInfo: {
                        symbolData1ds: null,
                        symbolData2ds: wildSymbolData2ds,
                        haveForecast: false
                    },
                    monkInfo: wildReFillData.monkInfo,
                    wildInfo: wildInfo,
                    scatterInfo: scatterInfo,
                    multiplier: 0
                }
                /*
                const wildInfo:IDropWildInfo={
                    monkInfo:wildReFillData.monkInfo,
                    wildInfo:{
                        wildCount:wildReFillData.wildCount,
                        wildIndex:wildReFillData.wildInfo
                    },
                    scatterInfo:null,

                }*/
            }

            if (roundData.winDataList) {
                //--有得分資料(沒有補牌)
                flatSymbolData = this._processDataTools.getFlatArrayFrom2Ds(baseSymbolData2ds);
                const awardData = this.getWindDataForRecord(roundData.winDataList, flatSymbolData);
                info.betValue = roundData.betValue;
                info.winLine = awardData;
                info.totalOdd = roundData.winDataList.totalOdd;
                info.scatterInfo = roundData.scatterInfo;
            } else {
                info.scatterInfo = roundData.scatterInfo;
            }
            recordList.push(info);

        }

        return recordList;

    }




    private getMonkDataForRecord(reFillWildInfo: {
        reel: number,//--wild補牌的軸
        data: number[],//--整軸的補牌資料(完整)
        wildCount: number,//--wild補牌數量
        wildIndex: number[]//--wild補牌所在位置
    }[]): {
        //--有唐僧的軸
        monkInfo: { reelIndex: number, iconIndex: number }[],
        wildInfo: { reelIndex: number, iconIndex: number }[],
        wildCount: number
    } {
        const monkData: { reelIndex: number, iconIndex: number }[] = [];
        const wildData: { reelIndex: number, iconIndex: number }[] = [];
        let wc = 0;
        for (let i = 0; i < reFillWildInfo.length; i++) {
            const info = reFillWildInfo[i];
            let symbol = info.data[0];
            //-解碼唐僧symbol
            if (symbol >= ENCODING_FACTOR) {
                symbol = this.decodeFuckingMonkSymbols(symbol);
            }
            if (symbol == SP_MONK_SYMBOL_ID) {
                monkData.push({
                    reelIndex: info.reel,
                    iconIndex: 0
                });

                for (let j: number = 0; j < info.wildIndex.length; j++) {
                    wildData.push({
                        reelIndex: info.reel,
                        iconIndex: info.wildIndex[j]
                    })
                }
                wc += info.wildCount;
            }
        }
        return {
            monkInfo: monkData,
            wildInfo: wildData,
            wildCount: wc
        };

    }

    private createNewRoundDataTemplate(): ITemporaryRoundData {

        let currentRoundData: ITemporaryRoundData = {
            isSuccessDoubleGame: false,
            doubleGameResultFgCount: -1,
            betValue: this._currentBet,
            totalOdd: 0,
            round: 0,
            spin4Count: 0,
            //symbolData1ds:[],
            symbolData2ds: null,
            winDataList: null,
            reFillData: {
                reFillTopInfo: null,
                reFillInfo: null
            },
            scatterInfo: {
                scatterCount: null,//--scatter的數量
                scatterIndex: null//--scatter的index
            },
            wildInfo: {
                //symbolData1ds:[],
                reFillData: {
                    reFillTopInfo: null,
                    reFillInfo: null,
                    reFillWildInfo: null,
                },
                scatterInfo: {
                    scatterCount: null,//--scatter的數量
                    scatterIndex: null//--scatter的index
                },
                symbolData2ds: null,
                winDataList: null,
            }
        };
        return currentRoundData;
    }

    private processByteAfterDecodeBuffer(targetByte: HalfByte_IntArray, round: number, gameState: GameState): {
        cardsInfo: ITemporaryRoundData[],
        remainData: number[]
    } {

        const nextRoundResultList: ITemporaryRoundData[] = [];
        let sliceIndex = 6;
        const rawByteDate = targetByte.value.slice();
        //--先將唐僧/scatter/spin4做編碼處理
        const cloneProcessData = this.encodeFuckingMonkSymbols(rawByteDate.slice(), gameState);
        //--取長度
        const lensForBoard = cloneProcessData.slice(0, 6);
        const boardDataResult = this.createBoardData(lensForBoard, cloneProcessData, 6);
        sliceIndex = boardDataResult.currentIndex;
        const boardData = boardDataResult.boardData;//--抽出來的結果

        //======初始盤面==========================================================================

        //======往下切割======
        let flatSymbolData = null;
        let calculatePayBoard = this.createCalculatePayBoard(boardData); // 初始算分盤面;
        //======20260326 NEW:保留該round最終盤(未得分)狀態下又有wild補牌的wild資料==============
        let finalWildInfo = null;


        /*
        const doLog = () => {
            console.log(
                'cloneProcessData:', cloneProcessData, '\n',
                'lensForBoard:', lensForBoard, '\n',
                'boardData:', boardData, '\n',
                'sliceIndex:', sliceIndex, '\n',
                'calculatePayBoard:', calculatePayBoard, '\n',
                'flatSymbolData:', flatSymbolData, '\n',
                //'awardData:', awardData, '\n',

            );
        }
        doLog();*/

        while (sliceIndex < rawByteDate.length) {

            //--如果解到剩下一個是0要將sliceIndex補成cloneProcessData.length來跳脫迴圈
            let hasReplaceWild: boolean = false;
            let currentRoundData: ITemporaryRoundData = this.createNewRoundDataTemplate();
            currentRoundData.round = round;//--寫入round
            //======初始盤面/連線前盤面 (即上一輪的結果)==========================================================================
            currentRoundData.symbolData2ds = JSON.parse(JSON.stringify(calculatePayBoard));

            // 檢查初始盤面/連線前盤面上的 Scatter (僅適用於第一輪或補牌前)
            if (nextRoundResultList.length === 0) {
                const rawMatchSc = this.checkScatterRoundCount(calculatePayBoard);
                if (rawMatchSc) {
                    currentRoundData.scatterInfo = {
                        scatterCount: rawMatchSc.scatterCount,
                        scatterIndex: JSON.parse(JSON.stringify(rawMatchSc.scatterIndex))
                    }
                }
            }

            const replaceMonkResult = this.moveBoardForFuckingMonk(calculatePayBoard, sliceIndex, cloneProcessData);
            //--補牌wild
            if (replaceMonkResult.index > sliceIndex) {
                hasReplaceWild = true;//--有取代
                sliceIndex = replaceMonkResult.index;
                calculatePayBoard = replaceMonkResult.next;//--新盤面
                currentRoundData.wildInfo.symbolData2ds = JSON.parse(JSON.stringify(calculatePayBoard));
                //--記錄唐僧補牌wild資訊
                currentRoundData.wildInfo.reFillData.reFillWildInfo = JSON.parse(JSON.stringify(replaceMonkResult.reFillInfo));
            }

            flatSymbolData = this._processDataTools.getFlatArrayFrom2Ds(calculatePayBoard);
            //--round 1-得分結果
            const awardData = this._calculatePayTable1024.getWindData(flatSymbolData);

            if (awardData.dataList.length > 0) {
                //--抽取該輪全部贏分位置
                const win1Ds = this.margeWinLineData(awardData);
                //--會刪掉重複位置
                const uniqueWin1Ds = this._processDataTools.removeDuplicateInArray(win1Ds);
                //console.log('本輪贏分位置(一維):', uniqueWin1Ds);
                const sortAry = this._processDataTools.sortArrayWithDirection(uniqueWin1Ds, true);
                //console.log('排序後本輪贏分位置(一維):', sortAry);
                const uniqueWin2Ds = this._processDataTools.convertWinFlatToTwoD(sortAry, SYMBOL_LENGTH);
                //console.log('本輪贏分位置(二維):', uniqueWin2Ds);
                //---準備注回盤面(消除補牌)
                const nextRoundResult: IMoveReFillData = this.moveBoardAfterWin(calculatePayBoard, uniqueWin2Ds, sliceIndex, cloneProcessData);

                sliceIndex = nextRoundResult.index;
                calculatePayBoard = nextRoundResult.next;
                // 檢查補牌後是否有新的 Scatter
                const rawReFillMatchSc: {
                    scatterCount: number,
                    scatterIndex: {
                        reelIndex: number,
                        iconIndex: number
                    }[]
                } = this.checkScatterRoundCount(calculatePayBoard);

                if (hasReplaceWild) {

                    currentRoundData.wildInfo.winDataList = awardData;
                    currentRoundData.wildInfo.reFillData.reFillTopInfo = {
                        reFillData: nextRoundResult.reFillTopInfo.reFillData.slice(),
                        removeData: nextRoundResult.reFillTopInfo.removeData.slice()
                    }

                    currentRoundData.wildInfo.reFillData.reFillInfo = JSON.parse(JSON.stringify(nextRoundResult.reFillInfo));
                    if (rawReFillMatchSc) {
                        currentRoundData.wildInfo.scatterInfo = {
                            scatterCount: rawReFillMatchSc.scatterCount,
                            scatterIndex: JSON.parse(JSON.stringify(rawReFillMatchSc.scatterIndex))
                        }
                    }


                } else {
                    // ... (一般贏分記錄邏輯) ...
                    currentRoundData.winDataList = awardData;
                    currentRoundData.reFillData.reFillTopInfo = {
                        reFillData: nextRoundResult.reFillTopInfo.reFillData.slice(),
                        removeData: nextRoundResult.reFillTopInfo.removeData.slice()
                    }
                    if (rawReFillMatchSc) {
                        currentRoundData.scatterInfo = {
                            scatterCount: rawReFillMatchSc.scatterCount,
                            scatterIndex: JSON.parse(JSON.stringify(rawReFillMatchSc.scatterIndex))
                        }
                    }
                    currentRoundData.reFillData.reFillInfo = JSON.parse(JSON.stringify(nextRoundResult.reFillInfo));
                    currentRoundData.wildInfo = null;
                }

            } else {

                // 沒有贏分，不需要補牌。
                // 這一輪的 `currentRoundData` 已經設定了盤面，但沒有贏分/補牌資訊，
                // 這是連線結束前的**最後一輪贏分回合**，它記錄了**發生贏分前的狀態**。
                // 沒有贏分時，需要跳出迴圈，因為沒有後續連線/補牌。
                // 並且將 `sliceIndex` 設為 `rawByteDate.length` 來強制跳出 `while` 迴圈。
                currentRoundData.winDataList = null;
                currentRoundData.reFillData = null;
                /**
                 * 20260326
                 * 在沒有得分又要wild補牌的情況下,要將資料保留住.
                 * <此時狀態為該round的最終盤>
                 * 會在最末端的isFinalStaticBoardNeeded處理
                 * PS:在沒有得分的情況下不會塞入nextRoundResultList
                 */
                if (!hasReplaceWild) {
                    currentRoundData.wildInfo = null;
                } else {
                    finalWildInfo = JSON.parse(JSON.stringify(currentRoundData.wildInfo));
                }

                const sp4check = this.getSpinFourCount(calculatePayBoard);
                currentRoundData.spin4Count = sp4check;

                //sliceIndex = rawByteDate.length;
                break;
            }
            //--算spin4-他也不會被消除就單一盤副盤上出現
            //-calculatePayBoard
            nextRoundResultList.push(currentRoundData);

        }

        const isInitialEnd = (nextRoundResultList.length === 0);
        const isFinalStaticBoardNeeded = isInitialEnd || (nextRoundResultList[nextRoundResultList.length - 1].winDataList != null);

        if (isFinalStaticBoardNeeded) {


            let finalRoundData: ITemporaryRoundData = this.createNewRoundDataTemplate();
            finalRoundData.symbolData2ds = JSON.parse(JSON.stringify(calculatePayBoard));
            finalRoundData.betValue = this._currentBet; // 確保 betValue 被設定
            finalRoundData.totalOdd = 0;
            finalRoundData.round = round;//--寫入round
            finalRoundData.reFillData = null;
            if (finalWildInfo) {
                finalRoundData.wildInfo = JSON.parse(JSON.stringify(finalWildInfo));
            } else {
                finalRoundData.wildInfo = null;
            }

            finalRoundData.scatterInfo = null;
            finalRoundData.spin4Count = this.getSpinFourCount(calculatePayBoard);
            finalRoundData.winDataList = null;

            // 檢查最終盤面上的 Scatter
            const finalRoundRawReFillMatchSc = this.checkScatterRoundCount(calculatePayBoard);
            if (finalRoundRawReFillMatchSc) {
                finalRoundData.scatterInfo = {
                    scatterCount: finalRoundRawReFillMatchSc.scatterCount,
                    scatterIndex: JSON.parse(JSON.stringify(finalRoundRawReFillMatchSc.scatterIndex))
                }
            }

            // 如果初始即結束，它應該是 list 的第一個且唯一元素。
            // 如果是連線結束，它應該是 list 的最後一個元素。
            nextRoundResultList.push(finalRoundData);
            console.log('FINAL_STATIC_BOARD_RECORDED');
        }

        /*
        console.log('finish all round data:', '\n',
            'currentSliceIndex:', sliceIndex, '\n',
            'totalData:', cloneProcessData, '\n',
            'totalRound:', nextRoundResultList
        );*/

        //======計算總得分==========================================================================
        return {
            cardsInfo: nextRoundResultList,
            remainData: cloneProcessData.slice(sliceIndex)
        };
        //return nextRoundResultList;

        //==============================================

    }

    /**
     * 編碼特殊符號，將每個特殊符號替換為帶有編碼的數值。(+100, +200, +300, ...)
     * e.g:
     * 特殊符號: 10 (唐僧), 11 (scatter), 12 (spin4)
     * 原始陣列: [7,10,2,10,11,3,10,12,11]
     * 編碼後: [7,110,2,210,111,3,310,112,211]
     * @param rawRound 原始的符號陣列。
     * 20260121
     * PS-在FG當中symbol11=spin4+=12要換牌
       因為11不會出現在FG(只會出現在NG當中)
     * @param gameState 在FG要把11換成12
     * @returns 編碼後的符號陣列。
     */
    private encodeFuckingMonkSymbols(rawRound: number[], gameState: GameState, changeTarget: number[] = [SP_MONK_SYMBOL_ID, SP_SCATTER_SYMBOL_ID, SP_SPIN4_SYMBOL_ID]): number[] {

        const symbolCounts = new Map<number, number>();

        // 預先將所有目標符號的計數初始化為 0
        for (const targetId of changeTarget) {

            symbolCounts.set(targetId, 0);
        }

        for (let i = 0; i < rawRound.length; i++) {
            //--光頭仔在FG要換成spin4,他只會在NG出現,server為了省就直接用11
            const currentSymbolId = (gameState === GameState.FREE_GAME && rawRound[i] === SP_SCATTER_SYMBOL_ID) ? SP_SPIN4_SYMBOL_ID : rawRound[i];

            if (symbolCounts.has(currentSymbolId)) {
                // 獲取當前計數
                let count = symbolCounts.get(currentSymbolId)!;
                count++;
                symbolCounts.set(currentSymbolId, count);
                const encodedId = (count * ENCODING_FACTOR) + currentSymbolId;
                rawRound[i] = encodedId;
            }


        }

        return rawRound;
    }


    /**
     * 從編碼 ID 中提取原始 Symbol ID。
     * @param encodedId 編碼後的數值。
     * @returns 原始 Symbol ID (例如 10)。
     */
    private decodeFuckingMonkSymbols(encodedId: number): number {
        return encodedId % ENCODING_FACTOR;
    }

    /**
     * 複製並且解碼盤面中的符號，將編碼後的唐僧/scatter符號還原為原始符號 ID。
     * @param rawBoard 
     * @returns 
     */
    private decodeRawBoardSymbols(rawBoard: number[][]): number[][] {

        const decodedBoard: number[][] = [];
        for (let i = 0; i < rawBoard.length; i++) {
            const reel: number[] = [];
            for (let j = 0; j < rawBoard[i].length; j++) {
                let symbol = rawBoard[i][j];
                if (symbol >= ENCODING_FACTOR) {
                    symbol = this.decodeFuckingMonkSymbols(symbol);
                    //rawBoard[i][j] = symbol;
                }
                reel.push(symbol);
            }
            decodedBoard.push(reel);
        }
        return decodedBoard;
    }

    /**
     * 找出副盤中所有編碼後的唐僧符號觸發點。
     * @param currentBoard 當前盤面資料，二維陣列表示。
     * @returns 包含軸索引和編碼後唐僧ID的陣列。
     */
    //private findEncodedMonkTriggers(currentBoard: number[][]): { reelIndex: number, encodedId: number }[] {
    private findEncodedMonkTriggers(currentBoard: number[][]): Map<number, { reelIndex: number, encodedId: number }> {

        const topBoard = this.getTopBoardData(currentBoard);
        const result: Map<number, { reelIndex: number, encodedId: number }> = new Map();
        for (let i = 0; i < topBoard.length; i++) {
            const symbol = topBoard[i];
            if (symbol >= ENCODING_FACTOR) {
                //--FIX 20260325如果只有上面的判斷會連其他的特殊符號(例如scatter/spin4)也會吻合條件,
                // 所以要加一個條件判斷確保只解碼唐僧符號
                //const decodedSymbol = this.decodeFuckingMonkSymbols(symbol);
                //if (decodedSymbol === SP_MONK_SYMBOL_ID) {
                result.set(i, {
                    reelIndex: i,
                    encodedId: symbol
                });
                //}
            }
        }
        return result;
    }






    /**
     * 移動盤面-only唐僧symbol 10
     * TIPS:
     * 1.有唐僧的話,要先把唐僧下面主盤補成wild(9)再來算分
     * 2.初始盤面和每次得分後的盤面都要檢查有沒有唐僧
     * 副盤有幾個10，那邊依序從左到右，去取Byte來判斷那輪會多幾格
     * PS-這個是以資料上來說的邏輯(展開資料後從頭(左邊)開始一路向後(右邊)拿),
     * 實際遊戲畫面上看起來是右邊到左推擠
     * <非常重要>:
     * 1.每個唐僧-每一軸只會發動一次補牌wild的效果
     * (不是以軸為單位,而是以唐僧symbol為單位)
     * 2.主盤單軸最多擴展到6格,已達6格將不發動補牌(詳見規則說明)
     */
    /**
     * 
     * @param currentBoard 當前盤面
     * @param startIndex slice起點
     * @param cloneProcessData 原始server未切割的資料
     * @param spMonkList 副盤唐僧數量
     * @returns 
     */
    private moveBoardForFuckingMonk(currentBoard: number[][], startIndex: number, cloneProcessData: number[]): {
        next: number[][],
        reFillInfo: { reel: number, data: number[], wildCount: number, wildIndex: number[] }[],//--替換wild的軸
        index: number
    } {
        //--這個只會返回reel的index,因為只找每一軸的第0個位置(副盤的位置)-唐僧<只會>出現在副盤
        //const encodedMonkList: { reelIndex: number, encodedId: number }[] = this.findEncodedMonkTriggers(currentBoard);
        const encodedMonkList: Map<number, { reelIndex: number, encodedId: number }> = this.findEncodedMonkTriggers(currentBoard);
        const spMonkList: number[] = this.findAllElementIndexes(currentBoard, SP_MONK_SYMBOL_ID);//--唐僧(直接找盤面有幾個光頭仔)
        let newBoard: number[][] = [];
        let sliceIndex = startIndex;
        const reFillWildInfo: { reel: number, data: number[], wildCount: number, wildIndex: number[] }[] = [];

        if (spMonkList.length > 0) {
            //--開始抽取該軸補上wild(新增輪長(4bit)-每一軸只需要抽取一個byte)
            newBoard = currentBoard.slice();
            let targetReel: number[];

            for (let i: number = 0; i < spMonkList.length; i++) {
                const trigger = encodedMonkList.get(spMonkList[i]);//--找到對應軸的編碼唐僧觸發點
                if (!trigger) {
                    continue;
                }
                const reelIndex = trigger.reelIndex;
                const encodedId = trigger.encodedId; //--編碼後的唐僧ID

                let activatedReels = this._fuckingMonkSet.get(encodedId);
                if (!activatedReels) {
                    activatedReels = new Set<number>();
                    this._fuckingMonkSet.set(encodedId, activatedReels);
                }

                if (activatedReels.has(reelIndex)) {

                    continue;//--已經發動過唐僧該軸就跳過
                }

                const checkCutReelMax: number[] = newBoard[reelIndex].slice().filter((x: number) => {
                    //剔除-1,但這是包含index0位置的資料
                    return x !== -1;
                });

                const checkConditionSliceIndex = sliceIndex + 1;
                const checkIncreaseWildLen = cloneProcessData.slice(sliceIndex, checkConditionSliceIndex)[0];//--一次抽一個起來
                //-這是包含index0位置的資料(所以長度要加1)
                //-主盤單軸最多擴展到6格,已達6格將不發動補牌
                if (checkCutReelMax.length - 1 >= MAX_WILD_REEL_COUNT || (checkCutReelMax.length + checkIncreaseWildLen - 1) > MAX_WILD_REEL_COUNT) {

                    continue;//--超過補牌上限就跳過
                }
                activatedReels.add(reelIndex);

                const increaseWildLen = cloneProcessData.slice(sliceIndex, sliceIndex + 1)[0];//--一次抽一個起來
                sliceIndex += 1;//--只有成功補牌才移動sliceIndex

                targetReel = newBoard[reelIndex].slice();
                const headItem = targetReel.splice(0, 1)[0];//--先把最上面的唐僧拿掉
                const otherItems = targetReel.filter(item => item !== -1);//--過濾掉-1
                const fillWilds = Array(increaseWildLen).fill(9);//--補上wild
                const fillWildIndex = Array.from({ length: fillWilds.length }, (_, i) => i + 1);
                //--重新組合
                let tempReel: number[] = [headItem, ...fillWilds, ...otherItems];
                const currentLength = tempReel.length;
                const shortfall = SYMBOL_LENGTH - currentLength;
                if (shortfall > 0) {
                    const fillBuffer = Array(shortfall).fill(-1);
                    tempReel = tempReel.concat(fillBuffer);
                }
                const reFillWildData = {
                    reel: reelIndex,//--補牌軸
                    data: tempReel.slice(),//--補牌後的軸資料
                    wildCount: fillWilds.length,//--wild補牌數量
                    wildIndex: fillWildIndex    //--wild補牌位置
                };
                //--取代回去
                newBoard[reelIndex] = tempReel;
                reFillWildInfo.push(reFillWildData);
            }

        }

        return { next: newBoard, index: sliceIndex, reFillInfo: reFillWildInfo };
    }

    private reFillWildIndex(lens: number): number[] {

        const wildIndex: number[] = [];
        for (let i = 1; i <= lens; i++) {
            wildIndex.push(i);
        }
        return wildIndex;
    }

    /**
     * 
     * @param currentBoard --目前盤面(算分用的盤面6*8)
     * @param win2DPos 
     * @param startIndex 目前切割到達的索引位置
     * @param cloneProcessData 該round完整的processData
     */
    //private moveBoardAfterWin(currentBoard: number[][], win2DPos: ITwoDCoordinate[], startIndex: number, cloneProcessData: number[]): { next: number[][], index: number } {
    private moveBoardAfterWin(currentBoard: number[][], win2DPos: ITwoDCoordinate[], startIndex: number, cloneProcessData: number[]): IMoveReFillData {

        let returnData: IMoveReFillData = {
            next: [],
            reFillTopInfo: {
                removeData: [],
                reFillData: []
            },
            reFillInfo: [],
            index: 0
        };
        //--準備移動盤面
        let nextRoundBoard: number[][] = this._processDataTools.getClone2DArray(currentBoard);
        /**
         * 有連線的狀態下
         * 1.先補副盤(左->右)--資料是從左邊開始拿(就是展開成一條線從左邊開始往右邊取)
         * 2.再補主盤(下->上)
         * TIPS:唐僧特殊補牌機制,當唐僧出現且在第一軸位置.
            * 1.要檢查該軸是否有中獎
            * 2.如果該軸有中獎,要將該軸唐僧刪除再補牌
         * 注意:因為awardData是補齊6*8,所以它拿到的位置第0軸和第5軸要+1(因為頭被強補-1去填充對齊)
         */
        //let lensForTopBoard: number = 0;
        let lensForCutting: number = 0;
        //--檢查副盤是否有連線-需要先補副盤
        let findData: { reelIndex: number[], positionIndex: number[] } = this.checkTopBoardHasWin(win2DPos);
        //--先抽取副盤資料
        let changeReelData: number[] = this.getTopBoardData(nextRoundBoard);
        //--抽取有沒有唐僧需要刪除的資料
        const isRemoveMonk: { reelIndex: number, positionIndex: number } = this.checkSpReelHasWinAndMonk(changeReelData, win2DPos);
        if (isRemoveMonk) {
            //--將要刪除的唐僧塞到裡面
            findData.reelIndex.unshift(isRemoveMonk.reelIndex);//--這邊就是強塞進去上方要補牌的檢查裡面
            //--唐僧不會中線阿~所以不要刪掉得分位置
            //findData.positionIndex.unshift(isRemoveMonk.positionIndex);

        }

        let topBoardHasWin: number[] = findData.reelIndex;//--抽出上方軸有中獎的軸index陣列
        let reFillReel: number[] = [];//--1d array
        let refillData: number[];


        if (topBoardHasWin.length > 0) {

            //--直接拿,他不會給要補給幾張-要直接連續拿
            lensForCutting = topBoardHasWin.length;//--抽出要換牌的長度(上面的部分)
            refillData = cloneProcessData.slice(startIndex, startIndex + lensForCutting);
            startIndex += lensForCutting;
            //--記錄捕牌軸(副盤)與填充資料
            returnData.reFillTopInfo = {
                removeData: topBoardHasWin.slice(),
                reFillData: refillData.slice()
            }
            //--重新填裝
            reFillReel = this.refillAfterRemove(changeReelData, topBoardHasWin, refillData, -1, true);
            //--填充上面的
            this.refillTopBoard(nextRoundBoard, reFillReel);
            //--刪掉已使用的部分
            win2DPos = this.removeCoordinatesByIndices(win2DPos, findData.positionIndex);

        }

        let groupWin: { reel: number, index: number[] }[] = this.groupCoordinatesByReelOptimized(win2DPos);

        for (let i: number = 0; i < groupWin.length; i++) {

            lensForCutting = groupWin[i].index.length;//--要開始連續往下抽換
            refillData = cloneProcessData.slice(startIndex, startIndex + lensForCutting);
            changeReelData = nextRoundBoard[groupWin[i].reel];
            //--記錄捕牌軸與填充資料
            const reFillInfo = { reel: groupWin[i].reel, data: refillData.slice() };
            returnData.reFillInfo.push(reFillInfo);
            startIndex += lensForCutting;
            //--重新填裝
            reFillReel = this.refillAfterRemove(changeReelData, groupWin[i].index, refillData, groupWin[i].reel);
            nextRoundBoard[groupWin[i].reel] = reFillReel;//--取代回去

        }
        returnData.index = startIndex;
        returnData.next = nextRoundBoard;

        /*
        const replaceMonkResult = this.moveBoardForFuckingMonk(nextRoundBoard, startIndex, cloneProcessData);
        //console.log('checkFuckingMonk:', replaceMonkResult);
        if (replaceMonkResult.index > startIndex) {
            //--有取代
            startIndex = replaceMonkResult.index;
            nextRoundBoard = replaceMonkResult.next;//--新盤面
        }*/
        return returnData;
    }




    private refillAfterRemove(
        arr: number[],
        removeIdList: number[],
        fillList: number[],
        reel: number,
        isTopFill: boolean = false
    ): number[] {

        // ... (HeadNegOneCount 和 TailNegOneCount 的計算保持不變) ...
        let headNegOneCount = 0;
        for (let i = 0; i < arr.length && arr[i] === -1; i++) {
            headNegOneCount++;
        }

        let tailNegOneCount = 0;
        for (let i = arr.length - 1; i >= 0 && arr[i] === -1; i--) {
            if (i < headNegOneCount) {
                break;
            }
            tailNegOneCount++;
        }

        // 過濾純粹的剩餘元素
        const removalSet = new Set(removeIdList);

        const pureRemain: number[] = arr.filter((value, index) => {
            // 排除頭尾固定的 -1
            if (index < headNegOneCount || index >= arr.length - tailNegOneCount) {
                return false;
            }
            return !removalSet.has(index);
        });
        // ... (HeadNegOneCount 和 TailNegOneCount 的計算和 pureRemain 過濾保持不變) ...


        // ---組合與特殊處理---
        let reversedFill: number[];
        let activeData: number[];

        // 儲存第一個非 -1 且非 headNegOneCount 區域的元素
        let fixedFirstElement: number | undefined = undefined;

        if (isTopFill) {
            // 模式 1: TopFill (將 pureRemain 推到填充值的後面)
            reversedFill = fillList.slice(); // 不反轉
            activeData = pureRemain.concat(reversedFill);

        } else {

            // 模式 2: 一般填充
            if (reel === 0 || reel === REEL_AMOUNT - 1) {
                // 子模式 2A: 首尾軸 (沿用之前的邏輯：反轉填充，放在前面)
                reversedFill = fillList.slice().reverse();
                activeData = reversedFill.concat(pureRemain);

            } else {
                //  中間軸 (中間1-4軸index[0]固定不要動)

                // 隔離第一個「非固定」的元素
                // 這個索引是 headNegOneCount
                const firstActiveIndex = headNegOneCount;

                if (arr.length > firstActiveIndex && arr[firstActiveIndex] !== -1) {

                    // 檢查這個元素是否被要求從 removeIdList 中移除
                    if (!removalSet.has(firstActiveIndex)) {
                        fixedFirstElement = arr[firstActiveIndex];
                    }

                    const elementValue = fixedFirstElement;
                    if (elementValue !== undefined) {
                        const firstIndexInRemain = pureRemain.indexOf(elementValue);
                        if (firstIndexInRemain !== -1) {
                            pureRemain.splice(firstIndexInRemain, 1);
                        }
                    }
                }

                //組合剩餘數據：填充值放在前面
                reversedFill = fillList.slice().reverse();
                activeData = reversedFill.concat(pureRemain);
            }
        }

        // --- 構建最終結果陣列 ---
        const finalResult: number[] = [];

        // A. 放入頭部的固定 -1
        for (let i = 0; i < headNegOneCount; i++) {
            finalResult.push(-1);
        }

        // B. 放入被固定的首個元素 (如果存在)
        if (fixedFirstElement !== undefined) {
            finalResult.push(fixedFirstElement);
        }

        // C. 放入活動數據 (替換被移除的元素)
        finalResult.push(...activeData);

        // D. 放入尾部的固定 -1
        for (let i = 0; i < tailNegOneCount; i++) {
            finalResult.push(-1);
        }

        return finalResult;
    }

    /**
     * <刪除已經填充過的中線資料>
     * 從 ITwoDCoordinate 物件陣列中，根據指定的索引列表刪除多個元素。
     * * @param win2DPos 原始的 ITwoDCoordinate 物件陣列。
     * @param indicesToDelete 包含要刪除的元素的索引值陣列。
     * @returns 刪除指定元素後產生的新陣列。
     */
    private removeCoordinatesByIndices(
        win2DPos: ITwoDCoordinate[],
        indicesToDelete: number[]
    ): ITwoDCoordinate[] {

        const indexSetToDelete = new Set(indicesToDelete);
        const result: ITwoDCoordinate[] = [];

        for (let i = 0; i < win2DPos.length; i++) {

            const currentCoordinate = win2DPos[i];
            const currentIndex = i;

            if (!indexSetToDelete.has(currentIndex)) {
                result.push(currentCoordinate);
            }
        }
        return result;
    }

    /**
     * 將 ITwoDCoordinate 陣列依照 reel 值進行分組，並收集所有 index。
     * @param remainingPos 經過刪除操作後剩餘的 ITwoDCoordinate 陣列。
     * @returns 依照 reel 分組後的 GroupedCoordinate 陣列 (且內部 index 排序完成)。
     */
    private groupCoordinatesByReelOptimized(
        remainingPos: ITwoDCoordinate[]
    ): { reel: number, index: number[] }[] {

        const groupedMap = remainingPos.reduce((acc, coord) => {
            const { reel, index } = coord;

            if (!acc.has(reel)) {
                acc.set(reel, []);
            }

            acc.get(reel)!.push(index);

            return acc;
        }, new Map<number, number[]>());

        let groupedArray: { reel: number, index: number[] }[] = Array.from(groupedMap, ([reel, indices]) => {
            // index 陣列進行由小到大排序
            indices.sort((a, b) => a - b);

            return {
                reel: reel,
                index: indices // 這裡的 indices 已經被排序過了
            };
        });

        return groupedArray;
    }

    private refillTopBoard(board: number[][], replaceList: number[]): void {

        for (let i: number = 0; i < board.length; i++) {
            const reel = board[i];
            reel[0] = replaceList[i];
        }
    }

    //----重新切割盤面相關工具函數(inGame使用)--------------------------------------------------------
    private cutExtraBoardData(board: number[][]): number[][] {
        //--切掉-1的部分
        const cutBoard: number[][] = [];
        for (let i = 0; i < board.length; i++) {
            const reelData: number[] = board[i].filter((x: number) => {
                return x !== -1;
            });
            cutBoard.push(reelData);
        }
        return cutBoard;
    }

    private getMainBoardData(currentBoard: number[][]): number[][] {

        const mainBoard: number[][] = [];
        for (let i = 0; i < currentBoard.length; i++) {
            const reelData: number[] = [];
            for (let j = 1; j < currentBoard[i].length; j++) {
                reelData.push(currentBoard[i][j]);
            }
            mainBoard.push(reelData);
        }
        return mainBoard;
    }

    //--遊戲內補牌用(有就會填進去,沒有要消除的就不會出現在這資料裡面)
    private getReFillDataForGame(reFillData: { reel: number, data: number[] }[]): number[][] {

        const reFillBoard: number[][] = [[], [], [], [], [], []];
        for (let i = 0; i < reFillData.length; i++) {
            const reelIndex = reFillData[i].reel;
            //---要反轉回來--// 先解碼，再反轉
            const decodedData = reFillData[i].data.map(symbol => {
                if (symbol >= ENCODING_FACTOR) {
                    return this.decodeFuckingMonkSymbols(symbol);
                }
                return symbol;
            });
            reFillBoard[reelIndex] = decodedData.reverse();
            //reFillBoard[reelIndex] = reFillData[i].data.slice().reverse();
            //reFillBoard[reelIndex] = reFillData[i].data.slice();
        }
        return reFillBoard;

    }

    /**
     * 在每一輪開始需要wild補牌的資料
     * @param reFillDta 
     */
    private setReFillWildInGame(reFillDta: {
        reel: number,
        data: number[],
        wildCount: number,
        wildIndex: number[]
    }[]): {
        //--整盤面要補的軸內容資料
        allReFillWildData: number[][],
        //---整盤面要補的軸內2d容資料
        reelContentData: { reelIndex: number, iconIndex: number }[][],
        wildFillInfo: { reelIndex: number, iconIndex: number, symbolID: number }[][]
    } {
        const wildReFillInfo: {
            //--整盤面要補的軸內容資料
            allReFillWildData: number[][],
            //---整盤面要補的軸內2d容資料
            reelContentData: { reelIndex: number, iconIndex: number }[][],
            wildFillInfo: { reelIndex: number, iconIndex: number, symbolID: number }[][],

        } = {
            allReFillWildData: [],
            reelContentData: [],
            wildFillInfo: []
        };
        let aryTotal = [[], [], [], [], [], []];
        for (let i: number = 0; i < reFillDta.length; i++) {
            const data = reFillDta[i].data.slice();

            const decodeTop = this.decodeReelSymbolsForGame(data);
            let cutTop = this.cutExtraBoardData([decodeTop])[0];
            cutTop.splice(0, 1);//--切掉頂部橫擺欄位=完整補完牌後的資料
            let len = cutTop.length;
            let wildFillInfoList: { reelIndex: number, iconIndex: number, symbolID: number }[] = [];
            let reelContentData: { reelIndex: number, iconIndex: number }[] = [];
            for (let j: number = 0; j < len; j++) {
                const aryTarget = [];
                aryTarget.push(cutTop[j]);
                const contentData = {
                    reelIndex: reFillDta[i].reel,
                    iconIndex: j
                }
                reelContentData.push(contentData);
                if (cutTop[j] === WILD_LIST[0]) {
                    const wildFillInfo = {
                        reelIndex: reFillDta[i].reel,
                        iconIndex: j,
                        symbolID: cutTop[j]
                    };
                    wildFillInfoList.push(wildFillInfo);
                }
            }
            aryTotal[reFillDta[i].reel] = cutTop.slice();
            wildReFillInfo.reelContentData.push(reelContentData);
            wildReFillInfo.wildFillInfo.push(wildFillInfoList);
        }

        wildReFillInfo.allReFillWildData = aryTotal;
        return wildReFillInfo;
    }

    /**
     * 抽出頂部橫擺欄位資料(準備換牌用)-反轉版
     * @param currentBoard 算分用的盤面(6*8)
     * @returns 
     */
    private getTopBoardReverseData(currentBoard: number[][]): number[] {
        //--全部抽出來
        const topBoard: number[] = [];
        for (let i = currentBoard.length - 1; i >= 0; i--) {
            topBoard.push(currentBoard[i][0]);
        }
        return topBoard;
    }

    /**
     * 抽出頂部橫擺欄位資料(準備換牌用)
     * @param currentBoard 算分用的盤面(6*8)
     * @returns 
     */
    private getTopBoardData(currentBoard: number[][]): number[] {
        //--全部抽出來
        const topBoard: number[] = [];
        for (let i = 0; i < currentBoard.length; i++) {
            topBoard.push(currentBoard[i][0]);
        }
        return topBoard;
    }

    private getOnlyMonkDataForGame(topBoardReverseData: number[]): {
        reelIndex: number, //--有唐僧的軸
        iconIndex: number
    }[] {
        //--這邊已經翻轉過了
        const monkData: {
            reelIndex: number, //--有唐僧的軸
            iconIndex: number
        }[] = [];
        for (let i: number = 0; i < topBoardReverseData.length; i++) {
            let symbol = topBoardReverseData[i];

            if (symbol == SP_MONK_SYMBOL_ID) {
                monkData.push({
                    reelIndex: 6,
                    iconIndex: i
                });
            }
        }

        return monkData;
    }


    private decodeReelSymbolsForGame(topBoardReverseData: number[]): number[] {

        const decodedReel: number[] = [];
        for (let i: number = 0; i < topBoardReverseData.length; i++) {
            let symbol = topBoardReverseData[i];
            //-解碼唐僧symbol
            if (symbol >= ENCODING_FACTOR) {
                symbol = this.decodeFuckingMonkSymbols(symbol);
            }
            decodedReel.push(symbol);
        }

        return decodedReel;
    }

    //--注單使用:只取唐僧symbol資料
    private getOnlyMonkDataForRecord(rawBoard: number[][]): {
        reelIndex: number, //--有唐僧的軸
        iconIndex: number
    }[] {

        const monkData: {
            reelIndex: number, //--有唐僧的軸
            iconIndex: number
        }[] = [];

        const topBoardData = this.getTopBoardData(rawBoard);
        for (let i: number = 0; i < topBoardData.length; i++) {
            let symbol = topBoardData[i];
            //-解碼唐僧symbol
            if (symbol >= ENCODING_FACTOR) {
                symbol = this.decodeFuckingMonkSymbols(symbol);
            }
            if (symbol == SP_MONK_SYMBOL_ID) {
                monkData.push({
                    reelIndex: i,
                    iconIndex: 0
                });
            }
        }

        return monkData;
    }


    /**
     * 檢查副盤指定軸是否有中獎
     * TIPS:唐僧特殊補牌機制,當唐僧出現且在第一軸位置.
     * 1.要檢查該軸是否有中獎
     * 2.如果該軸有中獎,要將該軸唐僧刪除再補牌
     */
    private checkSpReelHasWinAndMonk(topBoardData: number[], win2DPos: ITwoDCoordinate[]): { reelIndex: number, positionIndex: number } | null {

        for (let i: number = 0; i < win2DPos.length; i++) {
            let symbol = topBoardData[MONK_DELETE_REEL_INDEX];
            //-解碼唐僧symbol
            if (symbol >= ENCODING_FACTOR) {
                symbol = this.decodeFuckingMonkSymbols(symbol);
            }
            if (win2DPos[i].reel == MONK_DELETE_REEL_INDEX && symbol == SP_MONK_SYMBOL_ID) {
                return { reelIndex: MONK_DELETE_REEL_INDEX, positionIndex: 0 };
            }
        }
        return null;
    }

    /**
     * 檢查本輪scatter數量(新增的)
     * TIPS:
     * 1.scatter是以實際symbol來判斷有沒有重複
     * 2.本輪內所有累計的scatter會記錄在this._scatterUniqueSet
     * @param twoDArray 
     * @returns 
     */
    public checkScatterRoundCount(twoDArray: number[][]): {
        scatterCount: number,//--scatter的數量(本輪新增的)
        scatterIndex: {
            reelIndex: number,
            iconIndex: number
        }[]
    } {

        const scatterIndexes: {
            reelIndex: number,
            iconIndex: number
        }[] = [];
        let scatterCount = 0;

        for (let i = 0; i < twoDArray.length; i++) {
            const reel = twoDArray[i];
            for (let j = 0; j < reel.length; j++) {
                const realSymbol = reel[j];
                let symbol = reel[j];
                //-解碼scatter symbol
                if (symbol >= ENCODING_FACTOR) {
                    symbol = this.decodeFuckingMonkSymbols(symbol);
                }
                if (symbol === SP_SCATTER_SYMBOL_ID) {

                    if (!this._scatterUniqueSet.has(realSymbol)) {
                        this._scatterUniqueSet.add(realSymbol);
                        scatterCount++;
                        scatterIndexes.push({
                            reelIndex: i,
                            iconIndex: j
                        });
                    }
                }
            }
        }

        if (scatterCount > 0) {
            return {
                scatterCount,
                scatterIndex: scatterIndexes
            };
        }
        return null;
    }

    //---抽出副盤spin4數量(新增的)
    public getSpinFourCount(twoDArray: number[][]): number {

        let count = 0;
        for (let i = 0; i < twoDArray.length; i++) {
            let targetSymbol = twoDArray[i][0];
            //-解碼唐僧symbol
            if (targetSymbol >= ENCODING_FACTOR) {
                targetSymbol = this.decodeFuckingMonkSymbols(targetSymbol);
                if (targetSymbol === SP_SPIN4_SYMBOL_ID) {
                    count++;
                }
            }
        }
        return count;
    }

    public findAllElementIndexes(twoDArray: number[][], targetValue: number): number[] {

        const indexedResults: number[] = twoDArray.map((subArray, index) => {
            let symbol = subArray[0];
            //-解碼唐僧symbol
            if (symbol >= ENCODING_FACTOR) {
                symbol = this.decodeFuckingMonkSymbols(symbol);
            }
            if (subArray.length > 0 && symbol === targetValue) {
                return index;
            } else {
                return -1;
            }
        });

        // 過濾掉所有不匹配 (即 -1) 的索引
        const matchingIndexes: number[] = indexedResults.filter(index => index !== -1);

        return matchingIndexes;
    }

    /**
     * 檢查頂部橫擺欄位是否有中獎
     * @param win2DPos 
     * @returns 是<軸的索引>陣列,因為就是找限定範圍內的index 0是否有中獎
     */
    private checkTopBoardHasWin(win2DPos: ITwoDCoordinate[]): { reelIndex: number[], positionIndex: number[] } {

        const topIndex = [];//--軸索引
        const indexPos = [];//--資料位置索引(準備要刪除使用的)
        for (let i: number = 0; i < win2DPos.length; i++) {
            const reel = win2DPos[i].reel;
            //-注意:因為awardData是補齊6*8,所以它拿到的位置第0軸和第5軸要+1(因為頭被強補-1去填充對齊)
            //const index = (reel == 0 || reel == 5) ? win2DPos[i].index + 1 : win2DPos[i].index;
            const index = win2DPos[i].index;
            const middleReel = reel > 0 && reel < (REEL_AMOUNT - 1);
            if (middleReel && index == 0) {
                topIndex.push(reel);
                indexPos.push(i);
            }
        }
        return { reelIndex: topIndex, positionIndex: indexPos };
    }

    private margeWinLineData(target: AwardData): number[] {

        let winPos: number[] = [];
        for (let item of target.dataList) {
            winPos = winPos.concat(item.WinPos);
        }
        return winPos;
    }


    private createCalculatePayBoard(targetBoard: number[][]): number[][] {

        const boardData: number[][] = [];

        for (let i = 0; i < REEL_AMOUNT; i++) {

            boardData[i] = [];

            for (let j = 0; j < SYMBOL_LENGTH; j++) {

                if (i == 0 || i == REEL_AMOUNT - 1) {

                    if (j == 0) {
                        boardData[i][j] = -1;
                        boardData[i][j + 1] = targetBoard[i][j];
                    } else {
                        if (j < targetBoard[i].length) {
                            boardData[i][j + 1] = targetBoard[i][j];
                        } else {
                            if (j < SYMBOL_LENGTH - 1) {
                                boardData[i][j + 1] = -1;
                            }
                        }
                    }

                } else {

                    if (j < targetBoard[i].length) {
                        boardData[i][j] = targetBoard[i][j];
                    } else {
                        boardData[i][j] = -1;
                    }
                }

            }
        }
        return boardData;
    }

    private createBoardData(cutIndex: number[], targetData: number[], startIndex: number): { boardData: number[][], currentIndex: number } {

        const boardData: number[][] = [];
        let sliceIndex = startIndex;

        for (let i = 0; i < cutIndex.length; i++) {
            const reelLen = cutIndex[i];
            //-startIndex	起始索引 (包含)	從這個索引開始擷取元素。
            //-endIndex	結束索引 (不包含)	擷取到這個索引之前的元素為止。
            const reelData = targetData.slice(sliceIndex, sliceIndex + reelLen);
            boardData.push(reelData);
            sliceIndex += reelLen;
        }

        return { boardData, currentIndex: sliceIndex };//--直接算到下一個位置的開頭
    }

    private processTotalOddsForGameRound_NG(targetRounds: IInGameRoundRecord[]): number {

        let totalOdds = 0;
        for (let item of targetRounds) {
            totalOdds = (totalOdds + item.totalOdd).fixed();//--累加每一局的賠率---NG用的
        }
        return totalOdds;
    }

    private processTotalOddsForGameRound_FG(targetRounds: IInGameRoundRecord[]): { totalOdds: number, totalMultiplier: number, totalOddsRaw: number } {

        let totalOdds = 0;
        let multiplier = 0;
        let totalOddsRaw = 0;
        for (let item of targetRounds) {
            if (item.totalOdd > 0) {
                multiplier += 1;
                const winData = item.winLine;
                this.processMultiplierForGameRound_FG(winData, multiplier);
                item.multiplier = multiplier;//--那一把的倍數
                const targetOdd = item.totalOdd * multiplier;
                totalOdds = (totalOdds + targetOdd).fixed();//--累加每一局的賠率---FG累計
                totalOddsRaw = (totalOddsRaw + item.totalOdd).fixed();//--累加每一局的賠率(沒有乘上倍數)
            }

        }
        return { totalOdds, totalMultiplier: multiplier, totalOddsRaw };
    }

    private processMultiplierForGameRound_FG(winData: IMatchInfoForRound[], multiplier: number): void {
        for (let item of winData) {
            item.multiplier = multiplier;
        }
    }

    private processTotalSpinFourCountForRound(targetRounds: IInGameRoundRecord[]): number {

        let totalSpinFourCount = 0;
        for (let item of targetRounds) {
            totalSpinFourCount += item.spin4Count;//--累加每一局的spin4數量
        }
        return totalSpinFourCount;
    }

    private processTotalOddsForRound(targetRounds: ITemporaryRoundData[]): number {

        let totalOdds = 0;
        for (let item of targetRounds) {
            let wildTotalOdd = 0;
            if (!item.winDataList && !item.wildInfo) {
                continue;//--最終盤
            } else if (item.winDataList) {
                wildTotalOdd = item.winDataList.totalOdd;
            } else if (item.wildInfo.winDataList) {
                wildTotalOdd = item.wildInfo.winDataList.totalOdd;
            }

            totalOdds = (totalOdds + wildTotalOdd).fixed(); //--累加每一局的賠率
        }
        return totalOdds;
    }

    //--映射topBoard使用
    private getTopBoardClientIconIndex(reelIndex: number): number {
        // 假設只有捲軸 1, 2, 3, 4 參與 Top Board
        if (reelIndex >= 1 && reelIndex <= 4) {
            // 映射關係: 1->3, 2->2, 3->1, 4->0
            return 4 - reelIndex;
        }
        // 不參與 Top Board 的捲軸 (0, 5) 或其他捲軸，返回預設值
        return -1;
    }

    //--scatter位置轉換遊戲內使用(只會出現在主盤)
    private getScatterDataForGame(scatterData: { reelIndex: number, iconIndex: number }[]): { reelIndex: number, iconIndex: number }[] {

        const returnData: { reelIndex: number, iconIndex: number }[] = [];
        for (let i: number = 0; i < scatterData.length; i++) {
            const reSetScatterData = {
                reelIndex: scatterData[i].reelIndex,
                iconIndex: scatterData[i].iconIndex - 1
            }
            returnData.push(reSetScatterData);
        }
        return returnData;
    }

    private getTopReFillDataForGame(reFillTopData: { removeData: number[], reFillData: number[] }): { removeData: number[], reFillData: number[] } {

        const returnData = { removeData: [], reFillData: [] };
        for (let i: number = 0; i < reFillTopData.removeData.length; i++) {
            let resetIndex = this.getTopBoardClientIconIndex(reFillTopData.removeData[i]);
            let symbol = reFillTopData.reFillData[i];
            //--decode
            if (symbol >= ENCODING_FACTOR) {
                symbol = this.decodeFuckingMonkSymbols(symbol);
            }
            returnData.reFillData.push(symbol);
            returnData.removeData.push(resetIndex);
        }

        returnData.reFillData.reverse();//--反轉回來
        returnData.removeData.reverse();//--反轉回來

        return returnData;
    }

    private getWinRemoveDataForGame(target: IMatchInfoForRound[]): number[][] {

        const returnData = [[], [], [], [], [], []];
        for (let i: number = 0; i < target.length; i++) {
            const matchPos = target[i].matchPos;
            for (let j: number = 0; j < matchPos.length; j++) {
                const reelIndex = matchPos[j].reelIndex;
                const iconIndex = matchPos[j].iconIndex;
                if (reelIndex >= 0 && reelIndex <= 5) {
                    //--主盤面
                    returnData[reelIndex].push(iconIndex);
                }
                //--reFillTop已經有紀錄相關資訊了
                /*else if(reelIndex===6){
                    //--top盤面
                    returnData.top.push(iconIndex);
                }*/
            }
        }

        // 對每個軸的資料進行排序(小到大)後反轉
        for (let i = 0; i < returnData.length; i++) {
            if (returnData[i].length > 0) {
                returnData[i].sort((a, b) => a - b);  // 由小到大排序
                //returnData[i].reverse();               // 反轉
            }
        }

        return returnData;
    }



    private getWindDataForGame(aw: AwardData, card2ds: number[][]): IMatchInfoForRound[] {

        const returnAry: IMatchInfoForRound[] = [];
        const aryTargetData: ClientData[] = aw.dataList;
        const uniquePosSet: Set<string> = new Set(); // 用於儲存唯一的 [reelIndex]-[pos] 組合字串
        //const uniqueMatchPos: IMachPosInfo[] = []; // 儲存去重後的 IMachPosInfo 列表

        for (let clientData of aryTargetData) {

            const win2ds = clientData.Win2DPos;
            let matchPos: IMachPosInfo[] = [];

            win2ds.forEach((posList, reelIndex) => {

                if (posList.length > 0) {

                    posList.forEach(pos => {

                        const key = `${reelIndex}-${pos}`;
                        if (uniquePosSet.has(key)) {
                            return;
                        }
                        uniquePosSet.add(key);
                        let machPosInfo: IMachPosInfo;
                        if (pos > 0) {
                            // --- 主盤面邏輯 (pos: 1-based, 符號 ID 存取: card2ds[i][pos]) ---
                            let symbolID = card2ds[reelIndex][pos];
                            // 解碼特殊符號
                            if (symbolID >= ENCODING_FACTOR) {
                                symbolID = this.decodeFuckingMonkSymbols(symbolID);
                            }

                            machPosInfo = {
                                reelIndex: reelIndex, // 捲軸 0-5
                                iconIndex: pos - 1,   // 轉換為客戶端 0-based 索引
                                realSymbolID: card2ds[reelIndex][pos] // 存取 6x8 陣列的 [1] 到 [7]
                            };
                        } else {
                            // --- Top Board 邏輯 (pos <= 0，即 pos = 0) ---
                            const clientIconIndex = this.getTopBoardClientIconIndex(reelIndex);

                            let symbolID = card2ds[reelIndex][0];
                            // 解碼特殊符號
                            if (symbolID >= ENCODING_FACTOR) {
                                symbolID = this.decodeFuckingMonkSymbols(symbolID);
                            }
                            machPosInfo = {
                                reelIndex: 6, // 假設 Top Board 捲軸索引是 6
                                iconIndex: clientIconIndex,
                                realSymbolID: card2ds[reelIndex][0] // 存取 6x8 陣列的 [0]
                            };
                        }
                        matchPos.push(machPosInfo);
                    });

                }

            });
            matchPos.sort((a, b) => a.reelIndex - b.reelIndex);
            // 4. 建立當前的回合匹配資訊
            const matchInfo: IMatchInfoForRound = {
                winLineID: -1,
                odd: clientData.WinOdds,
                matchPos: matchPos,
                winSymbolID: clientData.WinSymbolID,
                // Wild 檢查邏輯保持不變
                isWild: this.checkIsWildExist(card2ds.flat(), clientData.WinPos),
                winWays: clientData.waysCount,
                multiplier: 0
            };

            // 5. 將結果推入陣列 (代替 map 的回傳)
            returnAry.push(matchInfo);
        }

        return returnAry;
    }


    //--注單使用
    private getWindDataForRecord(aw: AwardData, card1ds: number[]): IMatchInfoForRound[] {

        const returnAry: IMatchInfoForRound[] = [];
        const aryTargetData: ClientData[] = aw.dataList;
        for (let clientData of aryTargetData) {
            const matchInfo: IMatchInfoForRound = {
                winLineID: -1,
                odd: clientData.WinOdds,
                matchPos: this.getMachPosInfo(clientData.WinPos, card1ds),
                winSymbolID: clientData.WinSymbolID,
                isWild: this.checkIsWildExist(card1ds, clientData.WinPos),
                winWays: clientData.waysCount,//--這條線中獎的組合數(連線數)
                multiplier: 0
            };
            returnAry.push(matchInfo);
        }

        return returnAry;
    }

    private getMachPosInfo(win1ds: number[], card1ds: number[]): IMachPosInfo[] {

        const machPosInfoList: IMachPosInfo[] = [];
        const win2ds = this._processDataTools.convertWinFlatToTwoD(win1ds, SYMBOL_LENGTH);

        for (let i: number = 0; i < win1ds.length; i++) {
            const pos = win1ds[i];
            const machPosInfo: IMachPosInfo = {
                realSymbolID: card1ds[pos], //--圖示id(真實的盤面圖片)
                reelIndex: win2ds[i].reel,
                iconIndex: win2ds[i].index
            };
            machPosInfoList.push(machPosInfo);
        }
        return machPosInfoList;
    }

    //--檢查連線的牌組當中是否有wild去取代的(表演需要使用)
    private checkIsWildExist(card1ds: number[], winLine: number[]): boolean {

        for (let item of winLine) {
            if (WILD_LIST.includes(card1ds[item])) {
                return true;
            }
        }
        return false;
    }

    private getFinalFGTimes(value: number): number {

        let finalFgCount: number | undefined = undefined;
        let maxKey: number = -1;// 找到小於等於 targetCount 的最大鍵
        for (const key in FG_TIMES_FOR_SCATTER) {
            const numKey: number = parseInt(key);
            if (numKey <= value && numKey > maxKey) {
                maxKey = numKey;
                finalFgCount = FG_TIMES_FOR_SCATTER[numKey];
            }
        }
        if (finalFgCount == undefined) {
            finalFgCount = 0;
        }
        return finalFgCount;
    }

    /**
     * 將兩個字節還原成一個完整的字節
     * @param lowNibble 低位(1)
     * @param highNibble 高位(2)
     */
    private combineNibblesToByte(lowNibble: number, highNibble: number): number {
        return (highNibble << 4) | lowNibble;
        // 或者: return highNibble * 16 + lowNibble;
    }
    //--20260313
    private nibblesArrayToDouble(nibbles: number[]): number {
        if (nibbles.length !== 16) {
            console.error('Double需要16個半字節');
            return 0;
        }

        //--先還原成8個完整byte
        const bytes = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            const lowNibble = nibbles[i * 2];
            const highNibble = nibbles[i * 2 + 1];
            bytes[i] = this.combineNibblesToByte(lowNibble, highNibble);
        }

        // 將byte換為Double
        const dataView = new DataView(bytes.buffer);
        return dataView.getFloat64(0, true); // true = little-endian
    }

    public getBase64Data(byte: BinaryBuffer): string {
        return this._processDataTools.getBase64Data(byte);
    }





}