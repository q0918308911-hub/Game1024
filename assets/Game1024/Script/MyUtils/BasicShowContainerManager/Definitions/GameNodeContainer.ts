import { _decorator, Node } from 'cc';
import { ContainerBasicBehavior } from '../Component/ContainerBasicBehavior';
import { ContainerWholeBehavior } from '../Component/ContainerWholeBehavior';
const { ccclass, property } = _decorator;

@ccclass('GameNodeHashInfo')
export class GameNodeHashInfo {
    @property({ visible: true, displayName: 'NodeName' })
    public nodeName: string = '';
    /**
    這裡無法直接寫 T，Cocos Editor 不認得泛型型別，
    需要指定一個最基礎的父類別讓編輯器知道可以拖入什麼東西。
    但程式碼中，它的型別會是正確的 CBehavior 泛型
     */
    @property({ type: ContainerWholeBehavior, visible: true, displayName: 'Node' })
    public displayNode: ContainerWholeBehavior = null;

}

@ccclass('GameNodeContainer')
//export class GameNodeContainer<CBehavior extends ContainerBasicBehavior> {
export class GameNodeContainer {

    @property({ visible: true, displayName: 'IsShow', tooltip: '是否顯示' })
    public isShow: boolean = false;

    @property({ type: [GameNodeHashInfo], visible: true, displayName: 'GameNodeHashInfo', tooltip: '顯示的NodeList' })
    public gameNodeHashInfo: GameNodeHashInfo[] = [];

}