import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { GameUtilsTools } from "../../ReferencePathForMyUtils";
import { IBaseOwner } from "../HandoffDef/IBaseOwnerDef";
import { SymbolRegistryCenter } from "../ReferencePathForHandoff";

/** 萃取符號定位所需的最小核心資料 */
export type SymbolKeyInfo = Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>;

export class SymbolDataCtrlManager<TSymbolInfo extends IReelInfo, OwnerAgent extends IBaseOwner> {

    // 採用注入方式，與其他 Manager 共享資料來源
    protected _db: SymbolRegistryCenter<TSymbolInfo, OwnerAgent>;

    // === tracing fields ===
    private _traceOn = true;        // 關掉就靜音
    private _seq = 0;               // 序號，方便串 log
    private static readonly LOG_PREFIX = '[HandoffDataCenter log]';

    private _log(tag: string, payload: Record<string, any> = {}, level: 'log' | 'warn' | 'error' = 'log'): void {
        //return;
        //const fn = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log;
        // 輸出格式：[handoff log] TAG #序號  {...payload}
        //fn(`${SymbolAniHandoffManager.LOG_PREFIX} ${tag} #${++this._seq}`, payload);
        GameUtilsTools.debugLog(SymbolDataCtrlManager.LOG_PREFIX, `${tag} #${this._seq}`, payload, level);
    }

    constructor(db: SymbolRegistryCenter<TSymbolInfo, OwnerAgent>) {
        this._db = db;
    }

    //--pick的用法
    //-https://www.typescriptlang.org/docs/handbook/utility-types.html
    //-https://pjchender.dev/ironman-2021/ironman-2021-day17/
    //-這邊就是利用pick的方式抽出3個屬性來當作索引字串

    // ====== 基礎 Owner 管理 (代理 DataCenter) ======
    public registerOwner(owner: OwnerAgent): void {
        this._db.addOwner(owner);
    }


    public unregisterOwner(ownerId: number): void {
        this._db.removeOwner(ownerId);
    }

    public findOwnerById(ownerId: number): OwnerAgent | undefined {
        return this._db.getOwner(ownerId);
    }

    public unRegisterAllBySameOwner(owner: OwnerAgent): void {

        for (const [key, entry] of this._db.registry.entries()) {
            if (entry.ownerId === owner.ownerId) this._db.registry.delete(key);
        }
    }


    public getOwnerMap(): Map<number, OwnerAgent> {
        return this._db.ownerMap;
    }

    public getRegistry(): Map<string, { info: SymbolKeyInfo, ownerId: number }> {
        return this._db.registry;
    }

    public getOwnerByInfo(info: TSymbolInfo): OwnerAgent | undefined {
        const entry = this._db.getEntry(info);
        return entry ? this._db.getOwner(entry.ownerId) : undefined;
    }

    public getOwnerById(ownerId: number): OwnerAgent | undefined {
        return this._db.getOwner(ownerId);
    }

    public addOwner(owner: OwnerAgent): void {
        this._db.addOwner(owner);
    }

    public getInfoByOwnerAgent(info: SymbolKeyInfo, owner: OwnerAgent): SymbolKeyInfo | null {
        const entry = this._db.getEntry(info);
        if (entry && entry.ownerId === owner.ownerId) return info;
        this._log('GET_INFO_MISS', { key: this._db.makeKey(info), expectedOwner: owner.ownerId, actualOwner: entry?.ownerId ?? null }, 'warn');
        return null;
    }

    public setEntry(info: SymbolKeyInfo, ownerId: number) {
        this._db.setEntry(info, ownerId);
    }

    public getEntry(info: SymbolKeyInfo) {
        return this._db.getEntry(info);
    }

    public registerData(info: SymbolKeyInfo, owner: OwnerAgent): void {
        this._db.addOwner(owner);
        const prev = this._db.getEntry(info);
        const key = this._db.makeKey(info);

        this._db.setEntry(info, owner.ownerId);

        if (!prev) {
            this._log('REGISTER', { key, ownerId: owner.ownerId, info });
        } else {
            const overwritten = prev.ownerId !== owner.ownerId;
            this._log(overwritten ? 'REGISTER_REBIND' : 'REGISTER_DUP', {
                key, fromOwner: prev.ownerId, toOwner: owner.ownerId, info
            });
        }

    }

    //--向列表移除註冊(銷毀物件或推回物件池使用)
    public unRegisterData(info: SymbolKeyInfo): void {

        const had = this._db.removeEntry(info);
        this._log(had ? 'UNREGISTER_OK' : 'UNREGISTER_MISS', { info }, had ? 'log' : 'warn');
    }

    /**
    * 批量註銷符號資訊
    * @param infos 包含座標與 ID 的陣列
    */
    public multiUnRegister(infos: SymbolKeyInfo[]): void {
        for (const info of infos) {
            const key = this._db.makeKey(info);
            // 呼叫資料中心執行刪除，並回傳是否成功
            const had = this._db.removeEntry(info);

            // 延續原本的 Log 格式，區分 OK 與 MISS
            this._log(had ? 'MULTI_UNREGISTER_OK' : 'MULTI_UNREGISTER_MISS',
                { key, info },
                had ? 'log' : 'warn'
            );
        }
    }

    /**
     * 註銷特定軸 (Reel) 的所有符號註冊資訊
     * 常用於整軸盤面清除或 Respin 開始前
     * @param reelIndex 軸索引
     */
    public unRegisterByReel(reelIndex: number): void {
        // 取得該軸目前所有的 Key (用於 Log 追蹤)
        const affectedKeys = [];
        for (const [key, entry] of this._db.registry.entries()) {
            if (entry.info.reelIndex === reelIndex) {
                affectedKeys.push(key);
            }
        }

        const deleteCount = this._db.removeEntriesByReel(reelIndex);

        /*
        this._log('UNREGISTER_BY_REEL', {
            reelIndex,
            deleteCount,
            affectedKeys
        }, deleteCount > 0 ? 'log' : 'warn');
        */
    }

    /**
     * 批量註銷多個軸的符號資訊
     * @param reelIndices 軸索引陣列，例如 [0, 2]
     */
    public multiUnRegisterByReels(reelIndices: number[]): void {

        for (const rIndex of reelIndices) {
            this.unRegisterByReel(rIndex);
        }
    }


    //批量註冊資料給同一個 Owner 實體((會主動 addOwner))
    public async multiRegister(infos: SymbolKeyInfo[], owner: OwnerAgent): Promise<void> {

        this._db.addOwner(owner);
        let rebind = 0, dup = 0, fresh = 0;

        for (const item of infos) {
            const prev = this._db.getEntry(item);
            if (!prev) fresh++; else if (prev.ownerId !== owner.ownerId) rebind++; else dup++;
            this._db.setEntry(item, owner.ownerId);
        }
        this._log('MULTI_REGISTER', { targetOwner: owner.ownerId, fresh, rebind, dup, total: infos.length });
    }


    //批量註冊資料給指定的 Owner ID (適用於 Owner 已在系統內的情況)
    public multiRegistryByID(infos: SymbolKeyInfo[], targetOwnerId: number): Promise<void> {

        const owner = this._db.getOwner(targetOwnerId);
        if (!owner) return;
        for (const item of infos) {
            this._db.setEntry(item, owner.ownerId);
        }
    }

    public releaseAll(): void {
        this._db.clear();
    }

}