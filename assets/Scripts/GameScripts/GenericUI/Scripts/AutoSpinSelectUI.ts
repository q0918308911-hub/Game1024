import { _decorator, Button, Component, find, Node } from 'cc';
import { ConditionContext } from '../Scripts/NewAutoSpin/ConditionContext';
import { Utility } from "../../../Utils/Core";
import { NumberSelectBtn } from './NumberSelectBtn';
import { AudioManager } from '../../../Utils/Audio';
import { GenericSound } from '../../Definition';
import { AUTO_INFINITY_NUMBER } from './GenericUIConfig';
import { ConditionLine } from './NewAutoSpin';

const { ccclass, property } = _decorator;
const AUTO_VALUE_LIST: number[] = [
    10, 25, 50,
    100, 250, 500,
    750, 1000, AUTO_INFINITY_NUMBER
];

const AUTO_VALUE_LENGTH = 9;

@ccclass('AutoSpinSelectUI')
export class AutoSpinSelectUI extends Component {

    @property(Node)
    private maskBG: Node;

    @property(Node)
    private closeBtn: Node;

    @property(Node)
    private startBtn: Node;

    @property(Node)
    private bgBtn: Node;

    @property(Node)
    private numberSelectBtnGroup: Node;
    private numberSelectBtn: Button[] = new Array<Button>(9);
    private selectedID: number = 8;

    public onStartBtnClickCallback: (autoTimes: number) => void = null;
    public onUIActiveChange: (active: boolean) => void = null;
    public checkConditionValid: (conditionLine: ConditionLine) => void = null;
    public onBGBtnClickCallback: () => void = null;


    init() {
        this.hideUI();
        Utility.addEventHandlerToButton(this.maskBG, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.closeBtn, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.startBtn, this, 'onStartBtnClick');
        Utility.addEventHandlerToButton(this.bgBtn, this, 'onBGBtnClick');
        for (let i = 0; i < AUTO_VALUE_LENGTH; i++) {
            this.numberSelectBtn[i] = find(`NumberSelectBtn_${i}`, this.numberSelectBtnGroup).getComponent(Button);
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).init();
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).setLabel(AUTO_VALUE_LIST[i].toString());
            Utility.addEventHandlerToButton(this.numberSelectBtn[i].node, this, 'onAutoSelectBtnClick', i.toString());
        }
        this.setSelectedBtn(this.selectedID);
    }

    setSelectedBtn(id: number) {
        this.selectedID = id;
        for (let i = 0; i < AUTO_VALUE_LENGTH; i++) {
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).setNormalStatus();
        }
        this.numberSelectBtn[this.selectedID = id].getComponent(NumberSelectBtn).setSelectedStatus();
    }

    showUI() {
        this.node.setActive(true);
        this.onUIActiveChange?.(true);
    }

    hideUI() {
        if (!this.node.active) {
            return;
        }
        this.node.setActive(false);
        this.closeBtn.getComponent(Button).resetStatus();
        this.onUIActiveChange?.(false);
    }

    private onCloseBtnClick = () => {
        AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        this.hideUI();
    }

    private onAutoSelectBtnClick = (event: Event, customEventData: string) => {
        AudioManager.instance.playGenericSound(GenericSound.Public_Choice);
        let id = parseInt(customEventData);
        this.setSelectedBtn(id);
    }

    private onStartBtnClick() {
        this.onStartBtnClickCallback?.(AUTO_VALUE_LIST[this.selectedID]);
    }

    private onBGBtnClick() {
        this.onBGBtnClickCallback?.();
    }

    // 下面三個是偽方法 給 GenericUI 的 AutoSpinUI 使用
    // 當初為了容舊 讓 AutoSpinUI 的型別可以是 AutoSpinSelectUI | AutoSpinAreaUI 其中一個
    // 所以 AutoSpinSelectUI 需要有這些方法

    public isMeetsAnyStopCondition(context: ConditionContext): boolean {
        return false;
    }

    public getAreasCustomData(): any[] {
        return [];
    }

    public disableConditionLines(): void {

    }
}


