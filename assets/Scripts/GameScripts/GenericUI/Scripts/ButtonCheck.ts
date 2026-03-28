import { _decorator, Button, Component, Node, Sprite } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('ButtonCheck')
@requireComponent(Button)
export class ButtonCheck extends Component {
    protected onEnable(): void {
        let btn = this.node.getComponent(Button);
        if (btn.interactable === false) {
            this.getComponent(Sprite).spriteFrame = btn.disabledSprite;
        }
    }
}


