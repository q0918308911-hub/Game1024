import { GameState } from '../MyUtils/GameStateConfigDef/GameStateConfigDef';
import { DefinitionGameConfigData1024 } from './DefinitionGameConfigData1024';
//--避免循環依賴(要用解構的方式抽出config裡面的變數)
export const DefinitionGameConfigData = new DefinitionGameConfigData1024();

//--判斷目前狀態與下一個狀態
export interface IStateCondition {
    currentRoundState: GameState,
    nextRoundState: GameState | null,//--沒有就是最後一步了
    isDifferentStateNext: boolean,
    isFinal: boolean,//-是否為最後一round
    isPrevWildReFill?: boolean,//--前一輪是否有wild補牌
    prevHasOdds?: boolean//--是否有賠率(有無得分)
    prevHasReFill?: boolean//--前一輪是否有補牌(不管是補牌在頂部還是補牌在得分區)

}

export interface ITransWildReelInfo {
    transReelId: number,
    symbolInfos: {
        reelIndex: number,
        iconIndex: number,
        symbolId: number
        wPos: { x: number, y: number }
    }[],

}