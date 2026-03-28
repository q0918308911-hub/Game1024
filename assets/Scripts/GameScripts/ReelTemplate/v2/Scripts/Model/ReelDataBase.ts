import { _decorator, CCFloat, CCInteger, Component, Enum, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum rollDirection {
    Down,
    Up,
    Left,
    Right,
}

@ccclass('ReelDataBase')
export class ReelDataBase extends Component {
    @property({ visible: true, tooltip: '是否使用layout排版' })
    protected _useLayout: boolean = false;

    @property({ type: Enum(rollDirection), visible: true, tooltip: '滾輪方向' })
    protected _reelDir: rollDirection = rollDirection.Down;

    @property({ type: CCFloat, visible: true, tooltip: 'icon相隔距離' })
    protected _iconSpacing: number = 0;

    public get useLayout(): boolean {
        return this._useLayout;
    }

    public set useLayout(use: boolean) {
        this._useLayout = use;
    }

    public get iconSpacing(): number {
        return this._iconSpacing;
    }

    public set iconSpacing(spacing: number) {
        this._iconSpacing = spacing;
    }

    public get reelDir(): rollDirection {
        return this._reelDir;
    }

    public set reelDir(dir: rollDirection) {
        this._reelDir = dir;
    }
}


