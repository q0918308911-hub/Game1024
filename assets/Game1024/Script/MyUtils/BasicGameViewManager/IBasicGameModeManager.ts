import { GameState } from "../GameStateConfigDef/GameStateConfigDef";

export interface IBasicGameModeManager {
    getCurrentGameState(): GameState; //---取得目前的遊戲狀態
    addGameMode(gameMode: IGameMode): void; //---添加需要使用遊戲狀態的物件
    removeGameMode(gameMode: IGameMode): void; //---移除遊戲狀態物件
    changeAllGameState(value: GameState): void; //---改變所有遊戲模式的狀態
    cleanAll(): void
}

//--遊戲改變狀態的時候使用
export interface IGameMode {
    //gameState: GameState;--20250812這邊改成透過global去拿目前的狀態
    changeGameState(value: GameState): void;
}

