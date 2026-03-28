//import { IReelInfo } from '../../MyUtils/BasicGameDataDefinition/BasicGameDataDefinition';
//import { ICrossSystemSymbolAniService } from '../../MyUtils/AniHandoffManager/CrossSystemAniServiceFacade/ICrossSystemAniServiceFacade';
//import { ISymbolOwnerAgent } from '../../MyUtils/AniHandoffManager/AniHandoff/IAniHandoff';
import { Node } from 'cc';
import { IDIAgentFactory } from './IDIAgentFactory';
import { IBaseOwner, ICrossSystemSymbolAniService, IPropertyTransferData, IReelInfo, IRegisterObjectData, ISymbolOwnerAgent, ISyncDatatype } from '../../ReferencePath';

export class DIAgentFactory<TAgent extends IBaseOwner> implements IDIAgentFactory {

    /**
     * 因為實際產生作用的還是在slotMachine身上
     * 但是slotMachine本身才是實踐ISymbolOwnerAgent的物件,
     * 如果直接將ISymbolOwnerAgent注入到reel裡面,(也就是this=slotMachine)
     * 雖然注入reel是interface會保護住上層的slotMachine不會被reel改變,
     * 但這樣低層級的物件卻會持有高層級的物件的控制權有違依賴反轉原則.
     * 所以這裡需要一個DI的工廠來注入這個服務,且讓reel不知道握有這個控制權的物件是誰.就可以切割開來
     * 將耦合集中在factory上,而不是reel上.
     * @param aniService 
     * @param owner 
     */
    constructor(
        private _aniService: ICrossSystemSymbolAniService<IReelInfo, Node, string>,
        private _owner: TAgent
    ) { }

    /*
    public async createAndRegister(info: IReelInfo): Promise<Node> {
        return await this._aniService.createAndRegister(info, this._owner);
    }*/


    /*
    public handoffSingleByOwnerId(info: IReelInfo, targetOwnerId: number): void {
        this._aniService.handoffSingleByOwnerId(info, targetOwnerId);
    }*/
  
        
    get ownerId(): number {
        return this._owner.ownerId;
    }

    //---物件屬性快速轉移 (轉發給 PropertyTransferManager)---
    public registerObject(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, obj: any, ownerId: number): void
    {
        this._aniService.registerObject(info, obj, ownerId);
    }
    public unregisterObject(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): void
    {
        this._aniService.unregisterObject(info);
    }

    /**
     * 批次註冊物件資料到 _objectMap
     * @param dataList 包含 IReelInfo + obj + ownerId 的資料陣列
     */
    public multiRegisterObjectData(dataList: IRegisterObjectData[]): void {
        this._aniService.multiRegisterObjectData(dataList);
    }

    /**
     * 批次註冊物件資料（包含 Registry 和 ObjectMap）
     * @param dataList 包含 IReelInfo + obj + ownerId 的資料陣列
     */
    public multiRegisterObjectDataFull(dataList: IRegisterObjectData[]): void {
        this._aniService.multiRegisterObjectDataFull(dataList);
    }

    /**
     * 批次取消註冊物件資料（僅從 _objectMap 移除）
     * @param infoList IReelInfo 資料陣列
     * @returns 成功移除的數量
     */
    public multiUnRegisterObjectData(infoList: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number {
        return this._aniService.multiUnRegisterObjectData(infoList);
    }

    /**
     * 批次取消註冊物件資料（同時從 _registry 和 _objectMap 移除）
     * @param infoList IReelInfo 資料陣列
     * @returns 成功移除的數量
     */
    public multiUnRegisterObjectDataFull(infoList: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number {
        return this._aniService.multiUnRegisterObjectDataFull(infoList);
    }
    public transferObjectProperties<T = any>(transferData: IPropertyTransferData<T>): void{
        this._aniService.transferObjectProperties(transferData);
    } 
    public transferMultiObjectProperties<T = any>(transferDataList: IPropertyTransferData<T>[]): void
    {
        this._aniService.transferMultiObjectProperties(transferDataList);
    }
    //---物件屬性快速轉移 (轉發給 PropertyTransferManager)---
    
    public transferFrom<T = any>(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>):any {   
        return this._aniService.transferFrom(info);
    }

    //---快速資料同步接口 (轉發給 SyncManager)---
    public pushDataToTarget<TISyncDatatype extends ISyncDatatype>(info: TISyncDatatype): void {
        return this._aniService.pushDataToTarget(info);
    }


    public pushMultiDataToTarget<TISyncDatatype extends ISyncDatatype>(infos: TISyncDatatype[]): void {
        return this._aniService.pushMultiDataToTarget(infos);
    }

    //--盤面相關註冊與移除
    public unRegister(info: IReelInfo): void {
        this._aniService.unRegisterData(info);
    }

    public multiUnRegister(infos: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): void {
        this._aniService.multiUnRegister(infos);
    }

    //-刪除整軸資料(單軸)
    public unRegisterByReel(reelIndex: number): void {
        this._aniService.unRegisterByReel(reelIndex);
    }
    //-刪除整軸資料(多軸)
    public multiUnRegisterByReels(reelIndices: number[]): void {
        this._aniService.multiUnRegisterByReels(reelIndices);
    }

    public register(info: IReelInfo): void {
        //console.log('check_register_____reelIndex', info.reelIndex,'iconIndex__', info.iconIndex,'_symbolId__', info.symbolId);
        this._aniService.registerData(info, this._owner);
    }

    public async multiRegisty(info: IReelInfo[]): Promise<void> {
        await this._aniService.multiRegisty(info, this._owner);
    }

    public async multiRegistryByID(info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void> {
        await this._aniService.multiRegistryByID(info, targetOwnerId);
    }


    public getInfoByOwnerAgent(info: IReelInfo): IReelInfo | null {
        return this._aniService.getInfoByOwnerAgent(info, this._owner);
    }
    //---除錯使用(查看列表狀態)---
    public debugCheckAllOwners(): void {
        this._aniService.debugCheckAllOwners();
    }


}