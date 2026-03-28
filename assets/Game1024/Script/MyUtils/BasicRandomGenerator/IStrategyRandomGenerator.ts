//--初始盤面的亂數產生器介面
export interface IStrategyRandomGenerator<T> {
    generate(value: T): any;//--你自己塞相關資料進來啦
}