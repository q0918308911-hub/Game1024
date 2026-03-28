import { _decorator, Component, Node } from 'cc';
import { IObjPool } from './IObjPool';
import { Queue } from './Queue';

/**
 * 物件池管理
 * @example
 * 實作物件池範例
 * 
 * SymbolNumber實作IObjPool介面
 * ```ts
 * class Pool extends ObjPoolMgr<SymbolNumber> {
     public constructor() {
         super();
         this.init(10, SymbolNumber.createPoolObject);
     }
 }

 export class SymbolNumber implements SymbolBase, IObjPool {
    protected constructor() { }

    public static createPoolObject(): SymbolNumber {
        return new SymbolNumber();
    }

    public static pool: Pool = new Pool();
 }
 * ```
 */
export class ObjPoolMgr<obj extends IObjPool> {
    /**已使用的物件數量 */
    public get usedCount(): number {
        return this.usedPool.size;
    };

    /**未使用的物件數量 */
    public get unUsedCount(): number {
        return this.unUsedPool.count;
    }

    /**最大物件數量 */
    public countLimit: number = -1;

    /**使用中的物件池 */
    private usedPool: Set<obj> = new Set<obj>();

    /**未使用的物件池 */
    private unUsedPool: Queue<obj> = new Queue<obj>();

    /**創建物件的方法 */
    private createPoolObj: () => obj;

    public constructor() {

    }

    /**
     * 初始化，創建初始數量的物件
     * @param poolCount 最初創建的物件數量
     * @param createPoolObjFunc 創建物件的方法
     */
    public init(poolCount: number, createPoolObjFunc: () => obj): void {
        this.createPoolObj = createPoolObjFunc;

        for (let index = 0; index < poolCount; index++) {
            let newObj: obj = this.createPoolObj();
            this.unUsedPool.enqueue(newObj);
            newObj.onObjLoad();
        }
    }


    /**
     * 取出一個物件
     * @returns 
     */
    public instance(): obj {
        let newObj: obj;

        if (this.unUsedPool.count > 0) {
            newObj = this.unUsedPool.dequeue();
        }
        else {
            newObj = this.createPoolObj();
            newObj.onObjLoad();
        }

        this.usedPool.add(newObj);
        newObj.onObjInstance();

        return newObj;
    }

    /**
     * 回收一個物件，如果超出最大物件數量則移除
     * @param obj 回收物件
     */
    public destroy(obj: obj): void {
        obj.onObjRecycle();

        if (this.usedPool.delete(obj)) {
            if (this.countLimit >= 0 && this.usedCount + this.unUsedCount >= this.countLimit) {
                obj.onObjUnLoad();
            }
            else {
                this.unUsedPool.enqueue(obj);
            }
        }
    }

    /**
     * 釋放所有物件，清空物件池
     */
    public dispose(): void {
        for (let obj of this.usedPool) {
            this.destroy(obj);
        }

        while (this.unUsedPool.count > 0) {
            let obj = this.unUsedPool.dequeue();
            obj.onObjUnLoad();
        }
    }
}


