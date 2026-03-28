import { _decorator, AnimationClip, CCFloat, CCString, Enum } from 'cc';
import { ActionEventType, AnimPauseParams, AnimPlayParams, AnimResumeParams, AnimStopParams, NodeActiveParams, NodeEventParams, ParticleClearParams, ParticleTintParams, ParticlePauseParams, ParticlePlayParams, ParticleResetParams, ParticleStopEmittParams, ParticleStopParams, SKAnimPauseParams, SKAnimPlayParams, SKAnimResumeParams, SKAnimStopParams, SpineClearTrackParams, SpineContinueParams, SpineFadingParams, SpinePauseParams, SpinePlayParams, SpineResetParams, UIOpacityParams, SpineResetSlotParams, SpineMixParams, SpineAddParams, SpineSetToSetupPoseParams, SpineClearAnimationParams, ParticleCapacityParams, SpineAlphaParams, SpineTimeScaleParams, SpineTrackTimeScaleParams, ParticleRateOverTimeParams } from './ActionEventType';
const { ccclass, property } = _decorator;

@ccclass('ActionEvent')
export class ActionEvent implements AnimationClip.IEvent {
    // start time
    @property({ type: CCFloat, visible: true, tooltip: '秒數' })
    frame: number = 0;

    // function name
    @property({ visible: false })
    func: string = "";

    // event type
    @property({ type: Enum(ActionEventType), visible: false })
    _eventType: ActionEventType = ActionEventType.NONE;

    @property({ type: Enum(ActionEventType), visible: true, tooltip: '功能' })
    set eventType(value: ActionEventType) {
        this._eventType = value;
        this.func = ActionEventType[this._eventType];
    }

    get eventType(): ActionEventType {
        return this._eventType;
    }

    //儲存參數
    @property({ type: CCString, visible: false })
    eventParams: string[] = [];

    //for AnimationClip.IEvent
    get params(): string[] {
        return this.eventParams;
    }

    //SPINE PLAY PARAMS
    @property({ type: SpinePlayParams, visible() { return ActionEventType.SPINE_PLAY === (this as ActionEvent)._eventType; } })
    get spinePlayParams(): SpinePlayParams {
        return new SpinePlayParams(this.eventParams);
    }

    set spinePlayParams(value: SpinePlayParams) {
        this.eventParams = value.ToStrings();
    }

    //SPINE PAUSE PARAMS
    @property({ type: SpinePauseParams, visible() { return ActionEventType.SPINE_PAUSE === (this as ActionEvent)._eventType; } })
    get spinePauseParams(): SpinePauseParams {
        return new SpinePauseParams(this.eventParams);
    }

    set spinePauseParams(value: SpinePauseParams) {
        this.eventParams = value.ToStrings();
    }

    //SPINE CONTINUE PARAMS
    @property({ type: SpineContinueParams, visible() { return ActionEventType.SPINE_CONTINUE === (this as ActionEvent)._eventType; } })
    get spineContinueParams(): SpineContinueParams {
        return new SpineContinueParams(this.eventParams);
    }

    set spineContinueParams(value: SpineContinueParams) {
        this.eventParams = value.ToStrings();
    }

    //SPINE RESET PARAMS
    @property({ type: SpineResetParams, visible() { return ActionEventType.SPINE_RESET === (this as ActionEvent)._eventType; } })
    get spineResetParams(): SpineResetParams {
        return new SpineResetParams(this.eventParams);
    }

    set spineResetParams(value: SpineResetParams) {
        this.eventParams = value.ToStrings();
    }

    //SPINE CLEARTRACK PARAMS
    @property({ type: SpineClearTrackParams, visible() { return ActionEventType.SPINE_CLEARTRACK === (this as ActionEvent)._eventType; } })
    get spineClearTrackParams(): SpineClearTrackParams {
        return new SpineClearTrackParams(this.eventParams);
    }

    set spineClearTrackParams(value: SpineClearTrackParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineSetToSetupPoseParams, visible() { return ActionEventType.SPINE_SET_TO_SETUP_POSE === (this as ActionEvent)._eventType; } })
    get spineSetToSetupPoseParams(): SpineSetToSetupPoseParams {
        return new SpineSetToSetupPoseParams(this.eventParams);
    }

    set spineSetToSetupPoseParams(value: SpineSetToSetupPoseParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineClearAnimationParams, visible() { return ActionEventType.SPINE_CLEAR_ANIMATION === (this as ActionEvent)._eventType; } })
    get spineClearAnimationParams(): SpineClearAnimationParams {
        return new SpineClearAnimationParams(this.eventParams);
    }

    set spineClearAnimationParams(value: SpineClearAnimationParams) {
        this.eventParams = value.ToStrings();
    }

    //SPINE FADING PARAMS
    @property({ type: SpineFadingParams, visible() { return ActionEventType.SPINE_FADING === (this as ActionEvent)._eventType; } })
    get spineFadingParams(): SpineFadingParams {
        return new SpineFadingParams(this.eventParams);
    }

    set spineFadingParams(value: SpineFadingParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineResetSlotParams, visible() { return ActionEventType.SPINE_RESET_SLOT === (this as ActionEvent)._eventType; } })
    get spineResetSlotParams(): SpineResetSlotParams {
        return new SpineResetSlotParams(this.eventParams);
    }

    set spineResetSlotParams(value: SpineResetSlotParams) {
        this.eventParams = value.ToStrings();
    }


    @property({ type: SpineMixParams, visible() { return ActionEventType.SPINE_MIX === (this as ActionEvent)._eventType; } })
    get spineMixParams(): SpineMixParams {
        return new SpineMixParams(this.eventParams);
    }

    set spineMixParams(value: SpineMixParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineAddParams, visible() { return ActionEventType.SPINE_ADD === (this as ActionEvent)._eventType; } })
    get spineAddParams(): SpineAddParams {
        return new SpineAddParams(this.eventParams);
    }

    set spineAddParams(value: SpineAddParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineTimeScaleParams, visible() { return ActionEventType.SPINE_TIMESCALE === (this as ActionEvent)._eventType; } })
    get spineTimeScaleParams(): SpineTimeScaleParams {
        return new SpineTimeScaleParams(this.eventParams);
    }

    set spineTimeScaleParams(value: SpineTimeScaleParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineTrackTimeScaleParams, visible() { return ActionEventType.SPINE_TRACK_TIMESCALE === (this as ActionEvent)._eventType; } })
    get spineTrackTimeScaleParams(): SpineTrackTimeScaleParams {
        return new SpineTrackTimeScaleParams(this.eventParams);
    }

    set spineTrackTimeScaleParams(value: SpineTrackTimeScaleParams) {
        this.eventParams = value.ToStrings();
    }

    @property({ type: SpineAlphaParams, visible() { return ActionEventType.SPINE_ALPHA === (this as ActionEvent)._eventType; } })
    get spineAlphaParams(): SpineAlphaParams {
        return new SpineAlphaParams(this.eventParams);
    }

    set spineAlphaParams(value: SpineAlphaParams) {
        this.eventParams = value.ToStrings();
    }

    //NODE ACTIVE PARAMS
    @property({ type: NodeActiveParams, visible() { return ActionEventType.NODE_ACTIVE === (this as ActionEvent)._eventType; } })
    get nodeActiveParams(): NodeActiveParams {
        return new NodeActiveParams(this.eventParams);
    }

    set nodeActiveParams(value: NodeActiveParams) {
        this.eventParams = value.ToStrings();
    }

    //NODE EVENT PARAMS
    @property({ type: NodeEventParams, visible() { return ActionEventType.NODE_EVENT === (this as ActionEvent)._eventType; } })
    get nodeEventParams(): NodeEventParams {
        return new NodeEventParams(this.eventParams);
    }
    set nodeEventParams(value: NodeEventParams) {
        this.eventParams = value.ToStrings();
    }

    //UI OPACITY PARAMS
    @property({ type: UIOpacityParams, visible() { return ActionEventType.UI_OPACITY === (this as ActionEvent)._eventType; } })
    get uIOpacityParams(): UIOpacityParams {
        return new UIOpacityParams(this.eventParams);
    }

    set uIOpacityParams(value: UIOpacityParams) {
        this.eventParams = value.ToStrings();
    }

    //ANIMATION PLAY PARAMS
    @property({ type: AnimPlayParams, visible() { return ActionEventType.ANIM_PLAY === (this as ActionEvent)._eventType; } })
    get animPlayParams(): AnimPlayParams {
        return new AnimPlayParams(this.eventParams);
    }
    set animPlayParams(value: AnimPlayParams) {
        this.eventParams = value.ToStrings();
    }

    //ANIMATION STOP PARAMS
    @property({ type: AnimStopParams, visible() { return ActionEventType.ANIM_STOP === (this as ActionEvent)._eventType; } })
    get animStopParams(): AnimStopParams {
        return new AnimStopParams(this.eventParams);
    }
    set animStopParams(value: AnimStopParams) {
        this.eventParams = value.ToStrings();
    }

    //ANIMATION PAUSE PARAMS
    @property({ type: AnimPauseParams, visible() { return ActionEventType.ANIM_PAUSE === (this as ActionEvent)._eventType; } })
    get animPauseParams(): AnimPauseParams {
        return new AnimPauseParams(this.eventParams);
    }
    set animPauseParams(value: AnimPauseParams) {
        this.eventParams = value.ToStrings();
    }

    //ANIMATION RESUME PARAMS
    @property({ type: AnimResumeParams, visible() { return ActionEventType.ANIM_RESUME === (this as ActionEvent)._eventType; } })
    get animResumeParams(): AnimResumeParams {
        return new AnimResumeParams(this.eventParams);
    }
    set animResumeParams(value: AnimResumeParams) {
        this.eventParams = value.ToStrings();
    }

    //SKELETON ANIMATION PLAY PARAMS
    @property({ type: SKAnimPlayParams, visible() { return ActionEventType.SK_ANIM_PLAY === (this as ActionEvent)._eventType; } })
    get sKAnimPlayParams(): SKAnimPlayParams {
        return new SKAnimPlayParams(this.eventParams);
    }
    set sKAnimPlayParams(value: SKAnimPlayParams) {
        this.eventParams = value.ToStrings();
    }

    //SKELETON ANIMATION STOP PARAMS
    @property({ type: SKAnimStopParams, visible() { return ActionEventType.SK_ANIM_STOP === (this as ActionEvent)._eventType; } })
    get sKAnimStopParams(): SKAnimStopParams {
        return new SKAnimStopParams(this.eventParams);
    }
    set sKAnimStopParams(value: SKAnimStopParams) {
        this.eventParams = value.ToStrings();
    }

    //SKELETON ANIMATION PAUSE PARAMS
    @property({ type: SKAnimPauseParams, visible() { return ActionEventType.SK_ANIM_PAUSE === (this as ActionEvent)._eventType; } })
    get sKAnimPauseParams(): SKAnimPauseParams {
        return new SKAnimPauseParams(this.eventParams);
    }
    set sKAnimPauseParams(value: SKAnimPauseParams) {
        this.eventParams = value.ToStrings();
    }

    //SKELETON ANIMATION RESUME PARAMS
    @property({ type: SKAnimResumeParams, visible() { return ActionEventType.SK_ANIM_RESUME === (this as ActionEvent)._eventType; } })
    get sKAnimResumeParams(): SKAnimResumeParams {
        return new SKAnimResumeParams(this.eventParams);
    }
    set sKAnimResumeParams(value: SKAnimResumeParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE PLAY PARAMS
    @property({ type: ParticlePlayParams, visible() { return ActionEventType.PARTICLE_PLAY === (this as ActionEvent)._eventType; } })
    get particlePlayParams(): ParticlePlayParams {
        return new ParticlePlayParams(this.eventParams);
    }
    set particlePlayParams(value: ParticlePlayParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE STOP PARAMS
    @property({ type: ParticleStopParams, visible() { return ActionEventType.PARTICLE_STOP === (this as ActionEvent)._eventType; } })
    get particleStopParams(): ParticleStopParams {
        return new ParticleStopParams(this.eventParams);
    }
    set particleStopParams(value: ParticleStopParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE PAUSE PARAMS
    @property({ type: ParticlePauseParams, visible() { return ActionEventType.PARTICLE_PAUSE === (this as ActionEvent)._eventType; } })
    get particlePauseParams(): ParticlePauseParams {
        return new ParticlePauseParams(this.eventParams);
    }
    set particlePauseParams(value: ParticlePauseParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE CLEAR PARAMS
    @property({ type: ParticleClearParams, visible() { return ActionEventType.PARTICLE_CLEAR === (this as ActionEvent)._eventType; } })
    get particleClearParams(): ParticleClearParams {
        return new ParticleClearParams(this.eventParams);
    }
    set particleClearParams(value: ParticleClearParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE STOPEMITT PARAMS
    @property({ type: ParticleStopEmittParams, visible() { return ActionEventType.PARTICLE_STOPEMITT === (this as ActionEvent)._eventType; } })
    get particleStopEmittParams(): ParticleStopEmittParams {
        return new ParticleStopEmittParams(this.eventParams);
    }
    set particleStopEmittParams(value: ParticleStopEmittParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE RESET PARAMS
    @property({ type: ParticleResetParams, visible() { return ActionEventType.PARTICLE_RESET === (this as ActionEvent)._eventType; } })
    get particleResetParams(): ParticleResetParams {
        return new ParticleResetParams(this.eventParams);
    }
    set particleResetParams(value: ParticleResetParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE TINT COLOR PARAMS
    @property({ type: ParticleTintParams, visible() { return ActionEventType.PARTICLE_TINT_COLOR === (this as ActionEvent)._eventType; } })
    get particleColorParams(): ParticleTintParams {
        return new ParticleTintParams(this.eventParams);
    }

    set particleColorParams(value: ParticleTintParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE CAPACITY PARAMS
    @property({ type: ParticleCapacityParams, visible() { return ActionEventType.PARTICLE_CAPACITY === (this as ActionEvent)._eventType; } })
    get particleCapacityParams(): ParticleCapacityParams {
        return new ParticleCapacityParams(this.eventParams);
    }
    set particleCapacityParams(value: ParticleCapacityParams) {
        this.eventParams = value.ToStrings();
    }


    //PARTICLE CAPACITY PARAMS
    @property({ type: ParticleRateOverTimeParams, visible() { return ActionEventType.PARTICLE_RATE_OVER_TIME === (this as ActionEvent)._eventType; } })
    get particleRateOverTimeParams(): ParticleRateOverTimeParams {
        return new ParticleRateOverTimeParams(this.eventParams);
    }
    set particleRateOverTimeParams(value: ParticleRateOverTimeParams) {
        this.eventParams = value.ToStrings();
    }

    /*
    //PARTICLE 2D PLAY PARAMS
    @property({ type: ParticlePlayParams, visible() { return ActionEventType.PARTICLE_2D_PLAY === (this as ActionEvent)._eventType; } })
    get particle2DPlayParams(): ParticlePlayParams {
        return new ParticlePlayParams(this.eventParams);
    }
    set particle2DPlayParams(value: ParticlePlayParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE 2D STOPEMITT PARAMS
    @property({ type: ParticleStopEmittParams, visible() { return ActionEventType.PARTICLE_2D_STOPEMITT === (this as ActionEvent)._eventType; } })
    get particle2DStopEmittParams(): ParticleStopEmittParams {
        return new ParticleStopEmittParams(this.eventParams);
    }
    set particle2DStopEmittParams(value: ParticleStopEmittParams) {
        this.eventParams = value.ToStrings();
    }

    //PARTICLE 2D RESET PARAMS
    @property({ type: ParticleResetParams, visible() { return ActionEventType.PARTICLE_2D_RESET === (this as ActionEvent)._eventType; } })
    get particle2DResetParams(): ParticleResetParams {
        return new ParticleResetParams(this.eventParams);
    }
    set particle2DResetParams(value: ParticleResetParams) {
        this.eventParams = value.ToStrings();
    }
    */
}

export const getDuration = function (events: AnimationClip.IEvent[]): number {
    let duration = 0;
    for (let index = 0; index < events.length; index++) {
        const event = events[index];
        if (event.frame > duration) {
            duration = event.frame;
        }
    }
    //avoid duration equals frame time
    return duration + 0.01;
}

