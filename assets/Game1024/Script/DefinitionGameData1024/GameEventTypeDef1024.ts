export enum GameEventType1024 {
    REFILL_WILD_EVENT = 'RefillWild_Event',
    FG_SHOW_MULTIPLIER_EVENT = 'FG_Show_Multiplier_Event',
    FG_OUT_BACK_EVENT = 'FG_Out_Back_Event',
    CHALLENGE_EVENT = 'Challenge_Event',//--挑戰事件，包含進入挑戰、進入FG、選擇經書等行為
    CLOUD_TRANSITION_EVENT = 'Cloud_Transition_Event',//--雲朵轉場事件，包含進入FG的轉場和離開FG的轉場 
}

export enum RefllWildEventStatus {
    START = 'RefillWild_Start',
    END = 'RefillWild_End',
}

export enum MonkFxEventType {
    FIRST_TRIGGER = 'MonkFx_First_Trigger',
    SECOND_TRIGGER = 'MonkFx_Second_Trigger',
}

export enum GO_FG_TransitionEventStatus {
    TRANS_IN = 'Cloud_Trans_In',
    TRANS_OUT = 'Cloud_Trans_Out',
}

export enum ChallengeEventStatus {
    ENTER_CHALLENGE = 'Enter_Challenge',
    ENTER_FG = 'Enter_FG',
    SELECT_BOOK = 'Select_Book',
    BACK_TO_NG = 'Back_To_NG',
    CALL_SERVER_TO_CHALLENGE = 'Call_Server_To_Challenge',//--呼叫server進入挑戰
    CALL_SERVER_TO_FG = 'Call_Server_To_FG',//--呼叫server進入FG  
}
