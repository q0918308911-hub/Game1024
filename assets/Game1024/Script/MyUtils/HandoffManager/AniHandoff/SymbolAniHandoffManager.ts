import { Node } from 'cc';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';;
import { IHandoffAniData, ISymbolOwnerAgent } from '../HandoffDef/IAniHandoff'
import { GameUtilsTools } from '../../GameUtilsTool';
import { SymbolRegistryCenter } from '../HandoffData/SymbolRegistryCenter';

//import { SymbolHandoffDataCenter } from '../HandoffData/SymbolHandoffDataCenter';
/**
 * 負責管理符號動畫的控制權轉移<只負責做轉移的動作>
 * 這裡只會紀錄資料(reelIndex+iconIndex+symbolId=key)與控制權轉移的邏輯
 */
export class SymbolAniHandoffManager<TSymbolInfo extends IReelInfo, OwnerAgent extends ISymbolOwnerAgent> {

    //--ownerList
    protected _db: SymbolRegistryCenter<TSymbolInfo, OwnerAgent>;

    constructor(db?: SymbolRegistryCenter<TSymbolInfo, OwnerAgent>) {

        this._db = db ? db : new SymbolRegistryCenter<TSymbolInfo, OwnerAgent>();
    }



    // ====== 交接（批次 / 單筆 / 指定） ======
    /**
     * 由目前 owner 主動將自己擁有的<所有-ALL>動畫位置資料交給另一個 owner（透過 ownerId 找）
     */
    public handoffByOwnerId(currentOwner: OwnerAgent, targetOwnerId: number): void {

        const newOwner = this._db.getOwner(targetOwnerId);
        if (!newOwner) {
            this._db._log('HANDOFF_OWNER_MISS_TARGET', { targetOwnerId }, 'warn');
            return;
        }
        if (currentOwner.ownerId === newOwner.ownerId) return;

        let moved = 0;
        for (const [key, entry] of this._db.registry.entries()) {
            if (entry.ownerId !== currentOwner.ownerId) continue;

            const targetNode = currentOwner.beforeRelease(entry.info);
            newOwner.afterAcquire(entry.info, targetNode);
            this._db.setEntry(entry.info, newOwner.ownerId);
            moved++;
        }
        this._db._log('HANDOFF_BY_OWNER_ID', { from: currentOwner.ownerId, to: targetOwnerId, moved });
    }


    /**
     * 單筆交接 — 指定一個 symbol 轉交給指定的 ownerId
     * PS:在轉移所有權的時候可以利用info夾帶你想要夾出去的資料(必須吻合約束汎型)
     * @param info 要交接的 symbol 位置信息（必須包含 symbolId）
     * @param targetOwnerId 目標 owner 的唯一 ID
     */
    public async handoffSingleByOwnerId(info: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, targetOwnerId: number): Promise<void> {

        const entry = this._db.getEntry(info);
        if (!entry) {
            this._db._log('HANDOFF_SINGLE_MISS_ENTRY', { targetOwnerId }, 'warn');
            return;
        }
        if (entry.ownerId === targetOwnerId) return;

        const currentOwner = this._db.getOwner(entry.ownerId);
        let newOwner = this._db.getOwner(targetOwnerId);

        if (!currentOwner || !newOwner) {
            this._db._log('HANDOFF_SINGLE_FAIL', { entryOwner: !!currentOwner, targetOwner: !!newOwner }, 'warn');
            return;
        }

        const targetNode = currentOwner.beforeRelease(info);
        await newOwner.afterAcquire(info, targetNode);
        this._db.setEntry(info, targetOwnerId);
        this._db._log('HANDOFF_SINGLE_OK', { from: currentOwner.ownerId, to: targetOwnerId });
    }

    //------動畫資料轉交(不包含控制權)--------------------------------------------------------------------------------
    public async handoffAniData(info: IHandoffAniData, newOwner: OwnerAgent): Promise<IHandoffAniData | null> {

        const entry = this._db.getEntry(info.info);
        if (!entry || entry.ownerId === newOwner.ownerId) return;

        const currentOwner = this._db.getOwner(entry.ownerId);
        if (!currentOwner) {
            this._db._log('HANDOFF_ANI_DATA_MISS_OWNER', { ownerId: entry.ownerId }, 'warn');
            return null;
        }
        const transOwner = this._db.getOwner(newOwner.ownerId);
        if (!transOwner) {
            this._db._log('HANDOFF_ANI_DATA_MISS_TARGET_OWNER', { ownerId: newOwner.ownerId }, 'warn');
            return null;
        }

        const aniData = currentOwner.getAcquiredData(info);
        if (!aniData) {
            this._db._log('HANDOFF_ANI_DATA_MISS_ANI_DATA', { info: info.info }, 'warn');
            return null;
        }

        const returnData: IHandoffAniData = {
            info: info.info,
            payload: aniData.payload,
            args: aniData.args
        };

        await transOwner.onDataReceived(returnData);

    }

    //--PS:在轉移所有權的時候可以利用info夾帶你想要夾出去的資料(必須吻合約束汎型)
    public async handoff(info: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, newOwner: OwnerAgent): Promise<void> {
        const entry = this._db.getEntry(info);
        if (!entry || entry.ownerId === newOwner.ownerId) return;

        const currentOwner = this._db.getOwner(entry.ownerId);
        if (!currentOwner) return;

        this._db.addOwner(newOwner);
        const targetNode = currentOwner.beforeRelease(info);
        await newOwner.afterAcquire(info, targetNode);
        this._db.setEntry(info, newOwner.ownerId);

        this._db._log('HANDOFF_OK', { from: currentOwner.ownerId, to: newOwner.ownerId });
    }

    public async multiHandoffBySameOwnerID(infos: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], targetOwnerId: number): Promise<void> {
        const newOwner = this._db.getOwner(targetOwnerId);
        if (!newOwner) return;

        const multiTargetNode = new Map<string, { data: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, node: Node }>();
        for (const info of infos) {
            const entry = this._db.getEntry(info);
            if (!entry || entry.ownerId === newOwner.ownerId) continue;

            const currentOwner = this._db.getOwner(entry.ownerId);
            if (!currentOwner) continue;

            const targetNode = currentOwner.beforeRelease(info);
            multiTargetNode.set(this._db.makeKey(info), { data: info, node: targetNode });
            this._db.setEntry(info, newOwner.ownerId);
        }

        if (multiTargetNode.size > 0) await newOwner.afterMultiAcquire(multiTargetNode);
        this._db._log('MULTI_HANDOFF_BY_ID', { to: targetOwnerId, count: multiTargetNode.size });
    }

    public async multiHandoffBySameOwner(infos: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[], newOwner: OwnerAgent): Promise<void> {

        this._db.addOwner(newOwner);
        const multiTargetNode = new Map<string, { data: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, node: Node }>();

        for (const info of infos) {
            const entry = this._db.getEntry(info);
            if (!entry || entry.ownerId === newOwner.ownerId) continue;

            const currentOwner = this._db.getOwner(entry.ownerId);
            if (!currentOwner) continue;

            const targetNode = currentOwner.beforeRelease(info);
            multiTargetNode.set(this._db.makeKey(info), { data: info, node: targetNode });
            this._db.setEntry(info, newOwner.ownerId);
        }

        if (multiTargetNode.size > 0) await newOwner.afterMultiAcquire(multiTargetNode);
        this._db._log('MULTI_HANDOFF', { to: newOwner.ownerId, count: multiTargetNode.size });
    }

    public debugSnapshotStats() {

        const byOwner: Record<number, number> = {};
        for (const { ownerId } of this._db.registry.values()) {
            byOwner[ownerId] = (byOwner[ownerId] ?? 0) + 1;
        }
        this._db._log('SNAPSHOT', { owners: this._db.ownerMap.size, entries: this._db.registry.size, byOwner });
    }


}