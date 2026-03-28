// ============= 新增文件: AnimationWatchTaskManager.ts =============
import { AnimationController } from "../Components/AnimationController";
import { IAnimationWatchTask } from "./IAnimationWatchTask";

/**
 * Animation 監聽任務管理器（靜態單例）
 * 集中管理所有 Animation 動畫的監聽任務，使用單一 schedule 提升效能
 */
export class AnimationWatchTaskManager {
    private static instance: AnimationWatchTaskManager;
    private tasks: Map<string, IAnimationWatchTask> = new Map();
    private scheduleHost: AnimationController | null = null;
    private isScheduleRunning: boolean = false;

    private constructor() { }

    /**
     * 獲取單例實例
     */
    public static getInstance(): AnimationWatchTaskManager {
        if (!AnimationWatchTaskManager.instance) {
            AnimationWatchTaskManager.instance = new AnimationWatchTaskManager();
        }
        return AnimationWatchTaskManager.instance;
    }

    /**
     * 註冊一個監聽任務
     * @param task 要註冊的任務
     */
    public registerTask(task: IAnimationWatchTask): void {
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
                case 'time':  
                isCompleted = this.checkTimeTask(task);
                    break;
                default:
                    console.warn(`[AnimationWatchTaskManager] 未知的檢查類型: ${task.checkType}`);
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
     * 檢查時間類型的任務-有防時間快轉跳過
     * @param task 要檢查的任務
     * @returns 是否已完成
     */
    private checkTimeTask(task: IAnimationWatchTask): boolean {
        
        if (!task.controller?.node?.isValid) {
            return true;
        }

        const aniState = task.controller.getCurrentAnimationState();
        if (!aniState) {
            return false;
        }

        const currentTime = aniState.time;
        const epsilon = task.epsilon ?? 0.016;
        
        // 改進：檢查是否跨越目標點
        const lastTime = task.lastCheckedTime ?? 0;
        const targetTime = task.targetValue;
        
        // 更新最後檢查時間
        task.lastCheckedTime = currentTime;
        
        // 檢查：上次 < 目標 <= 現在（跨越） 或 現在 >= 目標（已到達）
        const crossed = lastTime < targetTime && currentTime >= targetTime - epsilon;
        const reached = currentTime >= targetTime - epsilon;
        
        return crossed || reached;
    }

    /**
     * 檢查百分比類型的任務（防止跳過）
     * @param task 要檢查的任務
     * @returns 是否已完成
     */
    private checkPercentageTask(task: IAnimationWatchTask): boolean {
        
        if (!task.controller?.node?.isValid) {
            return true;
        }

        const aniState = task.controller.getCurrentAnimationState();
        if (!aniState) {
            return false;
        }

        const currentTime = aniState.time;
        const duration = aniState.duration;

        if (duration === 0) {
            return true;
        }

        const currentPercentage = (currentTime / duration) * 100;
        const epsilon = task.epsilon ?? 0.5;
        
        // 改進：追蹤上次百分比
        const lastTime = task.lastCheckedTime ?? 0;
        const lastPercentage = (lastTime / duration) * 100;
        const targetPercentage = task.targetValue;
        
        task.lastCheckedTime = currentTime;
        
        // 檢查跨越或已到達
        const crossed = lastPercentage < targetPercentage && currentPercentage >= targetPercentage - epsilon;
        const reached = currentPercentage >= targetPercentage - epsilon;
        
        return crossed || reached;
    }

    /**
     * 檢查影格類型的任務（防止跳過）
     * @param task 要檢查的任務
     * @returns 是否已完成
     */
    private checkFrameTask(task: IAnimationWatchTask): boolean {
        if (!task.controller?.node?.isValid) {
            return true;
        }

        const aniState = task.controller.getCurrentAnimationState();
        if (!aniState) {
            return false;
        }

        const currentTime = aniState.time;
        const duration = aniState.duration;

        if (duration === 0) {
            return true;
        }

        const fps = task.controller.frameRate;
        const currentFrame = Math.floor(currentTime * fps);
        
        // 改進：追蹤上次影格
        const lastTime = task.lastCheckedTime ?? 0;
        const lastFrame = Math.floor(lastTime * fps);
        const targetFrame = task.targetValue;
        
        task.lastCheckedTime = currentTime;
        
        // 檢查跨越或已到達
        const crossed = lastFrame < targetFrame && currentFrame >= targetFrame;
        const reached = currentFrame >= targetFrame;
        
        return crossed || reached;
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
            console.error('[AnimationWatchTaskManager] 無法找到有效的 schedule 宿主');
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