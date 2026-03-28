import { _decorator, Component, EventTouch, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TransparentButton')
export class TransparentButton extends Component {
    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);
        this.node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);
        this.node.on(Node.EventType.MOUSE_MOVE, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);
        this.node.on(Node.EventType.MOUSE_LEAVE, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);
    }
}


