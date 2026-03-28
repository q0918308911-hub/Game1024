import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
import { GambleBoardCtrl } from './Board/GambleBoardCtrl';
import { GambleBtnsCtrl } from './Btns/GambleBtnsCtrl';
import { GambleBooksCtrl } from './Book/GambleBooksCtrl';
import { ChallengeEventStatus, GameEventType1024 } from '../../DefinitionGameData1024/GameEventTypeDef1024';
import { GameUtilsTools, NotifyCation, NotifySubject } from '../../ReferencePath';
import { SymbolOpacityEffect } from '../ShowAniProcessController/SymbolOpacity/SymbolOpacityEffect';
import { DefinitionGameConfigData } from '../../DefinitionGameData1024/GameConfigInstance1024';

const {
    MAXIMUM_FG_TIMES//22--最大挑戰次數
} = DefinitionGameConfigData

const { ccclass, property } = _decorator;

@ccclass('GambleCtrl')
export class GambleCtrl extends Component {

    @property({ type: GambleBoardCtrl, visible: true, displayName: '挑戰遊戲控制器', tooltip: '挑戰遊戲控制器' })
    private _gambleBoardCtrl: GambleBoardCtrl = null;

    @property({ type: GambleBtnsCtrl, visible: true, displayName: '挑戰遊戲左側控制器', tooltip: '挑戰遊戲左側控制器' })
    private _gambleBtnsCtrl: GambleBtnsCtrl = null;

    @property({ type: GambleBooksCtrl, visible: true, displayName: '經書控制器', tooltip: '經書控制器' })
    private _gambleBooksCtrl: GambleBooksCtrl = null;

    @property({ type: SymbolOpacityEffect, visible: true, displayName: '挑戰遊戲UI淡入淡出效果', tooltip: '挑戰遊戲UI淡入淡出效果' })
    private _opacityEffect: SymbolOpacityEffect = null;

    private _dirtyFlag: boolean = false;
    private _selectBookId: number = 0;//--紀錄選擇的經書ID
    //private readonly MAX_FG_TIMES: number = 22;//--最大挑戰次數

    protected async onLoad(): Promise<void> {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        // 等待所有子控制器準備完成
        await this.waitAllCtrlReady();
        this.init();

    }

    private init(): void {

        const targetOpacity = this.node.getComponent(UIOpacity);
        if (targetOpacity) {
            targetOpacity.opacity = 0;
        }
        this.node.active = false;
        //--do something
        //this._opacityEffect.
        //this._opacityEffect.targetOpacity.opacity = 0;
        //this.node.active = false;
        //--以下為測試--
        //this.openGambleUI();
        //this.setFGTimes(18);
    }

    private async waitAllCtrlReady(): Promise<void> {

        const promises: Promise<void>[] = [];
        promises.push(this._gambleBoardCtrl.waitForReady());
        promises.push(this._gambleBtnsCtrl.waitForReady());
        promises.push(this._gambleBooksCtrl.waitForReady());
        await Promise.all(promises);
    }

    public reset(): void {
        this._gambleBtnsCtrl.reset();
        this._selectBookId = 0;
    }

    public openGambleUI(): void {

        //--進入初始挑戰遊戲面板
        this._gambleBoardCtrl.openBoard();
        this.initEvtListeners();
    }

    public closeGambleUI(): void {
        //--關閉挑戰遊戲
        this._gambleBoardCtrl.closeBoard();
        this._gambleBooksCtrl.stopAllAndCloseBookUI();
        this.removeEvtListeners();
        this.node.active = false;
    }

    public async goOpenGambleUI(fgTimes: number): Promise<void> {

        this.openGambleUI();
        this.setFGTimes(fgTimes);
        //await GameUtilsTools.DeferByTweenPromise(3);
        this._opacityEffect.openContainerTween(1.5);
    }

    public async backToNgAndCloseGambleUI(): Promise<void> {
        await this._opacityEffect.closeContainerTweenPromise(1.5);
        this.closeGambleUI();
    }

    //---設定左側按鈕來顯示FG當前次數
    public setFGTimes(value: number): void {
        this._gambleBtnsCtrl.openCurrentLevelBtn(value);
    }

    public setALLFgTimesDefault(): void {
        this._gambleBtnsCtrl.setALLDefault();
    }


    /** 
     * @param fgTimes 大於0代表成功(server會送入賭贏的次數)
     * @param bookId 經書ID
     */
    public async setGambleResult(fgTimes: number, bookId?: number): Promise<void> {

        const isSuccess = fgTimes > 0;
        const book = bookId || this._selectBookId;
        await this._gambleBooksCtrl.showResult(isSuccess, book);
        let evtData = null;
        if (isSuccess) {

            this.setFGTimes(fgTimes);
            if (fgTimes < MAXIMUM_FG_TIMES) {
                //--回到上一層，繼續挑戰(如果到緊繃的22次之後就退場整個GUI) 
                await GameUtilsTools.DeferByTweenPromise(2);
                this._gambleBoardCtrl.backToBoard();
                //--把book的動畫停止
            } else {
                //--已達最大挑戰次數，直接進入FG(接上雲+卷軸)
                evtData = {
                    eventType: GameEventType1024.CHALLENGE_EVENT,
                    eventData: {
                        status: ChallengeEventStatus.ENTER_FG
                    }
                };

            }
        } else {
            //--賭輸-左側反灰+退出挑戰UI介面(淡入淡出)
            this.setALLFgTimesDefault();
            await GameUtilsTools.DeferByTweenPromise(2);
            evtData = {
                eventType: GameEventType1024.CHALLENGE_EVENT,
                eventData: {
                    status: ChallengeEventStatus.BACK_TO_NG
                }
            };
        }

        if (evtData) {
            NotifyCation.getInstance().emitSync(
                NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                evtData.eventType,
                evtData
            );

        }

    }

    private onBoardBtnClick = (evt): void => {
        console.log('挑戰遊戲面板的按鈕被點擊了', evt);
        if (evt == ChallengeEventStatus.ENTER_CHALLENGE) {
            // 進入挑戰，顯示經書選擇界面
            this._gambleBooksCtrl.openSelectBookUI();
            this._gambleBoardCtrl.goToBooks();
        } else {
            //--放棄挑戰，直接進入FG
            console.log('直接進入FG');
            const evtData = {
                eventType: GameEventType1024.CHALLENGE_EVENT,
                eventData: {
                    status: ChallengeEventStatus.ENTER_FG
                }
            };

            NotifyCation.getInstance().emitSync(
                NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                evtData.eventType,
                evtData
            );
        }
    }

    private _testCount = 0;
    private async testShowResult(): Promise<void> {
        await GameUtilsTools.DeferByTweenPromise(2);
        let resultTest = 0;
        if (this._testCount == 0) {
            this._testCount++;
            resultTest = 18;
        } else if (this._testCount == 1) {
            this._testCount++;
            resultTest = 18;
        } else if (this._testCount == 2) {
            this._testCount++;
            resultTest = 22;
        }

        this.setGambleResult(resultTest);

    }

    private onBookCtrlEvent = async (evt): Promise<void> => {
        //--call server
        console.log('GambleCtrl收到BookCtrl事件', evt);

        const selectedBookId = evt.bookId;
        this._selectBookId = selectedBookId;
        const evtData = {
            eventType: GameEventType1024.CHALLENGE_EVENT,
            eventData: {
                status: ChallengeEventStatus.SELECT_BOOK,
                value: selectedBookId
            }
        };
        NotifyCation.getInstance().emitSync(
            NotifySubject.GAME_ANI_PROCESS_SUBJECT,
            evtData.eventType,
            evtData
        );
        //this.testShowResult();
    }

    private initEvtListeners(): void {
        this._gambleBoardCtrl.node.on(ChallengeEventStatus.ENTER_CHALLENGE, this.onBoardBtnClick);
        this._gambleBoardCtrl.node.on(ChallengeEventStatus.ENTER_FG, this.onBoardBtnClick);
        this._gambleBooksCtrl.node.on(ChallengeEventStatus.SELECT_BOOK, this.onBookCtrlEvent);
    }

    private removeEvtListeners(): void {
        this._gambleBoardCtrl.node.off(ChallengeEventStatus.ENTER_CHALLENGE, this.onBoardBtnClick);
        this._gambleBoardCtrl.node.off(ChallengeEventStatus.ENTER_FG, this.onBoardBtnClick);
        this._gambleBooksCtrl.node.off(ChallengeEventStatus.SELECT_BOOK, this.onBookCtrlEvent);
    }




}


