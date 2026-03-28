import { _decorator, Component, Node, Animation, sp, CCBoolean } from 'cc';
import { ActionEventPlayer } from '../../Arts/Tools/FXControl/Script/Event/ActionEventPlayer';
import { ActionEventType } from '../../Arts/Tools/FXControl/Script/Event/ActionEventType';
import { NodeExt } from '../../Scripts/ModuleEntry';

const { ccclass, property } = _decorator;

@ccclass('SymbolControllerExample')
export class SymbolControllerExample extends Component {
    @property(ActionEventPlayer)
    public aep: ActionEventPlayer;

    @property(CCBoolean)
    public isSprite: boolean = false;

    public init(defaultAnim: string): void {
        this.aep = this.getComponent(ActionEventPlayer);

        if (!this.aep) {
            this.isSprite = true;
        }
        else {
            this.aep.Init(); //要先初始化才能播放default動畫

            if (defaultAnim !== '') {
                this.playAnim(defaultAnim);
            }
        }
    }

    public playAnim(animName: string): void {
        if (this.isSprite) {
            return;
        }

        let eventList = this.aep.EventList;

        for (let index = 0; index < eventList.length; index++) {
            let event = eventList[index];
            let eventType = event.eventType;
            let params;

            if (eventType === ActionEventType.ANIM_PLAY) {
                params = event.animPlayParams;
                params.clipName = animName;
                event.animPlayParams = params;
            }
            else if (eventType === ActionEventType.SPINE_PLAY) {
                params = event.spinePlayParams;
                params.clipName = animName;
                event.spinePlayParams = params;
            }
        }

        this.aep.updateClip();
        this.aep.play();
    }

    public stopAnim(defaultAnim: string = null): void {
        if (this.isSprite) {
            return;
        }

        for (let index = 0; index < this.aep.EventList.length; index++) {
            const event = this.aep.EventList[index];

            if (event.eventType === ActionEventType.ANIM_PLAY) {
                let nodeName = event.animPlayParams.nodeName;
                let names = nodeName.replace(/\s/g, "").split(',');

                for (let index = 0; index < names.length; index++) {
                    const nodeName = names[index];
                    let animList = NodeExt.findNodes(this.node, nodeName);

                    if (animList.length > 0) {
                        let anim = animList[0].getComponent(Animation);

                        if (anim) {
                            anim.stop();

                            if (defaultAnim !== null) {
                                anim.play(defaultAnim);
                            }
                        }
                    }
                }
            }
            else if (event.eventType === ActionEventType.SPINE_PLAY) {
                let nodeName = event.spinePlayParams.nodeName;
                let names = nodeName.replace(/\s/g, "").split(',');

                for (let index = 0; index < names.length; index++) {
                    const nodeName = names[index];
                    let spineList = NodeExt.findNodes(this.node, nodeName);

                    if (spineList.length > 0) {
                        let spineComp = spineList[0].getComponent(sp.Skeleton);

                        if (spineComp) {
                            spineComp.setToSetupPose();
                        }
                    }
                }
            }
        }
    }
}


