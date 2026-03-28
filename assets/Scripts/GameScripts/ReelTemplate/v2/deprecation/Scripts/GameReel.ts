import { _decorator, easing, Node, TweenEasing, Tween, tween, v3, Vec3 } from 'cc';
import { ReelBase } from '../../Scripts/ReelBase';
import { GameIcon } from '../../Scripts/GameIcon';
import { ReelData, ReelEvent, ReelRoundState, ReelState, TweenEasingType } from '../../Scripts/Model/ReelData';
import { DEBUG, } from 'cc/env';
import { ComponentExt } from 'db://assets/Scripts/Utils/Core';

const { ccclass, property } = _decorator;

@ccclass('GameReel')
export class GameReel extends ReelBase {
    public prepareIconList: Node[] = [];
    public resultIconList: Node[] = [];
    public startPullIcon: GameIcon = null; // 紀錄開始滾的拉條效果icon
    public endBounceIcon: GameIcon = null; // 紀錄結束的彈跳效果icon

    public onBounceMaxCallback: () => void = null;

    protected currentDuration: number = 0;

    protected _gameReelData: ReelData = null;

    public get gameReelData(): ReelData {
        return this._gameReelData;
    }

    protected _isStartPullRoll: boolean = false;
    protected _isBounceRoll: boolean = false;
    protected _bounceTargetPos: Vec3 = v3(0, 0, 0);

    protected _originalPos: Vec3 = Vec3.ZERO;
    protected _targetPos: Vec3 = Vec3.ZERO;

    public override init(reelID: number, iconNodes: Node[], havePrepareIcon: boolean, showIcons?: Node[]): void {
        super.init(reelID, iconNodes, havePrepareIcon);

        this._originalPos = this.rootNode.getPosition();
        this._targetPos = this._isVertical ? v3(0, this._rollDis * this._currentDirUnit[1], 0) : v3(this._rollDis * this._currentDirUnit[0], 0, 0);

        this._gameReelData = this._reelData as ReelData;
        this.currentDuration = 1 / this._gameReelData.rollSpeed;

        this.setIconList(iconNodes);
        this.initShowIcon(showIcons);

        this.calculateBounceTargetPos();

        this.currentState = ReelState.Idle;
        this.onReelEvent?.(this.reelID, ReelEvent.Init);
    }

    public override rollSetting(reelRoundState: ReelRoundState, showSymbol?: number): void {
        this.currentDuration = 1 / this._gameReelData.rollSpeed;

        if (this._gameReelData.startPull && reelRoundState === ReelRoundState.FirstRoll) {
            this._isStartPullRoll = true;
            this.currentDuration *= (1 / this._gameReelData.startPullTime);
        }

        else if (this._gameReelData.endBounce && reelRoundState === ReelRoundState.FinalRoll) {
            this._isBounceRoll = true;

            if (showSymbol) {
                this.endBounceIcon.updateSymbol(showSymbol);
            }
        }
    }

    public override startOneRoundRoll(): void {
        this.onReelEvent(this.reelID, ReelEvent.Start);

        tween(this._rootNode)
            .by(this.currentDuration, { position: this._targetPos }, {
                easing: (time: number) => {
                    this.currentState = ReelState.Rolling;
                    this.onReelEvent(this.reelID, ReelEvent.Update);

                    if (this._isStartPullRoll) {
                        return this._gameReelData.startCurve.evaluate(time);
                    }
                    else {
                        return easing.linear(time);
                    }
                }
            })
            .call(() => {
                this.rollOneRoundEnd();
            })
            .start();
    }

    protected calculateBounceTargetPos(): void {
        if (this._gameReelData.endBounce) {
            let dis = this._gameReelData.bounceDis;
            this._bounceTargetPos = this._isVertical ? v3(0, dis * this._currentDirUnit[1], 0) : v3(dis * this._currentDirUnit[0], 0, 0);
        }
    }

    protected setIconList(iconNodes: Node[]): void {
        for (let index = 0; index < iconNodes.length; index++) {
            let icon = iconNodes[index];

            if (index < this._iconAmount) {
                this.prepareIconList.push(icon);
            }
            else {
                this.resultIconList.push(icon);
            }
        }
    }

    protected startBounce(): Promise<unknown> {
        return new Promise((resolve, reject) => {
            let duration = this._gameReelData.downBounceDuration;
            let downEasing = TweenEasingType[this._gameReelData.downBounceEasing] as TweenEasing;

            if (DEBUG) {
                this.calculateBounceTargetPos();
            }

            tween(this._rootNode)
                .by(duration, { position: this._bounceTargetPos }, {
                    easing: downEasing,
                })
                .call(() => {
                    this.onBounceMax();
                })
                .delay(this._gameReelData.bounceDelay)
                .then(this.bounceUpTween())
                .call(() => {
                    resolve(null);
                })
                .start();
        })
    }

    protected bounceUpTween(): Tween<Node> {
        let duration = this._gameReelData.upBounceDuration;
        let upEasing = TweenEasingType[this._gameReelData.upBounceEasing] as TweenEasing;
        let bounceUpTargetPos = v3(-this._bounceTargetPos.x, -this._bounceTargetPos.y, 0);

        let resultTween =
            tween(this._rootNode)
                .by(duration, { position: bounceUpTargetPos }, {
                    easing: upEasing,
                });

        return resultTween;
    }

    /**
     * 回彈到最大值時觸發
     */
    protected onBounceMax(): void {
        this.onBounceMaxCallback?.();
    }

    protected async rollOneRoundEnd(): Promise<void> {
        if (this._isStartPullRoll) {
            this._isStartPullRoll = false;
        }
        else if (this._isBounceRoll) {
            await this.startBounce();
            this._isBounceRoll = false;
        }

        this.rootNode.setPosition(this._originalPos);
        this.currentDuration = 1 / this._gameReelData.rollSpeed;
        this.currentState = ReelState.Idle;
        this.onReelEvent(this.reelID, ReelEvent.End);
    }

    protected initShowIcon(showIcons: Node[]): void {
        for (let index = 0; index < showIcons.length; index++) {
            let icon: GameIcon = ComponentExt.getComp<GameIcon>(showIcons[index], 'GameIcon');

            let isStartPull: boolean = index === 0;
            let totalIconAmount = this.prepareIconList.length + this.resultIconList.length;

            let initPos = isStartPull ? this.calculateIconPos(totalIconAmount) : this.calculateIconPos(- 1);
            icon.setPosition(initPos);

            let siblingIndex = isStartPull ? totalIconAmount + 1 : 0;
            icon.originSiblingIndex = siblingIndex;
            icon.node.setSiblingIndex(siblingIndex);

            icon.init();

            if (isStartPull) {
                this.startPullIcon = icon;
            }
            else {
                this.endBounceIcon = icon;
            }
        }
    }
}