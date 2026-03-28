import { _decorator, Game, director, AudioSource, profiler } from 'cc';
import { AbstractBasicGameController, BasicProcessSlotData, GameState, GameUtilsTools, IProcessSlotData, NotifyCation, NotifySubject } from "../ReferencePath";
import { DefinitionGameConfigData } from '../DefinitionGameData1024/GameConfigInstance1024';
import { BetData, GenericUIManager, NewFlashModeEnum, PlayerInfo, Utility } from 'db://assets/Scripts/ModuleEntry';
import { ProcessSlotData1024 } from '../ServerBackSlotInfoData/ProcessSlotData1024';
import { BetRecordInfo } from '../ServerBackSlotInfoData/DefType1024';
import { GlobalAccessWriter } from '../DefinitionGameData1024/AccessDefs/GlobalAccessWriter';
import { GameGlobalKeys } from '../DefinitionGameData1024/GameGlobalData1024';
import { ChallengeEventStatus, GameEventType1024 } from '../DefinitionGameData1024/GameEventTypeDef1024';

const { ccclass, property } = _decorator;
const {
    SCROLLING_TEXT
} = DefinitionGameConfigData;
@ccclass('GameController1024')
export class GameController1024 extends AbstractBasicGameController<BasicProcessSlotData, IProcessSlotData, GameState> {

    //--for do cycle data test
    private _testIndex: number = -1;
    private _useServerDelayTest: boolean = false;
    private _currentSlotInfo: ProcessSlotData1024;
    private _autoNextDataForGui: { hasFGOthers: boolean, odd: number } = { hasFGOthers: false, odd: 0 };


    public override init(gameNumber: number, isOnline: boolean): void {

        super.init(gameNumber, isOnline);
        this.setTwoLevelTurboMode(true);
        GenericUIManager.instance.addGamingShowTexts(SCROLLING_TEXT);
        if (!isOnline) {
            PlayerInfo.balance = 1000000; //--for testing
        }
        this._strVersion = '1.0.1.20260326';
        //this._strVersion = 'testMode-5-0128';
        //--新版公版UI設定自適應
        GenericUIManager.instance.setAutoResize(true);
        GenericUIManager.instance.setAutoResizeMaximumSize(1920, 2000);
    }

    /**
    * override gameController method---
    * <2階段加速>
    * TIPS:
    * 原先的規劃是會直接setting engine的timeScale
    * 但企劃另有神奇的想法,所以就要整個override掉原先設計的onNewFlashBtnSwitch
    * (不要去super.onNewFlashBtnSwitch(mode),這樣會更改到engine timeScale)
    * 
    * @param mode 0=normal,1=Lv1 speed up,2=Lv2 speed up
    * PS:每次在操作按鈕ui會set currentTurboMode,所以這邊可以直接拿來用
    */
    public override onNewFlashBtnSwitch(mode: NewFlashModeEnum): void {
        this._gameViewManager.setTwoLevelTurboMode(mode);
    }

    //=========以下為必須實作的抽象方法區域=========

    //--在這邊初始化在此類別當中沒有啟動的系統(processServerData,gameViewManager.....)
    protected initForOtherSystem(): void {

        this._currentSlotInfo = new ProcessSlotData1024();
        this._gameViewManager.beforeInit();
        this._gameViewManager.init();
        this._gameViewManager.registerSystem();
        const currentTurboMode = GenericUIManager.instance.getCurrentTurboMode();
        this._gameViewManager.setTwoLevelTurboMode(currentTurboMode);
        this._gameViewManager.setGameTimeScale();
        //--註冊gameViewManager裡面的事件(要呼叫挑戰遊戲)
        NotifyCation.getInstance().on(NotifySubject.GAME_ANI_PROCESS_SUBJECT, GameEventType1024.CHALLENGE_EVENT, this.onChallengeCallServiceHandler, this);

    }
    //-after <onGameViewShowEndEventHandler>
    protected async processInShowEndEvent(): Promise<void> {
        //--準備要下一局的資料
        /**
         * 結束一round後view通知
         * 主要集中在處理PlayerInfo.balance的資料,看情況要不要處理
         */
    }

    //-after <onReceiveBet>
    /**
     * TIPS:
     * 1.這邊只會在NG模式callback
     * <呼叫API>
     * 1.NG取牌:sendBet
     * 2.挑戰遊戲:sendOtherAction
     * 3.FG取牌:sendOtherActionWithBet
     * @param betData 
     */
    protected processReceiveBet(betData: BetData): void {

        //--20260323 NEW:統一process data入口
        this._currentSlotInfo?.setProcessServerData(betData.slotDataBinaryBuffer, betData.bet);
        const roundData: BetRecordInfo = this._currentSlotInfo?.getGameRoundData();
        //=======公版GUI需要的每一局的資料========
        //--其他款的話還要再判斷是否有其他符合條件的遊戲流程-20251219
        const hasFGOthers = (roundData.freeGameReelInfo.length > 0) ? true : false;
        const roundTotalOdds = roundData.allRoundOdds;
        this._autoNextDataForGui = { hasFGOthers: hasFGOthers, odd: roundTotalOdds };
        //=======公版GUI需要的每一局的資料========
        //this._gameViewManager.setServerReceiveDataIncremental(roundData, gameState, true);
        this._gameViewManager.setServerReceiveData(roundData);
        //=====進入主要遊戲流程開始新round(準備接stopSpin)========
        console.log('processReceiveBet _RoundData:', roundData, 'base64:', betData.slotData);
        this._gameViewManager.newRoundDataToStopSpin();
    }


    /**
     * -double game的資料(挑戰遊戲會呼叫sendOtherAction來取得次數)
     * 
     * * TIPS:
     * 1.這邊只會在挑戰遊戲callback
     * <呼叫API>
     * 1.NG取牌:sendBet
     * 2.挑戰遊戲:sendOtherAction
     * 3.FG取牌:sendOtherActionWithBet
     * @param action 
     * @param base64Data 
     */
    protected processOtherActionData(action: number, base64Data: string): void {

        const aryBuffer = Utility.base64ToBinaryBuffer(base64Data);
        //--20260323 NEW:統一process data入口
        this._currentSlotInfo?.setProcessServerData(aryBuffer);
        //--20260323 NEW:統一獲取資料入口
        const roundData: BetRecordInfo = this._currentSlotInfo?.getGameRoundData();
        if (roundData !== undefined) {

            this._gameViewManager.setOtherActionData(roundData);
            this._gameViewManager.afterReceiveOtherAction();
        }
        console.log('processOtherActionData _RoundData:', roundData, 'base64:', base64Data);
    }


    /**
     --進入FG 會呼叫sendOtherActionWithBet來取牌  
     * * TIPS:
     * 1.這邊只會在FG模式callback
     * <呼叫API>
     * 1.NG取牌:sendBet
     * 2.挑戰遊戲:sendOtherAction
     * 3.FG取牌:sendOtherActionWithBet
     * @param action 
     * @param betData 
     */
    protected processOtherActionWithBetData(action: number, betData: BetData): void {

        //--20260323-這邊server回的betData.bet是0,但這樣會爆掉(在流程內,所以要在抓一次)
        //const betValue = this.betValue;
        //--20260323 NEW:統一process data入口

        /**
         * 20260324 FIX:FG的資料裡面會夾帶第一段押注額,所以要在processServerData的時候就把betValue改成第一段押注額
         * (因為FG要牌在server res是不會回bet,他會夾在這裡)
         */
        this._currentSlotInfo?.setProcessServerData(betData.slotDataBinaryBuffer);
        //--20260323 NEW:統一獲取資料入口
        const roundData: BetRecordInfo = this._currentSlotInfo?.getGameRoundData();
        //this._gameViewManager.setServerReceiveDataIncremental(roundData, state, true);
        this._gameViewManager.setServerReceiveData(roundData);
        this._gameViewManager.afterReceiveOtherActionWithBet();
        console.log('processOtherActionWithBetData _RoundData::', roundData, 'base64:', betData.slotData);
    }

    //--before startSpin
    protected resetRoundData(): void {
        this._currentSlotInfo?.resetRoundData();
    }

    //=========以上為必須實作的抽象方法區域=========
    //--20260313 
    private onChallengeCallServiceHandler = (eventData: any): void => {
        const { status } = eventData.eventData;
        switch (status) {
            case ChallengeEventStatus.CALL_SERVER_TO_CHALLENGE:
                this.sendOtherAction(0, [0]);//--固定帶0
                console.log('呼叫server進入挑戰');
                break;
            case ChallengeEventStatus.CALL_SERVER_TO_FG:
                console.log('呼叫server進入FG');
                this.sendOtherActionWithBet(0, [0]);//--固定帶0,目前沒有額外的betData
                break;
            default:
                break;
        }
    }
    /**
    * 在checkAutoNext呼叫前執行(公版UI需要的)
    * isEnterFeatureGame===>這邊指的是有<轉場切換的那一個東西(機制?流程)>
    * 就是屬於特色遊戲,所以有可能是FG,也有可能是bonus game之類的
    */
    protected override setAutoNextRound(): void {
        this.checkAutoNextData = {
            //---是否進入FG/特色遊戲(不一定只有FG)
            isEnterFeatureGame: this._autoNextDataForGui.hasFGOthers,
            //--單一局的總odds(整駝的賠率,就是你在checkScore的totalOdds)
            odd: this._autoNextDataForGui.odd,
            balance: PlayerInfo.balance,
        };
    }

    protected override callServerInLocalTest(): void {
        //--local mode 模擬server 延遲---
        if (this._useServerDelayTest) {
            if (this._testIndex == 0) {
                GameUtilsTools.DeferByTweenPromise(2).then(() => {
                    this.testReceiveBetData(GameState.NORMAL);//---local mode 模擬server 延遲---
                })
                return;
            } else {
                this.testReceiveBetData(GameState.NORMAL);//---local mode 模擬送資料---this.testReceiveBetData();//---local mode 模擬送資料---
            }
        } else {
            this.testReceiveBetData(GameState.NORMAL);
        }
    }

    protected override callSendOtherActionLocalTest(): void {
        this.testReceiveBetData(GameState.DOUBLE_GAME);
    }

    protected override callSendOtherActionWithBetLocalTest(): void {
        this.testReceiveBetData(GameState.FREE_GAME);
    }

    public testBtnProcessData(): void {

        let testBase64 = 'KQAAAAAAAIizQAAAVVRFQ0Z4gGg4IxARUYNoY4JmUDJENScQSGRIFlMHc4cyNUVShXGGiARiIBJwNzMXcGZWI1eGcoAYaDZId3YUgWRoJTFDhhNodhAUFAFiNTRERUNSN3U2ZRI4IgZkB2QWZ1M3RHMTWHFEI4WHdwMVBQJwNFVzZ2RGWCFwIAQIREJXMUVUJUAXuIJEaIRhAlQCEoU2RFCjZ3QxRFNVR2goUmBhARAYEGQzdVVld3MygVOGYlYWWFdiMyYjQ0UEFDhgEwFIdUJRVGM0RERnZFiFMURxU2M4cgRDNlQWMyZoWCKoJ0VoGGYTVTUhFkYIIVcTN3Q0VHMmcAImGIRxdwEEFQdzQzQnQoIAcoNkZhIYUWERM0ZTZUQ0NVUCgHg3J3oyIDGDIVNVJFQzUBE1OHMQeGgjUjRURlNHSBFWlgUmNXUxVig=';
        //let testBase64 = 'KQAAAAAAAIizQAACAABSUyNzEiBCJEV0AxJgNkQjAoczU2M4JCMTSAZiJUF1CDdUVEdFIBiDU1FGRQMhQICChTZEVTJEIQURGHRAODNwRURURARCB4EHFAZ2J3YxVRFkNVQ2JEczJVYVEDMHBoiGGGh4hWZBNnBQQ0FTc1UhEjcTZySBJGRoUUWGgnJRVFZzSEYoY0AIEDiEM4AFZkaHBkU1RQMlJwNFMQNiGGIiN2VRVFODCFgTBhQYqCNVURZkAgY=';
        const aryBuffer = Utility.base64ToBinaryBuffer(testBase64);
        this._currentSlotInfo?.setProcessServerData(aryBuffer);
        const roundData: BetRecordInfo = this._currentSlotInfo?.getGameRoundData();
        console.log('testBtnProcessData _RoundData:', roundData, 'base64:', testBase64);
    }

    private async testReceiveBetData(testType: GameState): Promise<void> {

        //await GameUtilsTools.DeferByTweenPromise(0.1);//--原本單位是毫秒現在換算成秒
        this.testServerData(testType);
        //--20260323 NEW:統一獲取資料入口
        let roundData: BetRecordInfo = this._currentSlotInfo?.getGameRoundData();

        //this._gameViewManager.runTest(cloneData);
        switch (testType) {
            case GameState.NORMAL:

                this._gameViewManager.setServerReceiveData(roundData);
                //this._gameViewManager.setServerReceiveDataIncremental(roundData, testType, true);
                this._gameViewManager.newRoundDataToStopSpin();
                break;
            case GameState.DOUBLE_GAME:
                console.log('測試資料:double game');
                this._gameViewManager.setOtherActionData(roundData);
                this._gameViewManager.afterReceiveOtherAction();
                break;
            case GameState.FREE_GAME:
                //this._gameViewManager.setServerReceiveDataIncremental(roundData, testType, true);
                this._gameViewManager.setServerReceiveData(roundData);
                this._gameViewManager.afterReceiveOtherActionWithBet();
                break;
        }

        console.log('test_roundData:', roundData, 'testType:', testType);

    }


    //--塞測試資料區域
    private testServerData(gs: GameState): void {

        const testNGBase64Data: string[] = [
            //'JAAAAAAAAABZQGJGdVAYJ2JAB1cnY4I2SGCAUw=='
            //'JAAAAAAAAIizQGdlRihSEwAwt2SxhTZnJXFrZXcjRnhIUzCwEA=='
            //'JAAAAAAAAIizQHRnNRa3FmVboUg4aGiHELmEUVQQW4g='
            //'JAAAAAAAAIizQHRjdjSBUWW3mFgiRFtpKECHYCsyJTtIgxAlswg='
            'JAAAAAAAAIizQEdHdlGwdqiEoIhwg7UwGEVQcSWHIUE2hmNithETBLFnOHK0NyiAYSAjAYOIQEsghjMCVAM1'
        ];

        const testDoubleGameBase64Data: string[] = [
            'Dg=='//-成功
            //'AA=='//-失敗
        ];

        const testFreeGameBase64Data: string[] = [
            //'KQAAAAAAAIizQAAARUU3ggQjdjdgIkRHhECAdhRAVVQ0NQYRFxYHEoIGAXFyYRcYOFNTdzEQKDdxERNzBwYmJjIGgyaAIQAGh0NWQ1M1ggBUJIREEocWUxAlMjM1EhdjdRZoVnMDV0R0RgMIZWUoUFNGIIMHdzKDKERDRoAEiBZieGFVcQcxAAiBaCAzUyJoUYggJheDJTE3VTU3FVQDMxFjchIEgFh0VGJQYzdFZTQgR2gnRwEVEYYScwNI'
            //'KQAAAAAAAIizQAACAABSUyNzEiBCJEV0AxJgNkQjAoczU2M4JCMTSAZiJUF1CDdUVEdFIBiDU1FGRQMhQICChTZEVTJEIQURGHRAODNwRURURARCB4EHFAZ2J3YxVRFkNVQ2JEczJVYVEDMHBoiGGGh4hWZBNnBQQ0FTc1UhEjcTZySBJGRoUUWGgnJRVFZzSEYoY0AIEDiEM4AFZkaHBkU1RQMlJwNFMQNiGGIiN2VRVFODCFgTBhQYqCNVURZkAgY='
            //'KQAAAAAAAIizQAAAVDREEHGGQDaAMlgzhxElJkdEVEcDBzgmKCASV2InN1eBZ2RCVTVwIyNrg0FTh2VRhIUyU1RXISQAAiJmghVzGFNjNGZBdyRygyYQFXY0c1JVRWMYIFUEUHiEBwAARmVDUyWENBCGIYcgIgglgkc1RHIiJROCkURDAjYUEUFAZAgwFDZTdWVkdHRzd0cidWaFYiRFVBR2gIdgRVQBVUQlh2A4MGYAMWJmQBFROHBCNFNHcHFTRQOEIAQkgEcARkVUchcoAngEAVcDEnQXSFRTVRZoV3hVNkMmgiY3ZTJ2ZBExMFQzhlM1QwRxgWVZEWdBAA=='
            //'KQAAAAAAAIizQAACAABSUyNzEiBCJEV0AxJgNkQjAoczU2M4JCMTSAZiJUF1CDdUVEdFIBiDU1FGRQMhQICChTZEVTJEIQURGHRAODNwRURURARCB4EHFAZ2J3YxVRFkNVQ2JEczJVYVEDMHBoiGGGh4hWZBNnBQQ0FTc1UhEjcTZySBJGRoUUWGgnJRVFZzSEYoY0AIEDiEM4AFZkaHBkU1RQMlJwNFMQNiGGIiN2VRVFODCFgTBhQYqCNVURZkAgY='
            //--bug-FIX
            //'KQAAAAAAAIizQAAAVVRFQ0Z4gGg4IxARUYNoY4JmUDJENScQSGRIFlMHc4cyNUVShXGGiARiIBJwNzMXcGZWI1eGcoAYaDZId3YUgWRoJTFDhhNodhAUFAFiNTRERUNSN3U2ZRI4IgZkB2QWZ1M3RHMTWHFEI4WHdwMVBQJwNFVzZ2RGWCFwIAQIREJXMUVUJUAXuIJEaIRhAlQCEoU2RFCjZ3QxRFNVR2goUmBhARAYEGQzdVVld3MygVOGYlYWWFdiMyYjQ0UEFDhgEwFIdUJRVGM0RERnZFiFMURxU2M4cgRDNlQWMyZoWCKoJ0VoGGYTVTUhFkYIIVcTN3Q0VHMmcAImGIRxdwEEFQdzQzQnQoIAcoNkZhIYUWERM0ZTZUQ0NVUCgHg3J3oyIDGDIVNVJFQzUBE1OHMQeGgjUjRURlNHSBFWlgUmNXUxVig='
            'KQAAAAAAAIizQAAAQmU2RBgAI1IgB0FnEGJIFzJEU2clgGgDcShoFoAmRUVTYzcxWCJYhmBGQoM1Q0NTcgRTZEZxMiCIdjdlI3goUwVHdnImR2OENSN4c2ZUNEUwJ3U2RTQGUhAxUUEwFwVySDYHhWQTIVdDRGUEAbZYNzBogzYngoJiNUNlRzcoI4YlZXOHYlFDJlVEMyRIY0VwRDhgYGUwYBdRRTUWYyR4JKN3VFZmYIBkcSQYMINnQ1U0dYAzhRZURleEh0KGGEBVVjM3VAEBCHYzY1VjeHIWNjNFMkM1OCiGIrQ4FCMmVmhyQkZTQyRoMmRiJEAyZ1VkFkdlNTU2B0WFd2AHRXgQIjIAeCVzZWJxVSA1VDMHdIQQh1dUMkd1NTVoNGV1ByBIeAYWZYBiVyNRImNVRGNYQ1R2WIZBh3ITZWEIY0CBYkVEVRRYYSdUB4BGcihxB1AmRER0NXZoBHdhFAM3gDSBQUZWJWUVE2EnMSIiRiZwZ2B1JGVDRTM0d2CRZycyBIh0gWiEd3RVIoVjNYgGWGeHOFciQFQFYBlhZmBCQ3VFB3MhJiIiE1hUU1ElU0NDJhdjRhRHCAcyRkVGc4dDUoVCckI3Z1NXUAE='
        ];
        this._testIndex++;
        if (this._testIndex > testNGBase64Data.length - 1) {
            this._testIndex = 0;
        }

        this.resetRoundData();
        let itemBase64: string = '';
        let dataIndex: number = 0;
        let aryBuffer;
        if (gs == GameState.NORMAL || gs == GameState.FREE_GAME) {

            if (gs == GameState.NORMAL) {
                dataIndex = this._testIndex;
                itemBase64 = testNGBase64Data[dataIndex];
            } else {
                dataIndex = (this._testIndex > testFreeGameBase64Data.length - 1) ? 0 : this._testIndex;
                itemBase64 = testFreeGameBase64Data[dataIndex];
            }

            aryBuffer = Utility.base64ToBinaryBuffer(itemBase64);
            //--0260323 NEW:統一process data入口
            this._currentSlotInfo?.setProcessServerData(aryBuffer, 1000);

        } else {
            dataIndex = (this._testIndex > testDoubleGameBase64Data.length - 1) ? 0 : this._testIndex;
            itemBase64 = testDoubleGameBase64Data[dataIndex];
            aryBuffer = Utility.base64ToBinaryBuffer(itemBase64);
            //--0260323 NEW:統一process data入口
            this._currentSlotInfo?.setProcessServerData(aryBuffer);
        }

    }

}