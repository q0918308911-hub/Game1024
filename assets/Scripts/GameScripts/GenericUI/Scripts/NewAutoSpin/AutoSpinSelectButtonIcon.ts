import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AutoSpinSelectButtonIcon')
export class AutoSpinSelectButtonIcon extends Component {
    @property(SpriteFrame)
    protected btnNormalSpriteFrame: SpriteFrame = null;

    @property(SpriteFrame)
    protected btnSelectedSpriteFrame: SpriteFrame = null;

    public setNormalStatus(): void {
        this.getComponent(Sprite).spriteFrame = this.btnNormalSpriteFrame;
    }

    public setSelectedStatus(): void {
        this.getComponent(Sprite).spriteFrame = this.btnSelectedSpriteFrame;
    }
}


