import { _decorator, AudioClip, Component, SpriteFrame } from 'cc';
import { Debug, KeySpriteFramePair } from '../../../Utils/Core';

const { ccclass, property } = _decorator;

@ccclass('GenericUIRes')
export class GenericUIRes extends Component {

    @property(AudioClip)
    public genericSoundAudioClipList: AudioClip[] = []

    @property([KeySpriteFramePair])
    bottomTextSpriteFrameMaps: KeySpriteFramePair[] = []

    @property(SpriteFrame)
    fromBtnNormal: SpriteFrame;

    @property(SpriteFrame)
    fromBtnHover: SpriteFrame;

    @property(SpriteFrame)
    fromBtnSelected: SpriteFrame;

    @property(SpriteFrame)
    flashOnSprite: SpriteFrame;

    @property(SpriteFrame)
    flashOffSprite: SpriteFrame;

    @property(SpriteFrame)
    flashOffHover: SpriteFrame;

    @property(SpriteFrame)
    newFlash_0: SpriteFrame;

    @property(SpriteFrame)
    newFlash_0_hover: SpriteFrame;

    @property(SpriteFrame)
    newFlash_1: SpriteFrame;

    @property(SpriteFrame)
    newFlash_1_hover: SpriteFrame;

    @property(SpriteFrame)
    newFlash_2: SpriteFrame;

    @property(SpriteFrame)
    newFlash_2_hover: SpriteFrame;

    @property(SpriteFrame)
    newFlash_press: SpriteFrame;

    @property(SpriteFrame)
    spinArrowNormal: SpriteFrame;

    @property(SpriteFrame)
    spinArrowDisabled: SpriteFrame;

    @property(SpriteFrame)
    stopIconNormal: SpriteFrame;

    @property(SpriteFrame)
    stopIconDisabled: SpriteFrame;

    @property(SpriteFrame)
    autoBtnNormal: SpriteFrame;

    @property(SpriteFrame)
    autoBtnHover: SpriteFrame;

    @property(SpriteFrame)
    autoBtnUIOpen: SpriteFrame;

    @property(SpriteFrame)
    autoBtnDisabled: SpriteFrame;

    @property(SpriteFrame)
    betBtnNormal: SpriteFrame;

    @property(SpriteFrame)
    betBtnHover: SpriteFrame;

    @property(SpriteFrame)
    betBtnUIOpen: SpriteFrame;

    @property(SpriteFrame)
    betBtnDisabled: SpriteFrame;

    @property(SpriteFrame)
    newBetBtnNormal: SpriteFrame;

    @property(SpriteFrame)
    newBetBtnHover: SpriteFrame;

    @property(SpriteFrame)
    newBetBtnUIOpen: SpriteFrame;

    @property(SpriteFrame)
    newBetBtnDisabled: SpriteFrame;


    @property(SpriteFrame)
    soundOn: SpriteFrame;

    @property(SpriteFrame)
    soundOnPress: SpriteFrame;

    @property(SpriteFrame)
    soundOff: SpriteFrame;

    @property(SpriteFrame)
    soundOffHover: SpriteFrame;

    @property(SpriteFrame)
    soundOffPress: SpriteFrame;

    @property(SpriteFrame)
    autoFormBtnNormal: SpriteFrame;

    @property(SpriteFrame)
    autoFormBtnHover: SpriteFrame;

    @property(SpriteFrame)
    autoFormBtnSelected: SpriteFrame;

    @property(SpriteFrame)
    autoFormBtnHold: SpriteFrame;

    private static _instance: GenericUIRes = null;

    public static get instance(): GenericUIRes {
        if (this._instance === null) {
            Debug.LogError("GenericUIRes _instance 為空");
        }
        return this._instance;
    }



    init(): void {
        GenericUIRes._instance = this.node.getComponent(GenericUIRes);
    }
}


