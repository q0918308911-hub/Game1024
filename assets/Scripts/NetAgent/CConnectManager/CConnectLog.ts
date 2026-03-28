export enum LogLevel {
    Error = 0,
    Warning,
    Info,
    Debug,
}
export class CConnectLog {
    private _visibleLevel: LogLevel = LogLevel.Debug;
    private static _sInstance: CConnectLog;
    public static get Instance(): CConnectLog {
        if (!CConnectLog._sInstance) {
            CConnectLog._sInstance = new CConnectLog();
        }
        return CConnectLog._sInstance;
    }

    public SetVisibleLevel(level: LogLevel) {
        this._visibleLevel = level;
    }

    public DebugLog(...data: any[]) {
        if (this._visibleLevel < LogLevel.Debug) { return; }
        const logArray = data;
        console.log(`[Debug] ${new Date().toLocaleTimeString()}`, ...logArray);
    }

    public InfoLog(...data: any[]) {
        if (this._visibleLevel < LogLevel.Info) { return; }
        const logArray = data;
        console.log(`[Info] ${new Date().toLocaleTimeString()}`, ...logArray);
    }

    public WarningLog(...data: any[]) {
        if (this._visibleLevel < LogLevel.Warning) { return; }
        const logArray = data;
        console.warn(`[Warning] ${new Date().toLocaleTimeString()}`, ...logArray);
    }

    public ErrorLog(...data: any[]) {
        if (this._visibleLevel < LogLevel.Error) { return; }
        const logArray = data;
        console.error(`[Error] ${new Date().toLocaleTimeString()}`, ...logArray);
    }

}