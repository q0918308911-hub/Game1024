import { IShowResultProcessKey, IFlowProcessKeys, IBaseGameProcessKey } from '../Definitions/IFlowProcessKeys';

export const BasicShowResultProcessKey: IShowResultProcessKey = {

    RunShowProcess: 'RunShowProcess',
    CleanAllPlaying: 'CleanAllPlaying',
    ShowBigWin: 'ShowBigWin',
    PlayWinRound: 'PlayWinRound',
    playNoWinInThisRound: 'playNoWinInThisRound',
    ProcessResetAni: 'ProcessResetAni',
    ShowWinScore: 'ShowWinScore',
    ShowWinScoreForBottomText: 'ShowWinScoreForBottomText',
    ProcessBeforePlaySequence: 'ProcessBeforePlaySequence',
    playWinInThisRound: 'playWinInThisRound',
    Idle: 'Idle',
    //Other: null//--允許動態擴增
    
};
// key 名稱 (屬性名)
export type BasicFlowProcessKeyName = keyof typeof BasicShowResultProcessKey;
// value 值 (屬性值)
//export type BasicFlowProcessKeyValue = typeof BasicShowResultProcessKey[keyof typeof BasicShowResultProcessKey];

export const BasicGameFlowProcessKey: IBaseGameProcessKey = {
    START_ROLL: 'START_ROLL',
    STOP_ROLL: 'STOP_ROLL',
    BEFORE_ALL_REEL_ROLL_END: 'BEFORE_ALL_REEL_ROLL_END',
    SHOW_RESULT_AFTER_ROLL: 'SHOW_RESULT_AFTER_ROLL',
    PROCESS_ROUND: 'PROCESS_ROUND',
    PROCESS_NORMAL_ROUND: 'PROCESS_NORMAL_ROUND',
    CORE_MAIN_PROCESS: 'CORE_MAIN_PROCESS',
    AUTO_ROLL_TIME: 'AUTO_ROLL_TIME',
    //OTHER: null//--允許動態擴增
}

export type BasicGameProcessKey = keyof typeof BasicGameFlowProcessKey;
//export type BasicGameProcessKey = keyof IBaseGameProcessKey;


/**
 *  擴增範例:
    import { IFlowProcessKeys, FlowProcessKeys } from './FlowProcessKeys';

    export interface IFlowProcessKeys1016 extends IFlowProcessKeys {
        FGSequence: string;
        BonusSequence: string;
        ReSpinSequence: string;
        JPSequence: string;
    }

    export const FlowProcessKeys1016: IFlowProcessKeys1016 = {
        ...FlowProcessKeys,
        FGSequence: 'FGSequence',
        BonusSequence: 'BonusSequence',
        ReSpinSequence: 'ReSpinSequence',
        JPSequence: 'JPSequence',
    };

    export type FlowProcessKey1016 = keyof IFlowProcessKeys1016;
 */



