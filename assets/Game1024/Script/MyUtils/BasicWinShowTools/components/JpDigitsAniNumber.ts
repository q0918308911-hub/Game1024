import { _decorator, CCFloat, Component, Label, Node, Tween, tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('JpDigitsAniNumber')
export class JpDigitsAniNumber extends Component {

    //@property({ type: CCFloat, visible: true, displayName: '數字表演持續時間', tooltip: 'JP數字顯示' })
    protected _duration: number = 0.5;
    protected _resolvePromise: ((value: boolean) => void) | undefined; // promise resolve 函式
    protected _targetLabel: Label = null;
    protected _tweenAction: Tween<any>;
    protected _totalWinScore: number = 0;

    set duration(value: number) {
        this._duration = value;
    }

    get duration(): number {
        return this._duration;
    }

    get totalWinScore(): number {
        return this._totalWinScore;
    }

    public setLabelNode(label: Label): void {
        if (label) this._targetLabel = label;
    }

    public showJpDigitsAniNumber(value: number): Promise<boolean> {

        this.node.active = true;
        this._totalWinScore = value;
        this.clearData();

        return new Promise((resolve, reject) => {
            this._resolvePromise = resolve;
            const updateTarget = { value: 0 };
            this._tweenAction = tween(updateTarget)
                .to(this._duration, { value: value }, {
                    onUpdate: (v, ratio) => {
                        this.updateLabelValue(Math.floor(value * ratio));
                    },
                    onComplete: () => {
                        //this.updateLabelValue(value);
                        if (this._resolvePromise) {
                            this._resolvePromise(false);
                            this._resolvePromise = undefined;
                        }
                        this._tweenAction = null;
                    }
                })
                .start();
        });

    }

    /**
     * 會阻斷原先的跑分動畫,直接顯示最終值
     * PS:promise resolve 會直接忽略吞掉!
     */
    public async showFinishWinScore(): Promise<void> {

        if (this._tweenAction) {
            this._tweenAction.stop();
            this._tweenAction = null;
            this.updateLabelValue(this._totalWinScore);
            this._resolvePromise = undefined;//-promise resolve 會直接忽略吞掉!
        }
    }

    public clearData(): void {

        if (this._tweenAction) {
            this._tweenAction.stop();
            this._tweenAction = null;

        }

        if (this._resolvePromise) {
            this._resolvePromise(false); // 可視需求給 true/false
            this._resolvePromise = undefined;
        }
    }


    public stopJpDigitsAniNumber(): void {
        this.clearData();
        this._totalWinScore = 0;
        this.node.active = false;
    }

    protected updateLabelValue(value: number): void {
        this._targetLabel.string = value.numberComma();
    }

}


