import { _decorator, sp } from "cc";
import { CustomAnimationController } from "./CustomAnimationController";
import { AniMultiPropertyDef, MultiAniControllerProperties } from "./Properties/MultiAniControllerProperties";
import { SpineController } from "./SpineController";
import { AnimationController } from "./AnimationController";
import { PlaySelector } from "../Definitions/IPlayOptions";
import { AniCtrlInfoDef } from "./AniStateLists/AnimationPlayStateBase";
import { AnimationPlayInfo } from "../Definitions/AnimationDataOptions";
import { FindComponent } from "../../FindComponent";
import { AniSysTools } from "../AniTools/AniSysTools";
import { SpineWatchTaskManager } from "../TaskManager/SpineWatchTaskManager";
import { SpineWatchTask } from "../TaskManager/SpineWatchTask";

const { ccclass, property } = _decorator;


@ccclass('MultiAniController')
export class MultiAniController extends CustomAnimationController {


    @property({ type: MultiAniControllerProperties, visible: true, tooltip: 'multiSpine' })
    private _multiAniCtrlsProperties: MultiAniControllerProperties = new MultiAniControllerProperties();

    @property({ tooltip: 'prefabKey(用來辨識prefab的)' })
    prefabKey: string = '';//--prefab的key(用來辨識prefab的)

    private _mapAniController: Map<string, AnimationController> = new Map();
    private _dirtyFirstOnLoad: boolean = false;
    protected _spineAniCallback?: () => void;
    protected generalAniCompleteCheck: () => void;

    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;
        const propertyList: AniMultiPropertyDef[] = this._multiAniCtrlsProperties.aniControllerPropertyList;
        //--擠到map裡面
        for (const property of propertyList) {
            this._mapAniController.set(property.key, property.aniController);
        }
        this.init();
    }

    public init(): void {

        if (!this._dirtyFirstOnLoad) return;
        for (const [key, controller] of this._mapAniController) {
            controller.init();
        }
        this.generalAniCompleteCheck = () => {
            this.onSpineCompleteHandler();
        };
        this.isLoaded = true;
    }

    public async testBtnEvent(): Promise<void> {

        //his.resumeAniById('Root_AniSymbol',{  aniState: '7'});
        //await this.playAniInPromiseById('Root_AniSymbol',{ aniState: '7' });
        this.playAniById('Root_AniSymbol', { value: { aniState: '2' } });
        this.playAniById('Root_SpAward', { value: { aniState: '2' } });
        await this.waitUntilSpinePercentage('Root_SpAward', 0, 70);
        //await this.waitUntilSpineFrame('Root_SpAward', 0, 40);
        console.log('第一個 Spine 已播放到 90%');

        console.log();
    }

    public async test2BtnEvent(): Promise<void> {

        //this.stopAni(true);--就是很單純的停止
        //this.stopNow();//--會解掉resolve的promise與callback
        //this.playAni({ aniState: 'Transfer' });
        //this.stopAni();
        //this.stopPromiseAni(true);
        //this.playAni({ aniState: 'In' });
        //this.playAni(AnimationStateType.Default);
        //this.changePlayTime(0.3);
        //this.playAniInPromiseById('Root_AniSymbol',{ aniState: '7' });
        //this.gotoAndStopByTimeById('Root_AniSymbol',{value: { aniState: '7' }, time: 0});
        //this.gotoAndPlayByTimeById('Root_AniSymbol',{value: { aniState: '2' }, time: 0.9});
        //this.gotoAndStopByFrameById('Root_AniSymbol',{value: { aniState: '7' }, frame: 1});
        //this.gotoAndStopByFrameById('Root_SpAward',{value: { aniState: '7' }, frame: 1});
        await this.playAniInPromiseById('Root_AniSymbol', { aniState: '3' });
        console.log();
    }

    //================以下為透過animation控制的spine相關的方法(非spineController方法)====================================================================================
    /**
     * PS-
     * 1.因為AEP已經透過animation timeline去強控制spine的播放
     * 2.所以這邊的spine相關方法是提供給程式端去監聽spine的播放進度使用
     * 3.並不建議透過這些方法去控制spine的播放行為
     */
    /**
     * 等待指定 AnimationController 內的 Spine 播放到指定百分比（使用集中式任務管理器）
     * @param aniCtrlId AnimationController 的 ID
     * @param spineIndex Spine 在 aepSpines 陣列中的索引
     * @param percentage 目標百分比 (0-100)
     * @param trackIndex Spine 軌道索引，默認為 0
     * @returns Promise<void>
     * @example
     * // 美術透過 AnimationController 播放動畫
     * this.playAniById('Root_SpAward', { value: { aniState: '2' } });
     * 
     * // 程式監聽第一個 Spine 的播放進度
     * await this.waitUntilSpinePercentage('Root_SpAward', 0, 50);
     * console.log('第一個 Spine 已播放到 50%');
     */
    public async waitUntilSpinePercentage(
        aniCtrlId: string,
        spineIndex: number,
        percentage: number,
        trackIndex: number = 0
    ): Promise<void> {
        // 參數驗證
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            console.error(`[MultiAniController] 無效的百分比: ${percentage}`);
            return Promise.resolve();
        }

        const taskId = `${this.node.uuid}_${aniCtrlId}_${spineIndex}_${Date.now()}`;
        const manager = SpineWatchTaskManager.getInstance();

        return new Promise<void>((resolve) => {
            const task: SpineWatchTask = {
                id: taskId,
                controller: this,
                aniCtrlId,
                spineIndex,
                trackIndex,
                checkType: 'percentage',
                targetValue: percentage,
                resolve,
                epsilon: 0.5
            };

            // 註冊任務到管理器
            manager.registerTask(task);

            // 安全機制：動畫完成時自動取消任務
            const aniTarget = this._mapAniController.get(aniCtrlId);
            if (aniTarget?.isAEP_SPINE && aniTarget.aepSpines?.[spineIndex]) {
                const spine = aniTarget.aepSpines[spineIndex];
                spine.setCompleteListener((entry: sp.spine.TrackEntry) => {
                    if (entry.trackIndex === trackIndex) {
                        manager.cancelTask(taskId);
                        resolve();
                    }
                });
            }
        });
    }



    /**
     * 等待指定 AnimationController 內的 Spine 播放到指定影格（使用集中式任務管理器）
     * @param aniCtrlId AnimationController 的 ID
     * @param spineIndex Spine 在 aepSpines 陣列中的索引
     * @param targetFrame 目標影格數
     * @param trackIndex Spine 軌道索引，默認為 0
     * @returns Promise<void>
     */
    public async waitUntilSpineFrame(
        aniCtrlId: string,
        spineIndex: number,
        targetFrame: number,
        trackIndex: number = 0
    ): Promise<void> {
        // 參數驗證
        if (isNaN(targetFrame) || targetFrame < 0) {
            console.error(`[MultiAniController] 無效的影格數: ${targetFrame}`);
            return Promise.resolve();
        }

        const taskId = `${this.node.uuid}_${aniCtrlId}_${spineIndex}_${Date.now()}`;
        const manager = SpineWatchTaskManager.getInstance();

        return new Promise<void>((resolve) => {
            const task: SpineWatchTask = {
                id: taskId,
                controller: this,
                aniCtrlId,
                spineIndex,
                trackIndex,
                checkType: 'frame',
                targetValue: targetFrame,
                resolve
            };

            // 註冊任務到管理器
            manager.registerTask(task);

            // 安全機制：動畫完成時自動取消任務
            const aniTarget = this._mapAniController.get(aniCtrlId);
            if (aniTarget?.isAEP_SPINE && aniTarget.aepSpines?.[spineIndex]) {
                const spine = aniTarget.aepSpines[spineIndex];
                spine.setCompleteListener((entry: sp.spine.TrackEntry) => {
                    if (entry.trackIndex === trackIndex) {
                        manager.cancelTask(taskId);
                        resolve();
                    }
                });
            }
        });
    }

    /**
     * 多個 MultiAniController 的 Spine 播放到指定百分比
     * 使用集中式任務管理器，只需一個 schedule 監聽所有目標
     * @param targets 目標陣列
     * @returns Promise<void> 當所有目標都達到時 resolve
     * @example
     * const targets = aniGroups.map(group => ({
     *   controller: group.aniComponent as MultiAniController,
     *   aniCtrlId: 'Root_SpAward',
     *   spineIndex: 0,
     *   percentage: 90,
     *   trackIndex: 0
     * }));
     * await MultiAniController.waitUntilMultiSpinePercentage(targets);
     */
    public static async waitUntilMultiSpinePercentage(
        targets: Array<{
            controller: MultiAniController;
            aniCtrlId: string;
            spineIndex: number;
            percentage: number;
            trackIndex?: number;
        }>
    ): Promise<void> {
        if (!targets || targets.length === 0) {
            return Promise.resolve();
        }

        const manager = SpineWatchTaskManager.getInstance();
        const promises: Promise<void>[] = [];

        for (const target of targets) {
            const taskId = `${target.controller.node.uuid}_${target.aniCtrlId}_${target.spineIndex}_${Date.now()}_${Math.random()}`;

            const promise = new Promise<void>((resolve) => {
                const task: SpineWatchTask = {
                    id: taskId,
                    controller: target.controller,
                    aniCtrlId: target.aniCtrlId,
                    spineIndex: target.spineIndex,
                    trackIndex: target.trackIndex ?? 0,
                    checkType: 'percentage',
                    targetValue: target.percentage,
                    resolve,
                    epsilon: 0.5
                };

                // 共用一個 schedule）
                manager.registerTask(task);

                // 保底機制：動畫完成時自動取消任務
                const aniTarget = target.controller.getAniCtrlById(target.aniCtrlId);
                if (aniTarget?.isAEP_SPINE && aniTarget.aepSpines?.[target.spineIndex]) {
                    const spine = aniTarget.aepSpines[target.spineIndex];
                    spine.setCompleteListener((entry: sp.spine.TrackEntry) => {
                        if (entry.trackIndex === (target.trackIndex ?? 0)) {
                            manager.cancelTask(taskId);
                            resolve();
                        }
                    });
                }
            });

            promises.push(promise);
        }

        await Promise.all(promises);

    }

    /**
     * 多個 MultiAniController 的 Spine 播放到指定影格
     * 使用集中式任務管理器，只需一個 schedule 監聽所有目標
     * @param targets 目標陣列
     * @returns Promise<void> 當所有目標都達到時 resolve
     */
    public static async waitUntilMultiSpineFrame(
        targets: Array<{
            controller: MultiAniController;
            aniCtrlId: string;
            spineIndex: number;
            targetFrame: number;
            trackIndex?: number;
        }>
    ): Promise<void> {
        if (!targets || targets.length === 0) {
            return Promise.resolve();
        }

        const manager = SpineWatchTaskManager.getInstance();
        const promises: Promise<void>[] = [];

        for (const target of targets) {
            const taskId = `${target.controller.node.uuid}_${target.aniCtrlId}_${target.spineIndex}_${Date.now()}_${Math.random()}`;

            const promise = new Promise<void>((resolve) => {
                const task: SpineWatchTask = {
                    id: taskId,
                    controller: target.controller,
                    aniCtrlId: target.aniCtrlId,
                    spineIndex: target.spineIndex,
                    trackIndex: target.trackIndex ?? 0,
                    checkType: 'frame',
                    targetValue: target.targetFrame,
                    resolve
                };

                // 所有任務都註冊到同一個管理器（共用一個 schedule）
                manager.registerTask(task);

                // 安全機制：動畫完成時自動取消任務
                const aniTarget = target.controller.getAniCtrlById(target.aniCtrlId);
                if (aniTarget?.isAEP_SPINE && aniTarget.aepSpines?.[target.spineIndex]) {
                    const spine = aniTarget.aepSpines[target.spineIndex];
                    spine.setCompleteListener((entry: sp.spine.TrackEntry) => {
                        if (entry.trackIndex === (target.trackIndex ?? 0)) {
                            manager.cancelTask(taskId);
                            resolve();
                        }
                    });
                }
            });

            promises.push(promise);
        }

        await Promise.all(promises);
    }

    /**
     * 獲取指定 Spine 的當前播放百分比
     * @param aniCtrlId AnimationController 的 ID
     * @param spineIndex Spine 在陣列中的索引
     * @param trackIndex 軌道索引
     * @returns 百分比 (0-100)，失敗返回 0
     */
    public getSpinePercentage(
        aniCtrlId: string,
        spineIndex: number,
        trackIndex: number = 0
    ): number {
        const aniTarget = this._mapAniController.get(aniCtrlId);
        if (!aniTarget?.isAEP_SPINE) return 0;

        if (!aniTarget.aepSpines || spineIndex >= aniTarget.aepSpines.length || spineIndex < 0) {
            return 0;
        }

        const spine = aniTarget.aepSpines[spineIndex];
        const trackEntry = spine?.getCurrent(trackIndex);
        if (!trackEntry) return 0;

        const duration = trackEntry.animation.duration;
        if (duration === 0) return 0;

        return Math.min(100, Math.max(0, (trackEntry.trackTime / duration) * 100));
    }

    /**
     * 獲取指定 AnimationController 內的 Spine 數量
     * @param aniCtrlId AnimationController 的 ID
     * @returns Spine 數量
     */
    public getSpineCount(aniCtrlId: string): number {
        const aniTarget = this._mapAniController.get(aniCtrlId);
        if (!aniTarget?.isAEP_SPINE) return 0;
        return aniTarget.aepSpines?.length ?? 0;
    }

    // ...existing code...

    /**
     * 獲取指定 Spine 的 FPS
     * @param aniCtrlId AnimationController 的 ID
     * @param spineIndex Spine 在陣列中的索引
     * @returns FPS 值，失敗返回 30（默認值）
     */
    public getSpineFPS(
        aniCtrlId: string,
        spineIndex: number
    ): number {
        const aniTarget = this._mapAniController.get(aniCtrlId);
        if (!aniTarget?.isAEP_SPINE) return 30;

        if (!aniTarget.aepSpines || spineIndex >= aniTarget.aepSpines.length || spineIndex < 0) {
            return 30;
        }

        const spine = aniTarget.aepSpines[spineIndex];
        if (!spine?.isValid) return 30;

        // 從 SkeletonData 獲取實際 FPS
        const skeletonData = spine.skeletonData;
        if (skeletonData) {
            const runtimeData = skeletonData.getRuntimeData();
            return runtimeData?.fps ?? 30;
        }

        return 30;
    }

    /**
     * 獲取指定 Spine 的當前播放影格
     * @param aniCtrlId AnimationController 的 ID
     * @param spineIndex Spine 在陣列中的索引
     * @param trackIndex 軌道索引
     * @returns 當前影格數，失敗返回 0
     */
    public getCurrentSpineFrame(
        aniCtrlId: string,
        spineIndex: number,
        trackIndex: number = 0
    ): number {
        const aniTarget = this._mapAniController.get(aniCtrlId);
        if (!aniTarget?.isAEP_SPINE) return 0;

        if (!aniTarget.aepSpines || spineIndex >= aniTarget.aepSpines.length || spineIndex < 0) {
            return 0;
        }

        const spine = aniTarget.aepSpines[spineIndex];
        const trackEntry = spine?.getCurrent(trackIndex);
        if (!trackEntry) return 0;

        // 使用實際 FPS
        const fps = this.getSpineFPS(aniCtrlId, spineIndex);
        const currentTime = trackEntry.trackTime;

        return Math.floor(currentTime * fps);
    }

    /**
     * 獲取指定 Spine 動畫的總影格數
     * @param aniCtrlId AnimationController 的 ID
     * @param spineIndex Spine 在陣列中的索引
     * @param trackIndex 軌道索引
     * @returns 總影格數，失敗返回 0
     */
    public getTotalSpineFrames(
        aniCtrlId: string,
        spineIndex: number,
        trackIndex: number = 0
    ): number {
        const aniTarget = this._mapAniController.get(aniCtrlId);
        if (!aniTarget?.isAEP_SPINE) return 0;

        if (!aniTarget.aepSpines || spineIndex >= aniTarget.aepSpines.length || spineIndex < 0) {
            return 0;
        }

        const spine = aniTarget.aepSpines[spineIndex];
        const trackEntry = spine?.getCurrent(trackIndex);
        if (!trackEntry) return 0;

        // 使用實際 FPS
        const fps = this.getSpineFPS(aniCtrlId, spineIndex);
        const duration = trackEntry.animation.duration;

        return Math.floor(duration * fps);
    }

    // ...existing code...



    public async playAniInPromiseById(id: string, value: PlaySelector): Promise<void> {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            await aniTarget.playAniInPromise(value);
            console.log();
        } else {
            console.log();
        }
    }

    public playAniById(id: string, info: { value: PlaySelector }): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.playAni(info.value);
        }
    }

    public playAniWithCallBackById(id: string, info: { callBack: Function, backDefault?: boolean, value?: PlaySelector }): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.playAniWithCallBack(info.callBack, info.backDefault, info.value);
        }
    };

    public gotoPlayLastFrameById(id: string, value?: PlaySelector): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.gotoPlayLastFrame(value);
        }
    }


    public gotoAndPlayByTimeById(id: string, info: { value: PlaySelector, time: number }): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.gotoAndPlayByTime(info.value, info.time);
        }
    }

    public gotoAndStopByTimeById(id: string, info: { value: PlaySelector, time: number }): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.gotoAndStopByTime(info.value, info.time);
        }
    }

    public gotoAndStopByFrameById(id: string, info: { value: PlaySelector, frame: number }): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.gotoAndStopByFrame(info.value, info.frame);
        }
    }

    public resumeAniById(id: string, value?: PlaySelector): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.resumeAni(value);
        }
    }







    //======================================================================
    public getAniCtrlById(id: string): AnimationController | null {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            return aniTarget;
        }
        return null;
    }

    public override resetData(): void {

        for (const [key, controller] of this._mapAniController) {
            controller.resetData();
        }
    }

    public override beforeDestroy(): void {

        for (const [key, controller] of this._mapAniController) {
            controller.beforeDestroy();
        }
    }

    public override onAfterDestroy(): void {

        for (const [key, controller] of this._mapAniController) {
            controller.onAfterDestroy();
        }
    }



    public changeSpeedWithAepById(id: string, info: { value: PlaySelector, time: number, spTargetName: string[] }): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.changeSpeedWithAep(info.value, info.time, info.spTargetName);
        }
    }

    public setAniDataInfoById(id: string, value: AnimationPlayInfo): void {

        const aniTarget = this._mapAniController.get(id);
        if (aniTarget) {
            aniTarget.setAniDataInfo(value);
        }
    }
    /*
    public playAniWithAniCtrDefById(id:string,value:AniCtrlInfoDef): void { 
        const aniTarget= this._mapAniController.get(id);
        if(aniTarget){
            aniTarget.playAniWithAniCtrlDef(value);
        }
    }*/

    protected onSpineCompleteHandler(): void {
        //--這裡可以做判斷要不要進入清理流程
        this.isPlaying = false;
        //this.onAniComplete();
    }

}