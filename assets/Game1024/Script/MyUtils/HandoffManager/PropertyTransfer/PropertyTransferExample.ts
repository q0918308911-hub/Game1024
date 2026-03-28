/**
 * PropertyTransferManager 使用範例
 * 展示如何使用物件屬性快速轉移功能
 */

import { Node, Vec3, Animation } from 'cc';
import { IPropertyTransferAgent, IPropertyTransferData } from '../HandoffDef/IPropertyTransferAgent';
import { IReelInfo } from '../../BasicGameDataDefinition/BasicGameDataDefinition';

/**
 * 範例 1: 實作 IPropertyTransferAgent
 * 
 * Owner 需要實作此介面以支援屬性應用
 * 注意：屬性提取由 PropertyTransferManager 負責，Owner 只需要決定如何應用這些屬性
 */
class SymbolOwnerExample implements IPropertyTransferAgent {
    public readonly ownerId: number;

    constructor(id: number) {
        this.ownerId = id;
    }

    /**
     * 接收並應用屬性到目標物件
     * 這裡決定如何應用屬性：立即應用 or 使用 Tween 平滑過渡
     */
    applyProperties<T = any>(obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T>): void {
        // 根據 transferType 決定如何應用
        if (transferData?.transferType === 'smooth') {
            // 使用 Tween 平滑過渡
            console.log('使用 Tween 平滑過渡應用屬性:', properties);
            // 範例: tween(obj).to(0.5, properties).start();
        } else if (transferData?.transferType === 'delayed') {
            // 延遲應用
            console.log('延遲應用屬性');
            setTimeout(() => {
                Object.assign(obj, properties);
            }, transferData.args?.[0] || 0);
        } else {
            // 直接立即應用
            Object.assign(obj, properties);
            console.log('直接應用屬性:', properties);
        }
    }

    /**
     * 批次應用屬性到多個物件
     */
    applyMultiProperties<T = any>(applications: Array<{ obj: T; properties: Partial<T>; transferData?: IPropertyTransferData<T> }>): void {
        for (const { obj, properties, transferData } of applications) {
            this.applyProperties(obj, properties, transferData);
        }
    }
}

/**
 * 範例 2: 使用 Facade 進行屬性轉移
 */
function exampleUsage(facade: any) {
    // 假設我們有一個符號位置
    const symbolInfo = {
        reelIndex: 0,
        iconIndex: 2,
        symbolId: 5
    };

    // ========== 方式 1: 直接呼叫 API ==========
    
    // 1.1 註冊物件到 ObjectMap (需要指定 ownerId)
    const node = new Node('Symbol');
    node.position = new Vec3(100, 200, 0);
    node.scale = new Vec3(1, 1, 1);
    
    const currentOwnerId = 1; // 當前持有者 ID
    facade.registerObject(symbolInfo, node, currentOwnerId);

    // 1.2 轉移單個物件的屬性
    facade.transferObjectProperties({
        info: symbolInfo,
        targetOwnerId: 2,
        propertyKeys: ['position', 'scale'], // 只提取這些屬性
        transferType: 'smooth'
    });

    // 1.3 批次轉移多個物件的屬性
    facade.transferMultiObjectProperties([
        {
            info: { reelIndex: 0, iconIndex: 0, symbolId: 1 },
            targetOwnerId: 2,
            propertyKeys: ['position']
        },
        {
            info: { reelIndex: 0, iconIndex: 1, symbolId: 2 },
            targetOwnerId: 3,
            propertyKeys: ['scale', 'rotation']
        }
    ]);

    // ========== 方式 2: 使用建構器模式 (類似 Tween) ==========
    
    // 2.1 基本用法
    facade.transferFrom(symbolInfo)
        .extract(['position', 'scale'])  // 提取這些屬性
        .to(2)                           // 轉移給 ownerId = 2
        .transfer();                     // 執行轉移

    // 2.2 進階用法
    facade.transferFrom(symbolInfo)
        .extract(['position', 'scale', 'rotation'])
        .type('smooth')                  // 設定轉移類型
        .withArgs({ duration: 0.5 })    // 傳遞額外參數
        .to(2)
        .transfer();

    // 2.3 只建構不執行 (可以儲存起來稍後執行)
    const transferData = facade.transferFrom(symbolInfo)
        .extract(['position'])
        .to(2)
        .build();  // 只建構，不執行

    // 稍後執行
    facade.transferObjectProperties(transferData);
}

/**
 * 範例 3: Cocos Creator Node 屬性轉移
 */
function cocosNodeExample(facade: any) {
    const symbolInfo = { reelIndex: 0, iconIndex: 0, symbolId: 1 };
    
    // 建立並註冊 Node
    const sourceNode = new Node('Source');
    sourceNode.position = new Vec3(100, 200, 0);
    sourceNode.scale = new Vec3(2, 2, 1);
    
    facade.registerObject(symbolInfo, sourceNode, 1); // ownerId = 1

    // 轉移 Node 的位置和縮放屬性
    facade.transferFrom(symbolInfo)
        .extract(['position', 'scale'])
        .to(2)
        .transfer();
}

/**
 * 範例 4: Animation 屬性轉移
 */
function animationExample(facade: any) {
    const symbolInfo = { reelIndex: 1, iconIndex: 1, symbolId: 3 };
    
    // 建立並註冊 Animation
    const node = new Node('AnimatedSymbol');
    const animation = node.addComponent(Animation);
    
    facade.registerObject(symbolInfo, animation, 1); // ownerId = 1

    // 轉移 Animation 的相關屬性
    facade.transferFrom(symbolInfo)
        .extract(['clips', 'defaultClip'])
        .to(3)
        .transfer();
}

/**
 * 範例 5: 自訂物件屬性轉移
 */
function customObjectExample(facade: any) {
    interface CustomData {
        score: number;
        multiplier: number;
        isWild: boolean;
        metadata: any;
    }

    const symbolInfo = { reelIndex: 2, iconIndex: 2, symbolId: 7 };
    
    const customObj: CustomData = {
        score: 1000,
        multiplier: 2.5,
        isWild: true,
        metadata: { level: 5 }
    };
    
    facade.registerObject(symbolInfo, customObj, 1); // ownerId = 1

    // 轉移自訂物件的屬性
    facade.transferFrom(symbolInfo)
        .extract(['score', 'multiplier', 'isWild'])
        .to(4)
        .transfer();
}

/**
 * 範例 6: 完整的初始化流程
 */
function initializationExample() {
    // 假設在遊戲初始化時...
    
    // 1. 建立 SymbolRegistryCenter
    // const db = new SymbolRegistryCenter();

    // 2. 建立 CrossSystemServiceFacade
    // const facade = new CrossSystemServiceFacade(db);

    // 3. 設定各種 Manager
    // facade.setSymbolDataCtrlManager(SymbolDataCtrlManager);
    // facade.setHandoffManager(SymbolAniHandoffManager);
    // facade.setSyncManager(SyncDataHandoffManager);
    // facade.setPropertyTransferManager(PropertyTransferManager);  // <- 新增

    // 4. 註冊 Owner
    // const owner1 = new SymbolOwnerExample(1);
    // const owner2 = new SymbolOwnerExample(2);
    // facade.registerYourself(owner1);
    // facade.registerYourself(owner2);

    // 5. 開始使用屬性轉移功能
    // ...
}

export { SymbolOwnerExample, exampleUsage };
