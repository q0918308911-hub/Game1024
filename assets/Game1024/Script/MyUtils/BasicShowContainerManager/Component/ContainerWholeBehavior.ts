import { _decorator, Node, CCBoolean, Component, UIOpacity, tween } from "cc";
import { ContainerBasicBehavior } from "./ContainerBasicBehavior";
//import { IBG_Ani, IGameNodeWithRotation } from "../Definitions/GameNodeWithRotation";
//import { Orientation } from "db://assets/Scripts/Utils/Config";
import { ResizeStateList } from "../../BasicResize/Definitions/BasicResizeState";
//import { IBasicMultiResize } from "../../BasicResize/Component/Definitions/BasicMultiResize";
import { ResizeState } from "../../BasicResize/Definitions/BasicResizeState";
import { ResizeStateType } from '../../BasicResize/Definitions/BasicResizeState';
import { GameState } from "../../GameStateConfigDef/GameStateConfigDef";
import { ResizeHandler } from "../../BasicResize/Component/ResizeHandler";
import { Orientation } from "db://assets/Scripts/ModuleEntry";
import { IBG_Ani, IGameNodeWithRotation } from "../Definitions/GameNodeWithRotation";
/**
 * 包含旋轉縮放的行為
 * 這個是給<ShowContainerWithResizeManager>BasicShowContainerManager使用的
 * 讓BasicShowContainerManager可以同時擁有旋轉縮放的行為
 * 以及基本的顯示隱藏行為
 */
const { ccclass, property } = _decorator;

@ccclass('ContainerWholeBehavior')
export class ContainerWholeBehavior extends ContainerBasicBehavior implements IGameNodeWithRotation, IBG_Ani {

    //--他會依照ResizeStateList的狀態來做相關的反映+組合
    @property({ type: ResizeStateList, displayName: 'ResizeStateList', visible: true, tooltip: '狀態控制Resize清單' })
    protected _resizeStateList: ResizeStateList = new ResizeStateList();

    @property({ visible: true, tooltip: '是否交換容器' })
    public switchChild: boolean = true;

    @property({ type: [Node], tooltip: '需要交換的橫版容器', displayName: 'LandscapeContainer', visible: function (this: ContainerWholeBehavior) { return this.switchChild; } })
    public landscape: Node[] = [];

    @property({ type: [Node], tooltip: '需要交換的直版容器', displayName: 'PortraitContainer', visible: function (this: ContainerWholeBehavior) { return this.switchChild; } })
    public portrait: Node[] = [];

    @property({ type: Node, tooltip: '預設容器', displayName: 'DefaultContainer', visible: function (this: ContainerWholeBehavior) { return !this.switchChild; } })
    protected _defaultContainer: Node | null = null;
    @property({ type: UIOpacity, visible: true, displayName: 'FG_UI_Opacity', tooltip: 'FG_UI_Opacity' })
    public GUIOpacity: UIOpacity = null;

    protected _currentOrientation: Orientation = Orientation.Landscape;
    protected _currentContainer: Node | null = null;
    protected _previousContainer: Node | null = null;
    protected _resizeHandler: ResizeHandler = new ResizeHandler();

    //--???
    public beforeChangeGameMode(gameState: GameState): void {

    }
    //---給控制器去呼叫使用的(遊戲狀態改變時呼叫)
    public changeGameMode(gameState: GameState): void {

    }

    public override init(): void {
        super.init();
        this._resizeHandler?.initializeDefaultActions();

    }

    // Implementation
    public openContainer(): void {
        // Open container logic
        this.node.active = true;
    }

    public closeContainer(): void {
        // Close container logic
        this.node.active = false;
    }
    //--自己要實作阿.....
    public openContainerTween(): void {
        if (!this.GUIOpacity) return;
        this.node.active = true;
        tween(this.GUIOpacity)
            .to(0.5, { opacity: 255 })
            .call(() => {
                //this.node.active = true;
            })
            .start();
    }
    //--自己要實作阿.....
    public closeContainerTween(): void {
        if (!this.GUIOpacity) return;
        tween(this.GUIOpacity)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    //===========================<public function>=========================================================================================================
    //--for _resizeHandler---
    public registerAction(resizeStateType: ResizeStateType | string, action: (target: Node, currentContainer: Node | null, state?: ResizeState) => void): void {
        this._resizeHandler?.registerAction(resizeStateType, action);
    }



    //--for _resizeHandler---
    //===========================<public function>=========================================================================================================

    //==========================<interface IBG_Ani>========================================================================================================
    public stopAllAni(): void {
        // Stop all animations
    }

    public playAni(value?: string): void {
        // Play animation
    }

    //==========================<interface IBG_Ani>=========================================================================================================
    //==========================<interface IGameNodeWithRotation>==========================================================================================
    //--給上層控制器使用,控制器繼承IWindowResize,當視窗改變時會呼叫這個方法
    public changeRotationResolution(value: Orientation): void {
        // Handle window resize logic here
        if (value === Orientation.Landscape) {
            this.changeToLandscape();
        }
        else if (value === Orientation.Portrait) {
            this.changeToPortrait();
        }
        this.doDefaultResizeProcess(value);

    }

    //--override it
    protected doDefaultResizeProcess(value: Orientation): void {

    }

    protected changeToLandscape(): void {

        //--要再補上不使用交換容器只使用接收通知的功能之類的
        if (this.switchChild) {
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
        } else {
            this._resizeHandler.applyMultiResize(this._defaultContainer, this._resizeStateList);
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

    //==========================<interface IGameNodeWithRotation>==========================================================================================

}