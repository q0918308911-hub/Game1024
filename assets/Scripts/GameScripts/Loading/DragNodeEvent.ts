import { _decorator, Camera, Canvas, Component, director, EventTouch, Node, Vec3 } from 'cc';
import { Utility } from '../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('DragNodeEvent')
export class DragNodeEvent extends Component {

    private camera: Camera = null;
    private canvas: Canvas = null;
    private startTouchPos: Vec3 = new Vec3();

    public onDrag: (dragDiff: Vec3, touchPosOfNode: Vec3, touchPosCanvas: Vec3) => void = null;
    public onRelease: (dragDiff: Vec3, touchPosOfNode: Vec3, touchPosCanvas: Vec3) => void = null;
    public onDragStart: () => void = null;
    init() {
        this.canvas = director.getScene().getComponentInChildren(Canvas);
        this.camera = this.canvas.cameraComponent;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this)
    }

    private onTouchStart(event: EventTouch) {
        let touchPos: Vec3 = Utility.getEventLocalPos(this.camera, event, event.target);
        this.startTouchPos = touchPos;
        this.onDragStart?.();
    }

    private onTouchMove(event: EventTouch) {
        let touchPosOfNode: Vec3 = Utility.getEventLocalPos(this.camera, event, event.target);
        let touchPosCanvas: Vec3 = Utility.getEventLocalPos(this.camera, event, this.canvas.node);
        let diffVec: Vec3 = touchPosOfNode.subtract(this.startTouchPos);
        this.onDrag?.(diffVec, touchPosOfNode, touchPosCanvas);
    }

    private onTouchCancel(event: EventTouch) {
        this.onTouchEnd(event);
    }

    private onTouchEnd(event: EventTouch) {
        let touchPosCanvas: Vec3 = Utility.getEventLocalPos(this.camera, event, this.canvas.node);
        let touchPosOfNode: Vec3 = Utility.getEventLocalPos(this.camera, event, event.target);
        let diffVec: Vec3 = touchPosOfNode.subtract(this.startTouchPos);
        this.onRelease?.(diffVec, touchPosOfNode, touchPosCanvas);
    }
}


