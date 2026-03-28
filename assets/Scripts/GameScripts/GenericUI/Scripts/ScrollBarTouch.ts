import { _decorator, Camera, Canvas, Component, director, EventTouch, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScrollBarTouch')
export class ScrollBarTouch extends Component {

    private camera: Camera = null;
    private trans: UITransform = null;
    public onScrollBarTouchMoveCallback: (ratio: number) => void = null;

    public init() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.camera = director.getScene().getComponentInChildren(Canvas).cameraComponent;
        this.trans = this.getComponent(UITransform);
    }

    private onTouchMove(event: EventTouch) {
        let height = this.trans.contentSize.height;
        let touchPos: Vec3 = event.getLocation().toVec3();
        let localPos: Vec3 = new Vec3();
        let worldPoint = this.camera.screenToWorld(touchPos); //世界座標
        this.trans.convertToNodeSpaceAR(worldPoint, localPos);
        let yPos: number = Math.floor(localPos.y);
        yPos = yPos * -1;
        if (yPos < 0) {
            yPos = 0;
        } else if (yPos > height) {
            yPos = height;
        }
        let ratio = yPos / height

        this.onScrollBarTouchMoveCallback?.(ratio);
    }

    public setHeight(height: number) {
        this.trans.setContentSize(this.trans.width, height);
    }

    public getHeight(): number {
        return this.trans.height;
    }
}


