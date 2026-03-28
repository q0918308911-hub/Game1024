import { _decorator, Node, tween, TweenEasing, v3, Vec3 } from 'cc';
import { IconMoveData } from './DropReelDataStructure';
import { ReelBase } from '../ReelBase';
import { DropMode, DropReelData, DropState } from '../Model/DropReel/DropReelData';
const { ccclass, property } = _decorator;

@ccclass('DropReel')
export class DropReel extends ReelBase {

    protected _dropReelData: DropReelData = null;
    protected _dropDistance: Vec3 = new Vec3(0, 0, 0);
    public get dropDistance(): Vec3 {
        return this._dropDistance;
    }

    protected _resetDistance: Vec3 = new Vec3(0, 0, 0);
    public get resetDistance(): Vec3 {
        return this._resetDistance;
    }

    protected _curMode: DropMode = DropMode.IDLE;
    public set curMode(status: DropMode) {
        this._curMode = status;
    }

    protected _curDuration: number = 0;
    protected _curDropSpacingTime: number = 0;
    protected _curEasingType: TweenEasing | ((k: number) => number) = null;

    public override init(reelID: number, iconNodes: Node[], havePrepareIcon: boolean = false): void {
        super.init(reelID, iconNodes, havePrepareIcon);
        this._dropDistance = this._isVertical ? v3(0, -this._unitDis, 0) : v3(-this._unitDis, 0, 0);
        Vec3.negate(this.resetDistance, this._dropDistance);
        this._dropReelData = this._reelData as DropReelData;
    }

    public override startOneRoundRoll() {
        console.warn("Not support startOneRoundRoll in DropReel");
    }

    public async startDropTween(data: IconMoveData[], state: DropState): Promise<void> {
        let mode = this._curMode;
        this.rollSetting(state, mode);

        let promiseList: Promise<void>[] = [];
        let delayCount = 0;

        for (let i = data.length - 1; i >= 0; i--) { // 由下往上逐一掉落
            if (data[i].moveCount === 0) {
                continue; // 這個Node沒有移動
            }
            let delayTime = this._curDropSpacingTime * delayCount;
            let tweenPromise = this.delayDropTween(delayTime, data[i].node, data[i].moveCount, this._curEasingType);
            promiseList.push(tweenPromise);
            delayCount++;
        }

        await Promise.all(promiseList);
    }

    protected async delayDropTween(delay: number, node: Node, moveCount: number, easingType: TweenEasing | ((k: number) => number)): Promise<void> {
        await this.delay(delay);
        await this.dropTween(node, moveCount, easingType);
    }

    protected delay(seconds: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
    }

    public override rollSetting(state: DropState, mode: DropMode): void {

        switch (state) {
            case DropState.DROP_IN:
                this._curEasingType = this._dropReelData.autoDropInCurve ? "cubicOut" : (time: number) => { return this._dropReelData.inCurve.evaluate(time); }
                break;
            case DropState.DROP_OUT:
                this._curEasingType = this._dropReelData.autoDropOutCurve ? "cubicIn" : (time: number) => { return this._dropReelData.outCurve.evaluate(time); }
                break;
            case DropState.FILL:
                this._curEasingType = this._dropReelData.autoFillCurve ? "cubicOut" : (time: number) => { return this._dropReelData.fillCurve.evaluate(time); }
                break;
        }

        switch (mode) {
            case DropMode.IDLE:
                this._curDuration = this._dropReelData.dropDuration;
                this._curDropSpacingTime = this._dropReelData.dropSpacingTime;
                break;
            case DropMode.STOP:
                this._curDuration = this._dropReelData.stopDropDuration;
                this._curDropSpacingTime = this._dropReelData.stopDropSpacingTime;
                break;
            case DropMode.TURBO:
                this._curDuration = this._dropReelData.turboDropDuration;
                this._curDropSpacingTime = this._dropReelData.turboDropSpacingTime;
                break;
            case DropMode.READY_HAND:
                this._curDuration = this._dropReelData.readyHandDropDuration;
                this._curDropSpacingTime = this._dropReelData.readyHandDropSpacingTime;
                break;
        }
    }

    /**
     * 任何滾輪掉落的動畫都是由此來呼叫
     * @param node 要表演掉落的node
     * @param count 掉落的距離倍數(單位的倍數)
     * @param mode 表演掉落的模式(會決定easing curve的設定)
     * @returns 
     */
    protected dropTween(node: Node, moveCount: number, easingType: TweenEasing | ((k: number) => number)): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let dropDistance = new Vec3;
            Vec3.multiplyScalar(dropDistance, this._dropDistance, moveCount);
            tween(node)
                .by(this._curDuration, { position: dropDistance }, { easing: easingType })
                .call(() => {
                    resolve();
                })
                .start();
        })
    }

    public resetDropOutIconPos(data: IconMoveData[]) {
        let resetDistance = new Vec3;
        let resetPos = new Vec3;
        for (let i = data.length - 1; i >= 0; i--) {
            Vec3.multiplyScalar(resetDistance, this._resetDistance, data[i].resetCount);
            Vec3.add(resetPos, data[i].node.position, resetDistance);
            data[i].node.setPosition(resetPos);
        }
    }
}

