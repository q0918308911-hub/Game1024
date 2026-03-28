import { _decorator } from "cc";
import { BasicWayAni } from "../IWayAniDef/IWayAniDef";

const WAN_SHOW_ANI_STATE = 'Show';

const { ccclass, property } = _decorator;
@ccclass('NgWayAni')
export class NgWayAni extends BasicWayAni {

    public playWayAni(): void {

        this._wayAniController.playAni({ aniState: WAN_SHOW_ANI_STATE });
    }
    public goBackToDefault(): void {

        this._wayAniController.goBackToDefault();
    }

    public resetWayAni(): void {
        this._wayAniController.goBackToDefault();
    }
}