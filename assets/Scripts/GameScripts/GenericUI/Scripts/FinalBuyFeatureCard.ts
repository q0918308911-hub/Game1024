import { _decorator, Button, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { BuyFeatureCardInfo } from './BuyFeatureCard';
import { Utility } from '../../../Utils/Core';
import { Orientation } from '../../Definition';
import { ScreenAdapter } from '../../../Utils/Orientation/ScreenAdapter';
const { ccclass, property } = _decorator;


@ccclass('FinalBuyFeatureCard')
export class FinalBuyFeatureCard extends Component {

    @property(Node)
    private cardNodeLandscape: Node;

    @property(Node)
    private cardNodePortrait: Node;

    @property(Label)
    private titleLandscape: Label;

    @property(Label)
    private titlePortrait: Label;

    @property(Label)
    private contentLandscape: Label;

    @property(Label)
    private contentPortrait: Label;

    @property(Sprite)
    private bonusIconSpriteLandscape: Sprite;

    @property(Sprite)
    private bonusIconSpritePortrait: Sprite;

    @property(Label)
    private betLabelLandscape: Label;

    @property(Label)
    private betLabelPortrait: Label;

    @property(Node)
    private finalConfirmBtnLandscape: Node;

    @property(Node)
    private finalConfirmBtnPortrait: Node;

    @property(Node)
    private backBtnLandscape: Node;

    @property(Node)
    private backBtnPortrait: Node;

    public index: number = -1; // 卡片的索引

    public multiply: number = 1; // Bet 的乘數

    private cardInfo: BuyFeatureCardInfo = null;

    public onFinalConfirmBtnClickCallback: (cardInfo: BuyFeatureCardInfo, cardIndex: number) => void = null;

    public onBackBtnClickCallback: () => void = null;

    protected onEnable(): void {
        this.resetBtnStatus();
    }

    private resetBtnStatus() {
        this.finalConfirmBtnLandscape.getComponents(Button).forEach(btn => btn.interactable = false);
        this.finalConfirmBtnPortrait.getComponents(Button).forEach(btn => btn.interactable = false);
        this.backBtnLandscape.getComponents(Button).forEach(btn => btn.interactable = false);
        this.backBtnPortrait.getComponents(Button).forEach(btn => btn.interactable = false);
        this.finalConfirmBtnLandscape.getComponents(Button).forEach(btn => btn.interactable = true);
        this.finalConfirmBtnPortrait.getComponents(Button).forEach(btn => btn.interactable = true);
        this.backBtnLandscape.getComponents(Button).forEach(btn => btn.interactable = true);
        this.backBtnPortrait.getComponents(Button).forEach(btn => btn.interactable = true);
    }

    public init() {
        this.resetByRotate(ScreenAdapter.UI_Orientation);
        Utility.addEventHandlerToButton(this.finalConfirmBtnLandscape, this, 'onFinalConfirmBtnClick');
        Utility.addEventHandlerToButton(this.finalConfirmBtnPortrait, this, 'onFinalConfirmBtnClick');
        Utility.addEventHandlerToButton(this.backBtnLandscape, this, 'onBackBtnClick');
        Utility.addEventHandlerToButton(this.backBtnPortrait, this, 'onBackBtnClick');
    }

    public setTitle(title: string) {
        this.titleLandscape.string = title;
        this.titlePortrait.string = title;
    }

    public setContent(content: string) {
        this.contentLandscape.string = content;
        this.contentPortrait.string = content;
    }

    public setBonusIcon(icon: SpriteFrame) {
        this.bonusIconSpriteLandscape.spriteFrame = icon;
        this.bonusIconSpritePortrait.spriteFrame = icon;
    }

    public setBet(bet: number) {
        let finalBet = bet * this.multiply;
        this.betLabelLandscape.string = finalBet.fixed().numberComma();
        this.betLabelPortrait.string = finalBet.fixed().numberComma();
    }

    public resetByRotate(orientation: Orientation) {
        if (orientation === Orientation.Landscape) {
            this.cardNodeLandscape.active = true;
            this.cardNodePortrait.active = false;

        }
        else {
            this.cardNodeLandscape.active = false;
            this.cardNodePortrait.active = true;

        }
    }

    public setInfo(index: number, cardInfo: BuyFeatureCardInfo): void {
        this.index = index;
        this.setTitle(cardInfo.title);
        this.setContent(cardInfo.content);
        this.setBonusIcon(cardInfo.icon);
        this.multiply = cardInfo.multiply;
        this.cardInfo = cardInfo;
    }

    private onFinalConfirmBtnClick() {
        this.onFinalConfirmBtnClickCallback?.(this.cardInfo, this.index);
    }

    private onBackBtnClick() {
        this.onBackBtnClickCallback?.();
    }

}

