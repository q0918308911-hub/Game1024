import { _decorator, Component, Node } from 'cc';
import { Orientation } from 'db://assets/Scripts/GameScripts/Definition';
import { RotationResize, ScreenAdapter } from 'db://assets/Scripts/Utils/Orientation';
const { ccclass, property } = _decorator;

@ccclass('RotateHideNode')
export class RotateHideNode extends Component {

    @property([Node])
    node_L: Node[] = [];

    @property([Node])
    node_P: Node[] = [];

    start() {
        this.node.getComponent(RotationResize).onRotationResize = this.onRotateResize.bind(this);
        this.onRotateResize(ScreenAdapter.UI_Orientation);
    }

    onRotateResize(orientation: Orientation) {
        if (orientation === Orientation.Landscape) {
            for (let i = 0; i < this.node_L.length; i++) {
                this.node_L[i].active = true;
            }
            for (let i = 0; i < this.node_P.length; i++) {
                this.node_P[i].active = false;
            }
        }
        else if (orientation === Orientation.Portrait) {
            for (let i = 0; i < this.node_L.length; i++) {
                this.node_L[i].active = false;
            }
            for (let i = 0; i < this.node_P.length; i++) {
                this.node_P[i].active = true;
            }
        }
    }
}


