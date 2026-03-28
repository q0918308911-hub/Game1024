import { _decorator, Component, Node, Button, Label, EventTouch } from 'cc';

import { AudioManager, SOUND_TYPE } from 'db://assets/Scripts/ModuleEntry';
import { BasicGameBoardUI } from '../BasicGameBoardUI';
import { GameState } from '../../GameStateConfigDef/GameStateConfigDef';
import { IGameStepDelayTimeList } from '../../BasicStepDelayTimeList/IGameStepDelayTimeList';
import { AsyncScope } from '../../AsyncScope/AsyncScope';
//import { AudioManager, SOUND_TYPE } from 'db://assets/Scripts/Audio/AudioManager';
const SIGNAL_KEY = 'FG_UI_CTRL_SIGNAL';
const { ccclass, property } = _decorator;
/*
const FG_BOARD_ANI_MAP = {
    FG_In: 'toFG_In',
    FG_Out: 'toFG_Out',
    FG_Loop: 'toFG_Loop',
    BACK_NG_In: 'toNG_In',
    BACK_NG_Out: 'toNG_Out',
    BACK_NG_Loop: 'toNG_Loop'
}
*/
/**
 *  Key 是「流程選擇器」
    Context 是「跨流程記憶」
    Payload 是「策略附加資訊」
    泛型只負責「邊界，不負責行為」
 */
//export type keyMapBase = Record<string, any>;
//--這是給子類別去定義要去抽取流程上下文行為需要的參數
export type BoardTransitionContext = unknown;

export type BoardKey = string | number;
//--Extract
/**
 * https://ithelp.ithome.com.tw/articles/10270929
 * https://blog.csdn.net/gtLBTNq9mr3/article/details/132398321
 * https://blog.csdn.net/weixin_42938619/article/details/130144095
 * https://juejin.cn/post/7202153645441892407
 * 
 */

export type BoardKeyOf<T> = Extract<keyof T, BoardKey>;
//---定義轉場規格介面(TPayload 是給子類別去定義的額外參數--隨便你愛傳啥都行)
export interface BoardTransitionSpec<K extends BoardKey, TPayload = unknown> {
    timeKey: K;
    aniKey: K;
    payload?: TPayload;
    /**
     * 額外攜帶的任意資料：
     * - object
     * - Map
     * - class instance
     * - function
     * - 任何我沒有預期到的東西
     */
}


@ccclass('FGBoardFoundation')
export abstract class FGBoardFoundation<TKeyMap extends Record<BoardKey, any>, TContext = BoardTransitionContext> extends BasicGameBoardUI {

    @property({ type: Node, visible: true, displayName: '透明按鈕', tooltip: "設定此物件的按鈕物件" })
    protected _btnNode: Node | null = null;

    //--PS美術喜歡做雙層的文字效果-所以要塞進來
    @property({ type: Node, visible: true, displayName: '顯示次數LabelNode', tooltip: "設定此物件的動畫物件" })
    protected _labelTimesNode: Node | null = null;

    @property({ type: Node, visible: true, displayName: '顯示次數LabelAddNode', tooltip: "刷光文字??!!" })
    protected _labelAddTimesNode: Node | null = null;

    @property({ type: Node, visible: true, displayName: '顯示分數LabelNode', tooltip: "設定此物件的動畫物件" })
    protected _labelScoreNode: Node | null = null;

    @property({ type: Node, visible: true, displayName: '顯示分數LabelAddNode', tooltip: "刷光文字??!!" })
    protected _labelAddScoreNode: Node | null = null;

    private _labelPlayTimes: Label | null = null;
    private _labelFXTPlayTimes: Label | null = null;
    private _labelPlayScore: Label | null = null;
    private _labelFXPlayScore: Label | null = null;
    private _isGoIn: boolean = false;
    protected _triggerGameState: GameState | null = null;
    protected _resolveDelayOnCancel?: () => void;//延遲動畫取消函式(for 延遲中斷時,阻斷tweenPromise resolve)
    protected _isClosing = false;
    protected _closingPromise: Promise<void> | null = null;
    protected _closeRequested = false;
    private _closeOncePromise: Promise<void> | null = null;
    protected _playBoardOutCallBack: () => void | null = null;//--20250917新增(觸發退場的時候呼叫的callback)
    protected _isInLoop = false;
    private _loopOncePromise: Promise<void> | null = null;
    protected _async: AsyncScope;
    protected _loopTimeForState: number = 0;

    //--這裡只是為了要將 keyMap 的 key 轉成對應的 timeBaseKey 跟 aniKeyBase


    protected _timeBaseKeyMap!: Partial<{
        [K in BoardKeyOf<TKeyMap>]: Partial<Record<GameState, number>>;
    }>;

    //--指令集會映射到這裡取出對應的動畫key(可選-不用全列出來)
    protected _aniKeyBaseMap!: Partial<{
        [K in BoardKeyOf<TKeyMap>]: Partial<Record<GameState, string>>;
    }>;

    constructor() {
        super();
        /**
         *  const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(t);
                 this._delayTweenCancel = delay.cancel;
                 await delay.promise; // 等待延遲完成
                 this._delayTweenCancel = null; // 清掉
         */
    }


    public override init(): void {

        this.onInit();
        this._iAnimationController?.init();
        this._labelPlayTimes = this._labelTimesNode.getComponent(Label);
        this._labelFXTPlayTimes = this._labelAddTimesNode.getComponent(Label);
        this._labelPlayScore = this._labelScoreNode.getComponent(Label);
        this._labelFXPlayScore = this._labelAddScoreNode.getComponent(Label);
        this.setFGPlayTimes(0);
        this.setFGPlayScore(0);
        this.goBackToDefault();
        this.node.active = false;
        this._async = AsyncScope.getInstance();
    }

    protected onInit(): void {
        // 預設什麼都不做
    }

    //=======顯示 獲得FG次數 or 得分============================
    public override setResultLabel(value: number): void {

        if (this._triggerGameState === GameState.FREE_GAME) {
            this.setFGPlayTimes(value);//--進入FG
        } else if (this._triggerGameState === GameState.NORMAL) {
            this.setFGPlayScore(value);//--離開FG
        }
    }


    protected setFGPlayTimes(value: number): void {

        if (this._labelPlayTimes) this._labelPlayTimes.string = value.numberComma();
        if (this._labelFXTPlayTimes) this._labelFXTPlayTimes.string = value.numberComma();
    }

    protected setFGPlayScore(value: number): void {
        if (this._labelPlayScore) this._labelPlayScore.string = value.numberComma();
        if (this._labelFXPlayScore) this._labelFXPlayScore.string = value.numberComma();
    }

    //===============開啟前寫入遊戲狀態/或是你可以直接註冊進去監聽遊戲狀態改變==================================
    public setBoardMode(state: GameState): void {
        this._triggerGameState = state;
    }

    //================get time info data=======================================================================
    //--子類別可以覆寫此方法改變行為
    protected getTimeInfo<K extends BoardKeyOf<TKeyMap>>(key: K): number | null {

        const state = this._triggerGameState;
        if (state == null) return null;
        return this._timeBaseKeyMap[key]?.[state] ?? null;
    }

    //================get aniKey===================================================================
    //--子類別可以覆寫此方法改變行為
    protected getBoardAniKey<K extends BoardKeyOf<TKeyMap>>(key: K): string | null {

        const state = this._triggerGameState;
        if (state == null) return null;

        return this._aniKeyBaseMap[key]?.[state] ?? null;
        /*
        const playKey = this._triggerGameState === GameState.FREE_GAME
            ? FG_BOARD_ANI_MAP.FG_Out
            : FG_BOARD_ANI_MAP.BACK_NG_Out;
        return playKey;
        */
    }

    //---預設行為,專門服務給click事件使用,子類別可覆寫此方法改變行為
    protected resolveClickLoopKey(): BoardKeyOf<TKeyMap> {
        // 預設行為
        return Object.keys(this._aniKeyBaseMap)[0] as BoardKeyOf<TKeyMap>;
    }
    //-----子類別實作(PS-ctx是給子類別去判斷如果連續取資料出來時該怎麼做)
    protected abstract resolveOpenSpec(
        ctx?: TContext
    ): BoardTransitionSpec<BoardKeyOf<TKeyMap>>;

    protected abstract resolveCloseSpec(
        ctx?: TContext
    ): BoardTransitionSpec<BoardKeyOf<TKeyMap>>;

    /*
    隨便你要怎麼搞子類別去實作
    protected override resolveCloseSpec(ctx?: FG1016Context) {

        if (ctx?.reason === 'click') {
            return { timeKey: 'quickClose', aniKey: 'fg_quick_out' };
        }

        if (ctx?.isInterrupted) {
            return { timeKey: 'forceClose', aniKey: 'fg_force_out' };
        }

        return { timeKey: 'close', aniKey: 'fg_out' };
    }
    */

    //====process sound ==========================================================
    protected processOpenBoardSound(playKey: string): void {
        /*
        
        let playSoundKey;
        if (playKey == FG_BOARD_ANI_MAP.FG_In) {
            playSoundKey = SoundList.fgEnterPage_In;
            this._loopTimeForState = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList).get(cfg => cfg.fg?.duringBoardIn);
            this.playVoiceIn();
        } else {
            playSoundKey = SoundList.fgExitPage_In;
            this._loopTimeForState = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList).get(cfg => cfg.fg?.duringBoardOut);
            this.playVoiceOut();
        }

        AudioManager.instance.playSound(playSoundKey, SOUND_TYPE.NORMAL, AudioSourceList.RsAs);
        */
    }

    protected afterCancelStopSound(): void {
        //AudioManager.instance.stopSound([AudioSourceList.RsAs]);
    }

    protected playVoiceOut(): void {


    }

    protected playVoiceIn(): void {

    }


    //==================core process====================================================================

    public async closeFGUIBoard(): Promise<void> {
        //--spine動畫0.6s
        //const dt = this.getTimeInfo<k>(timeInfo) as number;
        this._closeRequested = true;
        if (this._isClosing) return this._closingPromise!;
        this.closeBtnActive();
        this.forceCancelLoopDelay();

        const ctx = {
            reason: this._isInLoop ? 'click' : 'auto',
            gameState: this._triggerGameState,
            isInterrupted: this._closeRequested,
        } as TContext;
        /*
        const playKey = this._triggerGameState === GameState.FREE_GAME
            ? FG_BOARD_ANI_MAP.FG_Out
            : FG_BOARD_ANI_MAP.BACK_NG_Out;
        */
        const spec = this.resolveCloseSpec(ctx);
        const playKey = this.getBoardAniKey(spec.aniKey)!;
        const dt = this.getTimeInfo(spec.timeKey);

        this._isClosing = true;

        if (this._playBoardOutCallBack) {
            try {
                this._playBoardOutCallBack();
            } catch (err) {
                //console.warn('FGBoardUI1016 _playBoardOutCallBack error', err);
                //GameUtilsTools.debugLog(DEBUG_LOG_TITLE, 'playBoardOutCallBack', { err }, 'warn');
            }
        }

        const single = this._async.createAbortScope(SIGNAL_KEY);
        const callbackWrapper = (value: any) => {
            this.cancelBoardAni(true);
        }

        this._closingPromise = this.playBoardOut(playKey, dt).finally(() => {
            this.node.active = false;
            this._isClosing = false;
            this._closingPromise = null;
            //this._closeRequested = false; 
        });

        this._async.registerCancelablePromise(
            SIGNAL_KEY,
            this._closingPromise,
            callbackWrapper,
            single,
            SIGNAL_KEY
        );

        return this._closingPromise;
    }




    public async openFGUIBoard(value: number = 0, boardOutCallBack?: () => void, identify?: any): Promise<void> {
        //--spine動畫0.75s
        //const dt = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList).get(cfg => cfg.fg?.openBoard);
        //const dt = this.getTimeInfo<k>(timeInfo) as number;
        const ctx = {
            value,
            reason: 'open',
            gameState: this._triggerGameState,
            isFastMode: false,
        } as TContext;

        const spec = this.resolveOpenSpec(ctx);
        //const { timeKey, aniKey, payload } = this.resolveOpenSpec(identify);//--子類別去實作
        const dt = this.getTimeInfo(spec.timeKey);
        const playKey = this.getBoardAniKey(spec.aniKey);
        // 重置關閉狀態
        if (boardOutCallBack) this._playBoardOutCallBack = boardOutCallBack;
        this._closeRequested = false;
        this._closeOncePromise = null;
        this._loopOncePromise = null;
        this._isGoIn = true;
        this.node.active = true;
        /*
        const playKey = this._triggerGameState === GameState.FREE_GAME
            ? FG_BOARD_ANI_MAP.FG_In
            : FG_BOARD_ANI_MAP.BACK_NG_In;
        */
        //const playKey = this.getBoardAniKey<m>(aniInfo)!;
        this.processOpenBoardSound(playKey);

        const signal = this._async.createAbortScope(SIGNAL_KEY);
        const playPromise = this.playBoardIn(value, { aniState: playKey }, dt);
        const callbackWrapper = (value: any) => {
            this.cancelBoardAni(false);
            //AudioManager.instance.stopSound([AudioSourceList.RsAs]);
            this.afterCancelStopSound();
            //evtCallBack();
        }
        //await this.playBoardIn(value, { aniState: playKey },dt);
        await this._async.registerCancelablePromise(
            SIGNAL_KEY,
            playPromise,
            callbackWrapper,
            signal,
            SIGNAL_KEY
        )
        //--結束時關閉
        //AudioManager.instance.stopSound([AudioSourceList.RsAs]);

        this._isGoIn = false;

        if (this._closeRequested || this._isClosing) {
            await this.requestCloseOnce();
            return;
        }

        // 8進 Loop（Loop key 通常與 open key 不同 → 再走一次 resolver）
        const loopSpec = this.resolveOpenSpec({
            ...ctx,
            reason: 'loop'
        } as TContext);
        //const { timeKey, aniKey } = this.resolveOpenSpec(identify);//--子類別去實作
        const playLoopKey = this.getBoardAniKey(loopSpec.aniKey)!;
        /*
        const playLoopKey = this._triggerGameState === GameState.FREE_GAME
            ? FG_BOARD_ANI_MAP.FG_Loop
            : FG_BOARD_ANI_MAP.BACK_NG_Loop;
        */
        this._loopTimeForState = this.getTimeInfo(loopSpec.timeKey) as number;
        // 正常路徑：切入 Loop、等計時、然後一次性關閉
        await this.ensureLoopThenClose(playLoopKey, this._loopTimeForState);

    }




    private ensureLoopThenClose(playLoopKey: string, dt?: number): Promise<void> {

        if (this._loopOncePromise) return this._loopOncePromise;
        // 若有要求關閉或正在關閉 → 不再啟 Loop，直接加入那次關閉
        if (this._closeRequested || this._isClosing) return this.requestCloseOnce();

        this._loopOncePromise = (async () => {
            // 1取消當前(In)動畫，切 Loop（非阻塞播放）
            this.cancelBoardAni(false);// 中斷 In
            this._isGoIn = false;

            // 中斷後到啟動前<再檢查一次>是否有人要求關閉
            if (this._closeRequested || this._isClosing) {
                await this.requestCloseOnce();
                return;
            }
            this._isInLoop = true;
            // 啟動 Loop，不 await
            //const loopSingle=this._async.createAbortScope(SIGNAL_KEY);
            //const callbackWrapper=(value:any)=>{

            //}
            const loopP = this.setPlayPromise({ aniState: playLoopKey }, dt);
            //const loopP = this.setPlayPromise({ aniState: playLoopKey });
            this.openBtnActive();

            //void loopP.catch((err) => this.logLoopPlayReject(err, playLoopKey));
            // 啟動延遲前<再檢查一次>：若已要求關閉，就不要開延遲
            if (this._closeRequested || this._isClosing) {
                await this.requestCloseOnce();
                return;
            }

            await this.setLoopTimeStep();// 2 等待可強制取消的計時
            await this.requestCloseOnce();// 3 計時完成 → 一次性關閉
        })().finally(() => {

            this._isInLoop = false;
            this._loopOncePromise = null;
        });

        return this._loopOncePromise;
    }

    private requestCloseOnce(): Promise<void> {

        this._closeRequested = true;
        if (this._closeOncePromise) return this._closeOncePromise;
        this._closeOncePromise = this.closeFGUIBoard().finally(() => {
            this._closeRequested = false;
            this._closeOncePromise = null;
        });
        return this._closeOncePromise;
    }

    protected forceCancelLoopDelay(): void {

        this._resolveDelayOnCancel?.();
        this._resolveDelayOnCancel = undefined;
    }


    private async setLoopTimeStep(): Promise<void> {
        //--spine動畫1.5s
        //const dt = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList).get(cfg => cfg.fg?.duringBoard);

        const signal = this._async.createAbortScope(SIGNAL_KEY);
        const delay = this._async.waitSecondsCancelable(
            this._loopTimeForState,
            signal,
            SIGNAL_KEY
        )
        this._resolveDelayOnCancel = () => {
            this._async.cancelByLabel('waitSecondsCancelable');
        }
        //const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(dt);
        //this._resolveDelayOnCancel = delay.forceCancelAndResolve;
        try {
            //await delay.promise;// 等待延遲完成
            await delay;// 等待延遲完成
        } finally {
            this._resolveDelayOnCancel = undefined;// 清掉
        }
    }



    private async onClickHandler(event: EventTouch): Promise<void> {
        //--判斷狀態讓面本呈現正確的樣貌
        //console.log('FGBoardUI1016 onClickHandler', this._isGoIn, this._isClosing);
        event.preventSwallow = true;
        this.forceCancelLoopDelay();
        if (this._isGoIn) {
            // first click(stay--> In）：強切 Loop 並等待計時結束後再關閉
            /*
            const playLoopKey = this._triggerGameState === GameState.FREE_GAME
                ? FG_BOARD_ANI_MAP.FG_Loop
                : FG_BOARD_ANI_MAP.BACK_NG_Loop;
            */
            const key = this.resolveClickLoopKey();//--繼承的子類別自己可以愛怎麼搞就怎麼搞
            const playLoopKey = this.getBoardAniKey(key)!;

            await this.ensureLoopThenClose(playLoopKey, this._loopTimeForState);

        } else if (this._isInLoop) {
            // second click（stay--> Loop )：直接關閉（一次性），等待完成
            await this.requestCloseOnce();
        } else {
            // 其他情境（已在關閉中/已關閉）：一起等同一個關閉
            await this.requestCloseOnce();
        }

    }


    //Utility.addEventHandlerToButton(this._btnBg.node, this, 'onClickHandler');
    protected openBtnActive(): void {
        if (!this._btnNode) return;
        this._btnNode.active = true;
        this._btnNode.off(Node.EventType.TOUCH_END, this.onClickHandler, this);
        this._btnNode.on(Node.EventType.TOUCH_END, this.onClickHandler, this, true);

    }

    protected closeBtnActive(): void {
        if (!this._btnNode) return;
        this._btnNode.active = false;
        this._btnNode.off(Node.EventType.TOUCH_END, this.onClickHandler, this);
    }




}


