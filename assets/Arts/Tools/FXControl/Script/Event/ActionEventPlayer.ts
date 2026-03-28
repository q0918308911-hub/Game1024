import { _decorator, Component, Animation, AnimationClip, AnimationState, ParticleSystem, sp, SkeletalAnimation, UIOpacity, tween, CCBoolean, Color, CurveRange } from 'cc';
import { ActionEvent, getDuration } from './ActionEvent';
import { easeFunctions, NodeExt, SkeletonExtension, StringExt } from 'db://assets/Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

export type AnimDelegate = (eventType: Animation.EventType, state: AnimationState) => void;

@ccclass('ActionEventPlayer')

export class ActionEventPlayer extends Component {
    //debug資訊
    @property({ tooltip: 'log出debug資訊提供檢視' })
    public debug: boolean = false;

    //是否自動初始化在start開始時
    @property({ tooltip: 'start時自動初始化' })
    public AutoInit: boolean = true;

    //是否start時自動撥放
    @property({ tooltip: '是否start時自動撥放' })
    public AutoStart: boolean = false;

    @property({ tooltip: '是否為動畫專用AEP，若勾選擇，則不使用EventList製造新的動畫，並須自行放入要撥放的Clip & 掛上Animation' })
    public IsForAnimationEvent: boolean = false;

    //準備要播放的事件
    @property({ type: [ActionEvent], visible() { return !(this as ActionEventPlayer).IsForAnimationEvent; }, tooltip: '準備要播放的事件類型' })
    public EventList: ActionEvent[] = [];

    @property({ type: AnimationClip, visible() { return (this as ActionEventPlayer).IsForAnimationEvent; }, tooltip: '準備要使用此AEP的Clip' })
    public Clip: AnimationClip = null;

    //animation play callbacks
    public OnAnimEvent: AnimDelegate = null;

    private animation: Animation = null;

    private static readonly EVENT_CLIP_NAME = "actions";

    private curClip: string = "";

    private isInitialized: boolean = false;

    public Init(): void {
        if (this.isInitialized) {
            return;
        }

        this.animation = this.getComponent(Animation);

        if (!this.animation) {
            this.animation = this.node.addComponent(Animation);
        }

        this.animation.on(Animation.EventType.PLAY, this.onPlay, this);
        this.animation.on(Animation.EventType.STOP, this.onStop, this);
        this.animation.on(Animation.EventType.FINISHED, this.onFinished, this);
        this.animation.on(Animation.EventType.LASTFRAME, this.onLastFrame, this);

        if (!this.IsForAnimationEvent) {
            this.addClip();
        }

        this.isInitialized = true;
    }

    private addClip() {
        let clip = this.genEventClip(ActionEventPlayer.EVENT_CLIP_NAME, this.EventList);
        this.animation.addClip(clip);
        this.Clip = clip;
        //refresh data after addclip
        this.updateClipData();
    }

    private genEventClip(clipName: string, eventList: ActionEvent[]): AnimationClip {
        //new clip
        let clip = new AnimationClip();

        //<<< duration must be assigned first, or you can't add any event >>>
        clip.duration = getDuration(this.EventList);

        //clip name for playing
        clip.name = clipName;

        //assign events
        clip.events = eventList;

        return clip;
    }


    public GetAnimState(): AnimationState {
        return this.animation.getState(this.curClip);
    }

    onDestroy() {
        if (!this.animation) {
            return;
        }

        this.animation.off(Animation.EventType.PLAY, this.onPlay, this);
        this.animation.off(Animation.EventType.STOP, this.onStop, this);
        this.animation.off(Animation.EventType.FINISHED, this.onFinished, this);
        this.animation.off(Animation.EventType.LASTFRAME, this.onLastFrame, this);
    }

    start(): void {
        if (this.AutoInit === true) {
            this.Init();
        }

        if (this.AutoStart === true) {
            this.play();
        }
    }

    public updateClip(): void {
        if (!this.IsForAnimationEvent) {
            if (this.animation.clips.length > 0) {
                let animClip = this.animation.clips[0];
                animClip.duration = getDuration(this.EventList);
                animClip.events = this.EventList;
                this.Clip = animClip;
                this.updateClipData();
            }
        }
    }

    // for art ctrl
    public play() {
        let clipName = this.Clip ? this.Clip.name : this.animation.defaultClip.name;
        this.animation.play(clipName);
        this.curClip = clipName;
        this.GetAnimState().wrapMode = AnimationClip.WrapMode.Normal;
    }

    // for art ctrl
    public playLoop() {
        let clipName = this.Clip ? this.Clip.name : this.animation.defaultClip.name;
        this.animation.play(clipName);
        this.curClip = clipName;
        this.GetAnimState().wrapMode = AnimationClip.WrapMode.Loop;
    }

    public playClip(clipName: string) {
        this.animation.play(clipName);
        this.curClip = clipName;
        this.GetAnimState().wrapMode = AnimationClip.WrapMode.Normal;
    }

    public playClipWithButton(ev: any, clipName: string) {
        this.animation.play(clipName);
        this.curClip = clipName;
        this.GetAnimState().wrapMode = AnimationClip.WrapMode.Normal; // 如果clip內已設定為loop，仍會撥放loop，不確定有無作用
    }

    public playClipLoop(ev: any, clipName: string) {
        this.animation.play(clipName);
        this.curClip = clipName;
        this.GetAnimState().wrapMode = AnimationClip.WrapMode.Loop;
    }

    public PLAY_ANIM_CTRL(clipName: string) {
        this.curClip = clipName;
        console.log(`PLAY_ANIM_CTRL(${clipName}), state = ${this.animation.getState(clipName)}, ratio = ${this.animation.getState(clipName).ratio}`);
        this.animation.getState(clipName).play();
    }

    public stop() {
        this.animation.stop();
    }

    public pause() {
        this.animation.pause();
    }

    private SPINE_PLAY(nodeNameStr: string, clipName: string, loopStr: string, trackStr: string) {
        let loop = StringExt.ToBoolean(loopStr);
        let [track_ok, track] = StringExt.ToNumber(trackStr);

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_PLAY(${nodeNameStr},${clipName},${loop},${track})`);
            if (!track_ok) {
                console.log(`track type error : ${trackStr}`);
                return;
            }
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                //spineComp.clearAnimations();
                spineComp.setAnimation(track, clipName, loop);
            }
        }
    }

    private SPINE_RESET_SLOT(nodeNameStr: string) {

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_RESET_SLOT(${nodeNameStr}`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<SkeletonExtension>(nodeNames[n], 'SkeletonExtension');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.updateSlotTexture();
            }
        }
    }

    private SPINE_PAUSE(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_PAUSE(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.paused = true;
            }
        }
    }

    private SPINE_CONTINUE(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_CONTINUE(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.paused = false;
            }
        }
    }

    private SPINE_RESET(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_RESET(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.clearTracks(); // with set to setup pose
            }
        }
    }

    private SPINE_CLEARTRACK(nodeNameStr: string, trackStr: string) {
        let [track_ok, track] = StringExt.ToNumber(trackStr);

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_CLEARTRACK(${nodeNameStr}, ${trackStr})`);
            if (!track_ok) {
                console.log(`track type error : ${trackStr}`);
                return;
            }
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.clearTrack(track);
            }
        }
    }

    private SPINE_SET_TO_SETUP_POSE(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_SET_TO_SETUP_POSE(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.setToSetupPose();
            }
        }
    }

    private SPINE_CLEAR_ANIMATION(nodeNameStr: string, trackStr: string) {
        let [track_ok, track] = StringExt.ToNumber(trackStr);

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_CLEAR_ANIMATION(${nodeNameStr}, ${trackStr})`);
            if (!track_ok) {
                console.log(`track type error : ${trackStr}`);
                return;
            }
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.clearAnimation(track);
            }
        }
    }

    private SPINE_FADING(nodeNameStr: string, alphaToStr: string, durationStr: string, easytypeStr: string, disableOnEndStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_FADING(${nodeNameStr}, ${alphaToStr}, ${durationStr}, ${easytypeStr}, ${disableOnEndStr})`);
        }
        let alpha = StringExt.ToNumber(alphaToStr)[1];
        let duration = StringExt.ToNumber(durationStr)[1];
        let easetype = StringExt.ToNumber(easytypeStr)[1];
        let disableOnEnd = StringExt.ToBoolean(disableOnEndStr);

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < comps.length; i++) {
                comps[i].enabled = true;
                let tcolor = new Color(comps[i].color.r, comps[i].color.g, comps[i].color.b, alpha);
                tween(comps[i])
                    .to(duration, { color: tcolor }, { easing: easeFunctions[easetype] })
                    .call(() => {
                        if (disableOnEnd) {
                            comps[i].enabled = false;
                        }
                    })
                    .start();
            }
        }
    }

    private SPINE_MIX(nodeNameStr: string, clipNameStr: string, clipName2Str: string, durationStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_MIX(${nodeNameStr}, ${clipNameStr}, ${clipName2Str}, ${durationStr})`);
        }

        let duration = StringExt.ToNumber(durationStr)[1];
        let nodeNames = this.getNodeNames(nodeNameStr);
        let clipName = clipNameStr;
        let clipName2 = clipName2Str;

        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.setMix(clipName, clipName2, duration);
            }
        }
    }

    private SPINE_ADD(nodeNameStr: string, clipNameStr: string, loopStr: string, trackStr: string, delayStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_ADD(${nodeNameStr}, ${clipNameStr}, ${loopStr}, ${trackStr}), ${delayStr}`);
        }


        let nodeNames = this.getNodeNames(nodeNameStr);
        let clipName = clipNameStr;
        let loop = StringExt.ToBoolean(loopStr);
        let delay = StringExt.ToNumber(delayStr)[1];
        let [track_ok, track] = StringExt.ToNumber(trackStr);

        if (!track_ok) {
            console.log(`track type error : ${trackStr}`);
            return;
        }

        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.addAnimation(track, clipName, loop, delay);
            }
        }
    }

    private SPINE_TIMESCALE(nodeNameStr: string, timescaleStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_TIMESCALE(${nodeNameStr}, ${timescaleStr})`);
        }

        let timescale = StringExt.ToNumber(timescaleStr)[1];
        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.timeScale = timescale;
            }
        }
    }

    private SPINE_TRACK_TIMESCALE(nodeNameStr: string, trackStr: string, timescaleStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_TRACK_TIMESCALE(${nodeNameStr}, ${trackStr}, ${timescaleStr})`);
        }

        let timescale = StringExt.ToNumber(timescaleStr)[1];
        let [track_ok, track] = StringExt.ToNumber(trackStr);
        if (!track_ok) {
            console.log(`track type error : ${trackStr}`);
            return;
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.getCurrent(track).timeScale = timescale;
            }
        }
    }


    private SPINE_ALPHA(nodeNameStr: string, trackStr: string, alphaToStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SPINE_ALPHA(${nodeNameStr}, ${alphaToStr})`);
        }

        let alpha = StringExt.ToNumber(alphaToStr)[1];
        let [track_ok, track] = StringExt.ToNumber(trackStr);
        if (!track_ok) {
            console.log(`track type error : ${trackStr}`);
            return;
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let spineComps = this.getComponetsByNodeName<sp.Skeleton>(nodeNames[n], 'sp.Skeleton');
            for (let i = 0; i < spineComps.length; i++) {
                let spineComp = spineComps[i];
                spineComp.getCurrent(track).alpha = alpha;
            }
        }
    }

    private UI_OPACITY(nodeNameStr: string, alphaToStr: string, durationStr: string, easytypeStr: string, disableOnEndStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `UI_OPACITY(${nodeNameStr}, ${alphaToStr}, ${durationStr}, ${easytypeStr}, ${disableOnEndStr})`);
        }
        let alpha = StringExt.ToNumber(alphaToStr)[1];
        let duration = StringExt.ToNumber(durationStr)[1];
        let easetype = StringExt.ToNumber(easytypeStr)[1];
        let disableOnEnd = StringExt.ToBoolean(disableOnEndStr);

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<UIOpacity>(nodeNames[n], 'cc.UIOpacity');
            for (let i = 0; i < comps.length; i++) {
                comps[i].node.active = true;
                tween(comps[i])
                    .to(duration, { opacity: alpha }, { easing: easeFunctions[easetype] })
                    .call(() => {
                        if (disableOnEnd) {
                            comps[i].node.active = false;
                        }
                    })
                    .start();
            }
        }
    }

    /*
    private UI_FADING(nodeNameStr: string, showStr: string, durationStr: string, easytypeStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `UI_FADING(${nodeNameStr}, ${showStr}, ${durationStr}, ${easytypeStr})`);
        }
        let show = StringExt.ToBoolean(showStr);
        let duration = StringExt.ToNumber(durationStr)[1];
        let easetype = StringExt.ToNumber(easytypeStr)[1];

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<UIOpacity>(nodeNames[n], 'cc.UIOpacity');
            for (let i = 0; i < comps.length; i++) {
                let alpha = 0;
                //show在開始時node active
                if (show) {
                    comps[i].node.active = true;
                    alpha = 255;
                }
                tween(comps[i])
                    .to(duration, { opacity: alpha }, { easing: easeFunctions[easetype] })
                    .call(() => {
                        //hide在結束時node deactive
                        if (show === false) {
                            comps[i].node.active = false;
                        }
                    })
                    .start();
            }
        }
    }
    */

    private NODE_ACTIVE(nodeNameStr: string, activeStr: string) {

        let active = StringExt.ToBoolean(activeStr);

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `NODE_ACTIVE(${nodeNameStr}, ${activeStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let nodes = NodeExt.findNodes(this.node, nodeNames[n]);
            if (nodes.length === 0) {
                console.warn(`${this.getDebugHeader()} can't find node ${nodeNames[n]}`);
                return;
            }
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].active = active;
            }
        }
    }

    private NODE_EVENT(nodeNameStr: string, eventName: string, arg0?: string, arg1?: string, arg2?: string, arg3?: string, arg4?: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `NODE_EVENT(${nodeNameStr}, ${eventName}, ${arg0}, ${arg1}, ${arg2}, ${arg3}, ${arg4})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let nodes = NodeExt.findNodes(this.node, nodeNames[n]);
            if (nodes.length === 0) {
                console.warn(`${this.getDebugHeader()} can't find node ${nodeNames[n]}`);
                return;
            }
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].emit(eventName, arg0, arg1, arg2, arg3, arg4);
            }
        }
    }

    private ANIM_PLAY(nodeNameStr: string, clipName: string, loopStr: string) {
        let loop = StringExt.ToBoolean(loopStr);

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `ANIM_PLAY(${nodeNameStr},${clipName},${loop})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<Animation>(nodeNames[n], 'cc.Animation');
            for (let i = 0; i < animComps.length; i++) {
                animComps[i].play(clipName);
                let state = animComps[i].getState(clipName);
                state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal;
            }
        }
    }

    private ANIM_STOP(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `ANIM_STOP(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<Animation>(nodeNames[n], 'cc.Animation');
            for (let i = 0; i < animComps.length; i++) {
                animComps[i].stop();
            }
        }
    }

    private ANIM_PAUSE(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `ANIM_PAUSE(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<Animation>(nodeNames[n], 'cc.Animation');
            for (let i = 0; i < animComps.length; i++) {
                let anim = animComps[i];
                anim.pause();
            }
        }
    }

    private ANIM_RESUME(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `ANIM_RESUME(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<Animation>(nodeNames[n], 'cc.Animation');
            for (let i = 0; i < animComps.length; i++) {
                let anim = animComps[i];
                anim.resume();
            }
        }
    }

    private SK_ANIM_PLAY(nodeNameStr: string, clipName: string, loopStr: string) {
        let loop = StringExt.ToBoolean(loopStr);

        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SK_ANIM_PLAY(${nodeNameStr},${clipName},${loop})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<SkeletalAnimation>(nodeNames[n], 'cc.SkeletalAnimation');
            for (let i = 0; i < animComps.length; i++) {
                animComps[i].play(clipName);
                let state = animComps[i].getState(clipName);
                state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal;
            }
        }
    }

    private SK_ANIM_STOP(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SK_ANIM_STOP(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<SkeletalAnimation>(nodeNames[n], 'cc.SkeletalAnimation');
            for (let i = 0; i < animComps.length; i++) {
                animComps[i].stop();
            }
        }
    }

    private SK_ANIM_PAUSE(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SK_ANIM_PAUSE(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<SkeletalAnimation>(nodeNames[n], 'cc.SkeletalAnimation');
            for (let i = 0; i < animComps.length; i++) {
                let anim = animComps[i];
                anim.pause();
            }
        }
    }

    private SK_ANIM_RESUME(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `SK_ANIM_RESUME(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let animComps = this.getComponetsByNodeName<SkeletalAnimation>(nodeNames[n], 'cc.SkeletalAnimation');
            for (let i = 0; i < animComps.length; i++) {
                let anim = animComps[i];
                anim.resume();
            }
        }
    }

    private PARTICLE_PLAY(nodeNameStr: string, loopStr: string, durationStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_PLAY(${nodeNameStr}, ${loopStr}, ${durationStr})`);
        }

        let loop = StringExt.ToBoolean(loopStr);
        let duration = StringExt.ToNumber(durationStr)[1];
        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].duration = duration;
                comps[i].loop = loop;
                comps[i].play();
            }
        }
    }

    private PARTICLE_STOP(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_STOP(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].stop();
            }
        }
    }

    private PARTICLE_PAUSE(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_PAUSE(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].pause();
            }
        }
    }

    private PARTICLE_CLEAR(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_CLEAR(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].clear();
            }
        }
    }

    private PARTICLE_STOPEMITT(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_STOPEMITT(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].stopEmitting();
            }
        }
    }

    private PARTICLE_RESET(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_RESET(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].stop();
                comps[i].play();
            }
        }
    }

    private PARTICLE_TINT_COLOR(nodeNameStr: string, durationStr: string, startColorStr: string, endColorStr: string, easeTypeStr: string, disableOnEndStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_TINT_COLOR(${nodeNameStr}, ${startColorStr}, ${endColorStr}, ${easeTypeStr}, ${disableOnEndStr})`);
        }

        let duration = StringExt.ToNumber(durationStr)[1];
        let startColor = new Color(startColorStr);
        let endColor = new Color(endColorStr);
        let easetype = StringExt.ToNumber(easeTypeStr)[1];
        let disableOnEnd = StringExt.ToBoolean(disableOnEndStr);

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].enabled = true;
                tween(startColor)
                    .to(
                        duration, // Duration in seconds
                        { r: endColor.r, g: endColor.g, b: endColor.b, a: endColor.a },
                        {
                            easing: easeFunctions[easetype],
                            onUpdate: () => {
                                comps[i].materials[0].setProperty('tintColor', startColor);
                            }
                            // Update the material's tint color
                        }
                    )
                    .call(() => {
                        if (disableOnEnd) {
                            comps[i].enabled = false;
                        }
                    })
                    .start();
            }
        }
    }

    private PARTICLE_CAPACITY(nodeNameStr: string, capacityStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_CAPACITY(${nodeNameStr}, ${capacityStr})`);
        }

        let capacity = StringExt.ToNumber(capacityStr)[1];

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].capacity = capacity;
            }
        }
    }

    private PARTICLE_RATE_OVER_TIME(nodeNameStr: string, rateOverTimeStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_RATE_OVER_TIME(${nodeNameStr}, ${rateOverTimeStr})`);
        }

        let rateOverTime = StringExt.ToNumber(rateOverTimeStr)[1];

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem>(nodeNames[n], 'cc.ParticleSystem');
            let curve: CurveRange = new CurveRange();
            curve.mode = CurveRange.Mode.Constant;
            curve.constant = rateOverTime;
            curve.constantMax = rateOverTime;
            curve.constantMin = rateOverTime;
            for (let i = 0; i < comps.length; i++) {
                comps[i].rateOverTime = curve;
            }
        }
    }


    /*
    private PARTICLE_2D_PLAY(nodeNameStr: string, loopStr: string, durationStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_2D_PLAY(${nodeNameStr}, ${loopStr}, ${durationStr})`);
        }

        let loop = StringExt.ToBoolean(loopStr);
        let duration = StringExt.ToNumber(durationStr)[1];

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem2D>(nodeNames[n], 'cc.ParticleSystem2D');
            for (let i = 0; i < comps.length; i++) {
                comps[i].duration = duration;
                //todo: no proper play function for now.
            }
        }
    }

    private PARTICLE_2D_STOPEMITT(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_2D_STOPEMITT(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem2D>(nodeNames[n], 'cc.ParticleSystem2D');
            for (let i = 0; i < comps.length; i++) {
                comps[i].stopSystem();
            }
        }
    }

    private PARTICLE_2D_RESET(nodeNameStr: string) {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + `PARTICLE_2D_RESET(${nodeNameStr})`);
        }

        let nodeNames = this.getNodeNames(nodeNameStr);
        for (let n = 0; n < nodeNames.length; n++) {
            let comps = this.getComponetsByNodeName<ParticleSystem2D>(nodeNames[n], 'cc.ParticleSystem');
            for (let i = 0; i < comps.length; i++) {
                comps[i].resetSystem();
            }
        }
    }
    */

    private updateClipData() {
        //the only way to update modified clips data
        this.animation.clips = this.animation.clips;
    }

    private onPlay() {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + 'status: playing');
        }
        if (this.OnAnimEvent !== null) {
            this.OnAnimEvent(Animation.EventType.PLAY, this.GetAnimState());
        }
    }

    private onStop() {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + 'status: stoppping');
        }
        if (this.OnAnimEvent !== null) {
            this.OnAnimEvent(Animation.EventType.STOP, this.GetAnimState());
        }
    }


    private onFinished() {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + 'status: finished');
        }
        if (this.OnAnimEvent !== null) {
            this.OnAnimEvent(Animation.EventType.FINISHED, this.GetAnimState());
        }
    }

    private onLastFrame() {
        if (this.debug === true) {
            console.log(this.getDebugHeader() + 'status: onLastFrame');
        }
        if (this.OnAnimEvent !== null) {
            this.OnAnimEvent(Animation.EventType.LASTFRAME, this.GetAnimState());
        }
    }

    private getComponetsByNodeName<T extends Component>(nodeName: string, compName: string): T[] {
        let comps: T[] = [];
        let nodes = NodeExt.findNodes(this.node, nodeName);

        if (nodes.length === 0) {
            console.warn(`${this.getDebugHeader()} can't find node ${nodeName}`);
            return comps;
        }

        for (let i = 0; i < nodes.length; i++) {
            let comp = nodes[i].getComponent(compName) as T;
            if (comp != null) {
                comps.push(comp);
            }
        }
        if (comps.length === 0) {
            console.warn(`${this.getDebugHeader()} can't find component ${compName} in Node ${nodeName}`);
        }
        return comps;
    }

    private getDebugHeader(): string {
        let hName = NodeExt.getHierachy(this.node);
        return `${hName}.ActionEventPlayer, clip.name=${this.curClip}, `
    }

    private getNodeNames(nodeName: string): string[] {
        if (!nodeName) {
            console.warn(`${this.getDebugHeader()} nodeName is empty: ${nodeName}`);
            return [];
        }
        let names = nodeName.replace(/\s/g, "").split(',');
        if (names.length === 0) {
            console.warn(`${this.getDebugHeader()} nodeName is empty: ${nodeName}`);
        }
        return names;
    }
}
