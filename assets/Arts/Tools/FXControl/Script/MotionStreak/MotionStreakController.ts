import { _decorator, CCBoolean, CCFloat, CCInteger, Component, macro, MotionStreak, Node, Quat, Sprite, tween, UIOpacity, Vec3 } from 'cc';
import { Utility } from 'db://assets/Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('MotionStreakController')
export class MotionStreakController extends Component {

    @property(MotionStreak)
    protected motionStreak: MotionStreak = null;

    @property({ type: Node, tooltip: '控制點1(開始位置)' })
    protected startNode: Node = null;

    @property({ type: Node, tooltip: '控制點1(結束位置)' })
    protected targetNode: Node = null;

    @property({ type: Node, tooltip: '控制點1(靠近開始位置)' })
    protected ctrlNode: Node = null;

    @property({ type: Node, tooltip: '控制點2(靠近結束位置)' })
    protected ctrlNode2: Node = null;

    @property({ type: CCFloat, tooltip: '移動到結束位置所需時間(不包含拖尾淡出時間)' })
    protected currentDuration: number = 0;

    @property({ type: CCFloat, tooltip: '拖尾寬度' })
    protected lineWidth: number = 0;

    @property({ type: CCFloat, tooltip: '拖尾寬度縮短時間' })
    protected motionStreakZoomTime: number = 0;

    public onEnable(): void {
        this.play();
    }

    public async play(): Promise<void> {
        const startPos = this.startNode.getPosition();
        const endPos = this.targetNode.getPosition();

        const controlX = this.ctrlNode.getPosition().x;
        const controlY = this.ctrlNode.getPosition().y;
        const controlPos = new Vec3(controlX, controlY, 0);

        const controlX2 = this.ctrlNode2.getPosition().x;
        const controlY2 = this.ctrlNode2.getPosition().y;
        const controlPos2 = new Vec3(controlX2, controlY2, 0);
        this.motionStreak.node.setPosition(startPos);
        this.motionStreak.reset();
        this.motionStreak.stroke = this.lineWidth;
        this.playMotion(startPos, controlPos, controlPos2, endPos);
        await Utility.waitPromise(this.currentDuration);
        await this.scaleZoom();
        this.motionStreak.reset();
    }

    protected playMotion(startPos: Vec3, controlPos: Vec3, controlPos2: Vec3, endPos: Vec3): void {
        const points = this.getBezierCurve(startPos, controlPos, controlPos2, endPos, 50);
        const duration = this.currentDuration / points.length;
        this.move(duration, points);
        this.tansFrom(duration, points);
    }

    protected move(duration: number, points: Vec3[]): void {
        let tw = tween(this.motionStreak.node);
        for (let i = 0; i < points.length; i++) {
            tw = tw.to(duration, { position: points[i] });
        }
        tw.start();
    }

    protected tansFrom(duration: number, points: Vec3[]): void {
        let seq = tween(this.motionStreak.node);
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            let direction = new Vec3();
            Vec3.subtract(direction, next, current);
            direction.normalize();

            const angle = Math.atan2(direction.y, direction.x);
            const rotation = new Quat();
            Quat.fromEuler(rotation, 0, 0, (-angle * (-180 / Math.PI) - 90)); // Z 軸旋轉（-angle 是因為旋轉是逆時針）

            seq = seq.to(duration, { rotation: rotation });
        }
        seq.start();
    }

    private getBezierCurve(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, segments: number): Vec3[] {
        const points: Vec3[] = [];
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let x =
                Math.pow(1 - t, 3) * p0.x +
                3 * Math.pow(1 - t, 2) * t * p1.x +
                3 * (1 - t) * Math.pow(t, 2) * p2.x +
                Math.pow(t, 3) * p3.x;

            let y =
                Math.pow(1 - t, 3) * p0.y +
                3 * Math.pow(1 - t, 2) * t * p1.y +
                3 * (1 - t) * Math.pow(t, 2) * p2.y +
                Math.pow(t, 3) * p3.y;

            let z =
                Math.pow(1 - t, 3) * p0.z +
                3 * Math.pow(1 - t, 2) * t * p1.z +
                3 * (1 - t) * Math.pow(t, 2) * p2.z +
                Math.pow(t, 3) * p3.z;

            points.push(new Vec3(x, y, z));
        }
        return points;
    }

    protected scaleZoom(): Promise<void> {
        return new Promise((resolve, reject) => {
            tween(this.motionStreak)
                .to(this.motionStreakZoomTime, { stroke: 0 })
                .call(() => {
                    resolve();
                })
                .start();
        })
    }
}
