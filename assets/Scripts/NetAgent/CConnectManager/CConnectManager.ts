import { ByteReaderHelper, ByteWriterHelper, DataSize } from "./ByteArray";
import { CCommand, CConnectError } from "./CConnectDefine";
import { CConnectLog } from "./CConnectLog";
import CDispatcherAddr from "./CDispatcherAddr";
import CDispatcherManager from "./CDispatcherManager";
import { CSocket } from "./CSocket";
import { CService } from "./CSService";
enum State {
    //開始連線
    CONNECT_START = 0,
    CONNECT_CONNECTING,
    //等待連線
    CONNECT_WAIT_CONNECT,
    //連線成功
    CONNECT_CONNECT_SUCCESS,
    //等待編號
    CONNECT_WAIT_SUCCESS,
    //重連開始
    RECONNECT_START,
    //重連等待連線
    RECONNECT_WAIT_CONNECT,
    //重連連線成功
    RECONNECT_CONNECT_SUCCESS,
    //等待重連完成
    RECONNECT_WAIT_SUCCESS,
    //上線
    ONLINE,
    //ApexWin Login流程
    Login,
    //Wait Login
    LoginWait,
    //斷線
    OFFLINE,

    CONNECT_FIRST_UDP,
    CONNECT_WAIT_UDP,
}

//儲存封包資訊
class QueueDataInfo {
    public ServiceID: number = -1;
    public Data: Uint8Array;
}

//Callback function type
export type OutputMsg = (msg: string) => void;
export type DisconnectService = (serviceID: number, msg: string) => void;
export type Recv = (serviceId: number, data: Uint8Array) => void;
export type RecvHumanPackage = (serviceId: number, playerId: number, data: Uint8Array) => void;
export type FinishReconnect = () => void;
export type ExitGame = (kind: Uint8Array, msg: string) => void;
export type QueueDataCallback = (data: QueueDataInfo) => void;

export class Timex {
    private _startTime: number;
    constructor() {
        //紀錄啟動時間
        this._startTime = Date.now();
    }
    //啟動距離現在的時間
    public get Elapsed(): number {
        return Date.now() - this._startTime;
    }
}


export default class CConnectManager {
    //狀態
    private currentState: State;
    //分流管理
    private dispatcherManager: CDispatcherManager;
    //Socket
    private _Socket: CSocket;
    //服務列表
    private serviceList: Map<number, CService>;
    //紀錄時間
    private recordTime: number;
    // awKey
    private _awKey: string = "";
    //version
    private _version: string = "";
    //OtherInfo
    private _otherInfo: string = null
    //可存活時間
    private lifeCycle: number = 60000;
    //最大重連次數
    private maxReconnectTimes: number = 5;
    //連線嘗試次數記錄
    private connectTimes: number = 0;
    //登入retry
    private loginRetryCount: number = 0;
    //登入retryMax
    private loginRetryMax: number = 5;
    //重連紀錄
    private totalReconnectServices: number = 0;
    private reconnectReceivedCount: number = 0;
    //服務是否終止
    private isStop: boolean = true;
    //重試連線間隔時間
    private retryIntervalSecondMs: number = 5000;
    //最後存活時間
    private lastLiveTime: number;
    //封包紀錄
    private queueDataInfo: QueueDataInfo[] = [];
    //主要服務 ID
    private SERVICE_MAIN: number = -1;
    //Service 連上的服務對應ID
    private serialNumberBt: Uint8Array;
    //Service 連上的對應隨機碼
    private serverRandomBt: Uint8Array;

    //可以實作的 Callback function
    public FunErrorMsg: OutputMsg | null = null;
    public FunDisconnectService: DisconnectService | null = null;
    public FunRecv: Recv | null = null;
    public FunFinishReconnect: FinishReconnect | null = null;
    public FunExitGame: ExitGame | null = null;
    public FunSystem: OutputMsg | null = null;

    //時間處理
    private _timeX: Timex = new Timex();
    //服務序列號
    private serialNumber: number;
    //未送封包
    private _unSendPacket: Uint8Array[] = [];
    constructor(
        gatewayList: string[],
        mainServiceId: number,
        livingSeconds: number,
        maxRetryCount: number,
        retryIntervalSeconds: number,
    ) {
        this.setState(State.OFFLINE);
        this.SERVICE_MAIN = mainServiceId;
        this.lifeCycle = livingSeconds * 1000;
        this.maxReconnectTimes = maxRetryCount;
        this.retryIntervalSecondMs = retryIntervalSeconds * 1000;
        this.dispatcherManager = new CDispatcherManager(gatewayList);
        this._Socket = new CSocket();
        this.serviceList = new Map<number, CService>();
        this.lastLiveTime = this._timeX.Elapsed;
        this.isStop = false;
    }


    /**
     * 進行連線
     * @param awKey 平台Token
     * @param serviceId 服務ID
     * @param version 版本
     */
    public Connect(awKey: string, serviceId: number, version: string, otherInfo: string = null): void {
        this.SERVICE_MAIN = serviceId;
        this._awKey = awKey;
        this._version = version;
        this.serviceList.clear();
        this.connectTimes = 0;
        this._otherInfo = otherInfo;
        this.setState(State.CONNECT_START);
    }

    /**
   * 主要服務溝通
   * @param data 封包資料
   * @returns 
   */
    public MainSend(data: Uint8Array): boolean {
        return this.Send(this.SERVICE_MAIN, data, true);
    }


    /**
     * 退出指定的服務
     * @param serviceId 服務ID
     */
    public ExitService(serviceId: number): void {
        if (!this.serviceList.has(serviceId)) {
            return;
        }
        const service = this.serviceList.get(serviceId);
        this.serviceList.delete(serviceId);
        const bt = new ByteWriterHelper();
        bt.WriteByte(CCommand.LeaveService);
        bt.WriteBytes(service.serviceIDBytes);
        this._Socket.Send(bt.Buffer);
        CConnectLog.Instance.InfoLog(`送離開服務[${service.serviceID}]`);
    }

    /**
     * 強制斷線
     * @param msg 斷線訊息 
     */
    public Disconnect(msg: string): void {
        this.setState(State.OFFLINE);
        CConnectLog.Instance.ErrorLog(`斷線 Reason:${msg}`);
        this.serviceList.clear();
        this.SendLogoutPacket();
        this.FunErrorMsg?.(msg);
    }

    /**
     * 上線
     */
    public Online() {
        CConnectLog.Instance.InfoLog(`登入成功`);
        this.loginRetryCount = 0;
        this.setState(State.ONLINE);
    }

    //Socket是否連線
    public isConnected(): boolean {
        return this._Socket.IsConnected();
    }

    //刷新
    public Update() {
        this.processReceivePacket();
        return this.onRun();
    }

    //是否可以傳送封包
    public canSend(): boolean {
        switch (this.getState()) {
            case State.CONNECT_START:
            case State.CONNECT_CONNECT_SUCCESS:
            case State.CONNECT_WAIT_CONNECT:
            case State.CONNECT_WAIT_SUCCESS:
            case State.ONLINE:
            case State.Login:
                return true;
            default:
                return false;
        }
    }

    //檢視目前Queue裡面的封包資訊
    public DequeueQueueDataInfo(): void {
        if (!this.FunRecv) {
            return;
        }

        if (this.queueDataInfo.length > 0) {
            return;
        }

        for (const info of this.queueDataInfo) {
            this.FunRecv(info.ServiceID, info.Data);
        }
    }

    //Logout
    private SendLogoutPacket() {
        const bt = new ByteWriterHelper();
        bt.WriteByte(CCommand.Logout);
        this._Socket.Send(bt.Buffer);
    }

    //設定狀態
    private setState(state: State): void {
        this.currentState = state;
    }

    //取得目前狀態
    public getState(): State {
        return this.currentState;
    }

    //#region 連線元件的狀態機執行
    private onRun(): boolean {
        if (this.isStop) {
            return false;
        }
        try {
            switch (this.getState()) {
                case State.CONNECT_START:
                    this.handleConnectState();
                    break;
                case State.CONNECT_WAIT_CONNECT:
                    this.handleWaitConnectState();
                    break;
                case State.CONNECT_CONNECT_SUCCESS:
                    this.handleFirstConnect();
                    break;
                case State.CONNECT_WAIT_SUCCESS:
                    this.handleWaitConnectSuccess();
                    break;
                case State.RECONNECT_START:
                    this.handleReconnectState();
                    break;
                case State.RECONNECT_WAIT_CONNECT:
                    this.handleWaitReconnectState();
                    break;
                case State.RECONNECT_CONNECT_SUCCESS:
                    this.handleReconnectSuccessState()
                    break;
                case State.RECONNECT_WAIT_SUCCESS:
                    this.handleReconnectWaitState();
                    break;
                case State.ONLINE:
                    this.handleOnlineState();
                    break;
                case State.Login:
                    this.handleLogin();
                    break;
            }
        }
        catch {
            return false;
        }
        return true;
    }

    //處理登入
    private handleLogin() {
        CConnectLog.Instance.InfoLog(`開始進行登入`);
        this.loginRetryCount++;
        const bt = new ByteWriterHelper();
        bt.WriteByte(CCommand.Login);
        bt.WriteBytes(ByteWriterHelper.ConvertToUnicodeStringByte(this._awKey));
        bt.WriteBytes(ByteWriterHelper.ConvertToUnicodeStringByte(this._version));
        if (this._otherInfo) {
            bt.WriteBytes(ByteWriterHelper.ConvertToUnicodeStringByte(this._otherInfo));
        }
        this.Send(this.SERVICE_MAIN, bt.Buffer);
        this.setState(State.LoginWait);
    }

    //處理上線狀態
    private handleOnlineState(): void {
        if (this._unSendPacket.length > 0) {
            CConnectLog.Instance.WarningLog(`有未送的封包`);
            for (const packet of this._unSendPacket) {
                this.MainSend(packet)
            }
            //清空未送封包
            this._unSendPacket.length = 0;
            CConnectLog.Instance.WarningLog(`未送的封包已經重新發送`);
        }
        if (this._Socket.IsConnected()) {
            return;
        }
        if (this.serviceList.size > 0) {
            const liftTime = this._timeX.Elapsed - this.lastLiveTime;
            if (liftTime > this.lifeCycle) {
                CConnectLog.Instance.WarningLog("閒置太久,超過存活時間");
                this.Disconnect("閒置太久,超過存活時間");
            }
            else {
                this.lastLiveTime = this._timeX.Elapsed;
                //Reconnect
                if (!this._Socket.IsConnected()) {
                    CConnectLog.Instance.WarningLog(`<開始建立重連,Socket斷連>`);
                }
                else {
                    CConnectLog.Instance.WarningLog(`<開始建立重連, ${liftTime}ms沒有存活>`);
                }
                this.setState(State.RECONNECT_START);
            }
        }
        else {
            CConnectLog.Instance.ErrorLog(`沒有服務,無法重連`);
            this.Disconnect("沒有服務,無法重連");
        }
    }
    //處理重連
    private handleReconnectWaitState(): void {
        if ((this._timeX.Elapsed - this.recordTime) < this.retryIntervalSecondMs) {
            return;
        }
        CConnectLog.Instance.WarningLog(`第${this.connectTimes}次重連  等待113超時`);
        this.setState(State.RECONNECT_START);
    }

    //處理重連等待成功
    private handleReconnectSuccessState(): void {
        const cService = this.getExistService()
        if (cService == null) { return; }
        const reConnectData = new ByteWriterHelper();
        reConnectData.WriteByte(CCommand.ReConnect);
        reConnectData.WriteBytes(cService.serviceIDBytes);
        reConnectData.WriteBytes(this.serialNumberBt);
        reConnectData.WriteBytes(this.serverRandomBt);
        reConnectData.WriteBytes(new Uint8Array(new ArrayBuffer(6)));
        this._Socket.Send(reConnectData.Buffer);
        this.recordTime = this._timeX.Elapsed;
        this.setState(State.RECONNECT_WAIT_SUCCESS);
        CConnectLog.Instance.InfoLog(`第${this.connectTimes}次連線 建立socket連線後送出113`);
    }

    //處理等待重連
    private handleWaitReconnectState(): void {
        if (this._Socket.IsConnected()) {
            this.setState(State.RECONNECT_CONNECT_SUCCESS);
            return;
        }

        if ((this._timeX.Elapsed - this.recordTime) < this.retryIntervalSecondMs) {
            return;
        }

        if (this._Socket.m_RcvConnectResult === 0) {
            CConnectLog.Instance.WarningLog(`第${this.connectTimes}次重連 等待socket重連超時(${this._timeX.Elapsed - this.recordTime})`);
        }
        else {
            CConnectLog.Instance.WarningLog(`CConnectManager 第${this.connectTimes}次連線 等待socket重連連線失敗`);
        }
        this.setState(State.RECONNECT_START);
    }

    //處理重連
    private async handleReconnectState() {
        this.connectTimes++;
        if (this.connectTimes > this.maxReconnectTimes) {
            CConnectLog.Instance.ErrorLog(`Reconnect 第${this.connectTimes}次連線  連線失敗次數太多${this.getState()}`);
            this.Disconnect(`${CConnectError.ReDispatcherConnectFail}`);
            return;
        }
        if (this._timeX.Elapsed - this.lastLiveTime > this.lifeCycle) {
            CConnectLog.Instance.ErrorLog(`Reconnect 第${this.connectTimes}次連線 連線超時${this._timeX.Elapsed - this.lastLiveTime} ms`);
            this.Disconnect(`${CConnectError.ReDispatcherConnectTimeout}`);
            return;
        }

        const newAddress = this.dispatcherManager.GetDispatcher_Ran();
        if (newAddress == null) {
            CConnectLog.Instance.ErrorLog(`Reconnect 第${this.connectTimes}次連線 找不到分流資訊`);
            this.Disconnect(`${CConnectError.ReDispatcherNotFound}`);
            return;
        }
        if (this._Socket.IsConnected()) {
            this._Socket.CloseSocket()
                .then(() => {
                    CConnectLog.Instance.InfoLog(`Reconnect 第${this.connectTimes}次連線  連線${newAddress._sIP}:${newAddress._iPort}`);
                    this._Socket.Connect(newAddress);
                    this.recordTime = this._timeX.Elapsed;
                    this.setState(State.RECONNECT_WAIT_CONNECT);
                })
                .catch((error) => {
                    CConnectLog.Instance.ErrorLog(`Reconnect 第${this.connectTimes}次連線 重連異常${error}`);
                    this.setState(State.OFFLINE);
                });
            this.setState(State.CONNECT_CONNECTING);
        }
        else {
            CConnectLog.Instance.InfoLog(`Reconnect 第${this.connectTimes}次連線  連線${newAddress._sIP}:${newAddress._iPort}`);
            this._Socket.Connect(newAddress);
            this.recordTime = this._timeX.Elapsed;
            this.setState(State.RECONNECT_WAIT_CONNECT);
        }


    }

    //處理等待連線成功
    private handleWaitConnectSuccess(): void {
        if ((this._timeX.Elapsed - this.recordTime) < this.retryIntervalSecondMs) {
            return;
        }
        CConnectLog.Instance.WarningLog(`第${this.connectTimes}次連線 等待112超時 ${(this._timeX.Elapsed - this.recordTime)}`);
        this.setState(State.CONNECT_START);
    }

    //處理第一次連線
    private handleFirstConnect(): void {
        const data = new ByteWriterHelper();
        data.WriteByte(CCommand.Connect);
        data.WriteBytes(ByteWriterHelper.ConvertToIntByte((this.lifeCycle / 1000), 2));
        data.WriteBytes(new Uint8Array(new ArrayBuffer(6)));
        this._Socket.Send(data.Buffer);
        this.recordTime = this._timeX.Elapsed;
        CConnectLog.Instance.InfoLog(`第${this.connectTimes}次連線 建立socket連線後送出112`);
        this.setState(State.CONNECT_WAIT_SUCCESS);
    }

    //處理等待連線狀態
    private handleWaitConnectState(): void {
        if (this._Socket.IsConnected()) {
            this.setState(State.CONNECT_CONNECT_SUCCESS);
            return;
        }

        if ((this._timeX.Elapsed - this.recordTime) < this.retryIntervalSecondMs) {
            return
        }

        if (this._Socket.m_RcvConnectResult === 0) {
            CConnectLog.Instance.WarningLog(`CConnectManager 第${this.connectTimes}次連線 等待socket連線超時(${this._timeX.Elapsed - this.recordTime})`);
        }
        else {
            CConnectLog.Instance.WarningLog(`CConnectManager 第${this.connectTimes}次連線 等待socket連線失敗`);
        }
        this.setState(State.CONNECT_START);
    }

    //處理連線狀態
    private handleConnectState(): Promise<void> {
        this.connectTimes++;
        if (this.connectTimes > this.maxReconnectTimes) {
            CConnectLog.Instance.ErrorLog(`CConnectManager 第${this.connectTimes}次連線 連線失敗次數太多`);
            this.Disconnect(`${CConnectError.DispatcherConnectFail}`);
            return;
        }

        const address = this.dispatcherManager.GetDispatcher_Ran();
        if (!address) {
            CConnectLog.Instance.ErrorLog(`CConnectManager 第${this.connectTimes}次連線 找不到分流資訊`);
            this.Disconnect(`${CConnectError.DispatcherNotFound}`);
            return;
        }
        if (this._Socket.IsConnected()) {
            this._Socket.CloseSocket().then(() => {
                this._Socket.Connect(address);
                this.recordTime = this._timeX.Elapsed;
                CConnectLog.Instance.InfoLog(`CConnectManager 第${this.connectTimes}次連線 等待socket連線中`);
                this.setState(State.CONNECT_WAIT_CONNECT);
            });
            this.setState(State.CONNECT_CONNECTING);
        }
        else {
            this._Socket.Connect(address);
            this.recordTime = this._timeX.Elapsed;
            CConnectLog.Instance.InfoLog(`CConnectManager 第${this.connectTimes}次連線 等待socket連線中`);
            this.setState(State.CONNECT_WAIT_CONNECT);
        }
    }

    //#region  收到封包
    private processReceivePacket(): void {
        const bt = this._Socket.GetQueue();
        if (!bt) { return; }
        if (!this._Socket.IsConnected()) { return; }
        this.handPacket(bt);
    }

    //#region  處理封包
    private handPacket(bt: Uint8Array): void {
        if (!bt) return;
        const btReader = new ByteReaderHelper(bt);
        const command: number = btReader.ReadByte();
        let serviceID: number;
        this.lastLiveTime = this._timeX.Elapsed;
        switch (command) {
            case 8:
                //更新分流清單
                break;
            case 30:
                //正常收包
                serviceID = btReader.ReadInt(2);
                const packetNo = btReader.ReadInt(2);
                if (this.serviceList.has(serviceID)) {
                    const service = this.serviceList.get(serviceID);
                    if (packetNo === 0) {
                        //Main service process
                        this.FunRecv?.(serviceID, ByteWriterHelper.CopyBytes(btReader, btReader.Position, btReader.length - btReader.Position));
                    }
                    else if (service?.recvNum === packetNo) {
                        service.recvNum = (service.recvNum % 60000) + 1;
                        this.FunRecv?.(serviceID, ByteWriterHelper.CopyBytes(btReader, btReader.Position, btReader.length - btReader.Position));
                    }
                    else {
                        CConnectLog.Instance.ErrorLog(`服務[${serviceID}]封包編號錯誤! 預期編號:[${service?.recvNum}] 實際編號:[${packetNo}]`);
                        this.setState(State.RECONNECT_START);
                    }
                }
                else {
                    CConnectLog.Instance.ErrorLog(`服務[${serviceID}]不存在，封包編號:[${packetNo}]`);
                }
                break;
            case 31:
                serviceID = btReader.ReadInt(2);
                const msg = btReader.ReadString();
                CConnectLog.Instance.ErrorLog(`加入服務失敗 ${serviceID} ${msg}`);
                this.removeService(serviceID, `移除服務${serviceID}`)
                break;
            case 33:
                serviceID = btReader.ReadInt(2);
                this.removeService(serviceID, `被服務踢出${serviceID}`);
                break;
            case 34:
                if (this.getState() !== State.RECONNECT_WAIT_SUCCESS) {
                    return;
                }
                serviceID = btReader.ReadInt(2);
                const serverRecvNum = btReader.ReadInt(2);
                const service = this.serviceList.get(serviceID);
                if (service) {
                    const history = service.GetSendHistory(serverRecvNum);
                    for (const cPacket of history) {
                        this._Socket.Send(cPacket.packet);
                    }
                }
                CConnectLog.Instance.WarningLog(`收到34,服務 ${serviceID}`);
                this.reconnectReceivedCount += 1;

                if (this.reconnectReceivedCount === this.totalReconnectServices) {
                    this.reconnectReceivedCount = 0;
                    this.totalReconnectServices = 0;
                    this.connectTimes = 0;
                    CConnectLog.Instance.WarningLog(`完成全部重連`);
                    this.setState(State.ONLINE);
                }
                break;
            case 35:
                //中控踢人  告知玩家 直接斷線
                CConnectLog.Instance.WarningLog(`Server中斷服務`);
                this.FunDisconnectService?.(serviceID, msg);
                this.Disconnect("Server中斷服務");
                break;
            case CCommand.Connect:
                //連線成功建立後收到分流編號
                if (this.getState() !== State.CONNECT_WAIT_SUCCESS) {
                    return;
                }
                btReader.Position = 1;
                this.serialNumberBt = new Uint8Array(new ArrayBuffer(DataSize.Int));
                this.serverRandomBt = new Uint8Array(new ArrayBuffer(DataSize.Int));
                for (let x = 0; x < DataSize.Int; x++) {
                    this.serialNumberBt[x] = btReader.ReadByte();
                }
                for (let x = 0; x < DataSize.Int; x++) {
                    this.serverRandomBt[x] = btReader.ReadByte();
                }
                this.serialNumber = btReader.ReadInt(4);
                this.recordTime = this._timeX.Elapsed;
                this.connectTimes = 0;
                CConnectLog.Instance.InfoLog(`收到112,發送加入主服[${this.SERVICE_MAIN}]`);
                const joinMainServiceDelayMS: number = 100;
                //加入服務
                setTimeout(() => {
                    this.joinService(this.SERVICE_MAIN);
                    this.setState(State.Login);
                }, joinMainServiceDelayMS);

                break;
            case 113:
                if (this.getState() !== State.RECONNECT_WAIT_SUCCESS) {
                    return;
                }
                this.reconnectReceivedCount = 0;
                this.totalReconnectServices = 0;
                for (const service of this.serviceList.values()) {
                    const bt = new ByteWriterHelper();
                    bt.WriteByte(CCommand.Join);
                    bt.WriteBytes(service.serviceIDBytes);
                    bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(service.recvNum, 2));
                    bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(this.lifeCycle / 1000, 2));
                    this._Socket.Send(bt.Buffer);
                    this.totalReconnectServices += 1;
                }
                CConnectLog.Instance.InfoLog(`收到113, 發送31 ,重連服務數:${this.totalReconnectServices}`);
                break;
            // 詢問總部，目前沒有送
            // case 202:
            //     //中途加入新的分流
            //     CConnectLog.Instance.WarningLog( `中途加入分流 ${ByteWriterHelper.CopyBytes( bt, 1, 6 )}` );
            //     this.dispatcherManager.AddDispatcher( ByteWriterHelper.CopyBytes( bt, 1, 6 ) );
            //     break;
            // case 203:
            //     //中途分流移除
            //     CConnectLog.Instance.WarningLog( `中途移除分流 ${ByteWriterHelper.CopyBytes( bt, 1, 6 )}` );
            //     this.dispatcherManager.RemoveDispatcher( ByteWriterHelper.CopyBytes( bt, 1, 6 ) );
            //     break;
            case 255:
                if (this.serviceList.size <= 0) {
                    return;
                }
                const tempBt = new ByteWriterHelper();
                tempBt.WriteByte(CCommand.Life);
                tempBt.WriteBytes(ByteWriterHelper.ConvertToIntByte(0, 2));
                this._Socket.Send(tempBt.Buffer);
                break;
        }
    }

    /**
     * 加入主要服務
     * @param serviceId 服務 ID 
     */
    private joinService(serviceId: number) {
        if (!this.serviceList.has(serviceId)) {
            const service: CService = new CService(serviceId, this.lifeCycle);
            this.serviceList.set(serviceId, service);
            const bt = new ByteWriterHelper();
            bt.WriteByte(CCommand.Join);
            bt.WriteBytes(service.serviceIDBytes);
            bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(0, 2));
            bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(this.lifeCycle / 1000, 2));
            this._Socket.Send(bt.Buffer);
            CConnectLog.Instance.InfoLog(`送加入服務[${service.serviceID}]`);
        }
    }


    /**
     * 移除服務
     * @param serviceID 服務ID 
     * @param msg 移除訊息
     * @returns 
     */
    private removeService(serviceID: number, msg: string): void {
        CConnectLog.Instance.WarningLog(`將要移除服務[${serviceID}] msg : ${msg}`);

        if (this.loginRetryCount < this.loginRetryMax) {
            this.ExitService(serviceID);
            this.setState(State.CONNECT_START);
            return;
        }

        if (!this.serviceList.delete(serviceID)) {
            CConnectLog.Instance.WarningLog(`服務 ${serviceID}不存在`);
            return;
        }
        this.FunDisconnectService?.(serviceID, msg);
        if (this.getExistService() != null) {
            // 只要有任何一個 Service 活著, 就不能斷線
            return;
        }

        this.Disconnect("所有主服務都已經斷線");
    }

    /**
     * 取得目前存在的Service
     * @returns 存在的Service
     */
    private getExistService(): CService | null {
        if (this.serviceList.size > 0) {
            for (const service of this.serviceList.values()) {
                return service;
            }
        }
        return null;
    }

    /**
     * 送封包
     * @param serviceId 服務ID
     * @param data 封包內容
     * @param isOrder 是否有排序(預設有排序)
     * @returns 
     */
    private Send(serviceId: number, data: Uint8Array, isOrder: boolean = true): boolean {
        if (this.IsWaitReconnect()) {
            this._unSendPacket.push(data);
            CConnectLog.Instance.WarningLog(`正在重連中,無法傳送封包`);
            return false;
        }
        if (!this.canSend()) {
            this._unSendPacket.push(data);
            CConnectLog.Instance.ErrorLog(`無法傳送封包`);
            return false;
        }

        if (!this.serviceList.has(serviceId)) {
            CConnectLog.Instance.ErrorLog(`服務[${serviceId}] 不在列表中`);
            return false;
        }

        const service = this.serviceList.get(serviceId);
        if (!service) {
            CConnectLog.Instance.ErrorLog(`服務[${serviceId}] 不存在`);
            return false;
        }

        const bt = isOrder ? service.AddPacket(data) : service.getNoOrderPacket(data);
        this._Socket.Send(bt);
        return true;
    }

    //檢查是否正在重連
    public IsWaitReconnect(): boolean {
        return this.getState() === State.RECONNECT_START
            || this.getState() === State.RECONNECT_WAIT_CONNECT
            || this.getState() === State.RECONNECT_WAIT_SUCCESS;
    }

    public IsDisconnect(): boolean {
        return this.getState() === State.OFFLINE;
    }
}