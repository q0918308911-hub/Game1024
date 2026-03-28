import { Iterator } from "./Iterator";
import { IteratorFactory } from "./IteratorFactory";

/**
 * 列陣儲存類別
 */
export class List<T> {
    private m_arItem: Array<T>;

    constructor(array?: any[]) {
        this.m_arItem = array ? array : [];
    }

    public get array(): Array<T> {
        return this.m_arItem;
    }

    public get Count(): number {
        return this.m_arItem ? this.m_arItem.length : 0;
    }

    // 在串列頭新增.
    public insert(value: T) {
        this.m_arItem.unshift(value);
    }

    // 任意地方新增. 不要太常用.
    public insertAt(iIndexAt: number, value: T): void {
        let iTotalCount: number = this.getCount();
        if (iIndexAt <= 0) {
            this.insert(value);
        }
        else if (iIndexAt >= iTotalCount) {
            this.add(value);
        } else {
            let arPart1: T[] = this.m_arItem.slice(0, iIndexAt);
            let arPart2: T[] = this.m_arItem.slice(iIndexAt, iTotalCount);
            this.m_arItem = arPart1.concat([value], arPart2);
        }
    }

    // 新增物件.
    public add(value: T): void {
        this.m_arItem.push(value);
    }

    // 取出物件, 找不到傳回undefined.
    public get(index: number): T {
        if (index < 0 || index >= this.getCount()) {
            return undefined;
        }
        return this.m_arItem[index];
    }
    // 在指定位置設定數值
    public set(index: number, value: T) {
        this.m_arItem[index] = value;
    }
    // 移除一個項目(第一個遇到的項目).
    public remove(value: T) {
        let iIndex: number = this.indexOf(value);
        if (iIndex >= 0) {
            this.m_arItem[iIndex] = null;
            this.m_arItem.splice(iIndex, 1);
        }
    }

    // 移除第iIndex個項目.
    public removeAt(iIndex: number) {
        if (iIndex < 0 || iIndex >= this.m_arItem.length) {
            return;
        } else if (iIndex == 0) {
            this.removeFirst();
        } else if (iIndex == this.m_arItem.length - 1) {
            this.removeLast();
        } else {
            this.m_arItem[iIndex] = null;
            this.m_arItem.splice(iIndex, 1);
        }
    }

    /**
     * 移除第一項
     */
    public removeFirst(): void {
        this.m_arItem.shift();
    }

    public removeLast(): void {
        this.m_arItem.pop();
    }

    // 取出數量.
    public getCount(): number {
        return this.m_arItem.length;
    }

    // 反查value在第幾個index.
    public indexOf(value: T): number {
        return this.m_arItem.indexOf(value);
    }

    // 清除全部.
    public clear() {
        if (this.m_arItem && this.m_arItem.length > 0) {
            let iCount: number = this.m_arItem.length;

            for (let i: number = 0; i < iCount; ++i) {
                this.m_arItem[i] = null;
            }

            this.m_arItem = null;
            this.m_arItem = new Array<T>();
        }
    }

    // 取出Iterator.
    public getIterator(): Iterator<T> {
        return IteratorFactory.createListIterator(this);
    }

    // 轉成陣列.
    public toArray(): T[] {
        let iCount: number = this.getCount();
        let arDuplicate: Array<T> = Array<T>(iCount);
        for (let i = 0; i < iCount; ++i) {
            arDuplicate[i] = this.m_arItem[i];
        }
        return arDuplicate;
    }

    public forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
        this.m_arItem.forEach(callbackfn, thisArg);
    }

    public contains(value: T) {
        return (this.m_arItem.indexOf(value) < 0) ? false : true;
    }

    public copyTo(target: List<T>): List<T> {
        if (target) {
            this.m_arItem.forEach((item: T) => {
                target.add(item);
            })
        }
        return target;
    }
}
