import { IPlayAniData, ISymbolAniKey } from '../AniBuilder/IAniBuilder';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition'
import { ISymbolOwnerAgent } from '../HandoffDef/IAniHandoff';
import { IBaseOwner } from '../HandoffDef/IBaseOwnerDef';
import { FunctionType } from '../HandoffDef/IFunctionOwnerAgent';
import { Node } from 'cc'; // 確保這裡有 import
import { ISyncDatatype } from '../HandoffDef/ISyncDataAgent';
import { IPropertyTransferData, IRegisterObjectData } from '../HandoffDef/IPropertyTransferAgent';
/*    
T,
N = any,
Key extends string = string,
P extends IPlayAniData = IPlayAniData,
K extends ISymbolAniKey = ISymbolAniKey,
I extends IReelInfo = IReelInfo*/
//---提供注入的介面
export interface ICrossSystemSymbolAniService<

    TReelInfo extends IReelInfo,
    TNode = any,
    TAniKey extends string = string,
    TPlayAniData extends IPlayAniData = IPlayAniData,
    TSymbolAniKey extends ISymbolAniKey = ISymbolAniKey,
    // 預設 Owner 約束最寬鬆，只需有 ownerId
    TOwner extends IBaseOwner = IBaseOwner
> {

    //createAndRegister(info: TReelInfo, owner: TOwner): Promise<TNode>;
    createAndRegister(info: TReelInfo, owner: TOwner): TNode;
    registerData(info: TReelInfo, owner: TOwner): void;
    registerYourself(owner: TOwner): void;//- 註冊自己為擁有者

    unRegisterData(info: TReelInfo): void;//--向列表移除註冊(銷毀物件或推回物件池使用)
    multiUnRegister(infos: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): void;
    //批量註冊資料給同一個 Owner 實體
    multiRegisty(info: TReelInfo[], owner: TOwner): Promise<void>;
    //批量註冊資料給指定的 Owner ID (適用於 Owner 已在系統內的情況)
    multiRegistryByID(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void>;
    //-刪除整軸資料(單軸)
    unRegisterByReel(reelIndex: number): void;
    //-刪除整軸資料(多軸)
    multiUnRegisterByReels(reelIndices: number[]): void;
    //-盤面清除
    releaseAll(): void;
    // --- 查詢服務 ---
    //驗證該 Owner 是否真的持有該符號資訊
    getInfoByOwnerAgent(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, owner: TOwner): Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'> | null;


    // --- 動畫交接服務 (方法級約束) ---
    //--轉移控制權與抽取對方持有的物件
    handoff<O extends TOwner & ISymbolOwnerAgent>(info: Pick<TReelInfo, "reelIndex" | "iconIndex" | "symbolId">, newOwner: O): Promise<void>;
    handoffSingleByOwnerId(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, targetOwnerId: number): Promise<void>;
    multiHandoffBySameOwner<O extends TOwner & ISymbolOwnerAgent>(infos: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], newOwner: O): Promise<void>;
    //批量轉移控制權給指定的 Owner ID
    multiHandoffBySameOwnerID(infos: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void>;


    // --- 跨系統指令服務(轉發_syncSysCrossService)---
    processOwnerFunction(processType: FunctionType): void;
    processMultiOwnerFunction(processTypes: FunctionType[]): void;
    processMultiFunctionBySameOwner(processTypes: FunctionType[], ownerId: number): void;
    returnOwnerData(processType: FunctionType): any;
    returnMultiOwnerDataBySameOwner(processTypes: FunctionType[], ownerId: number): any;
    //---物件屬性快速轉移 (轉發給 PropertyTransferManager)---
    registerObject(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, obj: any, ownerId: number): void;
    unregisterObject(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): void;
    // 批次註冊物件資料到 _objectMap
    multiRegisterObjectData(dataList: IRegisterObjectData[]): void;
    // 批次註冊物件資料（包含 Registry 和 ObjectMap）
    multiRegisterObjectDataFull(dataList: IRegisterObjectData[]): void;
    // 批次取消註冊物件資料（僅從 _objectMap 移除）
    multiUnRegisterObjectData(infoList: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number;
    // 批次取消註冊物件資料（同時從 _registry 和 _objectMap 移除）
    multiUnRegisterObjectDataFull(infoList: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number;
    transferObjectProperties<T = any>(transferData: IPropertyTransferData<T>): void
    transferMultiObjectProperties<T = any>(transferDataList: IPropertyTransferData<T>[]): void;
    transferFrom<T = any>(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): any;
    //---快速資料同步接口 (轉發給 SyncManager)---
    pushDataToTarget<TISyncDatatype extends ISyncDatatype>(info: TISyncDatatype): void;
    pushMultiDataToTarget<TISyncDatatype extends ISyncDatatype>(infos: TISyncDatatype[]): void;
    // --- 物件裝飾與工具 ---
    buildPlayData(info: TReelInfo): TPlayAniData;
    debugCheckAllOwners(): void;//--debug log for handoffOwners
    decorateNode(target: TNode, playData: TPlayAniData): void | Promise<void>;

}