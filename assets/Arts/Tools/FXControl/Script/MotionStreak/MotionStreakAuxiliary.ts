import { _decorator, CCFloat, Component, MotionStreak, tween, Animation, Vec3, Mat4, Quat, Node, CCBoolean, Sprite, Tween } from 'cc';
import { Utility } from 'db://assets/Scripts/ModuleEntry';
const { ccclass, property } = _decorator;
@ccclass('MotionStreakList')
class MotionStreakList {
    @property(MotionStreak)
    public motionStreak: MotionStreak = null;

    @property({ type: CCFloat, tooltip: '拖尾寬度' })
    public lineWidth: number = 0;

    @property({ tooltip: '是否有跟隨物件' })
    public hasFollowNode: boolean = false;

    @property({ type: Node, visible() { return (this as MotionStreakList).hasFollowNode; }, tooltip: '跟隨物件' })
    public followNode: Node = null;
}

@ccclass('MotionStreakAuxiliary')
export class MotionStreakAuxiliary extends Component {
    @property(Animation)
    protected moveAnimation: Animation = null;

    @property({ type: MotionStreakList, tooltip: "連續軌跡的組件列表" })
    protected motionStreakList: MotionStreakList[] = [];

    @property({ tooltip: '動畫開始位置' })
    protected aniStartPos: Vec3 = new Vec3;

    @property({ tooltip: '動畫開始位置' })
    protected aniEndPos: Vec3 = new Vec3;

    @property({ type: CCFloat, tooltip: '拖尾的FadeTime' })
    protected fadeTime: number = 0;

    @property({ type: CCFloat, tooltip: '拖尾移動到結束位置所需時間(不包含拖尾淡出時間)' })
    public currentDuration: number = 0;

    @property({ type: CCFloat, tooltip: '拖尾到達目標點後的寬度縮短時間' })
    public motionStreakZoomTime: number = 0;

    public async play(AnimationName: string, rootStartPos: Vec3, rootEndPos: Vec3): Promise<void> {
        const promiseList: Promise<void>[] = [];
        this.animateWithOffsets(rootStartPos.clone(), rootEndPos.clone());
        this.moveAnimation.play(AnimationName);
        this.resetMotionStreak();
        for (let item of this.motionStreakList) {
            item.motionStreak.stroke = item.lineWidth;
            item.motionStreak.fadeTime = this.fadeTime;
            if (item.hasFollowNode) {
                this.scriptFollow(item.followNode, item.motionStreak.node);
            }
        }
        await Utility.waitPromise(this.currentDuration);
        for (let item of this.motionStreakList) {
            promiseList.push(this.scaleZoom(item.motionStreak));
        }
        await Promise.all(promiseList);
        this.resetMotionStreak();
    }

    protected animateWithOffsets(startPos: Vec3, endPos: Vec3): void {
        const chLocalStart = this.aniStartPos.clone();
        const chLocalEnd = this.aniEndPos.clone();
        const chDelta = chLocalEnd.subtract(chLocalStart);
        const chLength = chDelta.length();
        const chDir = chDelta.normalize();

        const worldMatrix = this.node.parent!.getWorldMatrix();
        const targetWorldStart = new Vec3();
        const targetWorldEnd = new Vec3();

        Vec3.transformMat4(targetWorldStart, startPos, worldMatrix);
        Vec3.transformMat4(targetWorldEnd, endPos, worldMatrix);

        const targetDelta = targetWorldEnd.subtract(targetWorldStart);
        const targetLength = targetDelta.length();
        const targetDir = targetDelta.normalize();

        const scaleRatio = targetLength / chLength;
        const angleRad = Math.atan2(targetDir.y, targetDir.x) - Math.atan2(chDir.y, chDir.x);
        const angleDeg = angleRad * 180 / Math.PI;

        const offsetLocal = chLocalStart.clone().multiplyScalar(scaleRatio);
        const rotMat = new Mat4();
        Mat4.fromRT(rotMat, Quat.fromEuler(new Quat(), 0, 0, angleDeg), new Vec3(0, 0, 0));
        const offsetWorld = new Vec3();
        Vec3.transformMat4(offsetWorld, offsetLocal, rotMat);

        const finalRootPos = targetWorldStart.clone().subtract(offsetWorld);
        this.node.setWorldPosition(finalRootPos);
        this.node.setRotationFromEuler(0, 0, angleDeg);
        this.node.setWorldScale(new Vec3(scaleRatio, scaleRatio, 1));
    }

    protected scriptFollow(follower: Node, target: Node): void {
        const repeatCount = Math.ceil(this.currentDuration * 60);
        const tempPos = new Vec3();
        tween(follower)
            .repeat(repeatCount,
                tween()
                    .call(() => {
                        target.getWorldPosition(tempPos);
                        follower.setWorldPosition(tempPos);
                    })
                    .delay(0.016)//一偵
            )
            .call(() => {
                target.getWorldPosition(tempPos);
                follower.setWorldPosition(tempPos);
            })
            .start();
    }

    protected scaleZoom(motionStreak: MotionStreak): Promise<void> {
        return new Promise((resolve, reject) => {
            tween(motionStreak)
                .to(this.motionStreakZoomTime, { stroke: 0 })
                .call(() => {
                    resolve();
                })
                .start();
        })
    }

    protected resetMotionStreak(): void {
        for (let item of this.motionStreakList) {
            item.motionStreak.reset();
        }
    }
}


