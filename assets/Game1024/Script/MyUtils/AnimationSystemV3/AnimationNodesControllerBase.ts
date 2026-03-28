import { _decorator, Component, Node, Vec3, UITransform, v3, UIOpacity } from 'cc';
import { AnimationControllersPoolManager } from '../ObjectPoolManager/AnimationControllersPoolManager/AnimationControllersPoolManager';
import { DisplayStageNodeForAniNodePropertyDef } from './Definitions/DisplayStageNodeForAniNodePropertyDef';
import { DYN_NODE_PROPERTIES } from './Definitions/AnimationDataOptions';
import { AniSysTools } from './AniTools/AniSysTools';
import { AnimationStateType, IAniWithAniCtrl } from './Components/AniStateLists/AnimationPlayStateBase';
import { IAnimationControl } from './Definitions/IAnimationControl';
import { AnimationController } from './Components/AnimationController';
import { SpineController } from './Components/SpineController';
import { MultiSpineController } from './Components/MultiSpineController';
import { CustomAnimationController } from './Components/CustomAnimationController';
import { PrefabAdapter } from '../ObjectPoolManager/PrefabAdapter';

import { FindComponent } from '../FindComponent';
import { PlaySelector } from './Definitions/IPlayOptions';
import { SlotRelayLang, LocalizationSpine, Localization } from 'db://assets/Scripts/ModuleEntry';
import { IPlayAniData } from '../HandoffManager/ReferencePathForHandoff';


const { ccclass, property } = _decorator;


/*
const  DYN_NODE_PROPERTIES = {
    PREFAB_ID: 'prefabID',
    TOKEN_ID:'tokenID',
    GROUP_ID:'groupID'
}*/

@ccclass('AnimationNodesControllerBase')

export class AnimationNodesControllerBase<P> extends Component {

    /*
    @property({ type: PrefabAdapter, visible: true, displayName: 'PrefabAdapter', tooltip: '將要在物件持運作的prefab掛入' })
    protected _prefabAdapter: PrefabAdapter = null;
    */

    @property({ type: [DisplayStageNodeForAniNodePropertyDef], visible: true, displayName: 'AniNodeStageList', tooltip: '動畫節點需要添加到的節點舞台清單' })

    protected _aniNodeStageContainerList: DisplayStageNodeForAniNodePropertyDef[] = [];
    protected _aniNodeStageContainerMap: { [key: string]: Node } = {};
    protected _aryRunningNode: Node[] = [];//--這個是用來存放正在播放的node
    protected _currentLanguageKey: SlotRelayLang;

    get aryRunningNode(): Node[] {
        return this._aryRunningNode;
    }

    constructor() {
        super();

    }

    protected onLoad(): void {

        //--注入指定的舞台容器
        if (this._aniNodeStageContainerList.length > 0) {
            for (let displayStageNode of this._aniNodeStageContainerList) {
                this._aniNodeStageContainerMap[displayStageNode.key] = displayStageNode.node;
            }
        }
        this._currentLanguageKey = Localization.instance.currentLangKey;


        /*
        AnimationControllersPoolManager.getInstance().init();
        if (this._prefabAdapter) {
            AnimationControllersPoolManager.getInstance().setPrefabForPropertyList(this._prefabAdapter.prefabForPropertyList);
        }*/
    }

    public init(): void {

    }

    //--可以動態的註冊container
    public registerContainer(type: string, container: Node): void {

        if (!this._aniNodeStageContainerMap[type]) {
            this._aniNodeStageContainerMap[type] = container;
        }

    }

    public unregisterContainer(type: string): void {

        if (this._aniNodeStageContainerMap[type]) {
            delete this._aniNodeStageContainerMap[type];
        }
    }

    /*
    public getPrefabNode(prefabKey: string): Node {
        return AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(prefabKey);
    }*/

    /**
     * 新產生的或是從交換器當中抽取回來的都進來這裡推到pool裡面
     * @param targetNode 
     * @param IAniData 
     * @param group 
     * @returns 
     */
    public async addAnimationData(targetNode: Node, IAniData: IPlayAniData, group?: number[]): Promise<Node> {

        const localNodeContainer = this._aniNodeStageContainerMap[IAniData.containerNodeId];
        let localPos: Vec3 = v3(0, 0, 0);
        if (IAniData.wPos) {
            localPos = localNodeContainer.getComponent(UITransform).convertToNodeSpaceAR(IAniData.wPos);
        }

        if (!targetNode[DYN_NODE_PROPERTIES.ADDED]) {
            //--這邊要注意排列的順序,wild的顯示layer應該比其他symbol的顯示要高
            if (IAniData.groupId != null) {
                targetNode[DYN_NODE_PROPERTIES.GROUP_ID].push(IAniData.groupId);
            }
            if (group) {
                targetNode[DYN_NODE_PROPERTIES.GROUP_ID] = [...targetNode[DYN_NODE_PROPERTIES.GROUP_ID], ...group];
            }
        }

        //await this.addAniNode(targetNode, localNodeContainer);
        //targetNode.active = true;

        const multiLunageSpine = FindComponent.findComponentInChildren(targetNode, LocalizationSpine);
        if (multiLunageSpine) {
            await this.addAniNode(targetNode, localNodeContainer);
            if (!targetNode[DYN_NODE_PROPERTIES.ADDED]) {
                await this.loadLanguageObject(multiLunageSpine);
            }

        } else {
            //await this.addAniNode(targetNode, localNodeContainer);
            localNodeContainer.addChild(targetNode);
            targetNode[DYN_NODE_PROPERTIES.ADDED] = false;
            targetNode.active = true;
        }


        this._aryRunningNode.push(targetNode);
        //--抽出component 接手動畫資料處理(這邊一定要在添加到scene之後才能接著做)
        if (!targetNode[DYN_NODE_PROPERTIES.ADDED]) {

            let aniInterfaceComponent: IAnimationControl | null = null;
            if (!targetNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL]) {

                aniInterfaceComponent = AniSysTools.findAndGetIAniComponent(targetNode) as IAnimationControl;

                if (aniInterfaceComponent) {

                    aniInterfaceComponent.slotMachineIndexInfo = {
                        reelIndex: IAniData.reelIndex,
                        iconIndex: IAniData.iconIndex,
                        symbolId: IAniData.symbolId
                    }

                    if (IAniData.aniInfo) {
                        aniInterfaceComponent.setAniDataInfo(IAniData.aniInfo);
                    }

                    aniInterfaceComponent.tokenID = IAniData.tokenId;
                    targetNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL] = aniInterfaceComponent;

                }

            }
            targetNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL].init();
            targetNode[DYN_NODE_PROPERTIES.ADDED] = true;
        }

        targetNode.setPosition(localPos);
        return targetNode;
    }


    //--查詢是否存在相同的node
    public checkIsExistAniNode(checkData: P): { flag: boolean, tokenId: string } {
        const ruleCheck: { flag: boolean, tokenId: string } = this.checkSpRuleForExist(checkData);
        return ruleCheck;
    }
    /**
    * 特殊的檢查條件(同軸同格不重複相同元素)
    * @param args 
    * @returns 
    */
    protected checkSpRuleForExist = (...args): { flag: boolean, tokenId: string } => {

        const data: IPlayAniData = args[0];
        const reelIndex = data.reelIndex;
        const iconIndex = data.iconIndex;
        const iconId = data.symbolId;
        let returnData = { flag: false, tokenId: '' };
        for (let aniNode of this._aryRunningNode) {
            if (aniNode[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO].iconIndex == iconIndex &&
                aniNode[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO].reelIndex == reelIndex &&
                aniNode[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO].symbolId == iconId) {
                returnData = { flag: true, tokenId: aniNode[DYN_NODE_PROPERTIES.TOKEN_ID] };
                break;
            }
        }
        return returnData;
    }

    //--將已經存在_aryRunning的node繼續添加groupId
    public setExistAniNode(IAniData: IPlayAniData): void {
        if (IAniData.duplicateTokenId != '') {
            let targetNode = this.getAniNodeByTokenId(IAniData.duplicateTokenId);
            this.addGroupToNode(targetNode, IAniData.groupId);
        }
    }

    protected async addAniNode(aniNode: Node, container: Node): Promise<Node> {

        return new Promise((resolve, reject) => {
            container.once(Node.EventType.CHILD_ADDED, () => {
                resolve(aniNode);
            });
            if (aniNode.getComponent(UIOpacity)) {
                aniNode.getComponent(UIOpacity).opacity = 0;//--會先讀取多語系的spine圖片,所以先關閉opacity
            }
            aniNode.active = true;
            container.addChild(aniNode);
        })
    }

    protected async loadLanguageObject(comp: LocalizationSpine): Promise<void> {

        await comp.loadAllSpine(this._currentLanguageKey);
    }


    //--重複物件繼續寫入groupId
    protected duplicateGroupTargetNode(aniData: IPlayAniData): void {
        this.addGroupToNodeByTokenId(aniData.duplicateTokenId, aniData.groupId);
    }
    //--groupId=播放的群組
    protected addGroupToNode(node: Node, groupId: number): void {
        if (node) {
            node[DYN_NODE_PROPERTIES.GROUP_ID].push(groupId);
        }
    }

    protected addGroupToNodeByTokenId(token: string, groupId: number): void {
        let targetNode = this.getAniNodeByTokenId(token);
        if (targetNode) {
            targetNode[DYN_NODE_PROPERTIES.GROUP_ID].push(groupId);
            //console.log('addGroupToNodeByTokenId', this._aryRunningNode, targetNode.name, groupId);
        }
    }

    //========================================相關抽取操作_aryRunningNode========================================

    public getAniNodeByTokenId(tokenId: string): Node {

        for (let node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] == tokenId) {
                return node;
            }
        }
        return null;
    }

    public getAniNodesByGroupId(groupId: number): Node[] {

        let aryNode: Node[] = [];
        for (let node of this._aryRunningNode) {
            const groupList = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (groupList?.includes(groupId)) {
                aryNode.push(node);
            }
        }
        return aryNode;
    }

    public getAniNodeByReelAndIconIndex(reelIndex: number, iconIndex: number): Node {

        for (let node of this._aryRunningNode) {
            const symbolInfo = node[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO];
            if (symbolInfo && symbolInfo.reelIndex === reelIndex && symbolInfo.iconIndex === iconIndex) {
                return node;
            }
        }
        return null;
    }

    public getAniNodesBySameSymbolId(symbolId: number): Node[] {

        let aryNode: Node[] = [];
        for (let node of this._aryRunningNode) {
            const symbolInfo = node[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO];
            if (symbolInfo && symbolInfo.symbolId === symbolId) {
                aryNode.push(node);
            }
        }
        return aryNode;
    }

    public getAniListByGroupsCutCondition(groupIdList: number[], exclude: number[], cutDuplication: boolean = true): Node[] {

        let nodes = this.getAniNodeListByGroups(groupIdList, cutDuplication);
        for (let i = nodes.length - 1; i >= 0; i--) {
            if (exclude.includes(nodes[i][DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO].symbolId)) {
                nodes.splice(i, 1);
            }
        }
        return nodes;
    }

    /**
     * 透過一串groupID來取得ani物件.回傳資料將會是展開的ani物件
     * @param groups 
     * @param cutDuplication 替除重複的資料(一個ani有多種group身分)
     * @returns IAnimationPlugin
     */
    public getAniNodeListByGroups(groupIdList: number[], cutDuplication: boolean = true): Node[] {

        const result: Node[] = [];
        if (!Array.isArray(groupIdList) || groupIdList.length === 0) return result;

        const groupSet = new Set<number>(groupIdList);
        const addedTokenIds = cutDuplication ? new Set<any>() : null;

        for (const node of this._aryRunningNode) {
            const groups: number[] = node?.[DYN_NODE_PROPERTIES.GROUP_ID];
            const token = node?.[DYN_NODE_PROPERTIES.TOKEN_ID];

            // 缺必要屬性就跳過
            if (!Array.isArray(groups) || token == null) continue;

            if (cutDuplication) {
                // 只要任一 group 吻合就推一次
                for (let i = 0; i < groups.length; i++) {
                    if (groupSet.has(groups[i])) {
                        if (!addedTokenIds!.has(token)) {
                            result.push(node);
                            addedTokenIds!.add(token);
                        } else {
                            const tokenSame = token;
                            const rid = node?.[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO]?.reelIndex;
                            const iid = node?.[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO]?.iconIndex;
                            const sid = node?.[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO]?.symbolId;
                            console.log();
                        }
                        break; // 已推過這個 node，就跳出
                    }
                }
            } else {
                // 不去重：吻合幾個 group 就推幾次（展開）
                for (let i = 0; i < groups.length; i++) {
                    if (groupSet.has(groups[i])) {
                        result.push(node);
                    }
                }
            }
        }

        return result;
    }

    public getAniWithRemoveFromPoolByName(name: string): Node {
        for (let i = 0; i < this._aryRunningNode.length; i++) {
            const node = this._aryRunningNode[i];
            if (node.name === name) {
                this._aryRunningNode.splice(i, 1);
                return node;
            }
        }
        return null;
    }

    public getAniWithRemoveFromPoolByTokenId(tokenId: string): Node | null {
        for (let i = 0; i < this._aryRunningNode.length; i++) {
            const node = this._aryRunningNode[i];
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] === tokenId) {
                this._aryRunningNode.splice(i, 1);
                return node;
            }
        }
        return null;
    }


    //--這裡只是將物件從running裡面移除
    public getAniWithRemoveFromPoolByGroupId(groupId: number): Node[] {

        let aryNode: Node[] = [];
        for (let i: number = this._aryRunningNode.length - 1; i >= 0; i--) {
            const node = this._aryRunningNode[i];
            const groupList = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (groupList?.includes(groupId)) {
                aryNode.push(node);
                this._aryRunningNode.splice(i, 1);
            }

        }
        return aryNode;

    }

    public getAniWithRemoveFromPoolByGroups(groupIdList: number[], cutDuplication: boolean = true): Node[] {

        const result: Node[] = [];
        if (!Array.isArray(groupIdList) || groupIdList.length === 0) return result;

        const groupSet = new Set<number>(groupIdList);
        const addedTokenIds = cutDuplication ? new Set<any>() : null;

        type Hit = { idx: number; node: Node; token: any; matchCount: number };
        const hits: Hit[] = [];

        for (let i = 0; i < this._aryRunningNode.length; i++) {
            const node = this._aryRunningNode[i];
            const groups: number[] = node?.[DYN_NODE_PROPERTIES.GROUP_ID];
            const token = node?.[DYN_NODE_PROPERTIES.TOKEN_ID];
            if (!Array.isArray(groups) || token == null) continue;

            let matchCount = 0;
            for (let j = 0; j < groups.length; j++) {
                if (groupSet.has(groups[j])) matchCount++;
            }
            if (matchCount > 0) {
                hits.push({ idx: i, node, token, matchCount });
            }
        }

        if (cutDuplication) {
            for (const h of hits) {
                if (!addedTokenIds!.has(h.token)) {
                    result.push(h.node);
                    addedTokenIds!.add(h.token);
                }
            }
        } else {
            for (const h of hits) {
                for (let k = 0; k < h.matchCount; k++) {
                    result.push(h.node);
                }
            }
        }

        for (let r = hits.length - 1; r >= 0; r--) {
            this._aryRunningNode.splice(hits[r].idx, 1);
        }

        return result;
    }

    private checkDuplicateTargetNode(node: Node, ary: Node[]): boolean {
        for (let targetNode of ary) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] == targetNode[DYN_NODE_PROPERTIES.TOKEN_ID]) {
                return true;
            }
        }

        return false;
    }

    public getAniNodeByName(name: string): Node {

        for (let node of this._aryRunningNode) {
            if (node.name == name) {
                return node;
            }
        }
        return null;
    }


    /**
     * 20251227 FIX-對齊 PlaySelector
     * @param tokenId 
     * @param selector 
     */
    public playAniByTokenId(tokenId: string, selector?: PlaySelector): void {

        for (let node of this._aryRunningNode) {

            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] == tokenId) {

                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                if (aniComp) {
                    node.active = true;
                    aniComp?.playAni(selector);
                    // 如果是 void，直接break
                    break;
                }
            }
        }
    }

    /**
     * 20251227 NEW
     * 批次播放多個指定 Token 的動畫，並等待所有動畫「同時完成」
     */
    public async playMultipleAniByTokens(tokenIds: string[], selector?: PlaySelector): Promise<void> {

        for (const id of tokenIds) {
            this.playAniByTokenId(id, selector)
        }

    }

    /**
     * 依照群組 ID 播放動畫 (同步觸發)
     * @param groupId 群組標籤 (例如：第 1 軸的所有 Symbol)
     * @param selector 動畫播放選擇器 (PlaySelector)
     */
    public playAnisByGroup(groupId: number, selector?: PlaySelector): void {

        for (const node of this._aryRunningNode) {
            //直接取得動態注入的群組列表
            const groupIds: number[] = node[DYN_NODE_PROPERTIES.GROUP_ID];

            if (groupIds && groupIds.indexOf(groupId) !== -1) {
                // 直接取出動態注入的動畫組件
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    node.active = true;
                    aniComp.playAni(selector);
                }
            }
        }
    }

    public playAnisByIAniWithAniCtrl(aniList: IAniWithAniCtrl[]): void {

        for (let aniItem of aniList) {
            aniItem.IAni.playAniWithAniCtrDef(aniItem.aniCtrl);
        }
    }


    /**
     * 透過 Node Name 找到對象並播放動畫
     * @param name 節點名稱
     * @param selector 動畫播放選擇器 (取代舊有的 trackId)
     */
    public playAniByName(name: string, selector?: PlaySelector): void {

        for (const node of this._aryRunningNode) {
            // 比對節點名稱
            if (node.name === name) {
                // 直接從動態屬性取得 Animation Controller
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    //確保節點激活並執行播放
                    node.active = true;
                    aniComp.playAni(selector);
                    break;
                }
            }
        }
    }


    /**
     * 播放所有執行中節點的動畫 (全域播放)
     * @param selector 動畫播放選擇器 (取代舊有的 trackId)
     */
    public playAllAnis(selector?: PlaySelector): void {

        for (const node of this._aryRunningNode) {
            //直接從動態屬性讀取 Controller
            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

            if (aniComp) {
                node.active = true;
                aniComp.playAni(selector);
            }
        }
    }

    /**
     * 透過 TokenId 播放動畫並等待其完成 (Promise 版本)
     * @param tokenId 物件唯一識別碼
     * @param selector 動畫播放選擇器 (取代舊有的 trackId)
     */
    public async playAniByTokenIdWithPromise(tokenId: string, selector?: PlaySelector): Promise<void> {

        let aniComp: IAnimationControl | null = null;
        let targetNode: any = null;
        for (const node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] === tokenId) {
                targetNode = node;
                aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                break;
            }
        }

        if (!aniComp || !targetNode) {
            console.warn(`[AniManager] playAniByTokenIdWithPromise: 找不到 tokenId 為 ${tokenId} 的物件`);
            return Promise.resolve();
        }

        try {
            targetNode.active = true;
            // 使用新版 playAniInPromise
            await aniComp.playAniInPromise(selector);

        } catch (e) {
            // 這裡通常處理動畫載入失敗或資源遺失的情況
            console.error(`[AniManager] playAniByTokenIdWithPromise error (tokenId=${tokenId}):`, e);
        }
    }

    /**
      * 批次變更複數群組的動畫狀態
      * @param groupIds 目標群組 ID 陣列 (例如：[1, 3, 5])
      * @param selector 動畫播放選擇器 (PlaySelector)
      */
    public changeGroupAniInSameState(groupIds: number[], selector?: PlaySelector): void {

        for (const node of this._aryRunningNode) {

            const nodeGroupIds = node[DYN_NODE_PROPERTIES.GROUP_ID] as number[];
            if (!nodeGroupIds) continue;

            if (nodeGroupIds.some(id => groupIds.includes(id))) {

                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    node.active = true;
                    aniComp.playAni(selector);
                }
            }
        }
    }






    /**
     * 20250731新增特殊條件排除
     * 20251227 FIX-對齊 PlaySelector
     * 播放特定群組動畫並排除特定子群組 (Promise 版本)
     * @param groupId 目標群組 ID
     * @param excludeGroupIds 欲排除的群組 ID 陣列
     * @param selector 動畫播放選擇器 (PlaySelector)
     */
    public async playAnisByGroupWithExclusion(groupId: number, excludeGroupIds: number[] = [], selector?: PlaySelector): Promise<void> {

        const nodesToPlay: Node[] = [];

        for (const node of this._aryRunningNode) {
            const groupIds: number[] | undefined = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (!groupIds) continue;

            const isInTargetGroup = groupIds.indexOf(groupId) !== -1;
            const isInExcludeGroup = excludeGroupIds.length > 0 && groupIds.some(id => excludeGroupIds.indexOf(id) !== -1);

            if (isInTargetGroup && !isInExcludeGroup) {
                nodesToPlay.push(node);
            }
        }

        // 呼叫內部的節點批次播放方法
        await this.playAnisByNodesWithPromise(nodesToPlay, selector);
    }

    /**
     * 20250731 修改(將查找與播放分開)
     * 20251227 FIX-對齊 PlaySelector
     * 依照群組 ID 播放動畫並等待全部完成 (Promise 版本)
     * @param groupId 群組 ID
     * @param selector 動畫播放選擇器 (PlaySelector)
     */
    public async playAnisByGroupWithPromise(groupId: number, selector?: PlaySelector): Promise<void> {

        const nodesToPlay: Node[] = [];

        for (const node of this._aryRunningNode) {

            const groupIds: number[] = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (groupIds && groupIds.indexOf(groupId) !== -1) {
                nodesToPlay.push(node);
            }
        }
        // 該方法內部已具備：DYN存取、PlaySelector支援、以及 Promise.all 安全容錯處理
        await this.playAnisByNodesWithPromise(nodesToPlay, selector);
    }

    /**
     * 20250731新增
     * 20251227 FIX-對齊 PlaySelector
     * 批次播放傳入節點的動畫並等待全部完成
     * @param nodes 欲播放的 Node 陣列
     * @param selector 動畫播放選擇器 (PlaySelector)
     */
    public async playAnisByNodesWithPromise(nodes: Node[], selector?: PlaySelector): Promise<void> {

        const promises: Promise<void>[] = [];

        for (const node of nodes) {

            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

            if (aniComp) {
                node.active = true;

                // 封裝一個安全播放任務
                // 使用 catch 確保單一元件報錯不會導致 Promise.all 崩潰中斷
                const safePlayTask = aniComp.playAniInPromise(selector).catch(e => {
                    console.warn(`[AniManager] playAnisByNodesWithPromise 播放錯誤 | Node: ${node.name}`, e);
                    return Promise.resolve();
                });

                promises.push(safePlayTask);
            }
        }
        await Promise.all(promises);
    }

    /*
    public async playAnisWithPromiseAndUsePlayState(nodes: Node[], playState: PlaySelector = AnimationStateType.Idle): Promise<void> {

        const promises: Promise<void>[] = [];
        for (const node of nodes) {
            const aniExtensionComponent: IAnimationControl = AniSysTools.findAndGetIAniComponent(node) as IAnimationControl;
            node.active = true;
            const safePlay = aniExtensionComponent.playAniInPromise(playState).catch(e => {
                console.warn(`[playAnisByNodes 播放錯誤] node: ${node.name}`, e);
                throw e;
            });

            promises.push(safePlay);
        }

        await Promise.all(promises);
    }*/

    /*    
    public async playAnisByGroupWithPromiseAndUsePlayState(groupId: number, playState: PlaySelector = AnimationStateType.Idle): Promise<void> {

        const nodesToPlay: Node[] = [];
        for (let node of this._aryRunningNode) {

            if (node[DYN_NODE_PROPERTIES.GROUP_ID]?.includes(groupId)) {
                nodesToPlay.push(node);
            }
        }
        await this.playAnisWithPromiseAndUsePlayState(nodesToPlay, playState);
    }*/

    protected forTestDeBug(trackTarget: Node[], title: string): void {
        //-DYN_NODE_PROPERTIES.PREFAB_ID
        /*
        for (let i = 0; i < trackTarget.length; i++) {
            console.log(title, trackTarget[i][DYN_NODE_PROPERTIES.PREFAB_ID]);
        }
        */
    }


    /**
     * 透過節點名稱播放動畫並等待完成 (Promise 版本)
     * @param name 節點名稱
     * @param selector 動畫播放選擇器 (取代舊有的 trackId)
     */
    public async playAniByNameWithPromise(name: string, selector?: PlaySelector): Promise<void> {

        let aniComp: IAnimationControl | null = null;
        let targetNode: Node | null = null;

        for (const node of this._aryRunningNode) {
            if (node.name === name) {

                aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                targetNode = node;
                break;
            }
        }

        if (!aniComp || !targetNode) {
            console.warn(`[AniManager] playAniByNameWithPromise: 找不到節點或動畫組件 "${name}"`);
            return Promise.resolve();
        }

        try {
            targetNode.active = true;

            // 呼叫新版非同步播放接口
            // 內部會處理 TrackState 管理與 Promise resolve
            await aniComp.playAniInPromise(selector);

        } catch (e) {
            // 處理資源載入失敗等異常狀況，但不拋出錯誤以保護主流程
            console.error(`[AniManager] playAniByNameWithPromise 異常 (Name: ${name}):`, e);
        }
    }


    /**
     * 播放所有執行中節點的動畫並等待全部完成
     * @param selector 動畫播放選擇器 (預設為 null，即播放各組件預設動畫)
     */
    public async playAllAnisWithPromise(selector: PlaySelector = null): Promise<void> {

        const promises: Promise<void>[] = [];

        for (const node of this._aryRunningNode) {

            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

            if (aniComp) {
                node.active = true;

                const task = aniComp.playAniInPromise(selector).catch(e => {
                    console.warn(`[AniManager] playAllAnis 局部播放錯誤 (Node: ${node.name}):`, e);
                    return Promise.resolve();
                });

                promises.push(task);
            }
        }

        try {
            await Promise.all(promises);
        } catch (e) {
            // 這裡通常是 Promise.all 系統層級的嚴重錯誤
            console.error('[AniManager] playAllAnisWithPromise 嚴重異常:', e);
        }
    }



    /**
     * 20251227-FIX 對齊 stopAndRemoveAni
     * 停止並移除所有執行中的動畫物件
     * @param usePool 是否回收至物件池 (預設 true)
     */
    public stopAndRemoveAllAnis(usePool: boolean = true): void {

        for (const node of this._aryRunningNode) {

            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

            if (aniComp) {
                aniComp.stopPromiseAni();
            }

            node.parent?.removeChild(node);

            if (usePool) {
                const prefabId = node[DYN_NODE_PROPERTIES.PREFAB_ID];
                // 清理物件上的動態綁定資料
                this.removeSingleNodeData(node);
                AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, node);
            }
        }

        this._aryRunningNode = [];
    }

    /**
     * 停止並移除單一特定節點
     * @param node 欲移除的節點
     * @param usePool 是否回收至物件池 (預設 true)
     */
    public stopAndRemoveAni(node: Node, usePool: boolean = true): void {

        const targetToken = node[DYN_NODE_PROPERTIES.TOKEN_ID];

        for (let i = 0; i < this._aryRunningNode.length; i++) {
            const runningNode = this._aryRunningNode[i];

            if (runningNode[DYN_NODE_PROPERTIES.TOKEN_ID] === targetToken) {

                const aniComp = runningNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    aniComp.stopPromiseAni();
                }

                runningNode.parent?.removeChild(runningNode);
                this._aryRunningNode.splice(i, 1);

                if (usePool) {
                    const prefabId = runningNode[DYN_NODE_PROPERTIES.PREFAB_ID];
                    this.removeSingleNodeData(runningNode);
                    AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, runningNode);
                }

                break;
            }
        }
    }

    /**
      * 透過 TokenId 停止並移除特定的動畫物件
      * @param tokenId 物件唯一識別碼
      * @param usePool 是否回收至物件池 (預設 true)
      */
    public stopAndRemoveAniByTokenId(tokenId: string, usePool: boolean = true): void {

        for (let i = 0; i < this._aryRunningNode.length; i++) {
            const node = this._aryRunningNode[i];

            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] === tokenId) {

                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    aniComp.stopPromiseAni();
                }

                node.parent?.removeChild(node);
                this._aryRunningNode.splice(i, 1);

                if (usePool) {
                    const prefabId = node[DYN_NODE_PROPERTIES.PREFAB_ID];
                    // 必須先中斷動畫後才清理資料，確保 prefabId 的獲取不受影響
                    this.removeSingleNodeData(node);
                    AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, node);
                }

                break;
            }
        }
    }

    /**
     * 停止並移除特定群組內的所有動畫物件
     * @param groupId 目標群組 ID
     * @param usePool 是否回收至物件池 (預設 true)
     */
    public stopAndRemoveAnisByGroup(groupId: number, usePool: boolean = true): void {

        for (let i = this._aryRunningNode.length - 1; i >= 0; i--) {
            const node = this._aryRunningNode[i];

            const groupList: number[] | undefined = node[DYN_NODE_PROPERTIES.GROUP_ID];

            if (groupList && groupList.indexOf(groupId) !== -1) {

                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    aniComp.stopPromiseAni();
                }

                node.parent?.removeChild(node);
                this._aryRunningNode.splice(i, 1);

                if (usePool) {

                    const prefabId = node[DYN_NODE_PROPERTIES.PREFAB_ID];
                    this.removeSingleNodeData(node);
                    AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, node);
                }
            }
        }
    }

    public stopAllAnis(): void {

        for (let node of this._aryRunningNode) {
            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
            aniComp?.stopAni();
        }
    }

    public stopAniByName(name: string): void {

        for (let node of this._aryRunningNode) {
            if (node.name == name) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopAni();
                break;
            }
        }
    }



    public stopAniByTokenId(tokenId: string): void {

        for (let node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] == tokenId) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopAni();
                break;
            }
        }
    }

    public stopAnisByGroup(groupId: number): void {

        for (let node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.GROUP_ID].indexOf(groupId) != -1) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopAni();
            }
        }
    }

    /**
     * 強制中斷特定群組內所有正在播放的 Promise 動畫
     * @param groupId 群組 ID
     * @param backDefault 停止後是否回到預設動畫 (對齊 IAnimationControl 介面)
     */
    public stopPromiseAniByGroupId(groupId: number, backDefault: boolean = false): void {

        for (const node of this._aryRunningNode) {
            const nodeGroupIds = node[DYN_NODE_PROPERTIES.GROUP_ID] as number[];

            if (nodeGroupIds && nodeGroupIds.indexOf(groupId) !== -1) {

                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;

                if (aniComp) {
                    // 這會觸發底層 stopWith({ resolvePromises: true })
                    // 讓所有 await aniComp.playAniInPromise() 的地方強制 Resolve 並繼續跑後續邏輯
                    aniComp.stopPromiseAni(backDefault);
                }
            }
        }
    }

    /**
    20251227-NEW 
    * 強制停止所有執行中的 Promise 動畫並釋放其 Await 鎖
     * @param backDefault 是否回到預設狀態
     */
    public stopAllPromiseAnis(backDefault: boolean = false): void {

        for (const node of this._aryRunningNode) {
            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
            aniComp?.stopPromiseAni(backDefault);
        }
    }

    /**
     * 強制停止特定 TokenId 的 Promise 動畫並釋放其 Await 鎖
     * @param tokenId 物件唯一識別碼
     * @param backDefault 是否回到預設狀態
     */
    public stopPromiseAniByTokenId(tokenId: string, backDefault: boolean = false): void {
        for (const node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] === tokenId) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopPromiseAni(backDefault);
                break; // 找到即停止
            }
        }
    }

    /**
     * 透過節點名稱停止 Promise 動畫並釋放其 Await 鎖
     * @param name 節點名稱
     * @param backDefault 是否回到預設狀態
     */
    public stopPromiseAniByName(name: string, backDefault: boolean = false): void {
        for (const node of this._aryRunningNode) {
            if (node.name === name) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopPromiseAni(backDefault);
                break;
            }
        }
    }

    /**
     * 停止特定群組 Promise 動畫，但排除特定子群組
     * @param groupId 目標群組
     * @param excludeGroupIds 排除群組陣列
     * @param backDefault 是否回到預設狀態
     */
    public stopPromiseAnisByGroupWithExclusion(groupId: number, excludeGroupIds: number[] = [], backDefault: boolean = false): void {
        for (const node of this._aryRunningNode) {
            const groupIds: number[] = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (!groupIds) continue;

            const isInTarget = groupIds.indexOf(groupId) !== -1;
            const isInExclude = excludeGroupIds.length > 0 && groupIds.some(id => excludeGroupIds.indexOf(id) !== -1);

            if (isInTarget && !isInExclude) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopPromiseAni(backDefault);
            }
        }
    }



    public pauseAllAnis(): void {
        for (let node of this._aryRunningNode) {
            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
            aniComp?.pauseAni();
        }
    }

    public pauseAniByName(name: string): void {
        for (let node of this._aryRunningNode) {
            if (node.name == name) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.pauseAni();
                break;
            }
        }
    }

    public pauseAniByTokenId(tokenId: string): void {

        for (let node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] == tokenId) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.pauseAni();
                break;
            }
        }
    }

    public pauseAnisByGroup(groupId: number): void {

        for (const node of this._aryRunningNode) {
            const groupList = node[DYN_NODE_PROPERTIES.GROUP_ID];

            if (groupList?.includes(groupId)) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.pauseAni();
            }
        }
    }

    public resumeAllAni(): void {

        for (const node of this._aryRunningNode) {
            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
            aniComp?.resumeAni();
        }
    }

    public resumeAniByName(name: string): void {

        for (let node of this._aryRunningNode) {
            if (node.name == name) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.resumeAni();
                break;
            }
        }
    }

    public resumeAniByTokenId(tokenId: string): void {

        for (const node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] === tokenId) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.resumeAni();
                break;
            }
        }
    }


    public resumeAnisByGroup(groupId: number): void {

        for (const node of this._aryRunningNode) {
            const groupList = node[DYN_NODE_PROPERTIES.GROUP_ID];

            if (groupList?.includes(groupId)) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.resumeAni();
            }
        }
    }


    public closeAllNode(): void {

        for (const node of this._aryRunningNode) {
            const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
            aniComp?.stopAni();
            node.active = false;
        }
    }

    public closeNodeByName(name: string): void {
        for (const node of this._aryRunningNode) {
            if (node.name === name) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopAni();
                node.active = false;
                break;
            }
        }
    }

    public closeNodeByTokenId(tokenId: string): void {

        for (const node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] === tokenId) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopAni();
                node.active = false;
                break;
            }
        }
    }

    public closeNodesByGroup(groupId: number): void {

        for (const node of this._aryRunningNode) {
            const groupList = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (groupList?.includes(groupId)) {
                const aniComp = node[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
                aniComp?.stopAni();
                node.active = false;
            }
        }
    }


    public openAllNode(): void {
        for (let node of this._aryRunningNode) {
            node.active = true;
        }
    }


    public openNodeByName(name: string): void {
        for (let node of this._aryRunningNode) {
            if (node.name == name) {
                node.active = true;
                break;
            }
        }
    }


    public openNodeByTokenId(tokenId: string): void {

        for (let node of this._aryRunningNode) {
            if (node[DYN_NODE_PROPERTIES.TOKEN_ID] == tokenId) {
                node.active = true;
                break;
            }
        }
    }

    public openNodesByGroup(groupId: number): void {

        for (const node of this._aryRunningNode) {
            const groupList = node[DYN_NODE_PROPERTIES.GROUP_ID];
            if (groupList?.includes(groupId)) {
                node.active = true;
            }
        }
    }

    //========拔除node的動態資料========

    protected removeSingleNodeData(aniNode: Node): void {

        aniNode[DYN_NODE_PROPERTIES.GROUP_ID] = [];
        aniNode[DYN_NODE_PROPERTIES.TOKEN_ID] = '';
        aniNode[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO] = null;
        //--objPool需要用到PREFAB_ID的資料
        aniNode[DYN_NODE_PROPERTIES.PREFAB_ID] = '';
        aniNode[DYN_NODE_PROPERTIES.ADDED] = null;//--new
        aniNode[DYN_NODE_PROPERTIES.LOCKED] = null;//--new
        aniNode[DYN_NODE_PROPERTIES.OTHER] = null;//--new


        let aniInterfaceComponent: IAnimationControl | null = null;
        if (aniNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL]) {
            aniInterfaceComponent = aniNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL] as IAnimationControl;
        } else {
            aniInterfaceComponent = AniSysTools.findAndGetIAniComponent(aniNode) as IAnimationControl;
        }
        aniInterfaceComponent.slotMachineIndexInfo = null;
        aniInterfaceComponent.tokenID = '';
        aniInterfaceComponent.groupID = [];
        //--20250825新增:動態掛載IAnimationControl,recycle之前拔除參照
        if (aniNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL]) {
            aniNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL] = null;
        }

    }

    protected removeAnisNodeData(data: Node[]): void {
        for (let aniNode of data) {
            this.removeSingleNodeData(aniNode);
        }
    }

    //--把assign的資料拔掉
    protected beforeStopAndRemoveALLAniNodeData(): void {
        for (let aniNode of this._aryRunningNode) {
            this.removeSingleNodeData(aniNode);
        }
    }

}


