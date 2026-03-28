import { _decorator, color, Component, Label, Node, Sprite, Toggle } from 'cc';
const { ccclass } = _decorator;

@ccclass('ConditionLayoutItem')
export class ConditionLayoutItem extends Component {
    start() {
        this.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);

        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onMouseEnter() {
        const toggles = this.node.getComponentsInChildren(Toggle);
        toggles.forEach((toggle) => {
            if (!toggle.isChecked) {
                toggle.node.getComponent(Sprite).spriteFrame = toggle.hoverSprite;
            }
        });
        const labels = this.node.getComponentsInChildren(Label);
        labels.forEach((label) => {
            label.color = color(187, 187, 187);
        });
    }

    onMouseLeave() {
        const toggles = this.node.getComponentsInChildren(Toggle);
        toggles.forEach((toggle) => {
            if (!toggle.isChecked) {
                toggle.node.getComponent(Sprite).spriteFrame = toggle.normalSprite;
            }
        });
        const labels = this.node.getComponentsInChildren(Label);
        labels.forEach((label) => {
            label.color = color(255, 255, 255);
        });
    }

    onTouchEnd() {
        const toggles = this.node.getComponentsInChildren(Toggle);
        toggles.forEach((toggle) => {
            toggle.isChecked = !toggle.isChecked;
        });
        const labels = this.node.getComponentsInChildren(Label);
        labels.forEach((label) => {
            label.color = color(255, 255, 255);
        });
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}


