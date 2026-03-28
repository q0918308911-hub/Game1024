import { _decorator, Button, Color, Component, EventTouch, Label, Node, Sprite, SpriteFrame, Toggle, UIOpacity, UITransform, Widget } from 'cc';
import { AudioManager } from "db://assets/Scripts/Utils/Audio";
import { Utility } from "db://assets/Scripts/Utils/Core";
import { GenericSound, GameStatus } from "db://assets/Scripts/GameScripts/Definition";
import { LocalizationButton } from "db://assets/Scripts/GameScripts/Localization";

const { ccclass, property } = _decorator;

@ccclass('FeatureSettingUI')
export class FeatureSettingUI extends Component {

    @property(Node)
    private rootNode: Node;

    @property(Node)
    private buyBonusBtn: Node;

    @property(Node)
    private buyBonusIcon: Node;

    @property(UIOpacity)
    private buyBonusIconBGOpacity: UIOpacity;

    @property(Node)
    private buyBonusIconCloseBtn: Node;

    @property(Sprite)
    private buyBonusIconSprite: Sprite;

    @property(Node)
    private extraBetToggle: Node;

    @property(Node)
    private extraBetTipNode: Node;

    @property(UITransform)
    private extraBetTipBG: UITransform;

    @property(Label)
    private extraBetTipLabel: Label;

    @property(Node)
    private extraBetTipBGBtnNode: Node;

    @property(Widget)
    public extraBetLandscapeWidget: Widget;

    @property(Widget)
    public extraBetPortraitWidget: Widget;

    @property(Widget)
    public buyBonusLandscapeWidget: Widget;

    @property(Widget)
    public buyBonusPortraitWidget: Widget;

    private isShowTipFirstTime: boolean = true;

    private _extraBetMultiply: number = 1;

    public onBuyBonusBtnClickCallback: () => void = null;
    public onExtraBetToggleChangeCallback: (isOn: boolean) => void = null;
    public onBuyBonusIconCloseClickCallback: () => void = null;



    private disableOpacity: number = 153; // 60% opacity

    public init(): void {
        Utility.addEventHandlerToButton(this.buyBonusBtn, this, 'onBuyBonusBtnClick');
        Utility.addEventHandlerToButton(this.buyBonusIconCloseBtn, this, 'onBuyBonusIconCloseClick');
        Utility.addEventHandlerToToggle(this.extraBetToggle, this, 'onExtraBetToggleChange');
        Utility.addEventHandlerToButton(this.extraBetTipBGBtnNode, this, 'onTipBGClick');
        this.extraBetToggle.on(Node.EventType.MOUSE_ENTER, (event: EventTouch) => {
            event.preventSwallow = true;
            this.showExtraBetTip();
        }, this, true);
        this.setExtraBetTipText("")
    }

    private onBuyBonusBtnClick(): void {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.onBuyBonusBtnClickCallback?.();
    }

    private onBuyBonusIconCloseClick(): void {
        AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        this.setBuyBonusOn(false, null)
        this.onBuyBonusIconCloseClickCallback?.();
    }

    private onExtraBetToggleChange(toggle: Toggle): void {
        let isOn = toggle.isChecked;
        if (isOn) {
            AudioManager.instance.playGenericSound(GenericSound.Public_On);
            this.showExtraBetTip();
        }
        else {
            AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        }
        GameStatus.isExtraBetOn = isOn;
        if (GameStatus.isBuyBonusOpen) {
            this.setBuyBonusBtnInteractable(!isOn);
        }
        this.onExtraBetToggleChangeCallback?.(isOn);
    }

    public setBuyBonusBtnActive(isActive: boolean): void {
        this.buyBonusBtn.active = isActive;
    }

    public setExtraBetToggleActive(isActive: boolean): void {
        this.extraBetToggle.active = isActive;
    }

    public setBuyBonusIconActive(isActive: boolean): void {
        this.buyBonusIcon.active = isActive;
    }

    public setBuyBonusBtnInteractable(b: boolean): void {
        this.buyBonusBtn.getComponents(Button).forEach((btn) => {
            btn.interactable = b;
        });
        let uiOpacity = this.buyBonusBtn.getComponent(UIOpacity);
        if (b) {
            uiOpacity.opacity = 255;
        }
        else {
            uiOpacity.opacity = this.disableOpacity;
        }
    }

    public setExtraBetToggleInteractable(b: boolean): void {
        this.extraBetToggle.getComponent(Toggle).interactable = b;
        let uiOpacity = this.extraBetToggle.getComponent(UIOpacity);

        if (b) {
            uiOpacity.opacity = 255;
            this.extraBetToggle.getComponent(Sprite).enabled = true;
        }
        else {
            uiOpacity.opacity = this.disableOpacity;
            if (GameStatus.isExtraBetOn) {
                this.extraBetToggle.getComponent(Sprite).enabled = false;
            }
        }
    }

    public setBuyBonusIconInteractable(b: boolean): void {
        let uiOpacity = this.buyBonusIcon.getComponent(UIOpacity);
        this.buyBonusIconCloseBtn.active = b;
        if (b) {
            uiOpacity.opacity = 255;
        }
        else {
            uiOpacity.opacity = this.disableOpacity;
        }
    }

    private setBuyBonusIconSpriteFrame(spriteFrame: SpriteFrame): void {
        this.buyBonusIconSprite.spriteFrame = spriteFrame;
    }

    // 開啟購買特色的功能
    public setBuyBonusOpen(): void {
        this.buyBonusBtn.active = true;
    }

    public setExtraBetOpen(multiply: number): void {
        this.setExtraBetToggleActive(true);
        this._extraBetMultiply = multiply;
    }

    public setBuyBonusOn(isOn: boolean, iconSpriteFrame: SpriteFrame): void {
        GameStatus.isBuyBonusOn = isOn;
        this.setBuyBonusIconSpriteFrame(iconSpriteFrame);
        this.setBuyBonusIconActive(isOn);
        this.buyBonusIconCloseBtn.active = isOn;
        this.setBuyBonusBtnActive(!isOn);
        if (GameStatus.isExtraBetOpen) {
            this.setExtraBetToggleActive(!isOn);
        }
    }

    public get extraBetMultiply(): number {
        return this._extraBetMultiply;
    }



    public showExtraBetTip(): void {
        if (!this.extraBetToggle.getComponent(Toggle).interactable) {
            return;
        }

        this.extraBetTipNode.active = true;
        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            this.extraBetTipNode.active = false;
        }, 2); // 顯示2秒後自動隱藏

        if (this.isShowTipFirstTime) {
            this.isShowTipFirstTime = false;
            this.extraBetTipNode.getComponent(UIOpacity).opacity = 0;
            this.scheduleOnce(() => {
                this.extraBetTipNode.getComponent(UIOpacity).opacity = 255;
                let labelHeight = this.extraBetTipLabel.getComponent(UITransform).height;
                this.extraBetTipBG.height = (15 + labelHeight);
            }, 0);
        }


    }

    public hideExtraBetTip(): void {
        this.unscheduleAllCallbacks();
        this.extraBetTipNode.active = false;
    }


    public setToSpinMode(): void {

        if (GameStatus.isBuyBonusOn && !GameStatus.isExtraBetOn) {
            // 購買特色開啟
            this.setBuyBonusIconInteractable(false);
        }
        else if (!GameStatus.isBuyBonusOn && GameStatus.isExtraBetOn) {
            //額外下注開啟
            this.setExtraBetToggleInteractable(false);
        }
        else if (!GameStatus.isBuyBonusOn && !GameStatus.isExtraBetOn) {
            // 兩者皆未開啟
            this.setBuyBonusBtnInteractable(false);
            this.setExtraBetToggleInteractable(false);
        }
        else {
            console.error(`出現未知狀態 isBuyBonusOn: ${GameStatus.isBuyBonusOn}, isExtraBetOn: ${GameStatus.isExtraBetOn}`);
        }

    }

    public setToNormalMode(): void {
        if (GameStatus.isBuyBonusOn && !GameStatus.isExtraBetOn) {
            // 購買特色開啟
            this.setBuyBonusIconInteractable(true);
        }
        else if (!GameStatus.isBuyBonusOn && GameStatus.isExtraBetOn) {
            //額外下注開啟
            this.setExtraBetToggleInteractable(true);
        }
        else if (!GameStatus.isBuyBonusOn && !GameStatus.isExtraBetOn) {
            // 兩者皆未開啟
            this.setBuyBonusBtnInteractable(true);
            this.setExtraBetToggleInteractable(true);
        }
        else {
            console.error(`出現未知狀態 isBuyBonusOn: ${GameStatus.isBuyBonusOn}, isExtraBetOn: ${GameStatus.isExtraBetOn}`);
        }
    }

    public setAllIconsActive(active: boolean): void {
        this.rootNode.active = active;
    }

    private onTipBGClick() {
        this.hideExtraBetTip();
    }

    public setBuyBonusIconBGInfo(opacity: number, color: Color): void {
        this.buyBonusIconBGOpacity.opacity = opacity;
        this.buyBonusIconBGOpacity.getComponent(Sprite).color = color;
    }

    public setBuyBonusBtnCustomSprite(
        normalSpriteBG: SpriteFrame,
        pressedSpriteBG: SpriteFrame,
        hoverSpriteBG: SpriteFrame,
        disabledSpriteBG: SpriteFrame,
        normalSpriteCrown: SpriteFrame,
        pressedSpriteCrown: SpriteFrame,
        hoverSpriteCrown: SpriteFrame,
        disabledSpriteCrown: SpriteFrame,
        textPath: string
    ) {
        let buttonComponents: Button[] = this.buyBonusBtn.getComponents(Button);
        let buttonBG = buttonComponents[1];
        let buttonCrown = buttonComponents[2];
        buttonBG.normalSprite = normalSpriteBG;
        buttonBG.pressedSprite = pressedSpriteBG;
        buttonBG.hoverSprite = hoverSpriteBG;
        buttonBG.disabledSprite = disabledSpriteBG;

        buttonCrown.normalSprite = normalSpriteCrown;
        buttonCrown.pressedSprite = pressedSpriteCrown;
        buttonCrown.hoverSprite = hoverSpriteCrown;
        buttonCrown.disabledSprite = disabledSpriteCrown;

        buttonBG.target.getComponent(Sprite).spriteFrame = normalSpriteBG;
        buttonCrown.target.getComponent(Sprite).spriteFrame = normalSpriteCrown;

        let textLocalization = this.buyBonusBtn.getComponent(LocalizationButton);
        textLocalization.resourcePath = textPath;
        textLocalization.updateLocalization();

    }

    public setExtraBetTipText(text: string): void {
        this.extraBetTipLabel.string = text;
    }
}
