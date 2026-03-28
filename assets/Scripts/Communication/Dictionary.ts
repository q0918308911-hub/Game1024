import { Iterator } from "./Iterator";
import { IteratorFactory } from "./IteratorFactory";
import { List } from "./List";

/**
 * Key Value 儲存類別
 */
export class Dictionary<T> {

    public constructor() {
        this.m_KeyValue = new KeyValue<T>();
    }

    public getCount(): number {
        return this.m_iCount;
    }

    // 新增.
    public add(key: string, value: T) {
        if (!this.containsKey(key)) {
            ++this.m_iCount;
        }
        this.m_KeyValue[key] = value;
    }

    // 判斷key是否存在.
    public containsKey(key: string): boolean {
        if (undefined === this.m_KeyValue[key]) {
            return false;
        }
        return true;
    }

    // 刪除.
    public remove(key: string) {
        if (true == this.containsKey(key)) {
            delete this.m_KeyValue[key];
            --this.m_iCount;
        }
    }

    public clear() {
        this.m_KeyValue = new KeyValue<T>();
        this.m_iCount = 0;
    }

    // 取值, 找不到傳回undefined.
    public get(key: any): T {
        return this.m_KeyValue[key];
    }

    // 列舉所有key.
    public getKeys(): string[] {
        let listKey: List<string> = new List<string>();
        for (let key in this.m_KeyValue) {
            listKey.add(key);
        }
        return listKey.toArray();
    }

    // 列舉所有key/value.
    public getKeyValues(): [string[], T[]] {
        let listKey: List<string> = new List<string>();
        let listValue: List<T> = new List<T>();
        for (let key in this.m_KeyValue) {
            listKey.add(key);
            listValue.add(this.m_KeyValue[key]);
        }
        return [listKey.toArray(), listValue.toArray()];
    }

    // 取出Iterator.
    public getIterator(): Iterator<T> {
        return IteratorFactory.createDictionaryIterator(this);
    }

    private m_KeyValue: KeyValue<T>;
    private m_iCount: number = 0;
}

class KeyValue<T> {
    [index: string]: T;
}
