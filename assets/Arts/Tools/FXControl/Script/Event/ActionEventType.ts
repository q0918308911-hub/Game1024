import { _decorator, CCBoolean, CCFloat, CCInteger, CCString, Color, Enum } from 'cc';
import { EaseType, StringExt } from 'db://assets/Scripts/ModuleEntry';

const { ccclass, property } = _decorator;

export enum ActionEventType {
    NONE = 0,

    //Animation
    ANIM_PLAY,
    ANIM_STOP,
    ANIM_PAUSE,
    ANIM_RESUME,

    //SPINE操作
    SPINE_PLAY,
    SPINE_PAUSE,
    SPINE_CONTINUE,
    SPINE_RESET,
    SPINE_CLEARTRACK,
    SPINE_SET_TO_SETUP_POSE,
    SPINE_CLEAR_ANIMATION,
    SPINE_FADING,
    SPINE_RESET_SLOT,
    SPINE_MIX,
    SPINE_ADD,
    SPINE_TIMESCALE,
    SPINE_TRACK_TIMESCALE,
    SPINE_ALPHA,

    //Node操作
    NODE_ACTIVE,
    NODE_EVENT,

    //UI OPACITY
    UI_OPACITY,

    //Skeleton Animation
    SK_ANIM_PLAY,
    SK_ANIM_STOP,
    //todo : 目前PAUSE與RESUME無效，待查底層問題
    SK_ANIM_PAUSE,
    SK_ANIM_RESUME,

    //Particle
    PARTICLE_PLAY,
    PARTICLE_STOP,
    PARTICLE_STOPEMITT,
    PARTICLE_RESET,
    PARTICLE_PAUSE,
    PARTICLE_CLEAR,
    PARTICLE_TINT_COLOR,
    PARTICLE_CAPACITY,
    PARTICLE_RATE_OVER_TIME,

    //Particle2D
    /*
    PARTICLE_2D_PLAY,
    PARTICLE_2D_STOPEMITT,
    PARTICLE_2D_RESET,
    */
}

//處理Node Name參數
@ccclass('EventParamsBase')
export class EventParamsBase {
    @property({ tooltip: '要控制的Node名稱' })
    nodeName: string = "";

    public constructor(params: string[]) {
        this.FromStrings(params);
    }

    public FromStrings(params: string[]): boolean {
        if (params.length < 1) {
            return false;
        }
        this.nodeName = params[0];
        return true;
    }

    public ToStrings(): string[] {
        return [this.nodeName];
    }
}

//#region spine

@ccclass('SpinePlayParams')
export class SpinePlayParams extends EventParamsBase {
    @property(CCString)
    clipName: string = '';

    @property(CCBoolean)
    loop: boolean = false;

    @property(CCInteger)
    track: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    public FromStrings(params: string[]): boolean {
        if (params.length != 4) {
            return false;
        }
        let ttrack = StringExt.ToNumber(params[3]);
        if (ttrack[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.clipName = params[1];
        this.loop = StringExt.ToBoolean(params[2]);
        this.track = ttrack[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.clipName, this.loop ? 'true' : 'false', String(this.track)];
    }
}

@ccclass('SpineResetSlotParams')
export class SpineResetSlotParams extends EventParamsBase {
}

@ccclass('SpinePauseParams')
export class SpinePauseParams extends EventParamsBase {
}

@ccclass('SpineContinueParams')
export class SpineContinueParams extends EventParamsBase {
}

@ccclass('SpineResetParams')
export class SpineResetParams extends EventParamsBase {
}

@ccclass('SpineClearTrackParams')
export class SpineClearTrackParams extends EventParamsBase {
    @property(CCInteger)
    track: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 2) {
            return false;
        }
        let ttrack = StringExt.ToNumber(params[1]);
        if (ttrack[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.track = ttrack[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.track)];
    }
}

@ccclass('SpineSetToSetupPoseParams')
export class SpineSetToSetupPoseParams extends EventParamsBase {
}

@ccclass('SpineClearAnimationParams')
export class SpineClearAnimationParams extends EventParamsBase {
    @property(CCInteger)
    track: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 2) {
            return false;
        }
        let ttrack = StringExt.ToNumber(params[1]);
        if (ttrack[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.track = ttrack[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.track)];
    }
}

@ccclass('SpineFadingParams')
export class SpineFadingParams extends EventParamsBase {
    @property(CCFloat)
    alphaTo: number = 255.0;

    @property(CCFloat)
    duration: number = 1.0;

    @property({ type: Enum(EaseType) })
    easeType: EaseType = EaseType.Linear;

    @property({ tooltip: '是否在結束時關閉' })
    disableOnEnd: boolean = false;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 5) {
            return false;
        }
        let talpha = StringExt.ToNumber(params[1]);
        let tduration = StringExt.ToNumber(params[2]);
        let teasyType = StringExt.ToNumber(params[3]);
        let tdisableOnEnd = StringExt.ToBoolean(params[4]);
        if (talpha[0] === false || tduration[0] === false || teasyType[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.alphaTo = talpha[1];
        this.duration = tduration[1];
        this.easeType = teasyType[1] as EaseType;
        this.disableOnEnd = tdisableOnEnd;
        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.alphaTo), String(this.duration), String(this.easeType), this.disableOnEnd ? 'true' : 'false'];
    }
}

@ccclass('SpineMixParams')
export class SpineMixParams extends EventParamsBase {
    @property(CCString)
    fromAnim: string = '';

    @property(CCString)
    toAnim: string = '';

    @property
    duration: number = 0.0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    public FromStrings(params: string[]): boolean {
        if (params.length != 4) {
            return false;
        }
        let tduration = StringExt.ToNumber(params[3]);

        this.nodeName = params[0];
        this.fromAnim = params[1];
        this.toAnim = params[2];
        this.duration = tduration[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.fromAnim, this.toAnim, String(this.duration)];
    }
}

@ccclass('SpineAddParams')
export class SpineAddParams extends EventParamsBase {
    @property(CCString)
    clipName: string = '';

    @property(CCBoolean)
    loop: boolean = false;

    @property
    track: number = 0;

    @property
    delayTime: number = 0.0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    public FromStrings(params: string[]): boolean {
        if (params.length != 5) {
            return false;
        }


        this.nodeName = params[0];
        this.clipName = params[1];
        this.loop = StringExt.ToBoolean(params[2]);
        let ttrack = StringExt.ToNumber(params[3]);
        if (ttrack[0] === false) {
            return false;
        }
        this.track = ttrack[1];
        let tdelayTime = StringExt.ToNumber(params[4]);
        if (tdelayTime[0] === false) {
            return false;
        }
        this.delayTime = tdelayTime[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.clipName, this.loop ? 'true' : 'false', String(this.track), String(this.delayTime)];
    }
}

@ccclass('SpineTimeScaleParams')
export class SpineTimeScaleParams extends EventParamsBase {
    @property
    scale: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 2) {
            return false;
        }
        let tscle = StringExt.ToNumber(params[1]);
        if (tscle[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.scale = tscle[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.scale)];
    }
}

@ccclass('SpineTrackTimeScaleParams')
export class SpineTrackTimeScaleParams extends EventParamsBase {
    @property(CCInteger)
    track: number = 0;

    @property
    scale: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 3) {
            return false;
        }

        let ttrack = StringExt.ToNumber(params[1]);
        if (ttrack[0] === false) {
            return false;
        }

        let tscale = StringExt.ToNumber(params[2]);
        if (tscale[0] === false) {
            return false;
        }

        this.nodeName = params[0];
        this.track = ttrack[1];
        this.scale = tscale[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.track), String(this.scale)];
    }
}

@ccclass('SpineAlphaParams')
export class SpineAlphaParams extends EventParamsBase {
    @property(CCInteger)
    track: number = 0;

    @property
    alpha: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 3) {
            return false;
        }

        let ttrack = StringExt.ToNumber(params[1]);
        if (ttrack[0] === false) {
            return false;
        }

        let talpha = StringExt.ToNumber(params[2]);
        if (talpha[0] === false) {
            return false;
        }

        this.nodeName = params[0];
        this.track = ttrack[1];
        this.alpha = talpha[1];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.track), String(this.alpha)];
    }
}


//#endregion

//#region node & opacity
@ccclass('NodeActiveParams')
export class NodeActiveParams extends EventParamsBase {
    @property(CCBoolean)
    active: boolean = false;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 2) {
            return false;
        }
        this.nodeName = params[0];
        this.active = StringExt.ToBoolean(params[1]);

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.active ? 'true' : 'false'];
    }
}

@ccclass('NodeEventParams')
export class NodeEventParams extends EventParamsBase {
    @property(CCString)
    eventName: string = '';

    @property(CCString)
    arg0: string = '';

    @property(CCString)
    arg1: string = '';

    @property(CCString)
    arg2: string = '';

    @property(CCString)
    arg3: string = '';

    @property(CCString)
    arg4: string = '';

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length < 2) {
            return false;
        }
        this.nodeName = params[0];
        this.eventName = params[1];
        this.arg0 = params[2];
        this.arg1 = params[3];
        this.arg2 = params[4];
        this.arg3 = params[5];
        this.arg4 = params[6];

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.eventName, this.arg0, this.arg1, this.arg2, this.arg3, this.arg4];
    }
}

@ccclass('UIOpacityParams')
export class UIOpacityParams extends EventParamsBase {
    @property(CCFloat)
    alphaTo: number = 255.0;

    @property(CCFloat)
    duration: number = 1.0;

    @property({ type: Enum(EaseType) })
    easeType: EaseType = EaseType.Linear;

    @property(CCBoolean)
    disableOnEnd: boolean = false;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length != 5) {
            return false;
        }
        let talpha = StringExt.ToNumber(params[1]);
        let tduration = StringExt.ToNumber(params[2]);
        let teasyType = StringExt.ToNumber(params[3]);
        let tdisableOnEnd = StringExt.ToBoolean(params[4]);
        if (talpha[0] === false || tduration[0] === false || teasyType[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.alphaTo = talpha[1];
        this.duration = tduration[1];
        this.easeType = teasyType[1] as EaseType;
        this.disableOnEnd = tdisableOnEnd;
        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.alphaTo), String(this.duration), String(this.easeType), this.disableOnEnd ? 'true' : 'false'];
    }
}

//#endregion

//#region Animation

@ccclass('AnimPlayParams')
export class AnimPlayParams extends EventParamsBase {
    @property(CCString)
    clipName: string = '';

    @property(CCBoolean)
    loop: boolean = false;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length < 3) {
            return false;
        }

        this.nodeName = params[0];
        this.clipName = params[1];
        this.loop = StringExt.ToBoolean(params[2]);

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.clipName, this.loop ? 'true' : 'false'];
    }
}

@ccclass('AnimStopParams')
export class AnimStopParams extends EventParamsBase {
}

@ccclass('AnimPauseParams')
export class AnimPauseParams extends EventParamsBase {
}

@ccclass('AnimResumeParams')
export class AnimResumeParams extends EventParamsBase {
}

//#endregion

//#region SKAnimation
@ccclass('SKAnimPlayParams')
export class SKAnimPlayParams extends EventParamsBase {
    @property(CCString)
    clipName: string = '';

    @property(CCBoolean)
    loop: boolean = false;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length < 3) {
            return false;
        }

        this.nodeName = params[0];
        this.clipName = params[1];
        this.loop = StringExt.ToBoolean(params[2]);

        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.clipName, this.loop ? 'true' : 'false'];
    }
}

@ccclass('SKAnimStopParams')
export class SKAnimStopParams extends EventParamsBase {
}

@ccclass('SKAnimPauseParams')
export class SKAnimPauseParams extends EventParamsBase {
}

@ccclass('SKAnimResumeParams')
export class SKAnimResumeParams extends EventParamsBase {
}

//#endregion

//#region Particle
@ccclass('ParticlePlayParams')
export class ParticlePlayParams extends EventParamsBase {
    @property(CCBoolean)
    loop: boolean = false;

    @property({ type: CCFloat, tooltip: '目前持續時間並不準確，斟酌使用' })
    duration: number = 1.0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length < 3) {
            return false;
        }
        let tduration = StringExt.ToNumber(params[2]);
        if (tduration[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.loop = StringExt.ToBoolean(params[1]);
        this.duration = tduration[1];
        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, this.loop ? 'true' : 'false', String(this.duration)];
    }
}

@ccclass('ParticleStopParams')
export class ParticleStopParams extends EventParamsBase {
}

@ccclass('ParticleResetParams')
export class ParticleResetParams extends EventParamsBase {
}

@ccclass('ParticlePauseParams')
export class ParticlePauseParams extends EventParamsBase {
}

@ccclass('ParticleClearParams')
export class ParticleClearParams extends EventParamsBase {
}

@ccclass('ParticleStopEmittParams')
export class ParticleStopEmittParams extends EventParamsBase {
}

@ccclass('ParticleTintParams')
export class ParticleTintParams extends EventParamsBase {

    @property(CCFloat)
    duration: number = 1.0;

    @property(Color)
    startTintColor: Color = new Color();

    @property(Color)
    endTintColor: Color = new Color();

    @property({ type: Enum(EaseType) })
    easeType: EaseType = EaseType.Linear;

    @property({ tooltip: '是否在結束時關閉' })
    disableOnEnd: boolean = false;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length !== 6) {
            return false;
        }

        this.nodeName = params[0];
        let tduration = StringExt.ToNumber(params[1]);
        let tstartColor = new Color(params[2]);
        let tendColor = new Color(params[3]);
        let teasyType = StringExt.ToNumber(params[4]);
        let tdisableOnEnd = StringExt.ToBoolean(params[5]);
        if (tduration[0] === false || teasyType[0] === false) {
            return false;
        }

        this.nodeName = params[0];
        this.startTintColor = tstartColor;
        this.endTintColor = tendColor;
        this.duration = tduration[1];
        this.easeType = teasyType[1] as EaseType;
        this.disableOnEnd = tdisableOnEnd;
        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.duration), this.startTintColor.toHEX("#rrggbbaa"), this.endTintColor.toHEX("#rrggbbaa"), String(this.easeType), this.disableOnEnd ? 'true' : 'false'];
    }
}

@ccclass('ParticleCapacityParams')
export class ParticleCapacityParams extends EventParamsBase {
    @property
    capacity: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length < 2) {
            return false;
        }
        let tcapacity = StringExt.ToNumber(params[1]);
        if (tcapacity[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.capacity = tcapacity[1];
        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.capacity)];
    }
}

@ccclass('ParticleRateOverTimeParams')
export class ParticleRateOverTimeParams extends EventParamsBase {
    @property
    rateOverTime: number = 0;

    public constructor(params: string[]) {
        super(params);
        this.FromStrings(params);
    }

    override FromStrings(params: string[]): boolean {
        if (params.length < 2) {
            return false;
        }
        let trateOverTime = StringExt.ToNumber(params[1]);
        if (trateOverTime[0] === false) {
            return false;
        }
        this.nodeName = params[0];
        this.rateOverTime = trateOverTime[1];
        return true;
    }

    override ToStrings(): string[] {
        return [this.nodeName, String(this.rateOverTime)];
    }
}
//#endregion