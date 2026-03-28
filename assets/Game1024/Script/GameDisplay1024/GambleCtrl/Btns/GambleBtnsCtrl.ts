import { _decorator, Button, Component, Node } from 'cc';
import { AnimationController, AnimationStateType } from '../../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';
const { ccclass, property } = _decorator;

const ANI_LIST = {
    DARK: 'Dark',
    NORMAL: 'Normal'
}

@ccclass('GambleBtnsCtrl')
export class GambleBtnsCtrl extends Component {

    @property({ type: AnimationController, visible: true, displayName: 'X10按鈕動畫', tooltip: 'X10BtnAni' })
    private _x10BtnAnimCtrl: AnimationController = null;

    @property({ type: AnimationController, visible: true, displayName: 'X14按鈕動畫', tooltip: 'X14BtnAni' })
    private _x14BtnAnimCtrl: AnimationController = null;

    @property({ type: AnimationController, visible: true, displayName: 'X18按鈕動畫', tooltip: 'X18BtnAni' })
    private _x18BtnAnimCtrl: AnimationController = null;

    @property({ type: AnimationController, visible: true, displayName: 'X22按鈕動畫', tooltip: 'X22BtnAni' })
    private _x22BtnAnimCtrl: AnimationController = null;

    @property({ type: Button, visible: true, displayName: 'X10按鈕', tooltip: 'X10Button' })
    private _x10Btn: Button = null;

    @property({ type: Button, visible: true, displayName: 'X14按鈕', tooltip: 'X14Button' })
    private _x14Btn: Button = null;

    @property({ type: Button, visible: true, displayName: 'X18按鈕', tooltip: 'X18Button' })
    private _x18Btn: Button = null;

    @property({ type: Button, visible: true, displayName: 'X22按鈕', tooltip: 'X22Button' })
    private _x22Btn: Button = null;

    private _btnAnimCtrlMap: Map<number, AnimationController> = new Map();
    private _btnMap: Map<string, Button> = new Map();
    private _initialized: boolean = false;
    private _dirtyFlag: boolean = false;

    protected onLoad(): void {

        if (this._dirtyFlag) return;
        this._dirtyFlag = true;

        this._btnAnimCtrlMap.set(10, this._x10BtnAnimCtrl);
        this._btnAnimCtrlMap.set(14, this._x14BtnAnimCtrl);
        this._btnAnimCtrlMap.set(18, this._x18BtnAnimCtrl);
        this._btnAnimCtrlMap.set(22, this._x22BtnAnimCtrl);
        this._x10Btn.name = '10';
        this._x14Btn.name = '14';
        this._x18Btn.name = '18';
        this._x22Btn.name = '22';
        this._btnMap.set(this._x10Btn.name, this._x10Btn);
        this._btnMap.set(this._x14Btn.name, this._x14Btn);
        this._btnMap.set(this._x18Btn.name, this._x18Btn);
        this._btnMap.set(this._x22Btn.name, this._x22Btn);

        const aniCtrls = Array.from(this._btnAnimCtrlMap.values());
        let loadedCount = 0;

        const checkAllLoaded = () => {
            loadedCount++;
            // 當載入成功的數量等於 Map 的總數時，執行初始化
            if (loadedCount === this._btnAnimCtrlMap.size) {
                this.init();
            }
        };

        for (const ctrl of aniCtrls) {
            if (!ctrl) continue;
            if (ctrl.isLoaded) {
                checkAllLoaded();
            } else {
                ctrl.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                    checkAllLoaded();
                });
            }
        }

    }

    /**
     * 提供給 Manager 呼叫，確保三個物件都 ready
     */
    public async waitForReady(): Promise<void> {

        const promises: Promise<void>[] = [];

        for (const [key, ctrl] of this._btnAnimCtrlMap) {
            if (!ctrl) continue;

            if (ctrl.isLoaded) {
                promises.push(Promise.resolve());
            } else {

                const p = new Promise<void>((resolve) => {
                    ctrl.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                        resolve();
                    });
                });
                promises.push(p);
            }
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }

        this.init();
    }

    public init(): void {

        if (!this._dirtyFlag) return;
        //this.reset();
        this._initialized = true;
        //this._x10Btn.node.on(Button.EventType.CLICK, this.btnClickHandler);
        //this.openCurrentLevelBtn(14);
    }

    public stopAll(): void {
        for (const [key, ctrl] of this._btnAnimCtrlMap) {
            ctrl?.stopAni();
        }
    }

    public setALLDefault(): void {

        for (const [key, ctrl] of this._btnAnimCtrlMap) {
            if (key == 10) {
                ctrl?.playAni({ aniState: ANI_LIST.DARK });
            } else {
                ctrl?.playAni(AnimationStateType.Default);
            }

        }
    }

    public setAllDark(): void {

        for (const [key, ctrl] of this._btnAnimCtrlMap) {
            ctrl?.playAni({ aniState: ANI_LIST.DARK });
        }
    }

    public setBtnStatus(level: number): void {

        for (const [key, ctrl] of this._btnAnimCtrlMap) {
            if (key < level) {
                //--dark
                ctrl?.playAni({ aniState: ANI_LIST.DARK });
            } else if (key === level) {
                ctrl?.playAni(ANI_LIST.NORMAL);
            } else if (key > level) {
                ctrl?.playAni(AnimationStateType.Default);
            }
        }
    }

    public reset(): void {

        this.setALLDefault();
        /*
        for (const [key, ctrl] of this._btnAnimCtrlMap) {
            ctrl?.playAni(AnimationStateType.Default);
            
            if (key == 10) {
                ctrl?.playAni({ aniState: ANI_LIST.DARK });
            } else {
                ctrl?.playAni(AnimationStateType.Default);
            }

            //--20260310-左側似乎不需要有按鈕的功能
            const btnKey = key.toString();
            const btn = this._btnMap.get(btnKey);
            if (btn) {
                btn.interactable = false;
                if (btn.node.hasEventListener(Button.EventType.CLICK)) {
                    btn.node.off(Button.EventType.CLICK, this.btnClickHandler);
                }
            }
        }*/
    }


    public openCurrentLevelBtn(level: number): void {
        /**
         * 1.第一階段10次進來,使用預設setALLDefault
         * 2.當次數高於10次時,低於的物件按鈕就需要使用Dark的狀態
         */
        this.setBtnStatus(level);
        //this.setALLDefault();//--這是一開始的初始狀態
        //this.setAllDark();
        //const ctrl = this._btnAnimCtrlMap.get(level);
        //if (!ctrl) return;
        //--20260310-左側似乎不需要有按鈕的功能
        /*
        const btn = this._btnMap.get(level.toString());
        if (btn) {
            btn.interactable = true;
            btn.node.on(Button.EventType.CLICK, this.btnClickHandler);
        }*/
        //ctrl.playAni(ANI_LIST.NORMAL);
    }

    private btnClickHandler = (e): void => {

        console.log('test btn click', e);
    }



}


