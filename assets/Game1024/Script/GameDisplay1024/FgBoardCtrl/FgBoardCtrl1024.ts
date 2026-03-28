import { _decorator, Component, Node } from 'cc';
import { BoardKeyOf, BoardTransitionSpec, FGBoardFoundation, GameState, IGameMode, NotifyCation, NotifySubject } from '../../ReferencePath';
import { IFG1024BoardKeyMap, IFG1024BoardContext, IFG1024Payload } from './IFgBoardDef';
import { PlaySelector } from '../../MyUtils/AnimationSystemV3/Definitions/IPlayOptions';
import { GameEventType1024 } from '../../DefinitionGameData1024/GameEventTypeDef1024';



const { ccclass, property } = _decorator;
@ccclass('FgBoardCtrl1024')

export class FgBoardCtrl1024 extends FGBoardFoundation<IFG1024BoardKeyMap, IFG1024BoardContext> implements IGameMode {

    public testMode(): void {
        /*
        BasicGameGlobalData.getInstance<GameGlobalData>().setGlobalData(
            GameGlobalKeys.GameState, GameState.FREE_GAME
        );*/
        //this.openFGUIBoard(10);
        this._loopTimeForState = 10;
        //this.setBoardMode(GameState.FREE_GAME);
        this.setBoardMode(GameState.NORMAL);
        //this.setResultLabel(12345);
        this.openFGUIBoard(12345);
    }



    public changeGameState(value: GameState): void {
        this.setBoardMode(value);
    }

    protected override getOutPlayTask(mode: PlaySelector, dt?: number): Promise<void> {
        return this.playWithFrameEvt(
            mode,
            () => {
                const evtData = {
                    eventType: GameEventType1024.FG_OUT_BACK_EVENT,
                    eventData: {}
                }
                NotifyCation.getInstance().emitSync(NotifySubject.GAME_ANI_PROCESS_SUBJECT, evtData.eventType, evtData);
            },
            () => {
                console.log('finish');
            }
        );
    }

    //===============setting time info<override it>============================================================
    //--自己要定義開始寫入時間/動畫資料
    protected onInit(): void {
        //---TODO:要去抓動畫時間資料進來---
        //-IGameStepDelayTimeList
        // === 時間對應表 ===
        this._timeBaseKeyMap = {
            open: {
                [GameState.FREE_GAME]: 0.5,
                [GameState.NORMAL]: 0.5,
            },
            loop: {
                [GameState.FREE_GAME]: 5,
                [GameState.NORMAL]: 5,
            },
            close: {
                [GameState.FREE_GAME]: 0.6,
                [GameState.NORMAL]: 0.6,
            }
        };

        // === 動畫 key 對應表 ===
        this._aniKeyBaseMap = {
            open: {
                [GameState.FREE_GAME]: 'FG_In',
                [GameState.NORMAL]: 'BACK_NG_In',
            },
            loop: {
                [GameState.FREE_GAME]: 'FG_Loop',
                [GameState.NORMAL]: 'BACK_NG_Loop',
            },
            close: {
                [GameState.FREE_GAME]: 'FG_Out',
                [GameState.NORMAL]: 'BACK_NG_Out',
            }
        };
    }

    protected override resolveOpenSpec(
        ctx?: IFG1024BoardContext
    ): BoardTransitionSpec<BoardKeyOf<IFG1024BoardKeyMap>> {
        //--之後可以在這裡加判斷--這邊先這樣
        if (ctx?.reason === 'open') {
            return {
                timeKey: 'open',
                aniKey: 'open',
                payload: null
            }
        } else if (ctx?.reason === 'loop') {
            return {
                timeKey: 'loop',
                aniKey: 'loop',
                payload: null
            }
        } else if (ctx?.reason === 'click') {
            return {
                timeKey: 'close',
                aniKey: 'close',
                payload: null
            }
        }

        return null;
    }

    protected override resolveCloseSpec(
        ctx?: IFG1024BoardContext
    ): BoardTransitionSpec<BoardKeyOf<IFG1024BoardKeyMap>> {
        //--之後可以在這裡加判斷--這邊先這樣
        if (ctx?.reason === 'open') {
            return {
                timeKey: 'open',
                aniKey: 'open',
                payload: null
            }
        } else if (ctx?.reason === 'loop') {
            return {
                timeKey: 'loop',
                aniKey: 'loop',
                payload: null
            }
        } else if (ctx?.reason === 'click') {
            return {
                timeKey: 'close',
                aniKey: 'close',
                payload: null
            }
        }

        return null;
    }

    //--預計override-預設行為,專門服務給click事件使用,子類別可覆寫此方法改變行為
    /*
    protected resolveClickLoopKey(): keyof TKeyMap {
        // 預設行為
        return Object.keys(this._aniKeyBaseMap)[0] as keyof TKeyMap;
    }*/


    //===============process sound<override it>============================================================
    protected override processOpenBoardSound(playKey: string): void {
        /*
        
        let playSoundKey;
        if (playKey == FG_BOARD_ANI_MAP.FG_In) {
            playSoundKey = SoundList.fgEnterPage_In;
            this._loopTimeForState = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList).get(cfg => cfg.fg?.duringBoardIn);
            this.playVoiceIn();
        } else {
            playSoundKey = SoundList.fgExitPage_In;
            this._loopTimeForState = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList).get(cfg => cfg.fg?.duringBoardOut);
            this.playVoiceOut();
        }

        AudioManager.instance.playSound(playSoundKey, SOUND_TYPE.NORMAL, AudioSourceList.RsAs);
        */
    }

    protected override afterCancelStopSound(): void {
        //AudioManager.instance.stopSound([AudioSourceList.RsAs]);
    }

    protected override playVoiceOut(): void {

    }

    protected override playVoiceIn(): void {

    }
}


