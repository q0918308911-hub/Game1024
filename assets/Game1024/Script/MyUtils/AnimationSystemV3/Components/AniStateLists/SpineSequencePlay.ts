import { _decorator, Component, EventTarget, Node, sp, ISchedulable } from 'cc';
import { AniCtrlPropDef, SpineSequenceList, SpineSequenceItem, SpineCtrlPropDef } from './AnimationPlayStateBase';
import { SEQUENCE_EVENTS } from './Events';
import { CleanTrackType } from '../../Definitions/AnimationDataOptions';

const { ccclass, property } = _decorator;

@ccclass('SpineSequencePlay')

export class SpineSequencePlay extends EventTarget implements ISchedulable {

    //--要用Schedulable就自己在繼承使用
    id?: string;
    uuid?: string;

    //--播放清單
    @property({ type: SpineSequenceList, visible: true, displayName: 'SpineSequenceData', tooltip: 'Spine動畫序列清單' })
    private _sequenceData: SpineSequenceList = null;
    private _sp: sp.Skeleton = null;

    set sp(sp: sp.Skeleton) {
        this._sp = sp;
    }
    get sp() {
        return this._sp;
    }

    /**
     * 支援整包撥放列表循環播放功能
     * <播完列表1>依序往下找到<列表2>依序開始循環播放
     * 以下兩個變數for整包撥放列表循環播放功能
     */
    private _currentAllSequenceIndex: number = 0;
    private _currentAllSequenceLength: number = 0;
    private _currentSequenceIndex: number = 0;//--針對抽取出來的動畫序列播放清單用的
    private _currentLoopCount: number = 0;
    private _currentSequenceData: SpineSequenceItem; //--當前播放的動畫清單
    private _callBack: (...args: any[]) => void;
    private _clearTracksSetting: CleanTrackType;
    private _onSpineCompleteHandler: (trackEntry: sp.spine.TrackEntry) => void = null;
    private _onSpineEventHandler: (trackEntry: sp.spine.TrackEntry, event: sp.spine.Event | number) => void = null;

    set clearTracksSetting(value: CleanTrackType) {
        this._clearTracksSetting = value;
    }

    constructor() {
        super();
        this._callBack = null;
    }

    public init(): void {
        if (this._sequenceData) {
            this._currentAllSequenceLength = this._sequenceData.sequenceList.length;
        }
    }

    public resetDataBeforeDestroy(): void {
        if (this._sp) {
            this._sp.setCompleteListener(null);
            this._sp.setEventListener(null);
            this._onSpineCompleteHandler = null;
            this._onSpineEventHandler = null;
            this._callBack = null;
            if (this._clearTracksSetting == CleanTrackType.CURRENT_TRACK) {
                const trackEntry = this._sp.getCurrent(0);
                if (trackEntry) {
                    this._sp.clearTrack(trackEntry.trackIndex);
                }
            } else {
                this._sp.clearTracks();
            }
            this._currentAllSequenceIndex = 0;
            this._currentSequenceIndex = 0;
            this._currentLoopCount = 0;
        }

    }

    //--相同ID的不會重複加入
    public setSequenceData(sequenceId: string, loopSequence: boolean, sequenceData: SpineCtrlPropDef[]): void {

        if (!this._sequenceData.sequenceList || !this._sequenceData.sequenceList.some(item => item.SequenceId === sequenceId)) {
            this._sequenceData.sequenceList.push({ SequenceId: sequenceId, loopSequence: loopSequence, sequence: sequenceData });
            this._currentAllSequenceLength = this._sequenceData.sequenceList.length;
        }
    }


    private findSequenceList(sequenceName: string): SpineSequenceItem {

        for (let i: number = 0; i < this._sequenceData.sequenceList.length; i++) {
            if (this._sequenceData.sequenceList[i].SequenceId === sequenceName) {
                this._currentAllSequenceIndex = i;
                return this._sequenceData.sequenceList[i];
            }
        }
        return null;
    }

    public playSequence(sequenceName?: string) {

        //-SpineSequenceItem
        if (sequenceName) {
            this._currentSequenceData = this.findSequenceList(sequenceName);
            this._currentSequenceIndex = 0;
            this._currentLoopCount = 0;
            this._sp.setEventListener(null);
        }
        if (!this._currentSequenceData) {
            return;
        }
        const currentSequenceData = this._currentSequenceData.sequence;
        let currentItem: SpineCtrlPropDef;
        if (!currentSequenceData || this._currentSequenceIndex >= currentSequenceData.length) {
            //--播完了--送事件出去
            if (this._sequenceData.loopAllSequence) {
                this.playNextSequence();//--換下一筆播放清單
            } else {
                if (this._currentSequenceData.loopSequence && this._currentSequenceData.sequence.length > 0) {
                    this._currentSequenceIndex = 0;
                    currentItem = currentSequenceData[this._currentSequenceIndex];//--在這個播放表單內重播
                    this.playSpineAnimation(currentItem);
                } else {
                    //--沒有在該表單內循環的需求--送事件出去
                    if (this._callBack) {
                        this._callBack(this._sp);
                        this._callBack = null;
                    }
                    this.emit(SEQUENCE_EVENTS.COMPLETE, { eventType: SEQUENCE_EVENTS.COMPLETE, eventData: null });
                }
            }

        } else {
            currentItem = currentSequenceData[this._currentSequenceIndex];
            this.playSpineAnimation(currentItem);
        }


    }

    public playNextSequence() {
        this._currentAllSequenceIndex++;
        if (this._currentAllSequenceIndex >= this._currentAllSequenceLength) {
            this._currentAllSequenceIndex = 0;
        }
        this._currentSequenceData = this._sequenceData.sequenceList[this._currentAllSequenceIndex];
        this._currentSequenceIndex = 0;
        this._currentLoopCount = 0;
        this.playSequence();
    }

    public playSpineAnimation(item: SpineCtrlPropDef) {

        let trackEntry = this._sp.setAnimation(0, item.targetName, item.loop);
        this._currentLoopCount = 0;
        //--清除掉舊的事件監聽器
        this._sp.setCompleteListener(null);
        this._sp.setEventListener(null);

        if (item.eventFrameType) {

            this._onSpineEventHandler = (trackEntry, event) => {
                //@ts-ignore
                if (event.data.name === item.eventFrameType) {
                    //--發事件do somethings
                    //@ts-ignore
                    this.emit(SEQUENCE_EVENTS.FRAME_EVENT, { eventType: SEQUENCE_EVENTS.FRAME_EVENT, eventData: event.data.name });
                }
            }
            this._sp.setEventListener(this._onSpineEventHandler);
        }

        this._onSpineCompleteHandler = (trackEntry) => {
            if (trackEntry.animation.name === item.targetName) {
                this._currentLoopCount++;
                if (this._currentLoopCount >= item.repeatCount) {
                    this._currentSequenceIndex++;
                    this.playSequence();
                }
            }
        }

        this._sp.setCompleteListener(this._onSpineCompleteHandler);
    }

    public playSequenceWithCallBack(sequenceName: string, callBack: (...args: any[]) => void): void {
        this._callBack = callBack;
        this.playSequence(sequenceName);
    }

    // 動態切換播放序列
    public changeSequence(sequenceName: string) {
        if (this._sequenceData[sequenceName]) {
            this.playSequence(sequenceName);
        } else {
            console.warn(`Sequence ${sequenceName} does not exist.`);
        }
    }

}