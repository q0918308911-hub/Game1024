import { _decorator, Animation, animation, AnimationClip, Component, log, Node, UITransform } from 'cc';
import { Debug } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('AniMain')
export class AniMain extends Component {
    @property(Node)
    private node1: Node;


    start() {
        Debug.Log(this.node1);
        //this.node1.getComponent(animation.AnimationController).setValue("PlayMove", true);
        this.node1.getComponent(Animation).on(Animation.EventType.FINISHED, this.onAnimationEvent, this)
        let ac: AnimationClip = this.node1.getComponent(Animation).clips[0];
        Debug.Log("time");
        Debug.Log(ac.duration);
    }

    update(deltaTime: number) {

    }

    public onButtonClick(str: string) {
        Debug.Log(str);
        this.node1.getComponent(Animation).play("move");
    }

    onAnimationEvent() {
        Debug.Log("onAnimationEvent END");
    }
}


