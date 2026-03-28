// CSServer.ts

import { ByteWriterHelper } from "./ByteArray";

class CPacket {
    constructor(public packetNo: number, public packet: Uint8Array, public time: number) { }
}

export class CService {
    public serviceID: number;
    public serviceIDBytes: Uint8Array;
    private m_iSendNum: number;
    public recvNum: number;
    private sendHistory: CPacket[];
    private packetKeepTime: number;
    private L_Packet: object = {};
    public c群組_編號: Map<any, any> = new Map();
    public c群組_名稱: Map<any, any> = new Map();
    public L_群組Sync: object = {};

    constructor(num: number, lifeCycle: number) {
        this.serviceID = num;
        this.serviceIDBytes = ByteWriterHelper.ConvertToIntByte(this.serviceID, 2);
        this.sendHistory = [];
        this.m_iSendNum = 0;
        this.recvNum = 1;
        this.packetKeepTime = lifeCycle;
    }

    getNewSendNumber(): number {
        this.m_iSendNum += 1;
        if (this.m_iSendNum > 60000) this.m_iSendNum = 1;
        return this.m_iSendNum;
    }

    AddPacket(data: Uint8Array): Uint8Array {
        const now = Date.now();
        //移除過期的封包
        while (this.sendHistory.length > 0) {
            const firstPacket = this.sendHistory[0];
            if (firstPacket && now - (firstPacket.time) <= this.packetKeepTime * 1000) {
                this.sendHistory.shift();
            }
            else {
                break;
            }

        }
        const sendNum = this.getNewSendNumber();
        const bt = new ByteWriterHelper(1);
        bt.WriteByte(30);
        bt.WriteBytes(this.serviceIDBytes);
        bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(sendNum, 2));
        bt.WriteBytes(data);
        this.sendHistory.push(new CPacket(sendNum, bt.Buffer, now));

        return bt.Buffer;
    }

    //無序包
    getNoOrderPacket(data: Uint8Array): Uint8Array {
        const bt = new ByteWriterHelper(1);
        bt.WriteByte(30);
        bt.WriteBytes(this.serviceIDBytes);
        bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(0, 2));
        bt.WriteBytes(data);
        return bt.Buffer;
    }

    GetSendHistory(serverRecvNum: number): CPacket[] {
        //移除已經收到過的封包
        while (this.sendHistory.length > 0) {
            if (this.sendHistory[0].packetNo !== serverRecvNum) {
                this.sendHistory.shift();
            }
            else {
                break;
            }
        }
        this.sendHistory = this.sendHistory.filter(packet => packet.packetNo === serverRecvNum);

        return this.sendHistory;
    }
}