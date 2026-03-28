import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { IBaseOwner } from "./IBaseOwnerDef";

/**
 * 屬性轉移資料定義
 * 類似 Cocos Creator 的 Tween，可以動態指定要轉移的物件屬性
 */
export interface IPropertyTransferData<T = any> {
    // 符號位置資訊
    info: Pick<IReelInfo, "reelIndex" | "iconIndex" | "symbolId">;
    // 目標接收者 ID
    targetOwnerId: number;
    //要提取的屬性鍵值列表 (例如: ['position', 'scale', 'rotation'])
    propertyKeys?: string[];
    // 直接指定要轉移的屬性值 (鍵值對)
    properties?: Partial<T>;
    //自訂處理類型
    transferType?: string;
    backProcessType?: string; // 可選的回傳處理類型
    // 額外參數
    args?: any[];
    payload?: any;
}

/**
 * 擴展的註冊資料介面
 * 包含 IReelInfo 的基礎資訊 + 註冊所需的物件引用和擁有者ID
 */
export interface IRegisterObjectData extends IReelInfo {
    obj: any;         // 要註冊到 _objectMap 的物件
    ownerId: number;  // 擁有者 ID
}

/**
 * 屬性轉移代理介面
 * Owner 需要實作此介面以支援物件屬性的應用
 * 注意：屬性提取由 PropertyTransferManager 負責，Owner 只需要決定如何應用這些屬性
 */
export interface IPropertyTransferAgent extends IBaseOwner {
    readonly ownerId: number;

    /**
     * 接收並應用屬性到目標物件
     * @param obj 目標物件
     * @param properties 要應用的屬性
     * @param transferData 原始轉移資料（可選，提供額外上下文，例如 transferType）
     */
    applyProperties<T = any>(obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T>): void;

    /**
     * 批次應用屬性到多個物件
     * @param applications 物件與屬性的配對陣列
     */
    applyMultiProperties<T = any>(applications: Array<{ obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T> }>): void;
}
