import { _decorator, Component, Node, UITransform } from 'cc';
import { IWindowResize, Orientation } from 'db://assets/Scripts/ModuleEntry';

const { ccclass, property } = _decorator;

@ccclass('AutoOrientWithResizeAndMove')
export class AutoOrientWithResizeAndMove extends IWindowResize {

    @property({ type: Node, visible: true, tooltip: 'slotMachineNodeForUiTransform' })
    protected _targetTransformNode: Node = null;
    @property([Node])
    public landscape: Node[] = [];

    @property([Node])
    public portrait: Node[] = [];

    protected _currentOrientation: Orientation = null;

    public override onWindowResize(orientation: Orientation): void {

        if (this._currentOrientation === orientation) return; // 如果當前方向與新方向相同，則不進行任何操作
        this._currentOrientation = orientation; // 更新當前方向

        if (orientation === Orientation.Landscape) {
            this.changeToLandscape();
        }
        else if (orientation === Orientation.Portrait) {
            this.changeToPortrait();
        }
        this.otherProcessForOrientation(orientation);

    }
    //--to override it
    protected otherProcessForOrientation(orientation?: Orientation): void {
        if (this._targetTransformNode) {
            const targetUITransform = this._targetTransformNode.getComponent(UITransform);
            const contentSize = targetUITransform.contentSize;
            const target = this.portrait[0].children[0] || this.landscape[0].children[0];
            if (target) {
                const targetTransform = target.getComponent(UITransform);
                targetTransform.setContentSize(contentSize.width, contentSize.height);
            }
        }

    }

    private moveTargetTo(target: Node, container: Node): void {
        if (!target || !container) return;
        target.removeFromParent(); // 強制脫離當前 parent
        container.addChild(target);
        target.setPosition(0, 0, 0);
    }

    protected changeToLandscape(): void {
        //--很確定裡面只會裝一個才這樣寫的
        const target = this.portrait[0].children[0] || this.landscape[0].children[0];
        if (target) {
            const landscapeNode = this.landscape[0];
            const portraitNode = this.portrait[0];
            landscapeNode.active = true;
            portraitNode.active = false;
            this.moveTargetTo(target, landscapeNode);
        }
    }

    protected changeToPortrait(): void {

        const target = this.portrait[0].children[0] || this.landscape[0].children[0];
        if (target) {
            const landscapeNode = this.landscape[0];
            const portraitNode = this.portrait[0];
            portraitNode.active = true;
            landscapeNode.active = false;
            this.moveTargetTo(target, portraitNode);
        }

    }

}


