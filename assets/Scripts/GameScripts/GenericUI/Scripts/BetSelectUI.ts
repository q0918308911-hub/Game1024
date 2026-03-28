import { _decorator, Button, Component, EventTouch, find, Node, UITransform } from 'cc';
import { NumberSelectBtn } from './NumberSelectBtn';
import { Utility } from '../../../Utils/Core';
import { AudioManager } from '../../../Utils/Audio';
import { GenericSound } from '../../Definition';
import { LocalizationLabel } from '../../Localization';

const { ccclass, property } = _decorator;
const BTN_LENGTH = 24;
@ccclass('BetSelectUI')
export class BetSelectUI extends Component {

    @property(Node)
    private maskBG: Node;

    @property(Node)
    private closeBtn: Node;

    @property(Node)
    private numberSelectBtnGroup: Node;

    @property(Node)
    private layoutNode: Node;

    @property(Node)
    private bgBtn: Node;

    @property(Node)
    private betTitle: Node;

    private numberSelectBtn: Button[] = new Array<Button>(24);

    public onBetSelectBtnClickCallback: (betValues: number) => void = null;
    public onUIActiveChange: (active: boolean) => void = null;
    private betValues: number[] = [];
    public onBGBtnClickCallback: () => void = null;


    private selectedID: number = 0;

    init() {
        this.hideUI();
        Utility.addEventHandlerToButton(this.maskBG, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.closeBtn, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.bgBtn, this, 'onBGBtnClick');
        // 按鈕的回呼只初始化一次
        for (let i = 0; i < BTN_LENGTH; i++) {
            this.numberSelectBtn[i] = find(`NumberSelectBtn_${i}`, this.layoutNode).getComponent(Button);
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).setNormalStatus();
            Utility.addEventHandlerToButton(this.numberSelectBtn[i].node, this, 'onBetSelectBtnClick', i.toString());
        }
        this.setSelectedBtn(this.selectedID);
    }

    public setInfos(betValues: number[]) {

        if (betValues.length === 0) {
            console.error('BetSelectUI: setBetValues: betValues is empty.');
        }

        this.betValues = betValues;

        for (let i = 0; i < BTN_LENGTH; i++) {
            this.numberSelectBtn[i].node.active = false;
        }

        for (let i = 0; i < this.betValues.length; i++) {
            if (i >= BTN_LENGTH) {
                console.error(`BetSelectUI: setBetValues: betValues length is ${this.betValues.length}, but only ${BTN_LENGTH} buttons are available.`);
                break;
            }
            this.numberSelectBtn[i].node.active = true;
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).init();
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).setLabel(this.betValues[i].numberComma());
        }
    }

    public setSelectedBtn(id: number) {
        this.selectedID = id;
        for (let i = 0; i < this.betValues.length; i++) {
            this.numberSelectBtn[i].getComponent(NumberSelectBtn).setNormalStatus();
        }
        this.numberSelectBtn[this.selectedID = id].getComponent(NumberSelectBtn).setSelectedStatus();
    }

    showUI() {
        let activeCnt = this.numberSelectBtn.filter(v => v.node.active).length;

        // 如果24個按鈕，就縮小按鈕高度從70到60
        let btnHeight = 70;
        if (activeCnt > 21) {
            btnHeight = 60;
        }
        for (let item of this.numberSelectBtn) {
            item.getComponent(UITransform).height = btnHeight;
        }

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

    private onBetSelectBtnClick(event: EventTouch, customEventData: string) {
        AudioManager.instance.playGenericSound(GenericSound.Public_Choice);
        let id = parseInt(customEventData);
        this.setSelectedBtn(id);
        this.hideUI();
        this.onBetSelectBtnClickCallback?.(this.betValues[id]);
    }

    private onBGBtnClick() {
        this.onBGBtnClickCallback?.();
    }

    public setBetTitleLocalizationKey(key: string) {
        this.betTitle.getComponent(LocalizationLabel).key = key;
    }

    public getSelectedBetValue(): number {
        return this.betValues[this.selectedID];
    }
}


