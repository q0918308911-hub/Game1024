import { _decorator, CCInteger, color, Sprite, SpriteFrame, v3 } from 'cc';
import { UniIconBase } from '../../../../ReelTemplate/v3';
import { SymbolNumber } from '../../../../ReelTemplate/v3/Example/Scripts/SymbolNumber';
const { ccclass, property } = _decorator;

@ccclass('UniIconTempo')
export class UniIconTempo extends UniIconBase<SymbolNumber> {
    @property({ range: [0, 255] })
    protected darkBrightness: number = 0;

    @property(Sprite)
    protected gameSprite: Sprite = null;

    @property(SpriteFrame)
    protected spriteFrameList: SpriteFrame[] = [];

    public init(): void {
        super.init();
    }

    public override get symbol(): SymbolNumber { //假如覆寫get or set，兩者都要override
        return this._symbol;
    }

    public override set symbol(symbol: SymbolNumber) {
        this._symbol = symbol;
        this.updateSymbol(symbol);
    }

    public updateSymbol(symbol: SymbolNumber): void {
        this.gameSprite.spriteFrame = this.spriteFrameList[symbol.symbolID];
    }

    public setBrightness(isDark: boolean) {
        let darkBrightness = this.darkBrightness;

        if (isDark) {
            this.gameSprite.color = color(darkBrightness, darkBrightness, darkBrightness, this.gameSprite.color.a);
        }
        else {
            this.gameSprite.color = color(255, 255, 255, this.gameSprite.color.a);
        }
    }
}


