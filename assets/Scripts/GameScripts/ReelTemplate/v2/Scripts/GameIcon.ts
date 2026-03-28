import { _decorator, Sprite, color, } from 'cc';
import { IconBase } from './IconBase';
import { IconData } from './Model/IconData';
const { ccclass, property } = _decorator;


@ccclass('GameIcon')
export class GameIcon extends IconBase {
    @property({ type: IconData, visible: true })
    protected _iconData: IconData = null;

    public get iconData(): IconData {
        return this._iconData;
    }

    @property({ type: Sprite, visible: true })
    protected _gameSprite: Sprite = null;

    public init(): void {
        super.init();
    }

    public override updateSymbol(symbolID: number): void {
        this._iconData.symbolID = symbolID;
        this._gameSprite.spriteFrame = this._iconData.spriteFrameList[symbolID];
    }

    public setBrightness(isDark: boolean) {
        let darkBrightness = this._iconData.darkBrightness;

        if (isDark) {
            this._gameSprite.color = color(darkBrightness, darkBrightness, darkBrightness, this._gameSprite.color.a);
        }
        else {
            this._gameSprite.color = color(255, 255, 255, this._gameSprite.color.a);
        }
    }
}