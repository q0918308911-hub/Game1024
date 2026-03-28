import { AnimationPlayInfo } from './AnimationDataOptions';
import { AniCtrlInfoDef } from '../Components/AniStateLists/AnimationPlayStateBase';
//import { ParticleReset } from 'db://assets/Scripts/Utils/ParticleReset';
import { IBasicPoolObjComponent } from '../../ObjectPoolManager/Definitions/IBasicPoolObject';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { Component } from 'cc';
import { PlaySelector } from './IPlayOptions';
import { ParticleReset } from 'db://assets/Scripts/ModuleEntry';

export interface IAnimationControl extends IBasicPoolObjComponent {

    tokenID: string;//--單一的識別碼
    isLoaded: boolean;//--是否已經載入完成(準備完成資料初始化動作)
    prefabKey?: string;//--如果是從prefab實例化的話,會有這個key
    slotMachineIndexInfo?: IReelInfo;
    groupID: number[];//--會有同一個物件在不同的group裡面(第四軸重複的)
    isPlaying: boolean;
    particleSystem: ParticleReset;
    goBackDefaultWithoutDestroy: boolean;//--是否回到預設狀態不銷毀(預設false,如果是true的話會在播放完動畫後回到預設狀態)
    init: () => void;
    goBackToDefault(flag?: boolean): void
    onAniComplete: (backDefault?: boolean) => void;
    stopAni(backDefault?: boolean): void;//--是否回到預設狀態動畫,預設=false
    stopPromiseAni(backDefault?: boolean): void;//--強制中止promise動畫(ex:表演到一半的時候直接停止進行下面的動作(中斷輪播之類的))
    pauseAni(): void;
    resumeAni(): void;
    setAniDataInfo(value: AnimationPlayInfo): void;//--透過此方法來設定播放屬性
    stopNow(backDefault?: boolean): void;//--interface不能直接賦值(backDefault: boolean = false),只能透過可選?XX來做
    playAni(value?: PlaySelector): Promise<void> | void;
    playAniWithAniCtrDef(value: AniCtrlInfoDef): void;
    playAniWithCallBack(callBack: Function, backDefault?: boolean, value?: PlaySelector): void;
    playAniInPromise(value?: PlaySelector): Promise<void>;
    peakAniDataInfo(value: PlaySelector): AnimationPlayInfo | AnimationPlayInfo[];//---查找播放資訊
}






