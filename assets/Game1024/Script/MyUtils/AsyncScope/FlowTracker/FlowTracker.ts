import { IFlowTrackerInfo } from "./IFlowTrackerInfo";
export class FlowTracker {

    private _activeFlow: string;
    private _steps: string[] = [];
    private _isAborted: boolean = false;

    public startFlow(flowKey: string): void {
        this._activeFlow = flowKey;
        this._steps = [];
        this._isAborted = false;
    }

    public recordStep(stepKey: string): void {
        if (this._isAborted) return;
        this._steps.push(stepKey);
    }

    public endFlow(): void {
        this._activeFlow = null;
        this._steps = [];
        this._isAborted = false;
    }

    public stopFlow(): void {
        this._activeFlow = null;
        this._isAborted = false;
    }

    public abortFlow(): void {
        this._isAborted = true;
    }

    public getProgress(): IFlowTrackerInfo {
        const progress: IFlowTrackerInfo = {
            activeFlow: this._activeFlow,
            steps: this._steps,
            isAborted: this._isAborted
        };

        return progress;
    }

}