import { askHistoryBodyFormat as AskHistoryBodyFormat, AskHistoryFail, AskHistoryRetryCount, ConfigType, Environment, HistoryErrorCode, historyHeightFormat, HistoryHeightMax, ICommonSetting, IGameConfig, IGameSetting, IHistory, IPlatformSetting, IPlayerInfo, LoginReDispatcherConnectFail, PARSER_URL_FAIL, REQUEST_TIMEOUT, REQUEST_TIMEOUT_ERROR_CODE, SpinReDispatcherConnectFail } from "./AgentDefine";
import { ByteReaderHelper, ByteWriterHelper } from "./CConnectManager/ByteArray";
import { MainServiceID, MaxRetryCount, RetryIntervalSeconds } from "./CConnectManager/CConncetConfig";
import { AdditionalPurchaseType, CCommand, CCommandStatus } from "./CConnectManager/CConnectDefine";
import { CConnectLog } from "./CConnectManager/CConnectLog";
import CConnectManager from "./CConnectManager/CConnectManager";
import GameMachineInfo from "./GameMachineInfo";
import { GameType, NetAgentVersion } from "./NetAgentDefine";
import { NetEvent, NetListener, NetObserver } from "./NetObserver";
import SpinAck from "./SpinAck";
import * as cc from "cc"


/**
 * 連線元件
 */
export class NetAgent {
    private static _instance: NetAgent = null;
    //連線管理元件
    private _cConnectManager: CConnectManager = null;
    //process array 處理結果
    private _processCommandArray: Array<{ command: CCommand, process: any, timeoutId: any }> = [];
    //觀察者
    private _observer: NetObserver = new NetObserver();
    //PlayerInfo
    private _playerInfo: IPlayerInfo = {
        game_code: "",
        platform: "",
        name: "",
        serviceId: "",
        awKey: "",
        webConfigUrl: "",
        ParserSuccess: false,
    };

    private gameType: GameType = GameType.Slot;

    private handleCustomCommand: (ack: ByteReaderHelper) => void = null;

    private constructor() {
        console.log(`[NetAgent] Version: ${NetAgentVersion}`);
    }
    //歷程
    private _history: IHistory[] = [];
    //收到斷線
    private onCConnectError(msg: string) {
        cc.log("[NetAgent onCConnectError] msg", msg);
        this._observer.Notify(NetEvent.Disconnected, msg);
    }

    //收到服務踢人
    private onCConnectDisConnect(serviceID: number, msg: string) {
        cc.log("[NetAgent onCCConnectDisConnect] serviceID", serviceID, "msg", msg);
        this._observer.Notify(NetEvent.ServiceKick, msg);
    }

    private onCConnectRecv(_: number, data: Uint8Array) {
        const bt = new ByteReaderHelper(data.buffer as ArrayBuffer);
        this.processCommand(bt.ReadByte(), bt);
        this.handleCustomCommand && this.handleCustomCommand(bt);
    }


    public static GetInstance(): NetAgent {
        if (this._instance == null) { this._instance = new NetAgent(); }
        return this._instance
    }

    public get PlayerInfo(): IPlayerInfo {
        return this._playerInfo;
    }

    //處理指令
    private processCommand(command: CCommand, ack: ByteReaderHelper) {
        switch (command) {
            case CCommand.Login:
                this.handleLogin(ack);
                break;
            case CCommand.Spin:
                this.handleSpin(ack);
                break;
            default:
                break;
        }
    }

    //Spin process
    private handleSpin(ack: ByteReaderHelper) {
        const processIndex = this._processCommandArray.findIndex(item => item.command === CCommand.Spin);
        if (processIndex === -1) return;

        const [process] = this._processCommandArray.splice(processIndex, 1);
        if (!process) return;

        clearTimeout(process.timeoutId);
        const spinAck = new SpinAck(ack);
        process.process(spinAck);
        if (spinAck.Result === CCommandStatus.Success) {
            this.insertHistory(spinAck);
        }

    }

    //Login process
    private async handleLogin(ack: ByteReaderHelper) {
        const processIndex = this._processCommandArray.findIndex(item => item.command === CCommand.Login);
        if (processIndex === -1) return;

        const process = this._processCommandArray.splice(processIndex, 1)[0];
        if (!process) return;

        clearTimeout(process.timeoutId);
        // Non-Slot games handle packets themselves
        if (this.gameType !== GameType.Slot) return;

        const gameMachineInfo = new GameMachineInfo(ack);
        if (gameMachineInfo.Result === CCommandStatus.Success) {
            // Notify cConnectManager Online
            this._cConnectManager.Online();
            this._playerInfo.name = gameMachineInfo.Nickname;
            await this.askPlayerHistory(gameMachineInfo.HistoryHeight);
        }
        else {
            this._cConnectManager.Disconnect(`${gameMachineInfo.Result}`);
        }

        process.process(gameMachineInfo);
    }

    //轉換ConnectManager 為上線狀態
    public TransConnectManagerToOnline() {
        this._cConnectManager?.Online();
    }

    public Update(dt: number) {
        this._cConnectManager?.Update();
    }

    /**
     * 初始化連線管理元件
     * @param gatewayList   分流清單
     */
    private async initCConnectManager(env: Environment) {
        if (this._cConnectManager != null) {
            //已經完成初始化
            return true;
        }

        //需要初始化連線元件
        try {
            if (env == Environment.Release) {
                //Release 版本只能看到 Error Log
                // CConnectLog.Instance.SetVisibleLevel( LogLevel.Error );
            }


            this._cConnectManager = new CConnectManager(
                //分流清單
                this.PlayerInfo.webConfig.CommonSetting.ConnectSetting,
                //分流 ServiceID
                MainServiceID,
                //存活時間
                this.PlayerInfo.webConfig.CommonSetting.LifeSecond,
                //最大重試次數
                MaxRetryCount,
                //重試間隔時間
                RetryIntervalSeconds);
            this._cConnectManager.FunErrorMsg = this.onCConnectError.bind(this);
            this._cConnectManager.FunDisconnectService = this.onCConnectDisConnect.bind(this);
            this._cConnectManager.FunRecv = this.onCConnectRecv.bind(this);
            return true;
        }
        catch (error) {
            cc.error("Login initCConnectManager Fail", error);

            return false;
        }

    }

    /**
     * 解析網址參數
     * @param url game Url
     * @returns true if parsing is successful, false otherwise
     */
    public ParserBaseConfig(url: string) {
        try {
            this._playerInfo.webConfigUrl = this.GetURLParameter(url, "webconfigurl");
            this._playerInfo.serviceId = this.GetURLParameter(url, "serviceid")
            this._playerInfo.game_code = this.GetURLParameter(url, "game_code");
            this._playerInfo.platform = this.GetURLParameter(url, "platform");
            this._playerInfo.awKey = this.GetURLParameter(url, "awkey");
            this._playerInfo.ParserSuccess = true;
        }
        catch (error) {
            cc.error("ParserBaseConfig Fail", error);
        }
    }

    /**
     * 
     * @param env AgentDefine.Environment
     * @param href Link Url
     * @returns 
     */
    public async Login(env: Environment, version: string, gameType: GameType = GameType.Slot): Promise<GameMachineInfo> {
        return new Promise<GameMachineInfo>(async (resolve, reject) => {
            try {
                this.gameType = gameType;
                if (this._cConnectManager == null) {
                    if (await this.initCConnectManager(env) == false) {
                        resolve(new GameMachineInfo(null));
                        return;
                    }
                }
                const DeviceCollection =
                {
                    BrowserType: cc.sys.browserType,
                    BrowserVersion: cc.sys.browserVersion,
                    Platform: cc.sys.platform,
                    Language: cc.sys.language,
                    Os: cc.sys.os,
                    OsVersion: cc.sys.osVersion,
                };

                CConnectLog.Instance.InfoLog(`Login awKey:${this._playerInfo.awKey} serviceId:${this._playerInfo.serviceId} version:${version}`);
                this._cConnectManager.Connect(this._playerInfo.awKey, Number(this._playerInfo.serviceId),
                    `v${this._playerInfo.platform}.${version}`, JSON.stringify(DeviceCollection));
                this.askCommand(CCommand.Login, resolve, reject);
            }
            catch (error) {
                reject(PARSER_URL_FAIL);
            }

        });
    }
    /**
     * 請求webConfigUrl
     * @returns 
     */
    public async AskWebConfig(configType: ConfigType): Promise<void> {
        try {
            const askUrl = this._playerInfo.webConfigUrl;
            const connectSetting: any = await this.Get(
                `${askUrl}?platform=${this._playerInfo.platform}&gamecode=${this._playerInfo.game_code}&rangetag=${configType}`);
            if (connectSetting == null) {
                throw Error(`Get webConfigUrl ${this._playerInfo.webConfigUrl} Fail`);
            }
            if (!this.parserWebConfig(connectSetting)) {
                throw Error(`parser webConfigUrl ${connectSetting} Fail`);
            }
        }
        catch (error) {
            console.error("AskWebConfig Fail", error);
            throw error;
        }
    }

    /**
     * Parser WebConfig data
     * @param connectSetting 
     * @returns 
     */
    private parserWebConfig(connectSetting: string): boolean {
        const response = JSON.parse(connectSetting) as IGameConfig;

        if (!response || !(response.Result == 0)) {
            return false;
        }
        response.CommonSetting = JSON.parse(atob(response.CommonSetting as unknown as string)) as ICommonSetting;
        response.GameSetting = JSON.parse(atob(response.GameSetting as unknown as string)) as IGameSetting;
        response.PlatformSetting = JSON.parse(atob(response.PlatformSetting as unknown as string)) as IPlatformSetting;
        this._playerInfo.webConfig = response;
        return true;
    }

    /**
     * 請求玩家的歷程資料
     * @returns 
     */
    private async askPlayerHistory(historyHeight: number = 0): Promise<void> {
        const urlList = this._playerInfo.webConfig.CommonSetting.ESAPIHistory_UrlList;
        if (!urlList || urlList.length === 0) {
            console.error("askPlayerHistory Fail, ESAPIHistoryURL is null");
            return;
        }
        if (historyHeight === 0) {
            //歷程高度為0，則不需要請求歷程
            return;
        }

        // 只取 HistoryHeightMax 筆資料
        const askBody = Array.from({ length: Math.min(historyHeight, HistoryHeightMax) }, (_, idx) => {
            const i = historyHeight - idx;
            return AskHistoryBodyFormat
                .replace("{平台}", this.PlayerInfo.platform)
                .replace("{暱稱}", this.PlayerInfo.name)
                .replace("{GameCode}", this._playerInfo.game_code)
                .replace("{歷程高度}", `${i}`);
        });

        const body = askBody.join('\r\n');
        return this.tryAskHistory(0, body);
    }

    /**
     * 嘗試請求歷程資料
     * @param retryCount retry 次數
     * @param body 
     */
    private async tryAskHistory(retryCount: number, body: string): Promise<void> {
        const urlList = this._playerInfo.webConfig.CommonSetting.ESAPIHistory_UrlList;
        const currentIndex = retryCount % urlList.length;
        try {
            const result = await this.Post<string>(urlList[currentIndex], body);
            if (!result || result === "") {
                throw AskHistoryFail;
            }
            if (HistoryErrorCode[result]) {
                throw HistoryErrorCode[result];
            }
            // 檢查回傳格式是否正確
            const parsed = JSON.parse(result) as historyHeightFormat[];
            if (!Array.isArray(parsed)) {
                throw new Error(`Invalid history format result ${result}`,);
            }
            this.parserHistoryHeight(parsed);
        }
        catch (error) {

            if (retryCount < AskHistoryRetryCount * urlList.length) {
                await this.tryAskHistory(retryCount + 1, body);
            }
            else {
                console.error(`AskHistory Fail, retry ${retryCount} times`, error);
                // 超過重試次數，記錄錯誤並斷線
                this._cConnectManager.Disconnect(`${error}`);
            }
        }
    }

    /**
     * Parser 歷程高度資料
     * @param historyHeight 
     */
    private parserHistoryHeight(historyHeight: historyHeightFormat[]) {
        if (!historyHeight || historyHeight.length === 0) {
            throw new Error("parserHistoryHeight Fail, historyHeight is null");
        }
        this._history = this.parserHistory(historyHeight.map(value => value.st))
            .sort((a, b) => b.Time - a.Time);
    }

    /**
     * 請求 Spin
     * @param bet 押注
     * @returns @SpinAck
     */
    public async Spin(bet: number, additionalPurchaseType: number | AdditionalPurchaseType = AdditionalPurchaseType.None): Promise<SpinAck> {
        return new Promise<SpinAck>((resolve, reject) => {
            if (this._cConnectManager == null) {
                console.error("Spin Fail _cConnectManager is null");
                resolve(new SpinAck(null));
                return;
            }

            const bt = new ByteWriterHelper();
            bt.WriteByte(CCommand.Spin);
            bt.WriteByte(additionalPurchaseType);
            bt.WriteBytes(ByteWriterHelper.ConvertToDoubleByte(bet));
            this._cConnectManager.MainSend(bt.Buffer);
            this.askCommand(CCommand.Spin, resolve, reject);

        });
    }

    /**
     * 購買特色
     * @param bet  
     * @param additionalPurchaseType 
     * @returns 
     */
    public BuyFeature(bet: number, additionalPurchaseType: AdditionalPurchaseType): Promise<SpinAck> {
        return this.Spin(bet, additionalPurchaseType);
    }

    //請求指令
    private askCommand(command: CCommand, resolve: any, reject: any): void {
        const timeoutProcess = () => {
            clearTimeout(timeoutId);
            const commandProcessIndex = this._processCommandArray.findIndex(item => item.command === command);
            const commandProcess = this._processCommandArray[commandProcessIndex];
            if (commandProcess && this._cConnectManager.IsWaitReconnect()) {
                // If the connection manager is reconnecting, reset the timeout
                commandProcess.timeoutId = setTimeout(timeoutProcess, REQUEST_TIMEOUT);
                return;
            }

            if (commandProcess && this._cConnectManager.IsDisconnect()) {
                // If the connection manager is disconnected, remove the command and reject
                this._processCommandArray.splice(commandProcessIndex, 1);
                reject(command === CCommand.Login ? LoginReDispatcherConnectFail : SpinReDispatcherConnectFail);
                return;
            }

            reject(REQUEST_TIMEOUT_ERROR_CODE);
        };

        const timeoutId = setTimeout(timeoutProcess, REQUEST_TIMEOUT);
        this._processCommandArray.push({ command, process: resolve, timeoutId });
    }

    public Get<T>(url: string, timeout: number = REQUEST_TIMEOUT): Promise<T> {
        return this.promiseTimeout(new Promise<T>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("get", url);
            xhr.timeout = timeout;
            xhr.onload = function () {
                if (this.status === 200) {
                    resolve(xhr.response);
                }
                else {
                    reject(xhr.response);
                }
            };
            xhr.ontimeout = () => {
                reject(REQUEST_TIMEOUT_ERROR_CODE);
            };
            xhr.send();

        }), REQUEST_TIMEOUT);
    }

    public Post<T>(url: string, data: Document | XMLHttpRequestBodyInit, timeout: number = REQUEST_TIMEOUT): Promise<T> {
        return this.promiseTimeout(new Promise<T>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("post", url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.timeout = timeout;
            xhr.onload = function () {
                if (this.status === 200) {
                    resolve(xhr.response);
                }
                else {
                    reject(xhr.response);
                }
            };
            xhr.ontimeout = () => {
                reject(REQUEST_TIMEOUT_ERROR_CODE);
            };
            xhr.send(data);

        }), timeout);
    }

    //timeout promise
    private promiseTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
        return Promise.race<T>([promise, new Promise((_, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject(REQUEST_TIMEOUT_ERROR_CODE);
            }, timeout);
        })]);
    }

    //斷線處理
    public Disconnect(msg: string) {
        if (this._cConnectManager == null) {
            //如果連線元件為空，則直接通知斷線
            this._observer.Notify(NetEvent.Disconnected, msg);
            return;
        }
        this._cConnectManager.Disconnect(msg);
    }

    //取得網址參數
    public GetURLParameter(Url: string, searchElement: string) {
        let firstParameters = Url.split(("?"));
        let parameters = firstParameters.pop().split("&");
        for (let index = 0; index < parameters.length; index++) {
            const pair = parameters[index].split("=");

            if (pair.shift() === searchElement) {
                return pair.shift();
            }
        }
        throw Error(`GetURLParameter ${Url} not ${searchElement}`);
    }

    public RegisterObserver(listener: NetListener): void {
        this._observer.Register(listener);
    }

    public RemoveObserver(name: string): void {
        this._observer.Remove(name);
    }

    //註冊自訂義接收指令
    public RegisterCustomCommand(handleCustomCommand: (ack: ByteReaderHelper) => void) {
        this.handleCustomCommand = handleCustomCommand;
    }

    //發送自訂義指令
    public SendCustomCommand(data: Uint8Array) {
        this._cConnectManager.MainSend(data);
    }

    //取得所有的歷程資料
    public get CurrentHistoryData(): IHistory[] {
        return this._history;
    }


    // Parser歷程資料
    private parserHistory(history: string[]): IHistory[] {
        return history.map((item) => {
            const value = typeof item === "string" ? JSON.parse(item) : item;
            let timeStr = value["T"];
            if (!this.isISO8601TimeFormat(timeStr)) {
                timeStr = this.transformISO8601TimeFormat(timeStr);
            }
            const timestamp = new Date(timeStr).getTime();

            return {
                Bet: Number(value["Bet"]),
                Win: Number(value["Win"]),
                Time: timestamp,
                異動前: Number(value["異動前"]),
                異動後: Number(value["異動後"]),
                盤面演繹: value["盤面演繹"],
                遊戲館: value["遊戲館"],
                編號: value["編號"],
                暱稱: value["暱稱"],
                加購: Number(value["加購"]),
                扣幣倍: Number(value["扣幣倍"]),
            };
        });
    }

    //寫入歷程資料
    public insertHistory(spinAck: SpinAck) {
        if (spinAck.Result != CCommandStatus.Success) {
            return;
        }
        const history: IHistory = this.TransformHistoryData(spinAck);
        this._history.unshift(history);
        // 保持歷程最大數量，移除最舊的一筆
        if (this._history.length > HistoryHeightMax) {
            this._history.length = HistoryHeightMax;
        }

    }

    //轉換 historyData
    public TransformHistoryData(spinAck: SpinAck): IHistory {
        const date = new Date(spinAck.Time);
        const timestamp = Math.floor(date.getTime());
        const history: IHistory = {
            Bet: spinAck.AdditionalPurchase > spinAck.BaseBet ? spinAck.AdditionalPurchase : spinAck.BaseBet,
            Win: spinAck.Win,
            Time: Number(timestamp),
            異動前: spinAck.Balance - spinAck.Win + spinAck.AdditionalPurchase,
            異動後: spinAck.Balance,
            盤面演繹: spinAck.Plant,
            遊戲館: this._playerInfo.game_code,
            編號: spinAck.SerialId.toString(),
            暱稱: this._playerInfo.name,
            加購: spinAck.AdditionalPurchase,
            扣幣倍: parseFloat((spinAck.AdditionalPurchase / spinAck.BaseBet).toFixed(2)),
        }
        return history;
    }
    //檢查是否為標準的 ISO8601 時間格式
    private isISO8601TimeFormat(timeString: string): boolean {
        const iso8601Regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{1,7})([+-]\d{2}:\d{2})$/;
        return iso8601Regex.test(timeString);
    }

    //轉換時間的格式為標準的 ISO8601 時間格式
    private transformISO8601TimeFormat(timeString: string): string {
        const date = new Date(timeString);

        // 取得年、月、日、時、分、秒、毫秒
        const year = date.getFullYear();
        const month = this.padStartAlternative(String(date.getMonth() + 1), 2, '0');
        const day = this.padStartAlternative(String(date.getDate()), 2, '0');
        const hours = this.padStartAlternative(String(date.getHours()), 2, '0');
        const minutes = this.padStartAlternative(String(date.getMinutes()), 2, '0');
        const seconds = this.padStartAlternative(String(date.getSeconds()), 2, '0');
        const milliseconds = this.padStartAlternative(String(date.getMilliseconds()), 3, '0');

        // 取得時區偏移（以分鐘為單位），並格式化為 +08:00 形式
        const timezoneOffset = -date.getTimezoneOffset();
        const timezoneHours = this.padStartAlternative(String(Math.floor(timezoneOffset / 60)), 2, '0');
        const timezoneMinutes = this.padStartAlternative(String(Math.abs(timezoneOffset % 60)), 2, '0');
        const timezoneSign = timezoneOffset >= 0 ? '+' : '-';

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneSign}${timezoneHours}:${timezoneMinutes}`;
    }

    //取代字串功能
    private padStartAlternative = (input: string, targetLength: number, padString: string): string => {
        while (input.length < targetLength) {
            input = padString + input;
        }
        return input;
    };

    public GetConnectManagerState(): number {
        return this._cConnectManager?.getState() || -1;
    }
}