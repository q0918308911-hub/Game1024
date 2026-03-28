import { AsyncScope } from "../AsyncScope/AsyncScope";
import { GameUtilsTools } from "../GameUtilsTool";

const DEBUG_TITLE = 'FlowAbortManager';

export interface IFlowStatus {
    signalKey: string;//--該流程的AbortSignal名稱
    started: boolean;
    aborted: boolean;
    finished: boolean;
}



/**
 * 管理多個流程 (Flow) 的中止 / 階段狀態
 * 每個流程有獨立的 AbortSignal，並支援階段追蹤
 */
export class FlowAbortManager {

    private _async: AsyncScope;
    //多流程 AbortSignal 集中管理
    private _abortFlowMap: Map<string, AbortSignal> = new Map();
    /**
     * 流程狀態追蹤
     * string->該大項流程的名稱
     * IFlowStatus->該流程的狀態
     */
    private _flowStatus: Map<string, Map<string, IFlowStatus>> = new Map();
    //流程內階段追蹤
    //private _stageStatusMap: Map<string, { started: boolean; finished: boolean; aborted: boolean }> = new Map();
    //private _onFlowAbortCallback: (key: string) => void;

    private static _instance: FlowAbortManager | null = null;
    public static getInstance(): FlowAbortManager {
        return (FlowAbortManager._instance) ? FlowAbortManager._instance : new FlowAbortManager(
            AsyncScope.getInstance()
        );
    };

    /*
    set async(asyncInstance: AsyncScope) {
        this._async = asyncInstance;
    }*/

    constructor(asyncInstance: AsyncScope) {

        if (FlowAbortManager._instance != null) {
            throw new Error('plz use getInstance() to get FlowAbortManager');
        }
        FlowAbortManager._instance = this;
        this._async = asyncInstance;
        //this._onFlowAbortCallback = onAbort ?? ((k) => GameUtilsTools.debugLog(DEBUG_TITLE, `Flow [${k}] Aborted`));
    }

    // 建立新的流程 Abort 範圍 
    public createFlowScope(flowKey: string, onAbort?: (key: string) => void): AbortSignal {

        if (this._abortFlowMap.has(flowKey)) {
            this._async.abortAll(flowKey);
            this._abortFlowMap.delete(flowKey);
        }
        const signal = this._async.createAbortScope(flowKey, onAbort);
        this._abortFlowMap.set(flowKey, signal);
        return signal;
    }

    public getFlowAbortSignal(flowKey: string): AbortSignal | null {
        return this._abortFlowMap.get(flowKey) || null;
    }

    public removeAbortSignal(flowKey: string): void {
        this._async.abortAll(flowKey);
        this._abortFlowMap.delete(flowKey);
    }

    /**
     * 註冊流程階段 (可選)-直接一口氣註冊該流程(flowStatus)的裡面的(stages--主執行階段的細碎流程成員)
     * @param flowKey 大向流程
     * @param processList 細向流程
     */
    public registerFlowStatus(flowKey: string, processList: string[], signalKey: string): void {

        if (!this._flowStatus.has(flowKey)) {
            // 內層 Map (Map<string, IFlowStatus>)
            this._flowStatus.set(flowKey, new Map());
        }
        const stageMap = this._flowStatus.get(flowKey);
        for (const info of processList) {
            if (!stageMap.has(info)) {
                stageMap.set(info, {
                    signalKey: signalKey,//--該流程的AbortSignal名稱
                    started: false,
                    finished: false,
                    aborted: false
                });
            }
        }
        GameUtilsTools.debugLog(DEBUG_TITLE, `[registerFlowStatus]`, this._flowStatus);
    }

    /**
     * 設定流程的 AbortSignal 鍵
     * @param flowKey 流程的唯一識key
     * @param signalKey abortSignal 的key
     */
    public setFlowAbortSignalKey(flowKey: string, signalKey: string): void {

        const flowMap = this._flowStatus.get(flowKey);
        if (flowMap) {
            for (const [_, s] of flowMap.entries()) {
                s.signalKey = signalKey;
            }
        }
    }

    // =======================================================
    // 階段追蹤 (Stage Tracking)
    // =======================================================
    public markProcessStart(currentFlowKey: string, processKey: string): void {

        const flowMap = this._flowStatus.get(currentFlowKey);
        if (flowMap) {
            const s = flowMap.get(processKey);
            if (s) s.started = true;
        } else {
            flowMap.set(processKey, { signalKey: '', started: true, finished: false, aborted: false });
        }
    }

    public markProcessFinish(currentFlowKey: string, processKey: string): void {

        const flowMap = this._flowStatus.get(currentFlowKey);
        if (flowMap) {
            const s = flowMap.get(processKey);
            if (s) s.finished = true;
        } else {
            flowMap.set(processKey, { signalKey: '', started: true, finished: true, aborted: false });
        }
    }

    public markProcessAbort(currentFlowKey: string, processKey: string): void {

        const flowMap = this._flowStatus.get(currentFlowKey);
        if (flowMap) {
            const s = flowMap.get(processKey);
            if (s) s.aborted = true;
        } else {
            flowMap.set(processKey, { signalKey: '', started: true, finished: false, aborted: true });
        }
    }

    // 找出第一個未完成的階段
    public findFirstUnfinishedProcess(flowKey: string): string | null {

        const flowMap = this._flowStatus.get(flowKey);
        if (!flowMap) return null;
        for (const [key, s] of flowMap.entries()) {
            if (s.started && !s.finished) return key;
        }
        return null;
    }

    // 查詢目前所有階段狀態
    public getAllFlowStatus(): Map<string, Map<string, IFlowStatus>> {

        const copiedFlowStatus = new Map<string, Map<string, IFlowStatus>>();
        for (const [flowKey, innerMap] of this._flowStatus.entries()) {
            const copiedInnerMap = new Map<string, IFlowStatus>();
            for (const [processKey, status] of innerMap.entries()) {
                //--deep clone
                const copiedStatus: IFlowStatus = { ...status };
                copiedInnerMap.set(processKey, copiedStatus);
            }
            copiedFlowStatus.set(flowKey, copiedInnerMap);
        }
        return copiedFlowStatus;
    }

    /**
     * 移除指定流程的狀態
     * @param flowKey 流程的唯一識別鍵
     * @returns 是否成功移除(false表示沒有此流程)
     */
    public removeFlowStatus(flowKey: string): boolean {
        return this._flowStatus.delete(flowKey);
    }

    // 清除所有紀錄
    public reset(): void {

        this._abortFlowMap.clear();
        this._flowStatus.clear();

    }
}
