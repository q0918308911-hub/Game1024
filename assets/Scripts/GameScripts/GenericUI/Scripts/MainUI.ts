import { _decorator, Button, Component, EventTouch, Label, Node, Sprite } from 'cc';
import { GenericUIRes } from './GenericUIRes';
import { MainUIBtnState } from './GenericUIConfig';
import { AUTO_INFINITY_NUMBER } from './GenericUIConfig';
import { Debug, Utility } from '../../../Utils/Core';
import { AudioManager } from '../../../Utils/Audio';
import { GenericSound } from '../../Definition';
import { ButtonKeyboardTrigger } from '../../../Utils/Tool';
const { ccclass, property } = _decorator;

export enum NewFlashModeEnum {
    None = 0,
    NewFlash1 = 1,
    NewFlash2 = 2,
}

@ccclass('MainUI')
export class MainUI extends Component {

    public onMainBGClickCallback: () => void = null;
    public onMenuBtnClickCallback: () => void = null;
    public onBetBtnClickCallback: () => void = null;
    public onAutoBtnClickCallback: () => void = null;
    public onStopAutoBtnClickCallback: () => void = null;
    public onSpinBtnClickCallback: () => void = null;
    public onStopBtnClickCallback: () => void = null;
    public onSpecialBtnClickCallback: () => void = null;
    public onNewFlashBtnSwitchCallback: (mode: NewFlashModeEnum) => void = null;

    public isStopBtnEnabled: boolean = true;

    // @property(Node)
    // private mainBGBtn: Node;

    @property(Node)
    private menuBtn: Node;

    @property(Node)
    private betBtn: Node;

    @property(Node)
    private newBetBtn: Node;

    @property(Node)
    private autoBtn: Node;

    @property(Node)
    private stopAutoBtn: Node;

    @property(Label)
    private autoCntLabel: Label;

    @property(Node)
    private spinBtnRoot: Node;

    @property(Node)
    private spinBtn: Node;

    @property(Node)
    private stopBtn: Node;

    @property(Node)
    private specialBtn: Node;

    @property(Sprite)
    private stopIcon: Sprite;

    @property(Sprite)
    private stopArrow: Sprite;

    @property(Node)
    private autoCntInfNode: Node;

    @property(Node)
    private flashBtn: Node;

    @property(Node)
    private newFlashBtn: Node;

    @property(Node)
    private flashBtnRoot: Node;

    @property(Node)
    private spinBtnDisabled: Node;

    @property(Node)
    private landscapeRightBtnGroup: Node;

    @property(Node)
    private buyFeatureLabelNode: Node;

    @property(Label)
    private buyFeatureLabel: Label;

    private screenBtn: Node;

    private isFlashOn: boolean = false;

    private newFlashMode: NewFlashModeEnum = NewFlashModeEnum.None;

    init() {
        Debug.Log("MainUI init");
        // Utility.addEventHandlerToButton(this.mainBGBtn, this, 'onMainBGBtnClick');
        Utility.addEventHandlerToButton(this.menuBtn, this, 'onMenuBtnClick');
        if (this.betBtn) {
            Utility.addEventHandlerToButton(this.betBtn, this, 'onBetBtnClick');
        }
        Utility.addEventHandlerToButton(this.autoBtn, this, 'onAutoBtnClick');
        Utility.addEventHandlerToButton(this.stopAutoBtn, this, 'onStopAutoBtnClick');
        Utility.addEventHandlerToButton(this.spinBtn, this, 'onSpinBtnClick');
        Utility.addEventHandlerToButton(this.stopBtn, this, 'onStopBtnClick');
        Utility.addEventHandlerToButton(this.flashBtn, this, 'onFlashBtnClick');

        Utility.addEventHandlerToButton(this.specialBtn, this, 'onSpecialBtnClick');
        if (this.newBetBtn) {
            Utility.addEventHandlerToButton(this.newBetBtn, this, 'onBetBtnClick');
        }
        if (this.newFlashBtn) {
            Utility.addEventHandlerToButton(this.newFlashBtn, this, 'onNewFlashBtnClick');
        }

        // input.on(Input.EventType.KEY_PRESSING, this.onKeyDownOrPressing, this);
        // input.on(Input.EventType.KEY_DOWN, this.onKeyDownOrPressing, this);
    }

    public setScreenBtnRoot(screenBtnRoot: Node) {
        if (this.screenBtn) {
            return;
        }

        this.screenBtn = screenBtnRoot.getComponentInChildren(Button).node;

        this.screenBtn.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);

        this.screenBtn.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.preventSwallow = true;
        }, this, true);

        Utility.addEventHandlerToButton(this.screenBtn, this, 'onStopBtnClick');
        this.screenBtn.setActive(false);
    }

    private onMainBGBtnClick() {
        this.onMainBGClickCallback?.();
    }

    private onMenuBtnClick() {
        this.onMenuBtnClickCallback?.();
    }

    private onBetBtnClick() {
        this.onBetBtnClickCallback?.();
    }

    private onAutoBtnClick() {
        this.onAutoBtnClickCallback?.();
    }

    private onStopAutoBtnClick() {
        this.onStopAutoBtnClickCallback?.();
    }

    private onSpinBtnClick(this: MainUI) {
        this.onSpinBtnClickCallback?.();
    }

    public setStopBtnEnabled() {
        this.isStopBtnEnabled = true;
    }

    private onStopBtnClick() {
        if (!this.isStopBtnEnabled) {
            return;
        }

        this.isStopBtnEnabled = false;
        this.onStopBtnClickCallback?.();
    }

    public forceClickStopBtn() {
        this.onStopBtnClick();
    }

    private onSpecialBtnClick() {
        this.onSpecialBtnClickCallback?.();
    }

    private onNewFlashBtnClick() {
        switch (this.newFlashMode) {
            case NewFlashModeEnum.None:
                AudioManager.instance.playGenericSound(GenericSound.Public_On);
                this.newFlashMode = NewFlashModeEnum.NewFlash1;
                this.newFlashBtn.getComponent(Button).normalSprite = GenericUIRes.instance.newFlash_1;
                this.newFlashBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.newFlash_1_hover;
                break;
            case NewFlashModeEnum.NewFlash1:
                AudioManager.instance.playGenericSound(GenericSound.Public_On);
                this.newFlashMode = NewFlashModeEnum.NewFlash2;
                this.newFlashBtn.getComponent(Button).normalSprite = GenericUIRes.instance.newFlash_2;
                this.newFlashBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.newFlash_2_hover;
                break;
            case NewFlashModeEnum.NewFlash2:
                AudioManager.instance.playGenericSound(GenericSound.Public_Off);
                this.newFlashMode = NewFlashModeEnum.None;
                this.newFlashBtn.getComponent(Button).normalSprite = GenericUIRes.instance.newFlash_0;
                this.newFlashBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.newFlash_0_hover;
                break;
            default:

                break;
        }
        this.onNewFlashBtnSwitchCallback?.(this.newFlashMode);
    }


    private onFlashBtnClick() {
        if (this.isFlashOn) {
            AudioManager.instance.playGenericSound(GenericSound.Public_Off);
            this.flashBtn.getComponent(Button).normalSprite = GenericUIRes.instance.flashOffSprite;
            this.flashBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.flashOffHover;
        }
        else {
            AudioManager.instance.playGenericSound(GenericSound.Public_On);
            this.flashBtn.getComponent(Button).normalSprite = GenericUIRes.instance.flashOnSprite;
            this.flashBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.flashOnSprite;
        }
        this.isFlashOn = !this.isFlashOn;
    }

    public setToSpinMode() {
        this.spinBtn.setActive(false);
        this.setStopBtnActive(true);
        // this.setStopBtnInteractable(true);
        // this.setScreenStopBtnInteractable(true);
        this.setAutoBtnState(MainUIBtnState.Disabled);
        this.setBetBtnState(MainUIBtnState.Disabled);
        this.menuBtn.getComponent(Button).interactable = false;

        this.isStopBtnEnabled = true;
    }

    public setToIdleMode() {
        this.spinBtn.setActive(true);
        this.setStopBtnActive(false);
        this.setAutoBtnState(MainUIBtnState.Normal);
        this.setBetBtnState(MainUIBtnState.Normal);
        this.menuBtn.getComponent(Button).interactable = true;
    }

    public openAutoMode() {
        this.stopAutoBtn.setActive(true);
        this.autoBtn.setActive(false);
    }

    public closeAutoMode() {
        this.stopAutoBtn.setActive(false);
        this.autoBtn.setActive(true);
    }

    public isTurboOn(): boolean {
        return (this.isFlashOn) || (this.newFlashMode !== NewFlashModeEnum.None);
    }

    public isTurbo2On(): boolean {
        return this.newFlashMode === NewFlashModeEnum.NewFlash2;
    }

    public setAutoBtnState(state: MainUIBtnState) {
        switch (state) {
            case MainUIBtnState.Normal:
                this.autoBtn.getComponentInChildren(Sprite).enabled = true;
                this.spinBtn.getComponentInChildren(Sprite).enabled = true;

                this.autoBtn.getComponent(Button).normalSprite = GenericUIRes.instance.autoBtnNormal;
                this.autoBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.autoBtnHover;
                this.autoBtn.getComponent(Button).interactable = true;
                break;
            case MainUIBtnState.UIOpen:
                this.autoBtn.getComponent(Button).normalSprite = GenericUIRes.instance.autoBtnUIOpen;
                this.autoBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.autoBtnUIOpen;
                this.autoBtn.getComponent(Button).interactable = true;
                break;
            case MainUIBtnState.Disabled:
                this.autoBtn.getComponent(Button).normalSprite = GenericUIRes.instance.autoBtnDisabled;
                this.autoBtn.getComponent(Button).interactable = false;
                break;
        }
    }

    public setAutoBtnForNewPanel() {
        this.autoBtn.getComponentInChildren(Sprite).enabled = false;
        this.spinBtn.getComponentInChildren(Sprite).enabled = false;
    }

    public setBetBtnState(state: MainUIBtnState) {
        switch (state) {
            case MainUIBtnState.Normal:
                if (this.betBtn) {
                    this.betBtn.getComponent(Button).normalSprite = GenericUIRes.instance.betBtnNormal;
                    this.betBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.betBtnHover;
                    this.betBtn.getComponent(Button).interactable = true;
                }
                if (this.newBetBtn) {
                    this.newBetBtn.getComponent(Button).normalSprite = GenericUIRes.instance.newBetBtnNormal;
                    this.newBetBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.newBetBtnHover;
                    this.newBetBtn.getComponent(Button).interactable = true;
                }
                break;
            case MainUIBtnState.UIOpen:
                if (this.betBtn) {
                    this.betBtn.getComponent(Button).normalSprite = GenericUIRes.instance.betBtnUIOpen;
                    this.betBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.betBtnUIOpen;
                    this.betBtn.getComponent(Button).interactable = true;
                }
                if (this.newBetBtn) {
                    this.newBetBtn.getComponent(Button).normalSprite = GenericUIRes.instance.newBetBtnUIOpen;
                    this.newBetBtn.getComponent(Button).hoverSprite = GenericUIRes.instance.newBetBtnUIOpen;
                    this.newBetBtn.getComponent(Button).interactable = true;
                }
                break;
            case MainUIBtnState.Disabled:
                if (this.betBtn) {
                    this.betBtn.getComponent(Button).normalSprite = GenericUIRes.instance.betBtnNormal;
                    this.betBtn.getComponent(Button).interactable = false;
                }
                if (this.newBetBtn) {
                    this.newBetBtn.getComponent(Button).normalSprite = GenericUIRes.instance.newBetBtnNormal;
                    this.newBetBtn.getComponent(Button).interactable = false;
                }
                break;
        }
    }

    public setAutoCntLabel(num: number) {
        if (num === AUTO_INFINITY_NUMBER) {
            this.autoCntLabel.string = '∞';
            this.autoCntLabel.node.setActive(false);
            this.autoCntInfNode.setActive(true);
        }
        else {
            this.autoCntLabel.string = `${num}`;
            this.autoCntLabel.node.setActive(true);
            this.autoCntInfNode.setActive(false);

        }
    }

    public setStopBtnActive(b: boolean) {
        this.stopBtn.setActive(b);
        this.screenBtn?.setActive(b);
    }

    public setBetSpinAutoBtnInteractable(b: boolean) {
        if (b) {
            this.setBetBtnState(MainUIBtnState.Normal);
            this.setAutoBtnState(MainUIBtnState.Normal);

        }
        else {
            this.setBetBtnState(MainUIBtnState.Disabled);
            this.setAutoBtnState(MainUIBtnState.Disabled);
        }
        this.setSpinBtnInteractable(b);
    }

    public setSpinBtnInteractable(b: boolean) {
        if (b) {
            this.spinBtn.active = true;
            this.spinBtnDisabled.active = false;
        }
        else {
            this.spinBtn.active = false;
            this.spinBtnDisabled.active = true;
        }
    }


    public setLandscapeRightBtnGroupVisible(b: boolean): void {
        if (b) {
            this.landscapeRightBtnGroup.setScale(1, 1);
        }
        else {
            this.landscapeRightBtnGroup.setScale(0, 0);
        }
    }

    public setMenuBtnActive(b: boolean): void {
        this.menuBtn.active = b;
    }

    /*
    public setMainBGActive(b: boolean): void {
        this.mainBGBtn.active = b;
    }
    */

    public setKeyboardLock(b: boolean): void {
        this.spinBtn.getComponent(ButtonKeyboardTrigger).setTriggerActive(!b);
        this.stopBtn.getComponent(ButtonKeyboardTrigger).setTriggerActive(!b);
    }

    public setSpinBtnActive(isActive: boolean): void {
        this.spinBtnRoot.setActive(isActive);
    }

    public setRightDownBtnActive(isActive: boolean): void {
        if (this.flashBtnRoot) {
            this.flashBtnRoot.setActive(isActive);
        }
    }

    public setAutoBtnActive(isActive: boolean): void {
        this.autoBtn.setActive(isActive);
    }

    public setTwoLevelTurboMode(isActive: boolean): void {
        if (!this.newFlashBtn) {
            return;
        }
        else {
            this.flashBtn.setActive(!isActive);
            this.newFlashBtn.setActive(isActive);
        }
    }

    public setBuyFeatureLabelActive(isActive: boolean): void {
        this.buyFeatureLabelNode.active = isActive;
    }

    public setBuyFeatureBet(bet: number): void {
        this.buyFeatureLabel.string = bet.fixed().numberComma();
    }
}


