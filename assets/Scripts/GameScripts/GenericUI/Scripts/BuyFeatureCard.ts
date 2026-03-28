import { _decorator, Button, CCFloat, CCString, Component, Label, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { Utility } from "../../../Utils/Core";
import { Orientation, GenericSound } from '../../Definition';
import { AudioManager } from '../../../Utils/Audio';
import { ScreenAdapter } from "../../../Utils/Orientation";

const { ccclass, property } = _decorator;

const cardSizeLandscape = { width: 303, height: 425 };
const cardSizePortrait = { width: 524, height: 265 };

@ccclass('BuyFeatureCard')
export class BuyFeatureCard extends Component {

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
    private confirmBtnLandscape: Node;

    @property(Node)
    private confirmBtnPortrait: Node;

    public index: number = -1; // 卡片的索引

    public multiply: number = 1; // Bet 的乘數

    private cardInfo: BuyFeatureCardInfo = null;

    public onConfirmBtnClickCallback: (index: number, cardInfo: BuyFeatureCardInfo) => void = null;

    protected onEnable(): void {
        this.resetBtnStatus();
    }

    private resetBtnStatus() {
        this.confirmBtnLandscape.getComponents(Button).forEach(btn => btn.interactable = false);
        this.confirmBtnPortrait.getComponents(Button).forEach(btn => btn.interactable = false);
        this.confirmBtnLandscape.getComponents(Button).forEach(btn => btn.interactable = true);
        this.confirmBtnPortrait.getComponents(Button).forEach(btn => btn.interactable = true);
    }

    public init() {
        this.resetByRotate(ScreenAdapter.UI_Orientation);
        Utility.addEventHandlerToButton(this.confirmBtnLandscape, this, 'onConfirmBtnClick');
        Utility.addEventHandlerToButton(this.confirmBtnPortrait, this, 'onConfirmBtnClick');
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
            this.getComponent(UITransform).setContentSize(cardSizeLandscape.width, cardSizeLandscape.height);
        }
        else {
            this.cardNodeLandscape.active = false;
            this.cardNodePortrait.active = true;
            this.getComponent(UITransform).setContentSize(cardSizePortrait.width, cardSizePortrait.height);
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

    private onConfirmBtnClick() {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.onConfirmBtnClickCallback?.(this.index, this.cardInfo);
    }

}

@ccclass('BuyFeatureCardInfo')
export class BuyFeatureCardInfo {
    @property(CCString)
    public title: string = "title";

    @property(CCString)
    public content: string = "content";

    @property(SpriteFrame)
    public icon: SpriteFrame = null; // 卡片的圖示

    @property(CCFloat)
    public multiply: number = 0; // Bet 的乘數
}
