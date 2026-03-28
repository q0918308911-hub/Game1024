/**
 * Net 事件
 */
export enum NetEvent {
    //斷線
    Disconnected = 0,
    //Server 踢人
    ServiceKick,
}
/**
 * 監聽者
 */
export class NetListener {
    constructor(private name: string, private process: (event: NetEvent, value: any) => void) { }

    public get Name(): string { return this.name; }

    public Notify(event: NetEvent, value: any): void {
        this.process(event, value);
    }
}

/**
 * 觀察者
 */
export class NetObserver {
    private _listeners: NetListener[] = [];
    constructor() { }

    /**
     * 註冊監聽者
     * @param listener 
     */
    Register(listener: NetListener): void {
        this._listeners.push(listener);
    }

    /**
     * 移除監聽者
     * @param name 監聽者名稱 
     */
    Remove(name: string): void {
        for (let x = 0; x < this._listeners.length; x++) {
            if (this._listeners[x].Name === name) {
                this._listeners.splice(x, 1);
                x++;
            }
        }
    }

    /**
     * 通知所有監聽者
     * @param event 
     * @param value 
     */
    Notify(event: NetEvent, value: any): void {
        for (let x = 0; x < this._listeners.length; x++) {
            this._listeners[x].Notify(event, value);
        }
    }

}