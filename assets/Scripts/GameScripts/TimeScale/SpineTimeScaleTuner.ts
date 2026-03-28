import { _decorator, CCString, Component, Node, sp } from 'cc';
import { GameTimeScale } from './GameTimeScale';
const { ccclass, property } = _decorator;

@ccclass('SpineTimeScaleTuner')
export class SpineTimeScaleTuner extends Component {
    @property(CCString)
    public tuneAnimationName: string[] = [];

    private spineSkeletons: sp.Skeleton;

    public tuneAnimationByTimeScale(gameTimeScale: number = GameTimeScale.timeScale): void {
        this.spineSkeletons = this.getComponent(sp.Skeleton);
        if (this.spineSkeletons) {
            let tracks = this.spineSkeletons.getState()?.tracks;
            if (tracks) {
                for (let trackItem of tracks) {
                    if (trackItem && trackItem.animation && this.tuneAnimationName.includes(trackItem.animation.name)) {
                        trackItem.timeScale = 1 / gameTimeScale;
                    }
                }
            }
        }
    }
}


