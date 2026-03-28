export enum GameViewEvents {

    ALL_REEL_END = 'reelRollEnd',
    SHOW_END = 'showEnd',
    MANUAL_NO_WIN = 'manualNoWin',
    BUY_FG = 'BuyFgToBet',
    SET_BOTTOM_TEXT = 'SetBottomText',
    GET_CURRENT_BET = 'GetCurrentBet',
    RUN_TEST_MODE = 'RunTestMode',
    INTERRUPT_PROCESS = 'InterruptProcess'
}

export enum NotifySubject {
    GAME_VIEW_SUBJECT = 'GameView_Subject',
    GAME_ANI_PROCESS_SUBJECT = 'GameAniProcess_Subject'
}
