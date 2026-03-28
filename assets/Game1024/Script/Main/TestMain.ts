import { _decorator, Component, Game, Node } from 'cc';
import { GameState, Utility } from '../ReferencePath';
import { ProcessSlotData1024 } from '../ServerBackSlotInfoData/ProcessSlotData1024';

import { UniReelView1024 } from '../Slot/UniReelView1024';
import { InitRandomGenerator, IRandomData } from '../MyUtils/BasicRandomGenerator/InitRandomGenerator';
import { IStrategyRandomGenerator } from '../MyUtils/BasicRandomGenerator/IStrategyRandomGenerator';
import { UniSlotMachine } from '../Slot/ReferencePathForUniSlot';
import { UniSlotMachine1024 } from '../Slot/UniSlotMachine1024';
import { GameUtilsTools } from '../MyUtils/GameUtilsTool';
import { BetRecordInfo, IInGameRoundRecord } from '../ServerBackSlotInfoData/DefType1024';
import { TransReelAniComponentCtrl } from '../GameDisplay1024/TransformReel/TransReelAniComponentCtrl';
import { GameViewManager1024 } from '../GameViewManager1024/GameViewManager1024';
import { TestCheckScore1024 } from '../TestCheckScore/TestCheckScore1024';

const { ccclass, property } = _decorator;

@ccclass('TestMain')
export class TestMain extends Component {

    @property({ type: UniReelView1024, visible: true, tooltip: '測試用滾輪介面' })
    private _testReelView: UniReelView1024 = null;

    @property({ type: UniSlotMachine1024, visible: true, tooltip: '測試用slot機器' })
    private _testSlotMachine: UniSlotMachine1024 = null;

    @property({ type: TransReelAniComponentCtrl, visible: true, tooltip: '變形軸動畫控制器' })
    private _testTransformReelAniComponentCtrl: TransReelAniComponentCtrl = null;

    @property({ type: TestCheckScore1024, visible: true, tooltip: '測試用算分工具' })
    private _testCheckScoreTool: TestCheckScore1024 = null;

    private _testProcess: ProcessSlotData1024 = null;

    private _testData: BetRecordInfo;

    private _gameManagerTest: GameViewManager1024 = null;

    start() {
        //--看範例:test/BoardAnalysisTest/MegaWaysWinScoreAnalyzerTest

        this.testProcessData();
        //this.testSlot();
    }

    public _testCheckSPSymbol(): void {
        this._testCheckScoreTool.onBtnClick();
    }

    private testProcessData(): void {
        this._testProcess = new ProcessSlotData1024();
        this._gameManagerTest = this.node.getComponent(GameViewManager1024);
        this._gameManagerTest.init();
        this._gameManagerTest.registerSystem();
        /*
         
         winIdList--> 要消除的圖示位置(索引icon index)
         winIdList-->[[1,3,5],[3],[1,2],[4],[],[1,2]]
         refillData.refillIconIdList--> 要補入的圖示ID
          refillData.refillIconIdList-->[[0,0,5],[6],[10,3],[7],[],[4,5]]
         
        await this.slotMachine.startDropRefill(winIdList, refillData.refillIconIdList);
         */
        /**
         * https://www.youtube.com/watch?v=5nNJWnMVYJ4
         * 有唐僧和wild的參考影片
         */
        //--有唐僧(base64-byte有a=10)
        //let test64 = 'N1ZmEnYbGGMlIQi6VEW2EncgZRRFFTExRDMygHFkG0dXOCEScGRViCI=';
        //let test64 = 'VWVURSI4JxNTEINSQTBwMiuA';//--無得分
        //let test64 = 'QmVGITIRchOAU3REBlNmNRUAYII=';//--110
        //let test64 = 'UndmRGhAAGAVRTo2FmMlRlCAiBCEBg==';//--odds=0.2--error

        //let test64 = 'c3QztaACYFWxExlGVjITIUJHS1OzcHU=';//--6000bet/score=6720
        //--初始盤就有光頭變形
        //let test64 = 'VzUkNXsyNCdWgoGjGyBFUkKKNRdBchFzQRcohEALggMgEDByMxIS';//--server odds=12.32--error--my odds=22.16
        //let test64 = 'RGdDQBtQA1QRUihhUaIhAWFBdQGEuCU=';//--server odds=2--error--my odds=1.3
        //let test64 = 'd3dld3YHZyOAd1A7QmVlAySBgwAIQDcRZQVxOLIwMiOGd1YwijBmF1QTUnGjWHBwuBgYVHETBIg3AhcTs1EI';//--server odds=35.44--error--my odds=34.84
        //let test64 = 'd2Y0YzC3pyUFOzA2djCDE3AyAARFsxGGdyFUBoa1';//--server odds=22.12--error--my odds=22.2//-有FG

        //-score 7792 bet 100
        //let test64 = 'MzdDgWGEcGYgAXdIdhMgRUNzABUSNXISdiJVAGdSQyaHWCZlc1MWJ2JmQFVVRTEDeCQzZWIYQIc7ODZgNmM1hGEwUQEwgGcEU3cVAjdGcnZFVDUFQoEwQgMEdWAmJmIkhzMiM1YnOCdIhRBCV4ARgEISVUNFVIA3eBJQQnN0QHIWd1NFQ4FFSCeFYYhAaIgBJyEyKGBTQ1QWAjdxFxEyZFIzOGhyJWdWF0VDRFAzcAInUgcHEEUUNwUxVFWHczNXVSiCcQEHF1cXiAJVRVdUGFRihoJXgSCEYxNxNEYyZCZ1NkYyJIclVmB3cnCBMEZDQwKGSEdXc4BwB3IE';
        //-score 2036400 bet 6000--有spin4
        /**
         * PS-在FG當中symbol11=spin4+=12要換牌
         * 因為11不會出現在FG(只會出現在NG當中)
         */
        /*
        let test64 = 'Q1RFUTATN0EyKAgBQEGAEShSRUNCESUyhAVLdyUzYkA0RXcDhGBnIDVHgEh4RniFElhUVFMwZAclElMCcjR1SGZhMFExNDQ1d1ElETJVhiYwchGXZlVSU0MVYQhQFER2dCEAWAFRVVREJRcjCjY4YwYBIUZVFgEwNTdzU3UBWEQCdjIlBkFYVjY4NXZFMIIzAyQjUyVxZBgHOINTNUSBUBASeUBTBzUQQYZAcoEwJXRTA0dgEiBzI1VYEXggcSciAYUiiFVzdWEDEWE0EIBCU0EXaBRkMnBkQWcoMjRUNBJ4FVckNUaIdwZjNFU2FxaBdThBYVcAOEJUhoCCBnaHc3dkV4RVNEc1cBYnWAAzJGgHg2M3EkVVQzgxNVdkR4dwQUFwgHdDQydSdmdURmNVdygzhnRFZIgHQFM0VIWFEmc1ATODh0hn';
        const aryBuffer = Utility.base64ToBinaryBuffer(test64);
        //this._testProcess.testProcessSlotData(aryBuffer, 100);
        //--這邊取資料是分開取的-NG/FG會分開取-所以後面要帶入目前遊戲狀態
        this._testProcess.setNewRoundData(aryBuffer, 100, GameState.FREE_GAME);
        //this._testProcess.setNewRoundData(aryBuffer, 100, GameState.NORMAL);

        // NG中獲得4-6個內進入挑戰遊戲
        // 超過這個上限就已經直接進入FG了
        // 4Scatter=10局    
        // 5Scatter=14局
        // 6Scatter=18局
        //-最高上限22局

        const testRoundData = this._testProcess.getBettingRecordList();
        this._testData = this._testProcess.getGameRoundData();
        //--game id=12052
        //--測試使用 
        //this._testData = testInGameRoundData.ngReelInfo[0].reelInfo.symbolData2ds;
        console.log('checkTotalScore', this._testProcess.getCheckScore());
        console.log('testRoundDataQQ', testRoundData);
        console.log('testInGameRoundDataQQ', this._testData);
        */

        //--20260313修改後的server資料結構(向後位移10個字節)


        let test64_20260313 = 'JAAAAAAAAIizQGdlRihSEwAwt2SxhTZnJXFrZXcjRnhIUzCwEA==';
        const aryBuffer = Utility.base64ToBinaryBuffer(test64_20260313);
        this._testProcess.setNewRoundData(aryBuffer, 100, GameState.NORMAL);
        const testRoundData = this._testProcess.getBettingRecordList();
        this._testData = this._testProcess.getGameRoundData();
        console.log('_ngRoundData', this._testData);


        /*
        let testDoubleGame64 = 'Dg==';
        const doubleGameBuffer = Utility.base64ToBinaryBuffer(testDoubleGame64);
        this._testProcess.setNewRoundData(doubleGameBuffer, 100, GameState.DOUBLE_GAME);
        const doubleGameRoundData = this._testProcess.getBettingRecordList();
        console.log('doubleGameRoundData', doubleGameRoundData);
        */

        /*
        let testFg64 = 'KQAAAAAAAIizQFRXVRQ1R3MSKFMXcmZwRGIWgQNweHNTVHMQRGEnMThXAGMXUVIgVEVVJwFHRHZEZidXATVggXc2dTV2EogYZUeCUVMAd0higjdyJ4gCN4EDNkJFJTAXNCUXMUR4CAYIQ0VTUhUFVHZmAlBBEBI0IRRXM0RGNEAhFncFIzFBR3gXRVMnhDJlQ0IwEighdQcRFUhIVRQwUzBGU0MUVShYCIZRMGJwREMhKHcoUkRUI4A2IGAQKGR1GGKHU2aCATBUMzVnAhdWNSUmVREWIkI0Jyg0IlNjJEVANzJhM0VkVYFQiABBAQUoQDGBKEU1AnNFRycEOIJGNUU=';
        const aryBufferFg = Utility.base64ToBinaryBuffer(testFg64);
        this._testProcess.setNewRoundData(aryBufferFg, 100, GameState.FREE_GAME);
        const testRoundData = this._testProcess.getBettingRecordList();
        this._testData = this._testProcess.getGameRoundData();
        console.log('_fgRoundData', this._testData);
        */

    }

    private testSlot(): void {
        this._testSlotMachine.init();
        /*
        const randomInit = this.initIconSymbol<IRandomData, number[][]>(new InitRandomGenerator(), {
            groupSizes: [4, 2, 5, 3, 2, 4, 4],
            randomGroupSource: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        });
        console.log('randomInit__', randomInit);
        this._testReelView.initIconSymbol(randomInit);
        */
    }

    private initIconSymbol<TInput, TResult>(generator: IStrategyRandomGenerator<TInput>, value: TInput): TResult {
        //--要產出亂數初始盤面2ds
        return generator.generate(value) as TResult;
    }


    public testProcess(): void {

        //const target = this._testData.ngReelInfo[0] as IInGameRoundRecord;
        //const subBoard = JSON.parse(JSON.stringify(target.topReelSymbolData1ds));
        //const mainBoard = JSON.parse(JSON.stringify(target.reelInfo.symbolData2ds));
        //mainBoard.push(subBoard);

        this._gameManagerTest.runTest(this._testData);

    }


    public async testRunRandom(): Promise<void> {


        this._testSlotMachine.startRoll(false);
        //--這邊要組合盤面將副盤塞到最後面
        const target = this._testData.ngReelInfo[0] as IInGameRoundRecord;
        const subBoard = JSON.parse(JSON.stringify(target.topReelSymbolData1ds));
        const mainBoard = JSON.parse(JSON.stringify(target.reelInfo.symbolData2ds));
        mainBoard.push(subBoard);

        //this._testReelView.testRunRandom();
        await GameUtilsTools.DeferByTweenPromise(0.2);
        await this._testSlotMachine.stopRoll(mainBoard);//--深拷貝
        console.log();
        if (target.wildReFill) {
            //--拿target.wildReFill.wildFillInfo的資料去做補牌
            if (target.wildReFill.wildFillInfo) {
                const excludedReel = this.fastPickExcludeReel(target.wildReFill.wildFillInfo);
                const monkInfo = target.monkInfo;

                const excludeMonkIcon = this.fastPickExcludeIcon(target.monkInfo);
                this._testSlotMachine.setIconLight(6, excludeMonkIcon, true);
                this._testSlotMachine.setReelsLight(excludedReel, true);
                await this._testSlotMachine.setWildExtraInfo(target.wildReFill.wildFillInfo);
            }
        }

        //const mainFinalData = target.reFillWinDataInfo.reFillData;
        //const mainRemoveData = target.reFillWinDataInfo.removeData;
        //const subFinalData = target.reFillTop.reFillData;
        //const subRemoveData = target.reFillTop.removeData;

        //await this._testSlotMachine.startReFillDrop({ reFill: mainFinalData, remove: mainRemoveData }, { reFill: subFinalData, remove: subRemoveData });
        console.log('=====finish testRunRandom=====');
        /*
        this._testSlotMachine.startRoll(false);
        //--這邊要組合盤面將副盤塞到最後面
        const target = this._testData.ngReelInfo[0] as IInGameRoundRecord;
        const subBoard = JSON.parse(JSON.stringify(target.topReelSymbolData1ds));
        const mainBoard = JSON.parse(JSON.stringify(target.reelInfo.symbolData2ds));
        mainBoard.push(subBoard);

        //this._testReelView.testRunRandom();
        await GameUtilsTools.DeferByTweenPromise(0.2);
        await this._testSlotMachine.stopRoll(mainBoard);//--深拷貝
        console.log();
        const mainFinalData = target.reFillWinDataInfo.reFillData;
        const mainRemoveData = target.reFillWinDataInfo.removeData;
        const subFinalData = target.reFillTop.reFillData;
        const subRemoveData = target.reFillTop.removeData;

        await this._testSlotMachine.startReFillDrop({ reFill: mainFinalData, remove: mainRemoveData }, { reFill: subFinalData, remove: subRemoveData });
        console.log('=====finish testRunRandom=====');
        */

    }

    private fastPickExcludeReel(info: { reelIndex: number, iconIndex: number, symbolID: number }[][]): number[] {
        // 提取所有出現過的 reelIndex (只拿二維陣列中每一項的第一個物件)
        const occupiedIndexes = new Set(info.map(group => group[0]?.reelIndex));
        const targetAry = [0, 1, 2, 3, 4, 5];
        // 過濾出未被佔用的索引
        const excludedIndexes = targetAry.filter(index => !occupiedIndexes.has(index));
        return excludedIndexes;
    }

    private fastPickExcludeIcon(info: { reelIndex: number, iconIndex: number }[]): number[] {

        const targetAry = [0, 1, 2, 3, 4, 5];//--上面4個+上下兩個效果補牌
        const excludeSet = new Set(info.map(item => item.iconIndex + 1));//--index從0開始,所以取位置要+1
        // 一次性過濾
        return targetAry.filter(index => !excludeSet.has(index));
    }


}


