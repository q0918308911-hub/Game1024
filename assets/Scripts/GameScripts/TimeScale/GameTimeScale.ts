
import { game, Game } from 'cc';
import { Debug } from '../../Utils/Core';
import { GenericUIManager, NewFlashModeEnum } from '../GenericUI/Scripts';

export class GameTimeScale {

    static onTimeScaleChangeCallback: () => void = null
    private static _timeScale: number = 1;


    static get timeScale(): number {
        return this._timeScale;
    }

    static set timeScale(value: number) {
        if (value < 0.1 || value > 10) {
            Debug.LogError("setGameTimeScale error: scale must be between 0.1 and 10");
            return;
        }
        this._timeScale = value;
        this.onTimeScaleChangeCallback?.call(this._timeScale);
    }

}

//@ts-ignore
game._calculateDT = function (useFixedDeltaTime: number) {
    //@ts-ignore
    this._useFixedDeltaTime = useFixedDeltaTime;
    if (useFixedDeltaTime) {
        //@ts-ignore
        this._startTime = performance.now();
        return this.frameTime / 1000;
    }
    const now = performance.now();
    //@ts-ignore
    this._deltaTime = now > this._startTime ? (now - this._startTime) / 1000 : 0;
    //@ts-ignore
    if (this._deltaTime > Game.DEBUG_DT_THRESHOLD) {
        //@ts-ignore
        this._deltaTime = this.frameTime / 1000;
    }
    //@ts-ignore
    this._startTime = now;
    //@ts-ignore
    return this._deltaTime * GameTimeScale.timeScale;
};
