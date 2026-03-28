import { _decorator, CCString, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DisplayStageNodeForAniNodePropertyDef')

export class DisplayStageNodeForAniNodePropertyDef {

    @property({
        displayName: "Key",
        type: CCString,
        tooltip: 'container的索引ID',
        serializable: true,
    } as any)

    public key: string;

    @property({
        displayName: "Node",
        type: Node,
        tooltip: 'container的node',
        serializable: true,
    } as any)

    public node: Node | null = null;

}