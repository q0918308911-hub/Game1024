import { MultiAniController } from "../Components/MultiAniController";

/**
 * Spine 監聽任務的類型定義
 */
export interface SpineWatchTask {
    /** 任務唯一 ID */
    id: string;
    /** 所屬的 MultiAniController */
    controller: MultiAniController;
    /** AnimationController 的 ID */
    aniCtrlId: string;
    /** Spine 在 aepSpines 陣列中的索引 */
    spineIndex: number;
    /** Spine 軌道索引 */
    trackIndex: number;
    /** 檢查類型：百分比或影格 */
    checkType: 'percentage' | 'frame';
    /** 目標值（百分比或影格數） */
    targetValue: number;
    /** 完成時的回調 */
    resolve: () => void;
    /** 容差值（僅用於百分比檢查） */
    epsilon?: number;
}
