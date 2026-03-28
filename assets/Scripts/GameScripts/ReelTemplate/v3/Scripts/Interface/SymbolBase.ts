/**
 * Symbol介面
 */
export interface SymbolBase {
    /** 取得停止Symbol，用於滾輪判斷是否停止 */
    get stopSymbol(): boolean;

    /** 設定停止Symbol */
    set stopSymbol(value: boolean);
}