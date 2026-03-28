/**
 * 物件池介面
 */
export interface IObjPool {
    /**
     * 物件生成時觸發
     */
    onObjLoad(): void;

    /**
     * 物件被取出時觸發
     */
    onObjInstance(): void;

    /**
     * 物件被回收時觸發
     */
    onObjRecycle(): void;

    /**
     * 物件被移除時觸發
     */
    onObjUnLoad(): void;
}
