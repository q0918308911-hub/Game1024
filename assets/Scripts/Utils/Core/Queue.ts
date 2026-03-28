export class Queue<T> {
    private items: T[] = [];

    // 向隊列添加元素
    enqueue(item: T): void {
        this.items.push(item);
    }

    // 從隊列移除並返回第一個元素
    dequeue(): T | undefined {
        return this.items.shift();
    }

    clear(): void {
        this.items = [];
    }

    // 查看隊列中的第一個元素，但不移除
    get peek(): T | undefined {
        return this.items[0];
    }

    // 檢查隊列是否為空
    get isEmpty(): boolean {
        return this.items.length === 0;
    }

    // 返回隊列的大小
    get count(): number {
        return this.items.length;
    }

    // 獲取只讀的陣列副本
    toArray(): T[] {
        return [...this.items];
    }
}


