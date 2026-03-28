import { _decorator, CCInteger, Component, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('IconData')
export class IconData extends Component {
    @property({ type: CCInteger, readonly: true, visible: true, tooltip: 'ID' })
    protected _iconID: number = 0;

    @property({ type: CCInteger, visible: true, tooltip: 'SymbolID' })
    protected _symbolID: number = 0;

    @property({ type: CCInteger, range: [0, 255], visible: true, tooltip: '壓黑後的明亮度' })
    protected _darkBrightness: number = 0;

    @property({ type: SpriteFrame, visible: true })
    protected _spriteFrameList: SpriteFrame[] = [];

    public set iconID(id: number) {
        this._iconID = id;
    }

    public get iconID(): number {
        return this._iconID;
    }

    public set symbolID(id: number) {
        this._symbolID = id;
    }

    public get symbolID(): number {
        return this._symbolID;
    }

    public get darkBrightness(): number {
        return this._darkBrightness;
    }

    public set darkBrightness(brightness: number) {
        this._darkBrightness = brightness;
    }

    public get spriteFrameList(): SpriteFrame[] {
        return this._spriteFrameList;
    }

    public set spriteFrameList(frameList: SpriteFrame[]) {
        this._spriteFrameList = frameList;
    }
}