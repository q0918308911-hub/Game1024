import { _decorator, Component, Node } from 'cc';
import { SymbolBase } from '../Interface/SymbolBase';
import { UniIconBase } from '../UniIconBase';
const { ccclass, property } = _decorator;

export enum DropType {
    NoDrop,
    DropOut,
    DropIn,
    Refill,
}

@ccclass('UniDropIconBase')
export class UniDropIconBase<Symbol extends SymbolBase> extends UniIconBase<Symbol> {
    protected _dropType: DropType = DropType.NoDrop;

    public get dropType(): DropType {
        return this._dropType;
    }

    public set dropType(value: DropType) {
        this._dropType = value;
    }
}


