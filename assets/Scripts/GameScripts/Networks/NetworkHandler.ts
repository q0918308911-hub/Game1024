import { Debug, Utility } from '../../Utils/Core';
import { NetAgent } from '../../NetAgent/NetAgent';
import { Environment } from '../../NetAgent/AgentDefine';
import { NetEvent, NetListener } from '../../NetAgent/NetObserver';
import GameMachineInfo from '../../NetAgent/GameMachineInfo';
import { CCommand, CCommandStatus } from '../../NetAgent/CConnectManager/CConnectDefine';
import { ErrorHandler } from '../../ErrorHandler/ErrorHandler';
import { ErrorCode } from '../../ErrorHandler/ErrorHandleDefine';
import SpinAck from '../../NetAgent/SpinAck';
import { BetData } from './BetData';
import { ByteReaderHelper, ByteWriterHelper } from '../../NetAgent/CConnectManager/ByteArray';
import { PlayerInfo } from './PlayerInfo';


const LoginURL: string = "https://bpdev2.xin-stars.com/60887/Login"; // 登入網址
const BetURL: string = "https://bpdev2.xin-stars.com/60887/Bet"; // 下注網址
const OtherActionURL: string = "https://bpdev2.xin-stars.com/60887/OtherAction"; // 額外動作網址
const OtherActionWithBetURL: string = "https://bpdev2.xin-stars.com/60887/OtherAction_WithBet"; // 額外押注網址

export enum NetworkEvent {
    Login = 'Login', // 登入
    Bet = 'Bet', // 下注
    SpinFail = 'SpinFail', // 下注失敗
    OtherAction = 'OtherAction', // 40 額外動作
    OtherActionWithBet = 'OtherActionWithBet', // 41 額外押注
}

enum MessageHeadCode {
    OtherAction = 40,
    OtherActionWithBet = 41,
}

export class NetworkHandler {
    private static _instance: NetworkHandler = null;
    private callbacks: any = {};
    private gameID: string = ''; // 遊戲編號 Game1001, Game002 等
    private gameCode: string = '' // 北分連線編號 W002 , W001 等 目前沒有使用
    private _isLogin: boolean = false;
    private isInit: boolean = false;
    private localNetworkTimeoutNumber: number = 600;
    private timestampInSeconds: number = 0;
    private urlParams: Map<string, string>;
    private isExhibition: boolean = true;
    private _demo: boolean = false;
    private _platform: number = 0;
    private timeoutTimerFlag: boolean = true; // 是否啟用閒置斷線計時器

    /**
     * 是否為 demo 模式
     * @returns true or false
     */
    public get demo(): boolean {
        return this._demo;
    }

    /**
     * 是否為登入狀態
     * @returns true or false
     */
    public get isLogin(): boolean {
        return this._isLogin;
    }

    /**
     * 獲取平台
     * @returns 平台編號
     */
    public get platform(): number {
        return this._platform;
    }

    /**
     * 建構
     */
    constructor() {
        let keys = Object.keys(NetworkEvent);
        for (let item of keys) {
            this.callbacks[item] = [];
        }
    }

    /**
     * 獲取實例
     * @returns NetworkHandler
     */
    public static get instance(): NetworkHandler {
        if (this._instance === null) {
            this._instance = new NetworkHandler();

        }
        return this._instance;
    }

    /**
     * 初始化
     * @param gameID 遊戲編號
     * @param timeoutSecond idle時間上限(單位秒)
     * @param isExhibition 是否為展示模式(展示模式會使用直連總部取牌館連線)
     */
    public init(gameID: string, timeoutSecond: number = 600, isExhibition: boolean) {
        if (this.isInit) {
            return;
        }
        this.gameID = gameID;
        this.isExhibition = isExhibition;
        Debug.Log("NetworkHandler init");
        this.isInit = true;
        this.localNetworkTimeoutNumber = timeoutSecond;
        this.updateTimeStamp();

        setInterval(() => {
            this.checkIsTimeout()
        }, 1000);

        window.addEventListener('offline', () => {
            if (!this.isExhibition && !Utility.isDev()) {
                NetAgent.GetInstance().Disconnect("網路斷線");
            }
        });
    }

    /**
     * NetAgent 更新
     * @param dt NetAgent 的 Update 參數，但實際傳入並未使用
     */
    public update(dt: number) {
        if (!this.isExhibition && !Utility.isDev()) {
            NetAgent.GetInstance().Update(dt);
        }
    }

    /**
     * 連線 Server
     */
    public connectServer() {
        //NetAgent Observer Listener
        NetAgent.GetInstance().RegisterObserver(new NetListener("Game", this.onDisconnect.bind(this)));
        NetAgent.GetInstance().RegisterCustomCommand(this.onCustomCommandReceived.bind(this))
        if (!this._isLogin) {

            //===========需要參數============
            //環境
            let environment = Environment.Release;
            if (Utility.isTestEnvironment()) {
                // 如果是測試環境 使用Environment.Test
                environment = Environment.Test;
            }
            //登入網址
            const Url = window.location.href;
            //版本號
            const Version = "1";

            this.urlParams = Utility.getURLParams(Url);
            this._demo = this.urlParams.get('demo') === 'True';
            this.gameCode = this.urlParams.get('game_code');
            this._platform = parseInt(this.urlParams.get('platform'));

            NetAgent.GetInstance().Login(environment, Version)
                .then((gameMachineInfo: GameMachineInfo) => {
                    this._isLogin = true;
                    Debug.Log(`isLogin = ${this._isLogin}`);
                    // console.log(`登入結果:${gameMachineInfo.Result}`);
                    // console.log(`玩家暱稱:${gameMachineInfo.Nickname}`);
                    // console.log(`玩家餘額:${gameMachineInfo.Balance}`);
                    // console.log(`玩家Max Bet:${gameMachineInfo.MaxBet}`);
                    // console.log(`玩家Min Bet:${gameMachineInfo.MinBet}`);
                    // console.log(`機台ID:${gameMachineInfo.Id}`);
                    // console.log("====================Login End====================");
                    if (gameMachineInfo.Result === CCommandStatus.Success) {
                        // console.log("---------------------------------------------------");
                        // 目前CurrentHistoryData資料是越新的資料在越後面
                        // console.log(NetAgent.GetInstance().CurrentHistoryData);
                        // 更新下注紀錄
                        // PlayerInfo.initHistoryItemInfos(NetAgent.GetInstance().CurrentHistoryData);
                        this.dispatchEvent(NetworkEvent.Login, true, gameMachineInfo);
                    }
                    else {
                        return Promise.reject(gameMachineInfo.Result);
                    }
                })
                .catch((reason: any) => {
                    if (typeof reason === 'number') {
                        ErrorHandler.Instance.TriggerError(Number(reason));
                    }
                    else {
                        console.error(`登入失敗`);
                        console.error(reason);
                        ErrorHandler.Instance.TriggerError(ErrorCode.Client_LoginFail);
                    }
                });
        }
    }

    /**
     * 新增監聽
     * @param type Network 事件
     * @param callback 回呼函數
     */
    public addEventListener(type: NetworkEvent, callback: Function) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    /**
     * 移除監聽
     * @param type Network 事件
     * @param callback 回呼函式
     */
    public removeEventListener(type: NetworkEvent, callback: Function) {
        const index = this.callbacks[type].indexOf(callback);
        if (index > -1) {
            this.callbacks[type].splice(index, 1);
        }
    }

    /**
     * 發送 Network 事件
     * @param type Network 事件
     * @param args 參數
     */
    dispatchEvent(type: NetworkEvent, ...args: any[]) {
        let eventCallbacks: Function[] = this.callbacks[type];
        for (let callback of eventCallbacks) {
            callback?.(...args);
        }
    }

    /**
     * 送出事件 to Server
     * @param event Network 事件
     * @param args 參數
     */
    public send(event: NetworkEvent, ...args: any[]) {
        switch (event) {
            case NetworkEvent.Bet:
                let gameNumber: number = args[0];
                let bet: number = args[1];
                let balance: number = args[2];
                let additionalPurchaseType: number = args[3];
                let playerToken = args[4];
                if (!playerToken) {
                    playerToken = "試玩";
                    console.error("sendBetFetch 需要 playerToken 參數，請確認是否有傳入");
                }

                this.sendBet(gameNumber, bet, balance, additionalPurchaseType, playerToken);
                break;
            default:
                console.error(`send error event ${event}`);
                break;

        }
    }

    /**
     * 送出下注
     * 注意：不要直接呼叫這個方法，請改用 send
     * @param gameNumber 遊戲編號
     * @param totalBet 總下注額
     * @param balance 餘額
     * @param additionalPurchaseType 加購類別
     * @param playerToken 辨別身分的Token (與sendGameLoginFetch的Token相同)
     */
    private sendBet(gameNumber: number, totalBet: number, balance: number, additionalPurchaseType: number, playerToken: string) {
        this.updateTimeStamp();
        if (this.isLogin) {
            this.sendBetWebSocket(totalBet, additionalPurchaseType);
        }
        else {
            this.sendBetFetch(gameNumber, totalBet, balance, additionalPurchaseType, playerToken);
        }
    }

    /**
     * 使用 WebSocket 送出下注(北分 NetAgent)
     * @param totalBet 總下注額
     * @param additionalPurchaseType 加購類別
     */
    private sendBetWebSocket(totalBet: number, additionalPurchaseType: number) {
        NetAgent.GetInstance().Spin(totalBet, additionalPurchaseType)
            .then((spinResponse: SpinAck) => {
                // console.log( `Spin 結果:${spinResponse.Result}` );
                // console.log( `Spin 玩家餘額:${spinResponse.Balance}` );
                // console.log( `Spin Bet:${spinResponse.BaseBet}` );
                // console.log( `Spin 加購:${spinResponse.AdditionalPurchase}` );
                // console.log( `Spin 此局贏分:${spinResponse.Win}` );
                // console.log( `Spin 此局單號:${spinResponse.SerialId}` );
                // console.log( `Spin 此局盤面:${spinResponse.Plant}` );

                if (spinResponse.Result === CCommandStatus.Success) {
                    let jsonData: Map<string, string | number> = new Map<string, string | number>();
                    jsonData.set('bet', spinResponse.BaseBet);
                    jsonData.set('coin', spinResponse.Balance);
                    jsonData.set('score', spinResponse.Win);
                    jsonData.set('slotData', spinResponse.Plant);
                    jsonData.set('spinId', spinResponse.SerialId);
                    let betData = new BetData(jsonData);

                    // 如果非demo狀態，才會更新歷史紀錄
                    // 不更新歷史紀錄，目前交給NetAgent處理
                    /*
                    if (!this.demo) {
                        let historyItem = new HistoryItemInfo();
                        historyItem.bet = betData.bet;
                        historyItem.winScore = betData.score;
                        historyItem.betID = betData.spinId;
                        historyItem.gameCode = this.gameID;
                        historyItem.playerId = PlayerInfo.userName;
                        historyItem.date = Date.now();
                        historyItem.slotData = betData.slotData;
                        historyItem.beforeTotal = (betData.coin - betData.score + betData.bet).fixed();
                        historyItem.afterTotal = betData.coin;
                        historyItem.version = '';
                        PlayerInfo.updateHistoryItemInfos(historyItem);
                    }
                    */

                    this.dispatchEvent(NetworkEvent.Bet, betData);
                }
                else {
                    console.error(`下注失敗:${spinResponse.Result}`);
                    let SerialId = spinResponse.SerialId;
                    this.dispatchEvent(NetworkEvent.SpinFail, SerialId);
                    return Promise.reject(Number(spinResponse.Result));
                }
            })
            .catch((reason: any) => {
                if (typeof reason === 'number') {
                    ErrorHandler.Instance.TriggerError(Number(reason));
                }
                else {
                    ErrorHandler.Instance.TriggerError(ErrorCode.Client_BetError);
                }
            });
    }

    /**
     * 使用 POST 送出下注(總部取牌館)
     * @param gameNumber 遊戲編號
     * @param totalBet 總下注額
     * @param balance 餘額
     * @param additionalPurchaseType 加購類別
     */
    private sendBetFetch(gameNumber: number, totalBet: number, balance: number, additionalPurchaseType: number, playerToken: string) {
        if (Utility.isDev() || this.isExhibition) {
            let raw = {
                // GameName: "XinH5", // 此欄位已移除
                GameNumber: gameNumber,
                Bet: totalBet,
                PlayerToken: playerToken,
                Coin: balance,
                BuyFG: additionalPurchaseType === 0 ? undefined : additionalPurchaseType,
            }

            let url = BetURL;
            fetch(url, { method: "POST", body: JSON.stringify(raw) })
                .then((response) => {
                    response.type
                    return response.json();
                })
                .then((json: any) => {
                    if (json['Success']) {
                        let jsonMap = new Map<string, string | number>();
                        jsonMap.set('bet', json['Bet']);
                        jsonMap.set('score', json['Score']);
                        jsonMap.set('coin', json['Coin']);
                        jsonMap.set('spinId', 'H5Post');
                        jsonMap.set('slotData', json['SlotData']);
                        let betData = new BetData(jsonMap);
                        this.dispatchEvent(NetworkEvent.Bet, betData);
                    }
                    else {
                        console.error('錯誤的json資料');
                        console.error(json);
                        return Promise.reject(ErrorCode.Client_BetError);
                    }
                })
                .catch((reason: any) => {
                    Debug.LogError(reason);
                    ErrorHandler.Instance.TriggerError(ErrorCode.Client_BetError);
                })
        }


    }

    /**
     * 檢查 Demo 狀態
     * @returns 是否為 Demo
     */
    private checkDemoStatus(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let url = window.location.href;
            Debug.Log(`window.location.href  =  ${url}`);
            let urlParams: Map<string, string> = Utility.getURLParams(url);
            let isDemo = urlParams.get('demo') === 'True';
            resolve(isDemo);
        });

    }

    /**
     * 更新時戳
     */
    private updateTimeStamp() {
        this.timestampInSeconds = Utility.getCurrentTimeStampInSeconds();
    }

    /**
     * 檢查是否 Timeout
     */
    private checkIsTimeout() {
        if (this.isLogin && this.timeoutTimerFlag) {
            let stamp = Utility.getCurrentTimeStampInSeconds();
            let idleTime = stamp - this.timestampInSeconds;
            if (idleTime > this.localNetworkTimeoutNumber) {
                NetAgent.GetInstance().Disconnect("閒置斷線");
            }
        }
    }

    /**
     * 設定閒置斷線計時器的啟用狀態
     * @param flag true 啟用計時器，false 停用計時器
     */
    public setTimeoutTimerFlag(flag: boolean) {
        if (flag) {
            this.updateTimeStamp(); // 啟用計時器時，更新時間戳
        }
        this.timeoutTimerFlag = flag;
    }

    /**
     * 手動斷線
     */
    public Disconnect() {
        NetAgent.GetInstance().Disconnect("手動斷線");
    }

    /**
     * 斷線時提示錯誤訊息
     * @param event Network 事件
     * @param value 錯誤資訊(字串 or 數值)
     */
    private onDisconnect(event: NetEvent, value: any) {
        if (typeof (value) === 'string') {
            let reason: string = value;
            switch (reason) {
                case "網路斷線":
                    console.error(`網路斷線`);
                    ErrorHandler.Instance.TriggerError(ErrorCode.ServerKick);
                    break;
                case "閒置斷線":
                    ErrorHandler.Instance.TriggerError(ErrorCode.Client_IdleTimeout);
                    break;
                case `${CCommandStatus.Failure}`:
                    console.error(`未知的斷線原因 event : ${event} value : ${value}`);
                    ErrorHandler.Instance.TriggerError(ErrorCode.Client_LoginFail);
                    break;
                default:
                    console.error(`未知的斷線原因: ${reason}`);

                    if (event === NetEvent.Disconnected || event === NetEvent.ServiceKick) {
                        //檢查是否為斷線的 event
                        console.error(`未知的斷線原因 event : ${event} value : ${value}`);
                        if (isNaN(Number(value))) {
                            ErrorHandler.Instance.TriggerError(Number(ErrorCode.ServerKick));
                        }
                        else {
                            ErrorHandler.Instance.TriggerError(Number(value));
                        }
                    }
                    else {
                        //目前缺少該處的事件處理
                        console.error(`未知的斷線原因 event : ${event} value : ${value}`);
                        if (isNaN(Number(value))) {
                            ErrorHandler.Instance.TriggerError(ErrorCode.Client_UNKNOWN);
                            console.error(`未知的斷線原因 event : ${event} value : ${value}`);
                        }
                        else {
                            ErrorHandler.Instance.TriggerError(Number(value));
                        }

                    }

                    break;
            }
        }
        else if (typeof (value) === "number") {
            if (event === NetEvent.Disconnected || event === NetEvent.ServiceKick) {
                ErrorHandler.Instance.TriggerError(value);
            }
            else {
                //目前缺少該處的事件處理
                console.error(`未知的斷線原因 number : ${event}`);
                ErrorHandler.Instance.TriggerError(value);
            }
        }
    }

    /**
     * 取牌館Login功能，可取得進入時的盤面(有的遊戲會需要)
     * @param playerToken 辨別身分的Token
     * @param gameNumber 遊戲號碼(例如 12099)
     */
    public sendGameLoginFetch(playerToken: string, gameNumber: number): Promise<string> {

        if (!playerToken) {
            playerToken = "試玩";
            console.error("NetworkHandler sendGameLoginFetch 需要 playerToken 參數，請確認是否有傳入");
        }

        return new Promise((resolve, reject) => {
            if (Utility.isDev() || this.isExhibition) {
                let raw = {
                    // GameName: "XinH5", // 此欄位已移除
                    GameNumber: gameNumber,
                    PlayerToken: playerToken,
                }

                let url = LoginURL;
                fetch(url, { method: "POST", body: JSON.stringify(raw) })
                    .then((response) => {
                        return response.json();
                    })
                    .then((json: any) => {
                        if (json['Success']) {
                            let base64Data = json['SlotData']; // 60張牌的byte array
                            resolve(base64Data);
                        }
                        else {
                            console.error('錯誤的json資料');
                            console.error(json);
                            return Promise.reject(ErrorCode.Client_BetError);
                        }
                    })
                    .catch((reason: any) => {
                        reject("fetch login error");
                    })
            }
            else {
                reject("非測試環境");
            }
        });
    }

    /**
     * 傳送NetAgent的自定義指令
     * @param data 範例請看內部註解
     */
    private SendCustomCommand(bt: ByteWriterHelper) {
        this.updateTimeStamp();
        NetAgent.GetInstance().SendCustomCommand(bt.Buffer);

        // 使用範例
        /*
            const bt = new ByteWriterHelper();
            bt.WriteByte(40);
            bt.WriteByte(1);
            NetworkHandler.instance().SendCustomCommand(bt);
            // 處理方式參考上方接收callback的註冊
        */
    }

    /**
     * 傳送<額外動作> 40 的自定義指令
     */
    public sendOtherAction(gameNumber: number, playerToken: string, action: number, content: number[] = []) {
        if (this.isLogin) {
            const bt = new ByteWriterHelper();
            bt.WriteByte(MessageHeadCode.OtherAction);
            bt.WriteByte(action);
            let len = content.length;
            let bytes: number[] = this.toBigEndianBytes(len);
            // server 此處接收的byte含長度是的長度格式是兩個byte
            bt.WriteByte(bytes[0]);
            bt.WriteByte(bytes[1]);
            for (let item of content) {
                bt.WriteByte(item);
            }
            this.SendCustomCommand(bt);
        }
        else {
            let raw = {
                // GameName: "XinH5", // 此欄位已移除
                GameNumber: gameNumber,
                PlayerToken: playerToken,
                Content: [action, ...content],
            }

            let url = OtherActionURL;
            fetch(url, { method: "POST", body: JSON.stringify(raw) })
                .then((response) => {
                    return response.json();
                })
                .then((json: any) => {
                    if (json['Success']) {
                        let base64Data = json['Content']; // 60張牌的byte array
                        // let ballIDList = Utility.base64ToByteArray(base64Data);
                        this.dispatchEvent(NetworkEvent.OtherAction, action, base64Data);
                    }
                    else {
                        console.error('錯誤的json資料');
                        console.error(json);
                        return Promise.reject(ErrorCode.Client_BetError);
                    }
                });
        }
    }

    /**
     * 傳送<額外押注> 41 的自定義指令
     */
    public sendOtherActionWithBet(gameNumber: number, bet: number, balance: number, playerToken: string, action: number, content: number[] = []) {
        if (this.isLogin) {
            const bt = new ByteWriterHelper();
            bt.WriteByte(MessageHeadCode.OtherActionWithBet);
            bt.WriteByte(action);
            bt.WriteBytes(ByteWriterHelper.ConvertToDoubleByte(bet));

            let len = content.length;
            let bytes: number[] = this.toBigEndianBytes(len);
            // server 此處接收的byte含長度是的長度格式是兩個byte
            bt.WriteByte(bytes[0]);
            bt.WriteByte(bytes[1]);
            for (let item of content) {
                bt.WriteByte(item);
            }

            this.SendCustomCommand(bt);
        }
        else {
            let raw = {
                // GameName: "XinH5", // 此欄位已移除
                GameNumber: gameNumber,
                PlayerToken: playerToken,
                Content: [action, ...content],
                Bet: bet,
                Coin: balance,
            }

            let url = OtherActionWithBetURL;
            fetch(url, { method: "POST", body: JSON.stringify(raw) })
                .then((response) => {
                    return response.json();
                })
                .then((json: any) => {
                    if (json['Success']) {
                        let jsonMap = new Map<string, string | number>();
                        jsonMap.set('bet', json['Bet']);
                        jsonMap.set('score', json['Score']);
                        jsonMap.set('coin', json['Coin']);
                        jsonMap.set('spinId', 'TEST');
                        jsonMap.set('slotData', json['Content']);
                        let betData = new BetData(jsonMap);
                        this.dispatchEvent(NetworkEvent.OtherActionWithBet, action, betData, null);
                    }
                    else {
                        console.error('錯誤的json資料');
                        console.error(json);
                        return Promise.reject(ErrorCode.Client_BetError);
                    }
                });
        }
    }

    /**
     * 接收中控客製化消息
     * @param ack ByteReaderHelper
     */
    private onCustomCommandReceived(ack: ByteReaderHelper) {
        ack.Position = 0;
        let command = ack.ReadByte();
        let action = ack.ReadByte();

        switch (command) {
            case MessageHeadCode.OtherAction:
                // OtherAction 額外動作
                let otherActionStatusCode = ack.ReadByte();
                if (otherActionStatusCode === CCommandStatus.Success) {
                    let base64: string = '';
                    if (ack.Position < ack.length) {
                        let byteUint8Array = ack.ReadByteIncludeLength();
                        base64 = Utility.uint8ArrayToBase64(byteUint8Array);
                    }
                    this.dispatchEvent(NetworkEvent.OtherAction, action, base64);
                }
                else {
                    console.error(`額外動作失敗 (spinResponse): ${ack}`);
                    if (typeof otherActionStatusCode === 'number') {
                        ErrorHandler.Instance.TriggerError(Number(otherActionStatusCode));
                    }
                    else {
                        ErrorHandler.Instance.TriggerError(ErrorCode.Client_BetError);
                    }
                }
                break;
            case MessageHeadCode.OtherActionWithBet:
                // OtherActionWithBet 額外押注
                let spinResponse = new SpinAck(ack);
                if (spinResponse.Result === CCommandStatus.Success) {
                    PlayerInfo.insertHistory(spinResponse); // 自行更新玩家歷史紀錄
                    let jsonData: Map<string, string | number> = new Map<string, string | number>();
                    jsonData.set('bet', spinResponse.BaseBet);
                    jsonData.set('coin', spinResponse.Balance);
                    jsonData.set('score', spinResponse.Win);
                    jsonData.set('slotData', spinResponse.Plant);
                    jsonData.set('spinId', spinResponse.SerialId);
                    let betData = new BetData(jsonData);
                    this.dispatchEvent(NetworkEvent.OtherActionWithBet, action, betData);
                }
                else {
                    console.error(`額外押注失敗 (ack): ${ack}`);
                    if (typeof spinResponse.Result === 'number') {
                        ErrorHandler.Instance.TriggerError(Number(spinResponse.Result));
                    }
                    else {
                        ErrorHandler.Instance.TriggerError(ErrorCode.Client_BetError);
                    }
                }
                break;
            case CCommand.Login:
            case CCommand.Spin:
                // 忽略 已知的 Login 與 Spin 指令
                break;
            default:
                console.error(`未知的CustomCommand command : ${command}`);
                break;
        }

    }

    private toBigEndianBytes(num: number): [number, number] {
        if (num < 0 || num > 0xFFFF) {
            console.error("數字必須在 0 ~ 65535 之間");
        }
        // 取高位 (右移 8 bits) 和低位 (取最低 8 bits)
        const high = (num >> 8) & 0xFF;
        const low = num & 0xFF;
        return [high, low];
    }

}
