import { Node, Prefab, _decorator, instantiate } from "cc";
//import { AnimationPrefabPropertyDef } from '../../AnimationSystemV2/Definitions/AnimationPrefabPropertyDef';
import { IBasicPoolObjComponent } from '../../ObjectPoolManager/Definitions/IBasicPoolObject';
import { IObjectPoolManager } from "../Definitions/IBasicPoolObject";
import { AnimationPrefabPropertyDef } from "../../AnimationSystemV3/Definitions/AnimationPrefabPropertyDef";
import { AniSysTools } from "../../AnimationSystemV3/AniTools/AniSysTools";
//import { AniSysTools } from '../../AnimationSystemV2/AniTools/AniSysTools';

const { ccclass, property } = _decorator;
const PREFAB_TYPE_DEFAULT = 'default';

@ccclass('AnimationControllersPoolManager')
export class AnimationControllersPoolManager implements IObjectPoolManager<string, Node> {

    @property({ type: [AnimationPrefabPropertyDef], visible: true, displayName: 'Prefab List', tooltip: '塞入尚未實體化的prefab,依照key當作索引' })
    private _prefabForPropertyList: AnimationPrefabPropertyDef[] = [];

    private _maxMumPrefabNodeListCount: number;
    private _prefabObjectPool: Map<string, Node[]>;//--這個是用來存放實例化後的prefab object pool
    private _prefabMap: Map<string, Prefab>;//--未被實體化的prefab,準備用來被clone
    private static _instance: AnimationControllersPoolManager | null = null;
    public static getInstance(): AnimationControllersPoolManager {
        return (AnimationControllersPoolManager._instance) ? AnimationControllersPoolManager._instance : new AnimationControllersPoolManager();
    };

    set maxMumPrefabNodeListCount(value: number) {
        this._maxMumPrefabNodeListCount = value;
    }

    constructor() {

        if (AnimationControllersPoolManager._instance != null) {
            throw new Error('plz use getInstance() to get NotifyCation');
        }
        AnimationControllersPoolManager._instance = this;
        this._maxMumPrefabNodeListCount = 5;//--default
        this._prefabObjectPool = new Map<string, Node[]>();
    }

    //=================prefab map=================
    public addTargetToPrefabMap(prefabProperty: AnimationPrefabPropertyDef): void {
        if (prefabProperty.prefab) {
            if (!this._prefabMap.has(prefabProperty.key)) {
                this._prefabMap.set(prefabProperty.key, prefabProperty.prefab);
            }
        } else {
            console.warn('AnimationControllersPoolManager_prefab is null');
        }
    }

    public removeTargetFromPrefabMap(prefabNodeListID: string): void {
        if (this._prefabMap.has(prefabNodeListID)) {
            this._prefabMap.delete(prefabNodeListID);
        }
    }

    public getTargetPrefab(prefabNodeListID: string): Prefab | null {
        return this._prefabMap.get(prefabNodeListID) || null;
    }

    public setPrefabForPropertyList(prefabForPropertyList: AnimationPrefabPropertyDef[]): void {
        this._prefabForPropertyList = prefabForPropertyList;
        this._prefabMap.clear();
        this._prefabObjectPool.set(PREFAB_TYPE_DEFAULT, []);
        for (let prefabProperty of this._prefabForPropertyList) {
            this.addTargetToPrefabMap(prefabProperty);
        }
    }

    //=================prefab map=================

    public pushInstanceToPool(prefabNodeListID: string, prefabNode: Node): void {

        let prefabNodeList: Node[] = this._prefabObjectPool.has(prefabNodeListID) ? this._prefabObjectPool.get(prefabNodeListID) : this._prefabObjectPool.get(PREFAB_TYPE_DEFAULT);
        let aniExtensionComponent = AniSysTools.findAndGetIAniComponent(prefabNode) as IBasicPoolObjComponent;
        if (prefabNodeList.length < this._maxMumPrefabNodeListCount) {
            (<IBasicPoolObjComponent>aniExtensionComponent).resetData();
            prefabNode.active = false;//-要去觸發onDisable
            prefabNodeList.push(prefabNode);
        } else {
            //-這邊component會被觸發destroy
            prefabNode.removeFromParent();
            (<IBasicPoolObjComponent>aniExtensionComponent).beforeDestroy();
            prefabNode.destroy();
            (<IBasicPoolObjComponent>aniExtensionComponent).onAfterDestroy();
            prefabNode = null;
        }

        //this.checkPoolStatusAfterPush();//--debug
    }

    //=======interface============================================
    public init(): void {

        this._prefabMap = new Map<string, Prefab>();
        this._prefabObjectPool.set(PREFAB_TYPE_DEFAULT, []);
    }

    public cleanAllPools(): void {

        for (let targetList of this._prefabObjectPool.values()) {
            for (let node of targetList) {
                node.destroy();
            }
            targetList = [];
        }
    }
    public getPoolSize(objListId: string): number {

        if (this._prefabObjectPool.has(objListId)) {
            return this._prefabObjectPool.get(objListId).length;
        }
        return 0;
    }
    public expandPool(objListId: string, count: number): void {

        if (this._prefabObjectPool.has(objListId)) {
            const prefab = this.getTargetPrefab(objListId);
            for (let i = 0; i < count; i++) {
                let node = instantiate(prefab);
                this.pushInstanceToPool(objListId, node);
            }
        }
    }
    public getInstantiatedObjFromPool(objListId: string): Node | null {

        let prefabNode: Node = null;
        let aniExtensionComponent: IBasicPoolObjComponent = null;
        if (this._prefabObjectPool.has(objListId)) {
            let prefabNodeInfoList = this._prefabObjectPool.get(objListId);
            if (prefabNodeInfoList.length > 0) {
                prefabNode = prefabNodeInfoList.pop();
                //console.log('popObjFromPool:', objListId);
            } else {
                const prefab = this._prefabMap.get(objListId);
                if (prefab) {
                    prefabNode = instantiate(prefab);
                    aniExtensionComponent = AniSysTools.findAndGetIAniComponent(prefabNode) as IBasicPoolObjComponent;
                    aniExtensionComponent.onObjInstance();
                } else {
                    console.warn(`Prefab for key '${objListId}' is undefined`);
                }
            }
        } else {
            this._prefabObjectPool.set(objListId, []);
            const prefab = this._prefabMap.get(objListId);
            if (prefab) {
                prefabNode = instantiate(prefab);
                aniExtensionComponent = AniSysTools.findAndGetIAniComponent(prefabNode) as IBasicPoolObjComponent;
                aniExtensionComponent.onObjInstance();
            } else {
                console.warn(`Prefab for key '${objListId}' is undefined`);
            }
        }

        return prefabNode;
    }

    //--檢查物件池狀態
    public checkPoolStatusAfterPush(): void {
        console.log('=== Prefab Pool 狀態 ===');

        for (const [key, list] of this._prefabObjectPool.entries()) {
            console.log(`Pool ID: ${key}, Size: ${list.length}`);
        }
        console.log('=======================');
    }
}