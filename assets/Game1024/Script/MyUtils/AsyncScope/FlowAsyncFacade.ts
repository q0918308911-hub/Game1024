import { FlowTrackerManager } from "./FlowTrackerManager";
import { AsyncScope } from "../AsyncScope/AsyncScope";
import { FlowTracker } from "./FlowTracker/FlowTracker";

export class FlowAsyncFacade {

    private _flowTrackerManager: FlowTrackerManager;
    private _asyncManager: AsyncScope;
    private static _instance: FlowAsyncFacade | null = null;

    public static getInstance(): FlowAsyncFacade {
        return (FlowAsyncFacade._instance) ? FlowAsyncFacade._instance : new FlowAsyncFacade();
    }

    constructor() {

        if (FlowAsyncFacade._instance != null) {
            throw new Error('plz use getInstance() to get FlowAsyncFacade');
        }
        FlowAsyncFacade._instance = this;
        this._flowTrackerManager = FlowTrackerManager.getInstance();
        this._asyncManager = AsyncScope.getInstance();
    }
    //============================= Async Scope Methods ============================//
    /**
     * <核心方法>
     * 每個流程(Flow)建立獨立的 AbortSignal 範圍
     * 在阻斷時會中止該流程下的所有非同步操作,並標記該流程為中止狀態
     * 在callback 啟動時,會傳入該流程的 abortSignalKey 以供辨識,
     * 可透過abortSignalKey 取得對應的 FlowTracker 記錄流程狀態,即可辨識該流程目前執行到哪個階段
     * 同時也會觸發 FlowTracker 的 abortFlow 方法來標記該流程為中止狀態??
     * 
     * @param abortSignalKey 
     * @param onAbort callback
     * @returns 
     */
    public createAbortScope(abortSignalKey: string, onAbort?: (key: string) => void): AbortSignal {
        return this._asyncManager.createAbortScope(abortSignalKey, onAbort);
    }

    public getAbortController(abortSignalKey: string): AbortController | null {
        return this._asyncManager.getAbortController(abortSignalKey);
    }

    public getAbortKey(abortSignal: AbortSignal): string | null {
        return this._asyncManager.getAbortKey(abortSignal);
    }

    //=============================組合方法============================//
    public createTrackerAndAbortScope(abortSignalKey: string, onAbort?: (key: string) => void): AbortSignal {
        this.createFlowTracker(abortSignalKey);
        return this._asyncManager.createAbortScope(abortSignalKey, onAbort);
    }

    /**
     * <<為原始 promise 設置超時機制>>
     * @param ogPromise Original Promise
     * @param seconds 
     * @param meta  附加在 Error 物件上的資訊
     * @param label 變更辨識標籤，會附加在 Error 物件上
     * @param resolveOnTimeout 超時是否強制 resolve(false=reject, true=resolve)
     * @param timeoutValue 超時要回傳的值(當 resolveOnTimeout=true 時有效)
     * @param signal 對應 AbortController.signal
     * @param abortKey 對應 AbortController map 的 key
     * @param flowKey flow tracker 的流程名稱 
     */
    public processWithTimeout<T, M>(ogPromise: Promise<T>,//--原始 Promise
        seconds: number,//--race 時間
        meta?: M,//--附加資訊
        label = 'timeout',
        resolveOnTimeout = false,//--false=timeout 時回傳 error reject, true=timeout 還是走resolve
        timeoutValue?: T,//--你需要的辨識資訊(除錯用)
        signal?: AbortSignal,//--新增：對應 AbortController.signal
        abortKey?: string,
        flowKey?: string
    ): Promise<{ status: 'ok' | 'timeout' | 'error', value?: T, err?: any, meta?: M, label: string }> {

        if (flowKey && abortKey) {
            this.abortFlow(abortKey, flowKey);
        }
        return this._asyncManager.withTimeout<T, M>(ogPromise, seconds, meta, label, resolveOnTimeout, timeoutValue, signal, abortKey);
    }

    //--阻斷流程
    //--TO DO:在callback 時,除了回傳 abortSignalKey，可能需要加上回傳透過該 key 取得的 flowKey 列表
    public abortScopeAndFlow(abortSignalKey: string, flowKey: string): void {

        this._asyncManager.abortAll(abortSignalKey);//--會呼叫callback
        this._flowTrackerManager.abortFlow(abortSignalKey, flowKey);//--標記該流程為中止狀態
    }

    public resetScopeAndFlow(): void {

        this._asyncManager.reset();
        this._flowTrackerManager.reset();
    }


    //============================= Flow Tracker Methods ============================//


    public createFlowTracker(abortSignalKey: string): void {
        this._flowTrackerManager.createFlowTracker(abortSignalKey);
    }

    public startFlow(abortSignalKey: string, flowKey: string): void {
        this._flowTrackerManager.startFlow(abortSignalKey, flowKey);
    }

    public recordStep(abortSignalKey: string, flowKey: string, stepKey: string): void {
        this._flowTrackerManager.recordStep(abortSignalKey, flowKey, stepKey);
    }

    //--該方法會delete整個flow tracker資料--//
    public endFlow(abortSignalKey: string, flowKey: string): void {
        this._flowTrackerManager.endFlow(abortSignalKey, flowKey);
    }

    //--僅停止目前的flow tracker--
    public stopFlow(abortSignalKey: string, flowKey: string): void {
        this._flowTrackerManager.stopFlow(abortSignalKey, flowKey);
    }

    public getTrackerProgress(abortSignalKey: string, flowKey: string) {
        return this._flowTrackerManager.getProgress(abortSignalKey, flowKey);
    }

    public abortFlow(abortSignalKey: string, flowKey: string): void {
        this._flowTrackerManager.abortFlow(abortSignalKey, flowKey);
    }

}