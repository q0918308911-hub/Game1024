import { _decorator, Color, Component, instantiate, Node, Prefab, random, randomRange, Sprite, Vec3 } from 'cc';
import { UniMovement } from './UniMovement';
import { EaseType } from '../../../../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('MovementTest')
export class MovementTest extends Component {

    @property(Prefab)
    public prefab: Prefab;

    private movements: UniMovement[] = null;
    private interval: number = 0.1;

    start() {
        this.movements = [];
        for (let i = 0; i < 6; i++) {
            let icon = instantiate(this.prefab);
            icon.setParent(this.node);
            icon.position = new Vec3(0, i * 100 + 100, 0);
            icon.getComponent(Sprite).color = new Color(randomRange(0, 255), randomRange(0, 255), randomRange(0, 255), 255);
            this.movements.push(icon.getComponent(UniMovement));
        }
        /*
        this.movements[0].OnMoveStart = this.logStart.bind(this);
        this.movements[0].OnMoveComplete = this.logComplete.bind(this);
        this.movements[0].moveBy(new Vec3(0.0, 100.0, 0.0), 1.0, EaseType.Linear);
        this.movements[0].addCallback(this.f1);
        this.movements[0].moveBy(new Vec3(100.0, 0.0, 0.0), 0.01, EaseType.Linear);
        this.movements[0].moveBy(new Vec3(-100.0, 0.0, 0.0), 0.033, EaseType.Linear);
        this.movements[0].moveBy(new Vec3(100.0, 0.0, 0.0), 0.01, EaseType.Linear);
        this.movements[0].moveBy(new Vec3(-100.0, 0.0, 0.0), 0.01, EaseType.Linear);
        this.movements[0].addCallback(this.f2);
        this.movements[0].addCallback(this.f3);
        this.movements[0].moveBy(new Vec3(0.0, -100.0, 0.0), 1.0, EaseType.Linear);
        */

        this.movements[0].onMoveStart = this.logStart.bind(this);
        this.movements[0].onMoveComplete = this.logComplete.bind(this);
        this.rollonce();
    }

    logStart(p: UniMovement) {
        console.log('MoveStart ' + p.curParam.cmdType);
    }

    logComplete(p: UniMovement) {
        console.log('MoveComplete ' + p.curParam.cmdType);
    }

    f1() {
        console.log('f1');
    }

    f2() {
        console.log('f2');
    }

    f3() {
        console.log('f3');
    }

    rollonce(): void {
        for (let i = 0; i < this.movements.length; i++) {
            this.movements[i].moveBy(new Vec3(0, -100, 0), this.interval, EaseType.Linear);
            this.movements[i].addCallback(this.checkPos);
            if (i === 0) {
                this.movements[i].onLastMoveComplete = this.rollComplete.bind(this);
            }
        }
    }

    checkPos(m: UniMovement) {
        if (m.node.position.y <= -100) {
            m.node.setPosition(new Vec3(0, 5 * 100, 0));
        }
    }

    rollComplete(move: UniMovement): void {
        this.rollonce();
    }

    update(deltaTime: number) {

    }
}


