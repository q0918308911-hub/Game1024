import { MultiAniController } from "../Components/MultiAniController";
import { SpineWatchTask } from "./SpineWatchTask";

/**
 * Spine 監聽任務管理器（靜態單例）
 * 集中管理所有 Spine 動畫的監聽任務，使用單一 schedule 提升效能
 */
export class SpineWatchTaskManager {
    private static instance: SpineWatchTaskManager;
    private tasks: Map<string, SpineWatchTask> = new Map();
    private scheduleHost: MultiAniController | null = null;
    private isScheduleRunning: boolean = false;

    private constructor() { }

    /**
     * 獲取單例實例
     */
    public static getInstance(): SpineWatchTaskManager {
        if (!SpineWatchTaskManager.instance) {
            SpineWatchTaskManager.instance = new SpineWatchTaskManager();
        }
        return SpineWatchTaskManager.instance;
    }

    /**
     * 註冊一個監聽任務
     * @param task 要註冊的任務
     */
    public registerTask(task: SpineWatchTask): void {
        this.tasks.set(task.id, task);

        // 如果還沒有 schedule 在運行，啟動它
        if (!this.isScheduleRunning) {
            this.startSchedule();
        }
    }

    /**
     * 取消一個監聽任務
     * @param taskId 任務 ID
     */
    public cancelTask(taskId: string): void {
        this.tasks.delete(taskId);

        // 如果沒有任務了，停止 schedule
        if (this.tasks.size === 0) {
            this.stopSchedule();
        }
    }

    /**
     * 統一的更新方法 - 所有任務都在這裡檢查
     * 採用分流判斷去執行不同的檢查邏輯
     */
    private updateAllTasks = (): void => {
        if (!this.scheduleHost?.node?.isValid || this.tasks.size === 0) {
            this.stopSchedule();
            return;
        }

        const completedTaskIds: string[] = [];

        // 遍歷所有任務並根據類型分流執行不同邏輯
        for (const [taskId, task] of this.tasks) {
            let isCompleted = false;

            // 分流判斷：根據檢查類型執行不同的檢查邏輯
            switch (task.checkType) {
                case 'percentage':
                    isCompleted = this.checkPercentageTask(task);
                    break;
                case 'frame':
                    isCompleted = this.checkFrameTask(task);
                    break;
                default:
                    console.warn(`[SpineWatchTaskManager] 未知的檢查類型: ${task.checkType}`);
                    isCompleted = true; // 未知類型直接標記完成
            }

            if (isCompleted) {
                completedTaskIds.push(taskId);
            }
        }

        // 移除已完成的任務並執行回調
        for (const taskId of completedTaskIds) {
            const task = this.tasks.get(taskId);
            if (task) {
                task.resolve();
                this.tasks.delete(taskId);
            }
        }

        // 如果沒有任務了，停止 schedule
        if (this.tasks.size === 0) {
            this.stopSchedule();
        }
    }

    /**
     * 檢查百分比類型的任務
     * @param task 要檢查的任務
     * @returns 是否已完成
     */
    private checkPercentageTask(task: SpineWatchTask): boolean {
        // 驗證 controller 有效性
        if (!task.controller?.node?.isValid) {
            return true; // 無效則標記完成
        }

        const aniTarget = task.controller.getAniCtrlById(task.aniCtrlId);
        if (!aniTarget?.isAEP_SPINE || !aniTarget.aepSpines?.[task.spineIndex]) {
            return true;
        }

        const spine = aniTarget.aepSpines[task.spineIndex];
        const trackEntry = spine.getCurrent(task.trackIndex);

        if (!trackEntry) {
            return false; // 沒有播放中的動畫，繼續等待
        }

        const currentTime = trackEntry.trackTime;
        const duration = trackEntry.animation.duration;

        if (duration === 0) {
            return true;
        }

        const currentPercentage = (currentTime / duration) * 100;
        const epsilon = task.epsilon ?? 0.5;

        return currentPercentage >= task.targetValue - epsilon;
    }

    /**
     * 檢查影格類型的任務
     * @param task 要檢查的任務
     * @returns 是否已完成
     */
    private checkFrameTask(task: SpineWatchTask): boolean {
        if (!task.controller?.node?.isValid) {
            return true;
        }

        const aniTarget = task.controller.getAniCtrlById(task.aniCtrlId);
        if (!aniTarget?.isAEP_SPINE || !aniTarget.aepSpines?.[task.spineIndex]) {
            return true;
        }

        const spine = aniTarget.aepSpines[task.spineIndex];
        const trackEntry = spine.getCurrent(task.trackIndex);

        if (!trackEntry) {
            return false;
        }

        const currentTime = trackEntry.trackTime;
        const duration = trackEntry.animation.duration;

        if (duration === 0) {
            return true;
        }

        const fps = task.controller.getSpineFPS(task.aniCtrlId, task.spineIndex);
        const currentFrame = Math.floor(currentTime * fps);

        return currentFrame >= task.targetValue;
    }

    /**
     * 啟動 schedule（只需要一個）
     */
    private startSchedule(): void {
        if (this.isScheduleRunning) return;

        // 找一個有效的 controller 作為 schedule 的宿主
        for (const task of this.tasks.values()) {
            if (task.controller?.node?.isValid) {
                this.scheduleHost = task.controller;
                break;
            }
        }

        if (!this.scheduleHost) {
            console.error('[SpineWatchTaskManager] 無法找到有效的 schedule 宿主');
            return;
        }

        this.scheduleHost.schedule(this.updateAllTasks, 0);
        this.isScheduleRunning = true;
    }

    /**
     * 停止 schedule
     */
    private stopSchedule(): void {
        if (!this.isScheduleRunning || !this.scheduleHost) return;

        this.scheduleHost.unschedule(this.updateAllTasks);
        this.isScheduleRunning = false;
        this.scheduleHost = null;
    }

    /**
     * 清除所有任務
     */
    public clearAllTasks(): void {
        this.tasks.clear();
        this.stopSchedule();
    }

    /**
     * 獲取當前任務數量
     */
    public getTaskCount(): number {
        return this.tasks.size;
    }

    /**
     * 檢查是否有正在運行的任務
     */
    public hasRunningTasks(): boolean {
        return this.tasks.size > 0;
    }
}
