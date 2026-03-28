import { IPlayAniData, ISymbolAniKey } from '../AniBuilder/IAniBuilder';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { ISymbolOwnerAgent } from '../HandoffDef/IAniHandoff';
import { AniBuilderMediator } from '../AniBuilder/AniBuilderMediator';
import { SymbolAniHandoffManager } from '../AniHandoff/SymbolAniHandoffManager';
import { ICrossSystemSymbolAniService } from './ICrossSystemAniServiceFacade';
import { GameUtilsTools } from '../../ReferencePathForMyUtils';
import { IBaseOwner } from '../HandoffDef/IBaseOwnerDef';
//import { SymbolHandoffDataCenter } from '../HandoffData/SymbolHandoffDataCenter';
import { FunctionType, IFunctionOwnerAgent } from '../HandoffDef/IFunctionOwnerAgent';
import { SyncDataHandoffManager } from '../SyncHandoff/SyncDataHandoffManager';
import { SystemHandoffManager } from '../SysHandoff/SystemHandoffCenter';
import { SymbolRegistryCenter } from '../HandoffData/SymbolRegistryCenter';
import { SymbolDataCtrlManager } from '../HandoffData/SymbolDataCtrlManager';
import { ISyncDataAgent, ISyncDatatype } from '../HandoffDef/ISyncDataAgent';
import { IPropertyTransferAgent, IPropertyTransferData, IRegisterObjectData } from '../HandoffDef/IPropertyTransferAgent';
import { PropertyTransferManager } from '../PropertyTransfer/PropertyTransferManager';

/*    
T extends IReelInfo,
N,
Key extends string,
P extends IPlayAniData = IPlayAniData,
K extends ISymbolAniKey = ISymbolAniKey,
// I extends IReelInfo
I extends IReelInfo = IReelInfo,
OwnerAgent extends ISymbolOwnerAgent = ISymbolOwnerAgent,
HandoffManager extends SymbolAniHandoffManager<I, OwnerAgent> = SymbolAniHandoffManager<I, OwnerAgent>
*/
export class CrossSystemServiceFacade<

    TReelInfo extends IReelInfo,
    TNode = any,
    TAniKey extends string = string,
    TPlayAniData extends IPlayAniData = IPlayAniData,
    TSymbolAniKey extends ISymbolAniKey = ISymbolAniKey,
    TOwner extends IBaseOwner = IBaseOwner
> implements ICrossSystemSymbolAniService<TReelInfo, TNode, TAniKey, TPlayAniData, TSymbolAniKey, TOwner> {
    //> implements ICrossSystemSymbolAniService<T, N, Key, P, K> {

    protected _db: SymbolRegistryCenter<TReelInfo, TOwner>;
    protected _aniHandoff: SymbolAniHandoffManager<TReelInfo, any>;
    protected _syncDataHandoff: SyncDataHandoffManager<TReelInfo, any>;
    protected _symbolDataCtrlManager: SymbolDataCtrlManager<TReelInfo, TOwner>;
    protected _syncSysCrossService: SystemHandoffManager<IReelInfo, IFunctionOwnerAgent>;
    protected _mediator: AniBuilderMediator<TReelInfo, TNode, TAniKey, TPlayAniData, TSymbolAniKey>;
    protected _propertyTransfer: PropertyTransferManager<TReelInfo, any>;

    /**
     * 利用轉型技術，讓 HandoffManager 能夠使用這個「廣義」的 db
     */
    public setHandoffManager(
        ManagerClass: new (db: SymbolRegistryCenter<TReelInfo, ISymbolOwnerAgent>) => SymbolAniHandoffManager<TReelInfo, ISymbolOwnerAgent>
    ) {
        // 使用 as any 或是強制轉型，因為知道在執行動畫相關邏輯時，
        // HandoffManager 會自行判斷該 Owner 是否具備 ISymbolOwnerAgent 介面
        this._aniHandoff = new ManagerClass(this._db as unknown as SymbolRegistryCenter<TReelInfo, ISymbolOwnerAgent>);
    }

    public setSyncManager(
        ManagerClass: new (db: SymbolRegistryCenter<TReelInfo, ISyncDataAgent>) => SyncDataHandoffManager<TReelInfo, ISyncDataAgent, ISyncDatatype>
    ) {
        // 這裡同樣使用強制轉型來對齊 Manager 的需求
        this._syncDataHandoff = new ManagerClass(this._db as unknown as SymbolRegistryCenter<TReelInfo, ISyncDataAgent>);
    }

    public setSysCrossServiceManager(ManagerClass: new (db: SymbolRegistryCenter<IReelInfo, IFunctionOwnerAgent>) => SystemHandoffManager<IReelInfo, IFunctionOwnerAgent>) {
        this._syncSysCrossService = new ManagerClass(this._db as unknown as SymbolRegistryCenter<IReelInfo, IFunctionOwnerAgent>);
    }

    public setMediator(mediator: AniBuilderMediator<TReelInfo, TNode, TAniKey, TPlayAniData, TSymbolAniKey>): void {
        this._mediator = mediator;
    }
    //--純資料操作管理器
    public setSymbolDataCtrlManager(ManagerClass: new (db: SymbolRegistryCenter<TReelInfo, TOwner>) => SymbolDataCtrlManager<TReelInfo, TOwner>) {
        this._symbolDataCtrlManager = new ManagerClass(this._db);
    }

    public setPropertyTransferManager(
        ManagerClass: new (db: SymbolRegistryCenter<TReelInfo, IPropertyTransferAgent>) => PropertyTransferManager<TReelInfo, IPropertyTransferAgent>
    ) {
        this._propertyTransfer = new ManagerClass(this._db as unknown as SymbolRegistryCenter<TReelInfo, IPropertyTransferAgent>);
    }

    /**
     * 
     * 初始化順序：在遊戲啟動時，務必按照以下順序初始化：

        new SymbolRegistryCenter()

        new CrossSystemServiceFacade(db)

        facade.setSymbolDataCtrlManager(SymbolDataCtrlManager)

        facade.setHandoffManager(SymbolAniHandoffManager)
     */
    constructor(db: SymbolRegistryCenter<TReelInfo, TOwner>) {
        this._db = db;
    }

    //========物件屬性快速轉移 (轉發給 PropertyTransferManager)===========================================================================
    /**
     * 註冊物件到 ObjectMap 以供屬性轉移使用
     * @param info 符號位置資訊
     * @param obj 實際物件 (Node, Animation 等)
     * @param ownerId 持有者 ID
     */
    public registerObject(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, obj: any, ownerId: number): void {
        this._db.setObject(info, obj, ownerId);
    }

    /**
     * 從 ObjectMap 移除物件引用
     */
    public unregisterObject(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): void {
        this._db.removeObject(info);
    }

    /**
     * 批次註冊物件資料到 _objectMap
     * @param dataList 包含 IReelInfo + obj + ownerId 的資料陣列
     */
    public multiRegisterObjectData(dataList: IRegisterObjectData[]): void {
        this._propertyTransfer.multiRegisterData(dataList);
    }

    /**
     * 批次註冊物件資料（包含 Registry 和 ObjectMap）
     * @param dataList 包含 IReelInfo + obj + ownerId 的資料陣列
     */
    public multiRegisterObjectDataFull(dataList: IRegisterObjectData[]): void {
        this._propertyTransfer.multiRegisterDataFull(dataList);
    }

    /**
     * 批次取消註冊物件資料（僅從 _objectMap 移除）
     * @param infoList IReelInfo 資料陣列
     * @returns 成功移除的數量
     */
    public multiUnRegisterObjectData(infoList: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number {
        return this._propertyTransfer.multiUnRegisterData(infoList);
    }

    /**
     * 批次取消註冊物件資料（同時從 _registry 和 _objectMap 移除）
     * @param infoList IReelInfo 資料陣列
     * @returns 成功移除的數量
     */
    public multiUnRegisterObjectDataFull(infoList: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number {
        return this._propertyTransfer.multiUnRegisterDataFull(infoList);
    }

    /**
     * 轉移單個物件的屬性到目標 Owner
     * @param transferData 轉移資料定義
     */
    public transferObjectProperties<T = any>(transferData: IPropertyTransferData<T>): void {
        return this._propertyTransfer.transferProperties(transferData);
    }

    /**
     * 批次轉移多個物件的屬性
     * @param transferDataList 轉移資料陣列
     */
    public transferMultiObjectProperties<T = any>(transferDataList: IPropertyTransferData<T>[]): void {
        return this._propertyTransfer.transferMultiProperties(transferDataList);
    }

    /**
     * 使用建構器模式轉移屬性 (類似 Tween 的鏈式呼叫)
     * 範例:
     * facade.transferFrom(info)
     *        .extract(['position', 'scale'])
     *        .to(targetOwnerId)
     *        .transfer()
     */
    public transferFrom<T = any>(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>):any {
        return this._propertyTransfer.from<T>(info);
    }

    //========跨系統指令(轉發_syncSysCrossService)=======================================================================================

    public processOwnerFunction(processType: FunctionType): void {

        this._syncSysCrossService.processOwnerFunction(processType);
    }

    public processMultiOwnerFunction(processTypes: FunctionType[]): void {

        this._syncSysCrossService.processMultiOwnerFunction(processTypes);
    }

    public processMultiFunctionBySameOwner(processTypes: FunctionType[], ownerId: number): void {

        this._syncSysCrossService.processMultiFunctionBySameOwner(processTypes, ownerId);
    }

    public returnOwnerData(processType: FunctionType): any {

        return this._syncSysCrossService.returnOwnerData(processType);
    }
    public returnMultiOwnerDataBySameOwner(processTypes: FunctionType[], ownerId: number): any {

        return this._syncSysCrossService.returnMultiOwnerDataBySameOwner(processTypes, ownerId);
    }

    //========快速資料同步接口 (轉發給 SyncManager)=======================================================================================
    //--
    /**
     * 1.這裡的資料轉移是依照盤面記錄的資料來做轉移
     * 2.舉個例子:你可以已透過info知道symbol是在盤面的何處,然後透過這個可以拿該物件做一些操作
     * e.g:拿物件的worldPos..或是其它屬於這個物件上的資料,在不做owner轉移的情況下,會直接送出你要拿的資料
     * PS-此時的owner是沒有改變(要轉移owner請使用handoff相關方法)
     */
    public pushDataToTarget<TISyncDatatype extends ISyncDatatype>(info: TISyncDatatype): void {
        return this._syncDataHandoff.pushDataToTarget(info);
    }

    public pushMultiDataToTarget<TISyncDatatype extends ISyncDatatype>(infos: TISyncDatatype[]): void {
        return this._syncDataHandoff.pushMultiDataToTarget(infos);
    }

    //========盤面資料單純紀錄=====================================================
    //--向列表移除註冊(銷毀物件或推回物件池使用-)
    public unRegisterData(info: TReelInfo): void {
        this._symbolDataCtrlManager.unRegisterData(info);
    }
    public registerData(info: TReelInfo, owner: TOwner): void {
        this._symbolDataCtrlManager.registerData(info, owner);
    }

    public multiUnRegister(infos: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): void {

        this._symbolDataCtrlManager.multiUnRegister(infos);
    }

    public async multiRegisty(info: TReelInfo[], owner: TOwner): Promise<void> {

        await this._symbolDataCtrlManager.multiRegister(info, owner);
    }

    public unRegisterByReel(reelIndex: number): void {

        this._symbolDataCtrlManager.unRegisterByReel(reelIndex);
    }

    public multiUnRegisterByReels(reelIndices: number[]): void {

        this._symbolDataCtrlManager.multiUnRegisterByReels(reelIndices);
    }

    public getInfoByOwnerAgent(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, owner: TOwner):
        Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'> | null {
        return this._symbolDataCtrlManager.getInfoByOwnerAgent(info, owner);
    }

    // 註冊自己為擁有者
    public registerYourself(owner: TOwner): void {

        this._symbolDataCtrlManager.registerOwner(owner);
    }

    //--註冊多個物件(非持有者要求註冊多個物件給已知的owner)
    public async multiRegistryByID(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void> {

        await this._symbolDataCtrlManager.multiRegistryByID(info, targetOwnerId);
    }

    public releaseAll(): void {
        this._symbolDataCtrlManager.releaseAll();
    }

    //=============動畫產生===================================================================================
    // --- 動畫交接與資料註冊 (委派給 HandoffManager 或 DataCenter) ---
    public createAndRegister(info: TReelInfo, owner: TOwner): TNode {
        const node = this._mediator.requestNodeByInput(info);
        return node;
    }

    /**
     * 只產動畫資料不產生實體..適合需要檢查是否有同個位置有相同物件的檢查.
     * 如果你有該需求,請透過該方法取出動畫資料後自行比對.
     * 再比對後,如果依然需要產出動畫實體,可以再呼叫createAndRegister方法來產出實體。
     * @param info 
     * @returns
     */
    public buildPlayData(info: TReelInfo): TPlayAniData {
        return this._mediator.buildPlayData(info);
    }

    //========動畫轉交<此系列方法是包含操作轉移權>=======================================================================================
    //--轉移控制權與抽取對方持有的物件
    public async handoff<O extends TOwner & ISymbolOwnerAgent>(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, newOwner: O): Promise<void> {
        await this._aniHandoff.handoff(info, newOwner);
    }

    /**
     * 由owner主動將自己擁有的動畫位置資料交給另一個owner（透過ownerId找）
     * @param info any extends IReelInfo
     * @param targetOwnerId ISymbolOwnerAgent裡面有ownerId屬性
     */
    public async handoffSingleByOwnerId(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, targetOwnerId: number): Promise<void> {
        return this._aniHandoff.handoffSingleByOwnerId(info, targetOwnerId);
    }
    //--轉移多個控制權與抽取對方持有的物件(非持有者要求轉移多個物件)
    public async multiHandoffBySameOwner<O extends TOwner & ISymbolOwnerAgent>(infos: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], newOwner: O): Promise<void> {
        await this._aniHandoff.multiHandoffBySameOwner(infos, newOwner);
    }
    //--轉移多個控制權與抽取對方持有的物件(給持有者本身使用,從自己轉移到別人身上) by ownerId
    public async multiHandoffBySameOwnerID(infos: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void> {
        await this._aniHandoff.multiHandoffBySameOwnerID(infos, targetOwnerId);
    }

    //--取消..沒甚麼意義的功能,且已經超出權責了
    public decorateNode(target: TNode, playData: TPlayAniData): void | Promise<void> {
        return this._mediator.decorate(target, playData);
    }


    /**除錯使用,查看列表狀態 */
    public debugCheckAllOwners(): void {
        GameUtilsTools.debugLog('DEBUG_TITLE', 'debugCheckAllOwners', {
            message: '==call by CrossAniServer:debugCheckAllOwners==='
        });
        this._db.debugCheckAllOwners();
    }



}