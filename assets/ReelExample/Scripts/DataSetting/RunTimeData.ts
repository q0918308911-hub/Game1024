import { _decorator, Button, CCBoolean, Component, Enum, Label, } from 'cc';
import { ReelSettingData } from './ReelSettingData';
import { ProcessSettingData } from './ProcessSettingData';
import { ControllerSettingData, GameModeExample } from './ControllerSettingData';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('RunTimeData')
@executeInEditMode()
export class RunTimeData extends Component {
    @property(ReelSettingData)
    public reelData: ReelSettingData = null;

    @property(ProcessSettingData)
    public processData: ProcessSettingData = null;

    @property(ControllerSettingData)
    public controllerData: ControllerSettingData = null;

    private static _instance: RunTimeData = null;

    private reelAmount: number = 0;

    public static get instance(): RunTimeData {
        if (RunTimeData._instance === null) {
            return new RunTimeData();
        }

        return RunTimeData._instance;
    }

    protected onLoad(): void {
        if (RunTimeData._instance === null) {
            RunTimeData._instance = this;
        }
    }

    public addLayoutChangeListener(listener: (isLayout: boolean) => void): void {
        this.controllerData.onIsLayoutChange = listener;
    }

    public getMoveInterval(): number {
        return this.controllerData.gameMode === GameModeExample.NG ? this.reelData.ngMoveInterval : this.reelData.fgMoveInterval;
    }

    public getReelSpaceDataLength(): number {
        return this.controllerData.gameMode === GameModeExample.NG ? this.reelData.ngStopDataLength : this.reelData.fgStopDataLength;
    }

    private update(): void {
        if (this.reelData && this.reelAmount !== this.reelData.reelAmount) {
            this.reelAmount = this.reelData.reelAmount;

            this.controllerData.rollingReelIDs.length = 0;

            for (let index = 0; index < this.reelAmount; index++) {
                this.controllerData.rollingReelIDs.push(index);
            }

            console.warn("滾輪數量調整，ControllerSettingData的滾輪順序已重置");
        }
    }

    protected onDestroy(): void {
        RunTimeData._instance = null;
    }
}


