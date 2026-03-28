import { AnimationStateType } from '../Components/AniStateLists/AnimationPlayStateBase';

/**
 * this.resolveTargetName('MyClip');                  // 直接 targetName
    this.resolveTargetName('SuperWin');                // 自訂 stateKey → 轉成對應 targetName
    this.resolveTargetName(AnimationStateType.Win);    // Enum stateKey
    this.resolveTargetName({ aniState: 'SuperWin' });  // 指定 stateKey
    this.resolveTargetName({ targetName: 'MyClip' });  // 指定 targetName
    this.resolveTargetName(0);                         // 取第 0 筆 AnimationState 的 targetName
 */
export interface IPlayOptions {
    targetName?: string;
    aniState?: AnimationStateType | string;
}
//--定義播放的參數內容
export type PlaySelector = string | number | IPlayOptions;

// 最少需求：state / prop 都要有 targetName；state 另外要能提供 stateKey
export type StateLike = {
    targetName?: string;
    getStateKey?: () => string;
    // 若沒有 getStateKey，可在建構時用 keySelector 提供替代
};

export type PropLike = { targetName?: string };