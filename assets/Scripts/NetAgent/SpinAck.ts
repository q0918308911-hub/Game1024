

import { ByteReaderHelper } from "./CConnectManager/ByteArray";
import { CCommandStatus } from "./CConnectManager/CConnectDefine";
import Decoder from "./NetAgentDefine";

export default class SpinAck extends Decoder {
    //可購買免費遊戲數量
    private buyFG: number = 0;
    //Balance
    private balance: number = 0;
    //Bet
    private baseBet: number = 0;
    //additionalPurchase
    private additionalPurchase: number = 0;
    //win
    private win: number = 0;
    //SerialId
    private serialId: string = '';
    //Plant
    private plant: string = '';
    //Time
    private time: string = '';
    //result
    private result: CCommandStatus = -CCommandStatus.None;

    //==========================外部接口=======================================
    /**
  * FG可購買數量
  */
    public get BuyFG(): number { return this.buyFG; }

    /**
     * 餘額
     */
    public get Balance(): number { return this.balance; }

    /**
     * Bet
     */
    public get BaseBet(): number { return this.baseBet; }

    /*
    * 加購
    */
    public get AdditionalPurchase(): number { return this.additionalPurchase; }

    /**
     * Win 贏分
     */
    public get Win(): number { return this.win; }

    /**
     * SerialId 押注序號
     */
    public get SerialId(): string { return this.serialId; }

    /**
     * Plant 盤面
     */
    public get Plant(): string { return this.plant; }
    /**
     * 時間 UTC 0
     */
    public get Time(): string { return this.time; }
    /**
     * Result 結果
     */
    public get Result(): CCommandStatus { return this.result; }

    //==========================內部處理=======================================
    constructor(serverAck: ByteReaderHelper) {
        super(serverAck);
        this.Decode();
    }


    Decode(): void {
        if (this.serverAck == null) return

        this.result = this.serverAck.ReadByte();
        if (this.result !== CCommandStatus.Success) {
            this.serialId = this.serverAck.ReadString();
            return;
        }
        this.buyFG = this.serverAck.ReadByte();
        this.balance = this.serverAck.ReadDouble();
        this.baseBet = this.serverAck.ReadDouble();
        this.additionalPurchase = this.serverAck.ReadDouble();
        this.win = this.serverAck.ReadDouble();
        this.serialId = this.serverAck.ReadString();
        this.plant = this.serverAck.ReadLongString();
        this.time = this.serverAck.ReadString();
    }

}