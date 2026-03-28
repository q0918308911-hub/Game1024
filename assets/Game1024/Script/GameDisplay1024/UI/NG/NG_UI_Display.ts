import { _decorator, Component, Node } from 'cc';
import { ContainerWholeBehavior, IBkgDisplay, SpineController } from '../../../ReferencePath';
import { Orientation } from 'db://assets/Scripts/ModuleEntry';
import { BkgChangeColor } from '../../../MyUtils/BasicEffect/Components/BkgChangeColor';
const { ccclass, property } = _decorator;
const enum SLOT_FRAME_NG_ANI_STATE {
    L = 'L',
    P = 'P',
    NGUI = 'NGUI'
}

@ccclass('NG_UI_Display')
export class NG_UI_Display extends ContainerWholeBehavior implements IBkgDisplay {

    @property({ type: SpineController, visible: true, displayName: 'Spine Controller', tooltip: 'NG_UI_Display' })
    private _bgFrame_SpineController: SpineController = null;

    @property({ type: BkgChangeColor, visible: true, displayName: 'Bkg Change Color', tooltip: '背景顏色變化元件' })
    private _colorChangeComp: BkgChangeColor;

    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;

    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        //--用node added比較保險一點,且確保它<一定>是onload之後才會被addChild進來
        this._bgFrame_SpineController.node.once(Node.EventType.CHILD_ADDED, () => {
            this.init();
        });
        //--也可以這樣用..
        //this._bgFrame_SpineController.node.on(ANI_SYS_EVENTS.CTRL_LOADED, this.onSpineCtrlLoaded);
    }

    public override init(): void {

        if (!this._dirtyFlag) return;
        super.init();
        this._bgFrame_SpineController?.init();
        this._initialized = true;
        //this.doDefaultResizeProcess(this._currentOrientation);---正式在打開
        this.doDefaultResizeProcess(Orientation.Landscape);
        //this._bgFrame_SpineController?.playAni({ aniState: aniKey });
        //this._bgFrame_SpineController.playAni({ aniState: SLOT_FRAME_NG_ANI_STATE.NGUI });
    }

    /*
    public test():void{     
        this.doDefaultResizeProcess(Orientation.Portrait);
    }*/

    //--準備變換spine動畫
    protected doDefaultResizeProcess(value: Orientation): void {
        //--這個要掛上gameRoot才會有Orientation的資料(還沒掛之前先給資料)
        //const aniKey= value === Orientation.Landscape ? SLOT_FRAME_NG_ANI_STATE.L : SLOT_FRAME_NG_ANI_STATE.P;
        if (!this._initialized) {
            return;
        }
        const aniKey = SLOT_FRAME_NG_ANI_STATE.L;

        if (this._bgFrame_SpineController) {
            this._bgFrame_SpineController.playAni({ aniState: aniKey });
            this._bgFrame_SpineController.playAni({ aniState: SLOT_FRAME_NG_ANI_STATE.NGUI });
        }
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


