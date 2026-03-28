import { _decorator, CCInteger, CCString, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('IdStringPair')
export class IdStringPair {
    @property({
        displayName: "ID",
        type: CCInteger,
        serializable: true,
    } as any)
    public key: number;

    @property({
        displayName: "content",
        type: CCString,
        serializable: true,
    } as any)
    public content: string;
}

