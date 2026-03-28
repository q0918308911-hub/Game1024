export enum StopClearMode {
    NONE = 'none',        // 不清理 tracks
    CURRENT = 'current',  // 只清當前 track
    ALL = 'all',          // 清所有 tracks
    EMPTY = 'empty',      // 以 empty animation 清
}

export interface IStopOptions {
    /** 忽略 _afterPlayDoStop，強制用 options.clear ；預設 false */
    overrideAfterPlayFlag?: boolean;

    /** 清理策略（未給時：overrideAfterPlayFlag=true, _clearTracks；否則取決於 _afterPlayDoStop） */
    clear?: StopClearMode;

    /** 是否 resolve 任何 pending 的 spine/sequence promise（預設 false） */
    resolvePromises?: boolean;

    /** 是否觸發一次性 callback（_spineAniCallback）（預設 false） */
    resolveCallback?: boolean;

    /** 是否停止粒子（預設 true） */
    stopParticles?: boolean;

    /** 是否重置 Spine Pose（預設 false） */
    resetPose?: boolean;

    goBackToDefault?: boolean; // 是否回到預設狀態動畫（預設 false）

    /** [20251221] 新增：指定要操作的軌道索引，若不傳則視為全局操作 */
    trackIndex?: number;
}