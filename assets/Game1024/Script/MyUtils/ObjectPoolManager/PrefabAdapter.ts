import { _decorator, Component } from 'cc';
import { AnimationPrefabPropertyDef } from '../AnimationSystemV3/Definitions/AnimationPrefabPropertyDef';
const { ccclass, property } = _decorator;

/**.
 * 就算沒有繼承component但是你不這樣寫你透過其他的Component在編輯器裡面會找不到!
 * 所以還是乖乖繼承component吧.雖然很幹
 */
@ccclass('PrefabAdapter')

//export class PrefabAdapter extends Component {
export class PrefabAdapter {
    @property({ type: [AnimationPrefabPropertyDef], visible: true, displayName: 'Prefab List', tooltip: '塞入尚未實體化的prefab,依照key當作索引' })
    private _prefabForPropertyList: AnimationPrefabPropertyDef[] = [];

    get prefabForPropertyList(): AnimationPrefabPropertyDef[] {
        return this._prefabForPropertyList;
    }
}
