import { FlowTracker } from "./FlowTracker/FlowTracker";
import { IFlowTrackerInfo } from "./FlowTracker/IFlowTrackerInfo";

/**
 * FlowTrackerManager 用於管理多個 FlowTracker 實例，每個實例對應一個獨立的異步操作流程。
 * 用decorator 來修飾需要追蹤的非同步方法
 * TIPS:這裡只是單純的管理流程追蹤器,不會去管理AbortSignal的生命週期 
 * 外面在封裝一層facade 來管理AbortSignal的生命週期
 * https://juejin.cn/post/7366441097583984680
 * https://juejin.cn/post/7202812701440589881
 * https://oldmo860617.medium.com/%E5%8D%81%E5%88%86%E9%90%98%E5%B8%B6%E4%BD%A0%E4%BA%86%E8%A7%A3-typescript-decorator-48c2ae9e246d
 * 
 * 
 * 
 */
export class FlowTrackerManager {

    private _flowTrackerMap: Map<string, Map<string, FlowTracker>> = new Map();
    private static _instance: FlowTrackerManager | null = null;

    public static getInstance(): FlowTrackerManager {
        return (FlowTrackerManager._instance) ? FlowTrackerManager._instance : new FlowTrackerManager();
    }

    constructor() {

        if (FlowTrackerManager._instance != null) {
            throw new Error('plz use getInstance() to get FlowTrackerManager');
        }
        FlowTrackerManager._instance = this;
    }

    public createFlowTracker(abortSignalKey: string): void {
        if (this._flowTrackerMap.has(abortSignalKey)) {
            console.warn(`FlowTrackerManager: FlowTracker with key [${abortSignalKey}] already exists. Overwriting.`);
        }
        this._flowTrackerMap.set(abortSignalKey, new Map<string, FlowTracker>());
    }

    public reset(): void {
        this._flowTrackerMap.clear();
    }
    /**
     * 
     * @param abortSignalKey 
     * @param flowKey 流程名稱(外部呼叫的方法名稱)
     */
    public startFlow(abortSignalKey: string, flowKey: string): void {

        const trackerMap = this._flowTrackerMap.get(abortSignalKey);
        if (!trackerMap) {
            throw new Error(`FlowTrackerManager: No FlowTracker found for key [${abortSignalKey}]. Please create one first.`);
        }
        const tracker = new FlowTracker();
        tracker.startFlow(flowKey);
        trackerMap.set(flowKey, tracker);
    }

    public recordStep(abortSignalKey: string, flowKey: string, stepKey: string): void {
        const tracker = this.getCurrentTracker(abortSignalKey, flowKey);
        if (tracker) {
            tracker.recordStep(stepKey);
        }
    }

    /**
     * 終止整個流程(呼叫的方法)
     * TIPS:結束後會刪除目前的tracker資料
     * @param abortSignalKey 
     * @param flowKey 
     * @returns 
     */
    public endFlow(abortSignalKey: string, flowKey: string): void {

        const trackerMap = this._flowTrackerMap.get(abortSignalKey);
        if (!trackerMap) {
            throw new Error(`FlowTrackerManager: No FlowTracker found for key [${abortSignalKey}]. Please create one first.`);
        }
        if (!trackerMap.has(flowKey)) {
            console.warn(`FlowTrackerManager: No FlowTracker for flow [${flowKey}] under key [${abortSignalKey}]. Cannot end flow.`);
            return;
        } else {
            const tracker = trackerMap.get(flowKey);
            tracker.endFlow();
            trackerMap.delete(flowKey);
        }
    }

    /**
     * 中止目前的流程(呼叫的方法)
     * 有被標註的狀態下,直接透過asyncScop去阻斷後續的步驟
     * @param abortSignalKey 
     * @param flowKey 
     * @returns 
     */
    public abortFlow(abortSignalKey: string, flowKey: string): void {

        const tracker = this.getCurrentTracker(abortSignalKey, flowKey);
        if (tracker) {
            tracker.abortFlow();
        }
    }

    /**
     * 紀錄阻斷但不刪除資料
     * @param abortSignalKey 
     * @param flowKey 
     */
    public stopFlow(abortSignalKey: string, flowKey: string): void {

        const tracker = this.getCurrentTracker(abortSignalKey, flowKey);
        if (tracker) {
            tracker.stopFlow();
        }
    }

    /**
     * 有被呼叫的才會被記錄進去,可以透過記錄到哪個方法來知道目前的進度
     * @param abortSignalKey 
     * @param flowKey 
     * @returns 
     */
    public getProgress(abortSignalKey: string, flowKey: string): IFlowTrackerInfo | null {

        const tracker = this.getCurrentTracker(abortSignalKey, flowKey);
        if (tracker) {
            return tracker.getProgress();
        }
        return null;
    }

    protected getCurrentTracker(abortSignalKey: string, flowKey: string): FlowTracker | null {

        const trackerMap = this._flowTrackerMap.get(abortSignalKey);
        if (!trackerMap || trackerMap.size === 0) {
            console.warn(`FlowTrackerManager: No active FlowTracker for key [${abortSignalKey}]. Cannot record step.`);
            return null;
        }
        if (!trackerMap.has(flowKey)) {
            console.warn(`FlowTrackerManager: No FlowTracker for flow [${flowKey}] under key [${abortSignalKey}]. Cannot record step.`);
            return null;
        } else {
            return trackerMap.get(flowKey);
        }
    }

}