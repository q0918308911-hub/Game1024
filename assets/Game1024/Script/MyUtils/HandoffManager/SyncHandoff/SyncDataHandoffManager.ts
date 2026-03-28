import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { ISymbolOwnerAgent } from '../HandoffDef/IAniHandoff';
//import { SymbolHandoffDataCenter } from '../HandoffData/SymbolHandoffDataCenter';
import { SymbolRegistryCenter } from '../HandoffData/SymbolRegistryCenter';
import { ISyncDataAgent, ISyncDatatype } from '../HandoffDef/ISyncDataAgent';


/**
 * [純資料同步處理器]
 * 職責：負責 Owner 之間的資料推播與同步，不涉及控制權轉移，不改動 Registry。
 */
export class SyncDataHandoffManager<
    TReelInfo extends IReelInfo,
    TOwner extends ISyncDataAgent,
    TSyncDatatype extends ISyncDatatype = ISyncDatatype
> {
    constructor(private _db: SymbolRegistryCenter<TReelInfo, TOwner>) { }

    /**
     * 快速同步單筆資料給目標 Owner
     * @param info 符號資訊
     * @param targetOwnerId 目標接收者 ID
     */
    public pushDataToTarget(
        info: TSyncDatatype,
    ): void {
        const entry = this._db.getEntry(info.info);
        if (!entry) return;

        const sourceOwner = this._db.getOwner(entry.ownerId);
        const targetOwner = this._db.getOwner(info.ownerId);
        // 確保兩端都存在，且 sourceOwner 具備資料提取能力
        if (sourceOwner && targetOwner) {
            const data = sourceOwner.getAcquiredData(info);
            if (data !== null) {
                //await targetOwner.onDataReceived(data);
                targetOwner.onDataReceived(data);
            }
        }
    }

    /**
     * 批次同步資料：自動根據每筆 info 內的 ownerId 派發給正確的目標
     */
    public pushMultiDataToTarget(
        infos: TSyncDatatype[]
    ): void {

        const groupByTarget = new Map<number, TSyncDatatype[]>();

        // ---提取資料並分組 ---
        for (const info of infos) {
            // 找出現有的資料源 (Source)
            const entry = this._db.getEntry(info.info);

            //if () continue;
            if (!entry) {
                console.log();
                continue;
            }

            const sourceOwner = this._db.getOwner(entry.ownerId) as unknown as TOwner;
            const targetOwner = this._db.getOwner(info.ownerId) as unknown as TOwner;

            // 2. 確保兩端都存在
            if (sourceOwner && targetOwner) {
                // 從來源端提取資料
                const data = sourceOwner.getAcquiredData(info) as TSyncDatatype;

                if (data !== null) {
                    const tId = info.ownerId;
                    if (!groupByTarget.has(tId)) {
                        groupByTarget.set(tId, []);
                    }
                    groupByTarget.get(tId)!.push(data);
                } else {
                    console.log();
                }
            } else {
                console.log();
            }
        }

        // ---批次推送給各個目標 ---
        //const sendPromises: Promise<void>[] = [];

        groupByTarget.forEach((dataList, targetId) => {
            const targetOwner = this._db.getOwner(targetId) as unknown as TOwner;
            if (targetOwner && dataList.length > 0) {
                // 呼叫 Agent 的批次接收接口
                //sendPromises.push(targetOwner.onDataMultiReceived(dataList));
                targetOwner.onDataMultiReceived(dataList);
            }
        });

        //await Promise.all(sendPromises);

        /*
        this._db._log('PUSH_MULTI_DATA_SAME_TARGET', { 
            targets: groupByTarget.size, 
            total: infos.length 
        });*/
    }


}