/**
 * @author:Eric 20250805 
 * @description:
 * 使用singleton模式來管理遊戲全局數據
 * 利用泛型來支持不同類型的數據
 * 你可以自己訂一個個物件 裡面的屬性就是你想要記錄的資料
 * 當使用get/set方法時，會強制要求這個keyValue並須對應T所擁有的型別才能寫入與讀出
 * -https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
 */

import { GLOBAL_DATA_WRITE_KEY } from "./GlobalDataWriteKey";
import {GlobalReader,GlobalWriter} from "./IGameGlobalData";

export class BasicGameGlobalData<T> {
    
    private static _instance: BasicGameGlobalData<any> | null = null;
    private _data!: T;
    private _inited = false;
    
    public static getInstance<T>(): BasicGameGlobalData<T> {
        if (!BasicGameGlobalData._instance) {
        BasicGameGlobalData._instance = new BasicGameGlobalData<any>();
        }
        return BasicGameGlobalData._instance as BasicGameGlobalData<T>;
    }

    constructor() {
        
        if (BasicGameGlobalData._instance) {
            throw new Error("BasicGameGlobalData is a singleton class, use getInstance() to access it.");
        }
        BasicGameGlobalData._instance = this;
    }

    public init(data: T): void {
        if (this._inited) throw new Error("BasicGameGlobalData already initialized.");
        this._data = data;
        this._inited = true;
    }

    public getReader(): GlobalReader<T> {
        return {
        get: this.get.bind(this),
        snapshot: this.snapshot.bind(this),
        };
    }

    public createWriter(writeKey: typeof GLOBAL_DATA_WRITE_KEY): GlobalWriter<T> {
        
        this.ensureInit();
        if (writeKey !== GLOBAL_DATA_WRITE_KEY) throw new Error("Write access denied.");
        return {
        set: <K extends keyof T>(key: K, value: T[K]) => { (this._data as T)[key] = value; },
        patch: (partial: Partial<T>) => { Object.assign(this._data as T, partial); },
        };
    }

    // ---- internal ----
    private ensureInit():void {
        if (!this._inited) throw new Error("BasicGameGlobalData is not initialized.");
    }
    
    private get<K extends keyof T>(key: K): T[K] {
        this.ensureInit();
        return this._data[key];
    }
    private snapshot(): Readonly<T> {
        this.ensureInit();
        //-https://flytoleisure.medium.com/javassript-%E9%97%9C%E6%96%BCobject-freeze%E7%9A%84%E6%B7%BA%E5%87%8D%E7%B5%90%E5%8F%8A%E6%87%89%E5%B0%8D%E6%96%B9%E6%B3%95-2b0592869222
        //-這裡用clone的方式來避免外部直接改動_data
        return Object.freeze({ ...(this._data as any) }) as Readonly<T>;
    }
    
}
