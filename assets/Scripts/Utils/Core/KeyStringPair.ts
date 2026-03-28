import { _decorator, CCString, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('KeyStringPair')
export class KeyStringPair {
    @property({
        displayName: "Key",
        type: CCString,
        serializable: true,
    } as any)
    public key: string;

    @property({
        displayName: "content",
        type: CCString,
        serializable: true,
    } as any)
    public content: string;
}

