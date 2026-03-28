import { _decorator, Component, Node } from 'cc';
import { WaninAnimation } from '../WaninAnimation';
const { ccclass, property } = _decorator;

@ccclass('WaninPlayerTest')
export class WaninPlayerTest extends Component {

    @property(WaninAnimation)
    private waninAnimation: WaninAnimation;

    protected start(): void {
        this.waninAnimation.init(() => {
            console.log("WaninAnimation init done");
        });

    }

    onBtnClick() {
        // this.waninAnimation.playOncePromise([0, 0])
        //     .then(() => {
        //         console.log("playOncePromise done")
        //     })
        this.waninAnimation.playOnce([0]);
    }

    onBtnClick2() {

        this.waninAnimation.closeDecoder();
    }

    onBtnClick3() {

        this.waninAnimation.init(() => {
            console.log("WaninAnimation init done");
        });
    }
}


