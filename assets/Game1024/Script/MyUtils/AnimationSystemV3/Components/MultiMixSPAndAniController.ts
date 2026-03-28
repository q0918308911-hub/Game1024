import { _decorator } from "cc";
import { CustomAnimationController } from "./CustomAnimationController";
import { SpineController } from "./SpineController";
import { AnimationController } from "./AnimationController";
import { MultiSpineControllerProperties } from "./Properties/MultiSpineControllerProperties";
import { MultiAniControllerProperties } from "./Properties/MultiAniControllerProperties";
const { ccclass, property } = _decorator;

@ccclass('MultiMixSPAndAniController')
export class MultiMixSPAndAniController extends CustomAnimationController{
    
    @property({ type: MultiSpineControllerProperties, visible: true, tooltip: 'multiSpine' })
    private _spCtrlProperties: MultiSpineControllerProperties = new MultiSpineControllerProperties();

    @property({ type: MultiAniControllerProperties, visible: true, tooltip: 'multiSpine' })
    private _aniCtrlsProperties: MultiAniControllerProperties = new MultiAniControllerProperties();
    
    //--TODO----
}