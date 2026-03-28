// 區塊類型
export enum AutoSpinAreaType {
    // auto spin 次數區塊
    Auto,
    // auto spin 停止條件設定區塊
    Condition,
    // 其他區塊
    Other,
}

// 區塊可見設定
export enum AutoSpinAreaVisible {
    // 永遠可見
    Always,
    // 可由"進階設定"按鈕開關
    Extension,
}
export interface IAutoSpinArea {
    autoSpinAreaType: AutoSpinAreaType;
    // autoSpinAreaVisible: AutoSpinAreaVisible;
    init?(param?: any): void;
    getCustomData(): any;
}

