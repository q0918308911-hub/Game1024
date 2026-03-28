import { _decorator, Animation, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AniAutoPlay')
export class AniAutoPlay extends Component {
    onEnable(): void {
        this.getComponent(Animation).play(this.getComponent(Animation).defaultClip.name);
    }

    onDisable(): void {
        this.getComponent(Animation).stop();
    }
}


