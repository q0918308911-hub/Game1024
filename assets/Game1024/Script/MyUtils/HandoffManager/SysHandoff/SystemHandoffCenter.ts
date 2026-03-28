//import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { SymbolRegistryCenter } from "../HandoffData/SymbolRegistryCenter";
//import { SymbolHandoffDataCenter } from "../HandoffData/SymbolHandoffDataCenter";
import { FunctionType, IFunctionOwnerAgent } from "../HandoffDef/IFunctionOwnerAgent";


/**
 * 處理跨系統指令的發送，直接操作資料中心獲取 Owner 實體
 * 不再繼承 SymbolAniHandoffManager，避免功能過於臃腫
 */
export class SystemHandoffManager<TSymbolInfo extends IReelInfo, OwnerAgent extends IFunctionOwnerAgent> {

    // 採用注入方式，與其他 Manager 共享資料來源
    protected _db: SymbolRegistryCenter<TSymbolInfo, OwnerAgent>;

    constructor(db: SymbolRegistryCenter<TSymbolInfo, OwnerAgent>) {
        this._db = db;
    }

    /**
     * 執行單一跨系統功能呼叫
     */
    public processOwnerFunction(processType: FunctionType): void {
        // 直接從 DB 獲取 Owner 實體  
        const owner = this._db.getOwner(processType.ownerId);
        // 動態檢測能力
        if (owner && "crossProcess" in owner) {

            (owner as unknown as IFunctionOwnerAgent).crossProcess(processType);

        } else {
            console.warn(`[DirtyHandoff] Process failed: Owner ID ${processType.ownerId} does not implement crossProcess.`);
        }

        // 執行跨系統介面定義的動作
        owner.crossProcess(processType);
    }

    /**
     * 處理多個指令，可能涉及不同的 Owner
     */
    public processMultiOwnerFunction(processTypes: FunctionType[]): void {

        for (const processType of processTypes) {
            const owner = this._db.getOwner(processType.ownerId);
            if (owner && "crossProcess" in owner) {

                (owner as unknown as IFunctionOwnerAgent).crossProcess(processType);

            } else {
                console.warn(`[DirtyHandoff] MultiProcess failed: Owner ID ${processType.ownerId} does not implement crossProcess.`);
            }
        }
    }

    /**
     * 針對同一個 Owner 執行批量指令優化
     */
    public processMultiFunctionBySameOwner(processTypes: FunctionType[], ownerId: number): void {

        const owner = this._db.getOwner(ownerId);
        if (owner && "crossMultiProcess" in owner) {
            (owner as unknown as IFunctionOwnerAgent).crossMultiProcess(processTypes);
        } else {
            console.warn(`[DirtyHandoff] MultiProcess failed: Owner ID ${ownerId} does not implement crossMultiProcess.`);
        }
    }

    public returnOwnerData(processType: FunctionType): any {
        const owner = this._db.getOwner(processType.ownerId);
        if (owner && "crossReturnData" in owner) {
            return (owner as unknown as IFunctionOwnerAgent).crossReturnData(processType);
        }
        return null;
    }

    public returnMultiOwnerDataBySameOwner(processTypes: FunctionType[], ownerId: number): any {

        const owner = this._db.getOwner(ownerId);
        if (owner && "crossMultiReturnData" in owner) {
            return (owner as unknown as IFunctionOwnerAgent).crossMultiReturnData(processTypes);
        }
        return null;
    }
}