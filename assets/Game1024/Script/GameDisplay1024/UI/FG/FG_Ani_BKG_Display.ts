import { _decorator, Component, Node } from 'cc';
import { AnimationController, AnimationStateType, ContainerWholeBehavior, IBkgDisplay } from '../../../ReferencePath';
import { BkgChangeColor } from '../../../MyUtils/BasicEffect/Components/BkgChangeColor';

const { ccclass, property } = _decorator;

@ccclass('FG_Ani_BKG_Display')
export class FG_Ani_BKG_Display extends ContainerWholeBehavior implements IBkgDisplay {

    @property({ type: AnimationController, visible: true, displayName: 'Animation Controller', tooltip: 'NG_Ani_BKG_Display' })
    private _animationController: AnimationController = null;

    @property({ type: BkgChangeColor, visible: true, displayName: 'Bkg Change Color', tooltip: '背景顏色變化元件' })
    private _colorChangeComp: BkgChangeColor;

    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;

    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        //--用node added比較保險一點,且確保它<一定>是onload之後才會被addChild進來
        this._animationController.node.once(Node.EventType.CHILD_ADDED, () => {
            this.init();
        });
        //--也可以這樣用..
        //this._animationController.node.on(ANI_SYS_EVENTS.CTRL_LOADED, this.onSpineCtrlLoaded);
    }

    public override init(): void {

        if (!this._dirtyFlag) return;
        super.init();
        this._animationController?.init();
        this._animationController?.playAni(AnimationStateType.Default);
    }

    //---開啟背景反黑
    public openDark(spColorMode?: boolean): void {
        this._colorChangeComp.openDark(spColorMode);
    }
    //---關閉背景反黑
    public closeDark(spColorMode?: boolean): void {
        this._colorChangeComp.closeDark(spColorMode);
    }
    //---漸變反黑
    public async openTweenDark(spColorMode?: boolean): Promise<void> {
        await this._colorChangeComp.openTweenDark(spColorMode);
    }
    public async closeTweenDark(spColorMode?: boolean): Promise<void> {
        await this._colorChangeComp.closeTweenDark(spColorMode);
    }


}


