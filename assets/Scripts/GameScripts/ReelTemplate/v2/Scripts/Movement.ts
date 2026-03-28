import { _decorator, Component, game, Node, Tween, tween, TweenEasing, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Movement')
export class Movement extends Component {
    private _isPlaying: boolean = false;
    private _currentTween: Tween<Node> | null = null;
    private _onStepUpdateCallback: (() => void) | null = null;

    public setStepUpdateCallback(callback: () => void): this {
        this._onStepUpdateCallback = callback;
        return this;
    }

    public moveTo(dest: Vec3, duration: number, isLocal: boolean = true, ease: TweenEasing | ((k: number) => number) = 'linear'): this {
        if (duration < 0) return this;

        let newDuration = this.calculateDuration(duration);
        const targetPos = dest.clone();
        if (isLocal) {
            this.append(tween(this.node)
                .to(newDuration, { position: targetPos }, { easing: ease, onUpdate: this?._onStepUpdateCallback }));
        } else {
            this.append(tween(this.node)
                .to(newDuration, { worldPosition: targetPos }, { easing: ease, onUpdate: this?._onStepUpdateCallback }));
        }
        return this;
    }

    public moveBy(delta: Vec3, duration: number, isLocal: boolean = true, ease: TweenEasing | ((k: number) => number) = 'linear'): this {
        if (duration < 0) return this;

        let newDuration = this.calculateDuration(duration);
        const targetPos = delta;
        if (isLocal) {
            this.append(tween(this.node)
                .by(newDuration, { position: targetPos }, { easing: ease, onUpdate: this?._onStepUpdateCallback }));
        } else {
            this.append(tween(this.node)
                .by(newDuration, { worldPosition: targetPos }, { easing: ease, onUpdate: this?._onStepUpdateCallback }));
        }

        return this;
    }

    public moveFrom(from: Vec3, dest: Vec3, duration: number, isLocal: boolean = true, ease: TweenEasing | ((k: number) => number) = 'linear'): this {
        if (duration < 0) return this;

        let newDuration = this.calculateDuration(duration);
        const fromPos = from.clone();
        const targetPos = dest.clone();
        if (isLocal) {
            this.append(tween(this.node)
                .set({ position: fromPos })
                .to(newDuration, { position: targetPos }, { easing: ease, onUpdate: this?._onStepUpdateCallback })
            );
        } else {
            this.append(tween(this.node)
                .call(() => this.node.worldPosition = fromPos)
                .to(newDuration, { worldPosition: targetPos }, { easing: ease, onUpdate: this?._onStepUpdateCallback })

            );
        }

        return this;
    }

    public addCallback(callback: Function): this {
        this.append(tween(this.node).call(() => { callback(); }));
        return this;
    }

    public stop() {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
    }

    public isPlaying(): boolean {
        return this._isPlaying;
    }

    public play(finishCallback: Function = null) {
        if (this._currentTween) {
            this._isPlaying = true;
            this._currentTween.call(() => {
                this._isPlaying = false;
                this._currentTween = null;
            }).then(tween(this.node).call(() => {
                if (finishCallback) {
                    finishCallback();
                }
            })).start();
        }
    }

    private append(tween: Tween<Node>) {
        if (this._isPlaying) {
            console.warn('Cannot append tween while playing');
            return;
        }

        if (this._currentTween) {
            this._currentTween.then(tween);
        } else {
            this._currentTween = tween;
        }
    }

    private calculateDuration(duration: number): number {
        let updateCount = Math.floor(duration / game.frameTime * 1000) + 1;
        let newDuration = game.frameTime * updateCount / 1000;
        newDuration = this.floorDecimalPlace(newDuration, 4);
        return newDuration;
    }

    /**
     * 小數點後幾位無條件捨去
     * @param num 要處理的小數
     * @param place 第幾位後捨去
     * @returns 
     */
    private floorDecimalPlace(num: number, place: number): number {
        let decimal = Math.pow(10, place);
        return Math.floor(num * decimal) / decimal;
    }
}