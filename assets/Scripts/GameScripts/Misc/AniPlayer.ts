import { _decorator, Component, Node, Animation, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AniPlayer')
export class AniTest extends Component {
    public play(event: EventTouch, customEventData: string) {
        this.getComponent(Animation).play(customEventData);
    }
}


