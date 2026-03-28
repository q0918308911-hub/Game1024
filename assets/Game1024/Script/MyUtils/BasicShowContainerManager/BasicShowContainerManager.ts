import { _decorator, Node, Component } from 'cc';
import { IBasicShowContainer, IBasicShowContainerManager } from './IBasicShowContainerManager';

import { ContainerWholeBehavior } from './Component/ContainerWholeBehavior';
import { GameNodeContainer } from './Definitions/GameNodeContainer';
import { GameState } from '../GameStateConfigDef/GameStateConfigDef';
import { FindNode } from '../FindNode';
import { ContainerBasicBehavior } from './Component/ContainerBasicBehavior';


const { ccclass, property } = _decorator;
/**
 * 基礎顯示容器管理器,適用多場景調度變化的專案
 * 他只負責一件事情就是開關顯示容器,可以藉由分組來達到不同遊戲狀態下的顯示容器
 * 這邊做成約束泛型類別讓基礎容器更有彈性一點
 * 20250905-
 * 移除繼承component..因為TS不能用多重繼承的方式,在要繼承其他component的同時又要繼承這個類別
 * 又要讓property在編輯器可以被看見,所以改成組合的方式來達成
 */
//@ccclass('BasicShowContainerManager')
export class BasicShowContainerManager implements IBasicShowContainerManager {

    /**
     * 下列的裝飾器將保留,透過組合的方式將BasicShowContainerManager塞進去
     */
    //@property({ type: GameNodeContainer, visible: true, displayName: 'NG_顯示系統', group: 'normal_view', tooltip: 'NG相關會顯示的東西' })
    protected _ng_Show_Sys: GameNodeContainer = new GameNodeContainer();

    protected _rs_Show_Sys: GameNodeContainer = new GameNodeContainer();

    //@property({ type: GameNodeContainer, visible: true, displayName: 'FG_顯示系統', group: 'fg_view', tooltip: 'FG相關會顯示的東西' })
    protected _fg_Show_Sys: GameNodeContainer = new GameNodeContainer();

    //@property({ type: Node, visible: true, displayName: 'SlotFrame', tooltip: 'SlotFrame_遊戲使用的frame_Node' })
    protected _slotFrameNode: Node = new Node();

    //@property({ type: Node, visible: true, displayName: 'Bg_container', tooltip: '裝全部bg的container' })
    protected _bgContainerNode: Node = new Node();

    protected _showContainerMap: Map<GameState, GameNodeContainer[]>;

    get showContainerMap(): Map<GameState, GameNodeContainer[]> {
        return this._showContainerMap;
    }

    get slotFrameNode(): Node {
        return this._slotFrameNode;
    }

    get bgContainerNode(): Node {
        return this._bgContainerNode;
    }

    get ng_Show_Sys(): GameNodeContainer {
        return this._ng_Show_Sys;
    }

    get rs_Show_Sys(): GameNodeContainer {
        return this._rs_Show_Sys;
    }

    get fg_Show_Sys(): GameNodeContainer {
        return this._fg_Show_Sys;
    }

    set slotFrameNode(value: Node) {
        this._slotFrameNode = value;
    }

    set bgContainerNode(value: Node) {
        this._bgContainerNode = value;
    }

    set ng_Show_Sys(value: GameNodeContainer) {
        this._ng_Show_Sys = value;
    }

    set rs_Show_Sys(value: GameNodeContainer) {
        this._rs_Show_Sys = value;
    }

    set fg_Show_Sys(value: GameNodeContainer) {
        this._fg_Show_Sys = value;
    }

    constructor() {
        this._showContainerMap = new Map<GameState, GameNodeContainer[]>();
    }

    public initMap(): void {
        this.setContainerMap(GameState.NORMAL, this._ng_Show_Sys);
        this.setContainerMap(GameState.FREE_GAME, this._fg_Show_Sys);
        this.setContainerMap(GameState.RE_SPINE, this._rs_Show_Sys);
    }


    public setContainerMap(gameState: GameState, container: GameNodeContainer): void {

        let aryContainer: GameNodeContainer[];

        if (this._showContainerMap.has(gameState)) {
            aryContainer = this._showContainerMap.get(gameState);
        } else {
            this._showContainerMap.set(gameState, []);
            aryContainer = this._showContainerMap.get(gameState);
        }
        aryContainer.push(container);
        this._showContainerMap.set(gameState, aryContainer);//-?
    }

    public register(): void {

    }

    public showContainer(containerId: string): void {
        // Implementation
        const container = this.getContainerNodeByKey(containerId);
        if (container) {
            container.openContainer();
        }
    }

    public hideContainer(containerId: string): void {
        // Implementation
        const container = this.getContainerNodeByKey(containerId);
        if (container) {
            container.closeContainer();
        }
    }

    public checkChildrenContains(node: Node, rootNodeName: string): boolean {
        const targetNode = FindNode.findChildByNameRecursive(node, rootNodeName);
        if (targetNode) {
            if (targetNode.children.length > 0) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    public getContainerNodeByKey(key: string): ContainerWholeBehavior | null {
        // Implementation
        for (const containerList of this._showContainerMap.values()) {
            for (const aryNodeContainer of containerList) {
                for (const node of aryNodeContainer.gameNodeHashInfo) {
                    if (node.nodeName === key) {
                        return node.displayNode;
                    }
                }
            }
        }
        return null;//--沒找到就null
    }

    public getContainerListByState(gameState: GameState): ContainerWholeBehavior[] | null {
        // Implementation
        if (this._showContainerMap.has(gameState)) {
            const containerList = this._showContainerMap.get(gameState);
            if (!containerList) return null;

            const result: ContainerWholeBehavior[] = [];
            for (const aryNodeContainer of containerList) {
                for (const node of aryNodeContainer.gameNodeHashInfo) {
                    const container = node.displayNode; // ContainerWholeBehavior
                    if (container) {
                        result.push(container);
                    }
                }
            }
            return result;
        }
        return null;
    }


    public closeAllShowContainer(): void {
        // Implementation
        for (const [gameState] of this._showContainerMap.entries()) {
            this.closeContainerByState(gameState);
        }
    }

    public openContainerByState(gameState: GameState): void {
        if (gameState !== null && this._showContainerMap.has(gameState)) {
            const containerList = this._showContainerMap.get(gameState);
            if (!containerList) return;

            for (const aryNodeContainer of containerList) {
                for (const node of aryNodeContainer.gameNodeHashInfo) {
                    const container = node.displayNode; // ContainerWholeBehavior
                    if (container) {
                        container.openContainer();
                    }
                }
            }
        }
    }


    public closeContainerByState(gameState: GameState): void {
        if (gameState !== null && this._showContainerMap.has(gameState)) {
            const containerList = this._showContainerMap.get(gameState);
            if (!containerList) return;

            for (const aryNodeContainer of containerList) {
                for (const node of aryNodeContainer.gameNodeHashInfo) {
                    const container = node.displayNode; // ContainerWholeBehavior
                    if (container) {
                        container.closeContainer();
                    }
                }
            }
        }
    }

    public openContainerByStateTween(gameState: GameState): void {
        if (gameState !== null && this._showContainerMap.has(gameState)) {
            const containerList = this._showContainerMap.get(gameState);
            if (!containerList) return;

            for (const aryNodeContainer of containerList) {
                for (const node of aryNodeContainer.gameNodeHashInfo) {
                    const container = node.displayNode; // ContainerWholeBehavior
                    if (container) {
                        container.openContainerTween();
                    }
                }
            }
        }
    }

    public closeContainerByStateTween(gameState: GameState): void {
        if (gameState !== null && this._showContainerMap.has(gameState)) {
            const containerList = this._showContainerMap.get(gameState);
            if (!containerList) return;

            for (const aryNodeContainer of containerList) {
                for (const node of aryNodeContainer.gameNodeHashInfo) {
                    const container = node.displayNode; // ContainerWholeBehavior
                    if (container) {
                        container.closeContainerTween();
                    }
                }
            }
        }
    }

    public getTargetContainer(gameState: GameState, condition: any): GameNodeContainer | undefined {
        const targetList = this._showContainerMap.get(gameState);
        let targetGameNodeContainer: GameNodeContainer | undefined;
        if (!targetList || targetList.length === 0) return undefined;
        if (gameState === GameState.NORMAL || gameState === GameState.RE_SPINE) {
            //return targetList[0];
            targetGameNodeContainer = targetList[0];
        }
        let checkCondition: any = this.checkConditionForFind(condition);
        targetGameNodeContainer = this.getGameNodeContainerByCondition(checkCondition);

        return targetGameNodeContainer;
    }

    //-override it
    protected getGameNodeContainerByCondition(condition?: any): GameNodeContainer | undefined {
        return undefined;
    }

    //-override it
    protected checkConditionForFind(condition?: any): any {

        return null;
    }

    public reSetContainerLayer(): void {
        // Implementation
    }
}