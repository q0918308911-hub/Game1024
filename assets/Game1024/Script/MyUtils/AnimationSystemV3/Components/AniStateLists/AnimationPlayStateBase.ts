import { _decorator, CCString, Enum } from 'cc';
import { AnimationPlayParams, CleanTrackType, SpinePlayParams } from '../../Definitions/AnimationDataOptions';
import { IAnimationControl } from '../../Definitions/IAnimationControl';

const { ccclass, property } = _decorator;

@ccclass('AniCtrlPropDef')
export class AniCtrlPropDef implements AnimationPlayParams {
    @property({ tooltip: 'useDefault' })
    public useDefault: boolean = false;

    @property({ tooltip: '延遲播放' })
    public delay: number = 0;

    @property({ tooltip: '重複次數' })
    public repeatCount: number = 0;

    @property({ tooltip: '動畫片段名稱' })
    public targetName: string = '';

    @property({ tooltip: '播放速度' })
    public speed: number = 1;

    @property({ tooltip: '播放模式' })
    public wrapMode: number = 0;

    @property({ tooltip: '持續時間_單位:sec' })
    public duration: number = 0;
}

@ccclass('SpineCtrlPropDef')
export class SpineCtrlPropDef implements SpinePlayParams {
    @property({ tooltip: '循環播放' })
    public loop: boolean = false;

    @property({ tooltip: '重複次數' })
    public repeatCount: number = 0;

    @property({ tooltip: '延遲播放' })
    public delay: number = 0;

    @property({ tooltip: '動畫片段名稱' })
    public targetName: string = '';

    @property({ tooltip: 'timescale' })
    public timeScale: number = 1;

    @property({ tooltip: 'useDefault' })
    public useDefault: boolean = false;

    @property({ tooltip: 'trackIndex' })
    public trackIndex: number = 0;

    @property({ tooltip: 'skinName' })
    public skinName: string = '';
    //--本身繼承component才能這樣搞
    //@property({ tooltip: 'frameEventType', visible() { return this.useFrameEvent } })
    @property({ tooltip: 'eventFrameType' })
    public eventFrameType: string = '';


}


@ccclass('SpineAniPlayInfoList')

export class SpineAniPlayInfoList {

    @property({ visible: true, tooltip: '是否啟用自訂state' })
    useDefaultState: boolean = true;

    //@ts-ignore
    @property({ type: [SpineCtrlPropDef], tooltip: '自定義動畫片段清單(播放幾個就放幾個)', visible: function () { return !this.useDefaultState } })
    clipsInfo: SpineCtrlPropDef[] = [];

}

@ccclass('AnimationPlayInfoList')

export class AnimationPlayInfoList {

    @property({ visible: true, tooltip: '是否啟用自訂state' })
    useDefaultState: boolean = true;

    //@ts-ignore
    @property({ type: [AniCtrlPropDef], tooltip: '自定義動畫片段清單(播放幾個就放幾個)', visible: function () { return !this.useDefaultState } })
    clipsInfo: AniCtrlPropDef[] = [];

}

const CleanTrackTypeEnum = Enum(CleanTrackType);
@ccclass('ClearTrackTypeState')
export class ClearTrackTypeState {
    @property({ type: CleanTrackTypeEnum, visible: true, tooltip: '動畫狀態類型' })
    public trackType: CleanTrackType = CleanTrackType.All_TRACKS;
}
//--用來判斷預設條件
export enum AnimationStateType {
    Idle,
    Win,
    Default,
    Custom,
    In,
    Loop,
    Out
}
const AnimationStateTypeEnum = Enum(AnimationStateType);

@ccclass('AnimationState')
export class AnimationState {
    @property({ type: AnimationStateTypeEnum, visible: true, tooltip: '動畫狀態類型' })
    public AniStateType: AnimationStateType = AnimationStateType.Default;

    @property({ type: CCString, tooltip: '自訂狀態名稱（當上面選 Custom 時顯示）', visible(this: AnimationState) { return this.AniStateType === AnimationStateType.Custom; } })
    public customStateName: string = '';

    @property({ tooltip: '動畫片段名稱' })
    public targetName: string = '';

    public getStateKey(): string {
        return this.AniStateType === AnimationStateType.Custom
            ? this.customStateName.trim()
            : AnimationStateType[this.AniStateType]; // e.g. 'Idle' | 'Win' | 'Default'
    }
}



@ccclass('AnimationStateList')
export class AnimationStateList {
    @property({ visible: true, tooltip: '是否啟用自訂狀態state' })
    useDefaultState: boolean = true;
    //@ts-ignore
    @property({ type: [AnimationState], tooltip: '自定義動畫狀態(狀態對應播放清單的tagetName)', visible: function () { return !this.useDefaultState } })
    public stateInfo: AnimationState[] = [];
}

@ccclass('MultiAnimationState')
export class MultiAnimationState extends AnimationState {
    @property({ tooltip: '動畫索引' })
    public spineControllerKey: string = '';
}

@ccclass('MultiAnimationStateList')
export class MultiAnimationStateList extends AnimationStateList {
    // 重新宣告並覆寫 clipsInfo 的型別與 decorator
    //@ts-ignore
    @property({ type: [MultiAnimationState], tooltip: '自定義動畫狀態(含索引)', visible: function () { return !this.useDefaultState } })
    public clipsInfo: MultiAnimationState[] = [];
}


@ccclass('SpineSequenceItem')

export class SpineSequenceItem {

    @property({ tooltip: '動畫的序列群組名稱' })
    public SequenceId: string = '';

    @property({ tooltip: '是否循環播放這個播放列表' })
    public loopSequence: boolean = false;

    @property({ type: [SpineCtrlPropDef], tooltip: '動畫片段資料' })
    public sequence: SpineCtrlPropDef[] = [];
}



@ccclass('SpineSequenceList')
export class SpineSequenceList {

    @property({ type: [SpineSequenceItem], tooltip: '動畫序列清單' })
    public sequenceList: SpineSequenceItem[] = [];

    @property({ tooltip: '是否循環播<整個>播放列表' })
    public loopAllSequence: boolean = false;

}
//-IAnimationControl
export class IAniWithAniCtrl {
    public IAni: IAnimationControl;
    public aniCtrl: AniCtrlInfoDef;
}

export type AniCtrlInfoDef =
    SpineCtrlPropDef |
    AniCtrlPropDef


