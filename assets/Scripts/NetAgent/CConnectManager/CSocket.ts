
import { CConnectLog } from "./CConnectLog";
import CDispatcherAddr from "./CDispatcherAddr";
const CConnectManagerTrigger: number = 4000;
export class CSocket {
    private _socket: WebSocket | null = null;
    private m_queue: Uint8Array[] = [];

    public m_RcvConnectResult: number = -1;
    public IPPort: string = '';

    constructor() { }

    public CloseSocket(reason: string = ''): Promise<void> {
        CConnectLog.Instance.WarningLog(`Socket self CloseSocket code:${CConnectManagerTrigger}`);
        if (this._socket == null) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            this._socket.onopen = null;
            this._socket.onerror = null;
            this._socket.onclose = () => {
                resolve();
            };
            this._socket.close(CConnectManagerTrigger, reason);
        });
    }

    public toString(): string {
        return this.IPPort;
    }

    public IsConnected(): boolean {
        return this._socket != null && this._socket.readyState === WebSocket.OPEN;
    }

    public async Connect(address: CDispatcherAddr): Promise<void> {
        try {
            const wsUrl = `wss://${address._sIP}:${address._iPort}`;
            CConnectLog.Instance.InfoLog(`Socket Connect : ${address._sIP}:${address._iPort}`);
            this.m_RcvConnectResult = 0;
            this._socket?.close();
            this._socket = null;
            this._socket = new WebSocket(wsUrl, []);
            this._socket.binaryType = 'arraybuffer';
            this._socket.onopen = () => {
                CConnectLog.Instance.InfoLog(`Socket Connect Success : ${address._sIP}:${address._iPort}`);
                this.onConnect(this._socket as any);
                this.IPPort = `${address._sIP}:${address._iPort}`;
                this.m_RcvConnectResult = -1;
            };

            this._socket.onerror = (error) => {
                CConnectLog.Instance.ErrorLog(`Socket Connect onerror : ${address._sIP}:${address._iPort}`);
                console.error(error);
            };

            this._socket.onclose = function (ev: CloseEvent) {
                CConnectLog.Instance.WarningLog(`Socket Connect onclose from(${address._sIP}:${address._iPort}) \n reason: ${ev.reason} \n code:${ev.code}`);
            };
        }
        catch (ex) {
            console.error(`IPPort : ${address._sIP}:${address._iPort} ${ex.message}.`);
        }
    }

    public Send(data: Uint8Array): void {
        //送出資料長度
        const arrayLengthBytes = new Uint8Array([
            (data.length >> 16) & 0xFF, // 第一個字節
            (data.length >> 8) & 0xFF, // 第二個字節
            data.length & 0xFF // 第三個字節
        ]);

        const combinedData = new Uint8Array(arrayLengthBytes.length + data.length);
        combinedData.set(arrayLengthBytes, 0);
        combinedData.set(data, arrayLengthBytes.length);
        this._socket?.send(combinedData.buffer);
    }

    private onConnect(socket: WebSocket): void {
        socket.onmessage = (event) => {
            let dataSize = 0;
            const SizeOffset = 3;
            const result = new Uint8Array(event.data);
            //取得封包大小
            for (let x = 0; x < SizeOffset; x++) {
                dataSize += result[x] << 8 * (SizeOffset - x - 1);
            }
            const receiveData = new Uint8Array(result.slice(SizeOffset, result.length));
            this.onReceived(receiveData);
        };
    }

    private onReceived(binaryData: Uint8Array): void {
        this.m_queue.push(binaryData);
    }

    public GetQueue(): Uint8Array | null {
        return this.m_queue.shift() || null;
    }

    public ClearQueue(): void {
        this.m_queue.length = 0;
    }

}