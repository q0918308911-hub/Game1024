import { _decorator, Component, instantiate, Node, Prefab, CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PrefabList')
export class PrefabList extends Component {
    @property({ type: Prefab, visible: true, tooltip: 'Prefab樣板' })
    public prefab: Prefab;

    @property({ type: Node, visible: true, tooltip: 'instances list' })
    public nodeList: Node[] = [];

    @property({ visible: true, })
    private _count: number = 0;

    public get count(): number {
        return this._count;
    }

    public createInstance(rootNode?: Node, count: number = this._count, bClearChild: boolean = true): void {
        if (bClearChild) {
            this.clear();
        }

        for (let i = 0; i < count; i++) {
            let prefabNode = instantiate(this.prefab);

            if (rootNode) {
                prefabNode.parent = rootNode;
            }

            this.nodeList.push(prefabNode);
        }
    }

    private clear(): void {
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].destroy();
        }

        this.nodeList = [];
    }
}


