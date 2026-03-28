import { DYN_NODE_PROPERTIES } from './Definitions/AnimationDataOptions';
import { AnimationPrefabPropertyDef } from './Definitions/AnimationPrefabPropertyDef';
import { IAnimationControl } from './Definitions/IAnimationControl';
//import { AniSysTools } from './AniTools/AniSysTools';
import { AnimationController } from './Components/AnimationController';
import { SpineController } from './Components/SpineController';
import { CustomAnimationController } from './Components/CustomAnimationController';
import { MultiSpineController } from './Components/MultiSpineController';
import { AnimationStateType } from './Components/AniStateLists/AnimationPlayStateBase';
import { AniCtrlPropDef, SpineCtrlPropDef } from './Components/AniStateLists/AnimationPlayStateBase';

export {
    DYN_NODE_PROPERTIES,
    AnimationPrefabPropertyDef,
    //AniSysTools,
    AnimationController,
    SpineController,
    CustomAnimationController,
    MultiSpineController,
    AnimationStateType,
    AniCtrlPropDef,
    SpineCtrlPropDef
    //AniSysTools

}
//--interface
export type {
    IAnimationControl,

}