import { _decorator, Component, Label, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MemoryMonitor')
export class MemoryMonitor extends Component {

    @property(Label)
    textField: Label;

    @property(Node)
    bg: Node;

    start() {

    }

    update(deltaTime: number) {
        this.updateInfo();
    }

    private updateInfo() {
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            let info = `Heap Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`
            info += `Heap Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`
            info += `Heap Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
            this.textField.string = info;
            this.bg.getComponent(UITransform).height = this.textField.node.getComponent(UITransform).height + 20;
            this.bg.getComponent(UITransform).width = this.textField.node.getComponent(UITransform).width + 20;
        }
    }


}


