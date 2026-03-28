import { _decorator, CCString, Enum, Node } from 'cc';
const { ccclass, property } = _decorator;

//--組合使用--你可以連續組合使用多個ResizeState來達成你想要的效果
export enum ResizeStateType {
    DEFAULT,
    RESIZE,
    SET_SCALE_TO_DEFAULT,
    SET_SCALE_TO_SWITCH,
    SET_POS_TO_DEFAULT,
    SET_POS_TO_SWITCH,
    SET_UI_TRANSFORM_SWITCH_CONTAINER,
    SET_UI_TRANSFORM_CUSTOM_CONTAINER,
    CHANGE_ANIMATION,
    CUSTOM
}
const ResizeStateEnum = Enum(ResizeStateType);

@ccclass('ResizeState')
export class ResizeState {
    @property({ type: ResizeStateEnum, visible: true, tooltip: 'Resize狀態類型' })
    public resizeStateType: ResizeStateType = ResizeStateType.DEFAULT;

    @property({ type: Node, tooltip: ' 自訂改變uiTransForm(當上面選 SET_UI_TRANSFORM_CUSTOM_CONTAINER 時顯示）', visible(this: ResizeState) { return this.resizeStateType === ResizeStateType.SET_UI_TRANSFORM_CUSTOM_CONTAINER; } })
    public customChangeUITransformTarget: Node | null = null;

    @property({ tooltip: '掛載名稱_辨識名稱(不填無所謂)' })//--給你辨識用的
    public targetName: string = '';

    public getStateKey(): string {
        return ResizeStateType[this.resizeStateType]; // e.g. 'DEFAULT' | 'RESIZE' | 'SET_SCALE'.........
    }
}



@ccclass('ResizeStateList')
export class ResizeStateList {
    @property({ visible: true, tooltip: '是否啟用自訂狀態state' })
    useDefaultState: boolean = true;
    //@ts-ignore
    @property({ type: [ResizeState], tooltip: '自定Resize狀態(狀態對應播放清單的tagetName)', visible: function () { return !this.useDefaultState } })
    public stateInfo: ResizeState[] = [];
}