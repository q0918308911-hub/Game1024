import { _decorator, CCInteger, } from 'cc';
import { UniMovement } from './Movement/UniMovement';
import { SymbolBase } from './Interface/SymbolBase';
const { ccclass, property } = _decorator;

/**
 * 滾輪的最小單位，裝載一個Symbol資料，繼承UniMovement
 */
@ccclass('UniIconBase')
export class UniIconBase<Symbol extends SymbolBase> extends UniMovement {
    /**內部使用，紀錄當前的siblingIndex */
    @property({ type: CCInteger, visible: true, readonly: true })
    protected _siblingIndex: number = 0;

    /**
     * 設定siblingIndex，會立即更新siblingIndex，並且紀錄上一個siblingIndex
     */
    public set siblingIndex(index: number) {
        this._lastSiblingIndex = this._siblingIndex;
        this._siblingIndex = index;
        this.node.setSiblingIndex(index);
    }

    /**取得當前的siblingIndex */
    public get siblingIndex(): number {
        return this._siblingIndex;
    }

    /**內部使用，紀錄當前的Symbol */
    protected _symbol: Symbol;

    /**取得當前的Symbol */
    public get symbol(): Symbol {
        return this._symbol;
    }

    /**設定當前的Symbol 
     * @param value Symbol
     * @example
     * Symbol變更時，更新圖片資源
     * 
     * 如果override屬性，get跟set都必須要override
     * ```ts
     * public set symbol(symbol: SymbolNumber) {
            this._symbol = symbol;
            this.gameSprite.spriteFrame = this.spriteFrameList[symbol.symbolID];
    }
     * ```
    */
    public set symbol(value: Symbol) {
        this._symbol = value;
    }

    /**內部使用，紀錄上一個siblingIndex */
    protected _lastSiblingIndex: number = 0;

    /**取得上一個siblingIndex */
    public get lastSiblingIndex(): number {
        return this._lastSiblingIndex;
    }

    /**初始化，紀錄當前的siblingIndex */
    public init(): void {
        this.siblingIndex = this.node.getSiblingIndex();
    }
}