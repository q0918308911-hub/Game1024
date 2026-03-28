import { _decorator, Component, Node, randomRangeInt } from 'cc';
import { SymbolBase } from '../../Scripts/Interface/SymbolBase';
import { IObjPool, ObjPoolMgr } from 'db://assets/Scripts/Utils/Core';

class Pool extends ObjPoolMgr<SymbolNumber> {
    public constructor() {
        super();
        this.init(10, SymbolNumber.createPoolObject);
    }
}

export class SymbolNumber implements SymbolBase, IObjPool {
    private _stopSymbol: boolean = false;

    private _symbolID: number = 0;

    private symbolCount: number = 8;

    public get symbolID(): number {
        return this._symbolID;
    }
    public set symbolID(value: number) {
        this._symbolID = value;
    }

    public get stopSymbol(): boolean {
        return this._stopSymbol;
    }
    public set stopSymbol(value: boolean) {
        this._stopSymbol = value;
    }

    protected constructor() { }

    public static createPoolObject(): SymbolNumber {
        return new SymbolNumber();
    }

    public static pool: Pool = new Pool();

    public randomValue(): void {
        this.symbolID = this.randomSymbol();
    }

    private randomSymbol(): number {
        return randomRangeInt(0, this.symbolCount);
    }

    public onObjLoad(): void {

    }

    public onObjInstance(): void {

    }

    public onObjRecycle(): void {
        this.symbolID = -1;
    }

    public onObjUnLoad(): void {

    }
}