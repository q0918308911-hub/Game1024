import { _decorator, Animation, Component, Label, Node, sp, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CountTestMain')
export class CountTestMain extends Component {

    private intervalCount: number = 0;
    private scheduleCount: number = 0;

    @property(Label)
    private intervalCountLabel: Label;

    @property(Label)
    private scheduleCountLabel: Label;

    @property(Label)
    private tweenCountLabel: Label;

    @property(Node)
    private animationShowNode: Node;

    @property(sp.Skeleton)
    private spineCount: sp.Skeleton;


    start() {

    }

    update(deltaTime: number) {

    }

    private startIntervalCount() {
        let key = setInterval(() => {
            this.intervalCount++;
            this.intervalCountLabel.string = `${this.intervalCount}`;
            if (this.intervalCount === 10) {
                clearInterval(key);

            }
        }, 1000)
    }

    private startScheduleCount() {

        let scheduleCB = () => {
            this.scheduleCount++;
            this.scheduleCountLabel.string = `${this.scheduleCount}`;
        }

        this.schedule(scheduleCB, 1, 10);

    }

    private startAnimation() {
        this.animationShowNode.getComponent(Animation).play();
    }

    private startTweenCount() {
        let target = new BindTarget();
        tween(target)
            .to(10, { count: 10 }, {
                onUpdate: (v: any, ratio: number) => {
                    let current = Math.floor(10 * ratio);
                    this.tweenCountLabel.string = `${current}`;
                },
            })
            .start();
    }

    private startSpineCount() {
        this.spineCount.setAnimation(0, 'default', false);
    }

    private onStartButtonClick() {
        this.startIntervalCount();
        this.startScheduleCount();
        this.startAnimation();
        this.startTweenCount();
        this.startSpineCount();
    }
}


class BindTarget {
    count: number = 0;
}