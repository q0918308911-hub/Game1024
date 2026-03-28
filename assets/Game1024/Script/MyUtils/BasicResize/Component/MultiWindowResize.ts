import { _decorator, CCBoolean, Component, Node, UITransform } from 'cc';
import { ResizeState, ResizeStateType, ResizeStateList } from '../Definitions/BasicResizeState';
import { ResizeHandler } from './ResizeHandler';
import { IWindowResize, Orientation } from 'db://assets/Scripts/ModuleEntry';

const { ccclass, property } = _decorator;

/**
 * 很多情況下工具庫當中的resize相關component你需要同時使用到多個
 * 這個component就是讓你可以同時使用多個resize component
 * 你可以透過_resizeStateList你去依照陣列的順序自己去組合出符合你心中預期行為的resize動作
 * PS-基礎方法集合了大部分resize提供的行為模式
 * 新增模式:
 * SET_UI_TRANSFORM_CUSTOM_CONTAINER
 * 可以與你指定的容器做UITransform的同步
 * 
 */
@ccclass('MultiWindowResize')
export class MultiWindowResize extends IWindowResize {

    //--他會依照ResizeStateList的狀態來做相關的反映+組合
    @property({ type: ResizeStateList, displayName: 'ResizeStateList', visible: true, tooltip: '狀態控制Resize清單' })
    protected _resizeStateList: ResizeStateList = new ResizeStateList();

    @property(CCBoolean)
    public switchChild: boolean = false;

    @property([Node])
    public landscape: Node[] = [];

    @property([Node])
    public portrait: Node[] = [];

    protected _currentOrientation: Orientation = Orientation.Landscape;
    protected _currentContainer: Node | null = null;
    protected _previousContainer: Node | null = null;
    protected _resizeHandler: ResizeHandler = new ResizeHandler();

    constructor() {
        super();
    }

    public override onWindowResize(orientation: Orientation) {
        // Handle window resize logic here
        if (orientation === Orientation.Landscape) {
            this.changeToLandscape();
        }
        else if (orientation === Orientation.Portrait) {
            this.changeToPortrait();
        }

        this.doDefaultResizeProcess(orientation);
    }

    //--override it
    protected doDefaultResizeProcess(value: Orientation): void {

    }

    //--自己override..
    protected doChangeAnimation(target: Node): void {

    }
    //--自己override..
    protected doCustomProcess(target: Node): void {

    }

    protected changeToLandscape(): void {
        for (let i = 0; i < this.landscape.length; i += 1) {
            const landscapeNode = this.landscape[i];
            const portraitNode = this.portrait[i];
            // 注意順序
            landscapeNode.active = true;
            this._currentContainer = landscapeNode;
            this._previousContainer = portraitNode;
            if (this.switchChild) {
                while (portraitNode.children.length !== 0) {
                    const target = portraitNode.children[0];
                    target.removeFromParent(); // 強制脫離當前 parent
                    landscapeNode.addChild(target);//--有針對node做added事件的可以在這邊觸發
                    this._resizeHandler.applyMultiResize(target, this._resizeStateList, landscapeNode);
                }
            }
            portraitNode.active = false;
        }
    }

    protected changeToPortrait(): void {
        for (let i = 0; i < this.landscape.length; i += 1) {
            const landscapeNode = this.landscape[i];
            const portraitNode = this.portrait[i];
            // 注意順序
            portraitNode.active = true;
            this._currentContainer = portraitNode;
            this._previousContainer = landscapeNode;

            if (this.switchChild) {
                while (landscapeNode.children.length !== 0) {
                    const target = landscapeNode.children[0];
                    target.removeFromParent(); // 強制脫離當前 parent
                    portraitNode.addChild(target);//--有針對node做added事件的可以在這邊觸發
                    //this.doMultiProcessAfterResize(target);
                    this._resizeHandler.applyMultiResize(target, this._resizeStateList, portraitNode);
                }
            }
            landscapeNode.active = false;
        }
    }
}