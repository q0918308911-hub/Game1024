import { _decorator, CCFloat, game, } from 'cc';
import { ReelViewExample } from './ReelViewExample';
import { RunTimeData } from './DataSetting/RunTimeData';
import { ReelSettingData } from './DataSetting/ReelSettingData';
import { ScoreViewExample } from './ScoreViewExample';
import { UniSlotMachine } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('SlotMachineExample')
export class SlotMachineExample extends UniSlotMachine<ReelViewExample> {
    @property(ScoreViewExample)
    private scoreView: ScoreViewExample = null;

    private inStandByAnim: boolean = false;
    private countTimeResolve: Function = null;

    private reelData: ReelSettingData = null;

    public init(): void {
        super.init();
        this.reelData = RunTimeData.instance.reelData;
    }

    private update(deltaTime: number): void {
        if (this.reelData) {
            this._normalRollTime = this.reelData.normalRollTime;
            this._fastRollTime = this.reelData.turboRollTime;
        }
    }

    public setReadyHandList(readyHandReelIDList: number[]): void {
        this._reelView.setReadyHandList(readyHandReelIDList);
    }

    public showScore(finalScore: number): Promise<void> {
        return this.scoreView.showScore(finalScore);
    }

    public async playIconWin(winIconPos: number[][]): Promise<void> {
        await this._reelView.playIconWin(winIconPos);
    }

    public async playStandByAnim(winIconPos2D: number[][], symbolOdds: number[]): Promise<void> {
        this.inStandByAnim = true;

        for (let index = 0; index < winIconPos2D.length; index++) {
            if (!this.inStandByAnim) {
                break;
            }

            const line = winIconPos2D[index];

            this._reelView.playStandbyIconWin(line);

            if (RunTimeData.instance.processData.readyHandAnimAndRunScore) {
                this.scoreView.showScore(symbolOdds[index]);
            }
            await this.delay(RunTimeData.instance.processData.standbySpaceTime);

            if (index === winIconPos2D.length - 1) {
                index = -1;
            }
        }
    }

    protected delay(time: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this.countTimeResolve = resolve;
            this.scheduleOnce(() => {
                resolve();
            }, time);
        });
    }

    protected override reset(): void {
        super.reset();
        this.inStandByAnim = false;
        this._reelView.stopPlayWin();
        this.scoreView.hideScore();
        this.countTimeResolve?.();
    }
}