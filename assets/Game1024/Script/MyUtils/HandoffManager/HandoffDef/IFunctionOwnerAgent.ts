import { IBaseOwner } from "./IBaseOwnerDef";

//--註冊使用的FunctionType
export interface FunctionType {
    name: string; // 函數名稱
    processType?: string; // 處理類型
    ownerId: number; // 擁有者ID
    targetOwnerId?: number; // 目標擁有者ID (可選)
    args?: any[]; // 傳遞的參數
}
/**
 * <擁有跨系統呼叫owner的獨有方法> 
 */
export interface IFunctionOwnerAgent extends IBaseOwner {
    readonly ownerId: number;
    crossProcess(processType: FunctionType): void;  // 接手後要做的事
    crossMultiProcess(processType: FunctionType[]): void;
    crossReturnData(processType: FunctionType): any; // 歸還資料後要做的事
    crossMultiReturnData(processType: FunctionType[]): any;
}
