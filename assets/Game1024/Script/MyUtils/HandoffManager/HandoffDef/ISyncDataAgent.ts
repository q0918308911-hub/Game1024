import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { IBaseOwner } from "./IBaseOwnerDef";

export interface ISyncDatatype {
    info: Pick<IReelInfo, "reelIndex" | "iconIndex">;
    type: string; // 資料類型標識
    ownerId: number; // 可選的擁有者ID(用於不同系統辨識)
    payload?: any; // 回傳資料
    args?: any[];//-帶入參數
    backProcessType?: string; // 可選的回傳處理類型
    others?: any;//--其他資料
}

export interface ISyncDataAgent extends IBaseOwner {
    readonly ownerId: number; // 唯一識別碼

    getAcquiredData(info: ISyncDatatype): ISyncDatatype | null;
    getAcquiredMultiData(info: ISyncDatatype[]): ISyncDatatype[] | null;
    onDataReceived(info: ISyncDatatype): void; // 接收到資料後要做的事
    onDataMultiReceived(infos: ISyncDatatype[]): void; // 接收到資料後要做的事

}
