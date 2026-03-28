import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestComponent')
export class TestComponent extends Component {

    onLoad(): void {
        console.log(`${this.node.name} TestComponent onLoad`);
    }

    start() {
        console.log(`${this.node.name} TestComponent start`);
    }

    update(deltaTime: number) {

    }

    onEnable(): void {
        console.log(`${this.node.name} TestComponent onEnable`);
    }

    onDisable(): void {
        console.log(`${this.node.name} TestComponent onDisable`);
    }
}


