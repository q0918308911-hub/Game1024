import { _decorator, Component, log, Node } from 'cc';
import { Debug } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('AniEventTest')
export class AniEventTest extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    public onAniEvent() {
        Debug.Log("onAniEvent call !!!");
    }
}


