import { _decorator, Component, Node } from 'cc';
import { IAnimationControl } from '../Definitions/IAnimationControl';
import { ParticleExtension } from './ParticleExtension';
import { AnimationPlayInfo } from '../Definitions/AnimationDataOptions';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { AniCtrlInfoDef } from './AniStateLists/AnimationPlayStateBase';
import { PlaySelector } from '../Definitions/IPlayOptions';

const { ccclass, property } = _decorator;

@ccclass('CustomAnimationController')
export class CustomAnimationController extends Component implements IAnimationControl {
    //--PS這裡不要用抽象類別..查找工具是指定可以實例化的component
    isLoaded: boolean;//--是否已經載入完成(準備完成資料初始化動作)
    tokenID: string;//--單一的識別碼
    prefabKey: string;//--prefab的key
    slotMachineIndexInfo?: IReelInfo;
    groupID: number[];//--會有同一個物件在不同的group裡面(第四軸重複的)
    isPlaying: boolean;
    particleSystem: ParticleExtension;
    goBackDefaultWithoutDestroy: boolean;
    keep: boolean;//--不刪除且持續留在場景中


    public init(): void {

    }
    public onObjInstance(): void {

    }

    public onAfterDestroy(): void { }
    public onAniComplete(): void { }
    public goBackToDefault(flag: boolean = true): void { }
    public stopNow(backDefault: boolean = false): void { }
    public stopAni(backDefault?: boolean): void { }
    public stopPromiseAni(backDefault?: boolean): void { }
    public pauseAni(): void { }
    public resumeAni(): void { }
    public setAniDataInfo(value: AnimationPlayInfo): void { }
    public beforeDestroy(): void { }
    public resetData(): void { }
    public playAniWithAniCtrDef(value: AniCtrlInfoDef): void { }
    public playAni(value?: PlaySelector): void { }
    public playAniWithCallBack(callBack: Function, backDefault?: boolean, value?: PlaySelector): void { };
    // Implementation here
    public playAniInPromise(value?: PlaySelector): Promise<void> {
        return null;
    }
    //--20251011-新增直接查詢播放資料的功能(他不會改變當前播放狀態)
    public peakAniDataInfo(value: PlaySelector): AnimationPlayInfo | AnimationPlayInfo[] {
        return null;
    }
    //-不能用onDestroy這個字component拿去用了
    /*
    public onAfterDestroy(): void
    abstract onAniComplete(): void;
    abstract stopAni(backDefault?: boolean): void;//--是否回到預設狀態動畫,預設=false
    abstract stopPromiseAni(backDefault?: boolean): void;//--強制中止promise動畫(ex:表演到一半的時候直接停止進行下面的動作(中斷輪播之類的))
    abstract pauseAni(): void
    abstract resumeAni(): void
    abstract setAniDataInfo(value: AnimationPlayInfo): void
    abstract beforeDestroy(): void
    abstract resetData(): void
    abstract playAniWithAniCtrDef(value: AniCtrlInfoDef): void
    abstract playAni(value?: PlaySelector): void
    abstract playAniWithCallBack(callBack: Function, backDefault?: boolean, value?: PlaySelector): void;
    // Implementation here
    abstract playAniInPromise(value?: PlaySelector): Promise<void>
    */

}


