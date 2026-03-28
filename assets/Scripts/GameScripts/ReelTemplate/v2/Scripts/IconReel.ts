import { _decorator, easing, log, Node, TweenEasing, v3, Vec3 } from 'cc';
import { DEBUG } from 'cc/env';
import { GameIcon } from './GameIcon';
import { ReelData, ReelEvent, ReelRoundState, ReelState, TweenEasingType } from './Model/ReelData';
import { ReelBase } from './ReelBase';
import { rollDirection } from './Model/ReelDataBase';
import { Movement } from './Movement';
import { ComponentExt } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('IconReel')
export class IconReel extends ReelBase {
    public iconNodeList: Node[] = [];

    public startPullIcon: GameIcon = null; // 紀錄開始滾的拉條效果icon
    public endBounceIcon: GameIcon = null; // 紀錄結束的彈跳效果icon以及prepareIcon

    public onBounceMaxCallback: (reelID: number) => void = null;

    protected currentDuration: number = 0;

    protected _gameReelData: ReelData = null;

    public get gameReelData(): ReelData {
        return this._gameReelData;
    }

    protected _startPullOriginPos: Vec3 = v3(0, 0, 0);
    protected _unitTargetPos: Vec3 = v3(0, 0, 0);
    protected _iconInitPos: Vec3 = v3(0, 0, 0);

    protected _isStartPullRoll: boolean = false;
    protected _bounceTargetPos: Vec3 = v3(0, 0, 0);

    protected iconMovementList: Movement[] = [];

    protected iconEndCount: number = 0;

    public override init(reelID: number, iconNodes: Node[], havePrepareIcon: boolean, showIcons?: Node[]): void {
        super.init(reelID, iconNodes, havePrepareIcon);
        this._unitTargetPos = this._isVertical ? v3(0, this._unitDis * this._currentDirUnit[1], 0) : v3(this._unitDis * this._currentDirUnit[0], 0, 0);

        this._gameReelData = this._reelData as ReelData;
        this.currentDuration = 1 / this._gameReelData.rollSpeed;

        this.iconNodeList = [...iconNodes];
        this.initShowIcon(showIcons);
        this.iconNodeList.unshift(this.endBounceIcon.node); //回彈icon做為prepareIcon

        this.initIconMovement();

        this.calculateBounceTargetPos();

        this.currentState = ReelState.Idle;
        this.onReelEvent?.(this.reelID, ReelEvent.Init);
    }

    public override rollSetting(reelRoundState: ReelRoundState, showSymbol?: number): void {
        this.currentDuration = 1 / this._gameReelData.rollSpeed;

        if (this._gameReelData.startPull && reelRoundState === ReelRoundState.FirstRoll) {
            this._isStartPullRoll = true;
            this.currentDuration *= (1 / this._gameReelData.startPullTime);

            if (showSymbol) {
                this.startPullIcon.updateSymbol(showSymbol);
            }
        }
    }

    public override startOneRoundRoll(): void {
        this.iconEndCount = 0;
        this.onReelEvent?.(this.reelID, ReelEvent.Start);

        if (this._isStartPullRoll) {
            this.startPullRollTween();
        }

        for (let index = 0; index < this.iconNodeList.length; index++) {
            this.startRollTween(index);
        }
    }

    protected startRollTween(index: number): void {
        let movement = this.iconMovementList[index];

        movement.moveBy(this._unitTargetPos, this.currentDuration, true,
            (time: number) => {
                if (this._isStartPullRoll) {
                    return this._gameReelData.startCurve.evaluate(time);
                }
                else {
                    return easing.linear(time);
                }
            });

        movement.play(() => {
            this.oneIconRollEnd(this.iconNodeList[index]);
        });
    }

    protected startPullRollTween(): void {
        let movement = this.startPullIcon.getComponent(Movement);

        this.startPullIcon.setPosition(this._startPullOriginPos);

        movement.moveBy(this._unitTargetPos, this.currentDuration, true,
            (time: number) => {
                return this._gameReelData.startCurve.evaluate(time);
            }
        );

        movement.play();
    }

    protected calculateBounceTargetPos(): void {
        if (this._gameReelData.endBounce) {
            let dis = this._gameReelData.bounceDis;
            this._bounceTargetPos = this._isVertical ? v3(0, dis * this._currentDirUnit[1], 0) : v3(dis * this._currentDirUnit[0], 0, 0);
        }
    }

    /**
     * 回彈額外由view去呼叫，跟startOneRoundRoll切開，這樣bounceMax才能操作正確的icon
     */
    public async startBounce(): Promise<void> {
        await this.bouncePromise(true);
        this.onBounceMax();
        await this.bouncePromise(false);
    }

    protected async bouncePromise(isBounceDown: boolean): Promise<void> {
        let promiseList = [];

        for (let index = 0; index < this.iconNodeList.length; index++) {
            if (isBounceDown) {
                promiseList.push(this.startBounceDownTween(index));
            }
            else {
                promiseList.push(this.startBounceUpTween(index));
            }
        }

        await Promise.all(promiseList);
    }

    protected startBounceDownTween(index: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (DEBUG) {
                this.calculateBounceTargetPos();
            }

            let movement = this.iconMovementList[index];
            let downDuration = this._gameReelData.downBounceDuration;
            let downEasing = TweenEasingType[this._gameReelData.downBounceEasing] as TweenEasing;
            movement.moveBy(this._bounceTargetPos, downDuration, true, downEasing);

            movement.play(() => {
                resolve();
            });
        })
    }

    protected startBounceUpTween(index: number): Promise<void> {
        return new Promise((resolve, reject) => {
            let movement = this.iconMovementList[index];
            let upDuration = this._gameReelData.upBounceDuration;
            let upEasing = TweenEasingType[this._gameReelData.upBounceEasing] as TweenEasing;
            let bounceUpTargetPos = v3(-this._bounceTargetPos.x, -this._bounceTargetPos.y, 0);
            movement.moveBy(bounceUpTargetPos, upDuration, true, upEasing);

            movement.play(() => {
                resolve();
            });
        })
    }

    /**
     * 回彈到最大值時觸發
     */
    protected onBounceMax(): void {
        this.onBounceMaxCallback?.(this.reelID);
    }

    protected oneIconRollEnd(node: Node): void {
        this.iconEndCount++;

        if (this.checkAllIconRollEnd(node)) {
            this.changeIconPos();
            this.allIconRollEnd();
        }
    }

    protected checkAllIconRollEnd(node: Node): boolean {
        return this.iconEndCount === this.iconNodeList.length;
    }

    protected allIconRollEnd(): void {
        if (this._isStartPullRoll) {
            this._isStartPullRoll = false;
        }

        this.currentDuration = 1 / this._gameReelData.rollSpeed;
        this.currentState = ReelState.Idle;
        this.onReelEvent?.(this.reelID, ReelEvent.End);
    }

    protected changeIconPos(): void {
        let lastIconNode = this.iconNodeList.pop();
        lastIconNode.setPosition(this._iconInitPos);

        lastIconNode.setSiblingIndex(0);
        this.iconNodeList.unshift(lastIconNode);
        this.endBounceIcon = ComponentExt.getComp<GameIcon>(lastIconNode, 'GameIcon');
        this.endBounceIcon.originSiblingIndex = lastIconNode.getSiblingIndex();

        let lastMovement = this.iconMovementList.pop();
        this.iconMovementList.unshift(lastMovement);
    }

    protected initIconMovement(): void {
        for (let i = 0; i < this.iconNodeList.length; i++) {
            let movement = this.iconNodeList[i].getComponent(Movement);
            if (!movement) {
                this.iconMovementList[i] = this.iconNodeList[i].addComponent(Movement);
            }
            else {
                this.iconMovementList[i] = movement;
            }
        }

        this.startPullIcon.addComponent(Movement);
    }

    protected initShowIcon(showIcons: Node[]): void {
        for (let index = 0; index < showIcons.length; index++) {
            let icon: GameIcon = ComponentExt.getComp<GameIcon>(showIcons[index], 'GameIcon');

            let isStartPull: boolean = index === 0;
            let totalIconAmount = this.iconNodeList.length;

            if (!this._reelData.useLayout) {
                let initPos = isStartPull ? this.calculateIconPos(totalIconAmount) : this.calculateIconPos(-1);
                icon.setPosition(initPos);
            }

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

        this.scheduleOnce(() => { //如果使用layout排版，等待layout更新
            this._iconInitPos = this.endBounceIcon.node.position.clone();
            this._startPullOriginPos = this.startPullIcon.node.position.clone();
        }, 0);
    }
}