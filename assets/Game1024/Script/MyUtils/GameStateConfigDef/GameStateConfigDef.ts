export enum GameState {
    NULL,
    BEGIN,
    NORMAL,
    RE_SPINE,
    FREE_GAME,
    DOUBLE_GAME,//--挑戰遊戲(比倍狀態進行中)
    ERROR//--非正常結束
}

export enum TransitionsState {
    IN,
    OUT,
    NONE
}

export enum ShowBottomTextStatus {
    NO_WIN,
    ROLLING,
    WIN,
    IDLE,
    DEBUG
}
