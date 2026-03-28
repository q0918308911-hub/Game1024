import { _decorator, Button, Component, instantiate, Label, Node, ScrollView } from 'cc';
import CenterLayout from './CenterLayout';
import { BuyFeatureCard, BuyFeatureCardInfo } from './BuyFeatureCard';
import { FinalBuyFeatureCard } from './FinalBuyFeatureCard';
import { AudioManager } from "db://assets/Scripts/Utils/Audio";
import { Utility } from "db://assets/Scripts/Utils/Core";
import { Orientation, GenericSound } from "db://assets/Scripts/GameScripts/Definition";
import { ScreenAdapter, RotationResize } from '../../../Utils/Orientation';

const { ccclass, property } = _decorator;

@ccclass('BuyFeatureInfoUI')
export class BuyFeatureInfoUI extends Component {

    @property(Node)
    private titleSpriteNode: Node;

    @property(Node)
    private betGroupNode: Node;

    // 基本卡片 拿來 instantiate 用
    @property(Node)
    private buyFeatureCardNode: Node;

    @property(ScrollView)
    private scrollViewLandscape: ScrollView;

    @property(ScrollView)
    private scrollViewPortrait: ScrollView;

    @property(CenterLayout)
    private layoutLandscape: CenterLayout;

    @property(CenterLayout)
    private layoutPortrait: CenterLayout;

    @property(Label)
    private currentBetLabel: Label;

    @property(Node)
    private bgBtn: Node;

    @property(Node)
    private plusBtn: Node;

    @property(Node)
    private minusBtn: Node;

    @property(Node)
    private closeBtn: Node;

    @property(Node)
    private basicNode: Node;

    @property(Node)
    private finalConfirmNode: Node;

    @property(FinalBuyFeatureCard)
    private finalBuyFeatureCard: FinalBuyFeatureCard;

    private _selectedCardInfo: BuyFeatureCardInfo = null;

    public onChangeBetValueCallback: ((betIndex: number, betValue: number) => void) = null;
    public onFinalBuyFeatureCardConfirmBtnClickCallback: ((cardInfo: BuyFeatureCardInfo, betValue: number, cardIndex: number) => void) = null;

    private cardList: Node[] = [];

    private betValueList: number[] = [];

    private currentBetValue: number = 0;

    public get cardAmount(): number {
        return this.cardList.length;
    }

    public init(): void {
        // Initialization logic here
        this.getComponent(RotationResize).onRotationResize = this.onRotationResize.bind(this);
        this.scrollViewLandscape.enabled = false;
        this.scrollViewPortrait.enabled = false;
        Utility.addEventHandlerToButton(this.closeBtn, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.plusBtn, this, 'onPlusBtnClick');
        Utility.addEventHandlerToButton(this.minusBtn, this, 'onMinusBtnClick');
        Utility.addEventHandlerToButton(this.bgBtn, this, 'onBGBtnClick');
        this.finalBuyFeatureCard.onBackBtnClickCallback = this.onFinalBuyFeatureCardBackBtnClick.bind(this);
        this.finalBuyFeatureCard.onFinalConfirmBtnClickCallback = this.onFinalBuyFeatureCardConfirmBtnClick.bind(this);
        this.finalBuyFeatureCard.init();
    }

    public setCardAmount(amount: number): void {
        this.layoutLandscape.node.destroyAllChildren();
        this.layoutPortrait.node.destroyAllChildren();
        this.cardList = [];
        for (let i = 0; i < amount; i++) {
            let card = this.createBuyFeatureCard();
            card.active = true;
            this.cardList.push(card);
            card.getComponent(BuyFeatureCard).index = i;
            card.getComponent(BuyFeatureCard).onConfirmBtnClickCallback = this.onCardConfirmBtnClick.bind(this);

        }

        this.scrollViewPortrait.verticalScrollBar.node.active = amount > 3;
        this.scrollViewLandscape.horizontalScrollBar.node.active = amount > 4;
        this.scrollViewPortrait.enabled = amount > 3;
        this.scrollViewLandscape.enabled = amount > 4;

        this.onRotationResize(ScreenAdapter.UI_Orientation);
    }

    public setCardInfo(index: number, cardInfo: BuyFeatureCardInfo): void {
        if (index < 0 || index >= this.cardList.length) {
            console.error('Invalid card index');
            return;
        }
        const cardItem = this.cardList[index];
        cardItem.getComponent(BuyFeatureCard).setInfo(index, cardInfo);
    }


    private createBuyFeatureCard(): Node {
        let cardItem = instantiate(this.buyFeatureCardNode);
        cardItem.setParent(this.layoutLandscape.node);
        cardItem.setPosition(0, 0);
        cardItem.getComponent(BuyFeatureCard).init();
        return cardItem;
    }

    private onRotationResize(orientation: Orientation) {

        for (let i = 0; i < this.cardList.length; i++) {
            const card = this.cardList[i];
            card.getComponent(BuyFeatureCard).resetByRotate(orientation)
        }

        if (orientation === Orientation.Landscape) {
            this.titleSpriteNode.setPosition(0, 295);
            this.betGroupNode.setPosition(0, -290);
            this.scrollViewLandscape.node.active = true;
            this.scrollViewPortrait.node.active = false;
            for (let i = 0; i < this.cardList.length; i++) {
                const card = this.cardList[i];
                card.setParent(this.layoutLandscape.node);
                card.setSiblingIndex(i);
            }
            this.layoutLandscape.updateLayout();
            if (this.cardList.length > 4) {
                this.scrollViewLandscape.scrollToLeft(0);
            }
        }
        else if (orientation === Orientation.Portrait) {
            this.titleSpriteNode.setPosition(0, 553);
            this.betGroupNode.setPosition(0, -442);
            this.scrollViewLandscape.node.active = false;
            this.scrollViewPortrait.node.active = true;

            for (let i = 0; i < this.cardList.length; i++) {
                const card = this.cardList[i];
                card.setParent(this.layoutPortrait.node);
                card.setSiblingIndex(i);
            }
            this.layoutPortrait.updateLayout();
            if (this.cardList.length > 3) {
                this.scrollViewPortrait.scrollToTop(0);
            }
        }

        this.finalBuyFeatureCard.resetByRotate(orientation);
    }

    public setBetValueList(betValueList: number[]): void {
        this.betValueList = betValueList;
    }

    public showUI(currentBetValue: number): void {
        this.node.active = true;
        this.basicNode.active = true;
        this.finalConfirmNode.active = false;
        this.currentBetValue = currentBetValue;
        this.checkPlusMinusBtnStatus();
        this.updateCardBetInfo(currentBetValue);
        this.setCurrentBetLabel(currentBetValue);
        this.onRotationResize(ScreenAdapter.UI_Orientation);
    }

    public hideUI(): void {
        this.node.active = false;
    }

    private updateCardBetInfo(betValue: number): void {
        for (let i = 0; i < this.cardList.length; i++) {
            const card = this.cardList[i].getComponent(BuyFeatureCard);
            card.setBet(betValue);
        }
    }

    private onCloseBtnClick(): void {
        AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        this.hideUI();
    }

    private onPlusBtnClick(): void {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        if (this.betValueList.length === 0) return;
        let currentIndex = this.betValueList.indexOf(this.currentBetValue);
        currentIndex += 1;
        if (currentIndex >= this.betValueList.length) {
            currentIndex = this.betValueList.length - 1;
        }

        this.updateUIByBetValue(currentIndex);
        this.onChangeBetValueCallback?.(currentIndex, this.currentBetValue);
    }

    private onMinusBtnClick(): void {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        if (this.betValueList.length === 0) return;
        let currentIndex = this.betValueList.indexOf(this.currentBetValue);
        currentIndex -= 1;
        if (currentIndex < 0) {
            currentIndex = 0;
        }

        this.updateUIByBetValue(currentIndex);
        this.onChangeBetValueCallback?.(currentIndex, this.currentBetValue);
    }

    private updateUIByBetValue(betIndex: number): void {
        this.currentBetValue = this.betValueList[betIndex];
        this.updateCardBetInfo(this.currentBetValue);
        this.setCurrentBetLabel(this.currentBetValue);
        this.checkPlusMinusBtnStatus();
    }

    public setCurrentBetLabel(betValue: number): void {
        this.currentBetLabel.string = betValue.fixed().numberComma();
    }

    // 卡片列表卡片按下確認
    private onCardConfirmBtnClick(cardIndex: number, cardInfo: BuyFeatureCardInfo): void {

        // 不進入最後確認視窗，直接確認
        /*
        this.basicNode.active = false;
        this.finalConfirmNode.active = true;
        this.finalBuyFeatureCard.setInfo(cardIndex, cardInfo);
        this.finalBuyFeatureCard.setBet(this.currentBetValue);
        this._selectedCardInfo = cardInfo;
        */

        // 直接走原本最後視窗確認鍵按下後的流程
        this._selectedCardInfo = cardInfo;
        this.onFinalBuyFeatureCardConfirmBtnClick(cardInfo, cardIndex)
    }

    private onFinalBuyFeatureCardBackBtnClick(): void {
        this.basicNode.active = true;
        this.finalConfirmNode.active = false;
        this._selectedCardInfo = null;
    }

    // 確認卡片按下購買
    private onFinalBuyFeatureCardConfirmBtnClick(cardInfo: BuyFeatureCardInfo, cardIndex: number): void {
        if (this._selectedCardInfo === null) {
            console.error('No card selected for purchase');
            return;
        }
        this.onFinalBuyFeatureCardConfirmBtnClickCallback?.(cardInfo, this.currentBetValue, cardIndex);
    }

    private checkPlusMinusBtnStatus(): void {
        let currentIndex = this.betValueList.indexOf(this.currentBetValue);
        this.minusBtn.getComponent(Button).interactable = currentIndex > 0;
        this.plusBtn.getComponent(Button).interactable = currentIndex < this.betValueList.length - 1;
    }

    public get selectedCardInfo(): BuyFeatureCardInfo {
        return this._selectedCardInfo;
    }

    private onBGBtnClick(): void {
        if (this.finalConfirmNode.active) {
            this.onFinalBuyFeatureCardBackBtnClick();
        }
        else {
            this.onCloseBtnClick();
        }
    }

}


