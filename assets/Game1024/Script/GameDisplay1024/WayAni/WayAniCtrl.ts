import { _decorator, Component, Node } from 'cc';
import { BasicWayAni } from './IWayAniDef/IWayAniDef';
import { GameState, IGameMode } from '../../ReferencePath';

const BOARD_MAX_LEN = 6;
const { ccclass, property } = _decorator;

@ccclass('WayAniCtrl')
export class WayAniCtrl extends Component implements IGameMode {

    @property({ type: BasicWayAni, visible: true, displayName: "NGWayAni", tooltip: "NGway動畫" })
    private _ngWayAni: BasicWayAni = null;

    @property({ type: BasicWayAni, visible: true, displayName: "FGWayAni", tooltip: "FGway動畫" })
    private _fgWayAni: BasicWayAni = null;

    private _dirtyFirstOnLoad: boolean = false;
    private _currentWayAniCtrl: BasicWayAni = null;
    private _countMaxLen: number = 0;

    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;
        this.init();
    }

    public reset(): void {

        this._ngWayAni.reset();
        this._fgWayAni.reset();
    }

    public init(): void {
        if (!this._dirtyFirstOnLoad) return;
    }

    public changeGameState(value: GameState): void {
        //---遊戲狀態改變的時候處理

        switch (value) {
            case GameState.NORMAL:

                this._ngWayAni.node.active = true;
                this._currentWayAniCtrl = this._ngWayAni;
                this.closeOtherWayAni(this._fgWayAni);
                break;

            case GameState.FREE_GAME:

                this._fgWayAni.node.active = true;
                this._currentWayAniCtrl = this._fgWayAni;
                this.closeOtherWayAni(this._ngWayAni);
                break;
            default:
                console.error('WayAniCtrl-getCurrentWayAniByGameState-無效的遊戲狀態', value);
                break;
        }

    }

    public closeOtherWayAni(wayAni: BasicWayAni): void {

        if (wayAni) {
            wayAni.goBackToDefault();
            wayAni.node.active = false;
        }
    }

    public showWayNum(value: number): void {
        this._countMaxLen++;
        if (this._countMaxLen >= BOARD_MAX_LEN) {
            this.playWayAni(value);
        } else {
            this.setScoreLabel(value);
        }
    }

    public setScoreLabel(value: number): void {

        if (value > 0) {
            this._currentWayAniCtrl.appearWayLabel();
        }
        this._currentWayAniCtrl.setScoreLabel(value);
        this._currentWayAniCtrl.showWayLabel();
    }

    public playWayAni(wayNum: number): void {

        //let multiplierTarget = (this._currentWayAniCtrl.currentWayNum == 0) ? 1 : this._currentWayAniCtrl.currentWayNum;
        //const currentMultiple = multiplierTarget * wayNum;
        this._currentWayAniCtrl.setScoreLabel(wayNum);
        this._currentWayAniCtrl.showWayLabel();
        this._currentWayAniCtrl.playWayAni();
    }

    public goBackToDefault(): void {
        this._currentWayAniCtrl.goBackToDefault();
    }

    public resetWayAni(): void {
        this._countMaxLen = 0;
        this._currentWayAniCtrl.resetWayAni();
        this._currentWayAniCtrl.hideWayLabel();
        this.reset();
    }

    public hideWayLabel(): void {
        this._currentWayAniCtrl.hideWayLabel();
    }

    public showWayLabel(): void {
        this._currentWayAniCtrl.showWayLabel();
    }

}


