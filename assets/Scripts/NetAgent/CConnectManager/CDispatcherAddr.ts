import { ByteReaderHelper } from "./ByteArray";
//Cocos 目前都使用WSS
const WSSPortOffset: number = 2;
export default class CDispatcherAddr {
    private m_sKey: string = '';
    private m_sIP: string = '';
    private m_iPort: number = 13200;

    constructor(ipPort: string)
    constructor(ip: string, port: number);
    constructor(bt: Uint8Array);
    constructor(arg1: any, arg2?: any) {
        if (typeof arg1 === 'string' && typeof arg2 === 'undefined') {
            //constructor( ipPort: string ) process
            const splits = arg1.split(':');
            if (splits.length > 1) {
                this._sIP = splits[0];
                this._iPort = parseInt(splits[1], 10);
            } else {
                this._sIP = arg1;
            }
        }
        else if (typeof arg1 === 'string' && typeof arg2 === 'number') {
            //constructor( ip: string, port: number ) process
            this._sIP = arg1;
            this._iPort = arg2;
        }
        else if (arg1 instanceof Uint8Array) {
            //constructor( bt: ByteArray ) process
            const byteReader = new ByteReaderHelper(arg1.buffer);
            const ip1 = byteReader.ReadByte();
            const ip2 = byteReader.ReadByte();
            const ip3 = byteReader.ReadByte();
            const ip4 = byteReader.ReadByte();
            this._sIP = `${ip1}.${ip2}.${ip3}.${ip4}`;
            this._iPort = byteReader.ReadInt(2);
            console.log(`CDispatcherAddr: ${this._sIP}:${this._iPort}`);
        }
    }

    get _sKey(): string {
        return this.m_sKey;
    }

    set _sKey(value: string) {
        this.m_sKey = value;
    }

    get _sIP(): string {
        return this.m_sIP;
    }

    set _sIP(value: string) {
        this.m_sIP = value;
        this.m_sKey = `${this.m_sIP}:${this.m_iPort}`;
    }

    get _iPort(): number {
        return this.m_iPort;
    }

    set _iPort(value: number) {
        this.m_iPort = value + WSSPortOffset;
        this.m_sKey = `${this.m_sIP}:${this.m_iPort}`;
    }
}