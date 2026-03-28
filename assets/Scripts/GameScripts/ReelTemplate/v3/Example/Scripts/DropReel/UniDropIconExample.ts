import { _decorator, color, Component, Node, Sprite, SpriteFrame } from 'cc';
import { SymbolNumber } from '../SymbolNumber';
import { UniDropIconBase } from '../../../Scripts/DropReel/UniDropIconBase';

const { ccclass, property } = _decorator;

@ccclass('DropUniIconExample')
export class UniDropIconExample extends UniDropIconBase<SymbolNumber> {
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

    public show(): void {
        if (!this.node.active) {
            this.node.active = true;
        }
    }

    public hide(): void {
        if (this.node.active) {
            this.node.active = false;
        }
    }
}


