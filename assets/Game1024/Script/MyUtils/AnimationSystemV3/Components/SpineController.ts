import { _decorator, CCBoolean, CCString, Component, Enum, EventTarget, Node, sp } from 'cc';
import { IAnimationControl } from '../Definitions/IAnimationControl';
import { ParticleExtension } from './ParticleExtension';
import { AnimationPlayInfo, SpinePlayParams, CleanTrackType, RepeatOption } from '../Definitions/AnimationDataOptions';
import { PlaySelector } from '../Definitions/IPlayOptions';
import { AnimationSelectionResolver } from '../AniTools/AniSelectionResolver';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { FindComponent } from '../../FindComponent';
import { SpineAniPlayInfoList, SpineCtrlPropDef, AnimationStateList, ClearTrackTypeState, AnimationStateType, SpineSequenceList } from './AniStateLists/AnimationPlayStateBase';
import { IStopOptions, StopClearMode } from '../Definitions/IStopOptions';
import { SpineSequencePlay } from './AniStateLists/SpineSequencePlay';
import { SEQUENCE_EVENTS } from './AniStateLists/Events';
import { EVENT_DATA } from '../../EventSystem/EventData';
import { ANI_SYS_EVENTS, AniSysEventData } from './AniEvents/AniSysEvents';
import { IEventDispatcher } from '../../EventSystem/EventDispatcher';
import { IAniPlayParams, ITrackState } from '../Definitions/ITrackState';

const { ccclass, property } = _decorator;


@ccclass('SpineController')
export class SpineController extends Component implements IAnimationControl {

    isLoaded: boolean = false;//--是否已經載入完成(準備完成資料初始化動作)
    slotMachineIndexInfo?: IReelInfo;
    groupID: number[];//--會有同一個物件在不同的group裡面(第四軸重複的)
    isPlaying: boolean;
    keep: boolean;//--不刪除且持續留在場景中
    //--resetData會保留此資料
    @property({ type: SpineAniPlayInfoList, displayName: 'SpineAniPlayInfoList', visible: true, tooltip: '播放資料清單' })
    protected _animationPlayInfoList: SpineAniPlayInfoList = new SpineAniPlayInfoList();

    //--他會依照animationPlayStateList的clipsInfo來決定要播放的動畫
    @property({ type: AnimationStateList, displayName: 'animationStateList', visible: true, tooltip: '狀態控制動畫清單' })
    protected _animationStateList: AnimationStateList = new AnimationStateList();


    @property({ type: CCBoolean, visible: true, tooltip: '中軟的要勾選,不然預設會先clearTracks一次' })
    protected _useDefaultInit: boolean = true;//--是否要使用預設的初始化(中軟美術會設定default的動畫,總部則不會使用)

    @property({ visible: true, tooltip: 'spineFPS' })
    protected _frameRate: number = 30;

    @property({ tooltip: 'prefab(放component的nodeId)的node id' })
    targetNodeId: string = '';//--prefab(放component的nodeId)的node id

    @property({ type: ParticleExtension, displayName: 'particleSystem', visible: true, tooltip: '粒子系統' })
    particleSystem: ParticleExtension;

    @property({ tooltip: '單一識別碼' })
    tokenID: string = '';//--單一的識別碼

    @property({ tooltip: 'prefabKey(用來辨識prefab的)' })
    prefabKey: string = '';//--prefab的key(用來辨識prefab的)

    @property({ tooltip: '回收回到預設狀態,不做動畫本身清除重置<中軟專屬要勾選>' })
    goBackDefaultWithoutDestroy: boolean = false;

    @property({ visible: true, tooltip: '是否要播放完畢後停止' })
    protected _afterPlayDoStop: boolean = true;

    @property({ type: ClearTrackTypeState, visible: true, tooltip: '清除模式(中軟要選擇CURRENT_TRACK)' })
    protected _clearTracks: ClearTrackTypeState = new ClearTrackTypeState();

    //--20251222-整併,舊的SpineSequencePlay class 刪除-
    @property({ type: SpineSequenceList, visible: true, displayName: 'SpineSequenceData', tooltip: 'Spine動畫序列清單' })
    private _sequenceData: SpineSequenceList = new SpineSequenceList();


    //@property({ type: SpineSequencePlay, visible: true, tooltip: '使用播放序列腳本' })
    //protected _spineSequencePlay: SpineSequencePlay;
    //---20250522--FIX spine用2進位資料後,讀取skin的attachments會有問題(因為沒有JSON可以讀取了)
    @property({ type: [CCString], visible: true, tooltip: 'defaultSkins' })
    protected _defaultSkins: string[] = [];
    protected _spine: sp.Skeleton;
    protected _duration: number;//--當前播放的總長度
    protected _frames: number;//--當前播放的總frame數
    protected _secondsPerFrame: number;//--每一個frame的時間
    protected _aniStartTime: number;//--每個trackEntry的開始時間
    protected _aniEndTime: number;//--每個trackEntry的結束時間
    protected _repeatOption: RepeatOption = { isRepeat: false, count: 0 };//--重複次數
    protected _targetTimeForPlayToTimeAndStop: number;
    protected _isReverse: boolean;
    protected _isPlayToTimeAndStop: boolean;
    protected _isLoop: boolean;
    protected _originSkinData: { [key: string]: sp.spine.Attachment | {} };
    protected _defaultSkin: string = 'default';
    protected _defaultTarget: SpineCtrlPropDef = null;
    protected _currentTarget: SpineCtrlPropDef = null;
    //--20251221---支援多軌道動畫播放的暫時遷移過渡方案
    protected _trackStates: Map<number, ITrackState> = new Map();
    protected _trackPromises: Map<number, (v?: any) => void> = new Map();
    protected _trackCallbacks: Map<number, Function> = new Map();
    //--20251221---支援多軌道動畫播放的暫時遷移過渡方案

    protected _eventTarget: EventTarget;
    protected _mapEvent: Map<string, ((...args: any[]) => void)[]> = new Map();
    protected _mapMultipleCompleteEvent: Map<string, () => void> = new Map();
    private _handlerCacheMap: Map<string, () => void> = new Map(); // cache(確保產生唯一的)
    protected _isListenForKeyFrame: boolean = false;
    protected _spineAniResolvePromise: ((trackEntry?: sp.spine.TrackEntry) => void) | null; // promise resolve 函式
    protected _sequenceResolvePromise: (() => void) | null; // promise resolve 函式
    protected _spineSequencePlayFrameEventCallBack: (value?: any) => void;
    /** * key: targetName (動畫在 Spine 裡的名稱，或定義的標籤)
     * value: TProp (也就是 SpineCtrlPropDef，包含所有播放物理參數)
     */
    private _targetName2Prop = new Map<string, SpineCtrlPropDef>();
    //protected _spineAniCallback?: () => void;
    protected generalAniCompleteCheck: (trackEntry?: sp.spine.TrackEntry) => void;

    protected _resolver: AnimationSelectionResolver<any, SpineCtrlPropDef>;

    private _dirtyFirstOnLoad: boolean = false;//---用來判斷是否第一次onLoad

    get spine(): sp.Skeleton {
        return this._spine;
    }

    get animationPlayInfoList(): SpineAniPlayInfoList {
        return this._animationPlayInfoList;
    }

    // 舊的變數改名為私有，或直接移除改用 getter
    get currentTarget(): SpineCtrlPropDef {
        // 永遠回傳 Track 0 的資料，如果 Track 0 沒在播，就回傳 default
        return this._trackStates.get(0)?.target ?? this._defaultTarget;
    }

    set currentTarget(value: SpineCtrlPropDef) {
        // 當舊代碼執行 this._currentTarget = data 時
        // 我們自動幫它更新到 Track 0 的狀態映射表中
        this.updateTrackState(0, value);
    }

    get defaultTarget(): SpineCtrlPropDef {
        return this._defaultTarget;
    }

    set spineSequencePlayFrameEventCallBack(value: (value?: any) => void) {
        this._spineSequencePlayFrameEventCallBack = value;
    }

    //--用來存放原始的動畫資料reset將會塞回去
    private _originAniData: Map<string, SpineCtrlPropDef> = new Map<string, SpineCtrlPropDef>();


    constructor() {
        super();
        this.isPlaying = false;
        //--_duration/_frames/_secondsPerFrame這些要播放才拿的到
        this._duration = 0;
        this._frames = 0;
        this._secondsPerFrame = 0;
        this._aniStartTime = 0;
        this._aniEndTime = 0;
        this._isReverse = false;
        this._isLoop = false;
        this._isPlayToTimeAndStop = false;
        this._targetTimeForPlayToTimeAndStop = 0;
        this.groupID = [];
        this._eventTarget = new EventTarget();
        this._originSkinData = {};
        this.keep = false;
        this._repeatOption = { isRepeat: false, count: 0 };
    }




    /*
    public addEventListener(evtType: string, listener: () => void): void {
        this._eventTarget.on(evtType, listener);
    }
    public removeEventListener(evtType: string, listener: () => void): void {
        this._eventTarget.off(evtType, listener);
    }

    public hasEventListener(evtType: string): boolean {
        return this._eventTarget.hasEventListener(evtType);
    }

    public dispatchEvent(evt: any): void {
        this._eventTarget.emit(evt);
    }*/

    //--active=true 會觸發 onLoad()   
    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;
        this._spine = FindComponent.findComponentInChildren(this.node, sp.Skeleton);

        //--是否使用預設的動畫狀態,總部沒有設定預設狀態
        /**
         * 是否使用預設的動畫狀態(總部沒有設定預設狀態)
         * 可是因為中軟的美術會設定default的動畫,所以這邊要有一個開關
         * 在使用預設狀態的情況下,會清除所有的track情況下
         * 因為中軟的美術在清光track的情況下的動畫動作沒有設定預設值阿=..=
         * 所以會爆開
         */
        if (!this._useDefaultInit) {
            this._spine.clearTracks();
        }

        //--_animationPlayStateList不做處理
        if (!this._animationPlayInfoList) {
            this._animationPlayInfoList = new SpineAniPlayInfoList();
            this._animationPlayInfoList.clipsInfo = [];

        } else {

            for (let data of this._animationPlayInfoList.clipsInfo) {
                if (data.useDefault) {
                    this._defaultTarget = data;
                    break;
                }
            }
        }
        //--20251217--存放原始動畫資料
        this.saveOriginAniData(this._originAniData);
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

        let skeletonData = this._spine.skeletonData;
        let skinDataWithAttachment = null;
        if (skeletonData.skeletonJson) {
            skinDataWithAttachment = skeletonData.skeletonJson['skins'];//--裡面會包含Attachment的資料  
        }
        //-Since v3.7.2, this is an engine private function, it only works in editor.
        //let testSkin = skeletonData.getSkinsEnum()[1];---乖乖地取skeletonJson的資料吧
        if (skinDataWithAttachment) {
            //--這邊給讀取JSON使用的
            for (let skinData of skinDataWithAttachment) {
                this._originSkinData[skinData.name] = skinData.attachments;
            }
        } else {
            //--這邊給讀取二進位資料使用的因為skeletonData.skeletonJson=null
            if (this._defaultSkins.length > 0) {
                for (let skinData of this._defaultSkins) {
                    this._originSkinData[skinData] = {};//--先這樣啦
                }
            }
        }


        /*
        this._spine.setEventListener((trackEntry, event) => {
            // 透過發送事件出去，外部誰想聽就聽，不影響序列播放
            this.node.emit(SEQUENCE_EVENTS.FRAME_EVENT, { 
                animationName: trackEntry.animation.name, 
                //@ts-ignore
                eventName: event.data.name 
            });
        });*/
        this.generalAniCompleteCheck = (trackEntry?: sp.spine.TrackEntry) => {
            this.onSpineCompleteHandler(trackEntry);
        };

        //=====給需要的人用,監聽完成load事件=====================
        const spinCtrlEvtData: AniSysEventData = {
            eventName: ANI_SYS_EVENTS.CTRL_LOADED,
            ctrlId: (this.prefabKey) ? this.prefabKey : this.targetNodeId,
            loaded: { message: 'spineCtrl is loaded' }
        }
        this.node.emit(ANI_SYS_EVENTS.CTRL_LOADED, spinCtrlEvtData);

        //let duration=this._spine.getCurrent(0).animation.duration;
        let animationStates = this._spine.getState();
        let animation = this._spine.animation;//--動畫播出的名稱
        let trackEntry = this._spine.getState().getCurrent(0);//-要撥放動畫才會產生
        let animations = this._spine.getState().data.skeletonData.animations;//--有多少動畫
        let trackTrackEntrys = this._spine.getState().tracks;//-要撥放動畫才會產生
        //console.log('check_spine', this._spine.getState().getCurrent(0));

        /*
        console.log(
            'check_spine',
            '\nspineNodeName:', this.spine.node.name,
            '\nanimationStates:', animationStates,
            '\nanimation:', animation,
            '\ntrackEntry:', trackEntry,
            '\nanimations:', animations,
            //'\duration:', duration,
            '\ntrackTrackEntrys:', trackTrackEntrys
        );*/

        //console.log('check_name:', this.spine.node.parent.name, this.spine.node.name, this._animationPlayStateList);

    }

    public async testBtnEvent(ev: any, value: PlaySelector): Promise<void> {
        console.log('testBtnEvent:', ev, value);
        //this.playAni({ targetName: 'Connect'});
        //await this.playAniInPromise(AnimationStateType.Win);
        //await this.playAniInPromise({ targetName: 'Connect' });
        await this.playAniInPromise(AnimationStateType.Win);
        console.log();
    }



    //--20251221
    protected updateTrackState(trackIndex: number, target: SpineCtrlPropDef): void {

        if (!this._trackStates.has(trackIndex)) {
            this._trackStates.set(trackIndex, this.createDefaultTrackState(target));
        } else {
            const state = this._trackStates.get(trackIndex);
            // 這裡可以根據需要重置該軌道的 duration, isReverse 等
            // --- 新增：切換動畫時，必須先釋放並清理該軌道舊有的百分比監聽任務 ---
            this.resolveAndClearPercentageTasks(trackIndex);
            state.target = target;
        }
    }

    //--20251221
    private createDefaultTrackState(target: SpineCtrlPropDef): ITrackState {
        return {
            target: target,
            duration: 0,
            frames: 0,
            secondsPerFrame: 0,
            isReverse: false,
            isPlayToTimeAndStop: false,
            targetTime: 0,
            aniStartTime: 0,
            aniEndTime: 0
        };
    }


    public init(): void {

        /*
        if (this._spineSequencePlay) {
            this._spineSequencePlay.init();
            this._spineSequencePlay.clearTracksSetting = this._clearTracks.trackType;
            this._spineSequencePlay.sp = this._spine;
            this._spineSequencePlay.on(SEQUENCE_EVENTS.FRAME_EVENT, this.onSequencePlayEventHandler);
            this._spineSequencePlay.on(SEQUENCE_EVENTS.COMPLETE, this.onSequencePlayEventHandler);
        }*/

        //--20251221--修正多軌播放
        this._spine.setCompleteListener((trackEntry: sp.spine.TrackEntry) => {
            this.dispatchCompleteEvent(trackEntry);
        });

        this._spine.setEventListener(this.onSpineEventReceived);

        this._resolver?.rebuildAnimationCaches();
        this.ensureDefaultTargetFromList();
        this.isLoaded = true;
    }

    //--存放原始動畫資料
    protected saveOriginAniData(spinePlayInfo: Map<string, SpineCtrlPropDef>): void {

        if (this._animationPlayInfoList.clipsInfo.length === 0) return;

        for (let data of this._animationPlayInfoList.clipsInfo) {
            let playData = new SpineCtrlPropDef();
            playData.targetName = data.targetName;
            if (this.isDefined(data?.timeScale)) {
                playData.timeScale = data.timeScale;
            }

            if (this.isDefined(data?.loop)) {
                playData.loop = data.loop;
            }

            if (this.isDefined(data?.skinName)) {
                playData.skinName = data.skinName;
            }

            if (data.repeatCount !== undefined && data.repeatCount !== null) {
                playData.repeatCount = data.repeatCount;
            }
            spinePlayInfo.set(data.targetName, playData);
        }

    }

    protected ensureDefaultTargetFromList(): void {
        if (this._defaultTarget) return;
        const list = this._animationPlayInfoList?.clipsInfo ?? [];
        this._defaultTarget = (list.find(d => d?.useDefault) ?? list[0]) ?? null;
    }


    //--override it do something after sequence event
    protected onSequencePlayEventHandler = (value: EVENT_DATA) => {

        if (value.eventType == SEQUENCE_EVENTS.COMPLETE) {
            if (this._sequenceResolvePromise) {
                this._sequenceResolvePromise();
                this._sequenceResolvePromise = null;
            }
        } else if (value.eventType == SEQUENCE_EVENTS.FRAME_EVENT) {
            this._spineSequencePlayFrameEventCallBack?.(value);
        }
    }

    /**
     * 20251222-多軌道播放修正
     * 將修改的播放參數還原成原本的資料
     * @param playId spine animation playInfo
     */
    protected reSetPlayInfoToOriginData(playId: string, trackIndex?: number): void {

        // --- 1. [核心還原邏輯] 把修改過的屬性撥亂反正 ---
        // 絕對不能刪除
        const originData = this._originAniData.get(playId);
        const targetData = this._animationPlayInfoList.clipsInfo.find(d => d.targetName === playId);

        if (originData && targetData) {
            targetData.timeScale = originData.timeScale;
            targetData.loop = originData.loop;
            targetData.repeatCount = originData.repeatCount;
            this._targetName2Prop.set(playId, { ...originData });
            // 如果有其他在播放時動態修改的面板屬性，也在此還原
            // targetData.trackIndex = originData.trackIndex; 
        }

        // --- 2. 清理百分比監聽任務 (新增) ---
        if (trackIndex !== undefined) {
            const state = this._trackStates.get(trackIndex);
            if (state?.percentageTasks && state.percentageTasks.length > 0) {
                // 強制 resolve 所有待處理的百分比 Promise
                state.percentageTasks.forEach(task => task.resolve());
                state.percentageTasks = [];
            }
        } else {
            // 全域清理：遍歷所有軌道
            this._trackStates.forEach(state => {
                if (state.percentageTasks && state.percentageTasks.length > 0) {
                    state.percentageTasks.forEach(task => task.resolve());
                    state.percentageTasks = [];
                }
            });
        }

        // --- 3. 多軌道狀態管理清理 ---
        if (trackIndex !== undefined) {
            // 只移除該軌道的執行狀態
            this._trackStates.delete(trackIndex);
            this._trackPromises.delete(trackIndex);
            this._trackCallbacks.delete(trackIndex);
        } else {
            // 全域大掃除
            this._trackStates.clear();
            this._trackPromises.clear();
            this._trackCallbacks.clear();
        }

        // --- 4. 更新全域播放開關 ---
        // 只有當所有軌道都沒有動畫在跑了，isPlaying 才設為 false
        if (this._trackStates.size === 0) {
            this.isPlaying = false;
        }
    }

    //--20251221--多軌道播放修正
    protected dispatchCompleteEvent(trackEntry: sp.spine.TrackEntry): void {

        const tIndex = trackEntry.trackIndex;
        const aniName = trackEntry.animation.name;

        // 執行該軌道專屬的 Callback (原本 playAniWithCallBack 的邏輯)
        // 執行並清理該軌道的 Callback (取代原本 playAniWithCallBack 的閉包)
        this.safeResolveSpineCallback(tIndex);

        // 執行該軌道專屬的 Promise Resolve (原本 playAniInPromise 的邏輯)
        this.safeResolveTrackPromise(tIndex);

        // 原本的業務邏輯處理器 (原本的 onSpineCompleteHandler)
        this.onSpineCompleteHandler(trackEntry);
    }



    //private onSpineEventReceived=(trackEntry: sp.spine.TrackEntry, event: sp.spine.Event)=>{
    private onSpineEventReceived = (trackEntry, event) => {

        // 因為 event 可能是 number，所以要先確認它是物件且有 data 屬性

        //@ts-ignore
        const eventName = (event.data as any).name;

        // --- 1. 處理原本的 KeyFrame 監聽 (原本的 checkAndAddKeyFrameEvent 內容) ---
        if (this._isListenForKeyFrame) {
            const listeners = this._mapEvent.get(eventName);
            if (listeners) {
                // 執行所有註冊的監聽器
                listeners.forEach(cb => cb(trackEntry, event));
            }
        }

        // --- 2. 處理序列播放的通用廣播 (Node Event) ---
        this.node.emit(SEQUENCE_EVENTS.FRAME_EVENT, {
            animationName: trackEntry.animation.name,
            eventName: eventName
        });
    }

    public setKeyFrameEvent(value: string, listener: (...args: any[]) => void): void {

        if (!this._mapEvent.has(value)) {
            this._mapEvent.set(value, [listener]);
            this.listenKeyFrameEvent();
            return;
        }
        const listeners = this._mapEvent.get(value);
        if (listeners) {
            if (!listeners.includes(listener)) {
                listeners.push(listener);
            }
        }
    }

    public removeKeyFrameEvent(value: string, listener?: (...args: any[]) => void): void {

        if (!this._mapEvent.has(value)) return;

        if (listener) {
            const listeners = this._mapEvent.get(value);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index !== -1) {
                    listeners.splice(index, 1);
                    if (listeners.length === 0) this._mapEvent.delete(value);
                }
            }
        } else {
            this._mapEvent.delete(value);
        }

        // 重點：當沒有要聽的 key 時，只關閉開關，不移除 Skeleton 的 Listener
        if (this._mapEvent.size === 0) {
            this._isListenForKeyFrame = false;
        }

        /*
        if (!this._mapEvent.has(value)) {
            return;
        }
        if (listener) {
            const listeners = this._mapEvent.get(value);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index !== -1) {
                    listeners.splice(index, 1);
                    if (listeners.length === 0) {
                        this._mapEvent.delete(value); // 如果陣列變空，刪除整個 key
                    }
                }
            }
        } else {
            this._mapEvent.delete(value);
        }

        if (this._mapEvent.size === 0) {
            this._spine.setEventListener(null);
            this._isListenForKeyFrame = false;
        }*/
    }

    public hasKeyFrameEvent(value: string): boolean {
        return this._mapEvent.has(value);
    }

    public clearKeyFrameEvent(): void {
        //-setEventListener(null)，確保序列廣播還活著(回收的時候想一下)
        this._mapEvent.clear();
        this._isListenForKeyFrame = false;
    }

    public breakKeyFrameEvent(): void {
        //this._spine.setEventListener(null);
        this._isListenForKeyFrame = false;
    }

    //--只會在第一次添加的時候塞到setEventListener(只會塞一次)
    public listenKeyFrameEvent(): void {

        // 只要有事件要聽，就打開開關
        if (!this._isListenForKeyFrame && this._mapEvent.size > 0) {
            this._isListenForKeyFrame = true;
        }
        /*
        if (!this._isListenForKeyFrame && this._spine && this._mapEvent.size > 0) {
            this._spine.setEventListener(this.checkAndAddKeyFrameEvent);
            this._isListenForKeyFrame = true;
        }*/
    }


    public setAniDataInfo(value: AnimationPlayInfo): void {

        //let playData = this.getCustomizeSpineTrackEntry(value.targetName);
        let playData = this._resolver.resolveProp(value.targetName);
        let targetData = value as SpinePlayParams;

        if (!playData) {
            playData = new SpineCtrlPropDef();
            playData.targetName = value.targetName;
            this._animationPlayInfoList.clipsInfo.push(playData);
            this._resolver.rebuildAnimationCaches();
        }

        if (this.isDefined(targetData?.timeScale)) {
            playData.timeScale = targetData.timeScale;
        }

        if (this.isDefined(targetData?.loop)) {
            playData.loop = targetData.loop;
        }

        if (this.isDefined(targetData?.skinName)) {
            playData.skinName = targetData.skinName;
        }

        //--功能待實作...
        if (targetData.repeatCount !== undefined && targetData.repeatCount !== null) {
            playData.repeatCount = targetData.repeatCount;
        }

        this._defaultTarget = playData;

    }


    public changeSkin(value: string): void {

        if (this._spine) {

            let skinId = this._defaultSkin;
            if (this._originSkinData[value]) {

                skinId = value;
            }
            //let index = this.getSkinFrontEnumIndex(skinId);
            //@ts-ignore
            //this._spine._defaultSkinIndex = index;
            this._spine.setSkin(skinId);
            //console.log('setSkinID:', skinId, this._originSkinData[skinId]);
        }
    }


    protected update(dt: number): void {

        if (!this._spine || !this.isPlaying || this._trackStates.size === 0) return;

        // 2. 遍歷所有正在運行的軌道狀態
        this._trackStates.forEach((state, tIndex) => {
            const trackEntry = this._spine.getCurrent(tIndex);

            // 如果該軌道目前沒有動畫（可能已被外部 clear），則跳過
            if (!trackEntry) return;

            // --- 處理 1：倒序播放邏輯 (isReverse) ---
            if (state.isReverse) {
                this.handleReverseUpdate(dt, tIndex, trackEntry, state);
            } else {

                // 處理特定時間停止邏輯 (playToTimeAndStop)
                this.checkTargetTimeReach(tIndex, trackEntry, state);
                //-處理百分比停止邏輯 (percentageTasks)
                if (state.percentageTasks && state.percentageTasks.length > 0) {
                    this.checkPercentageReach(tIndex, trackEntry, state);
                }
            }

            // --- 處理 ：粒子系統同步 ---
            /*
            if (this._particleUtils) {
                // 可以根據當前 trackEntry.trackTime 同步特定軌道的粒子觸發
            }*/
        });

    }

    /**
     * 20251230-支持倒播
     * 檢查百分比進度是否到達
     * @param tIndex 軌道索引
     * @param trackEntry Spine 軌道入口
     * @param state 該軌道狀態資料
     */
    private checkPercentageReach(tIndex: number, trackEntry: sp.spine.TrackEntry, state: ITrackState): void {

        const currentTime = trackEntry.getAnimationTime();
        const duration = state.duration;
        const EPSILON = 0.001;
        // 倒序遍歷
        for (let i = state.percentageTasks.length - 1; i >= 0; i--) {

            const task = state.percentageTasks[i];
            const targetTime = duration * (task.targetPercentage / 100);

            const shouldTrigger = state.isReverse
                ? currentTime <= targetTime + EPSILON
                : currentTime >= targetTime - EPSILON;

            if (shouldTrigger) {
                task.resolve();
                state.percentageTasks.splice(i, 1);
            }
        }
    }


    /**
     * 檢查並處理動畫是否到達指定的停止時間
     */
    private checkTargetTimeReach(tIndex: number, entry: sp.spine.TrackEntry, state: ITrackState): void {

        const playParams = state.target as any;
        const targetTime = playParams.targetTime;

        // 如果沒有設定目標時間，直接跳過
        if (targetTime === undefined) return;
        // 如果是 Loop，我們通常讓它自由播放(通常只有非循環動畫才會執行「播放到某點停止」)
        if (playParams.loop) return;

        // 判定是否達到或超過目標時間
        if (entry.trackTime >= targetTime) {

            entry.trackTime = targetTime;// 修正位置：確保定格在最精確的那一秒
            entry.timeScale = 0; // 凍結該軌道播放速度

            // 執行停止通訊：處理 Promise/Callback 並保持當前姿勢
            this.stopWith({
                trackIndex: tIndex,
                clear: StopClearMode.NONE,
                resolvePromises: true,
                resolveCallback: true,
                resetPose: false, // 確保不跳回 Setup Pose
                overrideAfterPlayFlag: true
            });

            //資料還原：將原本被暫時修改的 loop/timeScale 等屬性還原
            this.reSetPlayInfoToOriginData(entry.animation.name, tIndex);
        }
    }
    //處理倒播邏輯
    private handleReverseUpdate(dt: number, tIndex: number, entry: sp.spine.TrackEntry, state: ITrackState): void {
        // 手動扣除時間 (考慮時標 timeScale)
        entry.trackTime -= dt * entry.timeScale;

        // 判定是否到達起始點 (0秒)
        if (entry.trackTime <= 0) {
            entry.trackTime = 0;

            // 根據是否循環決定行為
            if (state.target.loop) {
                // 循環倒播：回到動畫末尾
                entry.trackTime = state.duration;
            } else {
                // 結束播放：觸發該軌道的收尾
                this.onAniComplete(false, tIndex);
                // 2. 緊接著執行還原與清理 Map (關鍵差異在此)
                // 傳入 animation.name 用於尋找 originData 還原，傳入 tIndex 用於清理 Map
                this.reSetPlayInfoToOriginData(entry.animation.name, tIndex);
            }
        }
    }

    public resetSpinePoseData(): void {
        //return;
        if (this._spine) {
            this._spine.setToSetupPose();
            this._spine.setBonesToSetupPose();
            this._spine.setSlotsToSetupPose();
        }
    }

    /**
     * 1223-多軌道播放修正
     * @param trackIndex 指定要暫停的軌道索引，若不指定則暫停所有軌道
     */
    public pauseAni(trackIndex?: number): void {

        if (!this._spine) return;

        if (trackIndex !== undefined) {
            // 局部暫停：只針對特定軌道
            const entry = this._spine.getCurrent(trackIndex);
            if (entry) {
                entry.timeScale = 0;
            }
        } else {
            // 全域暫停：遍歷所有目前正在追蹤的軌道
            this._trackStates.forEach((state, tIndex) => {
                const entry = this._spine.getCurrent(tIndex);
                if (entry) {
                    entry.timeScale = 0;
                }
            });

            // 備援：保險起見也可以將全域 timeScale 設為 0
            // 但只動 trackEntry 以維持邏輯一致性
            // this._spine.timeScale = 0; 
        }
    }

    /**
     * 1223-多軌道播放修正
     * @param trackIndex 
     * @returns 
     */
    public resumeAni(trackIndex?: number): void {

        if (!this._spine) return;

        if (trackIndex !== undefined) {
            const state = this._trackStates.get(trackIndex);
            const entry = this._spine.getCurrent(trackIndex);
            if (entry && state) {
                // 恢復到該動畫原始定義的速度 (playData 裡的 timeScale)
                entry.timeScale = state.target.timeScale || 1;
            }
        } else {
            // 恢復所有軌道
            this._trackStates.forEach((state, tIndex) => {
                const entry = this._spine.getCurrent(tIndex);
                if (entry) {
                    entry.timeScale = state.target.timeScale || 1;
                }
            });
        }

    }

    /**
     * 加速動畫播放 (1223-多軌道修正版)
     * @param value 指定的速度數值。若不傳，則在目前速度基礎上 +0.2
     * @param trackIndex 指定要加速的軌道。若不傳，則加速所有正在播放的軌道
     */
    public speedUpAni(value?: number, trackIndex?: number): void {

        if (!this._spine) return;
        // 定義加速邏輯的內部函式
        const applySpeed = (entry: sp.spine.TrackEntry) => {
            if (!entry) return;
            // 如果有傳入 value 就直接設為該值，否則以該軌道目前的 timeScale + 0.2
            let speed = (value !== undefined) ? value : entry.timeScale + 0.2;
            entry.timeScale = speed;
        };

        if (trackIndex !== undefined) {
            // 局部加速：僅針對指定軌道
            const entry = this._spine.getCurrent(trackIndex);
            applySpeed(entry);
        } else {
            // 全體加速：遍歷所有正在追蹤的軌道狀態
            this._trackStates.forEach((state, tIndex) => {
                const entry = this._spine.getCurrent(tIndex);
                applySpeed(entry);
            });
        }

    }

    /**
     * 減速動畫播放 (多軌道修正版)
     * @param value 指定的速度數值。若不傳，則在目前速度基礎上 -0.2
     * @param trackIndex 指定要減速的軌道。若不傳，則減速所有正在播放的軌道
     */
    public slowDownAni(value?: number, trackIndex?: number): void {

        if (!this._spine) return;
        // 定義減速邏輯的內部函式
        const applySlowDown = (entry: sp.spine.TrackEntry) => {
            if (!entry) return;

            // 計算新速度：有傳入值就用傳入值，否則目前的 -0.2
            let speed = (value !== undefined) ? value : entry.timeScale - 0.2;

            // 邊界檢查：防止速度變負值導致動畫往回跑（或產生邏輯錯誤）
            if (speed < 0) {
                speed = 0;
            }

            entry.timeScale = speed;
        };

        if (trackIndex !== undefined) {
            // 1. 局部減速
            const entry = this._spine.getCurrent(trackIndex);
            applySlowDown(entry);
        } else {
            // 2. 全體減速：遍歷所有正在運行的軌道
            this._trackStates.forEach((state, tIndex) => {
                const entry = this._spine.getCurrent(tIndex);
                applySlowDown(entry);
            });
        }

    }

    //--20251221--多軌道播放修正
    public reversePlay(value: PlaySelector): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;

        //設定為倒播模式
        const playData = targetDef as any;//--強行轉型直接給值
        playData.isReverse = true;
        this.playAniWithAniCtrDef(playData);
        // 倒播的起始時間設定：必須從動畫的最後一格開始
        const trackEntry = this._spine.getCurrent(tIndex);
        if (trackEntry) {
            // 將 trackTime 設為動畫總長度
            trackEntry.trackTime = trackEntry.animation.duration;
        }
    }


    public gotoAndPlayByTime(value: PlaySelector, time: number): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;
        //const timeScale = (playData.timeScale) ? playData.timeScale : 1;

        const playData = targetDef as any; //--強制轉型直接給值
        playData.startTime = time;
        playData.isReverse = false;
        this.playAniWithAniCtrDef(playData);
        // 3. 立即強制跳轉 Spine 軌道時間 (雙重保險)
        // 3. 針對該軌道執行細節修正 (如果不放心 setTrackTimeData 的自動處理)
        const trackEntry = this._spine.getCurrent(tIndex);
        if (trackEntry) {
            let moveToStartTime = time <= 0 ? 0 : time;
            trackEntry.animationStart = moveToStartTime;
            // 注意：這裡的 aniEndTime 要從剛剛存入的 Map 拿
            const state = this._trackStates.get(tIndex);
            if (state) {
                trackEntry.animationEnd = state.aniEndTime;
            }
            trackEntry.trackTime = moveToStartTime;

            this.setTrackTimeData(trackEntry, tIndex);//--要再確認一下作法
        }

    }

    //--這邊沒辦法知道spine的fps
    public gotoAndPlayByFrame(value: PlaySelector, frame: number): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;
        // 先播放動畫，這會建立該軌道的 ITrackState 並同步物理參數 (duration, secondsPerFrame 等)
        this.playAniWithAniCtrDef(targetDef);

        //獲取該軌道的物理狀態
        const state = this._trackStates.get(tIndex);
        const trackEntry = this._spine.getCurrent(tIndex);

        if (state && trackEntry) {
            // 計算目標秒數：幀數 * 該軌道的每幀秒數
            // 使用 state.secondsPerFrame 確保即便不同動畫格率不同也能精確跳轉
            const targetTime = frame * state.secondsPerFrame;

            // 限制時間不超過動畫總長
            const finalTime = Math.min(targetTime, state.duration);

            // 設定動態參數 (供後續邏輯或 Loop 參考)
            (targetDef as any).startTime = finalTime;
            (targetDef as any).isReverse = false;

            //執行物理跳轉
            trackEntry.animationStart = finalTime;
            trackEntry.trackTime = finalTime;
            trackEntry.animationEnd = state.aniEndTime;
        }
        /*
        if (this._spine) {
            let playData = this.resolveTargetName(value);
            let timeScale = (playData.timeScale) ? playData.timeScale : 1;
            this._spine.timeScale = timeScale;
            let trackIndex = (playData.trackIndex) ? playData.trackIndex : 0;
            this.isPlaying = true;
            this._spine.setCompleteListener(null);
            this._spine.setCompleteListener(this.generalAniCompleteCheck);
            let trackEntry = this._spine.setAnimation(trackIndex, playData.targetName, playData.loop);
            this._spine.timeScale = 0;//--停止播放
            this.setCurrentSpineAniData(trackEntry);
            let moveToStartTime = frame * this._secondsPerFrame;
            if (moveToStartTime <= 0) moveToStartTime = 0;
            trackEntry.animationStart = moveToStartTime;
            trackEntry.animationEnd = this._aniEndTime;
            this._spine.timeScale = timeScale;//---回復播放
        }*/
    }

    //-移動到某個時間點並停止(這邊的停止是暫停..而非cleanTracks)
    public gotoAndStopByFrame(value: PlaySelector, frame: number): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;

        // 先播
        this.playAniWithAniCtrDef(targetDef);

        const state = this._trackStates.get(tIndex);
        const trackEntry = this._spine.getCurrent(tIndex);

        if (state && trackEntry) {
            const targetTime = frame * state.secondsPerFrame;
            const finalTime = Math.min(targetTime, state.duration);

            // 跳轉時間
            trackEntry.trackTime = finalTime;

            // 立即停止該軌道 (使用我們重構的 stopWith)
            this.stopWith({
                trackIndex: tIndex,
                clear: StopClearMode.NONE, // 保持姿勢
                resolvePromises: true,
                resolveCallback: true
            });
        }

        /*
        if (this._spine) {
            let playData = this.resolveTargetName(value);
            let timeScale = (playData.timeScale) ? playData.timeScale : 1;
            this._spine.timeScale = timeScale;
            let trackIndex = (playData.trackIndex) ? playData.trackIndex : 0;
            this._spine.setCompleteListener(null);
            this._spine.setCompleteListener(this.generalAniCompleteCheck);
            let trackEntry = this._spine.setAnimation(trackIndex, playData.targetName, playData.loop);
            this.setCurrentSpineAniData(trackEntry);
            let moveToStartTime = frame * this._secondsPerFrame;
            if (moveToStartTime <= 0) moveToStartTime = 0;
            trackEntry.trackTime = moveToStartTime;
            this._spine.timeScale = 0;//--停止播放
            this.isPlaying = false;
        }*/
    }

    /**
     * 20251020新增方法
     * @param value 取得播放的動畫資料key
     * @param time 移動到某個時間點開始播放
     */
    public changePlayTime(time: number, trackIndex: number = 0, value?: PlaySelector): void {

        if (!this.isPlaying) return;
        if (this._spine) {
            const entry = this._spine.getCurrent(trackIndex);//--new
            //const entry = this._spine.getCurrent(this._currentTarget.trackIndex);
            //console.log('changePlayTime_entry:', entry);
            //console.log(entry.trackTime, time);
            //console.log();
            let moveToStartTime = time;
            if (moveToStartTime <= 0) moveToStartTime = 0;
            entry.trackTime = moveToStartTime;
            this.spine.updateAnimation(0);
        }

    }

    /**
     * PS-20251217先改時間,剩下之後再看要改什麼
     * @param value 
     * @param t 時間
     * @param infoTarget -預留更換的參數
     * @returns 
     */
    public changePlayInfo(value: PlaySelector, t: number, infoTarget?: SpineCtrlPropDef): void {

        if (!this.isPlaying) return;
        if (!this._spine) return;
        const aniCtrlInfo = this.getAniPlayDataByPlaySelector(value);
        if (!aniCtrlInfo) return;
        const ani = this._spine.findAnimation(aniCtrlInfo.targetName);
        if (!ani) return;
        const duration = ani.duration;
        const speed = duration / t;
        aniCtrlInfo.timeScale = speed;
        //---之後再看要改什麼
        /*
        if (infoTarget.timeScale) {
            const duration = ani.duration;
            const speed = duration / t;
            aniCtrlInfo.timeScale = speed;
        }*/
    }

    /**
     * 20251020新增方法
     * 直接播放到最後一格
     * 如果動畫長度 < 1 秒，start 會變成負數；或是計算的 start 超過尾端
     * 所以把 start 夾在 [0, end - EPS] 之內，避免越界
     * @param value 
     */
    public gotoPlayLastFrame(value?: PlaySelector): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;
        // 1. 啟動播放，獲取該軌道的專屬 ITrackState (包含 duration 與 secondsPerFrame)
        this.playAniWithAniCtrDef(targetDef);

        const state = this._trackStates.get(tIndex);
        const trackEntry = this._spine.getCurrent(tIndex);
        if (state && trackEntry) {
            // 計算倒數第 2 幀的時間
            // secondsPerFrame 是 1/幀率，所以乘以 2 就是回溯兩格的時間
            const targetTime = Math.max(0, state.duration - (state.secondsPerFrame * 2));

            // 強轉型以便直接賦值
            const playData = targetDef as any;
            playData.startTime = targetTime;
            playData.isReverse = false;

            // 執行物理跳轉與區間設定
            trackEntry.animationStart = targetTime; // 若 Loop 則從此格循環
            trackEntry.trackTime = targetTime;
            trackEntry.animationEnd = state.aniEndTime;

            // 如果是為了倒播做準備，記得設定 isReverse
            // state.isReverse = true; 
        }

        /*
        if (!this.isPlaying) return;
        if (this._spine) {
            //const EPS = 1e-6;//--避免最後一個frame沒辦法正確sample
            
            const entry = this._spine.getCurrent(trackIndex);
            const spEnd = entry.animation.duration;
            const spFinalTime = spEnd - 0.32;//--0.32是倒數第二格
            entry.trackTime = spFinalTime;
            this.spine.updateAnimation(0);
        }*/
    }

    //-移動到某個時間點並停止(這邊的停止是暫停..而非cleanTracks)
    public gotoAndStopByTime(value: PlaySelector, time: number): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;
        // 1. 透過核心方法播放動畫
        // 這會處理該軌道的狀態初始化，並將 params 存入 _trackStates Map
        this.playAniWithAniCtrDef(targetDef);

        // 2. 取得該軌道的狀態與 Entry
        const state = this._trackStates.get(tIndex);
        const trackEntry = this._spine.getCurrent(tIndex);

        if (trackEntry) {
            // 執行物理跳轉
            let finalTime = time <= 0 ? 0 : time;
            // 如果超過動畫長度，則停在最後一格
            if (state && finalTime > state.duration) {
                finalTime = state.duration;
            }

            trackEntry.trackTime = finalTime;

            // [關鍵] 僅針對此軌道執行 Stop 邏輯
            // 使用 StopClearMode.NONE 確保畫面停在當前跳轉的時間點
            this.stopWith({
                trackIndex: tIndex,
                clear: StopClearMode.NONE,
                resolvePromises: true,      // 既然停了，就該讓 await 此動畫的地方繼續
                resolveCallback: true,       // 執行對應回呼
                resetPose: false,            // 絕對不能 reset，否則會跳回預設姿勢
                overrideAfterPlayFlag: true  // 強制執行停止
            });

            //確保該軌道不再更新
            trackEntry.timeScale = 0;
        }
        /*
        if (this._spine) {
            let playData = this.resolveTargetName(value);
            let timeScale = (playData.timeScale) ? playData.timeScale : 1;
            this._spine.timeScale = timeScale;
            let trackIndex = (playData.trackIndex) ? playData.trackIndex : 0;
            this._spine.setCompleteListener(null);
            this._spine.setCompleteListener(this.generalAniCompleteCheck);
            let trackEntry = this._spine.setAnimation(trackIndex, playData.targetName, playData.loop);
            this.setCurrentSpineAniData(trackEntry);
            trackEntry.trackTime = time;
            this._spine.timeScale = 0;//--停止播放
            this.isPlaying = false;
        }*/
    }

    /**
     * 跳轉到倒數第 2 幀並定格停止
     * @param value 播放目標
     */
    public gotoStopLastFrame(value?: PlaySelector): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;

        //啟動播放以初始化 ITrackState (獲取 duration 與 secondsPerFrame)
        this.playAniWithAniCtrDef(targetDef);

        const state = this._trackStates.get(tIndex);
        const trackEntry = this._spine.getCurrent(tIndex);

        if (state && trackEntry) {
            // 計算倒數第 2 幀的時間點
            const targetTime = Math.max(0, state.duration - (state.secondsPerFrame * 2));

            // 物理跳轉至該時間點
            trackEntry.trackTime = targetTime;

            //強制停止該軌道播放 (timeScale 設為 0 並保持畫面)
            trackEntry.timeScale = 0;

            //執行收尾邏輯
            this.stopWith({
                trackIndex: tIndex,
                clear: StopClearMode.NONE, // 保持姿勢
                resolvePromises: true,      // 釋放 await 該動畫的 Promise
                resolveCallback: true,       // 執行對應 callback
                resetPose: false,            // 絕對不能 reset，否則會跳回預設姿勢
                overrideAfterPlayFlag: true
            });

            //還原原始面板數據並清理軌道 Map (防止 update 繼續掃描)
            this.reSetPlayInfoToOriginData(trackEntry.animation.name, tIndex);
        }
    }


    /**
     * 20251222 多軌道播放修正
     * 播放動畫並在指定時間停止
     * @param value 播放目標
     * @param time 停止時間 (秒)
     * 
     */
    public playToTimeAndStop(value: PlaySelector, time: number): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;

        // 封裝帶有 targetTime 的動態參數
        // 強轉型以便直接賦值
        const playData = targetDef as any;
        playData.targetTime = time;
        playData.loop = false; // 強制不循環，否則無法精確停止

        // 啟動播放 (這會更新 Map 裡的 state.target)
        this.playAniWithAniCtrDef(targetDef);

        // 物理狀態檢查
        const state = this._trackStates.get(tIndex);
        if (state) {
            // 確保 update 邏輯知道這軌有個「終點線」
            state.aniEndTime = time;
        }

        /*
        if (this._spine) {
            let playData = this.resolveTargetName(value);
            let timeScale = (playData.timeScale) ? playData.timeScale : 1;
            this._spine.timeScale = timeScale;
            let trackIndex = (playData.trackIndex) ? playData.trackIndex : 0;
            this._spine.setCompleteListener(null);
            this._spine.setCompleteListener(this.generalAniCompleteCheck);
            let trackEntry = this._spine.setAnimation(trackIndex, playData.targetName, false);
            this._spine.timeScale = 0;//--停止播放
            this.setCurrentSpineAniData(trackEntry);
            this._isPlayToTimeAndStop = true;
            this._targetTimeForPlayToTimeAndStop = time;
            this.isPlaying = true;
            this._spine.timeScale = 1;
        }*/

    }

    public playToFrameAndStop(value: PlaySelector, frame: number): void {

        const targetDef = this.resolveTargetName(value);
        if (!this._spine || !targetDef) return;

        const tIndex = targetDef.trackIndex ?? 0;

        // 這會觸發 playAniWithAniCtrDef -> setTrackTimeData
        // 讓該軌道的 ITrackState 被建立，且存入正確的 secondsPerFrame
        this.playAniWithAniCtrDef(targetDef);

        //取得剛剛建立的狀態與 Entry
        const state = this._trackStates.get(tIndex);
        const trackEntry = this._spine.getCurrent(tIndex);

        if (state && trackEntry) {
            //計算目標停止秒數
            const targetTime = frame * state.secondsPerFrame;
            // 限制不超過動畫總長度
            const finalTime = Math.min(targetTime, state.duration);

            //動態注入停止目標 (使用 as any)
            // 這樣 update 裡的 checkTargetTimeReach 就能抓到這個終點
            const playData = targetDef as any;
            playData.targetTime = finalTime;
            playData.loop = false; // 強制不循環以利停止

            //同步更新狀態資料夾，確保 update 邏輯同步
            state.target = playData;
            state.aniEndTime = finalTime;
        }

    }

    // 由外部或內部的 update 呼叫
    protected updateProgress(dt: number): void {

    }

    /**
     * 非同步等待特定軌道的百分比進度
     * @param percentage 0~100 的進度
     * @param trackIndex 軌道索引
     */
    public async waitUntilPercentage(value: PlaySelector, percentage: number): Promise<void> {

        const playData = this.resolveTargetName(value);
        const targetName = playData.targetName;

        // 尋找哪一個軌道正在播放這個動畫名稱
        let targetTrackIndex = -1;
        this._trackStates.forEach((state, index) => {
            if (state.target && state.target.targetName === targetName) {
                targetTrackIndex = index;
            }
        });

        // 如果沒找到活躍狀態，使用 playData 預設軌道
        if (targetTrackIndex === -1) {
            targetTrackIndex = playData.trackIndex || 0;
        }

        const state = this._trackStates.get(targetTrackIndex);
        if (!state) {
            console.warn(`[SpineController] 找不到動畫 "${targetName}" 的活躍狀態`);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            if (!state.percentageTasks) {
                state.percentageTasks = [];
            }
            state.percentageTasks.push({
                targetPercentage: percentage,
                resolve: resolve
            });
        });
    }




    /**
     * <這邊不會掛上監聽就單純的for中軟美術切回default的動畫狀態>
     * 播放動畫預設狀態,有動畫播放
     */
    public goBackToDefault(flag: boolean = true): void {

        const playData = this.resolveTargetName(AnimationStateType.Default);
        if (this._spine) {
            if (flag) {
                this.forceSafeResolveSpinePromise();
                this.forceSafeResolveSpineCallback();
            }
            this.isPlaying = true;
            this._spine.timeScale = (playData.timeScale) ? playData.timeScale : 1;
            let trackIndex = (playData.trackIndex) ? playData.trackIndex : 0;
            this.isPlaying = true;
            this._isLoop = playData.loop;
            if (playData.skinName != '') {
                this._spine.node.active = true;
                this.changeSkin(playData.skinName);
            }
            this._spine.setAnimation(trackIndex, playData.targetName, playData.loop);
        }
    }
    //--強斷定spine的promise resolve
    public forceSafeResolveSpinePromise(): void {
        this.safeResolveSpinePromise();
    }
    //--強斷定spine的call back
    public forceSafeResolveSpineCallback(): void {
        this.safeResolveSpineCallback();
    }

    //--to do something before spine destroy
    public beforeDestroy(): void {
        this.forceToDoBeforeDestroy();
        this.generalAniCompleteCheck = null;
    }

    public forceToDoBeforeDestroy(): void {

        if (this._spine) {
            this.isPlaying = false;
            this.safeResolveSpinePromise();
            this.safeResolveSpineCallback();
            if (this.particleSystem) {
                this.particleSystem.stopParticle();
            }
            //--在沒有勾選drop after play的選項stopAni方法將不會觸發停止撥放選項
            if (this.goBackDefaultWithoutDestroy) {
                this.goBackToDefault(false);//--回到預設狀態
            } else {
                if (this._clearTracks.trackType == CleanTrackType.CURRENT_TRACK) {
                    this.cleanCurrentTrack();
                } else {
                    this.clearTracks();
                }
                this.resetSpinePoseData();
            }
            this.destroySpineSequencePlay();
            /*
            if (this._spineSequencePlay) {
                this._spineSequencePlay.resetDataBeforeDestroy();
                this._spineSequencePlay.off(SEQUENCE_EVENTS.FRAME_EVENT, this.onSequencePlayEventHandler);
                this._spineSequencePlay.off(SEQUENCE_EVENTS.COMPLETE, this.onSequencePlayEventHandler);
            }*/
            this._sequenceResolvePromise?.();//--如果有使用到sequence的promise resolve 20250623
            this._sequenceResolvePromise = null;//--_spineSequencePlay使用的
            //this.safeRemoveSequencePlayFrameEventCallBack();
            this.clearKeyFrameEvent();
            this.clearAllMultipleCompleteEvent();
        }
    }

    private destroySpineSequencePlay(): void {

        this.node.off(SEQUENCE_EVENTS.FRAME_EVENT, this.onSequencePlayEventHandler, this);
        this.node.off(SEQUENCE_EVENTS.COMPLETE, this.onSequencePlayEventHandler, this);

        // 2. 強制結束正在 await 中的序列 Promise
        if (this._sequenceResolvePromise) {
            this._sequenceResolvePromise(); // 讓 await playSequence 繼續走完，防止死結
            this._sequenceResolvePromise = null;
        }
        this.safeRemoveSequencePlayFrameEventCallBack();
    }

    public resetData(): void {

        this.forceToDoBeforeDestroy();
        this.reSetPlayInfoToOriginData(this._currentTarget?.targetName);
        this._currentTarget = null;
        this._defaultTarget = null;
        this.tokenID = '';//--單一的識別碼
        this.slotMachineIndexInfo = null;
        this._duration = 0;
        this._frames = 0;
        this._secondsPerFrame = 0;
        this._aniStartTime = 0;
        this._aniEndTime = 0;
        this._isReverse = false;
        this._isLoop = false;
        this.isPlaying = false;
        this._isPlayToTimeAndStop = false;
        this._targetTimeForPlayToTimeAndStop = 0;
        this.groupID = [];
    }

    public playAniWithCallBack(callBack: Function, backDefault: boolean = false, value?: PlaySelector): void {

        let playData = this.resolveTargetName(value);
        if (!playData) {
            console.warn(`SpineCtrl playAniWithCallBack can't find playData for value:${value}`);
            return;
        }

        const tempParams = {
            targetName: playData.targetName,
            timeScale: playData.timeScale ?? 1,
            loop: playData.loop,
            trackIndex: playData.trackIndex ?? 0,
            skinName: playData.skinName ?? ''
        };

        // 更新該軌道專屬狀態-20251221(支援多軌播放需要更動的地方)
        // 儲存該軌道專屬的 Callback
        const tIndex = playData.trackIndex ?? 0;

        this._trackCallbacks.set(tIndex, callBack);

        this.updateTrackState(tIndex, playData);

        this.cleanCurrentTrack(tIndex);
        /*
        this._trackCallbacks.set(tIndex, () => {
            callBack();
            // 執行完後自動移除，避免重複觸發
            this._spine.setCompleteListener(null);
            this._trackCallbacks.delete(tIndex);
        });*/

        /*
        this._spineAniCallback = () => {
            callBack();
            this._spine.setCompleteListener(null);
            this._spineAniCallback = undefined;
        };*/
        //this.clearTracks();
        this._spine.timeScale = (tempParams.timeScale) ? tempParams.timeScale : 1;
        //--儘管是loop=true,但每次都會觸發..
        //this._spine.setCompleteListener(null);
        //this._spine.setCompleteListener(spineCompleteHandler);
        let trackIndex = (tempParams.trackIndex) ? tempParams.trackIndex : 0;
        this.isPlaying = true;
        this._isLoop = tempParams.loop;
        const trackEntry = this._spine.setAnimation(trackIndex, tempParams.targetName, tempParams.loop);
        if (trackEntry) {
            this.setTrackTimeData(trackEntry, tIndex);
        }
    }

    public playAniInPromise(value?: PlaySelector): Promise<void> {


        const playData = this.resolveTargetName(value);
        if (!playData) {
            return Promise.resolve();
        }

        // 局部變數快照：提取本次播放所需的「關鍵參數」
        // 這樣即使後面執行了 reSetPlayInfoToOriginData，這組 temp 變數也不會變
        const tempParams = {
            targetName: playData.targetName,
            timeScale: playData.timeScale ?? 1,
            loop: playData.loop,
            trackIndex: playData.trackIndex ?? 0,
            skinName: playData.skinName ?? ''
        };

        const tIndex = playData.trackIndex ?? 0;

        // 觸發 reSetPlayInfoToOriginData，將 clipsInfo 裡的數值還原成預設
        //this.safeResolveSpinePromise();
        // 20251221[核心改動] 檢查該軌道是否已有正在等待的 Promise
        // 如果有，先 Resolve 掉舊的(相同軌道的)，避免前一個 Await 永久卡死 (例如動畫被中斷或覆蓋時)
        this.safeResolveTrackPromise(tIndex);
        this.updateTrackState(tIndex, playData);
        return new Promise((resolve) => {
            /*
            this._spineAniResolvePromise = (trackEntry?: sp.spine.TrackEntry) => {
                this.generalAniCompleteCheck(trackEntry);
                this.safeResolveSpinePromise(resolve);
            };*/

            this._spine.timeScale = (tempParams.timeScale) ? tempParams.timeScale : 1;
            //--儘管是loop=true,但每次都會觸發..
            //this._spine.setCompleteListener(null);
            //this._spine.setCompleteListener(this._spineAniResolvePromise);

            // 20251221將新的 resolve 函式存入軌道映射表
            this._trackPromises.set(tIndex, resolve);

            this.isPlaying = true;
            this._isLoop = tempParams.loop;
            if (tempParams.skinName != '') {
                this._spine.node.active = true;
                this.changeSkin(tempParams.skinName);
            }
            const trackEntry = this._spine.setAnimation(tIndex, tempParams.targetName, tempParams.loop);
            if (trackEntry) {
                this.setTrackTimeData(trackEntry, tIndex);
            }
        });
    }

    public playSequenceInPromise(value?: string): Promise<void> {

        if (!value) return Promise.resolve();

        // 儲存 resolve 供銷毀時強制解鎖 (forceToDoBeforeDestroy 會用到)
        return new Promise(async (resolve) => {
            this._sequenceResolvePromise = resolve;
            await this.playSequence(value);
            this._sequenceResolvePromise = null;
            resolve();
        });
    }

    public playSequenceWithCallBack(callBack: (...args: any[]) => void, value?: string): void {

        if (!value) {
            if (callBack) callBack(this._spine);
            return;
        }

        // 啟動序列，並在 Promise 完成後執行 callback
        this.playSequence(value).then(() => {
            if (callBack) {
                callBack(this._spine);
            }
        });
    }

    /*
    public playSequence(sequenceName?: string): void {
        this._spineSequencePlay?.playSequence(sequenceName);
    }*/

    /**
     * 播放動畫序列 (整合原 SpineSequencePlay 邏輯)
     * 使用 playAniInPromise 確保序列銜接的穩定性
     */
    public async playSequence(sequenceId: string, loopWholeSequence: boolean = false): Promise<void> {
        // 1. 從資料清單找到該序列配置
        const sequenceData = this._sequenceData.sequenceList.find(s => s.SequenceId === sequenceId);
        if (!sequenceData) {
            console.warn(`[SpineController] 找不到序列: ${sequenceId}`);
            return;
        }

        this.isPlaying = true;

        // 2. 序列大循環邏輯
        do {
            // 3. 依序遍歷序列項目
            for (const item of sequenceData.sequence) {

                const tName = item.targetName?.trim();
                if (!tName) continue;
                // --- 重點：動態注入播放資訊 ---
                // 直接將序列項目的完整 PropDef 存入對照表
                // 這樣 resolveTarget(tName) 就能抓到這份最新的 item 資料
                this._targetName2Prop.set(tName, item);
                // 這裡直接調用原本就有的 playAniInPromise
                // - setAnimation /等待重複次數播完/自動 Resolve/自動執行還原邏輯 (reSetPlayInfoToOriginData)

                await this.playAniInPromise(tName);

                // [擴充] 處理序列間的幀事件 (Frame Event)
                // 如果 item 有定義 eventFrameType，
                // 由於 playAniInPromise 已經播完了，如果你要在「播放中」監聽，
                // 則需在 playAniInPromise 內部掛載事件回傳，或透過 Controller 的事件轉發。
                if (item.eventFrameType) {
                    this.node.emit(SEQUENCE_EVENTS.STEP_COMPLETE, item.targetName);
                }
            }

            // 如果該序列資料本身設定了 loopSequence，或者呼叫時強制 loopWholeSequence
        } while (loopWholeSequence || sequenceData.loopSequence);

        this.isPlaying = false;
        this.node.emit(SEQUENCE_EVENTS.COMPLETE);
    }

    //--20251221修改方法-多軌
    public playAniWithAniCtrDef(value: SpineCtrlPropDef): void {

        if (!this._spine || !value) return;
        // 1. 取得軌道索引，預設為 0
        const tIndex = value.trackIndex ?? 0;

        // 播放前的清理相同的：確保該軌道乾淨，且不會有殘留的 Promise 沒 resolve
        this.stopWith({
            trackIndex: tIndex,
            clear: StopClearMode.NONE, // 這裡不需要 clear，因為 setAnimation 會覆蓋
            resolvePromises: true,     // 釋放舊的 await
            resolveCallback: true,     // 執行舊的 callback
        });
        // 3. 更新全域狀態與 Map 狀態
        this.isPlaying = true;
        this._isLoop = value.loop;
        // 將詳細狀態存入 Map，這會影響 update 裡的倒播或計時邏輯
        this.updateTrackState(tIndex, value);
        const trackEntry = this._spine.setAnimation(tIndex, value.targetName, value.loop);
        if (trackEntry) {
            // 設定起始時間 (原本的 setTrackTimeData 邏輯)
            //-setCurrentSpineAniData
            this.setTrackTimeData(trackEntry, tIndex);
        }

    }

    public playAni(value?: PlaySelector): void {

        const playData = this.resolveTargetName(value);
        if (this._spine) {

            const trackIndex = (playData.trackIndex) ? playData.trackIndex : 0;
            this._spine.timeScale = (playData.timeScale) ? playData.timeScale : 1;

            this.isPlaying = true;
            this._isLoop = playData.loop;

            if (playData.skinName != '') {
                this._spine.node.active = true;
                this.changeSkin(playData.skinName);
            }
            // 更新該軌道專屬狀態-20251221(支援多軌播放需要更動的地方)
            this.updateTrackState(trackIndex, playData);
            //-this.onAniComplete
            //this._spine.setCompleteListener(null);


            const trackEntry = this._spine.setAnimation(trackIndex, playData.targetName, playData.loop);
            if (trackEntry) {
                // 更新該軌道的時長資訊
                //-setCurrentSpineAniData
                this.setTrackTimeData(trackEntry, trackIndex);
            }

        }
    }

    /*
    private checkAndAddKeyFrameEvent = (trackEntry, event) => {
        //@ts-ignore
        let evtKey = event.data.name;
        if (this._mapEvent.has(evtKey)) {
            let listeners = this._mapEvent.get(evtKey);
            if (listeners) {
                for (let listener of listeners) {
                    listener(evtKey);
                }
            }
        }
    }*/


    private getSkinFrontEnumIndex(skinName: string): number {
        let skinData = this._spine.skeletonData.getSkinsEnum();
        for (let i in skinData) {
            //console.log('check_skinData', i, skinData[i]);

            if (i == skinName) {
                return skinData[i];
            }
        }

    }

    //--20251221
    //private setCurrentSpineAniData(trackEntry: sp.spine.TrackEntry): void {
    private setTrackTimeData(trackEntry: sp.spine.TrackEntry, trackIndex: number = 0): void {

        // 從 Map 拿取該軌道的狀態，如果沒有就建一個
        let state = this._trackStates.get(trackIndex);
        if (!state) {
            state = { isReverse: false } as ITrackState;
            this._trackStates.set(trackIndex, state);
        }

        // 將物理參數存入該軌道的專屬狀態 (不再存入 this._duration 等全域變數)
        state.duration = trackEntry.animation.duration;
        state.frames = Math.ceil(this._frameRate * state.duration);
        state.secondsPerFrame = 1 / this._frameRate;
        state.aniStartTime = trackEntry.animationStart;
        state.aniEndTime = trackEntry.animationEnd;

        // 這裡處理 gotoAndPlayByTime 塞進去的動態屬性
        const dynamicParams = state.target as any;
        if (dynamicParams && dynamicParams.startTime !== undefined) {
            let moveToStartTime = dynamicParams.startTime <= 0 ? 0 : dynamicParams.startTime;

            // 執行你原本的邏輯，但操作對象是 trackEntry
            trackEntry.animationStart = moveToStartTime;
            trackEntry.trackTime = moveToStartTime;
            trackEntry.animationEnd = state.aniEndTime; // 使用該軌道專屬的結束點
        }



        /*
        this._duration = trackEntry.animation.duration;
        this._frames = Math.ceil(this._frameRate * this._duration);
        this._secondsPerFrame = 1 / this._frameRate;
        this._aniStartTime = trackEntry.animationStart;
        this._aniEndTime = trackEntry.animationEnd;
        */
    }
    //--20251221
    public getCurrentSpineAniData(trackIndex: number = 0): SpineCtrlPropDef {
        //return this._currentTarget;
        return this._trackStates.get(trackIndex)?.target ?? this._defaultTarget;
    }

    //--20251011-新增直接查詢播放資料的功能(他不會改變當前播放狀態)
    public peakAniDataInfo(value: PlaySelector): AnimationPlayInfo {
        return this._resolver?.resolveProp(value);
    }


    protected resolveTargetName(sel?: PlaySelector): SpineCtrlPropDef {

        //--查表分開到特殊工具處理
        const target = this._resolver.resolveProp(sel);
        return target ?? this._defaultTarget;
        /*
        const target = this._resolver.resolveProp(sel);
        if (target) {
            this._currentTarget = target;
            return target;
        }
     
        this._currentTarget = this._defaultTarget;
        return this._defaultTarget;
        */
    }

    /*
    public checkSpinePlayData(targetName: string): SpineCtrlPropDef {
        for (let data of this._animationPlayStateList.clipsInfo) {
            if (data.targetName == targetName) {
                this._currentTarget = data;
                return data;
            }
        }
        this._currentTarget = this._defaultTarget;
        return this._defaultTarget;
    }*/

    public getAniPlayDataByPlaySelector(value: PlaySelector): SpineCtrlPropDef {

        const target = this._resolver.resolveProp(value);
        if (target) {
            return target;
        } else {
            return this._defaultTarget;
        }

        /*
         const targetName = this.processMapInfoName(value);
         let targetAniCtrl= this.getCustomizeSpineTrackEntry(targetName);
         if(!targetAniCtrl)
         {
             targetAniCtrl= this._defaultTarget;
         }
         return targetAniCtrl;
         */
    }









    //---這裡可以把它寫在一個basic class裡面 然後在繼承上來
    private isDefined<T>(value: T | undefined | null): boolean {
        return value !== undefined && value !== null;
    }

    //====================停止/清除系列============================================================================
    /**
     * 強制釋放並清空特定軌道的百分比監聽任務
     * @param tIndex 軌道索引，若為 undefined 則處理所有軌道
     */
    private resolveAndClearPercentageTasks(tIndex?: number): void {
        if (tIndex !== undefined) {
            // 僅處理特定軌道
            const state = this._trackStates.get(tIndex);
            if (state) {
                this.executeTasksAndReset(state);
            }
        } else {
            // 全域處理
            this._trackStates.forEach((state) => {
                this.executeTasksAndReset(state);
            });
        }
    }

    /**
     * 執行 resolve 並重置陣列
     */
    private executeTasksAndReset(state: ITrackState): void {
        if (state.percentageTasks && state.percentageTasks.length > 0) {
            for (const task of state.percentageTasks) {
                task.resolve();
            }
            state.percentageTasks = [];
        }
    }


    /**
     * 強制 Resolve 並清除特定軌道的 Promise。
     * 通常用於動畫被中斷、覆蓋或手動停止時，避免 await 永遠掛起。
     * @param trackIndex 軌道索引
     */
    protected safeResolveTrackPromise(trackIndex: number): void {

        const resolve = this._trackPromises.get(trackIndex);
        if (resolve) {
            //執行 Resolve，讓外部 await 此動畫的地方繼續執行
            resolve();

            //從 Map 中移除，確保不會被重複觸發
            this._trackPromises.delete(trackIndex);

            // [可選] 如果你的系統有追蹤 sequenceResolve (針對 playSequenceInPromise)
            // 且該 sequence 正好運行在該軌道，也要在這邊一併處理
            if (trackIndex === 0) { // 假設 sequence 預設都在 track 0
                this._sequenceResolvePromise?.();
                this._sequenceResolvePromise = null;
            }
        }
    }

    //--20251221--多軌道播放修正
    protected onSpineCompleteHandler(trackEntry?: sp.spine.TrackEntry): void {

        const tIndex = trackEntry ? trackEntry.trackIndex : 0;
        const state = this._trackStates.get(tIndex);
        const isLoop = state ? state.target.loop : (trackEntry ? trackEntry.loop : this._isLoop);

        if (!isLoop) {
            // --- [原本的邏輯區塊] ---
            this.onAniComplete(false, tIndex); // 內部會呼叫 stopWith，現在 stopWith 也能處理 trackIndex 了

            let currentAniId: string = '';
            if (!trackEntry) {
                // 如果 entry 是空的，嘗試從 state 拿資料，拿不到才用 _currentTarget (Getter)
                currentAniId = state ? state.target.targetName : this._currentTarget.targetName;
            } else {
                currentAniId = trackEntry.animation.name;
            }

            this.reSetPlayInfoToOriginData(currentAniId);

            // [新增] 處理該軌道專屬的 Promise resolve
            const resolve = this._trackPromises.get(tIndex);
            if (resolve) {
                this._trackPromises.delete(tIndex);
                resolve();
            }

            // [新增] 播放結束後從追蹤清單移除該軌道狀態
            this._trackStates.delete(tIndex);
        }

        // [新增] 全域狀態維護：所有軌道都清空了，才正式宣告 isPlaying = false
        if (this._trackStates.size === 0) {
            this.isPlaying = false;
        }
        /*
        if (!this._isLoop) {
            this.onAniComplete();
            let currentAniId: string = '';
            if (trackEntry == undefined || trackEntry == null) {
                currentAniId = this._currentTarget.targetName;
            } else {
                currentAniId = trackEntry.animation.name;
            }
            this.reSetPlayInfoToOriginData(currentAniId);
        }*/
    }

    public safeRemoveSequencePlayFrameEventCallBack(): void {
        this._spineSequencePlayFrameEventCallBack = null;
    }

    //--銷毀前處理掉promise resolve避免沒銷毀的pending promise

    protected safeResolveSpinePromise(resolve?: () => void): void {
        this._spine?.setCompleteListener(null);
        if (resolve) {
            resolve();
        } else if (this._spineAniResolvePromise) {
            this._spineAniResolvePromise();
        }
        this._spineAniResolvePromise = null;
    }

    /**
     * 20251221多軌道播放修正
     * 釋放所有軌道的 Promise。
     * 用於組件銷毀或全域重置時。
     */
    protected safeResolveAllTrackPromises(): void {

        /*
        this._trackStates.forEach((state) => {
            // 釋放所有軌道的百分比監聽 Await
            this.clearAndResolvePercentageTasks(state);
        });*/

        this._trackPromises.forEach((resolve, tIndex) => {
            resolve();
        });
        this._trackPromises.clear();

        // 處理 Sequence 專用的 Promise
        this._sequenceResolvePromise?.();
        this._sequenceResolvePromise = null;
    }
    /** 
     *  20251221多軌道播放修正
     *  * 強制執行並清除 Callback (不再動 Listener)
        * @param trackIndex 若傳入則只處理特定軌道，不傳則處理全部
    */
    protected safeResolveSpineCallback(trackIndex?: number): void {

        if (trackIndex !== undefined) {
            const cb = this._trackCallbacks.get(trackIndex);
            if (cb) {
                cb();
                this._trackCallbacks.delete(trackIndex);
            }
        } else {
            // 銷毀前處理掉所有 callbacks
            this._trackCallbacks.forEach(cb => cb?.());
            this._trackCallbacks.clear();
        }
        // 注意：這裡絕對不呼叫 setCompleteListener(null)！

        //this._spine?.setCompleteListener(null);
        //this._spineAniCallback?.();
        //this._spineAniCallback = undefined;
    }

    protected removeMultipleCompleteEvent(value: string): void {

        const handler = this._handlerCacheMap.get(value);
        if (handler) {
            const registeredHandler = this._mapMultipleCompleteEvent.get(value);
            if (registeredHandler === handler) {
                this._mapMultipleCompleteEvent.delete(value);
            }
            this._handlerCacheMap.delete(value);
        }

        if (this._mapMultipleCompleteEvent.size === 0) {
            this._spine.setCompleteListener(null);
        }
    }

    public clearAllMultipleCompleteEvent(): void {
        this._mapMultipleCompleteEvent.clear();      // 移除正在監聽的事件
        this._handlerCacheMap.clear();              // 釋放 handler 實體
        this._spine.setCompleteListener(null);      // 解除 spine 綁定
    }


    private mapCleanTrackTypeToMode(t: CleanTrackType): StopClearMode {
        switch (t) {
            case CleanTrackType.CURRENT_TRACK:
                return StopClearMode.CURRENT;
            case CleanTrackType.EMPTY_ANI:
                return StopClearMode.EMPTY;
            case CleanTrackType.All_TRACKS:
            default: return StopClearMode.ALL;
        }
    }

    /**
     * 20251221-針對多軌播放做的停止邏輯-FIX
     * 是否使用預設的動畫狀態(總部沒有設定預設狀態)
     * 可是因為中軟的美術會設定default的動畫,所以這邊要有一個開關
     * 在使用預設狀態的情況下,會清除所有的track情況下
     * 因為中軟的美術在清光track的情況下的動畫動作沒有設定預設值阿=..=
     * 所以會爆開.
     * 加上清理掉的時候,中軟美術的檔案目前只能選擇使用StopClearMode.CURRENT
     * <用其他的會爆開>
     */
    private applyClearMode(mode: StopClearMode, trackIndex?: number): void {
        if (!this._spine) return;

        switch (mode) {
            case StopClearMode.CURRENT:
                if (trackIndex !== undefined) {
                    this._spine.clearTrack(trackIndex);
                } else {
                    this._spine.clearTracks(); // 全局清空
                }
                break;
            case StopClearMode.EMPTY:
                if (trackIndex !== undefined) {
                    this._spine.getState().setEmptyAnimation(trackIndex, 0);
                } else {
                    // 全局清空所有軌道並設為 Empty
                    this._trackStates.forEach((state, tIndex) => {
                        this._spine.getState().setEmptyAnimation(tIndex, 0);
                    });
                }
                break;
            case StopClearMode.ALL:
                this._spine.clearTracks();
                this.resetSpinePoseData();
                break;
            case StopClearMode.NONE:
            default:
                break;
        }


        /*
        if (mode === StopClearMode.NONE) return;

        if (mode === StopClearMode.CURRENT) {
            this.cleanCurrentTrack();
        } else if (mode === StopClearMode.ALL) {
            this.clearTracks();
        } else if (mode === StopClearMode.EMPTY) {
            this.cleanBySetEmptyAni();
        }*/
    }
    /**
     * 20251221-針對多軌播放做的停止邏輯
     * @param opt 停止選項
     * 
     */
    public stopWith(opt: IStopOptions = {}): void {

        if (!this._spine) return;
        // 取得本次操作的軌道 (可能是 undefined)
        const tIndex = opt.trackIndex;
        const stopParticles = opt.stopParticles ?? true;

        // --在刪除前先提取資料 ---
        let targetNameForReset: string = "";
        if (tIndex !== undefined) {
            const state = this._trackStates.get(tIndex);
            if (state) {
                // 獨立呼叫，不干擾原本的 safeResolveTrackPromise
                this.resolveAndClearPercentageTasks(tIndex);
            }
            // 先從狀態中抓出 targetName，抓不到才用備援
            targetNameForReset = this._trackStates.get(tIndex)?.target.targetName || this._currentTarget.targetName;
        } else {
            targetNameForReset = this._currentTarget.targetName;
        }


        // 特效處理 (粒子系統通常是全局的)
        if (stopParticles && this.particleSystem) {
            this.particleSystem.stopParticle();
        }

        if (opt.resolveCallback) {
            /**
             * 修改後的方式：
             * 傳入 opt.trackIndex。
             * - 若 trackIndex 有值：僅觸發並清理該軌道的 Callback。
             * - 若 trackIndex 為 undefined：觸發並清理所有軌道的 Callbacks（全域停止）。
             */
            this.safeResolveSpineCallback(tIndex);
        }
        // Promise 處理
        if (opt.resolvePromises) {
            if (tIndex !== undefined) {
                this.safeResolveTrackPromise(tIndex); // 只結束該軌道的 Await
            } else {
                this.safeResolveAllTrackPromises(); // 全部結束
                this.resolveAndClearPercentageTasks();
                //this._sequenceResolvePromise?.();
                //this._sequenceResolvePromise = null;
            }
        }

        // 動態資料還原 (Origin Data)
        if (!opt.resolvePromises) {

            this.reSetPlayInfoToOriginData(targetNameForReset);
        }

        // 清理策略 (Clear Tracks)
        let mode: StopClearMode = opt.clear ?? StopClearMode.NONE;
        if (tIndex !== undefined) {
            if (mode !== StopClearMode.NONE) this._spine.clearTrack(tIndex);
        } else {
            this.applyClearMode(mode, tIndex); // 全局模式
        }
        /*
        if (!opt.clear) {
            if (opt.overrideAfterPlayFlag || this._afterPlayDoStop) {
                mode = this.mapCleanTrackTypeToMode(this._clearTracks.trackType);
            }
        }*/

        //  狀態與開關處理
        if (tIndex !== undefined) {
            // 局部停止：只移除該軌道的追蹤
            this._trackStates.delete(tIndex);
            // 如果沒人在播了，才關閉全局 isPlaying
            if (this._trackStates.size === 0) {
                this.isPlaying = false;
            }
        } else {
            // 全局停止
            this.isPlaying = false;
            this._trackStates.clear();
        }
        // 重置PoseData
        if (opt.resetPose) {
            this.resetSpinePoseData();
        }

    }

    //--播完就強制銷毀回收
    public stopAndRecycle(): void {
        this.forceToDoBeforeDestroy();
    }


    /**
     * 非常確定當下就是要立刻馬上停止,不管動畫是哪一種
     * resolvePromises/resolveCallback/resetPose
     * 都會強制執行接管後續收尾動作
     */
    public stopNow(): void {
        this.stopWith({
            overrideAfterPlayFlag: true,
            clear: StopClearMode.CURRENT,
            resolvePromises: true,
            resolveCallback: true,
            resetPose: true,
            // 不傳 trackIndex 代表「所有軌道」
        });
    }

    public stopAni(): void {
        this.stopWith({});
        /*
        old one
            if (this._spine) {
            this.onAniComplete();
            this.isPlaying = false;
            if (this.particleSystem) {
                this.particleSystem.stopParticle();
            }
        }*/
    }

    //---強制中止promise動畫(ex:表演到一半的時候直接停止進行下面的動作(中斷輪播之類的))
    public stopPromiseAni(): void {
        this.stopWith({
            overrideAfterPlayFlag: true,//--略過_afterPlayDoStop
            clear: this.mapCleanTrackTypeToMode(this._clearTracks.trackType),
            resolvePromises: true,
            resolveCallback: true,
            resetPose: true,
        });
    }

    public forceToStopAni(): void {

        this.stopWith({
            overrideAfterPlayFlag: true,
            clear: StopClearMode.CURRENT,
            resolvePromises: true,
            resolveCallback: true,
            resetPose: true,
        });
        /*
        if (this._spine) {
            this.cleanCurrentTrack();
            this.isPlaying = false;
        }*/
    }

    public forceToStopAniByEmpty(): void {
        this.stopWith({
            overrideAfterPlayFlag: true,
            clear: StopClearMode.EMPTY,
            resolvePromises: true,
            resolveCallback: true,
            resetPose: true,
        });
        /*
        if (this._spine) {
            this.cleanBySetEmptyAni();
            this.safeResolveSpinePromise();
            this.isPlaying = false;
        }*/
    }

    public onAniComplete(backDefault?: boolean, trackIndex: number = 0): void {

        this.stopWith({
            trackIndex: trackIndex, // 指定只停這個軌道
            overrideAfterPlayFlag: false,
            // 與原本行為一致：不動 promise/callback、不停粒子、不重置 Pose
            resolvePromises: false,
            resolveCallback: false,
            stopParticles: false,
            resetPose: false,
        });
        /*
        if (backDefault) {
            this.playAni(this._defaultTarget);
        }*/
    }

    public cleanBySetEmptyAni(): void {
        this._spine.getState().setEmptyAnimation(0, 0);
        this._spine.setCompleteListener(null);
    }

    public cleanCurrentTrack(trackIndex: number = 0): void {

        if (!this._spine) return;
        this._spine.clearTrack(trackIndex);
        this._trackStates.delete(trackIndex);

        // 處理被中斷的 Callback 或 Promise (視你的需求決定要直接執行還是直接丟棄)
        // 通常建議直接 delete，因為這是「被覆蓋」而非「播放完成」
        this._trackCallbacks.delete(trackIndex);
        this._trackPromises.delete(trackIndex);//--這裡要再考慮一下

        if (this._trackStates.size === 0) {
            this.isPlaying = false;
            this.unscheduleAllCallbacks();
        }
        /*
        if (!trackIndex) {
            let trackEntry = this._spine.getCurrent(0);
            if (trackEntry) {
                this._spine.clearTrack(trackEntry.trackIndex);
            }
        } else {
            this._spine.clearTrack(trackIndex);
        }
        this._spine.setCompleteListener(null);
        this.unscheduleAllCallbacks();*/
    }

    public clearTracks(): void {

        this._spine.clearTracks();

        //-https://forum.cocos.org/t/topic/159467/8
        //-這樣清不掉
        this._spine.setCompleteListener(null);

        this.unscheduleAllCallbacks();
    }

    public onObjInstance(): void {

    }
    //-不能用onDestroy這個字component拿去用了
    public onAfterDestroy(): void {

    }


}


