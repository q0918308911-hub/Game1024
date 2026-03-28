import { _decorator, Button, Component, Node } from 'cc';
import { AnimationController, AnimationStateType } from '../../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';
import { ChallengeEventStatus } from '../../../DefinitionGameData1024/GameEventTypeDef1024';
const { ccclass, property } = _decorator;
const ANI_LIST = {
    TO_BOOKS: 'to_Books',//--info進入books轉場
    BOOKS_DEFAULT: 'Books_default',//--books待機
    BACK_TO_BOARD: 'to_Info'//--從books回到info轉場
}

@ccclass('GambleBoardCtrl')
export class GambleBoardCtrl extends Component {

    @property({ type: AnimationController, visible: true, displayName: '比倍面板控制', tooltip: 'GambleBoardAniCtrl' })
    private _boardAnimCtrl: AnimationController = null;

    @property({ type: Button, visible: true, displayName: '進行挑戰', tooltip: '進行挑戰用按鈕' })
    private _challengeBtn: Button = null;

    @property({ type: Button, visible: true, displayName: '進入FG', tooltip: '放棄挑戰直接進FG用按鈕' })
    private _enterFGBtn: Button = null;


    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;

    protected onLoad(): void {

        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        if (this._boardAnimCtrl && this._boardAnimCtrl.isLoaded) {
            this.init();
        } else {
            this._boardAnimCtrl?.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
            });
        }

    }
    /**
     * 提供給 Manager 呼叫，確保三個物件都 ready
     */
    public async waitForReady(): Promise<void> {

        if (this._initialized) return;

        // 如果已經載入完成，直接 init 並回傳
        if (this._boardAnimCtrl && this._boardAnimCtrl.isLoaded) {
            this.init();
            return;
        }

        // 否則，開啟一個 Promise 等待事件
        return new Promise<void>((resolve) => {
            this._boardAnimCtrl.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
                resolve();
            });
        });
    }

    public reset(): void {
        this._boardAnimCtrl?.playAni(AnimationStateType.Default);
    }

    public init(): void {
        if (!this._dirtyFlag) return;
        this.reset();
        this._initialized = true;

    }

    public openBoard(): void {

        const targetInfo = this._boardAnimCtrl?.peakAniDataInfo(AnimationStateType.Default);
        const currentPlayId = this._boardAnimCtrl?.currentPlayName;
        if (targetInfo.targetName !== currentPlayId) {
            this._boardAnimCtrl?.playAni(AnimationStateType.Default);
        }

        this.setBtnActive(true);
    }

    public closeBoard(): void {
        //this._boardAnimCtrl?.playAni(AnimationStateType.Default);
        this._boardAnimCtrl?.stopAni();
        this.setBtnActive(false);

    }


    public async goToBooks(): Promise<void> {

        this.setBtnActive(false);
        await this._boardAnimCtrl?.playAniInPromise({ aniState: ANI_LIST.TO_BOOKS });
        this._boardAnimCtrl?.playAni({ aniState: ANI_LIST.BOOKS_DEFAULT });
    }

    public async backToBoard(): Promise<void> {

        await this._boardAnimCtrl?.playAniInPromise({ aniState: ANI_LIST.BACK_TO_BOARD });
        this._boardAnimCtrl?.playAni(AnimationStateType.Default);
        this.setBtnActive(true);
    }

    private setBtnActive(flag: boolean): void {

        if (flag) {
            if (!this._challengeBtn.node.hasEventListener(Button.EventType.CLICK)) {
                this._challengeBtn.node.on(Button.EventType.CLICK, this.challengeBtnClickHandler);
            }

            if (!this._enterFGBtn.node.hasEventListener(Button.EventType.CLICK)) {
                this._enterFGBtn.node.on(Button.EventType.CLICK, this.enterFGBtnClickHandler);
            }

        } else {
            if (this._challengeBtn.node.hasEventListener(Button.EventType.CLICK)) {
                this._challengeBtn.node.off(Button.EventType.CLICK, this.challengeBtnClickHandler);
            }

            if (this._enterFGBtn.node.hasEventListener(Button.EventType.CLICK)) {
                this._enterFGBtn.node.off(Button.EventType.CLICK, this.enterFGBtnClickHandler);
            }
        }

        this._challengeBtn.interactable = flag;
        this._enterFGBtn.interactable = flag;
    }

    private challengeBtnClickHandler = (): void => {
        console.log('挑戰按鈕被點擊了');
        //this.goToBooks();
        this.node.emit(ChallengeEventStatus.ENTER_CHALLENGE, ChallengeEventStatus.ENTER_CHALLENGE);
    }

    private enterFGBtnClickHandler = (): void => {
        console.log('進入FG按鈕被點擊了');
        //--這邊會關閉整個面板
        //this.backToBoard();
        this.node.emit(ChallengeEventStatus.ENTER_FG, ChallengeEventStatus.ENTER_FG);
    }

}


