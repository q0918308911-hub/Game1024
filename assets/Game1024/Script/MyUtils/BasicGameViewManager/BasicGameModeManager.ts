import { IBasicGameModeManager, IGameMode } from './IBasicGameModeManager';
import { GameState } from '../GameStateConfigDef/GameStateConfigDef';

/**
 * @author Eric 20250805
 * @description: 管理遊戲模式的狀態
 * - 這個類別負責管理所有遊戲模式的狀態變化。
 * - 可以添加或移除遊戲模式，並且可以改變所有持有IGameMode的物件
 * -gameViewManager當中初始化
 */

export class BasicGameModeManager implements IBasicGameModeManager {

    protected _setGameModes: Set<IGameMode> = new Set();
    protected _currentGameState: GameState = GameState.NULL;

    public addGameMode(gameMode: IGameMode): void {
        this._setGameModes.add(gameMode);
        //console.log();
    }

    public removeGameMode(gameMode: IGameMode): void {
        this._setGameModes.delete(gameMode);
    }

    public cleanAll(): void {
        this._setGameModes.clear();
    }

    public changeAllGameState(value: GameState): void {
        if (this._currentGameState === value) return;
        this._currentGameState = value;
        for (const gameMode of this._setGameModes) {
            gameMode.changeGameState(value);
        }
    }

    public getCurrentGameState(): GameState {
        return this._currentGameState;
    }
}