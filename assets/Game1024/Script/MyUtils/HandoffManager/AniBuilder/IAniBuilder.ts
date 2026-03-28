import { Vec3 } from "cc";
import { GameState } from "../../GameStateConfigDef/GameStateConfigDef";
import { IReelInfo } from "../../BasicGameDataDefinition/BasicGameDataDefinition";
import { AnimationPlayInfo } from "../../AnimationSystemV3/Definitions/AnimationDataOptions";



export interface ISymbolAniKey extends IReelInfo {
    aniId: string;//--spine
    prefabKey?: string; // 可選，預設的prefabKey
}

export interface IProcessContext {
    gameState: GameState;
    //currentCamp?:number; //--玩家陣營，預設為-1
}

export interface IProcessInput extends IReelInfo {
    score: number;
    worldPos?: Vec3;        // 需要時才填
    //camp?: number;        // 上一款遊戲用的 
}

//---這個是用來設定要播放的動畫資料(這個要放回animationPlayInfo裡面)
export interface IPlayAniData extends ISymbolAniKey {

    tokenId: string,//--這個是用來識別這個prefabNode的唯一識別碼
    containerNodeId?: string,//--這個是用來放置prefab的node id
    duplicateTokenId?: string,//--重複的tokenID
    wPos?: Vec3,//--要把gameIcon的位置傳進來(要轉換成世界座標)
    aniInfo?: AnimationPlayInfo //--(聯合型別)這個是用來設定要播放的動畫資料
    otherData?: any//--其他的資料..自己塞吧
}

export interface IProcessSlotSymbolAniData<
    T,                      // 輸入的資料模型（你自由定義）
    P extends IPlayAniData = IPlayAniData,       // 輸出的 play 資料模型（可自訂）
    K extends ISymbolAniKey = ISymbolAniKey       // AniKey（可自訂）
> {
    /** 1) 決定 Prefab key */
    getPrefabKey(inp: T): string;

    /** 2) 決定播放參數；若外部自己塞就回傳 null */
    //getAnimationPlayInfo(inp: T): AnimationPlayInfo | null;
    getAnimationPlayInfo(inp: T): null;

    /** 3) 組出 play 資料物件（純資料，不碰控制器/物件池） */
    createPlayAniData(inp: T, containerNodeId?: string): P;

    /** 4) 產生動畫鍵值（後續註冊/交接會用到） */
    getAniKey(inp: T): K;


}


export interface ISymbolAniMediator<
    T,
    C,
    Key,
    P extends IPlayAniData = IPlayAniData,
    K extends ISymbolAniKey = ISymbolAniKey,
> {
    /** 以 T 輸入生成 Node（一般情境） */
    //requestNodeByInput(inp: T): Promise<C>;
    requestNodeByInput(inp: T): C;
    /** 以 K（AniKey）輸入生成 Node（流程圖裡的 SymbolAniKey 路徑） */
    /**你也可以透過P(AniKey)輸入生成 Node..用於檢查是否重複node後再來拿**/
    requestNodeByKey(key: K): C;
    /** （可選）只產資料不取節點，提供需要的人用 */
    buildPlayData(inp: T): P;
    /** 修飾 Node（例如：塞入動畫控制器的參數、設定群組ID等） */
    //decorate(target: C, playData: P): void | Promise<void>;
    decorate(target: C, playData: P): void;
    /** 設定/覆寫群組資料（中線群組等）：預設可「就地修改」 */
    setAniGroup(inp: C, groupId: number): void;
}

/**
 * 再去修飾產生出來的aniNode
 * 就是再把資料塞進去這個aniNode裡面,或是你要幹嘛就幹嘛
 * 例如: 塞入動畫控制器的參數、設定群組ID等
 * 
 */
export interface ISymbolAniMediatorHooks<C, P> {
    //--這裡不一定是接受node型別(只要是物件都可以)
    decorate?(target: C, playData: P): void | Promise<void>;
    /** 5) 設定/覆寫群組資料（中線群組等）：預設可「就地修改」 */
    setAniGroup(inp: C, groupId: number): void;
}