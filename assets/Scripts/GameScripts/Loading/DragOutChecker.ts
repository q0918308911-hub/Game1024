import { _decorator, Component, EventTouch, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DragOutChecker')
export class DragOutChecker extends Component {

    private isTouching = false;
    public onDragOutOfRange: (event: EventTouch) => void = null;
    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    }

    private onTouchStart(event: EventTouch) {
        this.isTouching = true;
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isTouching) return;
        const touchLoc = event.getUILocation();
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform.getBoundingBoxToWorld().contains(touchLoc)) {
            this.onDragOutOfRange?.(event);
            this.isTouching = false;
        }
    }

    private onTouchEnd(event: EventTouch) {
        this.isTouching = false;
    }
}


