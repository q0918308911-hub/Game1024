import { _decorator, Component } from 'cc'
import { CustomAnimationController } from './CustomAnimationController';
import { AnimationPlayInfo } from '../Definitions/AnimationDataOptions';
import { SpineCtrlPropDef, MultiAnimationStateList, AnimationStateType } from './AniStateLists/AnimationPlayStateBase';
import { SpineController } from './SpineController';
import { IStopOptions, StopClearMode } from '../Definitions/IStopOptions';
import { PlaySelector } from '../Definitions/IPlayOptions';
import { MultiSpineControllerProperties, SpineMultiPropertyDef } from './Properties/MultiSpineControllerProperties';

const { ccclass, property } = _decorator;
/**
 * 播放多個spineController的控制器
 * PS:就是同一個prefab裡面掛一堆spineController要一起播放的控制器
 */
@ccclass('MultiSpineController')
export class MultiSpineController extends CustomAnimationController {

    @property({ type: MultiSpineControllerProperties, visible: true, tooltip: 'multiSpine' })
    private _multiSCProperties: MultiSpineControllerProperties = new MultiSpineControllerProperties();

    @property({ tooltip: '回收回到預設狀態,不做動畫本身清除重置<中軟專屬要勾選>' })
    goBackDefaultWithoutDestroy: boolean = false;

    @property({ tooltip: 'prefabKey(用來辨識prefab的)' })
    prefabKey: string = '';//--prefab的key(用來辨識prefab的)
    //--他會依照animationPlayStateList的clipsInfo來決定要播放的動畫
    //@property({ type: MultiAnimationStateList, displayName: 'multiAnimationStateList', visible: true, tooltip: '動畫索引與狀態清單' })
    //protected _animationStateList: MultiAnimationStateList = new MultiAnimationStateList();

    private _mapSpineController: Map<string, SpineController> = new Map();
    private _dirtyFirstOnLoad: boolean = false;
    protected _spineAniCallback?: () => void;
    protected generalAniCompleteCheck: () => void;


    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;
        const propertyList: SpineMultiPropertyDef[] = this._multiSCProperties.spineControllerPropertyList;
        for (const property of propertyList) {
            this._mapSpineController.set(property.key, property.spineController);
        }
        this.init();
    }

    public async testBtnEvent(ev: any, value: PlaySelector): Promise<void> {
        console.log('testBtnEvent:', ev, value);
        //this.playAni(0);
        //this.playAni({ targetName: 'Default' });
        //this.playAni(AnimationStateType.Win);
        await this.playAniInPromise(AnimationStateType.Win);
        //this.changePlayTime(0.3);
        console.log();
    }

    public async testBtnEvent2(ev: any, value: PlaySelector): Promise<void> {
        console.log('testBtnEvent:', ev, value);
        //this.playAni(0);
        //this.playAni({ targetName: 'Default' });
        //this.playAni(AnimationStateType.Win);
        //await this.playAniInPromise(AnimationStateType.Win);
        //this.changePlayTime(0.3);
        this.gotoPlayLastFrame();
        console.log();
    }


    public init(): void {

        if (!this._dirtyFirstOnLoad) return;
        for (const [key, controller] of this._mapSpineController) {
            controller.init();
        }
        this.generalAniCompleteCheck = () => {
            this.onSpineCompleteHandler();
        };
        this.isLoaded = true;
    }

    //--要補替換skin
    public getSpineControllerByKey(key: string): SpineController | null {
        if (this._mapSpineController.has(key)) {
            return this._mapSpineController.get(key) || null;
        }
        return null;
    }

    public getMultiSpineController(): SpineController[] {
        const controllers: SpineController[] = [];
        for (const [key, controller] of this._mapSpineController) {
            controllers.push(controller);
        }
        return controllers;
    }


    public playAniWithAniCtrDef(value: SpineCtrlPropDef): void {

    }


    public pauseAni(): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.pauseAni();
        }
    }

    public resumeAni(): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.resumeAni();
        }
    }

    /**
     * 20251020新增方法
     * @param value 取得播放的動畫資料key
     * @param time 移動到某個時間點開始播放
     */
    public changePlayTime(time: number): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.changePlayTime(time);
        }
    }

    /**
     * 20251217新增方法
     * @param value 
     * @param time 
     */
    public changeSpeed(value: PlaySelector, time: number): void {

        for (const [key, controller] of this._mapSpineController) {
            const spine = controller.spine;

            //--先這樣了20251217
            if (controller) {
                controller.changePlayInfo(value, time);
            }
            /*
            const aniCtrlInfo: SpineCtrlPropDef = controller.getAniPlayDataByPlaySelector(value);
            const ani = spine.findAnimation(aniCtrlInfo.targetName);
            if (!ani) continue;
            const duration = ani.duration;
            const speed = duration / time;
            aniCtrlInfo.timeScale = speed;*/
        }
    }

    /**
     * 20251020新增方法
     * 直接播放到最後一格
     * @param value 
     */
    public gotoPlayLastFrame(value?: PlaySelector): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.gotoPlayLastFrame(value);
        }
    }

    public setAniDataInfo(value: AnimationPlayInfo): void {

    }

    //--20251011-新增直接查詢播放資料的功能(他不會改變當前播放狀態)
    public peakAniDataInfo(value: PlaySelector): AnimationPlayInfo | AnimationPlayInfo[] {

        const playInfos: AnimationPlayInfo[] = [];
        for (const [key, controller] of this._mapSpineController) {
            const aniCtrlInfo: AnimationPlayInfo = controller.peakAniDataInfo(value);
            if (aniCtrlInfo) {
                playInfos.push(aniCtrlInfo);
            }
        }
        return playInfos;
    }

    //============================個別操作========================================

    public getSingleSpineControllerByKey(key: string): SpineController | null {

        if (this._mapSpineController.has(key)) {
            return this._mapSpineController.get(key) || null;
        }
        return null;
    }


    public async playAni(value?: PlaySelector): Promise<void> {
        //--這裡要檢查這一包map裡面有沒有做loop的.沒有送事件,有啥都不送
        let checkLoop: boolean = false;
        for (const [key, controller] of this._mapSpineController) {
            const aniCtrlInfo: SpineCtrlPropDef = controller.getAniPlayDataByPlaySelector(value);
            if (aniCtrlInfo.loop) {
                checkLoop = true;
                break;
            }
        }
        this.isPlaying = true;
        if (checkLoop) {
            for (const [key, controller] of this._mapSpineController) {
                controller.playAni(value);
            }
        } else {
            //--這裡如果沒有loop的就只會播放一次+傳送完成後續動作
            //await this.doRaceMultiControllerPlay(value);

            await this.doMultiControllerPlay(value);
            if (!this.generalAniCompleteCheck) {
                //console.log('checkDebug', this.node.name, value, this.prefabKey);
                this.generalAniCompleteCheck = () => this.onSpineCompleteHandler();
            }
            this.generalAniCompleteCheck();

        }
    }

    public async playSingleAniByKey(key: string, value?: PlaySelector): Promise<void> {

        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                this.isPlaying = true;
                const aniCtrlInfo: SpineCtrlPropDef = controller.getAniPlayDataByPlaySelector(value);
                if (aniCtrlInfo.loop) {
                    controller.playAni(value);

                } else {
                    await this.doSingleControllerPlay(value, controller);
                    this.generalAniCompleteCheck();
                }

            }
        }
    }


    public async playAniWithCallBack(callBack: Function, backDefault?: boolean, value?: PlaySelector): Promise<void> {

        this._spineAniCallback = () => {
            callBack();
            this._spineAniCallback = undefined;
        };
        this.isPlaying = true;
        await this.doMultiControllerPlay(value);
        this.onSpineCompleteHandler();
    }

    public async playSingleAniWithCallBack(key: string, callBack: Function, value?: PlaySelector): Promise<void> {

        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                //controller.playAniWithCallBack(callBack, value);
                this._spineAniCallback = () => {
                    callBack();
                    this._spineAniCallback = undefined;
                };
                this.isPlaying = true;
                await this.doSingleControllerPlay(value, controller);
                this.onSingleSpineCompleteHandler(key);
            }
        }
    }

    public async playAniInPromise(value?: PlaySelector): Promise<void> {

        this.isPlaying = true;
        await this.doMultiControllerPlay(value);
        this.onSpineCompleteHandler();
        return Promise.resolve();
    }

    public async playSingleAniInPromise(key: string, value?: PlaySelector): Promise<void> {

        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {

                this.isPlaying = true;
                await this.doSingleControllerPlay(value, controller);
                this.onSingleSpineCompleteHandler(key);
            }
        }
        return Promise.resolve();
    }

    protected async doRaceMultiControllerPlay(value: PlaySelector): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const [key, controller] of this._mapSpineController) {
            if (controller) {
                //const playInfo= this.getPlayStateBySCKey(key);
                promises.push(controller.playAniInPromise(value));
            }
        }
        await Promise.race(promises);
    }

    protected async doMultiControllerPlay(value: PlaySelector): Promise<void> {

        //console.log('check_value_doMultiControllerPlay:', value);
        const promises: Promise<void>[] = [];
        for (const [key, controller] of this._mapSpineController) {
            if (controller) {
                //const playInfo= this.getPlayStateBySCKey(key);
                //--test
                /*
                const playInfo: SpineCtrlPropDef = controller.peakAniDataInfo(value) as SpineCtrlPropDef;
                const targetNodeId=controller.targetNodeId;
                const spAni=controller.spine.findAnimation(playInfo.targetName);
                const spDur= spAni?spAni.duration:0;
                console.log();
                */
                //--test

                promises.push(controller.playAniInPromise(value));
            }
        }
        await Promise.all(promises);

    }

    protected async doSingleControllerPlay(selector: PlaySelector, controller: SpineController): Promise<void> {

        await controller.playAniInPromise(selector);
    }


    //--多的
    /*
    protected getPlayStateBySCKey(key:string): AnimationStateType 
    {
        for(let item of this._animationStateList.clipsInfo)
        {
            if(item.spineControllerKey== key)
            {
                return item.AniStateType;
            }
        }
        return AnimationStateType.Default;
    }*/

    //====================停止/清除系列============================================================================
    /**
     * <這邊不會掛上監聽就單純的for中軟美術切回default的動畫狀態>
     * 播放動畫預設狀態,有動畫播放
     */
    public goBackToDefault(flag: boolean = true): void {
        if (flag) {
            this.onSpineCompleteHandler();
        }
        this.isPlaying = true;
        for (const [key, controller] of this._mapSpineController) {
            const aniCtrlInfo: SpineCtrlPropDef = controller.getAniPlayDataByPlaySelector(AnimationStateType.Default);
            controller.goBackToDefault(flag);
        }
    }

    //--結束流程使用
    public onAniComplete(): void {
        //--清除流程
        this.safeResolveSpineCallback();
        //this.safeResolveSpinePromise();
        this.forceSafeResolveSpinePromise();
        //this.generalAniCompleteCheck = null;
    }

    public onSingleAniComplete(key: string): void {
        for (const [k, controller] of this._mapSpineController) {
            if (k === key) {
                controller.forceSafeResolveSpineCallback();
                controller.forceSafeResolveSpinePromise();
                break;
            }
        }
    }

    public beforeDestroy(): void {
        this.forceToDoBeforeDestroy();
        this.generalAniCompleteCheck = null;
    }
    //--回pool前會呼叫
    public resetData(): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.resetData();
        }
        this.onAniComplete();//-拔掉所有的promise/callback
        this.forceToDoBeforeDestroy(false);//--針對自己做就好了
        this.generalAniCompleteCheck = null;//-進到pool前清掉,拿出來會在init
        this.tokenID = '';//--單一的識別碼
        this.slotMachineIndexInfo = null;
        this.isPlaying = false;
        this.groupID = [];
    }

    public stopAni(): void {

        for (const [key, controller] of this._mapSpineController) {
            controller.stopAni();
        }
        this.onSpineCompleteHandler();
    }

    public stopSingleAniByKey(key: string): void {

        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                controller.stopAni();
                this.onSingleSpineCompleteHandler(key);
            }
        }
    }


    public stopNow(): void {

        for (const [key, controller] of this._mapSpineController) {
            controller.stopNow();
        }
        this.onSpineCompleteHandler();
    }

    public stopNowByKey(key: string): void {
        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                controller.stopNow();
                this.onSingleSpineCompleteHandler(key);
            }
        }
    }


    public stopWith(opt: IStopOptions = {}): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.stopWith(opt);
        }
        if (opt.resolveCallback) {
            this.safeResolveSpineCallback();
        }
        if (opt.resolvePromises) {
            this.forceSafeResolveSpinePromise();
        }
    }

    public stopWithSingle(key: string, opt: IStopOptions = {}): void {
        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                controller.stopWith(opt);
            }

            if (opt.resolveCallback) {
                this.safeResolveSpineCallback();
            }
        }

    }

    public stopAndRecycle(): void {

        for (const [key, controller] of this._mapSpineController) {
            controller.stopAndRecycle();
        }
        this.onSpineCompleteHandler();
    }


    public stopPromiseAni(): void {

        for (const [key, controller] of this._mapSpineController) {
            controller.stopPromiseAni();
        }
        this.onSpineCompleteHandler();
    }

    public stopSinglePromiseAniByKey(key: string): void {
        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                controller.stopPromiseAni();
                this.onSingleSpineCompleteHandler(key);
            }
        }
    }


    public forceToStopAniByEmpty(): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.forceToStopAniByEmpty();
        }
        this.onSpineCompleteHandler();
    }

    public forceToStopSingleAniByEmpty(key: string): void {
        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                controller.forceToStopAniByEmpty();
                this.onSingleSpineCompleteHandler(key);
            }
        }
    }

    public forceToStopAni(): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.forceToStopAni();
        }
        this.onSpineCompleteHandler();
    }

    public forceToStopSingleAniByKey(key: string): void {
        if (this._mapSpineController.has(key)) {
            const controller = this._mapSpineController.get(key);
            if (controller) {
                controller.forceToStopAni();
                this.onSingleSpineCompleteHandler(key);
            }
        }
    }

    public forceToDoBeforeDestroy(flag: boolean = true): void {

        if (flag) {
            //--外部強行呼叫使用的
            for (const [key, controller] of this._mapSpineController) {
                controller.forceToDoBeforeDestroy();
            }
            this.onSpineCompleteHandler();
        }

        if (this.goBackDefaultWithoutDestroy) {
            this.goBackToDefault(false);
        }
    }



    //--銷毀前處理掉promise resolve避免沒銷毀的pending promise
    /*
    protected safeResolveSpinePromise(resolve?: () => void): void {
        
        if (resolve) {
            resolve();
        } else if (this._spineAniResolvePromise) {
            this._spineAniResolvePromise();
        }
        this._spineAniResolvePromise = null;
    }*/

    public forceSafeResolveSpinePromise(): void {
        for (const [key, controller] of this._mapSpineController) {
            controller.forceSafeResolveSpinePromise();
        }
    }

    public forceSingleSafeResolveSpinePromise(key: String): void {
        for (const [k, controller] of this._mapSpineController) {
            if (k === key) {
                controller.forceSafeResolveSpinePromise();
                break;
            }
        }
    }

    //--銷毀前處理掉spine complete callback
    protected safeResolveSpineCallback(): void {

        this._spineAniCallback?.();
        this._spineAniCallback = undefined;
    }

    protected onSpineCompleteHandler(): void {
        //--這裡可以做判斷要不要進入清理流程
        this.isPlaying = false;
        this.onAniComplete();
    }

    protected onSingleSpineCompleteHandler(key: string): void {
        //--這裡可以做判斷要不要進入清理流程
        this.isPlaying = false;
        this.onSingleAniComplete(key);
    }


    public onObjInstance(): void {

    }
    //-不能用onDestroy這個字component拿去用了
    public onAfterDestroy(): void {

    }


}

