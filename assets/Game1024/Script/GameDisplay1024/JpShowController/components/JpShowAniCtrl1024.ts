import { _decorator, Component, Node, Label, CCFloat, AnimationState } from 'cc';
import { BasicAllJpUIBoard } from '../../../ReferencePath';

const { ccclass, property } = _decorator;

@ccclass('JpShowAniCtrl1024')
export class JpShowAniCtrl1024 extends BasicAllJpUIBoard {

    @property({ type: Node, visible: true, displayName: '大獎數字節點', tooltip: '大獎數字節點' })
    private _jackpotNumberNode: Node = null;

    private _labelNumber: Label = null;
    private _winMoney: number = 0;
    private _frameEventCallBack: () => void = null;

    get frameEventCallBack(): () => void {
        return this._frameEventCallBack;
    }
    set frameEventCallBack(value: () => void) {
        this._frameEventCallBack = value;
    }

    get _jackpotNumber(): number {
        return this._winMoney;
    }

    get labelNumber(): Label {
        return this._labelNumber;
    }

    public override init(): void {
        super.init();
        if (this._jackpotNumberNode) {
            this._labelNumber = this._jackpotNumberNode.getComponent(Label);
        }
        this._winMoney = 0;
        //this.node.active = false;

    }

    public setJpNumber(value: number): void {
        this._winMoney = value;
        if (this._labelNumber) {
            this._labelNumber.string = this._winMoney.numberComma();
        }
    }










}


