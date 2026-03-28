import { SpineCtrlPropDef } from "../Components/AniStateLists/AnimationPlayStateBase";
import { SpinePlayParams } from "./AnimationDataOptions";

//--20251221-支援多軌道動畫播放的暫時遷移過渡方案
export interface ITrackState {
    target: SpineCtrlPropDef;
    duration: number;
    frames: number;
    secondsPerFrame: number;
    isReverse: boolean;
    isPlayToTimeAndStop: boolean;
    targetTime: number;
    aniStartTime: number;    // 動畫裁切起點 (animationStart)
    aniEndTime: number;      // 動畫裁切終點 (animationEnd)
    percentageTasks?: {      // 單一軌道可以監聽多個進度點20251230-new
        targetPercentage: number;
        resolve: () => void;
    }[];

}

/** 播放動作時的動態參數 (包含靜態定義與動態需求) */
export interface IAniPlayParams extends SpinePlayParams {
    startTime?: number;    // 起始跳轉時間
    isReverse?: boolean;   // 是否倒播
    speed?: number;        // 播放速度 (timeScale)
    targetTime?: number;   // 目標停止時間
    trackIndex?: number;  // 指定軌道索引
}