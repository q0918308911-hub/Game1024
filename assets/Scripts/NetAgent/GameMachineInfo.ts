

import { ByteReaderHelper } from "./CConnectManager/ByteArray";
import { CCommandStatus } from "./CConnectManager/CConnectDefine";
import Decoder from "./NetAgentDefine";

export default class GameMachineInfo extends Decoder {
    //玩家暱稱
    private nickname: string = '';
    //玩家財產
    private balance: number = 0;
    //最大押注
    private maxBet: number = 0;
    //最小押注
    private minBet: number = 0;
    //可購買免費遊戲數量
    private buyFG: number = 0;
    //機台ID
    private id: number = 0;
    //LastPlant
    private lastPlant: Uint8Array;
    //Record
    private record: Uint8Array;
    //JP
    private jp: number[] = [];
    //lastHistory
    private lastHistory: string[];
    //歷程高度
    private historyHeight: number = 0;


    //登入結果
    private result: CCommandStatus = CCommandStatus.None;

    //==========================外部接口=======================================
    /**
     * 玩家暱稱
     */
    get Nickname(): string { return this.nickname; }
    /**
     * 玩家財產
     */
    get Balance(): number { return this.balance; }
    /**
     * 最大押注
     */
    get MaxBet(): number { return this.maxBet; }
    /**
     * 最小押注
     */
    get MinBet(): number { return this.minBet; }
    /**
     * 可購買免費遊戲數量
     */
    get BuyFG(): number { return this.buyFG; }
    /**
     * 機台ID
     */
    get Id(): number { return this.id; }
    /**
     * 最後遊戲盤面
     */
    get LastPlant(): Uint8Array { return this.lastPlant; }
    /**
     * 遊戲紀錄
     */
    get Record(): Uint8Array { return this.record; }
    /**
     * JP
     */
    get JP(): number[] { return this.jp; }
    /**
     * 最後歷史紀錄
     */
    get LastHistory(): string[] { return this.lastHistory; }
    /**
     * 歷程高度
     */
    get HistoryHeight(): number { return this.historyHeight; }
    /**
     * 登入結果
     * 參考 @CCommandLoginStatus
     * @return CCommandLoginStatus
     */
    get Result(): CCommandStatus { return this.result; }


    //==========================內部處理=======================================
    constructor(serverAck: ByteReaderHelper) {
        super(serverAck);
        this.Decode();
    }

    override Decode(): void {
        if (this.serverAck == null) {
            return;
        }
        this.result = this.serverAck.ReadByte()
        if (this.result != CCommandStatus.Success) {
            return;
        }
        this.nickname = this.serverAck.ReadString();
        this.balance = this.serverAck.ReadDouble();
        this.maxBet = this.serverAck.ReadDouble();
        this.minBet = this.serverAck.ReadDouble();
        this.buyFG = this.serverAck.ReadByte();
        this.id = this.serverAck.ReadInt(3);
        this.lastPlant = this.serverAck.ReadByteIncludeLength();
        this.record = this.serverAck.ReadByteIncludeLength();
        this.jp = this.serverAck.ReadDoubleArray();
        this.historyHeight = this.serverAck.ReadLong();
    }
}