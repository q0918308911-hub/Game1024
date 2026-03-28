import { _decorator, } from 'cc';
import { BasicGameBoardUI } from '../../../MyUtils/BasicFGUIBoard/BasicGameBoardUI';
import { GameUtilsTools } from '../../../MyUtils/GameUtilsTool';
import { AnimationStateType } from '../../../ReferencePath';
import { I4WinAnimationStateType, IAniStateType, WinType } from '../Definitions/ShowWinDef';

const { ccclass, property } = _decorator;

@ccclass('BasicAllJpUIBoard')
export class BasicAllJpUIBoard extends BasicGameBoardUI {

    //延遲動畫取消函式(for 延遲中斷時,阻斷tweenPromise resolve)
    protected _resolveDelayOnCancel?: () => void;
    protected _isClosing = false;
    protected _closeRequested = false;
    protected _closeOncePromise: Promise<void> | null = null;
    protected _closingPromise: Promise<void> | null = null;

    protected _isInLoop = false;
    //--標記是否進入loop流程-20251231(只是不甩節奏表再改回原本的方式)
    protected _isInLoopStage = false;
    protected _loopOncePromise: Promise<void> | null = null;
    protected _isGoIn: boolean = false;
    protected _firstClickAborted: boolean = false;
    protected _jackpotLoopDuration: number = 0;//--loop time
    protected _fastLoopDuration: number = 0;//--快速loop時間

    //--退場是0.5s
    protected _jackpotInterruptEndTime: number = 0;//--阻斷後移動到的末端時間點
    //--新增
    protected _current4WinType: WinType = null;
    //--新增
    protected _current4WinAniStateType: I4WinAnimationStateType = null;
    protected _currentAniStateTypeInfo: IAniStateType = null;

    //--新增
    set current4WinAniStateType(value: I4WinAnimationStateType) {
        this._current4WinAniStateType = value;

    }
    //--新增
    set current4WinType(value: WinType) {
        this._current4WinType = value;
        this._currentAniStateTypeInfo = this._current4WinAniStateType[this._current4WinType];
    }

    get isGoIn(): boolean {
        return this._isGoIn;
    }

    get isInLoop(): boolean {
        return this._isInLoop;
    }

    get isInLoopStage(): boolean {
        return this._isInLoopStage;
    }

    get isClosing(): boolean {
        return this._isClosing;
    }

    get closeRequested(): boolean {
        return this._closeRequested;
    }

    set fastLoopDuration(value: number) {
        this._fastLoopDuration = value;
    }

    get fastLoopDuration(): number {
        return this._fastLoopDuration;
    }

    set jackpotLoopDuration(value: number) {
        this._jackpotLoopDuration = value;
    }

    get jackpotLoopDuration(): number {
        return this._jackpotLoopDuration;
    }

    set jackpotInterruptEndTime(value: number) {
        this._jackpotInterruptEndTime = value;
    }

    get jackpotInterruptEndTime(): number {
        return this._jackpotInterruptEndTime;
    }


    protected getCurrentAniStatePlayKey(value: AnimationStateType): string {

        if (value == AnimationStateType.In) {
            return this._currentAniStateTypeInfo.IN;
        } else if (value == AnimationStateType.Loop) {
            return this._currentAniStateTypeInfo.LOOP;
        } else if (value == AnimationStateType.Out) {
            return this._currentAniStateTypeInfo.OUT;
        }
    }

    public async openUIBoard(value?: number): Promise<void> {
        // 重置關閉狀態
        this._closeRequested = false;
        this._closeOncePromise = null;
        this._loopOncePromise = null;
        this._isGoIn = true;
        this._isInLoop = false;
        this._isInLoopStage = false;
        this._firstClickAborted = false;
        this.node.active = true;
        //this.openBtnActive();
        //const playKey = AnimationStateType.In;
        const playKey = this.getCurrentAniStatePlayKey(AnimationStateType.In);
        await this.playBoardIn(value, { aniState: playKey });
        this._isGoIn = false;

        if (this._closeRequested || this._isClosing) {
            await this.requestCloseOnce();
            return;
        }
        //const playLoopKey = AnimationStateType.Loop;
        const playLoopKey = this.getCurrentAniStatePlayKey(AnimationStateType.Loop);
        // 正常進入 loop，但不自動關閉
        this._isInLoop = true;
        const loopP = this.setPlayPromise({ aniState: playLoopKey });
        void loopP.catch((err) => this.logLoopPlayReject(err, playLoopKey));
        // 正常路徑：切入 Loop、等計時、然後一次性關閉
    }

    /**
    * 20251231-NEW-等待進入Loop階段
    * @param loopDurationTime loop time
    */
    public async waitLoopDuration(loopDurationTime: number): Promise<void> {

        this._isInLoopStage = true;

        const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(loopDurationTime);
        this._resolveDelayOnCancel = delay.forceCancelAndResolve;

        try {
            await delay.promise;
        } finally {
            this._resolveDelayOnCancel = undefined;
            // Loop end
            this._isInLoopStage = false;
        }
    }

    public async goLoopAndClose(): Promise<void> {

        /**
        *---20251231-直接給ensureLoopThenClose處理
            不然這邊會關掉又在ensureLoopThenClose播放一次 
        */
        // loop → out
        const playLoopKey = this.getCurrentAniStatePlayKey(AnimationStateType.Loop);
        await this.ensureLoopThenClose(playLoopKey);
    }

    //--old click process
    public async onClickDuringJpAni(): Promise<void> {

        this.forceCancelLoopDelay(); // 先取消舊的計時（避免重疊）
        if (this._isGoIn || this._isInLoop) {
            // In 階段點擊 → 強切 loop，然後等計時 → out
            // Loop 階段點擊 → 重新進行 loop 計時 → out
            const playLoopKey = this.getCurrentAniStatePlayKey(AnimationStateType.Loop);
            await this.ensureLoopThenClose(playLoopKey);

        } else {
            // 已經在 out 中或已關閉 → 等待共用的 close
            await this.requestCloseOnce();
        }
    }

    //--new click process
    public async onClickForceOutJpAni(): Promise<void> {
        // === 先取消舊的 loop 延遲（若有 setLoopTimeStep 正在等）===
        this.forceCancelLoopDelay();

        // === 在 In click ===
        if (this._isGoIn && !this._isInLoopStage) {
            //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case1: In → Loop → Out');
            this._firstClickAborted = false;
            this.cancelBoardAni(false);
            this._isGoIn = false;
            this._isInLoop = true;

            const playLoopKey = this.getCurrentAniStatePlayKey(AnimationStateType.Loop);
            const loopP = this.setPlayPromise({ aniState: playLoopKey });
            void loopP.catch((err) => this.logLoopPlayReject(err, playLoopKey));

            this._isInLoopStage = true;
            const loopDelay = GameUtilsTools.DeferByTweenPromiseWithCancel(this._jackpotLoopDuration);
            this._resolveDelayOnCancel = loopDelay.forceCancelAndResolve;

            try {
                await loopDelay.promise;
            } finally {
                this._resolveDelayOnCancel = undefined;
                this._isInLoopStage = false;
            }

            if (this._firstClickAborted) {
                //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case1 aborted');
                return;
            }

            this.cancelBoardAni(false);
            await this.requestCloseOnce();
            return;
        }

        // === 情况 2: 跑分期間click ===
        if (this._isInLoop && !this._isInLoopStage) {
            //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case2: RunScore → Loop → Out');

            this._firstClickAborted = false;
            this._isInLoopStage = true;

            const loopDelay = GameUtilsTools.DeferByTweenPromiseWithCancel(this._jackpotLoopDuration);
            this._resolveDelayOnCancel = loopDelay.forceCancelAndResolve;

            try {
                await loopDelay.promise;
            } finally {
                this._resolveDelayOnCancel = undefined;
                this._isInLoopStage = false;
            }

            if (this._firstClickAborted) {
                //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case2 aborted after delay');
                return;
            }

            this.cancelBoardAni(false);

            if (this._firstClickAborted) {
                //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case2 aborted before requestClose');
                return;
            }

            await this.requestCloseOnce();
            return;
        }

        // === 情况 3:LOOP-click ===
        if (this._isInLoop && this._isInLoopStage) {
            //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case3: Second Click → Force Out');
            //--終止
            this._firstClickAborted = true;
            // 取消第一次click的延遲
            this.forceCancelLoopDelay();
            //等第一次的click結束
            await Promise.resolve();
            // 清空舊的 _closeOncePromise，強制重新創建
            this._closeOncePromise = null;
            this._closeRequested = false;
            // 取消 Loop 動畫
            this.cancelBoardAni(false);
            // 重置狀態
            this._isInLoop = false;
            this._isInLoopStage = false;

            // 直接調用 closeBoard()，重新播放 Out 動畫
            await this.closeBoard();
            return;
        }

        //GameUtilsTools.debugLog('BasicJpUIBoard', '[Click] Case4: Other → Close');
        await this.requestCloseOnce();

    }



    public async forceOutBoard(): Promise<void> {

        this.forceCancelLoopDelay();
        if (this._isGoIn || this._isInLoop) {
            await this.requestCloseOnce();
        } else if (!this._isClosing) {
            // 如果已經在關閉中就共用 closingPromise
            await this.closeBoard();
        } else if (this._isClosing) {
            await this._closingPromise;
            return;
        }
    }

    public async closeBoard(): Promise<void> {

        this._closeRequested = true;
        if (this._isClosing) return this._closingPromise!;
        //this.closeBtnActive();
        this.forceCancelLoopDelay();
        //const playKey = AnimationStateType.Out;
        const playKey = this.getCurrentAniStatePlayKey(AnimationStateType.Out);

        this._isClosing = true;
        this._closingPromise = this.playBoardOut(playKey).finally(() => {
            this.node.active = false;
            this._isClosing = false;
            this._closeRequested = false;
            this._closingPromise = null;
            this._isInLoop = false;
            this._isInLoopStage = false;
            this._isGoIn = false;
            this._firstClickAborted = false;
        });

        return this._closingPromise;
    }

    protected forceCancelLoopDelay(): void {
        this._resolveDelayOnCancel?.();
        this._resolveDelayOnCancel = undefined;
    }

    protected async setLoopTimeStep(): Promise<void> {

        const time = this._jackpotLoopDuration;
        const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(time);
        this._resolveDelayOnCancel = delay.forceCancelAndResolve;
        try {
            await delay.promise;// 等待延遲完成
        } finally {
            this._resolveDelayOnCancel = undefined;// 清掉
        }
    }

    protected requestCloseOnce(): Promise<void> {

        if (this._firstClickAborted) {
            return Promise.resolve();
        }

        this._closeRequested = true;
        if (this._closeOncePromise) {
            return this._closeOncePromise;
        }

        this._closeOncePromise = this.closeBoard().finally(() => {
            this._closeRequested = false;
            this._closeOncePromise = null;
        });
        return this._closeOncePromise;
    }



    protected ensureLoopThenClose(playLoopKey?: string | AnimationStateType): Promise<void> {

        if (this._loopOncePromise) return this._loopOncePromise;
        // 若有要求關閉或正在關閉 → 不再啟 Loop，直接加入那次關閉
        if (this._closeRequested || this._isClosing) return this.requestCloseOnce();

        this._loopOncePromise = (async () => {

            if (!this._isInLoop) {
                // 不是在loop中，先切loop
                // 取消當前(In)動畫，切 Loop（非阻塞播放）
                this.cancelBoardAni(false);// 中斷 In
                this._isGoIn = false;
                // 中斷後到啟動前<再檢查一次>是否有人要求關閉
                if (this._closeRequested || this._isClosing) {
                    await this.requestCloseOnce();
                    return;
                }
                this._isInLoop = true;
                // 啟動 Loop，不 await
                const loopP = this.setPlayPromise({ aniState: playLoopKey });
                void loopP.catch((err) => this.logLoopPlayReject(err, playLoopKey));
            }

            // 啟動延遲前<再檢查一次>：若已要求關閉，就不要開延遲
            if (this._closeRequested || this._isClosing) {
                await this.requestCloseOnce();
                return;
            }

            await this.setLoopTimeStep();// 等待可以強制取消的延遲
            //停止 Loop ,讓loop播放完不要直接應切到out
            this.cancelBoardAni(false);
            await this.requestCloseOnce();//計時結束全部關閉

        })().finally(() => {

            this._isInLoop = false;
            this._isInLoopStage = false;
            this._loopOncePromise = null;
        });

        return this._loopOncePromise;
    }



    //=============<debug log>===================================================
    // 判斷是不是「可預期的取消」
    private isLikelyCancel(err: unknown): boolean {

        if (!err) return this._abort?.signal?.aborted ?? false;
        const msg = (err as any)?.message ?? String(err);
        const name = (err as any)?.name ?? '';

        return (
            this._abort?.signal?.aborted === true ||
            /abort|cancell?ed|stopped|interrupted/i.test(msg) ||
            /AbortError|CanceledError/i.test(name)
        );
    }

    // 播放 promise 的拒絕資訊
    private logLoopPlayReject(err: unknown, playLoopKey: string | AnimationStateType): void {

        const snapshot = {
            playLoopKey,
            isInLoop: this._isInLoop,
            isClosing: this._isClosing,
            closeRequested: this._closeRequested,
            abortedSignal: this._abort?.signal?.aborted ?? false,
            ts: Date.now(),
        };
        if (this.isLikelyCancel(err)) {
            console.debug('[BoardUI] loop promise rejected (likely cancel)', snapshot, err);
        } else {
            console.warn('[BoardUI] loop promise rejected (UNEXPECTED)', snapshot, err);
        }
    }
}


