import { _decorator } from 'cc';

import { IObjPool, ObjPoolMgr, SymbolBase, } from 'db://assets/Scripts/ModuleEntry';

class Pool extends ObjPoolMgr<SymbolNumber1024> {
    public constructor() {
        super();
        this.init(10, SymbolNumber1024.createPoolObject);
    }
}

export class SymbolNumber1024 implements SymbolBase, IObjPool {

    private _stopSymbol: boolean = false;
    //---new------
    private _symbolID: number = -1;
    private _reelIndex: number = -1; //--軸的index
    private _iconIndex: number = -1; //--icon的index

    public get stopSymbol(): boolean {
        return this._stopSymbol;
    }

    public set stopSymbol(value: boolean) {
        this._stopSymbol = value;
    }

    public get reelIndex(): number {
        return this._reelIndex;
    }
    public set reelIndex(value: number) {
        this._reelIndex = value;
    }

    public get iconIndex(): number {
        return this._iconIndex;
    }
    public set iconIndex(value: number) {
        this._iconIndex = value;
    }

    public get symbolID(): number {
        return this._symbolID;
    }
    public set symbolID(value: number) {
        this._symbolID = value;
    }

    public static createPoolObject(): SymbolNumber1024 {
        return new SymbolNumber1024();
    }

    public static pool: Pool = new Pool();

    onObjLoad(): void {

    }

    onObjInstance(): void {

    }

    onObjRecycle(): void {
        this.symbolID = -1;
        this._iconIndex = -1;
        this._reelIndex = -1;

    }

    onObjUnLoad(): void {

    }
}


