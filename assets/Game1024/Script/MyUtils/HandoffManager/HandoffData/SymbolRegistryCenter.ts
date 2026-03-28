import { Game } from "cc";
import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { GameUtilsTools } from "../../GameUtilsTool";
import { IBaseOwner } from "../HandoffDef/IBaseOwnerDef";


/** 萃取符號定位所需的最小核心資料 */
export type SymbolKeyInfo = Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>;

export class SymbolRegistryCenter<TSymbolInfo extends IReelInfo, OwnerAgent extends IBaseOwner> {

    private _ownerMap: Map<number, OwnerAgent> = new Map();
    private _registry: Map<string, { info: SymbolKeyInfo, ownerId: number }> = new Map();
    //存儲實際物件引用（Node、Animation 等）以供快速屬性轉移使用
    private _objectMap: Map<string, { obj: any, ownerId: number }> = new Map();

    public get ownerMap() { return this._ownerMap; }
    public get registry() { return this._registry; }
    public get objectMap() { return this._objectMap; }


    private _traceOn = true;        // 關掉就靜音
    private _seq = 0;               // 序號，方便串 log
    private static readonly LOG_PREFIX = '[handoff log]';

    public _log(tag: string, payload: Record<string, any> = {}, level: 'log' | 'warn' | 'error' = 'log'): void {
        //return;
        //const fn = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log;
        // 輸出格式：[handoff log] TAG #序號  {...payload}
        //fn(`${SymbolAniHandoffManager.LOG_PREFIX} ${tag} #${++this._seq}`, payload);
        GameUtilsTools.debugLog(SymbolRegistryCenter.LOG_PREFIX, `${tag} #${this._seq}`, payload, level);
    }

    /** 組成唯一 Key */
    public makeKey(info: SymbolKeyInfo): string {
        return `${info.reelIndex}:${info.iconIndex}:${info.symbolId}`;
    }

    // --- Owner 管理 ---
    public addOwner(owner: OwnerAgent): void {
        if (!this._ownerMap.has(owner.ownerId)) this._ownerMap.set(owner.ownerId, owner);
    }

    public getOwner(ownerId: number): OwnerAgent | undefined {
        return this._ownerMap.get(ownerId);
    }

    public removeOwner(ownerId: number): void {
        this._ownerMap.delete(ownerId);
    }

    // === 註冊與狀態查詢 ===
    public setRegistry(info: SymbolKeyInfo, ownerId: number): void {
        this._registry.set(this.makeKey(info), { info, ownerId });
    }

    // --- 註冊與查找 ---
    public setEntry(info: SymbolKeyInfo, ownerId: number) {
        const key = this.makeKey(info);
        this._registry.set(key, { info, ownerId });
    }

    public getEntry(info: SymbolKeyInfo) {
        return this._registry.get(this.makeKey(info));
    }

    public removeEntry(info: SymbolKeyInfo): boolean {
        
        const key = this.makeKey(info);
        const registryDeleted = this._registry.delete(key);
        const objectDeleted = this._objectMap.delete(key);
        return registryDeleted;
    }

    /** * 刪除指定軸 (reelIndex) 的所有註冊資料 
     * @param reelIndex 軸索引
     * @returns 回傳被刪除的數量
     */
    public removeEntriesByReel(reelIndex: number): number {

        let deleteCount = 0;
        for (const [key, entry] of this._registry.entries()) {
            if (entry.info.reelIndex === reelIndex) {
                const deleted = this._registry.delete(key);
                this._objectMap.delete(key); // 同步刪除 objectMap 中的資料
                if (deleted) deleteCount++;
            }
        }

        /*
        if (deleteCount > 0) {
            this._log('removeEntriesByReel', { reelIndex, deleteCount });
        }*/

        return deleteCount;
    }

    // --- 物件管理 ---
    //設定物件引用
    public setObject(info: SymbolKeyInfo, obj: any, ownerId: number): void {
        this._objectMap.set(this.makeKey(info), { obj, ownerId });
    }

    //取得物件引用
    public getObject(info: SymbolKeyInfo): any | undefined {
        const entry = this._objectMap.get(this.makeKey(info));
        return entry?.obj;
    }

    //取得物件完整資料（包含 ownerId)
    public getObjectEntry(info: SymbolKeyInfo): { obj: any, ownerId: number } | undefined {
        return this._objectMap.get(this.makeKey(info));
    }

    //移除物件引用 
    public removeObject(info: SymbolKeyInfo): boolean {
        return this._objectMap.delete(this.makeKey(info));
    }

    /** * 找出特定位置的所有 Entry 
     * 移動到這裡是因為這屬於純資料檢索，不涉及動畫表演
     */
    public getEntriesAtCell(reelIndex: number, iconIndex: number): Array<{ info: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, owner: OwnerAgent }> {

        const result: Array<{ info: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>, owner: OwnerAgent }> = [];

        for (const entry of this._registry.values()) {
            if (entry.info.reelIndex === reelIndex && entry.info.iconIndex === iconIndex) {
                const owner = this._ownerMap.get(entry.ownerId);
                if (owner) {
                    result.push({ info: entry.info, owner });
                } else {
                    console.warn(`[getEntriesAtCell] ownerId=${entry.ownerId} 存在於註冊表，但在 ownerMap 中找不到實體`);
                }
            }
        }
        return result;
    }

    /*
    public deleteEntry(info: Pick<TSymbolInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): boolean {
        return this._registry.delete(this.makeKey(info));
    }*/


    /** 獲取特定 Owner 控制的所有符號 Key */
    public getKeysByOwner(ownerId: number): string[] {
        const keys: string[] = [];
        for (const [key, entry] of this._registry.entries()) {
            if (entry.ownerId === ownerId) keys.push(key);
        }
        return keys;
    }

    public clear() {
        
        this._registry.clear();
        this._objectMap.clear();
    }

    public debugCheckAllOwners(): void {
        // 透過 _db.registry 取得所有目前的註冊資料
        /*
        for (const [key, entry] of this.registry.entries()) {
            // 去 _db.ownerMap 找看看實體還在不在
            const owner = this.getOwner(entry.ownerId);

            // 延續您原本使用的 GameUtilsTools 格式
            GameUtilsTools.debugLog(
                SymbolRegistryCenter.LOG_PREFIX,
                'debugCheckAllOwners',
                {
                    message: `Entry key=${key}, ownerId=${entry.ownerId}, ownerFound=${!!owner}`
                }
            );
        }*/

        GameUtilsTools.debugLog(
            SymbolRegistryCenter.LOG_PREFIX,
            'debugCheckAllOwners',
            {
                message: `=== End of debugCheckAllOwners ===`,
                data: this.registry
            }
        );
    }
}