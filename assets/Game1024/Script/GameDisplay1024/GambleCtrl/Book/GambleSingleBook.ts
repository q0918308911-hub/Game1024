import { _decorator, Button, Component, Node } from 'cc';
import { AnimationController, AnimationStateType } from '../../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';
import { ChallengeEventStatus } from '../../../DefinitionGameData1024/GameEventTypeDef1024';

const { ccclass, property } = _decorator;

const ANI_LIST = {
    INIT_DEFAULT: 'Init',//--初始狀態，亮的book
    INIT_DISABLE: 'Init_Disable',//--初始狀態，暗掉的book
    SELECT_IN: 'Select_In',//--book被選擇翻書動畫
    SELECT_LOOP: 'Select_Loop',//--book被選擇翻書後的待機動畫
    SUCCESS_IN: 'Success_In',//--book被選擇翻書後，成功的動畫
    SUCCESS_LOOP: 'Success_Loop',//--book被選擇翻書後，成功的待機動畫
    SUCCESS_DISABLE: 'Success_Disable',//--book被選擇翻書後，成功的暗掉狀態
    FAIL_IN: 'Fail_In',//--book被選擇翻書後，失敗的動畫
    FAIL_LOOP: 'Fail_Loop',//--book被選擇翻書後，失敗的待機動畫
    FAIL_DISABLE: 'Fail_Disable'//--book被選擇翻書後，失敗的暗掉狀態
}

@ccclass('GambleSingleBook')
export class GambleSingleBook extends Component {

    @property({ type: AnimationController, visible: true, displayName: '單一Book動畫AniCtrl', tooltip: '單一Book動畫控制器' })
    private _bookAnimCtrl: AnimationController = null;

    @property({ type: Button, visible: true, displayName: 'Book按鈕', tooltip: 'Book上的按鈕' })
    private _bookBtn: Button = null;

    public bookId: number = 0;

    get bookAnimCtrl(): AnimationController {
        return this._bookAnimCtrl;
    }

    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;

    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        if (this._bookAnimCtrl.isLoaded) {
            this.init();
        } else {
            this._bookAnimCtrl.node.on(ANI_SYS_EVENTS.CTRL_LOADED, this.onAniCtrlLoaded);
        }
    }

    private onAniCtrlLoaded = (): void => {
        this._bookAnimCtrl.node.off(ANI_SYS_EVENTS.CTRL_LOADED, this.onAniCtrlLoaded);
        this.init();
    }

    public init(): void {

        if (!this._dirtyFlag) return;
        this._bookAnimCtrl?.init();
        this._initialized = true;
    }


    /**
     * 提供給上層控制器呼叫，確保 book 已經 ready
     */
    public async waitForReady(): Promise<void> {

        if (this._initialized) return;
        // 如果已經載入完成，直接 init 並回傳
        if (this._bookAnimCtrl && this._bookAnimCtrl.isLoaded) {
            this.init();
            return;
        }

        return new Promise<void>((resolve) => {
            this._bookAnimCtrl.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
                resolve();
            });
        });
    }

    public setBookBtnActive(flag: boolean): void {

        if (flag) {
            if (!this._bookBtn.node.hasEventListener(Button.EventType.CLICK)) {
                this._bookBtn.node.on(Button.EventType.CLICK, this.btnClickHandler);
            }

        } else {
            if (this._bookBtn.node.hasEventListener(Button.EventType.CLICK)) {
                this._bookBtn.node.off(Button.EventType.CLICK, this.btnClickHandler);
            }
        }

        this._bookBtn.interactable = flag;
    }

    public stopAni(): void {
        this._bookAnimCtrl?.stopAni();
    }

    public playInitDefault(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.INIT_DEFAULT });
    }

    public playInitDisable(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.INIT_DISABLE });
    }

    public playSelectIn(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.SELECT_IN });
    }

    public playSelectLoop(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.SELECT_LOOP });
    }

    //--改promise版本，讓上層控制器可以等翻書動畫播完再播結果動畫
    //public async playSuccessIn(): Promise<void> {
    public playSuccessIn(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.SUCCESS_IN });
        //--速度太慢了,來不及秀其他的結果動畫了
        //await this._bookAnimCtrl?.playAniInPromise({ aniState: ANI_LIST.SUCCESS_IN });
    }

    public playSuccessLoop(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.SUCCESS_LOOP });
    }

    public playSuccessDisable(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.SUCCESS_DISABLE });
    }

    public playFailIn(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.FAIL_IN });
    }

    public playFailLoop(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.FAIL_LOOP });
    }

    public playFailDisable(): void {
        if (!this._initialized) return;
        this._bookAnimCtrl?.playAni({ aniState: ANI_LIST.FAIL_DISABLE });
    }

    private btnClickHandler = (): void => {
        this.node.emit(ChallengeEventStatus.SELECT_BOOK, { bookId: this.bookId });
        //console.log('Book按鈕被點擊了', this.bookId);
    }

}


