import { _decorator, Animation, CCString, Component, Node } from 'cc';
import { GameTimeScale } from './GameTimeScale';
const { ccclass, property } = _decorator;

@ccclass('AnimationTimeScaleTuner')
export class AnimationTimeScaleTuner extends Component {
    @property(CCString)
    public tuneAnimationName: string[] = [];

    private animation: Animation;

    public tuneAnimationByTimeScale(gameTimeScale: number = GameTimeScale.timeScale): void {
        this.animation = this.getComponent(Animation);
        let speed = 1 / gameTimeScale;
        for (let clipName of this.tuneAnimationName) {
            if (this.animation && this.animation.clips) {
                this.animation.setSpeedByClipName(clipName, speed);
            }
        }
    }
}


