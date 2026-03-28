import { _decorator, Component, Label, Node } from 'cc';
import { AnimationController, AnimationStateType, ContainerWholeBehavior, IBkgDisplay } from '../../../ReferencePath';
import { BkgChangeColor } from '../../../MyUtils/BasicEffect/Components/BkgChangeColor';
import { ANI_SYS_EVENTS } from '../../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';

const ANI_KEY = {
    ADD: 'Add'
}
const { ccclass, property } = _decorator;

@ccclass('FG_MultipleCount_Display')
export class FG_MultipleCount_Display extends ContainerWholeBehavior implements IBkgDisplay {

    @property({ type: AnimationController, visible: true, displayName: 'Animation Controller', tooltip: 'NG_Ani_BKG_Display' })
    private _animationController: AnimationController = null;

    @property({ type: BkgChangeColor, visible: true, displayName: 'Bkg Change Color', tooltip: '背景顏色變化元件' })
    private _colorChangeComp: BkgChangeColor;

    @property({ type: Label, visible: true, displayName: 'Times Count Label', tooltip: '倍數顯示Label' })
    private _timesCountLabel: Label = null;

    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;
    private _currentCount: number = 0;

    public testFGTimes(): void {

        this.addFGMultipleCount(this._currentCount - 1);
    }

    public reset(): void {
        this._currentCount = 1;//--這款遊戲好像是一進FG就是1倍數開始20260113
        this.showCountLabel();
    }

    public showCountLabel(value?: number): void {
        const count = (value) ? value : this._currentCount;
        const finalStr = count.toString() + 'X';
        this._timesCountLabel.string = finalStr;
    }

    public addFGMultipleCount(value: number): void {

        this._currentCount = value;
        this._animationController?.playAniWithCallBack(() => {
            this.showCountLabel(value);
        }, false, { aniState: ANI_KEY.ADD });
    }


    protected onLoad(): void {

        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
        } else {
            this._animationController?.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
            });
        }
        //this._animationController.node.on(ANI_SYS_EVENTS.CTRL_LOADED, this.onSpineCtrlLoaded);
    }
    /**
     * 提供給 Manager 呼叫，確保三個物件都 ready
     */
    public async waitForReady(): Promise<void> {

        if (this._initialized) return;

        // 如果已經載入完成，直接 init 並回傳
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
            return;
        }

        // 否則，開啟一個 Promise 等待事件
        return new Promise<void>((resolve) => {
            this._animationController.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
                resolve();
            });
        });
    }

    public override init(): void {

        if (!this._dirtyFlag) return;
        super.init();
        this.reset();
        this._animationController?.playAni(AnimationStateType.Default);
        this._initialized = true;
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


