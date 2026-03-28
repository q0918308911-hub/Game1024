import { Component, _decorator, Node, Game } from "cc";
import { IFGBoardUI } from "./IFGBoardUI";
import { AnimationController, IAnimationControl, AnimationStateType, AniCtrlPropDef } from "../AnimationSystemV3/ReferencePathForAnimationSysV3";
import { AniSysTools } from "../AnimationSystemV3/AniTools/AniSysTools";
import { PlaySelector } from "../AnimationSystemV3/Definitions/IPlayOptions";
import { GameState, GameUtilsTools } from "../ReferencePathForMyUtils";

const { ccclass, property } = _decorator;
const DEBUG_TITLE = "BasicGameBoardUI";
@ccclass('BasicGameBoardUI')
export class BasicGameBoardUI extends Component implements IFGBoardUI {

    @property({ type: Node, visible: true, tooltip: "設定此物件的動畫物件" })
    private _aniNode: Node | null = null;

    protected _iAnimationController: IAnimationControl | null = null;

    // Abort handling
    protected _abort = new AbortController();

    // State
    protected _initialized = false;
    protected _isPlaying = false;
    protected _playMode = '';

    protected onLoad(): void {
        if (this._initialized) return;

        if (!this._aniNode) {
            console.error("BasicGameBoardUI need AnimationController");
        } else {
            this._iAnimationController = AniSysTools.findAndGetIAniComponent(this._aniNode) as IAnimationControl;
        }
        this.init();
        this._initialized = true;
    }

    protected onDisable(): void {
        this.cancelBoardAni(true);
    }

    protected onDestroy(): void {
        this.cancelBoardAni(true);
    }

    public init(): void {
        this._iAnimationController?.init?.();
    }

    //--設定狀態（如果你要記錄板子當前模式/文案）
    public setBoardMode(state?: GameState): void {
        // no-op for now
    }

    //--寫入分數/次數
    public setResultLabel(value: number): void {
        // implement your label updates here
    }

    // --- 等待 abort signal的promise
    protected makeCancelGate(signal: AbortSignal) {
        let handler: (() => void) | null = null;
        const promise = new Promise<void>((resolve) => {
            if (signal.aborted) { resolve(); return; }
            handler = () => resolve();
            signal.addEventListener('abort', handler, { once: true });
        });

        const off = () => {
            if (handler) {
                signal.removeEventListener('abort', handler);
                handler = null;
            }
        };
        return { promise, off };
    }

    protected setSpeedforPlay(mode: PlaySelector, dt: number): void {
        if (dt && dt > 0) {
            const aniCtrl: AnimationController = this._iAnimationController as AnimationController;
            const targetState: AniCtrlPropDef = aniCtrl.peakAniDataInfo(mode) as AniCtrlPropDef;
            const originalDuration = targetState.duration;
            if (originalDuration != dt) {
                const speed = originalDuration / dt;
                const changeSpeed = GameUtilsTools.deepClone(targetState) as AniCtrlPropDef;
                changeSpeed.speed = speed;

                if (aniCtrl.isAEP_SPINE && aniCtrl.aepSpines.length > 0) {
                    for (let i = 0; i < aniCtrl.aepSpines.length; i++) {
                        const sp = aniCtrl.aepSpines[i];
                        const spAniName = typeof mode === 'string' ? mode : (mode as any)?.aniState ?? '';
                        const duration = sp.findAnimation(spAniName)?.duration;
                        if (duration) {
                            const speed = duration / dt;
                            sp.timeScale = speed;
                            break;
                        }
                    }
                }
                this._iAnimationController.setAniDataInfo(changeSpeed);
            }


        }
    }

    protected setPlayPromise(mode: PlaySelector = AnimationStateType.Default, dt?: number): Promise<void> {

        let returnP;
        //const targetAni=this._iAnimationController
        this.setSpeedforPlay(mode, dt);
        if (this._iAnimationController) {
            returnP = this._iAnimationController.playAniInPromise(mode ?? AnimationStateType.Default);
        } else {
            returnP = Promise.resolve();
        }
        return returnP;
    }



    // === 共用封裝：包裝 cancel + race ===
    protected runAniWithAbort<T>(
        task: () => Promise<T>,
        cancelValue?: T//--取消要拿的值
    ): Promise<T> {
        // 取消前一個任務
        this.cancelBoardAni(false);

        // 建立新的 abort 範圍
        this._abort = new AbortController();
        const signal = this._abort.signal;
        const { promise: cancelP, off } = this.makeCancelGate(signal);

        // 包裝 Promise：播放與取消
        const taggedCancel = cancelP.then(() => (
            { winner: "cancel" as const }
        ));
        const taggedPlay = task().then(
            (res) => (
                { winner: "play" as const, result: res }
            ),
            (error) => (
                { winner: "play" as const, error }
            )
        );

        // === 狀態紀錄 ===
        this._isPlaying = true;

        // === 執行競賽（誰先完成誰贏） ===
        return Promise.race([taggedCancel, taggedPlay])
            .then((outcome) => {
                const winner = outcome.winner;
                const hasError = "error" in outcome;
                GameUtilsTools.debugLog(DEBUG_TITLE, 'race settled:', {
                    mode: this._playMode,
                    winner: winner,
                    hasError: hasError,
                    outcome: outcome
                });

                // 若 play promise 拋錯，則繼續拋出讓外層 catch
                if (hasError) throw (outcome as any).error;

                if (outcome.winner === "cancel") {
                    // 原本是 throw；改成回傳你想要的中斷值
                    return (cancelValue as T);
                }
                // 若被 cancel 則丟出中斷錯誤（讓外層可選擇忽略或捕捉）
                //if (winner === "cancel") throw new Error("Animation aborted");

                // 正常播放結束 → 回傳結果
                return (outcome as any).result as T;
            })
            .catch((err) => {
                if ((err && (err as any).isAbort) || String(err?.message || err) === "Animation aborted") {
                    return (cancelValue as T); // swallow → resolved
                }
                throw err; // 其他非取消錯照拋
            })
            .finally(() => {
                off();
                this._isPlaying = false;
            });
    }

    // === 播放一般動畫 ===
    //--預設播放
    protected playWithAbort(mode: PlaySelector, dt?: number): Promise<void> {
        return this.runAniWithAbort(() => this.setPlayPromise(mode, dt));
    }

    //--20251006新增(要接影格事件)
    protected playWithFrameEvt(
        mode: PlaySelector,
        onFrame?: (...args: any[]) => void,
        onFinish?: () => void,
        opt?: any
    ): Promise<void> {
        this._playMode = typeof mode === "string" ? mode : (mode as any)?.aniState ?? JSON.stringify(mode);
        return this.runAniWithAbort(
            () =>
                new Promise<void>((resolve, reject) => {
                    try {
                        (<AnimationController>this._iAnimationController)?.playAniWithFrameEvtCallBack?.(
                            (...args: any[]) => {
                                try { onFrame?.(...args); } catch { }
                            },
                            () => {
                                try { onFinish?.(); } catch { }
                                resolve();
                            },
                            opt?.backDefault ?? false,
                            mode,
                            opt
                        );
                    } catch (e) {
                        reject(e);
                    }
                })
        );
    }
    /**
     * 用race來防堵promise死掉,誰先完成就算數
     */
    /*
    protected playWithAbort(mode: PlaySelector, value?: number): Promise<void> {
        // 取消舊的
        this.cancelBoardAni(false);//resetToDefault

        // new abort scope
        this._abort = new AbortController();
        const signal = this._abort.signal;

        const { promise: cancelP, off } = this.makeCancelGate(signal);
        const playRaw = this.setPlayPromise(mode);

        type RaceOutcome =
            | { winner: 'cancel' }
            | { winner: 'play'; error?: unknown };

        const taggedCancel: Promise<RaceOutcome> =
            cancelP.then(() => ({ winner: 'cancel' as const }));

        const taggedPlay: Promise<RaceOutcome> = playRaw.then(
            () => ({ winner: 'play' as const }),
            (error) => ({ winner: 'play' as const, error }) // ← 把錯誤轉成「已處理的結果物件」
        );

        this._isPlaying = true;

        const modeName =
            typeof mode === 'string'
                ? mode
                : (mode as any)?.aniState ?? JSON.stringify(mode);
        this._playMode = String(modeName);

        // 進行帶標籤的race
        return Promise.race<RaceOutcome>([taggedCancel, taggedPlay])
            .then((outcome) => {
                const winner = outcome.winner;
                const hasError = 'error' in outcome;
                console.log(
                    `[BasicGameBoardUI] race settled: mode=${this._playMode}, winner=${winner}${hasError ? ', playP rejected' : ''}`
                );

                // 若是 play 先結束但它是 reject，繼續把錯往外拋
                if (hasError) throw (outcome as any).error;
            })
            .finally(() => {
                off();
                this._isPlaying = false;
            });

    }*/

    //-讓繼承的人可以修改要選擇哪一種播放方式playWithAbort/playWithFrameEvt
    //-如需改變複寫這些方法即可,原本的playBoardIn/Loop/Out不需改變
    protected getInPlayTask(mode: PlaySelector, dt?: number): Promise<void> {
        return this.playWithAbort(mode, dt);
    }

    protected getLoopPlayTask(mode: PlaySelector, dt?: number): Promise<void> {
        return this.playWithAbort(mode, dt);
    }

    protected getOutPlayTask(mode: PlaySelector, dt?: number): Promise<void> {
        return this.playWithAbort(mode, dt);
    }

    // ================================ 對外 API ===============================

    //進場：外部直接 await 
    public async playBoardIn(value: number = 0, mode: PlaySelector = AnimationStateType.In, dt: number = 0): Promise<void> {
        // 0 也是有效值；直接寫
        this.setResultLabel(value);
        //return this.playWithAbort(mode, value);
        await this.getInPlayTask(mode, dt);
    }

    /**
     * 取消目前板子動畫。
     * @param resetToDefault true → 嘗試停掉動畫並回 Default；false → 只 abort，不強制回 Default
     */
    public cancelBoardAni(resetToDefault: boolean = false): void {
        try { this._abort?.abort(); } catch { }
        try {
            if (resetToDefault) {
                this._iAnimationController?.goBackToDefault?.();
            } else {
                // 若有 stop API，優先使用；沒有再退回 default
                (this._iAnimationController as any)?.stopAni?.() ??
                    this._iAnimationController?.goBackToDefault?.();
            }
        } catch { }
    }

    //待機：啟動 Loop，直到外部呼叫 cancelBoardAni 才結束 
    public async playBoardLoop(mode: PlaySelector = AnimationStateType.Loop): Promise<void> {
        // 開始 loop
        // 如果底層 playAniInPromise 對 loop 也「永不 resolve」，這會在 cancel 時結束
        //return this.playWithAbort(mode);
        await this.getLoopPlayTask(mode);
    }

    //退場：完成後（且未被取消）回到 Default 
    public async playBoardOut(mode: PlaySelector = AnimationStateType.Out, dt: number = 0): Promise<void> {
        //await this.playWithAbort(mode);
        await this.getOutPlayTask(mode, dt);
        // 若中途被 cancel，就不要動 default；交給呼叫端自行決定
        if (!this._abort.signal.aborted) {
            try { this._iAnimationController?.goBackToDefault?.(); } catch { }
        }
    }

    //強制回到預設狀態
    public goBackToDefault(): void {
        this.cancelBoardAni(true);
    }
}
