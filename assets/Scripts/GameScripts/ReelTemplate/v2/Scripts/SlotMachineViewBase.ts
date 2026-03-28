import { __private, _decorator, Component, Node } from 'cc';
import { PrefabList } from 'db://assets/Scripts/Utils/Core';

const { ccclass, property } = _decorator;

/**
 * 用來管理表演的元件，icon為基礎的元件，滾輪類型可以替換
 */
@ccclass('SlotMachineViewBase')
export abstract class SlotMachineViewBase extends Component {
    @property({ type: Node, visible: true, tooltip: 'icon元件root' })
    protected _iconRoot: Node = null;

    @property({ type: PrefabList, visible: true, tooltip: 'icon元件列表' })
    protected _iconPrefabList: PrefabList[] = [];

    public get iconPrefabList(): PrefabList[] {
        return this._iconPrefabList;
    }

    /**
    * 開始滾輪表演
    * @param reelIDs 要表演的滾輪，沒有傳入預設全部滾輪表演 ex:[2,1,0]代表從2開始停，0最後停
    */
    public abstract startRoll(reelIDs?: number[]): void;

    public abstract stopRoll(): void;

    protected createIcon(): void {
        for (let index = 0; index < this._iconPrefabList.length; index++) {
            this._iconPrefabList[index].createInstance(this._iconRoot);
        }
    }
}


