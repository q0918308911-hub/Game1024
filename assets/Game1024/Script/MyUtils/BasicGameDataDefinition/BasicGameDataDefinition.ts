
/**
 * 20250812-原先的SlotMachineIndexInfo用這個取代
 * 幾乎一樣只是iconID改成symbolId
 * V1版本:
 * export type SlotMachineIndexInfo =
    {
        reelIndex?: number;//--reel index
        iconIndex?: number;//--icon index
        iconID?: number;   //--icon id
        groupID?: number;//--group id

    }
 * 
 */
export interface IReelInfo {
    reelIndex: number;
    iconIndex: number;
    symbolId?: number;//--這邊指的是server給的資料(server symbol id)
    groupId?: number; //--這個是用來識別group的ID(第四軸重複的)
}
/**
 * 原先的type GroupAniData改用interface取代
 */
export interface GroupAniData extends IReelInfo {
    odd?: number
}

/**
 * 原先的type WinScoreData改用interface取代
 */
export interface WinScoreData {
    //multiNum: number,//-additionalMultiplier
    baseOdds?: number,
    totalOdd?: number,
    betValue?: number,
    multiplier?: number
}


