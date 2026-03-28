import { ISymbolAniKey, IPlayAniData, ISymbolAniMediator, IProcessContext, IProcessInput, ISymbolAniMediatorHooks, IProcessSlotSymbolAniData } from './AniBuilder/IAniBuilder';
import { ISymbolOwnerAgent } from './HandoffDef/IAniHandoff';
import { AbstractProcessSlotSymbolAniData } from './AniBuilder/AbstractProcessSlotSymbolAniData';
import { AniBuilderMediator } from './AniBuilder/AniBuilderMediator';
import { SymbolAniHandoffManager } from './AniHandoff/SymbolAniHandoffManager';
import { ICrossSystemSymbolAniService } from './CrossSystemServiceFacade/ICrossSystemAniServiceFacade';
import { CrossSystemServiceFacade } from './CrossSystemServiceFacade/CrossSystemServiceFacade';
import { SymbolDataCtrlManager } from './HandoffData/SymbolDataCtrlManager';
import { SyncDataHandoffManager } from './SyncHandoff/SyncDataHandoffManager';
import { SystemHandoffManager } from './SysHandoff/SystemHandoffCenter';
import { IBaseOwner } from './HandoffDef/IBaseOwnerDef';
import { IFunctionOwnerAgent } from './HandoffDef/IFunctionOwnerAgent';
import { FunctionType } from './HandoffDef/IFunctionOwnerAgent';
import { ISyncDataAgent } from './HandoffDef/ISyncDataAgent';
import { SymbolRegistryCenter } from './HandoffData/SymbolRegistryCenter';
import { ISyncDatatype } from './HandoffDef/ISyncDataAgent';
import { IPropertyTransferAgent, IPropertyTransferData,IRegisterObjectData } from './HandoffDef/IPropertyTransferAgent';
import { PropertyTransferManager } from './PropertyTransfer/PropertyTransferManager';

export {
    AbstractProcessSlotSymbolAniData,
    AniBuilderMediator,//--動畫中介者(生產/初始化)
    SymbolAniHandoffManager,//--動畫交接管理者(轉移owner到對方的node上)
    CrossSystemServiceFacade,
    SymbolRegistryCenter,//--map(盤面資料與owner對應)-new
    SymbolDataCtrlManager,//--map(盤面資料操作)
    SyncDataHandoffManager,//-純資料交換直接轉移資料(不轉移owner-直通對方)
    SystemHandoffManager,//--系統交接管理者(不轉移owner-call對方系統功能)
    PropertyTransferManager//--物件屬性交換器
}
//--interface
export type
{
    IBaseOwner,
    ISymbolAniKey,
    IPlayAniData,
    ISymbolAniMediator,
    IProcessContext,
    IProcessInput,
    ISymbolAniMediatorHooks,
    IProcessSlotSymbolAniData,
    ISymbolOwnerAgent,
    ICrossSystemSymbolAniService,
    IFunctionOwnerAgent,
    ISyncDataAgent,
    FunctionType,
    ISyncDatatype,
    IPropertyTransferAgent,
    IPropertyTransferData,
    IRegisterObjectData
}