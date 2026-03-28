import CDispatcherAddr from "./CDispatcherAddr";


export default class CDispatcherManager {
    private m_colDispatcher: Map<string, CDispatcherAddr> = new Map<string, CDispatcherAddr>();
    private _dispatcherQueue: CDispatcherAddr[] = [];

    constructor(gatewayList: string[]) {
        for (let i = 0; i < gatewayList.length; ++i) {
            const address = new CDispatcherAddr(gatewayList[i]);
            if (!this.m_colDispatcher.has(address._sKey)) {
                this.m_colDispatcher.set(address._sKey, address);
            }
        }
    }

    Clear(): void {
        this.m_colDispatcher.clear();
    }

    AddDispatcher(bt: Uint8Array): void {
        const address = new CDispatcherAddr(bt);
        if (!this.m_colDispatcher.has(address._sKey)) {
            this.m_colDispatcher.set(address._sKey, address);
        }
    }

    RemoveDispatcher(bt: Uint8Array): void {
        const address = new CDispatcherAddr(bt);
        this.m_colDispatcher.delete(address._sKey);
    }

    GetDispatcher_Ran(): CDispatcherAddr {
        if (this._dispatcherQueue.length === 0) {
            const list = Array.from(this.m_colDispatcher.values());
            list.forEach(addr => this._dispatcherQueue.push(addr));
        }
        if (this._dispatcherQueue.length <= 0) {
            return null;
        }
        const index = Math.floor(Math.random() * this._dispatcherQueue.length);
        return this._dispatcherQueue.splice(index, 1).pop();
    }
}