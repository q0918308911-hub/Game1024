import '../../Lib/externalDefinitions'; // 將自行定義的函式加入到全域範圍

import { _decorator, Component, Node, sys, screen, log, TextAsset, SpriteFrame, Asset, js, Enum, RichText, Event, Prefab, instantiate, Vec3, EventTouch, Button, CCInteger, UIRenderer, Camera, Layers, tween, Sprite, Material, ParticleSystem, Animation, RenderTexture, view, director, Canvas, gfx, input, Input, Touch, UITransform, v3, JsonAsset, EventHandler } from 'cc';
import { Utility } from '../../Scripts/ModuleEntry';
class ClassA {
    constructor() {
        js.setClassName('ClassA', ClassA);
    }
}

const { ccclass, property } = _decorator;

@ccclass('BasicTest')
export class BasicTest extends Component {

    @property(Button)
    btn1: Button

    @property(Button)
    btn2: Button

    @property(Node)
    btn3: Node

    @property(Button)
    btn4: Button

    @property(Node)
    btnGroup: Node

    @property(JsonAsset)
    jsonData: JsonAsset

    cc: number = 100;

    testtest: Function;
    start() {
        Utility.addEventHandlerToButton(this.btn1.node, this, 'onBtnClick');

    }

    update(deltaTime: number) {

    }

    onBtnClick() {
        console.log("onBtnClick1");
        alert("onBtnClick1");


    }

    onBtnClick2() {
        // this.btn1.node.emit(Button.EventType.CLICK, this);
        this.btn1.emitEvents();
    }

    onBtnClick3() {
        console.log("onBtnClick3");
    }

    onBtnClick4() {
        console.log("onBtnClick4");

    }

    onKeyDownOrPressing() {
        // this.btn3.emit(Node.EventType.TOUCH_START);

        this.btnGroup.active = !this.btnGroup.active;


    }

    private fakeClick(targetNode: Node) {
        let changedTouches: Touch[] = [];
        let touch = new EventTouch(changedTouches, true, Node.EventType.TOUCH_CANCEL);
        touch.type = Node.EventType.TOUCH_CANCEL;
        touch.target = targetNode;
        let touchPoint: Vec3 = new Vec3();
        targetNode.getComponent(UITransform).convertToNodeSpaceAR(v3(100, 100, 0), touchPoint); // 替换为触摸位置
        touch.setLocation(touchPoint.x, touchPoint.y);
        targetNode.dispatchEvent(touch);
    }

    private fakeClick2(targetNode: Node) {
        let changedTouches: Touch[] = [];
        let touch = new EventTouch(changedTouches, true, Node.EventType.TOUCH_END);
        touch.type = Node.EventType.TOUCH_END;
        touch.target = targetNode;
        let touchPoint: Vec3 = new Vec3();
        targetNode.getComponent(UITransform).convertToNodeSpaceAR(v3(100, 100, 0), touchPoint); // 替换为触摸位置
        touch.setLocation(touchPoint.x, touchPoint.y);
        targetNode.dispatchEvent(touch);
    }
}
