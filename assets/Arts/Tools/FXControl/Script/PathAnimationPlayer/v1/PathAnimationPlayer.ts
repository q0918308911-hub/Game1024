import { _decorator, Component, tween, Animation, Vec3, Mat4, Quat, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PathList')
export class PathList {
    @property(Node)
    public targetNode: Node = null;

    @property({ tooltip: '是否有跟隨拖尾' })
    public hasFollowNode: boolean = false;

    @property({ type: Node, visible() { return (this as PathList).hasFollowNode; }, tooltip: '跟隨拖尾' })
    public followNode: Node = null;
}

@ccclass('PathAnimationPlayer')
export class PathAnimationPlayer extends Component {
    @property(Animation)
    public moveAnimation: Animation = null;

    @property({ type: PathList, tooltip: "連續軌跡的組件列表" })
    public pathAnimationList: PathList[] = [];

    @property({ tooltip: '動畫開始位置' })
    public aniStartPos: Vec3 = new Vec3;

    @property({ tooltip: '動畫開始位置' })
    public aniEndPos: Vec3 = new Vec3;

    public async play(AnimationName: string, rootStartWorldPos: Vec3, rootEndWorldPos: Vec3): Promise<void> {
        this.playMotionStreak();
        this.animateWithOffsets(rootStartWorldPos.clone(), rootEndWorldPos.clone());
        await this.moveAnimation.playPromise(AnimationName);
    }

    protected animateWithOffsets(rootStartWorldPos: Vec3, rootEndWorldPos: Vec3): void {
        const chLocalStart = this.aniStartPos.clone();
        const chLocalEnd = this.aniEndPos.clone();
        const chDelta = chLocalEnd.subtract(chLocalStart);
        const chLength = chDelta.length();
        const chDir = chDelta.normalize();

        const targetDelta = rootEndWorldPos.subtract(rootStartWorldPos);
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

        const finalRootPos = rootStartWorldPos.clone().subtract(offsetWorld);
        this.node.setWorldPosition(finalRootPos);
        this.node.setRotationFromEuler(0, 0, angleDeg);
        this.node.setWorldScale(new Vec3(scaleRatio, scaleRatio, 1));
    }

    protected playMotionStreak(): void {
        for (let item of this.pathAnimationList) {
            if (item.hasFollowNode) {
                this.follow(item.followNode, item.targetNode);
            }
        }
    }

    protected follow(follower: Node, target: Node): void {
        const duration = this.moveAnimation.getState(this.moveAnimation.defaultClip.name).duration;
        const repeatCount = Math.ceil(duration * 60);
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
}


