import { _decorator, CCBoolean, Component, Node, log, screen } from 'cc';
import { Orientation } from '../../GameScripts/Definition';

const { ccclass, property } = _decorator;

@ccclass('AutoOrientation')
export class AutoOrientation extends Component {

    @property(CCBoolean)
    public switchChild: boolean = false;

    @property([Node])
    public landscape: Node[] = [];

    @property([Node])
    public portrait: Node[] = [];

    public onResizeCall: (orientation: Orientation) => void = null;

    public onResize(orientation: Orientation): void {
        if (orientation === Orientation.Landscape) {
            this.changeToLandscape();
        }
        else if (orientation === Orientation.Portrait) {
            this.changeToPortrait();
        }
        if (this.onResizeCall) {
            this.onResizeCall(orientation);
        }
    }

    private changeToLandscape(): void {
        for (let i = 0; i < this.landscape.length; i += 1) {
            const landscapeNode = this.landscape[i];
            const portraitNode = this.portrait[i];
            // 注意順序
            landscapeNode.active = true;
            if (this.switchChild) {
                while (portraitNode.children.length !== 0) {
                    portraitNode.children[0].parent = landscapeNode;
                }
            }
            portraitNode.active = false;
        }
    }

    private changeToPortrait(): void {
        for (let i = 0; i < this.landscape.length; i += 1) {
            const landscapeNode = this.landscape[i];
            const portraitNode = this.portrait[i];
            // 注意順序
            portraitNode.active = true;
            if (this.switchChild) {
                while (landscapeNode.children.length !== 0) {
                    // log(`切換${landscapeNode.children[0].name} to ${portraitNode.name}`);
                    landscapeNode.children[0].parent = portraitNode;
                }
            }
            landscapeNode.active = false;
        }
    }


}
