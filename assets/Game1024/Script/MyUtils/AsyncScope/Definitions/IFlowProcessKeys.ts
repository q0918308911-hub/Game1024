/**
 * 這邊使用[key: string]: string | undefined;
 * 保證任何群組都是「string → string」的映射
 */
export interface IFlowProcessKeys {
    [key: string]: string | undefined;
}

//--表演流程使用的流程追蹤關鍵字
/**
 * 
 * ------------------------------------------------------------
 * 預設定義所有流程 / 階段的關鍵字名稱。
 * <可自己擴充定義IFlowProcessKeys介面內容(因為我做成可以很自由擴充的宣告了)>
 */
export interface IShowResultProcessKey {

    RunShowProcess: string;
    CleanAllPlaying: string;
    ShowBigWin: string;
    PlayWinRound: string;
    playNoWinInThisRound: string;
    ProcessResetAni: string;
    ShowWinScore: string;
    ShowWinScoreForBottomText: string;
    ProcessBeforePlaySequence: string;
    playWinInThisRound: string;
    Idle: string;
    //Other: IFlowProcessKeys;//--允許動態擴增
    [key: string]: string | IFlowProcessKeys | null;//--允許動態擴增
}


export interface IBaseGameProcessKey {
    START_ROLL: string,
    STOP_ROLL: string,
    BEFORE_ALL_REEL_ROLL_END: string,
    SHOW_RESULT_AFTER_ROLL: string,
    PROCESS_ROUND: string,
    AUTO_ROLL_TIME: string,
    PROCESS_NORMAL_ROUND: string,
    CORE_MAIN_PROCESS: string,
    //OTHER: IFlowProcessKeys;//--允許動態擴增
    [key: string]: string | IFlowProcessKeys | null;//--允許動態擴增
}



