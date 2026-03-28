export enum WinType {
    EpicWin,
    MegaWin,
    SuperWin,
    BigWin,
}

export interface IJpInterruptTime {
    //startTime: number;
    canInterruptTime?: number;//--可以被阻斷的時間
    loopDurationTime?: number;//--loop時間
    interruptEndTime?: number;//--阻斷後移動到的末端時間點
    //interruptTime?:number;
    runDurationTime?: number;//--秀彩金的時間
    fastLoopDuration?: number;
}

export interface IAniStateType {
    IN: string,
    LOOP: string,
    OUT: string
}
//--key為WinType的enum值

export type I4WinAnimationStateType = Record<WinType, IAniStateType>