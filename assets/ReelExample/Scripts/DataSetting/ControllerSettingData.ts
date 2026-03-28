import { _decorator, CCBoolean, CCInteger, CCString, Component, Enum, Node } from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

export enum GameModeExample {
    NG,
    FG,
}

@ccclass('ControllerSettingData')
export class ControllerSettingData extends Component {
    @property({ type: Enum(GameModeExample), displayName: '當前模式', group: { id: '5', name: '控制' } })
    public gameMode: GameModeExample = GameModeExample.NG;

    @property({ displayName: '強押中獎', group: { id: '5', name: '控制' } })
    public forceWin: boolean = false;

    @property({ displayName: '強押大獎', group: { id: '5', name: '控制' } })
    public forceBigWin: boolean = false;

    @property({ type: CCInteger, displayName: '聽牌滾輪ID', group: { id: '5', name: '控制' } })
    public readyHandReelList: number[] = [];

    @property({ type: CCInteger, displayName: '滾輪順序', group: { id: '5', name: '控制' } })
    public rollingReelIDs: number[] = [0, 1, 2, 3];

    @property({ type: CCString, displayName: '最終盤面，請用,分隔', group: { id: '5', name: '控制' } })
    public diskData: string[] = [];

    @property({ type: CCString, displayName: '中線位置，請用,分隔', group: { id: '5', name: '控制' } })
    public winLineData: string[] = [];

    public onIsLayoutChange: (isLayout: boolean) => void;

    private _isLayout: boolean = false;

    @property({ displayName: '開啟排版', visible: EDITOR_NOT_IN_PREVIEW, group: { id: '5', name: '控制' } })
    public set isLayout(value: boolean) {
        if (this._isLayout !== value) {
            this._isLayout = value;
            this.onIsLayoutChange?.(this._isLayout);
        }
    }

    public get isLayout(): boolean {
        return this._isLayout;
    }
}


