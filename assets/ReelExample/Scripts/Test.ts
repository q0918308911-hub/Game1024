import { _decorator, Component, Input, input, KeyCode, Node, Animation, AnimationState } from 'cc';
import { ActionEventPlayer } from '../../Arts/Tools/FXControl/Script/Event/ActionEventPlayer';
import { ActionEvent } from '../../Arts/Tools/FXControl/Script/Event/ActionEvent';
import { ActionEventType, AnimPlayParams } from '../../Arts/Tools/FXControl/Script/Event/ActionEventType';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {
    private aep: ActionEventPlayer;
    start() {
        this.aep = this.getComponent(ActionEventPlayer);
        let winEvent = new ActionEvent();
        winEvent.frame = 0;
        winEvent.eventType = ActionEventType.ANIM_PLAY;
        winEvent.animPlayParams = new AnimPlayParams(["Root", "Connect", "false"]);

        this.aep.EventList.push(winEvent);

        input.on(Input.EventType.KEY_DOWN, (event) => {
            if (event.keyCode === KeyCode.KEY_A) {
                this.aep.updateClip();
                this.aep.play();
            }

            if (event.keyCode === KeyCode.KEY_B) {
                let appearEvent = this.aep.EventList[0];
                appearEvent.frame = 2;
                appearEvent.eventType = ActionEventType.ANIM_PLAY;
                appearEvent.animPlayParams = new AnimPlayParams(["Root", "Appear", "false"]);

                // this.aep.EventList.push(appearEvent);
            }
        })
    }
}


