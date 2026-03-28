import { _decorator, macro, Component, Node, Animation, AnimationClip, AnimationState, sp, CCString } from 'cc';
import { IAnimationControl } from '../Definitions/IAnimationControl';
import { ParticleExtension } from './ParticleExtension'
import { AnimationPlayInfo, AnimationCtrlPlayData, CleanTrackType } from '../Definitions/AnimationDataOptions';
import { AnimationSelectionResolver } from '../AniTools/AniSelectionResolver';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { AnimationPlayInfoList, AniCtrlPropDef, AnimationStateList, ClearTrackTypeState, AnimationStateType } from './AniStateLists/AnimationPlayStateBase';
import { FindComponent } from '../../FindComponent';
import { PlaySelector } from '../Definitions/IPlayOptions';
import { IStopOptions, StopClearMode } from '../Definitions/IStopOptions';
import { AnimationWatchTaskManager } from "../TaskManager/AnimationWatchTaskManager";
import { IAnimationWatchTask } from "../TaskManager/IAnimationWatchTask";
import { GameUtilsTools } from '../../GameUtilsTool';
import { ANI_SYS_EVENTS, AniSysEventData } from './AniEvents/AniSysEvents';

const { ccclass, property } = _decorator;

@ccclass('AnimationController')
export class AnimationController extends Component implements IAnimationControl {

    isLoaded: boolean = false;//--是否已經載入完成(準備完成資料初始化動作)

    @property({ type: AnimationPlayInfoList, displayName: 'animationPlayStateList', visible: true, tooltip: '播放資料清單' })
    private _animationPlayInfoList: AnimationPlayInfoList = new AnimationPlayInfoList();

    //--他會依照animationPlayStateList的clipsInfo來決定要播放的動畫
    @property({ type: AnimationStateList, displayName: 'animationStateList', visible: true, tooltip: '狀態控制動畫清單' })
    protected _animationStateList: AnimationStateList = new AnimationStateList();

    @property({ type: ParticleExtension, displayName: 'particleSystem', visible: true, tooltip: '粒子系統' })
    particleSystem: ParticleExtension;

    @property({ tooltip: 'prefab(放component的nodeId)的node id' })
    targetNodeId: string = '';//--prefab(放component的nodeId)的node id

    @property({ tooltip: '動畫的FPS' })
    frameRate: number = 60;

    @property({ tooltip: '單一識別碼' })
    tokenID: string = '';//--單一的識別碼

    @property({ tooltip: 'prefabKey(用來辨識prefab的)' })
    prefabKey: string = '';//--prefab的key(用來辨識prefab的)


    @property({ tooltip: '回收回到預設狀態,不做動畫本身清除重置<中軟專屬要勾選>' })
    goBackDefaultWithoutDestroy: boolean = false;

    @property({ visible: true, tooltip: '是否要播放完畢後停止' })
    protected _afterPlayDoStop: boolean = true;

    @property({ visible: true, tooltip: '是否是AEP_Spine物件' })
    public isAEP_SPINE: boolean = false;
    //@ts-ignore
    @property({ type: [sp.Skeleton], tooltip: 'AEP控制的spine', visible: function () { return this.isAEP_SPINE } })
    public aepSpines: sp.Skeleton[] = [];

    @property({ type: ClearTrackTypeState, visible: true, tooltip: '清除全部tracks或是當前撥放的trackIndex' })
    protected _clearTracks: ClearTrackTypeState = new ClearTrackTypeState();

    @property({ type: CCString, visible: true, tooltip: '目前播放的動畫名稱' })
    protected _currentPlayingAniName: string = '';

    protected _resolver: AnimationSelectionResolver<any, AniCtrlPropDef>;

    //---new-----
    // --- Hub 狀態 ---
    private _hubBound = false;
    // 完成事件的等待者：FINISHED / LASTFRAME
    private _finishWaiters = new Set<() => void>();
    private _lastFrameWaiters = new Set<() => void>();
    private _pendingPlayResolves = new Set<() => void>(); // 讓 safeResolve 能提前結束舊播放
    // frame event 的等待者：回傳 true 代表已處理並移除
    private _frameEvtWaiters = new Set<(args: any[]) => boolean>();
    // 追蹤所有「保底」計時器（guards），回收時一口氣取消
    private _activeGuards = new Set<{ cancel: () => void }>();

    // Hub 監聽器（終身掛著，不要被 removeListen() 移除）
    private _onAniFinishedHub = (_t?: string, _s?: AnimationState) => this._dispatchFinish();
    private _onAniLastFrameHub = (_t?: string, _s?: AnimationState) => this._dispatchLastFrame();
    //---new-----    
    /**
     * https://docs.cocos.com/creator/3.8/manual/zh/animation/animation-component.html#%E5%B8%A7%E4%BA%8B%E4%BB%B6
     * PS-我幹你媽的animation他event callback長這樣>>>>
     * onPlay: function (type, state) {
     *     // callback
     * }
     *
     * // register event to all animation
      * animation.on('play', this.onPlay, this);
      *
      * 
     也就是說會回傳type跟state...之前照spine的寫法就不行..所以要改這樣來接
     再用一個overload來處理不同的參數,來過濾型別強送defaultType
     PS:overload不能用箭頭函式
    */
    protected generalAniCompleteCheck(): void;
    protected generalAniCompleteCheck(backDefault: boolean): void;
    protected generalAniCompleteCheck(type: string, state: AnimationState): void;
    protected generalAniCompleteCheck(a?: boolean | string, _s?: AnimationState): void {
        const backDefault = typeof a === 'boolean' ? a : false;
        if (!this._isLoop) this.onAniComplete(backDefault);

    }


    protected _aniResolvePromise: (() => void) | null; // promise resolve 函式
    protected _aniCallback?: () => void;
    protected _aniFrameEventCallBack?: (...args) => void;
    protected _aniCallBackCompleteHandler: (t: string, s: AnimationState) => void;
    protected _aniCallBackFrameEvtCompleteHandler: (t: string, s: AnimationState) => void;
    protected _onFinishedForPromise?: (t: string, s: AnimationState) => void;
    protected _onLastFrameForPromise?: (t: string, s: AnimationState) => void;
    //--TODO------
    //protected _sequencePlayFrameEventCallBack: (value?: any) => void;//--連續播放事件
    //protected _sequenceResolvePromise: (() => void) | null; // promise resolve 函式(序列播放)


    slotMachineIndexInfo?: IReelInfo;
    groupID: number[];//--會有同一個物件在不同的group裡面(第四軸重複的)
    isPlaying: boolean;
    keep: boolean;//--不刪除且持續留在場景中

    //-https://www.swiftcafe.io/post/cocos-animation
    //-https://blog.csdn.net/qq_45021180/article/details/104718341

    //--用來存放原始的動畫資料reset將會塞回去
    //private _originAniData:{[key:string]:AniCtrlPropDef};
    private _originAniData: AniCtrlPropDef[];
    private _ani: Animation;
    private _gotoAndStopTime: number;
    private _defaultTarget: AniCtrlPropDef = null;
    private _currentTarget: AniCtrlPropDef = null;
    private _dirtyFirstOnLoad: boolean = false;//---用來判斷是否第一次onLoad
    //======FIX自動播放default=======
    private _finishBackDefault = false; // 這次播放結束後是否回 Default
    private _finalizing = false;
    private _isLoop: boolean;
    private _currentPlayName: string = '';//--如果還行的話直接併入interface20251008--不行太難用了..

    get currentTarget(): AniCtrlPropDef {
        return this._currentTarget;//--測試用功能--好用的話就併進去
    }

    get currentPlayName(): string {
        return this._currentPlayName;
    }

    get ani(): Animation {
        return this._ani;
    }

    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;
        this._ani = FindComponent.findComponentInChildren(this.node, Animation);
        this._gotoAndStopTime = 0;
        this._originAniData = [];
        //-_originAniData存放原本美術設定的資料
        this.createOriginAniState();
        this.saveOriginAniData(this._originAniData);
        //--在prefab裡面,已經有default的clip了
        if (!this._animationPlayInfoList) {
            this._animationPlayInfoList = new AnimationPlayInfoList();
            this._animationPlayInfoList.clipsInfo = [];
        }

        /**
         * _animationPlayInfoList.clipsInfo存放自定義的資料
         * 但在一開始會先寫過一次全部預設的資料到這裡面
         * 然後如果有填寫_animationPlayInfoList資料的話,會覆蓋掉原本的資料
         */
        const defaultClipName = this._ani.defaultClip ? this._ani.defaultClip.name : null;

        for (const clip of this._ani.clips) {

            const state: AnimationState = this._ani.getState(clip.name);
            //如果有填寫_animationPlayStateList資料的話,會覆蓋掉原本animation的資料
            let clipData: AniCtrlPropDef = this._animationPlayInfoList.clipsInfo.find(data => data.targetName === clip.name);

            if (!clipData) {
                //如果沒有資料的話,會推進去_animationPlayInfoList
                clipData = new AniCtrlPropDef();
                clipData.targetName = clip.name;
                if (state) {
                    clipData.delay = state.delay;
                    clipData.repeatCount = state.repeatCount;
                    clipData.speed = state.speed;
                    clipData.wrapMode = state.wrapMode;
                    clipData.duration = state.duration;
                } else {
                    clipData.delay = 0.0;//--engine default
                    clipData.repeatCount = 1;//--engine default
                    clipData.speed = 1.0;//--engine default
                    clipData.wrapMode = AnimationClip.WrapMode.Normal;//--engine default
                }
                this._animationPlayInfoList.clipsInfo.push(clipData);
                if (defaultClipName === clip.name) {
                    this._defaultTarget = clipData;
                }
            }
        }

        //--建立查找(IPlayOptions)工具與快取表
        this._resolver = new AnimationSelectionResolver(
            () => this._animationStateList?.stateInfo ?? [],
            () => this._animationPlayInfoList?.clipsInfo ?? [],
            (st) => st.getStateKey ? st.getStateKey() : '',//-可省
            // enumToKey：把 Enum 數值轉字串鍵
            (v) => AnimationStateType[v],
            // 可選 logger
            (type, ...args) => console[type](...args)
        );
        this._resolver.rebuildAnimationCaches();//--先建立一次快取表

        //--優先權以_animationPlayStateList <useDefaultState>為主    
        if (!this._animationPlayInfoList.useDefaultState) {
            this._defaultTarget = this._animationPlayInfoList.clipsInfo.find(data => data.useDefault);
        }
        //--如果沒有設定default的clip的話,就會找第一個clip
        if (!this._defaultTarget) {
            this._defaultTarget = this._animationPlayInfoList.clipsInfo[0];
        }
        /*
        this.generalAniCompleteCheck = (backDefault: boolean = false) => {
            //this.onAniCompleteHandler();
            this.onAniComplete(backDefault);
        };*/
        this._clearTracks.trackType = CleanTrackType.ALL_ANI;//--預設是清除當前的track
        this.init();
        this._ani.stop();
        //---new--
        this.ensureHub();
        const aniCtrlEvtData: AniSysEventData = {
            eventName: ANI_SYS_EVENTS.CTRL_LOADED,
            ctrlId: (this.prefabKey) ? this.prefabKey : this.targetNodeId,
            loaded: { message: 'aniCtrl is loaded' }
        }
        this.node.emit(ANI_SYS_EVENTS.CTRL_LOADED, aniCtrlEvtData);
    }

    public init(): void {
        if (!this._dirtyFirstOnLoad) return;
        this.keep = false;
        //--重置快取表
        this._resolver?.rebuildAnimationCaches();
        this.ensureDefaultTargetFromList();
        this.isLoaded = true;
    }

    private ensureHub(): void {
        if (this._hubBound || !this._ani) return;
        this._ani.on(Animation.EventType.FINISHED, this._onAniFinishedHub, this);
        this._ani.on(Animation.EventType.LASTFRAME, this._onAniLastFrameHub, this);
        this._hubBound = true;
    }

    //---new---
    protected _dispatchFinish(): void {
        const list = Array.from(this._finishWaiters);
        this._finishWaiters.clear();
        for (const fn of list) { try { fn(); } catch { } }
    }
    //---new---  
    protected _dispatchLastFrame(): void {
        const list = Array.from(this._lastFrameWaiters);
        this._lastFrameWaiters.clear();
        for (const fn of list) { try { fn(); } catch { } }
    }
    //--new---
    private waitFinishOnce(): { promise: Promise<void>, off: () => void } {
        let off = () => { };
        const promise = new Promise<void>((resolve) => {
            const cb = () => { off(); resolve(); };
            off = () => this._finishWaiters.delete(cb);
            this._finishWaiters.add(cb);
        });
        return { promise, off };
    }
    //--new--
    private waitLastFrameOnce(): { promise: Promise<void>, off: () => void } {
        let off = () => { };
        const promise = new Promise<void>((resolve) => {
            const cb = () => { off(); resolve(); };
            off = () => this._lastFrameWaiters.delete(cb);
            this._lastFrameWaiters.add(cb);
        });
        return { promise, off };
    }

    // 只拿第一個符合條件的 frame event；predicate 回傳 true 表示吃到這次事件
    private waitFrameEventOnce(predicate?: (...args: any[]) => boolean): { promise: Promise<any[]>, off: () => void } {
        let off = () => { };
        const promise = new Promise<any[]>((resolve) => {
            const cb = (args: any[]) => {
                const ok = !predicate || predicate(...args);
                if (ok) { off(); resolve(args); return true; }
                return false;
            };
            off = () => this._frameEvtWaiters.delete(cb);
            this._frameEvtWaiters.add(cb);
        });
        return { promise, off };
    }

    //--race用的保底計時器
    private _makeGuardByState(state: AnimationState | null | undefined) {
        const dur = state ? Math.max(0.001, state.duration / Math.max(0.0001, Math.abs(state.speed || 1))) : 0.6;
        return GameUtilsTools.DeferByTweenPromiseWithCancel(dur * 1.5);
    }

    //--確保預設目標存在
    protected ensureDefaultTargetFromList(): void {
        if (this._defaultTarget) return;
        const list = this._animationPlayInfoList?.clipsInfo ?? [];
        this._defaultTarget = (list.find(d => d?.useDefault) ?? list[0]) ?? null;
    }

    protected _onAniFinished = (_type?: string, _state?: AnimationState) => {
        this._finalizeFinish();
    };

    private _finalizeFinish = () => {
        if (this._finalizing) return;
        this._finalizing = true;
        this.isPlaying = false;
        //this._currentPlayName = '';//--LOOP每次都會觸發
        // 移除自己的 FINISHED 監聽（不影響promise/回呼）
        this._ani?.off(Animation.EventType.FINISHED, this._onAniFinished, this);
        //帶入這次的 backDefault 旗標
        this.generalAniCompleteCheck?.(this._finishBackDefault);
        this._finalizing = false;
    }

    public async testBtnEvent(ev: any, value: PlaySelector): Promise<void> {
        //console.log('testBtnEvent:', ev, value);
        //---wild---
        //this.playAni(AnimationStateType.Default);//--抖兩下..
        //this.playAni(AnimationStateType.Idle);//--抖一下..
        //this.playAni({ aniState: 'Expand' });//--抖兩下..
        this.playAni({ aniState: 'Dark' });//--gamble btnAni test
        //this.playAni({aniState:'Transfer'});
        //this.playAni({aniState:'No_transfer'});//--抖兩下..
        //await this.playAniInPromise({ aniState: 'Transfer' });
        //const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState('Transfer_Ani');
        //const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);
        /*
        this._ani.defaultClip.events=
        [
            {
                frame:triggerTime,

                func:'onAniTriggerEvt',

                params:[j.clip.name]
            }
        ];*/
        //this.playAni({ aniState: 'Transfer' });
        //this.playAni({ aniState: 'No_transfer' });
        //this.playAni(AnimationStateType.Default);
        //--wild---


        //this.playAni(AnimationStateType.Win);
        //this.playAni({ targetName: 'Iconbox_Loop_Ani' });
        /*
            console.log();
        },true,AnimationStateType.Win);
        */
        //await this.playAniInPromise(AnimationStateType.Win);
        //await this.playAniInPromise({ targetName: 'Iconbox_Loop_Ani' });
        //await this.playAniInPromise({aniState:'Connect_1'});
        //this.playAni({ aniState: 'Explore' });
        //this.playAni({ aniState: 'Start' });
        //this.playAni({ aniState: 'FG_Num_Up' });
        //await this.playAniInPromise({ aniState: AnimationStateType.Default });
        //this.playAni({ aniState: AnimationStateType.Idle });
        //this.testWild9({ aniState: 'Connect_1' });
        //this.playAniInPromise({ aniState: 'Connect_1' });
        //await this.playAniInPromise({ aniState: AnimationStateType.Idle });
        console.log();

        /*
        this.playAniWithFrameEvtCallBack(
            () => {
                console.log('frame event callback');
            },
            () => {
                console.log('frame event complete');
            },
            false,
            { aniState: 'Start' });
            */
        console.log();
    }

    private testWild9(value: PlaySelector): void {
        const targetState: AniCtrlPropDef = this.peakAniDataInfo(value) as AniCtrlPropDef;
        const originalDuration = targetState.duration;
        const spTargetName = ['Connect_1', 'Connect_2', 'Connect_3', 'Connect_4'];
        if (this.isAEP_SPINE && this.aepSpines.length > 0 && spTargetName.length > 0) {
            for (let i: number = 0; i < this.aepSpines.length; i++) {
                for (let j = 0; j < spTargetName.length; j++) {
                    const sp = this.aepSpines[i];
                    const duration = sp.findAnimation(spTargetName[j])?.duration;
                    if (duration) {
                        //const speed=duration/time;
                        //sp.timeScale=speed;
                        console.log();
                    }
                }
            }

        }




    }

    //--animation的event要放在跟animationComponent同層(核心只會去找那一層的)
    //-[ANI_CTRL_EVT]=frameEvent使用的function name
    private ANI_CTRL_EVT(...args): void {
        //console.log('testFrameEvent', args);
        if (this._aniFrameEventCallBack) {
            this._aniFrameEventCallBack(...args);
        }
        // 統一轉發給 waiters
        const list = Array.from(this._frameEvtWaiters);
        for (const fn of list) {
            try {
                const done = fn(args);
                if (done) this._frameEvtWaiters.delete(fn);
            } catch { }
        }
    }



    public async test2BtnEvent(ev: any, value: PlaySelector): Promise<void> {
        console.log('testBtnEvent2:', ev, value);
        //this.stopAni(true);--就是很單純的停止
        //this.stopNow();//--會解掉resolve的promise與callback
        //this.playAni({ aniState: 'Transfer' });
        //this.stopAni();
        //this.stopPromiseAni(true);
        //this.playAni({ aniState: 'In' });
        //this.playAni(AnimationStateType.Default);
        //this.changePlayTime(0.3);
        //this.gotoPlayLastFrame();
        this.playAni(AnimationStateType.Win);
        console.log();
    }

    public async test3BtnEvent(ev: any, value: PlaySelector): Promise<void> {
        console.log('testBtnEvent3:', ev, value);
        //this.stopAni(true);--就是很單純的停止
        //this.stopNow();//--會解掉resolve的promise與callback
        //this.playAni({ aniState: 'Num_Down_Respine' });
        this.playAni({ aniState: 'Out' });
        //this.stopAni();
        //this.stopPromiseAni(true);
        console.log();
    }

    protected createOriginAniState(): void {
        for (const clip of this._ani.clips) {
            //const state:AnimationState=new AnimationState(clip);
            this._ani.createState(clip, clip.name);
        }
    }

    protected saveOriginAniData(aryTarget: AniCtrlPropDef[]): void {

        if (this._ani) {

            aryTarget.push(...this._ani.clips.map(clip => {
                const state: AnimationState = this._ani.getState(clip.name);
                const clipData = new AniCtrlPropDef();
                clipData.targetName = clip.name;
                if (state) {
                    clipData.delay = state.delay;
                    clipData.repeatCount = state.repeatCount;
                    clipData.speed = state.speed;
                    clipData.wrapMode = state.wrapMode;
                    clipData.duration = state.duration;
                }

                return clipData;
            }));
        }
    }


    protected restoreOriginAniData(): void {

        if (this._ani) {
            //--將改變的clip資料還原回去
            for (let clip of this._ani.clips) {
                const state: AnimationState = this._ani.getState(clip.name);
                const clipData: AniCtrlPropDef = this.getOriginAniData(clip.name);

                if (this.isDefined(clipData?.delay)) {
                    state.delay = clipData.delay;
                }

                if (this.isDefined(clipData?.repeatCount)) {
                    state.repeatCount = clipData.repeatCount;
                }

                if (this.isDefined(clipData?.speed)) {
                    state.speed = clipData.speed;
                }

                if (this.isDefined(clipData?.wrapMode)) {
                    state.wrapMode = clipData.wrapMode;
                }

                //--將所有的clip的時間歸零,回到第一個frame的狀態
                state.time = 0;
                state.sample();
            }
        }
    }



    public destroyAniController(): void {

    }

    //============================AnimationWatchTaskManager特殊方法==========================
    /**
     * 等待當前動畫播放到指定的時間點（秒數）
     * @param targetTime 目標時間（秒）
     * @param value PlaySelector
     * @param onComplete 動畫播放完成后的Callback
     * @returns Promise<void> 當達到目標時間時 resolve
     * @example
     * // 基本用法
     * this.playAni({ aniState: 'Attack' });
     * await this.waitUntilTime(1.5);
     * console.log('已播放到 1.5 秒');
     * 
     * // 帶完成回調
     * this.playAni({ aniState: 'Attack' });
     * await this.waitUntilTime(2.0, undefined, () => {
     *     console.log('動畫播放完成！');
     * });
     * console.log('已播放到 2.0 秒，繼續執行其他邏輯');
     */
    public async waitUntilTime(
        targetTime: number,
        value?: PlaySelector,
        onComplete?: () => void
    ): Promise<void> {

        if (isNaN(targetTime) || targetTime < 0) {
            console.error(`[AnimationController] 無效的時間: ${targetTime}`);
            return Promise.resolve();
        }

        let targetAniName = this._currentPlayName;
        if (value) {
            const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
            targetAniName = aniCtrl?.targetName;
        }

        if (!targetAniName) {
            console.error(`[AnimationController] 找不到目標動畫`);
            return Promise.resolve();
        }

        const taskId = `${this.node.uuid}_${targetAniName}_${Date.now()}`;
        const manager = AnimationWatchTaskManager.getInstance();

        const currentState = this.getCurrentAnimationState();
        const currentTime = currentState?.time ?? 0;

        return new Promise<void>((resolve) => {
            const task: IAnimationWatchTask = {
                id: taskId,
                controller: this,
                checkType: 'time',
                targetValue: targetTime,
                resolve,
                epsilon: 0.016, // 約 1 frame 的誤差（60fps）
                lastCheckedTime: currentTime
            };

            manager.registerTask(task);

            if (onComplete) {
                const completeWaiter = () => {
                    this._finishWaiters.delete(completeWaiter);
                    try {
                        onComplete();
                    } catch (e) {
                        console.error('[AnimationController] onComplete 執行錯誤:', e);
                    }
                };
                this._finishWaiters.add(completeWaiter);
            }

            const cleanup = () => {
                manager.cancelTask(taskId);
                resolve();
            };

            const finishWaiter = () => cleanup();
            this._finishWaiters.add(finishWaiter);

            // 當任務被外部取消時，也要從 waiter 中移除
            const originalResolve = task.resolve;
            task.resolve = () => {
                this._finishWaiters.delete(finishWaiter);
                originalResolve();
            };
        });
    }


    /**
     * 等待當前動畫撥放到指定的百分比（使用集中式任務管理器）
     * @param percentage (0-100)
     * @param value PlaySelector
     * @param onComplete 动画播放完成后的Callback
     * @returns Promise<void> 当达到目标百分比时 resolve
     * @example
     * // 基本用法
     * this.playAni({ aniState: 'Attack' });
     * await this.waitUntilPercentage(50);
     * console.log('已播放到 50%');
     * 
     * 
     * this.playAni({ aniState: 'Attack' });
     * await this.waitUntilPercentage(50, undefined, () => {
     *     console.log('完成！');
     * });
     * console.log('已播放到 50%');
     */
    public async waitUntilPercentage(
        percentage: number,
        value?: PlaySelector,
        onComplete?: () => void
    ): Promise<void> {

        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            console.error(`[AnimationController] 無效的百分比: ${percentage}`);
            return Promise.resolve();
        }


        let targetAniName = this._currentPlayName;
        if (value) {
            const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
            targetAniName = aniCtrl?.targetName;
        }

        if (!targetAniName) {
            console.error(`[AnimationController] 找不到目標動畫`);
            return Promise.resolve();
        }

        const taskId = `${this.node.uuid}_${targetAniName}_${Date.now()}`;
        const manager = AnimationWatchTaskManager.getInstance();

        const currentState = this.getCurrentAnimationState();
        const currentTime = currentState?.time ?? 0;

        return new Promise<void>((resolve) => {
            const task: IAnimationWatchTask = {
                id: taskId,
                controller: this,
                checkType: 'percentage',
                targetValue: percentage,
                resolve,
                epsilon: 0.5,
                lastCheckedTime: currentTime
            };


            manager.registerTask(task);

            if (onComplete) {
                const completeWaiter = () => {
                    this._finishWaiters.delete(completeWaiter);
                    try {
                        onComplete();
                    } catch (e) {
                        console.error('[AnimationController] onComplete 執行錯誤:', e);
                    }
                };
                this._finishWaiters.add(completeWaiter);
            }

            const cleanup = () => {
                manager.cancelTask(taskId);
                resolve();
            };

            const finishWaiter = () => cleanup();
            this._finishWaiters.add(finishWaiter);

            // 中止移除
            const originalResolve = task.resolve;
            task.resolve = () => {
                this._finishWaiters.delete(finishWaiter);
                originalResolve();
            };
        });
    }

    /**
       * 等待當前動畫撥放到指定的影格數（使用集中式任務管理器）
       * @param targetFrame 
       * @param value PlaySelector
       * @param onComplete callback動畫播放完成后的Callback
       * @returns Promise<void> 當達到目標影格時 resolve
       * @example
       * // 基本用法
       * this.playAni({ aniState: 'Attack' });
       * await this.waitUntilFrame(30);
       * console.log('已播放到第 30 frame');
       * 
       * // 带完成回调
       * this.playAni({ aniState: 'Attack' });
       * await this.waitUntilFrame(30, undefined, () => {
       *     console.log('動畫播放完成！');
       * });
       * console.log('已播放到第 30 frame，繼續執行其他邏輯');
       */
    public async waitUntilFrame(
        targetFrame: number,
        value?: PlaySelector,//--用於你要監看哪個動畫的播放到哪了?預設是當前撥放
        onComplete?: () => void
    ): Promise<void> {

        if (isNaN(targetFrame) || targetFrame < 0) {
            console.error(`[AnimationController] 無效的影格數: ${targetFrame}`);
            return Promise.resolve();
        }

        let targetAniName = this._currentPlayName;
        if (value) {
            const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
            targetAniName = aniCtrl?.targetName;
        }

        if (!targetAniName) {
            console.error(`[AnimationController] 找不到目標動畫`);
            return Promise.resolve();
        }

        const taskId = `${this.node.uuid}_${targetAniName}_${Date.now()}`;
        const manager = AnimationWatchTaskManager.getInstance();

        const currentState = this.getCurrentAnimationState();
        const currentTime = currentState?.time ?? 0;

        return new Promise<void>((resolve) => {
            const task: IAnimationWatchTask = {
                id: taskId,
                controller: this,
                checkType: 'frame',
                targetValue: targetFrame,
                resolve,
                lastCheckedTime: currentTime
            };

            manager.registerTask(task);

            if (onComplete) {
                const completeWaiter = () => {
                    this._finishWaiters.delete(completeWaiter);
                    try {
                        onComplete();
                    } catch (e) {
                        console.error('[AnimationController] onComplete 執行錯誤:', e);
                    }
                };
                this._finishWaiters.add(completeWaiter);
            }

            const cleanup = () => {
                manager.cancelTask(taskId);
                resolve();
            };

            // 監聽完成事件
            const finishWaiter = () => cleanup();
            this._finishWaiters.add(finishWaiter);

            // 當任務被外部取消時，也要從 waiter 中移除
            const originalResolve = task.resolve;
            task.resolve = () => {
                this._finishWaiters.delete(finishWaiter);
                originalResolve();
            };
        });
    }


    /**
     * 獲取當前播放的 AnimationState（用於任務管理器）
     * @returns 當前播放的 AnimationState 或 null
     */
    public getCurrentAnimationState(): AnimationState | null {

        if (!this._currentPlayName || !this._ani) {
            return null;
        }
        return this._ani.getState(this._currentPlayName);
    }

    /**
     * 獲取當前動畫的播放百分比
     * @param value 播放選擇器（可選，若不傳則取當前播放的動畫）
     * @returns 百分比 (0-100)，失敗返回 0
     */
    public getAnimationPercentage(value?: PlaySelector): number {
        let targetAniName = this._currentPlayName;
        if (value) {
            const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
            targetAniName = aniCtrl?.targetName;
        }

        if (!targetAniName || !this._ani) {
            return 0;
        }

        const aniState: AnimationState = this._ani.getState(targetAniName);
        if (!aniState) {
            return 0;
        }

        const duration = aniState.duration;
        if (duration === 0) {
            return 0;
        }

        return Math.min(100, Math.max(0, (aniState.time / duration) * 100));
    }

    /**
     * 獲取當前動畫的播放影格
     * @param value 播放選擇器（可選，若不傳則取當前播放的動畫）
     * @returns 當前影格數，失敗返回 0
     */
    public getCurrentFrame(value?: PlaySelector): number {

        let targetAniName = this._currentPlayName;
        if (value) {
            const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
            targetAniName = aniCtrl?.targetName;
        }

        if (!targetAniName || !this._ani) {
            return 0;
        }

        const aniState: AnimationState = this._ani.getState(targetAniName);
        if (!aniState) {
            return 0;
        }

        const currentTime = aniState.time;
        return Math.floor(currentTime * this.frameRate);
    }

    /**
     * 獲取動畫的總影格數
     * @param value 播放選擇器（可選，若不傳則取當前播放的動畫）
     * @returns 總影格數，失敗返回 0
     */
    public getTotalFrames(value?: PlaySelector): number {

        let targetAniName = this._currentPlayName;
        if (value) {
            const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
            targetAniName = aniCtrl?.targetName;
        }

        if (!targetAniName || !this._ani) {
            return 0;
        }

        const aniState: AnimationState = this._ani.getState(targetAniName);
        if (!aniState) {
            return 0;
        }

        const duration = aniState.duration;
        return Math.floor(duration * this.frameRate);
    }
    //============================AnimationWatchTaskManager特殊方法==========================


    /**
     * AEP獨有方法(改變aep的速度)
     * TIPS:這個AEP是包裹著spine的
     * 如果只是要單純改變animation的速度,請走setAniDataInfo進行相關屬性改變的操作
     * @example:
     *  const targetState:AniCtrlPropDef=this.peakAniDataInfo( value) as AniCtrlPropDef;
        const originalDuration = targetState.duration;
        if(originalDuration!=time)
        {
            const speed = originalDuration / time;
            const changeSpeed=GameUtilsTools.deepClone(targetState) as AniCtrlPropDef;
            changeSpeed.speed=speed;
            this.setAniDataInfo(changeSpeed);
        }
     */
    public changeSpeedWithAep(value: PlaySelector, time: number, spTargetName: string[] = []): void {

        const targetState: AniCtrlPropDef = this.peakAniDataInfo(value) as AniCtrlPropDef;
        const originalDuration = targetState.duration;

        if (originalDuration != time && time > 0) {
            const speed = originalDuration / time;
            const realSpeed = Math.round(speed * 10) / 10;//--取到小數點後1位
            const changeSpeed = GameUtilsTools.deepClone(targetState) as AniCtrlPropDef;
            changeSpeed.speed = realSpeed;

            if (this.isAEP_SPINE && this.aepSpines.length > 0 && spTargetName.length > 0) {
                for (let i: number = 0; i < this.aepSpines.length; i++) {
                    const sp = this.aepSpines[i];
                    for (let j = 0; j < spTargetName.length; j++) {
                        const duration = sp.findAnimation(spTargetName[j])?.duration;
                        if (duration) {
                            const speed = duration / time;
                            sp.timeScale = speed;
                        }
                    }
                }

            }

            this.setAniDataInfo(changeSpeed);
        }

    }


    //--這裡要改掉..因為每次都改就會一直新增20251217
    public setAniDataInfo(value: AnimationPlayInfo): void {

        let playData = this.resolveTargetName(value.targetName);
        const targetData = value as AnimationCtrlPlayData;

        if (!playData) {
            playData = new AniCtrlPropDef();
            playData.targetName = value.targetName;
            this._animationPlayInfoList.clipsInfo.push(playData);
            this._resolver.rebuildAnimationCaches();
        }
        if (this.isDefined(targetData?.wrapMode)) {
            playData.wrapMode = targetData.wrapMode;
        }
        if (this.isDefined(targetData?.speed)) {
            playData.speed = targetData.speed;
        }
        if (this.isDefined(targetData?.repeatCount)) {
            playData.repeatCount = targetData.repeatCount;
        }
        if (this.isDefined(targetData?.delay)) {
            playData.delay = targetData.delay;
        }
        this._defaultTarget = playData;
    }


    public speedUpAni(value: number): void {

    }

    public slowDownAni(value: number): void {

    }

    /**
     * 
     * @param value clip name
     * 沒有輸入的話將會針對整個動畫(全部的clip)進行暫停
     */
    public pauseAni(value?: PlaySelector): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        if (aniCtrl) {
            const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);
            if (aniState) {
                aniState.pause();
            }
        } else {
            this._ani.pause();
        }
    }

    /**
     * 
     * @param value clip name
     * 沒有輸入的話將會針對整個動畫(全部的clip)進行恢復
     */
    public resumeAni(value?: PlaySelector): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);

        if (aniState) {
            // 如果動畫目前是暫停狀態，resume() 會從當前 state.time 繼續播放
            // 如果動畫已經停止，則需要調用 play()
            if (aniState.isPaused) {
                aniState.resume();
            } else if (!aniState.isPlaying) {
                aniState.play();
            }

        } else {
            console.error(`Cannot resume: AnimationClip "${aniCtrl.targetName}" not found`);
        }
    }

    public gotoAndPlayByFrame(value: PlaySelector, frame: number): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);
        const timeByFrame: number = this.getTimeByFrame(aniCtrl.targetName, frame);
        if (timeByFrame > 0 && aniState) {
            aniState.time = timeByFrame;
            this._currentPlayName = aniCtrl.targetName;
            this.isPlaying = true;
            this._ani.play(aniCtrl.targetName);
        } else {
            console.error(`AnimationClip "${aniCtrl.targetName}" not found `);
        }
    }

    /**
     * 直接播放到最後一格
     * 如果動畫長度 < 1 秒，start 會變成負數；或是計算的 start 超過尾端
     * 所以把 start 夾在 [0, end - EPS] 之內，避免越界
     * @param value 
     */
    public gotoPlayLastFrame(value?: PlaySelector): void {

        if (!this.isPlaying) return;
        if (this._ani) {
            const EPS = 1e-6;//--避免最後一個frame沒辦法正確sample
            const aniState = this._ani.getState(this._currentPlayName);
            if (aniState) {
                aniState.pause();
                const end = aniState.duration;
                const start = Math.max(0, end - 1);
                //const finalTime = Math.max(0, Math.min(start, end - EPS));
                const finalTime = end - 0.32;//-0.32是倒數第二格的時間點(趨近)
                aniState.time = finalTime;
                aniState.sample();
                if (this.isAEP_SPINE && this.aepSpines.length > 0) {
                    for (let i: number = 0; i < this.aepSpines.length; i++) {
                        const sp = this.aepSpines[i];
                        const entry = sp.getCurrent(0);//-這邊有點抖抖得
                        if (entry) {
                            const spEnd = entry.animation.duration;
                            //const spStart = Math.max(0, spEnd - 1);
                            //const spFinalTime = Math.max(0, Math.min(spStart, spEnd - EPS));
                            const spFinalTime = spEnd - 0.32;//-0.32是倒數第二格的時間點(趨近)
                            entry.trackTime = spFinalTime;
                            sp.updateAnimation(0);
                        }
                    }
                }
                aniState.resume();
            }
        }
    }

    /**
    * 20251020新增方法
    * @param value 取得播放的動畫資料key
    * @param time 移動到某個時間點開始播放
    */
    public changePlayTime(time: number, value?: PlaySelector): void {

        if (!this.isPlaying) return;
        if (this._ani) {
            const aniState = this._ani.getState(this._currentPlayName);
            if (aniState) {
                aniState.pause();
                aniState.time = time;
                //console.log('changePlayTime:',aniState);
                //console.log();
                if (this.isAEP_SPINE && this.aepSpines.length > 0) {
                    for (let i: number = 0; i < this.aepSpines.length; i++) {

                        const sp = this.aepSpines[i];
                        const entry = sp.getCurrent(0);//-這邊有點抖抖得
                        if (entry) {
                            let moveToStartTime = time;
                            if (moveToStartTime <= 0) moveToStartTime = 0;
                            entry.trackTime = moveToStartTime;
                            sp.updateAnimation(0);
                        }
                    }
                }
                aniState.sample();
                aniState.resume();
            }
        }

    }

    public gotoAndPlayByTime(value: PlaySelector, time: number): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);

        if (aniState && time >= 0) {
            this._currentPlayName = aniCtrl.targetName;
            this.isPlaying = true;
            aniState.time = time;
            // 執行採樣 (確保在播放前，節點屬性已經對齊到該時間點)
            aniState.sample();
            // 使用 resume() 或 play() 啟動
            // 如果動畫之前是暫停的，resume() 會從 current time 繼續
            // 如果動畫是停止的，play() 會啟動它
            aniState.play();

        } else {
            console.error(`gotoAndPlayByTime Error: AnimationClip "${aniCtrl?.targetName}" not found`);
        }
        /*
        if (aniState) {
            aniState.time = time;
            this._currentPlayName = aniCtrl.targetName;
            this.isPlaying = true;
            this._ani.play(aniCtrl.targetName);
        }*/
    }


    public gotoAndStopByTime(value: PlaySelector, time: number): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);
        //確保 aniState 存在，且 time 為合理數值 (>= 0)
        if (aniState && time >= 0) {

            // 必須先確保動畫狀態是啟動的 (Active)
            // 如果動畫從未播放過，直接設 time 有時會失效
            if (!aniState.isPlaying) {
                aniState.play();
            }
            //設置目標時間
            aniState.time = time;
            //立即暫停，防止其隨幀前進
            aniState.pause();
            //強制渲染系統立即更新該時間點的屬性到節點上
            aniState.sample();

        } else {
            console.error(`gotoAndStopByTime Error: AnimationClip "${aniCtrl?.targetName}" not found or invalid time: ${time}`);
        }
    }

    public gotoAndStopByFrame(value: PlaySelector, frame: number): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);
        const timeByFrame: number = this.getTimeByFrame(aniCtrl.targetName, frame);

        if (aniState && timeByFrame >= 0) {
            if (!aniState.isPlaying) {
                aniState.play();
            }

            aniState.time = timeByFrame;
            aniState.pause();
            //強制更新當前幀數據到節點畫面上 (解決沒反應的關鍵)
            aniState.sample();
        } else {
            console.error(`AnimationClip "${value}" not found `);
        }
        /*
        if (timeByFrame > 0 && aniState) {
            aniState.time = timeByFrame;
            aniState.pause();
        } else {
            console.error(`AnimationClip "${value}" not found `);
        }*/
    }

    //--播放到那個time然後停止
    public playToTimeAndStop(value: PlaySelector, time: number): void {

        this._gotoAndStopTime = time;
        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        this.schedule(this.checkAniStateTimeEveryFrame, 1 / 60, macro.REPEAT_FOREVER);
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;
        this._ani.play(aniCtrl.targetName);
    }


    //--播放到那個Frame然後停止
    public playToFrameAndStop(value: PlaySelector, frame: number): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        const timeByFrame: number = this.getTimeByFrame(aniCtrl.targetName, frame);
        if (timeByFrame > 0) {
            this._gotoAndStopTime = timeByFrame;
            this.schedule(this.checkAniStateTimeEveryFrame, 1 / 60, macro.REPEAT_FOREVER);
            this.isPlaying = true;
            this._currentPlayName = aniCtrl.targetName;
            this._ani.play(aniCtrl.targetName);
        } else {
            console.error(`AnimationClip "${value}" not found `);
        }
    }

    public addEventToAniByFrame(value: string, frame: number): void {

    }

    public addEventToAniByTime(value: string, time: number): void {

    }


    public reversePlay(value: string, speed: number = -1): void {

        const aniCtrl: AniCtrlPropDef = this.resolveTargetName(value);
        if (aniCtrl) {
            aniCtrl.speed = speed;
            this._currentPlayName = aniCtrl.targetName;
            this._ani.play(value);
        }
    }


    public playAniWithAniCtrDef(value: AniCtrlPropDef): void {

    }

    /**
     * <這邊不會掛上監聽就單純的for中軟美術切回default的動畫狀態>
     * 播放動畫預設狀態,有動畫播放
     */
    public goBackToDefault(flag: boolean = true): void {

        if (!this._ani) return;

        if (flag) {
            this.safeResolveAniPromise();
            this.safeResolveAniCallback();
        }

        const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(AnimationStateType.Default);
        const state: AnimationState = this._ani.getState(aniCtrl.targetName);
        if (!state) { console.error(`AnimationClip "Default" not found`); return; }

        this.ensureHub();
        this._finishBackDefault = false;      // 已回 Default，不需要再回 Default
        this._isLoop = state.wrapMode === AnimationClip.WrapMode.Loop;
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;

        // 不強制等完成；若你想回報一次「到位」，可以打開以下保底 + waiter，等一次就好：
        // const { promise: endP, off } = this._waitFinishOnce();
        // const guard = this._makeGuardByState(state);
        // Promise.race([endP, guard.promise]).finally(() => { try{off();}catch{} try{guard.cancel();}catch{} });

        this._ani.play(aniCtrl.targetName);
        /*
        if (flag) {
            this.safeResolveAniPromise();
            this.safeResolveAniCallback();
        }
        const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(AnimationStateType.Default);
        if (this._ani) {
            this.isPlaying = true;
            this._ani.off(Animation.EventType.FINISHED, this._onAniFinished, this);
            this._ani.play(aniCtrl.targetName);
        }*/
    }

    public playAni(value?: PlaySelector, backDefault: boolean = false): void {

        //this.safeResolveAniPromise();
        const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(value);

        if (!this._ani) return;

        const state: AnimationState = this._ani.getState(aniCtrl.targetName);
        if (!state) {
            console.error(`AnimationClip "${aniCtrl.targetName}" not found`); return;
        }
        //console.log("準備播放:", aniCtrl.targetName);
        //console.log("State 狀態:", state?.isPlaying, "時長:", state?.duration);
        this._ani.play(aniCtrl.targetName);
        state.sample();

        this.ensureHub();
        this._finishBackDefault = backDefault;
        if (state.wrapMode === AnimationClip.WrapMode.Loop) this._isLoop = true;
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;
        this._currentPlayingAniName = aniCtrl.targetName;

        // 一次性 waiter（不互相踐踏）
        const { promise: endP, off } =
            state.wrapMode === AnimationClip.WrapMode.Loop ? this.waitLastFrameOnce() : this.waitFinishOnce();

        // 保底
        const guard = this._makeGuardByState(state);
        this._activeGuards.add(guard);
        const settle = () => {
            try { off(); } catch { }
            try { guard.cancel(); } catch { }
            this._activeGuards.delete(guard);
            this._finalizeFinish();
        };
        endP.then(settle).catch(settle);
        guard.promise.then(() => settle).catch(() => { });
        //this._ani.play(aniCtrl.targetName);


    }

    public playAniWithFrameEvtCallBack(
        callBackFrameEvent: Function,
        callBackOnFinish: Function, // 新增：動畫結束時要呼叫的回呼函式
        backDefault: boolean = false,
        value?: PlaySelector,
        opt?: {
            predicate?: (...args: any[]) => boolean;  // 過濾要吃的 frame event
            fallbackOnMiss?: boolean;                  // 預設 false：沒吃到 frame event 不呼叫 callback,
            extraArgs?: any;                        // 預設 []：額外帶給 frame event callback 的參數
        }
    ): void {

        this.safeResolveAniPromise();
        const aniCtrl = this.getAniIdAndSetAniState(value);
        if (!aniCtrl) { this._finalizeFinish(); return; }

        const state: AnimationState = this._ani.getState(aniCtrl.targetName);
        if (!state) { this._finalizeFinish(); return; }

        // 確保 Hub 綁好（FINISHED / LASTFRAME 轉發）
        this.ensureHub?.();

        // loop 標記，避免 generalAniCompleteCheck 誤判
        this._isLoop = (state.wrapMode === AnimationClip.WrapMode.Loop);

        this._finishBackDefault = backDefault;
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;

        // 1) 等一次 frame event（用 predicate 過濾）
        const { promise: feP, off: offFE } = this.waitFrameEventOnce(opt?.predicate);

        // 2) 等一次完成事件（Normal=FINISHED；Loop=LASTFRAME）
        const { promise: endP, off: offEnd } =
            this._isLoop ? this.waitLastFrameOnce() : this.waitFinishOnce();

        // 3) 保底守門員：動畫時長 * 1.5
        const nominalDur = Math.max(0.001, state.duration / Math.max(0.0001, Math.abs(state.speed || 1)));
        const guard = GameUtilsTools.DeferByTweenPromiseWithCancel(nominalDur * 1.5);
        this._activeGuards.add(guard);
        // 開播
        this._ani.play(aniCtrl.targetName);

        feP.then(args => {
            // 幀事件發生時，執行回呼
            try { callBackFrameEvent(...(args ?? []), opt?.extraArgs); } catch { }
            try { offFE(); } catch { }
        }).catch(() => {
            // 如果幀事件 promise 被拒絕（例如在超時後），這裡不做任何事
        });

        // 處理動畫結束事件，並進行最終清理
        endP.then(() => {
            // 動畫正常結束時執行
            try { callBackOnFinish(); } catch { }
            // 手動取消守門員，並從活躍列表中移除
            try { guard.cancel(); } catch { }
            this._activeGuards.delete(guard);
        }).catch(() => {
            // 動畫結束 promise 被拒絕時執行
            // (例如因為手動取消動畫等情況)
        }).finally(() => {
            // 無論成功或失敗，都進行最終清理
            /*
            console.log(
                'check_lastFrame_map_', this._lastFrameWaiters,
                'check_finish_map_', this._finishWaiters
            );*/
            try { offFE(); } catch { }
            try { offEnd(); } catch { }
            //try { guard.cancel(); } catch { }
            //this._activeGuards.delete(guard);
            this._finalizeFinish();
        });



        // 處理守門員，負責清理所有 promise
        guard.promise.then(() => {
            // 超時時，取消所有監聽器
            try { offFE(); } catch { }
            try { offEnd(); } catch { }
        }).finally(() => {
            this._finalizeFinish();
        });

        /*
        const cleanup = () => {
            try { offFE(); } catch { }
            try { offEnd(); } catch { }
            try { guard.cancel(); } catch { }
            this._activeGuards.delete(guard);
        };

        // 讓所有 promise 都指向同一個清理函數，以避免重複執行
        feP.finally(cleanup);
        endP.finally(cleanup);
        guard.promise.finally(cleanup);*/





        /*
        //--frameEvent 和 complete 誰先到就執行resolve
        // 聚合結果：誰先到就 settle
        let settled = false;
        const cleanup = () => {
            if (settled) return;
            settled = true;
            try { offFE(); } catch { }
            try { offEnd(); } catch { }
            try { guard.cancel(); } catch { }
            this._activeGuards.delete(guard);
        };

        // race，但保留「是哪條路徑先到」的資訊
        Promise.race([
            feP.then(args => ({ kind: 'frame' as const, args })),
            endP.then(() => ({ kind: 'end' as const })),
            guard.promise.then(() => ({ kind: 'guard' as const })),
        ]).then(res => {
            cleanup();
            // 只有 frame event 觸發時必定呼叫 callback；
            // 若你希望「沒等到也要跑一次 callback」→ 設 opt.fallbackOnMiss = true
            if (res.kind === 'frame') {
                try { callBack(...(res.args ?? [])); } catch { }
            } else if (opt?.fallbackOnMiss) {
                try { callBack(); } catch { }
            }
            this._finalizeFinish();
        }).catch(() => {
            cleanup();
            this._finalizeFinish();
        });
        */

    }
    /**
     * 
     * @param callBack 回傳值會帶到 Promise 裡面
     * @param backDefault 是否在動畫結束後回到預設動畫
     * @param value 播放狀態名稱
     * @param cbArgs 回傳參數
     * @returns 
     * @example:
     * 不回傳:
     * this.playAniWithCallBackParameter(() => {
        console.log('done!');
        }, false, { aniState: AnimationStateType.Win });
     * 帶參數 + 取回傳值
        const reward = await this.playAniWithCallBackParameter<number>(
        (groupId: number, nodeName: string) => {
            // …做點收尾，回傳一個數字
            return groupId * 10;
        },
        false,
        { aniState: AnimationStateType.Win },
        [999, 'IconBox']   // cbArgs
        );
      *callback 回傳 Promise
        const meta = await this.playAniWithCallBackParameter(async () => {
        await doAsyncCleanup();
        return { ok: true };
        });
      *callback 把收到的參數原封不動回傳  
        const result = await this.playAniWithCallBackParameter<any[]>(
        (...args) => args,                       // ← 原封不動回傳
        false,
        { aniState: AnimationStateType.Win },
        [123, 'hello', { x: 1 }]                 // ← 丟進去的參數
        );  

     */
    public playAniWithCallBackParameter<R = void>(
        callBack: (...args: any[]) => R | Promise<R>,
        backDefault: boolean = false,
        value?: PlaySelector,
        cbArgs: any[] = []
    ): Promise<R> {

        //this.safeResolveAniPromise();
        const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(value);
        if (!this._ani) return Promise.reject(new Error('Animation not available'));

        const state: AnimationState = this._ani.getState(aniCtrl.targetName);
        if (!state) return Promise.reject(new Error(`AnimationClip "${aniCtrl.targetName}" not found`));

        this.ensureHub(); // 確保 Hub 綁好
        this._finishBackDefault = backDefault;
        this._isLoop = (state.wrapMode === AnimationClip.WrapMode.Loop);
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;

        const { promise: endP, off } = this._isLoop ? this.waitLastFrameOnce() : this.waitFinishOnce();
        const guard = this._makeGuardByState(state);
        this._activeGuards.add(guard);
        let done = false;
        const settle = async (resolve: (v: R) => void, reject: (e: any) => void) => {
            if (done) return;
            done = true;
            try { off(); } catch { }
            try { guard.cancel(); } catch { }
            try { this._activeGuards?.delete?.(guard); } catch { }

            try {
                // call back
                const out = await callBack(...cbArgs as any[]);
                this._finalizeFinish();
                resolve(out as R);
            } catch (e) {
                // callback 丟錯 → 讓呼叫端 catch
                this._finalizeFinish();
                reject(e);
            }
        };

        // 回傳一個會在 settle 時帶出 callback 結果的 Promise
        const result = new Promise<R>((resolve, reject) => {
            endP.then(() => settle(resolve, reject))
                .catch(() => settle(resolve, reject));
            guard.promise.then(() => settle(resolve, reject))
                .catch(() => { }); // guard 自己失敗忽略
        });

        this._ani.play(aniCtrl.targetName);
        return result;
    }

    public playAniWithCallBack(callBack: Function, backDefault: boolean = false, value?: PlaySelector): void {

        //this.safeResolveAniPromise();
        const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(value);
        if (!this._ani) return;

        const state: AnimationState = this._ani.getState(aniCtrl.targetName);
        if (!state) { console.error(`AnimationClip "${aniCtrl.targetName}" not found`); return; }

        this.ensureHub();
        this._finishBackDefault = backDefault;
        if (state.wrapMode === AnimationClip.WrapMode.Loop) this._isLoop = true;
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;
        const { promise: endP, off } =
            state.wrapMode === AnimationClip.WrapMode.Loop ? this.waitLastFrameOnce() : this.waitFinishOnce();

        const guard = this._makeGuardByState(state);
        this._activeGuards.add(guard);
        const settle = () => {
            try { off(); } catch { }
            try { guard.cancel(); } catch { }
            this._activeGuards.delete(guard);
            try { callBack(); } catch { }
            this._finalizeFinish();
        };
        endP.then(settle).catch(settle);
        guard.promise.then(() => settle).catch(() => { });

        this._ani.play(aniCtrl.targetName);
        /*
        this._finishBackDefault = backDefault

        this._aniCallBackCompleteHandler = (_t, _s): void => {
            this.safeResolveAniCallback(); // 統一結束處理
            this._finalizeFinish();
        }
        this._aniCallback = () => {
            callBack();
            this.removeListen();
            this._aniCallback = undefined;
        };

        const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(value);
        if (!aniCtrl) {
            console.error(`AnimationClip "${value}" not found `);
            this._aniCallBackCompleteHandler = null;
            this.safeResolveAniCallback(); // 統一結束處理
            this._finalizeFinish();
            return;
        }
        if(aniCtrl.wrapMode==AnimationClip.WrapMode.Loop)
        {
            this._isLoop=true;
        }
        this._ani.once(Animation.EventType.FINISHED, this._aniCallBackCompleteHandler, this);
        //const aniCtrl: AniCtrlPropDef = this.getAniIdAndSetAniState(value);
        this._ani.play(aniCtrl.targetName);
        this.isPlaying = true;*/
    }

    public playAniInPromise(value?: PlaySelector, backDefault: boolean = false): Promise<void> {

        //this.safeResolveAniPromise();
        const aniCtrl = this.getAniIdAndSetAniState(value);
        const aniState: AnimationState = this._ani.getState(aniCtrl.targetName);
        if (!aniState) return Promise.reject(new Error('No animation state'));
        this.ensureHub?.();

        // 保底：動畫時長 * 1.5
        const nominalDur = Math.max(0.001, aniState.duration / Math.max(0.0001, Math.abs(aniState.speed || 1)));
        const guard = GameUtilsTools.DeferByTweenPromiseWithCancel(nominalDur * 1.5);
        this._activeGuards.add(guard);
        // 這次要等的「一次性 waiter」
        //const { promise: endP, off } =
        //    (aniState.wrapMode === AnimationClip.WrapMode.Loop) ? this.waitLastFrameOnce() : this.waitFinishOnce();


        //獲取 waiter
        // loop 狀態，避免 generalAniCompleteCheck 誤判
        const isLoop = (aniState.wrapMode === AnimationClip.WrapMode.Loop);
        const { promise: endP, off } = isLoop ? this.waitLastFrameOnce() : this.waitFinishOnce();

        this._isLoop = isLoop;
        this._finishBackDefault = backDefault;
        this.isPlaying = true;
        this._currentPlayName = aniCtrl.targetName;
        this._ani.play(aniCtrl.targetName);

        return new Promise<void>((resolve) => {
            let done = false;

            const settle = () => {
                if (done) return;


                // ---1217 test改變順序降低延遲 立即清理監聽 (同步執行) ---
                done = true;
                this._pendingPlayResolves.delete(settle);
                this._activeGuards.delete(guard);
                try { off(); } catch { }
                try { guard.cancel(); } catch { }

                // --- B. 核心優化：優先釋放外部 await ---
                // 這樣在 Microtask 檢查點，外部業務邏輯會排在 finalize 之前執行
                resolve();

                // ---  後續收尾 (切換動畫到 Default 等) ---
                this._finalizeFinish();
                /*
                done = true;
                this._pendingPlayResolves.delete(settle);   //從 pending 表移除
                try { off(); } catch { }
                this._activeGuards.delete(guard);
                try { guard.cancel(); } catch { }
                this._finalizeFinish();
                resolve();
                */
            };

            // 讓 safeResolveAniPromise() 可以「提前結束」這次等待
            this._pendingPlayResolves.add(settle);

            endP.then(settle).catch(settle);
            guard.promise.then(settle).catch(() => { });
        });

    }

    //====================停止/清除系列============================================================================
    public resetData(): void {

        this.forceToDoBeforeDestroy();
        this.tokenID = '';//--單一的識別碼
        this._currentTarget = null;
        this._defaultTarget = null;
        this.slotMachineIndexInfo = null;
        this._gotoAndStopTime = 0;
        this.isPlaying = false;
        this._currentPlayName = '';
        this.groupID = [];//--會有同一個物件在不同的group裡面(第四軸重複的)
        this._isLoop = false;

    }

    public forceToDoBeforeDestroy(): void {
        if (this._ani) {
            this.isPlaying = false;
            this._isLoop = false;
            this._currentPlayName = '';
            this.safeResolveAniPromise();
            this.safeResolveAniCallback?.();
            if (this.particleSystem) {
                this.particleSystem.stopParticle();
            }

            for (const g of Array.from(this._activeGuards)) {
                try { g.cancel(); } catch { }
            }
            this._activeGuards.clear();

            this.restoreOriginAniData();
            this.removeListen();
            if (this.goBackDefaultWithoutDestroy) {
                this.goBackToDefault(false);//--回到預設狀態
            }
        }

        if (this._hubBound) {
            this._ani.off(Animation.EventType.FINISHED, this._onAniFinishedHub, this);
            this._ani.off(Animation.EventType.LASTFRAME, this._onAniLastFrameHub, this);
            this._hubBound = false;
        }

        this._finishWaiters.clear();
        this._lastFrameWaiters.clear();
        this._frameEvtWaiters.clear();


    }
    //-不能用onDestroy這個字component拿去用了
    public beforeDestroy(): void {
        this.forceToDoBeforeDestroy();
    }

    protected removeListen(): void {

        if (this._onFinishedForPromise) {
            this._onFinishedForPromise = undefined;
        }
        if (this._onLastFrameForPromise) {
            this._onLastFrameForPromise = undefined;
        }
        if (this._aniCallBackCompleteHandler) {
            this._aniCallBackCompleteHandler = undefined;
        }
        if (this._aniCallBackFrameEvtCompleteHandler) {
            this._aniCallBackFrameEvtCompleteHandler = undefined;
        }

    }
    //--銷毀前處理掉promise resolve避免沒銷毀的pending promise
    protected safeResolveAniPromise(resolve?: () => void): void {

        // 先跑舊路徑
        /*
        const r = resolve ?? this._aniResolvePromise;
        this._aniResolvePromise = undefined;
        try { r?.(); } catch {}
        */

        // ★ 新增：把所有尚未 settle 的 play promise 都提前結束
        for (const fn of Array.from(this._pendingPlayResolves)) {
            try { fn(); } catch { }
        }
        this._pendingPlayResolves.clear();

        for (const g of Array.from(this._activeGuards)) {
            try { g.cancel(); } catch { }
        }
        this._activeGuards.clear();
        /*
        if (this._onFinishedForPromise) {
            this._ani.off(Animation.EventType.FINISHED, this._onFinishedForPromise, this);
            this._onFinishedForPromise = undefined;
        }

        if (this._onLastFrameForPromise) {
            this._ani.off(Animation.EventType.LASTFRAME, this._onLastFrameForPromise, this);
            this._onLastFrameForPromise = undefined;
        }

        const r = resolve ?? this._aniResolvePromise;
        this._aniResolvePromise = undefined;
        r?.();
        */
    }

    //--廢棄
    protected safeResolveAniFrameCallback(): void {
        if (this._aniCallBackFrameEvtCompleteHandler) {
            this._ani.off(Animation.EventType.FINISHED, this._aniCallBackFrameEvtCompleteHandler, this);
            this._aniCallBackFrameEvtCompleteHandler = undefined;
        }
        this._aniFrameEventCallBack?.();
        this._aniFrameEventCallBack = undefined;
    }
    //--銷毀前處理掉ani complete callback
    //--廢棄
    protected safeResolveAniCallback(): void {
        if (this._aniCallBackCompleteHandler) {
            this._ani.off(Animation.EventType.FINISHED, this._aniCallBackCompleteHandler, this);
            this._aniCallBackCompleteHandler = undefined;
        }
        this._aniCallback?.();
        this._aniCallback = undefined;
    }

    public forceToStopAni(backDefault?: false): void {

        this.stopWith({
            overrideAfterPlayFlag: true,
            clear: StopClearMode.ALL,
            resolvePromises: true,
            resolveCallback: true,
            goBackToDefault: backDefault,
        });
    }

    //--播完就強制銷毀回收
    public stopAndRecycle(): void {
        this.forceToDoBeforeDestroy();
    }

    //--只有停止沒有回到預設狀態
    public stopAni(backDefault: boolean = false): void {
        this.stopWith({ goBackToDefault: backDefault });
    }

    /**
    * 非常確定當下就是要立刻馬上停止,不管動畫是哪一種
    * resolvePromises/resolveCallback/resetPose
    * 都會強制執行接管後續收尾動作
    */
    public stopNow(backDefault: boolean = false): void {
        this.stopWith({
            overrideAfterPlayFlag: true,
            clear: StopClearMode.ALL,
            resolvePromises: true,
            resolveCallback: true,
            goBackToDefault: backDefault,
        });
    }


    private applyClearMode(mode: StopClearMode): void {
        if (!this._ani) return;
        if (mode === StopClearMode.ALL) {
            this.removeListen();
            this.unscheduleAllCallbacks();
        }
    }

    public onAniComplete(backDefault: boolean = false): void {

        this.stopWith({
            overrideAfterPlayFlag: false,
            // 與原本行為一致：不動 promise/callback、不停粒子、不重置 Pose
            resolvePromises: false,
            resolveCallback: false,
            stopParticles: false,
            goBackToDefault: backDefault
        });
    }

    //---強制中止promise動畫(ex:表演到一半的時候直接停止進行下面的動作(中斷輪播之類的))
    public stopPromiseAni(backDefault: boolean = false): void {

        this.stopWith({
            overrideAfterPlayFlag: true,//--略過_afterPlayDoStop
            clear: StopClearMode.ALL,
            resolvePromises: true,
            resolveCallback: true,
            stopParticles: true,
            goBackToDefault: backDefault,
        });
    }

    public stopWith(opt: IStopOptions = {}): void {
        if (!this._ani) return;

        // 先關狀態與外部效果
        this._ani.stop();
        this.isPlaying = false;
        this._isLoop = false;
        this._currentPlayName = '';
        this._gotoAndStopTime = 0;
        this._currentTarget = null;

        // 預設選項
        const stopParticles = opt.stopParticles ?? true;
        if (stopParticles && this.particleSystem) {
            this.particleSystem.stopParticle();
        }

        // 可選：收尾一次性 callback / promises
        if (opt.resolveCallback) {
            this.safeResolveAniCallback();
        }
        if (opt.resolvePromises) {
            this.safeResolveAniPromise();
        }

        // 清理策略(因為animation跟spine不同沒有track的概念)
        let mode: StopClearMode = StopClearMode.NONE;
        if (opt.overrideAfterPlayFlag) {
            mode = StopClearMode.ALL;
        } else {
            mode = this._afterPlayDoStop ? StopClearMode.ALL : (opt.clear ?? StopClearMode.NONE);
        }

        // 執行清理
        this.applyClearMode(mode);
        //-直接重播回到default狀態(中軟美術提供的素材適合使用)
        if (opt.goBackToDefault) {
            this.playAni(AnimationStateType.Default);
        }
    }

    private getTimeByFrame(value: string, frame: number): number {

        const clip: AnimationClip = this._ani.clips.find(clip => clip.name === value);
        if (clip) {

            // 直接使用 目標幀 / 採樣率 (FPS) 
            // 例如：第 1 幀 / 30 FPS = 0.0333s
            const triggerTime: number = frame / clip.sample;
            return Math.min(triggerTime, clip.duration);
            /*
            const durationInSeconds: number = clip.duration;//-totaltime
            const totalFrame: number = Math.floor(durationInSeconds * clip.sample);
            //--確保根據總幀數和動畫總時長正確計算出目標時間(原本沒有* durationInSeconds)
            const triggerTime: number = (frame / totalFrame) * durationInSeconds;
            
            //const time = frameNumber / this.frameRate;
             
            return triggerTime;
            */

        } else {
            return -1;
        }
    }


    private checkAniStateTimeEveryFrame = (): void => {

        const aniState: AnimationState = this._ani.getState(this._currentTarget.targetName);
        if (!aniState) {
            console.error(`AnimationState "${this._currentTarget.targetName}" not found.`);
            this.unschedule(this.checkAniStateTimeEveryFrame);
            this.stopAni();
            return;
        }
        //--加入誤差值是因為可能會是浮點數
        if (aniState.time >= this._gotoAndStopTime - 0.001) {
            this.unschedule(this.checkAniStateTimeEveryFrame);
            this.stopAni();
        }
    }

    private isDefined<T>(value: T | undefined | null): boolean {
        return value !== undefined && value !== null;
    }

    //---拿播放資料和寫資料的地方
    private getAniIdAndSetAniState(value?: PlaySelector): AniCtrlPropDef {

        const aniCtrl = this.resolveTargetName(value);
        this.setAniStateForCustomizeClipData(aniCtrl);
        return aniCtrl;
    }

    private setAniStateForCustomizeClipData(clipData?: AniCtrlPropDef): void {
        if (clipData) {
            const aniState: AnimationState = this._ani.getState(clipData.targetName);
            if (aniState) {
                aniState.wrapMode = clipData.wrapMode ?? aniState.wrapMode;
                aniState.speed = clipData.speed ?? aniState.speed;
                aniState.repeatCount = clipData.repeatCount ?? aniState.repeatCount;
                aniState.delay = clipData.delay ?? aniState.delay;
            }
        }
    }

    protected resolveTargetName(sel?: PlaySelector): AniCtrlPropDef {
        //--查表分開到特殊工具處理
        const target = this._resolver?.resolveProp(sel);
        if (target) {
            this._currentTarget = target;
            return target;
        }

        this._currentTarget = this._defaultTarget;
        return this._defaultTarget;
    }
    //--20251011-新增直接查詢播放資料的功能(他不會改變當前播放狀態)
    public peakAniDataInfo(value: PlaySelector): AnimationPlayInfo {
        return this._resolver?.resolveProp(value);
    }


    /*
    private checkAniPlayData(targetName: string): AniCtrlPropDef {
        const foundData = this._animationPlayInfoList.clipsInfo.find(data => data.targetName === targetName);
        if (foundData) {
            this._currentTarget = foundData;
            return foundData;
        }
        this._currentTarget = this._defaultTarget;
        return this._defaultTarget;
    }*/

    private getOriginAniData(value: string): AniCtrlPropDef {
        return this._originAniData.find(clip => clip.targetName === value);
    }

    public onObjInstance(): void {

    }
    public onAfterDestroy(): void {
        this._resolver?.onDispose?.();
        this._resolver = undefined;
    }


}


