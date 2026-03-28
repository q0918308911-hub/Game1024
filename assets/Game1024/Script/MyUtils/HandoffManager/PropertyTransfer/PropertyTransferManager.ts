import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';
import { SymbolRegistryCenter } from '../HandoffData/SymbolRegistryCenter';
import { IPropertyTransferAgent, IPropertyTransferData, IRegisterObjectData } from '../HandoffDef/IPropertyTransferAgent';

/**
 * [物件屬性快速轉移管理器]
 * 職責：負責從來源物件提取屬性並轉移給目標 Owner，類似 Cocos Creator 的 Tween 功能
 * 特色：動態識別物件屬性、快速屬性轉移、不改變 Registry 的控制權
 */
export class PropertyTransferManager<
    TReelInfo extends IReelInfo,
    TOwner extends IPropertyTransferAgent
> {
    constructor(private _db: SymbolRegistryCenter<TReelInfo, TOwner>) { }


    /**
     * 批次註冊物件資料到 _objectMap
     * @param dataList 包含 IReelInfo + obj + ownerId 的資料陣列
     */
    public multiRegisterData(dataList: IRegisterObjectData[]): void {
        
        for (const data of dataList) {
            // 提取 IReelInfo 的核心資訊
            const info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'> = {
                reelIndex: data.reelIndex,
                iconIndex: data.iconIndex,
                symbolId: data.symbolId
            };

            // 註冊到 _objectMap
            this._db.setObject(info, data.obj, data.ownerId);

            // 可選：同時註冊到 _registry（如果需要的話）
            // this._db.setEntry(info, data.ownerId);
        }

        console.log(`[PropertyTransferManager] 批次註冊完成，共 ${dataList.length} 筆資料`);
    }

    /**
     * 批次註冊物件資料（包含 Registry 和 ObjectMap）
     * 如果需要同時註冊到 _registry 和 _objectMap，使用此方法
     * @param dataList 包含 IReelInfo + obj + ownerId 的資料陣列
     */
    public multiRegisterDataFull(dataList: IRegisterObjectData[]): void {
        
        for (const data of dataList) {
            // 提取 IReelInfo 的核心資訊
            const info: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'> = {
                reelIndex: data.reelIndex,
                iconIndex: data.iconIndex,
                symbolId: data.symbolId
            };

            // 同時註冊到 _registry 和 _objectMap
            this._db.setEntry(info, data.ownerId);
            this._db.setObject(info, data.obj, data.ownerId);
        }

        console.log();

    }

    /**
     * 批次取消註冊物件資料（僅從 _objectMap 移除）
     * @param infoList IReelInfo 資料陣列
     * @returns 成功移除的數量
     */
    public multiUnRegisterData(infoList: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number {
        
        let removedCount = 0;

        for (const info of infoList) {
            const removed = this._db.removeObject(info);
            if (removed) {
                removedCount++;
            }
        }

        return removedCount;
    }

     /**
     * 批次取消註冊物件資料（同時從 _registry 和 _objectMap 移除）
     * @param infoList IReelInfo 資料陣列
     * @returns 成功移除的數量
     */
    public multiUnRegisterDataFull(infoList: Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>[]): number {
        let removedCount = 0;

        for (const info of infoList) {
            // 同時從 _registry 和 _objectMap 移除
            const registryRemoved = this._db.removeEntry(info);
            const objectRemoved = this._db.removeObject(info);
            
            // 只要其中一個成功移除就計數
            if (registryRemoved || objectRemoved) {
                removedCount++;
            }
        }

        return removedCount;
    }

    /**
     * 轉移單個物件的屬性到目標 Owner
     * @param transferData 轉移資料定義
     */
    public transferProperties<T = any>(transferData: IPropertyTransferData<T>): void {
        // 1. 從 ObjectMap 取得實際物件
        const sourceObj = this._db.getObject(transferData.info) as T;
        if (!sourceObj) {
            console.warn(`[PropertyTransferManager] 找不到物件:`, transferData.info);
            return;
        }

        // 2. 直接從物件提取屬性（不需要透過 owner）
        const extractedProperties = this._extractProperties(sourceObj, transferData);
        if (!extractedProperties) {
            console.warn(`[PropertyTransferManager] 無法提取屬性`);
            return;
        }

        // 3. 取得目標 Owner
        const targetOwner = this._db.getOwner(transferData.targetOwnerId);
        if (!targetOwner) {
            console.warn(`[PropertyTransferManager] 目標 Owner 不存在:`, transferData.targetOwnerId);
            return;
        }

        // 4. 讓目標 Owner 決定如何應用這些屬性
        targetOwner.applyProperties(sourceObj, extractedProperties, transferData);
    }

    /**
     * 內部方法：直接從物件提取指定的屬性
     * PS-此方法僅限用JS
     */
    private _extractProperties<T>(obj: T, transferData: IPropertyTransferData<T>): Partial<T> | null {
        const result: Partial<T> = {};

        // 模式 1: 如果指定了要提取的屬性鍵值
        if (transferData.propertyKeys && transferData.propertyKeys.length > 0) {
            for (const key of transferData.propertyKeys) {
                if (obj && typeof obj === 'object' && key in obj) {
                    result[key as keyof T] = obj[key as keyof T];//--直接取值
                }
            }
        }
        // 模式 2: 如果直接提供了屬性值，使用提供的值
        else if (transferData.properties) {
            Object.assign(result, transferData.properties);
        }
        // 模式 3: 否則提取所有可枚舉屬性（謹慎使用）
        else {
            Object.assign(result, obj);
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    /**
     * 批次轉移多個物件的屬性
     * 自動根據每筆資料的 targetOwnerId 分組並派發
     * @param transferDataList 轉移資料陣列
     */
    public transferMultiProperties<T = any>(transferDataList: IPropertyTransferData<T>[]): void {
        // 按目標 Owner 分組
        const groupByTarget = new Map<number, Array<{
            obj: T,
            properties: Partial<T>,
            transferData: IPropertyTransferData<T>
        }>>();

        // --- 階段 1: 提取所有屬性並分組 ---
        for (const transferData of transferDataList) {
            const sourceObj = this._db.getObject(transferData.info) as T;
            if (!sourceObj) {
                console.warn(`[PropertyTransferManager] 找不到物件:`, transferData.info);
                continue;
            }

            // 直接提取屬性
            const extractedProperties = this._extractProperties(sourceObj, transferData);
            if (!extractedProperties) {
                console.warn(`[PropertyTransferManager] 無法提取屬性，物件:`, transferData.info);
                continue;
            }

            // 將提取的屬性組裝成 payload（供接收方直接使用）
            if (!transferData.payload) {
                transferData.payload = {};
            }
            
            // 將提取的屬性寫入 payload
            Object.assign(transferData.payload, {
                reelIndex: transferData.info.reelIndex,
                iconIndex: transferData.info.iconIndex,
                symbolId: transferData.info.symbolId,
                ...extractedProperties // 包含 worldPosition 等提取的屬性
            });

            // 分組
            const targetId = transferData.targetOwnerId;
            if (!groupByTarget.has(targetId)) {
                groupByTarget.set(targetId, []);
            }

            groupByTarget.get(targetId)!.push({
                obj: sourceObj,
                properties: extractedProperties,
                transferData: transferData // 已經包含完整的 payload
            });
        }

        // --- 階段 2: 批次應用到各個目標 ---
        groupByTarget.forEach((applications, targetId) => {
            const targetOwner = this._db.getOwner(targetId);
            if (targetOwner && applications.length > 0) {
                targetOwner.applyMultiProperties(applications);
            }
        });
    }

    /**
     * 快速建構器模式：類似 Tween 的鏈式呼叫
     * 範例：
     * manager.from(info)
     *        .extract(['position', 'scale'])
     *        .to(targetOwnerId)
     *        .transfer()
     */
    public from<T = any>(info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>): PropertyTransferBuilder<TReelInfo, TOwner, T> {
        return new PropertyTransferBuilder<TReelInfo, TOwner, T>(this, info);
    }
}

/**
 * 屬性轉移建構器 - 提供類似 Tween 的鏈式 API
 */
export class PropertyTransferBuilder<
    TReelInfo extends IReelInfo,
    TOwner extends IPropertyTransferAgent,
    T = any
> {
    private _transferData: IPropertyTransferData<T>;

    constructor(
        private _manager: PropertyTransferManager<TReelInfo, TOwner>,
        info: Pick<TReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>
    ) {
        this._transferData = {
            info: info as Pick<IReelInfo, 'reelIndex' | 'iconIndex' | 'symbolId'>,
            targetOwnerId: -1 // 必須設定
        };
    }

    /**
     * 指定要提取的屬性鍵值
     */
    public extract(propertyKeys: string[]): this {
        this._transferData.propertyKeys = propertyKeys;
        return this;
    }

    /**
     * 直接設定要轉移的屬性值
     */
    public properties(properties: Partial<T>): this {
        this._transferData.properties = properties;
        return this;
    }

    /**
     * 指定目標接收者
     */
    public to(targetOwnerId: number): this {
        this._transferData.targetOwnerId = targetOwnerId;
        return this;
    }

    /**
     * 設定轉移類型
     */
    public type(transferType: string): this {
        this._transferData.transferType = transferType;
        return this;
    }

    /**
     * 設定額外參數
     */
    public withArgs(...args: any[]): this {
        this._transferData.args = args;
        return this;
    }

    /**
     * 執行轉移
     */
    public transfer(): void {
        if (this._transferData.targetOwnerId === -1) {
            console.error('[PropertyTransferBuilder] 必須使用 .to(ownerId) 指定目標接收者');
            return;
        }
        this._manager.transferProperties(this._transferData);
    }

    /**
     * 取得建構的轉移資料（不執行）
     */
    public build(): IPropertyTransferData<T> {
        return this._transferData;
    }
}
