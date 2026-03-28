import { _decorator, Component, Label, Node, Tween, tween, v3 } from 'cc';
import { RunTimeData } from './DataSetting/RunTimeData';
import { ProcessSettingData } from './DataSetting/ProcessSettingData';
const { ccclass, property } = _decorator;

@ccclass('ScoreViewExample')
export class ScoreViewExample extends Component {
    @property(Label)
    private normalScoreLabel: Label = null;

    private processData: ProcessSettingData = null;

    public async showScore(finalScore: number): Promise<void> {
        return new Promise((resolve) => {
            this.normalScoreLabel.string = "";
            this.processData = RunTimeData.instance.processData;
            let scoreObj = { score: 0 };

            let needRunScore = this.processData.needRunScore;
            let runScoreTime = needRunScore ? this.processData.runScoreTime : 0;

            if (needRunScore) {
                tween(scoreObj)
                    .to(this.processData.runScoreTime, { score: finalScore }, {
                        onUpdate: (v) => {
                            this.normalScoreLabel.string = Math.floor(scoreObj.score.fixed()).numberComma();
                        }
                    })
                    .start();
            }
            else {
                this.normalScoreLabel.string = finalScore.fixed().numberComma();
            }

            tween(this.normalScoreLabel.node)
                .set({ active: true })
                .set({ scale: v3(0, 0, 0) })
                .to(this.processData.showScoreTime, { scale: v3(1, 1, 1) }, { easing: "smooth" })
                .delay(runScoreTime)
                .delay(this.processData.scoreShowTime)
                .to(this.processData.hideScoreTime, { scale: v3(0, 0, 0) })
                .call(() => {
                    this.normalScoreLabel.node.active = false;
                    resolve();
                })
                .start();
        })
    }

    public hideScore(): void {
        this.normalScoreLabel.node.active = false;
        Tween.stopAllByTarget(this.normalScoreLabel.node);
    }
}


