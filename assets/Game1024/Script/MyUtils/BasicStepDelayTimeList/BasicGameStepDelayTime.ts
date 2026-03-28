import { IGameStepDelayTimeList, Ms, ReelDelayMap, DelayLevel } from './IGameStepDelayTimeList';


/**
 * @author Eric
 * 基本遊戲延遲時間列表
 * 這個類別是給各個遊戲專案繼承使用的,讓各個專案可以有自己的延遲時間列表
 * 直接使用也可以,關鍵還是在IGameStepDelayTimeList的定義上
 * BasicGameStepDelayTime他主要的功能就是在操作2階段加速_deltaTime(配合GameTimeScale.timeScale)
 * 單位:秒
 * TIPS:搭配的計時器是tween(所以單位用:秒)
 * PS:
 * 因為這是硬改的,所以沒辦法透過setGlobalData來改變裡面的屬性,原本的
 */
export enum SpeedTimeMode {
    NORMAL = 'regular',
    Lv1 = 'fast_L1',
    Lv2 = 'fast_L2'
}

export class BasicGameStepDelayTime {

    //--這邊都要用1,因為不主動加速引擎的frameRate
    protected _deltaTime: number = 1;//--2階加速使用的單位時間(GameTimeScale.timeScale)
    protected _currentTimeMode: SpeedTimeMode = SpeedTimeMode.NORMAL;
    protected _delayTimeLevel: DelayLevel<IGameStepDelayTimeList>;//--new-


    set deltaTime(value: number) {
        this._deltaTime = value;
        this._deltaTime = 1;//--目前先固定1
    }

    get deltaTime(): number {
        return this._deltaTime;
    }

    get currentTimeMode(): SpeedTimeMode {
        return this._currentTimeMode;
    }

    set currentTimeMode(value: SpeedTimeMode) {
        this._currentTimeMode = value;
    }
    //constructor(config: IGameStepDelayTimeList) {
    constructor(config: DelayLevel<IGameStepDelayTimeList>) {
        this._delayTimeLevel = config;
    }

    private getCurrentList(): IGameStepDelayTimeList {

        switch (this._currentTimeMode) {
            case SpeedTimeMode.Lv1: return this._delayTimeLevel.fast_L1;
            case SpeedTimeMode.Lv2: return this._delayTimeLevel.fast_L2;
            default: return this._delayTimeLevel.regular;
        }
    }

    public get(selector: (cfg: IGameStepDelayTimeList) => Ms | undefined): number {

        const currentList = this.getCurrentList();
        const raw = selector(currentList);
        return this.toTime(raw, currentList.unit);
    }

    public getReelDelay(
        selector: (cfg: IGameStepDelayTimeList) => Ms | ReelDelayMap | undefined,
        reelId: number
    ): number {

        const currentList = this.getCurrentList();
        const value = selector(currentList);
        if (value == null) return 0;
        if (typeof value === 'number') return this.toTime(value, currentList.unit);
        return this.toTime(value[reelId], currentList.unit);
    }

    //--單位轉換(加減速)--單位:秒
    /**
     * 20251016-廢棄
     * 原本是可以隨著engine的timeScale去做調整,讓相對應的時間可以被調整
     * @param value 
     * @returns 
     */
    private toTime(value: Ms | undefined, unit: 's' | 'ms' = 's'): number {

        if (value == null) return 0;
        const seconds = unit === 'ms' ? value / 1000 : value;
        return seconds / this._deltaTime;
    }


}