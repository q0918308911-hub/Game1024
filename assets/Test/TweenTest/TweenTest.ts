import { _decorator, bezier, Color, color, Component, easing, log, math, Node, RealCurve, Sprite, Tween, tween, v3, Vec3 } from 'cc';
import { bezierEase } from '../../Lib/cubic-bezier';
import { Debug } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('TweenTest')
export class TweenTest extends Component {

    @property(Node)
    private Node1: Node;

    @property(Node)
    private Node2: Node;

    @property(RealCurve)
    private realCurve: RealCurve = new RealCurve();

    @property(RealCurve)
    private realCurve2: RealCurve = new RealCurve();

    private baz = bezierEase({ x: 1, y: 0.85, }, { x: 0.56, y: 1.3, });

    private b: any;
    start() {
        //this.Node1.getComponent(Sprite).color = Color.RED;
    }

    update(deltaTime: number) {

    }

    onButtonClick() {
        this.test();
    }

    onButtonClick2() {
        // this.Node1._destroyImmediate();
        this.b.stop();
    }

    func1() {
        Debug.Log("func1");
        tween()
            .target(this.Node1)
            .delay(2)
            .to(1, { position: new Vec3(0, 10, 0) })
            .call(() => {
                Debug.Log("call!!!");
            })
            .delay(1)
            .by(1, { position: new Vec3(0, -200, 0) })
            .start();

        Tween

    }



    func2() {
        Debug.Log("func2");
        tween()
            .target(this.Node1)
            .by(1, { position: new Vec3(300, 0, 0) }, {
                easing: 'backOut'

            })
            .start();
    }


    func3() {
        Debug.Log("func2");
        tween()
            .target(this.Node1)
            .by(1, { position: new Vec3(300, 0, 0) }, {
                progress: (start: number, end: number, current: number, ratio: number): number => {
                    //this.baz(ratio)
                    //easing.backOut(ratio)
                    console.log("ratio", ratio);
                    return math.lerp(start, end, this.realCurve.evaluate(ratio));
                }
            })
            .repeatForever()
            .start();
    }

    func5() {
        let t1 = tween()
            .target(this.Node1)
            .by(1, { position: new Vec3(300, 0, 0) })

        let t2 = tween()
            .target(this.Node1)
            .by(1, { scale: new Vec3(1, 1, 1) })
            .by(1, { scale: new Vec3(1, 1, 1) })

        tween().target(this.Node1)
            .parallel(t2, t1)
            .call(() => {
                Debug.Log("call111!!!");
            })
            .start();
    }

    test() {
        this.b = tween(this.Node1)
            .by(0.5, { position: new Vec3(100, 0, 0) })
            .by(0.5, { position: new Vec3(-100, 0, 0) })
            .delay(0.3)
            .call(() => {
                console.log("call");
            })
            .union()
            .repeatForever()
            .start();



        // let tween1 = tween(this.Node1)
        //     .call(() => { })
        //     .then(b)
        // .by(0.5, { position: new Vec3(1000, 0, 0) })

        // let c = tween(this.Node1)
        //     .repeatForever(b)
        // .start();



        // let b2 = tween(this.Node1)
        //     .by(1, { position: new Vec3(0, 100, 0) })
        //     .delay(0.01)
        //     .then(b)
        //     .repeatForever()
        //     .start();


        // c.start();

        // let c = tween(this.Node1).sequence(b2, b).start();

    }
}


