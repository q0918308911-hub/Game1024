import { Node } from 'cc';
import { ContainerBasicBehavior } from './Component/ContainerBasicBehavior';
import { ContainerWholeBehavior } from './Component/ContainerWholeBehavior';
import { GameState } from '../ReferencePathForMyUtils';


//export interface IBasicShowContainerManager<CBehavior extends ContainerBasicBehavior> {
export interface IBasicShowContainerManager {
    showContainer(containerId: string): void;
    hideContainer(containerId: string): void;
    checkChildrenContains(node: Node, rootNodeName: string): boolean;
    getContainerNodeByKey(key: string): ContainerWholeBehavior | null;
    getContainerListByState(gameState: GameState): ContainerWholeBehavior[] | null;
    //registerContainer():void;
    //changeRotationResolution(): void;
    closeAllShowContainer(): void;
    reSetContainerLayer(): void;
}



//--要加入管理容器工具的<容器>都要實作這個介面
export interface IBasicShowContainer {
    closeContainer(): void;
    openContainer(): void;
    closeContainerTween(): void;
    openContainerTween(): void;
}


