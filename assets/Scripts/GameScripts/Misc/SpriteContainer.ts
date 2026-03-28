import { _decorator, Component, error, Node, Sprite, SpriteFrame } from 'cc';
// import { Debug } from '../../../Scripts/Utils/Debug';
const { ccclass, property } = _decorator;

@ccclass('SpriteContainer')
export class SpriteContainer extends Component {

    @property(SpriteFrame)
    private spriteFrameList: SpriteFrame[] = []


    SetSprite(id: number) {
        if (id < 0 || id > 11) {
            // Debug.LogError("出現錯誤的IconID")
        }
        this.getComponent(Sprite).spriteFrame = this.spriteFrameList[id];
    }


}


