import { Vec3 } from "cc";
import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";

export const DYN_NODE_PROPERTIES = {
    PREFAB_ID: 'prefabId',
    TOKEN_ID: 'tokenId',
    GROUP_ID: 'groupId',
    SYMBOL_ICON_INFO: 'symbolIconInfo',
    ANIMATION_CTRL: 'animationCtrl',//--減少每次find的消耗
    ADDED: 'prefabAdded',//---被創造過了(回收銷毀)
    LOCKED: 'locked',//--鎖定軸
    SWITCH: 'switchPos',//--改變位置(由腳往上長的,且最後一張是補牌)
    READY_HAND_STATUS: 'readyHandStatus',//--聽牌狀態
    FAST_MODE: 'fastMode',//--快速模式
    WHOLE_BOARD_READY_HAND: 'wholeBoardReadyHand',//--整個盤面有任意軸聽牌
    PLAY_COUNT: 'playCount',//--播放次數--沒用到
    IS_PLAYING_EXPECT: 'playingExpect',//--是否正在播放聽牌動畫
    OTHER: 'other'//--任意資料---因為這個資料被汙染了..showProcess有再用
}

//--用來記錄for slotMachine的索引資料--
//--20250812-使用IReelInfo取代原先的SlotMachineIndexInfo
//--20250812-GroupAniData取代為interface原先的type(被拔出去給全遊戲使用)
//--20250813-playIAniData取代為interface原先是type
export interface playIAniData {

    prefabKey: string,//--改名較好辨識(用來抽物件池物物件的key)
    tokenID: string,//--這個是用來識別這個prefabNode的唯一識別碼
    groupID: number,//--會有同一個物件在不同的group裡面(第四軸重複的)
    containerNodeId?: string,//--這個是用來放置prefab的node id
    duplicateTokenId?: string,//--重複的tokenID
    wPos?: Vec3,//--要把gameIcon的位置傳進來(要轉換成世界座標)
    aniInfo?: AnimationPlayInfo //--(聯合型別)這個是用來設定要播放的動畫資料
    SymbolIconInfoData?: IReelInfo,//--這個是用來設定要播放的<群組>動畫資料
    multiAniInfo?: AnimationPlayInfo[],
    otherData?: any//--其他的資料..自己塞吧
}

//--基礎共用的播放定義屬性
export interface BaseAnimationParams {
    repeatCount?: number;
    targetName: string;
    useDefault: boolean;
    useCompleteListen?: boolean;
    eventFrameType?: string;//--20250909--for eventFrame type
};

//--for animation
//--animation 特有的參數...

export interface AnimationPlayParams extends BaseAnimationParams {
    wrapMode?: number;
    speed?: number;
    delay?: number;
    duration?: number;
    //loop?: boolean;
    //clipName?: string;
};


export interface AnimationCtrlPlayData extends AnimationPlayParams {
    targetNodeId?: string;//--prefab(放component的nodeId)的node id
    tokenID?: string;//---prefab單一識別碼
}

// Spine 特有的參數...
export interface SpinePlayParams extends BaseAnimationParams {
    //spineName?: string;
    timeScale?: number;
    loop?: boolean;
    skinName?: string;
};

// MixedAnimation 特有的參數...
export interface MixedAnimationPlayParams extends BaseAnimationParams {

};

export interface RepeatOption {
    count: number;
    isRepeat: boolean;
}

export enum CleanTrackType {
    All_TRACKS,
    CURRENT_TRACK,
    EMPTY_ANI,
    ALL_ANI//--animation用的
}

export type AnimationPlayInfo =
    AnimationCtrlPlayData |
    AnimationPlayParams |
    SpinePlayParams |
    MixedAnimationPlayParams;