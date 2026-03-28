import { _decorator, Button, Color, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SimpleUI')
export class SimpleUI extends Component {
    @property(Button)
    private spinBtn: Button = null;

    @property(Button)
    private autoBtn: Button = null;

    @property(Button)
    private turboBtn: Button = null;

    public onSpinBtnClickCallback: () => void = null;
    public onAutoBtnClickCallback: () => void = null;
    public onTurboBtnClickCallback: () => void = null;
    public onStopBtnClickCallback: () => void = null;

    public isTurbo: boolean = false;
    public isAuto: boolean = false;
    private isAutoSpin: boolean = false;

    private _isSpin: boolean = false;

    private set isSpin(value: boolean) {
        this._isSpin = value;
        this.updateSpinBtnText();
    }

    public get isSpin(): boolean {
        return this._isSpin;
    }

    protected start(): void {
        this.spinBtn.node.on(Button.EventType.CLICK, this.onSpinBtnClick, this);
        this.autoBtn.node.on(Button.EventType.CLICK, this.onAutoBtnClick, this);
        this.turboBtn.node.on(Button.EventType.CLICK, this.onTurboBtnClick, this);

        this.updateSpinBtnText();
        this.updateAutoBtnColor();
        this.updateTurboBtnColor();
    }

    public setNormalMode(): void {
        this.isAutoSpin = false;
        this.isSpin = false;
        this.autoBtn.interactable = true;
    }

    private onSpinBtnClick(): void {
        if (this.isSpin || this.isAutoSpin) {
            this.isSpin = false;
            this.onStopBtnClickCallback?.();
            return;
        }

        this.onSpinBtnClickCallback?.();
        this.isSpin = true;
        this.autoBtn.interactable = false;
    }

    private onAutoBtnClick(): void {
        this.isAuto = !this.isAuto;
        if (this.isAuto) {
            this.isAutoSpin = true;
        }
        else {
            this.autoBtn.interactable = false;
        }
        this.updateSpinBtnText();
        this.updateAutoBtnColor();
        this.onAutoBtnClickCallback?.();
    }

    private onTurboBtnClick(): void {
        this.isTurbo = !this.isTurbo;
        this.updateTurboBtnColor();
        this.onTurboBtnClickCallback?.();
    }

    private updateSpinBtnText(): void {
        let str = this.isSpin || this.isAutoSpin ? 'Stop' : 'Spin';
        this.spinBtn.getComponentInChildren(Label).string = str;
    }

    private updateTurboBtnColor(): void {
        this.turboBtn.normalColor = this.isTurbo ? Color.RED : Color.WHITE;
        this.turboBtn.hoverColor = this.isTurbo ? Color.RED : Color.GRAY;
        this.turboBtn.pressedColor = this.isTurbo ? Color.RED : Color.WHITE;
        this.turboBtn.disabledColor = this.isTurbo ? Color.RED : Color.GRAY;
    }

    private updateAutoBtnColor(): void {
        this.autoBtn.normalColor = this.isAuto ? Color.RED : Color.WHITE;
        this.autoBtn.hoverColor = this.isAuto ? Color.RED : Color.GRAY;
        this.autoBtn.pressedColor = this.isAuto ? Color.RED : Color.WHITE;
        this.autoBtn.disabledColor = this.isAuto ? Color.RED : Color.GRAY;
    }
}


