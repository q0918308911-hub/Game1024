import { _decorator, CCString, Component, EditBox, Node, animation, log } from 'cc';
import { Debug } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('AniGraphTest')
export class AniGraphTest extends Component {

    @property(Node)
    private animationNode: Node;

    @property([CCString])
    private triggerName: string[] = [];

    @property(EditBox)
    private editBox: EditBox;

    start() {
        this.editBox.string = "0";
    }

    update(deltaTime: number) {

    }

    public onButtonClick() {
        Debug.Log("123456");
        let id = parseInt(this.editBox.string);
        Debug.Log(this.triggerName[id]);
        this.animationNode.getComponent(animation.AnimationController).setValue(this.triggerName[id], true);
    }

    public onButtonClick2() {

        //let a = this.animationNode.getComponent(animation.AnimationController).getCurrentClipStatuses(0);

    }
}


