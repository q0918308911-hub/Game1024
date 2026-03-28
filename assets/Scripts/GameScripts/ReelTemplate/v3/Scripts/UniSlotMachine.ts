import { _decorator, CCFloat, Component, Enum, game, macro, } from 'cc';
import { UniReelView } from './UniReelView';
import { StopType } from './UniReel';
import { IReel } from './Interface/IReel';

const { ccclass, property } = _decorator;

/**
 * 管理資料傳輸以及View的表演
 */
@ccclass('UniSlotMachine')
export class UniSlotMachine<View extends UniReelView<IReel>> extends Component {
    /**表演的view */
    @property({ type: UniReelView, visible: true })
    protected _reelView: View = null;

    /**滾輪的停止類型 */
    @property({ type: Enum(StopType) })
    protected stopType: StopType = StopType.RunoutData;

    /**正常模式滾動時間，需滿足時間才可以停止，單位為秒 */
    @property({ type: CCFloat, visible: true, tooltip: '正常模式滾動時間，單位:秒', min: 0 })
    protected _normalRollTime: number = 0.5;

    /**快速模式滾動時間，需滿足時間才可以停止，單位為秒 */
    @property({ type: CCFloat, visible: true, tooltip: '快速模式滾動時間，單位:秒', min: 0 })
    protected _fastRollTime: number = 0.2;

    /**紀錄最終顯示的資料 */
    protected _iconResultData: number[][] = [];

    /**紀錄是否開始滾動
     * 
     * @example
     * 防止有些滾輪還未開始滾動，就呼叫了滾輪停止，所以使用await，確保所有滾輪都開始滾動後，才可以停止
     * ```ts
     *  public async startRoll(isTurboMode: boolean, reelIDs?: number[]): Promise<void> {
        this._isTurboMode = isTurboMode;
        await this._reelView.startRoll(reelIDs); //等待所有滾輪開始滾動再開始計時
        this._startRoll = true;
        this._startTime = game.totalTime;
    }
     * ```
    */
    protected _startRoll: boolean = false;

    /**滾動時間滿足以及收到伺服器資料才能停止 */
    protected _canStop: boolean = false;

    /**是否為Turbo模式 */
    protected _isTurboMode: boolean = false;

    /**是否點擊了急停按鈕 */
    protected _isStopClick: boolean = false;

    /**取得滾輪數量 */
    public get reelAmount(): number {
        return this._reelView.reelAmount;
    }

    /**紀錄開始滾動的時間，用來計算滾動時間 */
    protected _startTime: number = 0;

    /**
     * 初始化view，串接{@link UniReelView.isFastModeCallback}
     */
    public init(): void {
        this._reelView.init();
        this._reelView.isFastModeCallback = this.isFastMode.bind(this);
    }

    /**
     * 開始滾動表演
     * @param isTurboMode 是否為Turbo模式
     * @param reelIDs 要表演的滾輪ID，不傳入預設為所有滾輪
     */
    public async startRoll(isTurboMode: boolean, reelIDs?: number[]): Promise<void> {
        this.reset();
        this._isTurboMode = isTurboMode;
        await this._reelView.startRoll(reelIDs); //等待所有滾輪開始滾動再開始計時
        this._startRoll = true;
        this._startTime = game.totalTime;
    }

    /**
     * 呼叫所有滾輪停止
     * @param resultData 滾輪結果的資料
     * 
     * @example
     * 利用 await 等待所有滾輪停止，再執行中獎表演
     * ```ts
     * await this._slotMachine.stopRoll(resultData);
     * this.playWinAnimation();
     * ```
     */
    public async stopRoll(resultData: number[][]): Promise<void> {
        this._iconResultData = [...resultData];
        await this.canStopRoll();
        await this._reelView.stopRoll(this._iconResultData, this.stopType);
    }

    /**
     * 設置聽牌資料給view，預設是從開始聽牌的滾輪聽到最後一輪
     * @param currentReadyHandReelID 開始聽牌的滾輪ID
     */
    public setReadyHand(currentReadyHandReelID: number): void {
        this._reelView.setReadyHand(currentReadyHandReelID);
    }

    /**
    * 直接設置哪些滾輪需要聽牌的資料給view
    * @param reelIDList 聽牌的滾輪ID列表
    */
    public setReadyHandList(reelIDList: number[]): void {
        this._reelView.setReadyHandList(reelIDList);
    }

    /**
     * 取得指定滾輪的icon數量
     * @param reelID 滾輪ID
     */
    public getIconAmount(reelID: number): number {
        return this._reelView.getIconAmount(reelID);
    }

    /**
     * 點擊急停按鈕時觸發，需要額外串接
     * @example
     * 監聽UI公版的急停按鈕
     * ```ts
     * class GameView{
     *      private slotMachine: UniSlotMachine = null;
     * 
     *      public init():void{
     *          GenericUIManager.instance.onStopBtnClickCallback = this.onStopBtnClick.bind(this);
     *      }
     * 
     *      private onStopBtnClick(): void {
                this.slotMachine.stopRollCallBack();
            }
     * }
     * ```
     */
    public stopRollCallBack(): void {
        this._isStopClick = true;

        if (this._canStop) {
            this._reelView.fastStopRoll();
        }
    }

    /**
     * 檢查是否可以停止滾輪，需滿足滾動時間、收到伺服器資料以及確保所有滾輪已開始滾動
     */
    protected async canStopRoll(): Promise<void> {
        return new Promise<void>((resolve) => {
            let callback = () => {
                let standardTime: number = this.isFastMode() ? this._fastRollTime : this._normalRollTime;
                standardTime *= 1000; //轉成毫秒
                let fillTime: boolean = game.totalTime - this._startTime >= standardTime; //滿足滾動時間
                let receiveData: boolean = this._iconResultData.length > 0; //收到伺服器資料

                if (fillTime && receiveData && this._startRoll) {
                    this.unschedule(callback);
                    this._canStop = true;
                    resolve();
                }
            };

            this.schedule(callback, 0, macro.REPEAT_FOREVER);
        });
    }

    /**
     * 是否為快速模式，開啟turbo模式或是點擊急停按鈕，都視為快速模式
     * @returns 是否為快速模式
     */
    protected isFastMode(): boolean {
        return this._isStopClick || this._isTurboMode;
    }

    /**
    * 重置所有記錄的資料，在{@link startRoll}時呼叫
    */
    protected reset(): void {
        this._iconResultData.length = 0;
        this._startRoll = false;
        this._canStop = false;
        this._isStopClick = false;
    }
}