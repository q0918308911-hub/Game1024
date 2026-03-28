/**
 * @author:Eric 20250805
 * @description:
 * 這個是給舊版程式碼使用的..因為之前在開發的時候已經寫一狗票了..要改我很麻煩
 * 只好用這個facade來包裝.
 * 
 */

import { GlobalReader, GlobalWriter } from "./IGameGlobalData";
import { BasicGameGlobalData } from "./BasicGameGlobalData";

export class GlobalAccessFacade<T> {
  
    private _reader: GlobalReader<T> | null = null;
    private _writer: GlobalWriter<T> | null = null;

    // GameManager 在 init 後呼叫，注入 writer（不要暴露寫入金鑰）
    public register(store: BasicGameGlobalData<T>, writer: GlobalWriter<T>):void {
        this._reader = store.getReader();
        this._writer = writer;
    }

    /**
     * 
     * @param key 需要金鑰才能讀寫,沒有就只能讀
     * @param value 
     */
    public setGlobalData<K extends keyof T>(key: K, value: T[K]):void {
        if (!this._writer) throw new Error("GlobalAccessFacade not registered (no writer). Call register() after init().");
        this._writer.set(key, value);
    }

    
    public getGlobalData<K extends keyof T>(key: K): T[K] {
        if (!this._reader) throw new Error("GlobalAccessFacade not registered (no reader). Call register() after init().");
        return this._reader.get(key);
    }

    public patch(partial: Partial<T>):void {
        if (!this._writer) throw new Error("GlobalAccessFacade not registered (no writer). Call register() after init().");
        this._writer.patch(partial);
    }

    public snapshot(): Readonly<T> {
        if (!this._reader) throw new Error("GlobalAccessFacade not registered (no reader). Call register() after init().");
        return this._reader.snapshot();
    }
}
