import { DefinitionGameConfigData } from "../DefinitionGameData1024/GameConfigInstance1024";
import { ProcessDataAfterServer } from "../MyUtils/BasicProcessServerData/ProcessDataAfterServer";
import { GameState, IMatchInfoForRound } from "../ReferencePath";
import { BetRecordInfo, IInGameRoundRecord } from "../ServerBackSlotInfoData/DefType1024";
//import { DefinitionGameConfigData } from '../../DefinitionGameData1024/GameConfigInstance1024';
const {

} = DefinitionGameConfigData;

const MAX_COMPARE_LEN = 5;
const SP_SPIN4_SYMBOL_ID = 12;//--spin4的symbolID

export class ProcessDataAfterServer1024 extends ProcessDataAfterServer {


    public clearAllData(): void {

    }

    /**
     * 向NG的BetRecordInfo取出目前FG的條件
     * (目前是看scatter數量,但如果之後有其他條件也會放在這裡)
     * 1.出現4~6個sc(佛祖)就會進入FG
     *  4Scatter=10局    
        5Scatter=14局
        6Scatter=18局
        如果出現最高上限22局則直接進入FG
     */
    /*
    * @returns 回傳目前FG的條件,包含scatter數量、FG局數、是否可以進入FG
    */
    public getCurrentFGCondition(): { sc: number, fg: number, canGoFG: boolean } {

        const totalScCount = (this._server as BetRecordInfo).totalScatterCount;
        const totalFgTimesForSc = (this._server as BetRecordInfo).getFGCountForScatter;
        let gambleFlag: boolean = false;
        if (totalScCount > 0 && totalFgTimesForSc > 0) {
            gambleFlag = true;
        }
        return {
            sc: totalScCount,
            fg: totalFgTimesForSc,
            canGoFG: gambleFlag
        }

    }

    public getTotalFGRoundCount(): number {
        //let fgCount: number = 0;-totalFgRounds
        const totalFgRounds = this.getServerProperty('totalFgRounds');
        return totalFgRounds ?? 0;
    }
    /**
     * 算Way數量用的
     * @param reelID 
     */
    public getCurrentBoardReelLen(reelID: number): number {

        if (reelID >= MAX_COMPARE_LEN + 1) return 0;
        const currentRoundData = this.getCurrentData() as IInGameRoundRecord;
        let currentLen: number = currentRoundData.reelInfo.symbolData2ds[reelID].length;
        if (reelID > 0 && reelID < MAX_COMPARE_LEN) {
            currentLen += 1;//--要算上上方的父盤
        }
        return currentLen;
    }


    public getCurrentRoundWinData(): {
        winLine: IMatchInfoForRound[],
        reelLens: number[],
        reFillWinDataInfo: { reFillData: number[][], removeData: number[][] },
        reFillTop: { reFillData: number[], removeData: number[] },
        sp4IndexTop: number[]
    } {

        const currentRoundData = this.getCurrentData() as IInGameRoundRecord;
        const state = this.getCurrentState();
        let boardData: number[][];
        let reelMaxLen: number[];
        let topBoardData: number[] = currentRoundData.topReelSymbolData1ds;


        if (currentRoundData.winLine) {
            if (currentRoundData.winLine.length > 0) {

                topBoardData = currentRoundData.topReelSymbolData1ds;

                if (state == GameState.NORMAL || state == GameState.FREE_GAME) {
                    //--ng--
                    boardData = this.checkIsReFillWildAndReplace(currentRoundData.reelInfo.symbolData2ds, currentRoundData.wildReFill);
                    reelMaxLen = this.getReelLens(boardData, topBoardData);
                }
            }
        } else {
            //--沒有得分
        }
        let sp4Index: number[] = [];
        if (state == GameState.FREE_GAME && currentRoundData.spin4Count > 0) {
            sp4Index = this.findAllIndex(topBoardData, SP_SPIN4_SYMBOL_ID, true);//--抽出所在位置的iconIndex
        }

        const returnData = {
            winLine: currentRoundData.winLine,
            reelLens: reelMaxLen,
            reFillWinDataInfo: currentRoundData.reFillWinDataInfo,
            reFillTop: currentRoundData.reFillTop,
            sp4IndexTop: sp4Index//--SP4所在位置與數量
        }
        return returnData;
    }


    public getReFillWildData(): {
        wildReFill: {
            allReFillWildData: number[][],
            reelContentData: { reelIndex: number, iconIndex: number }[][],
            wildFillInfo: { reelIndex: number, iconIndex: number, symbolID: number }[][],
        },
        excludedReel: number[],
        excludeMonkIcon: number[],
        monkIndexList: number[],
        triggerMonkReel: number[]//--驅動monk特效用
    } | null {

        const currentRoundData = this.getCurrentData() as IInGameRoundRecord;
        const state = this.getCurrentState();
        const wildInfoData = currentRoundData.wildReFill;

        const returnData = {
            wildReFill: wildInfoData,
            excludedReel: null,
            excludeMonkIcon: [],
            monkIndexList: [],
            triggerMonkReel: []//--驅動monk特效用
        }
        if (state == GameState.NORMAL || state == GameState.FREE_GAME) {
            if (!wildInfoData) return;
            const wildInfo = wildInfoData.wildFillInfo;
            if (wildInfo.length > 0) {
                //--有補wild的資料
                //--要做的事
                const monkIndex = [];
                const triggerMonkReel = [];
                //const monkInfo=currentRoundData.monkInfo;
                for (let i: number = 0; i < wildInfo.length; i++) {
                    //--資料已經+1了
                    triggerMonkReel.push(wildInfo[i][0].reelIndex);
                    monkIndex.push(this.getReFillWildMonkIndex(wildInfo[i][0].reelIndex));
                }
                const excludedReel = this.fastPickExcludeReel(wildInfo);
                const excludeMonkIcon = this.fastPickMonkIcons(monkIndex);

                returnData.excludedReel = excludedReel;
                returnData.excludeMonkIcon = excludeMonkIcon;
                returnData.monkIndexList = monkIndex;
                returnData.triggerMonkReel = triggerMonkReel;
                return returnData;
            }

        }

        return null;
    }
    /**
     * 20260324 NEW 取得當前是否有相關補牌資料(包含主盤和副盤),以及相關資料的存在與否
     * @returns 
     */
    public getCurrentReFillDataInfo(): {
        hasReFillWinDataInfo: boolean,
        hasReFillTopDataInfo: boolean
    } {
        const currentRoundData = this.getCurrentData() as IInGameRoundRecord;
        //--預設值裡面會是空陣列,所以只要判斷長度就好
        const reFillWinDataInfo = currentRoundData.reFillWinDataInfo;
        const reFillTop = currentRoundData.reFillTop;
        let hasReFillWin: boolean = false;
        let hasReFillTopData: boolean = false;
        if (reFillWinDataInfo.reFillData.length > 0 && reFillWinDataInfo.removeData.length > 0) {
            hasReFillWin = true;
        }

        if (reFillTop.reFillData.length > 0 && reFillTop.removeData.length > 0) {
            hasReFillTopData = true;
        }

        return {
            hasReFillWinDataInfo: hasReFillWin,
            hasReFillTopDataInfo: hasReFillTopData
        };
    }

    /**
     * 20260324 NEW 取得前一輪是否有相關補牌資料(包含主盤和副盤),以及相關資料的存在與否
     * @returns 
     */
    public getPrevReFillDataInfo(): {
        hasReFillWinDataInfo: boolean,
        hasReFillTopDataInfo: boolean
    } {

        let hasReFillWin: boolean = false;
        let hasReFillTopData: boolean = false;
        //--避免第一筆資料this._roundIdx<=0
        if (this.hasPrev) {
            const currentRoundData = this.getPrevData() as IInGameRoundRecord;
            //--預設值裡面會是空陣列,所以只要判斷長度就好
            const reFillWinDataInfo = currentRoundData.reFillWinDataInfo;
            const reFillTop = currentRoundData.reFillTop;

            if (reFillWinDataInfo.reFillData.length > 0 && reFillWinDataInfo.removeData.length > 0) {
                hasReFillWin = true;
            }

            if (reFillTop.reFillData.length > 0 && reFillTop.removeData.length > 0) {
                hasReFillTopData = true;
            }
        }

        return {
            hasReFillWinDataInfo: hasReFillWin,
            hasReFillTopDataInfo: hasReFillTopData
        };
    }

    //--20260326 NEW 取得當前資料的round數,以及與前一筆資料的round數是否相同
    public getCurrentRound(): number {
        const currentRoundData = this.getCurrentData() as IInGameRoundRecord;
        return currentRoundData.round;
    }

    //--20260326 NEW 取得前一筆資料的round數
    public getPrevRound(): number {
        if (this.hasPrev) {
            const currentRoundData = this.getPrevData() as IInGameRoundRecord;
            return currentRoundData.round;
        } else {
            return -1;//--沒有上一輪資料
        }
    }

    //--20260326 NEW 判斷當前資料的round數與前一筆資料的round數是否相同
    public checkDataIsSameRound(): boolean {
        if (this.hasPrev) {
            const currentRoundData = this.getCurrentData() as IInGameRoundRecord;
            const prevRoundData = this.getPrevData() as IInGameRoundRecord;
            return currentRoundData.round === prevRoundData.round;
        } else {
            return false;//--沒有上一輪資料
        }
    }

    /**
     * 
     * @param topData 
     * @param spin4Count 
     * @param extraAdd 頭部會多一個預備牌(實際索引位置要+1),這個變數是用來決定要不要+1
     * @returns 
     */
    private findAllIndex<T>(topData: T[], spin4Count: T, extraAdd: boolean = false): number[] {
        return topData.reduce((accumulator, currentValue, idx) => {
            if (currentValue === spin4Count) {
                let indexToPush = extraAdd ? idx + 1 : idx;
                accumulator.push(indexToPush);
            }
            return accumulator;
        }, []);
    }

    private checkIsReFillWildAndReplace(
        board: number[][],
        wildReFill: {
            allReFillWildData: number[][],
            //---整盤面要補的軸內2d容資料
            reelContentData: { reelIndex: number, iconIndex: number }[][],
            wildFillInfo: { reelIndex: number, iconIndex: number, symbolID: number }[][],
        }): number[][] {

        if (wildReFill) {
            if (wildReFill.wildFillInfo.length > 0) {
                const replaceTarget = wildReFill.allReFillWildData;
                const cloneBoardData = JSON.parse(JSON.stringify(board));
                for (let i = 0; i < replaceTarget.length; i++) {
                    if (replaceTarget[i].length > 0) {
                        //--有補牌
                        cloneBoardData[i] = replaceTarget[i];
                    }
                }
                return cloneBoardData;
            } else {
                return board;
            }
        } else {
            return board;
        }

    }



    //--盤面資料是切掉補排的狀態
    private getReFillWildMonkIndex(reelIndex: number): number {
        return MAX_COMPARE_LEN - reelIndex;
    }

    private fastPickExcludeReel(info: { reelIndex: number, iconIndex: number, symbolID: number }[][]): number[] {
        // 提取所有出現過的 reelIndex (只拿二維陣列中每一項的第一個物件)
        const occupiedIndexes = new Set(info.map(group => group[0]?.reelIndex));
        const targetAry = [0, 1, 2, 3, 4, 5];
        // 過濾出未被佔用的索引
        const excludedIndexes = targetAry.filter(index => !occupiedIndexes.has(index));
        return excludedIndexes;
    }

    private fastPickMonkIcons(index: number[]): number[] {
        const targetAry = [0, 1, 2, 3, 4, 5];
        // 過濾出未被佔用的索引
        const excludedIndexes = targetAry.filter(i => !index.includes(i));//--送進來的資料已經+1了
        return excludedIndexes;
    }

    private fastPickExcludeIcon(info: { reelIndex: number, iconIndex: number }[]): number[] {

        const targetAry = [0, 1, 2, 3, 4, 5];//--上面4個+上下兩個效果補牌
        const excludeSet = new Set(info.map(item => item.iconIndex + 1));//--index從0開始,所以取位置要+1
        // 一次性過濾
        return targetAry.filter(index => !excludeSet.has(index));
    }

    //--要換消除效果的大小使用的
    private getReelLens(reelData: number[][], topData: number[]): number[] {

        const reelLens: number[] = [];
        reelData.push(topData);
        for (let i = 0; i < reelData.length; i++) {
            reelLens.push(reelData[i].length);
        }

        return reelLens;
    }



}