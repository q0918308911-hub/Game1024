import { Component } from "cc";
//--基本型通用
export interface IBasicPoolObject {
    onObjInstance(): void;
    onAfterDestroy(): void;//-不能用onDestroy這個字component拿去用了
    beforeDestroy(): void;
    resetData(): void;
}
//--component型
export interface IBasicPoolObjComponent extends IBasicPoolObject, Component {

}
/**
 * 物件池管理介面
 * T: 物件識別ID類型<泛型>
 * C: 物件組件類型<泛型>
 */
export interface IObjectPoolManager<T, C> {
    init(): void;
    cleanAllPools(): void;
    getPoolSize(objListId: T): number;
    expandPool(objListId: T, count: number): void;
    getInstantiatedObjFromPool(objListId: T): C | null;
    pushInstanceToPool(objListId: T, instance: C): void;
}

