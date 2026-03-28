import { _decorator, CCBoolean, Component, Node, Vec3 } from 'cc';
import { Orientation } from '../../GameScripts/Definition';

const { ccclass, property } = _decorator;

@ccclass('RotationResize')
export class RotationResize extends Component {

    @property(CCBoolean)
    public setToRefChild: boolean = true;

    @property(Node)
    public refLandscape: Node;

    @property(Node)
    public refPortrait: Node;


    public onRotationResize: (orientation: Orientation) => void = null;


    public resetPosition(orientation: Orientation): void {
        if (orientation === Orientation.Landscape) {
            if (this.refLandscape) {
                if (this.setToRefChild) {
                    this.node.setParent(this.refLandscape);
                    this.node.setPosition(Vec3.ZERO);
                    this.node.setScale(Vec3.ONE);
                }
                else {
                    this.node.setPosition(this.refLandscape.position);
                    this.node.setScale(this.refLandscape.scale);
                }
            }
        }
        else if (orientation === Orientation.Portrait) {
            if (this.refPortrait) {
                if (this.setToRefChild) {
                    this.node.setParent(this.refPortrait);
                    this.node.setPosition(Vec3.ZERO);
                    this.node.setScale(Vec3.ONE);
                }
                else {
                    this.node.setPosition(this.refPortrait.position);
                    this.node.setScale(this.refPortrait.scale);
                }
            }
        }

    }

}


