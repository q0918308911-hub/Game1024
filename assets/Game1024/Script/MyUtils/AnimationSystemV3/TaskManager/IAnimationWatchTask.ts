import { AnimationController } from "../Components/AnimationController";

/**
 * Animation 監聽任務的類型定義
 */
export interface IAnimationWatchTask {
    /** 任務唯一 ID */
    id: string;
    /** 所屬的 AnimationController */
    controller: AnimationController;
    /** 檢查類型：百分比或影格 */
    checkType: 'percentage' | 'frame' | 'time';
    /** 目標值（百分比或影格數） */
    targetValue: number;
    /** 完成時的回調 */
    resolve: () => void;
    /** 容差值（僅用於百分比檢查） */
    epsilon?: number;
    lastCheckedTime?: number;
}