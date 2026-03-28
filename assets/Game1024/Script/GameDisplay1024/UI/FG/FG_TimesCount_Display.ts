import { _decorator, Component, Label, Node } from 'cc';
import { AnimationController, AnimationStateType, ContainerWholeBehavior, IBkgDisplay } from '../../../ReferencePath';
import { BkgChangeColor } from '../../../MyUtils/BasicEffect/Components/BkgChangeColor';

const ANI_KEY = {
    ADD: 'Add',
    MINUS: 'Minus'

}
const { ccclass, property } = _decorator;

@ccclass('FG_TimesCount_Display')
export class FG_TimesCount_Display extends ContainerWholeBehavior implements IBkgDisplay {

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
        //this.addFGCount(this._currentCount + 20);
        //this.minusFGCount(this._currentCount - 1);
    }

    public reset(): void {
        this._currentCount = 0;
        this.showCountLabel();
    }

    public setTotalFGCount(value: number): void {
        this._currentCount = value;
        this.showCountLabel();
    }

    public setFGCount(value: number): void {

        const oldValue = this._currentCount;
        this._currentCount += value;

        if (oldValue > this._currentCount) {
            this.minusFGCount();
        } else {
            this.addFGCount();
        }

    }

    public showCountLabel(value?: number): void {
        const count = (value) ? value : this._currentCount;
        this._timesCountLabel.string = count.toString();
    }

    public addFGCount(): void {
        this._animationController?.playAniWithCallBack(() => {
            this.showCountLabel();
        }, false, { aniState: ANI_KEY.ADD });
    }

    public minusFGCount(): void {

        this._animationController?.playAniWithCallBack(() => {
            this.showCountLabel();
        }, false, { aniState: ANI_KEY.MINUS });
    }



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
        //--for test--
        this._currentCount = 20;
        this.showCountLabel();
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


