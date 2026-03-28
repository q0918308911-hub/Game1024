import { _decorator, CCString, Component, Node, sp, CCBoolean } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpinePlayOnEnable')
export class SpinePlayOnEnable extends Component {

    @property(CCString)
    animationName = '';

    @property(CCBoolean)
    loop = false;

    onEnable() {
        const spine = this.node.getComponent(sp.Skeleton);
        if (spine) {
            spine.setAnimation(0, this.animationName, this.loop);
        }
    }


}


