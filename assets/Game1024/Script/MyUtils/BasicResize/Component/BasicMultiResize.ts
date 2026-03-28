import { Node } from 'cc';
import { ResizeState } from '../Definitions/BasicResizeState';

export interface IBasicMultiResize {
    doDefaultResize(target: Node): void
    doResize(target: Node): void
    doSetScaleDefault(target: Node): void
    doSetScaleToSwitch(target: Node): void
    doSetPositionDefault(target: Node): void
    doSetPositionToSwitch(target: Node): void
    //--交換自定義的node的uiTransform
    doSetCustomUITransform(target: Node, custom: ResizeState): void
    doSwitchUITransform(target: Node): void
    //--自己override..
    doChangeAnimation(target: Node): void
    //--自己override..
    doCustomProcess(target: Node): void
    doMultiProcessAfterResize(target: Node): void
    changeToLandscape(): void
    changeToPortrait(): void
}