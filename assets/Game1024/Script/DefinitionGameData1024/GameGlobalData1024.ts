//--定義要用的global變數

import { GameState, NewFlashModeEnum } from '../ReferencePath';

export enum SymbolOwnerAgentID {
    SlotMachine,
    ShowAniController
}

export interface GameGlobalData {
    GameState: GameState;
    //TransitionsState: TransitionsState;
    //DelayTimeList: BasicGameStepDelayTime;
    //TurboMode: NewFlashModeEnum;
    //GameTimeScale: number;
    //InterruptProcess: boolean;//--是否中斷流程
    //RoundTotalOdds: number;

}

/**
 * 太假掰的寫法了,下個專案要換一招...20250813.....
 * keyof就可以直接映射屬性
 * GameGlobalData的key值
 * 直接定義屬性為了去寫上面interface的資料.
 * 這些屬性要能夠去對應interface所定義的內容
 * https://pjchender.dev/typescript/ts-type-manipulation/
 * https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
 */
export const GameGlobalKeys: { [K in keyof GameGlobalData]: K } = {
    GameState: "GameState",
    //TransitionsState: "TransitionsState",
    //DelayTimeList: 'DelayTimeList',
    //TurboMode: "TurboMode",
    //GameTimeScale: "GameTimeScale",
    //InterruptProcess: "InterruptProcess",
    //RoundTotalOdds: "RoundTotalOdds",
    //ShowBottomTextStatus: "ShowBottomTextStatus"
} as const;