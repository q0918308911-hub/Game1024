import { StopType } from "../UniReel";
import { SymbolBase } from "./SymbolBase";

/**
 * 滾輪介面
 */
export interface IReel {
    /** icon數量 */
    get iconAmount(): number;

    /**
     * 初始化，設定滾輪ID
     * @param reelID 滾輪ID
     */
    init(reelID: number): void;

    /**
     * 滾輪的進入點，開始滾動
     */
    startRoll(): void;

    /**
     * 開始滾動，直到滾輪結束才會resolve
     * @returns 
     */
    startRollAsync(): Promise<void>;

    /**
     * 停止滾動
     * @param stopType 停止方式
     */
    stopRoll(stopType: StopType): void;

    /**
     * 停止滾動，直到滾輪結束才會resolve
     * @param stopType 停止方式
     * @returns 
     */
    stopRollAsync(stopType: StopType): Promise<void>;

    // /**
    //  * 滾輪急停時呼叫
    //  */
    // fastStopRoll(): void;

    /**
     * 在滾輪開始滾動時觸發
     */
    onStartRoll: () => void;

    /**
     * 在滾輪結束滾動時觸發
     */
    onStopRoll: () => void;

    /**
     * 開始滾動一格時觸發
     */
    onMoveOnceStart: () => void;

    /**
     * 滾動一格結束時觸發
     */
    onMoveOnceComplete: () => void;

    /**
     * 設置icon的Symbol時觸發
     * @param symbol Symbol資料
     * @param iconIndex 當前icon的index
     */
    onSetIconData: (symbol: SymbolBase, iconIndex: number) => void;
}

