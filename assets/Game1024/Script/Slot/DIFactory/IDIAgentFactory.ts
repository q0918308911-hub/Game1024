import { IReelInfo } from '../../MyUtils/BasicGameDataDefinition/BasicGameDataDefinition';
import { ISyncDatatype } from '../../MyUtils/HandoffManager/HandoffDef/ISyncDataAgent';
import { IPropertyTransferData, IRegisterObjectData } from '../../ReferencePath';

export interface IDIAgentFactory {

    // 取得當前 Owner 的 ID
    readonly ownerId: number;
    //createAndRegister(info: IReelInfo): Promise<Node>;---產動畫
    //handoffSingleByOwnerId(info: IReelInfo, targetOwnerId: number): void;---轉移控制權
    //--盤面相關註冊與移除
    multiRegisty(info: IReelInfo[]): Promise<void>
    register(info: IReelInfo): void;
    unRegister(info: IReelInfo): void;
    multiUnRegister(infos: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): void
    //-刪除整軸資料(單軸)
    unRegisterByReel(reelIndex: number): void;
    //-刪除整軸資料(多軸)
    multiUnRegisterByReels(reelIndices: number[]): void;
    getInfoByOwnerAgent(info: IReelInfo): IReelInfo | null;
    multiRegistryByID(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void>;
    //---快速資料同步接口 (轉發給 SyncManager)---
    pushDataToTarget<TISyncDatatype extends ISyncDatatype>(info: TISyncDatatype): void;
    pushMultiDataToTarget<TISyncDatatype extends ISyncDatatype>(infos: TISyncDatatype[]): void;
    //---物件屬性快速轉移 (轉發給 PropertyTransferManager)---
    registerObject(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, obj: any, ownerId: number): void;
    unregisterObject(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): void;
    // 批次註冊物件資料到 _objectMap
    multiRegisterObjectData(dataList: IRegisterObjectData[]): void;
    // 批次註冊物件資料（包含 Registry 和 ObjectMap）
    multiRegisterObjectDataFull(dataList: IRegisterObjectData[]): void;
    // 批次取消註冊物件資料（僅從 _objectMap 移除）
    multiUnRegisterObjectData(infoList: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number;
    // 批次取消註冊物件資料（同時從 _registry 和 _objectMap 移除）
    multiUnRegisterObjectDataFull(infoList: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number;
    transferObjectProperties<T = any>(transferData: IPropertyTransferData<T>): void 
    transferMultiObjectProperties<T = any>(transferDataList: IPropertyTransferData<T>[]): void;
    transferFrom<T = any>(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>):any;   
    //--除錯使用(查看列表狀態)
    debugCheckAllOwners(): void;
}