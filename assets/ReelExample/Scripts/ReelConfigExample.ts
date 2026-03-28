export namespace ReelConfigExample {
    export const NORMAL_SYMBOLS_LIST: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
    export const MAGNIFICATION_SYMBOLS_LIST: number[] = [8, 9, 10, 11, 12, 13];
    export const ALL_SYMBOL_LIST: number[] = [...NORMAL_SYMBOLS_LIST, ...MAGNIFICATION_SYMBOLS_LIST];
    export const WILD_ID: number = 0;
    export const ICON_AMOUNT: number = 3;
    export const REEL_AMOUNT: number = 4;
    export const WIN_LINE: number[][] =
        [
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ]

    export const SYMBOL_ODD = [
        25, 20, 15, 12, 10, 8, 5, 2,
    ]
}