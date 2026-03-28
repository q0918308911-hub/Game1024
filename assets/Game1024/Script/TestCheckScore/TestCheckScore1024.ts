import { _decorator, CCInteger, Component, Node } from 'cc';
import { ProcessSlotData1024 } from '../ServerBackSlotInfoData/ProcessSlotData1024';
import { AdditionalPurchaseType } from 'db://assets/Scripts/NetAgent/CConnectManager/CConnectDefine';
import { CheckScoreTool } from 'db://assets/Tool/CheckScoreESBuild/CheckScoreTool/CheckScoreTool';
import { BetData, NetworkEvent, NetworkHandler } from 'db://assets/Scripts/ModuleEntry';

const { ccclass, property } = _decorator;

@ccclass('TestCheckScore1024')
export class TestCheckScore1024 extends CheckScoreTool {


    @property(CCInteger)
    testBetValue: number = 100; //--test bet value
    @property(CCInteger)
    testRound: number = 10000; //--test score value
    @property(CCInteger)
    testBetValues: number[] = []; //--test win values

    private _currentSlotInfo: ProcessSlotData1024;
    private _testCount: number = 0;
    private _testBetCount: number = 0;

    constructor() {
        super();
        this.gameNumber = 12172; //--gameNumber for testing
        this._testCount = 0;
        this.initProcess();
    }

    public initProcess(): void {
        this._currentSlotInfo = new ProcessSlotData1024();
    }

    public init(): void {

        this.onBtnClick();
    }

    public override onBtnClick() {
        const betValue = this.getBetValue();
        NetworkHandler.instance.send(NetworkEvent.Bet, this.gameNumber, betValue, this.testRound, AdditionalPurchaseType.None, 'testPlayer');
    }

    public override onReceiveBet(betData: BetData): void {
        let base64Result = betData.slotData;
        let binaryBufferResult = betData.slotDataBinaryBuffer;
        const hasSpin4Symbol = this._currentSlotInfo.testSPSymbol(binaryBufferResult);
        const betValue = this.getBetValue();
        if (hasSpin4Symbol) {
            console.log('Received SERVER with Spin4 Symbol:');
            console.error(`base64Result: ${base64Result}`);
            return;
        } else {
            if (this._testCount < this.testRound) {
                console.log('@@sendServer@@', this._testCount);
                this._testCount++;
                NetworkHandler.instance.send(NetworkEvent.Bet, this.gameNumber, betValue, this.testRound, AdditionalPurchaseType.None, 'testPlayer');
            } else {
                console.log(`Test completed after ${this._testCount} rounds.`);
            }
        }

        /*
        let base64Result = betData.slotData;
        let binaryBufferResult = betData.slotDataBinaryBuffer;
        let serverOdds = (betData.score / betData.bet).fixed();
        console.log('Received SERVER:');
        // 這行要加入自己計算Odds的邏輯
        let myOdds = 0;
        this._currentSlotInfo.setNewRoundData(binaryBufferResult, betData.bet);
        const score: number = this._currentSlotInfo.getCheckScore();
        myOdds = score;
        this._testCount++;
        const betValue = this.getBetValue();
        if (serverOdds === myOdds) {
            console.log(`Server Odds: ${serverOdds} My Odds: ${myOdds} count: ${this._testCount} bet: ${betValue}, OK!!!!!`);
            if (this._testCount < this.testRound) {
                console.log('@@sendServer@@');
                NetworkHandler.instance.send(NetworkEvent.Bet, this.gameNumber, betValue, this.testRound, AdditionalPurchaseType.None, 'testPlayer');
            } else {
                console.log(`Test completed after ${this._testCount} rounds.`);
            }

        }
        else {
            console.error(`Server Odds: ${serverOdds} My Odds: ${myOdds}, Please check your code!`);
            console.error(`base64Result: ${base64Result}`);
            return;
        }*/

    }

    private getBetValue(): number {
        if (this.testBetValues.length > 0) {
            this._testBetCount++;
            if (this._testBetCount >= this.testBetValues.length) {
                this._testBetCount = 0;
            }
            return this.testBetValues[this._testBetCount];
        }
        return this.testBetValue;
    }

}