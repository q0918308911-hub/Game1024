import { _decorator, Button, Component, Label, Node } from 'cc';
import { Utility } from '../../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('BuyFeatureUIBase')
export class BuyFeatureUIBase extends Component {

    @property(Button)
    protected confirmBtn: Button;

    @property(Button)
    protected closeBtn: Button;

    @property(Button)
    protected increaseBtn: Button;

    @property(Button)
    protected decreaseBtn: Button;

    @property(Label)
    protected betValueLabel: Label;

    @property(Label)
    protected featureTotalLabel: Label;

    public onConfirmBtnClickCallback: (betValue: number) => void;
    public onCloseBtnClickCallback: () => void;

    protected betValueList: number[] = [];
    protected maxBetIndex: number = 0;
    protected currentBetIndex: number = 0;
    protected currentBetValue: number = 0;
    protected currentFeatureTotal: number = 0;
    protected featureMultiplier: number = 100;

    public init(betValueList: number[]): void {
        if (this.confirmBtn) {
            Utility.addEventHandlerToButton(this.confirmBtn.node, this, 'onConfirmBtnClick');
        }

        if (this.closeBtn) {
            Utility.addEventHandlerToButton(this.closeBtn.node, this, 'onCloseBtnClick');
        }

        if (this.increaseBtn) {
            Utility.addEventHandlerToButton(this.increaseBtn.node, this, 'onIncreaseBtnClick');
        }

        if (this.decreaseBtn) {
            Utility.addEventHandlerToButton(this.decreaseBtn.node, this, 'onDecreaseBtnClick');
        }

        this.betValueList = [...betValueList];
        this.maxBetIndex = this.betValueList.length - 1;
        this.currentBetIndex = 0;
        this.updateBetValue();
    }

    protected onConfirmBtnClick(): void {
        //此處可以override，讓子類別先表演完關閉的特效後
        //再呼叫父類別的onConfirmBtnClickCallback
        this.onConfirmBtnClickCallback?.call(this, this.currentFeatureTotal);
    }

    protected onCloseBtnClick(): void {
        this.onCloseBtnClickCallback?.call(this);
    }

    protected onIncreaseBtnClick(): void {
        this.resetBetValueBtnInteractable();
        this.currentBetIndex++;

        if (this.currentBetIndex === this.maxBetIndex) {
            this.increaseBtn.interactable = false;
        }

        this.updateBetValue();
    }

    protected onDecreaseBtnClick(): void {
        this.resetBetValueBtnInteractable();
        this.currentBetIndex--;

        if (this.currentBetIndex === 0) {
            this.decreaseBtn.interactable = false;
        }

        this.updateBetValue();
    }

    protected btnInteractable(interactable: boolean): void {
        this.confirmBtn.interactable = interactable;
        this.closeBtn.interactable = interactable;
        this.increaseBtn.interactable = interactable;
        this.decreaseBtn.interactable = interactable;
    }

    protected resetBetValueBtnInteractable(): void {
        this.increaseBtn.interactable = true;
        this.decreaseBtn.interactable = true;
    }

    protected setBetValueLabel(betValue: number): void {
        this.betValueLabel.string = betValue.numberComma();
    }

    protected setFeatureTotalLabel(featureTotal: number): void {
        this.featureTotalLabel.string = featureTotal.numberComma();
    }

    protected updateBetValue() {
        this.currentBetValue = this.betValueList[this.currentBetIndex];
        this.currentFeatureTotal = (this.currentBetValue * this.featureMultiplier).fixed();
        this.setBetValueLabel(this.currentBetValue);
        this.setFeatureTotalLabel(this.currentFeatureTotal);
    }
}