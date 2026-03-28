import { GameState } from "../../ReferencePath";

//--這是指令集
export interface IFG1024BoardKeyMap {
    open: true;
    fastOpen: true;
    loop: true;
    close: true;
    quickClose: true;
    forceClose: true;
}

export interface IFG1024BoardContext {
    value?: number;
    reason?: 'open' | 'loop' | 'click' | 'auto' | 'force' | 'fast' | 'quick';
    gameState?: GameState;
    isInterrupted?: boolean;
}

export interface IFG1024Payload {
    speed?: 'normal' | 'fast';
    playVoice?: boolean;
}