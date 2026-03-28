import { _decorator, CCFloat, Component, } from 'cc';
import { UniReel } from './UniReel';
import { IReel } from './Interface/IReel';

const { ccclass, property } = _decorator;

/**
 * 負責一局的滾輪表演
 */
@ccclass('UniReelView')
export abstract class UniReelView<Reel extends IReel> extends Component {
    /**紀錄所有滾輪*/
    @property(UniReel)
    protected reelList: Reel[] = [];

    /**開始滾動間隔的時間，小於0代表一起滾動，單位為秒*/
    @property({ type: CCFloat, tooltip: '開始滾動間隔的時間，小於0代表一起滾動' })
    protected startSpaceTime: number = 0.1;

    /**
     * 是否為快速模式，包含turbo以及按下即停按鈕
     * 
     * 需要與SlotMachine做串接
     */
    public isFastModeCallback: () => boolean = null;

    /**
     * 設定滾輪資料，在滾輪停止前觸發
     * @param reelID 滾輪ID
     * @param data 滾輪資料
     * 
     * @example
     * 在停輪前設定滾輪資料
     * ```ts
     *  protected async stopOneReel(reelID: number, resultData: number[], stopType: number): Promise<void> {
        this.setReelDataCallback(reelID, resultData);
        await this.reelList[reelID].stopRollAsync(stopType);
        this.oneReelRollEnd(reelID);
    }
     * ```
     */
    public setReelDataCallback: (reelID: number, data: number[]) => void = null;

    /**
     * 當滾輪開始聽牌時觸發
     * @param reelID 滾輪ID
     */
    public showReadyHandCallback: (reelID: number) => void = null;

    /**
     * 當滾輪結束聽牌時觸發
     * @param reelID 滾輪ID
     */
    public hideReadyHandCallback: (reelID: number) => void = null;

    /**滾輪數量，取得{@link reelList}的長度*/
    public get reelAmount(): number {
        return this.reelList.length;
    }

    /**內部使用，紀錄當前滾動的滾輪ID*/
    protected _currentRollingReelIDs: number[] = [];

    /**取得當前滾動的滾輪ID*/
    public get currentRollingReelIDs(): number[] {
        return this._currentRollingReelIDs;
    }

    /**紀錄滾輪是否需要ReadyHand的狀態*/
    protected _reelHaveReadyHandList: boolean[] = [];

    /**紀錄滾輪是否進入ReadyHand的狀態*/
    protected _reelIsReadyHandList: boolean[] = [];

    /**紀錄當前開始聽牌的滾輪ID，預設大於等於他的滾輪才會開始聽牌*/
    protected _currentReadyHandReelID: number = -1;

    /**內部使用，紀錄預設滾輪ID，假設滾輪數量為3，預設為[0, 1, 2]，由小到大開始滾動到停止*/
    protected _defaultRollingReelIDs: number[] = [];

    /**取得預設滾輪ID，由小到大開始滾動到停止*/
    public get defaultRollingReelIDs(): number[] {
        return this._defaultRollingReelIDs;
    }

    /**
     * 初始化所有滾輪，並設置{@link UniReel.onMoveOnceStart}的監聽，用來觸發滾輪開始聽牌
     */
    public init(): void {
        this._reelHaveReadyHandList = Array.from({ length: this.reelAmount }, () => false);
        this._reelIsReadyHandList = Array.from({ length: this.reelAmount }, () => false);

        for (let reelID = 0; reelID < this.reelList.length; reelID++) {
            let reel = this.reelList[reelID];
            reel.init(reelID);
        }

        for (let reelID = 0; reelID < this.reelAmount; reelID++) {
            this._defaultRollingReelIDs[reelID] = reelID;
        }
    }

    /**
     * 重置所有紀錄，開始滾動所有滾輪
     * 
     * 如果{@link startSpaceTime}大於等於0且不是快速模式的話，則會依序間隔時間滾動滾輪
     * @param reelIDs 要開始滾動的滾輪ID，預設為{@link defaultRollingReelIDs}
     * 
     * @example
     * 為了確保所有滾輪都開始滾動後，才可以停止，可以使用await 
     * ```ts
     * public async startRoll(isTurboMode: boolean, reelIDs?: number[]): Promise<void> {
             this.reset();
             this._isTurboMode = isTurboMode;
             await this._reelView.startRoll(reelIDs); //等待所有滾輪開始滾動再開始計時
             this._startRoll = true;
             this._startTime = game.totalTime;
         }
     * ```
     */
    public async startRoll(reelIDs: number[] = this._defaultRollingReelIDs): Promise<void> {
        this.reset();

        this._currentRollingReelIDs = reelIDs;

        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID = this._currentRollingReelIDs[index];
            this.reelList[reelID].startRoll();

            if (this.startSpaceTime >= 0 && !this.isFastModeCallback()) {
                await this.waitStartSpace(this.startSpaceTime);
            }
        }
    }

    /**
     * 呼叫所有滾輪停止，並不是直接停下
     * @param resultData 盤面資料
     * @param stopType 停止方式
     */
    public async stopRoll(resultData: number[][], stopType: number): Promise<void> {
        let promiseList = [];

        for (let index = 0; index < this.currentRollingReelIDs.length; index++) {
            let reelID = this.currentRollingReelIDs[index];
            promiseList.push(this.stopOneReel(reelID, resultData[reelID], stopType));
        }

        if (this.isFastModeCallback()) {
            this.fastStopRoll();
        }

        await Promise.all(promiseList);
    }

    /**
     * 急停時呼叫，呼叫所有滾輪急停，必須實作
     */
    public abstract fastStopRoll(): void;

    /**
     * 取得指定滾輪的icon數量
     * @param reelID 滾輪ID
     * @returns icon數量
     */
    public getIconAmount(reelID: number): number {
        return this.reelList[reelID].iconAmount;
    }

    /**
     * 設置滾輪是否聽牌的狀態，預設是從開始聽牌的滾輪聽到最後一輪
     * @param currentReadyHandReelID 開始聽牌的滾輪ID
     * 
     * @example
     * 在呼叫滾輪停止前，先設定聽牌資料
     * ```ts
    public async stopRollExample(currentReadyHandReelID: number, resultData: number[][]): Promise<void> {
        this.setReadyHand(currentReadyHandReelID);
        await this.stopRoll(resultData, this.stopType);
    }
     * ```
     */
    public setReadyHand(currentReadyHandReelID: number): void {
        if (currentReadyHandReelID >= 0) {
            this._currentReadyHandReelID = currentReadyHandReelID;
            let currentReadyHandReelIndex = this._currentRollingReelIDs.indexOf(currentReadyHandReelID);

            if (currentReadyHandReelIndex !== -1) {
                for (let reelID = 0; reelID < this.reelAmount; reelID++) {
                    let index = this._currentRollingReelIDs.indexOf(reelID);
                    let haveReadyHand = false;
                    if (index !== -1) {
                        haveReadyHand = index >= currentReadyHandReelIndex;
                    }
                    this._reelHaveReadyHandList[reelID] = haveReadyHand;
                }
            }
        }
    }

    /**
     * 直接設置哪些滾輪是否聽牌的狀態
     * @param reelIDList 聽牌的滾輪ID列表
     * 
     * @example
     * 在呼叫滾輪停止前，先設定聽牌資料
     * ```ts
    public async stopRollExample(reelIDList: number[], resultData: number[][]): Promise<void> {
        this.setReadyHandList(reelIDList);
        await this.stopRoll(resultData, this.stopType);
    }
     * ```
     */
    public setReadyHandList(reelIDList: number[]): void {
        for (let index = 0; index < reelIDList.length; index++) {
            const reelID = reelIDList[index];
            let haveRolled = this._currentRollingReelIDs.includes(reelID);

            if (haveRolled) {
                this._reelHaveReadyHandList[reelID] = true;
            }
        }
    }

    /**
     * 呼叫單個滾輪停止
     * 
     * 在滾輪停止前，先設定盤面資料，再呼叫滾輪停止
     * @param reelID 滾輪ID
     * @param resultData 盤面資料
     * @param stopType 停輪方式
     */
    protected async stopOneReel(reelID: number, resultData: number[], stopType: number): Promise<void> {
        this.setReelDataCallback(reelID, resultData);

        if (this.currentRollingReelIDs[0] === reelID) { //第一個滾動的滾輪判斷有無聽牌
            this.checkShowReadyHand(reelID);
        }
        await this.reelList[reelID].stopRollAsync(stopType);
        this.oneReelRollEnd(reelID);
    }

    /**
     * 檢查滾輪是否聽牌，記得要先設置聽牌資料{@link setReadyHand}{@link setReadyHandList}
     * @param reelID 滾輪ID
     */
    protected checkShowReadyHand(reelID: number): void {
        if (!this._reelIsReadyHandList[reelID]) {
            if (!this.isFastModeCallback()) {
                let haveReadyHand: boolean = this._reelHaveReadyHandList[reelID];

                if (haveReadyHand) {
                    this.showReadyHandCallback(reelID);
                    this._reelIsReadyHandList[reelID] = true;
                }
            }
        }
    }

    /**
     * 檢查滾輪聽牌效果是否有被關閉
     * @param reelID 滾輪ID
     */
    protected checkHideReadyHand(reelID: number): void {
        if (this._reelIsReadyHandList[reelID]) {
            this.hideReadyHandCallback(reelID);
            this._reelIsReadyHandList[reelID] = false;
        }
    }

    /**
     * 單個滾輪停止後呼叫，檢查聽牌是否已關閉，並檢查下一個滾輪是否聽牌
     * @param reelID 滾輪ID
     */
    protected oneReelRollEnd(reelID: number): void {
        this.checkHideReadyHand(reelID);

        let index = this.currentRollingReelIDs.indexOf(reelID);
        if (index + 1 < this.currentRollingReelIDs.length) { //檢查下一個滾輪有無聽牌
            let nextReelID = this.currentRollingReelIDs[index + 1];
            this.checkShowReadyHand(nextReelID);
        }
    }

    /**
     * 重置所有記錄，在{@link startRoll}時呼叫
     */
    protected reset(): void {
        this._reelHaveReadyHandList = Array.from({ length: this.reelAmount }, () => false);
        this._reelIsReadyHandList = Array.from({ length: this.reelAmount }, () => false);
        this._currentReadyHandReelID = -1;
    }

    /**
     * 滾輪開始滾動的間隔時間計時器
     * @param time 等待時間
     * @returns 
     */
    protected waitStartSpace(time: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this.scheduleOnce(() => {
                resolve();
            }, time);
        });
    }
}