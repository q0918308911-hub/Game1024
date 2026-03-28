import { _decorator, Animation, Button, color, Component, EventTouch, find, instantiate, Label, Node, Prefab, Vec3, view } from 'cc';
import { AutoSpinAreaBase, getCustomArea } from './AutoSpinAreaBase';
import { Utility } from '../../../../Utils/Core';
import { IWindowResize } from '../../../../Utils/Orientation';
import { AudioManager } from '../../../../Utils/Audio';
import { AutoSpinAreaType } from './Interface/IAutoSpinArea';
import { ToggleGroupArea } from './ToggleGroupArea';
import { ConditionContext } from './ConditionContext';
import { ConditionArea } from './ConditionArea';
import { KeyboardData } from './Enum/KeyboardData';
import { GameSetting, GenericSound, Orientation } from '../../../Definition';
import { AUTO_INFINITY_NUMBER } from '../GenericUIConfig';
import { ConditionLine } from './ConditionLine';

const { ccclass, property } = _decorator;

const AUTO_VALUE_LIST: number[] = [
    10, 50,
    100, 250, 500,
    750, 1000, AUTO_INFINITY_NUMBER
];
@ccclass('AutoSpinAreaUI')
export class AutoSpinAreaUI extends IWindowResize {
    @property(Node)
    private maskBG: Node;

    @property(Node)
    private closeBtn: Node;

    @property(Node)
    private startBtn: Node;

    @property(Node)
    private areaContentLayout: Node;

    @property(Animation)
    private spinBtnAnimation: Animation;

    @property(Animation)
    private startBtnAnimation: Animation;

    @property(Node)
    private keyboardRefNode: Node;

    @property(Node)
    private keyboardNode: Node;

    @property(Node)
    private keyboardBgBtn: Node;

    @property(Node)
    private keyboardBtnRootNode: Node;

    private autoSpinAmountArea: ToggleGroupArea = null;

    private customAreas: AutoSpinAreaBase[] = [];

    private selectedConditionArea: ConditionArea = null;

    public onStartBtnClickCallback: (autoTimes: number) => void = null;
    public onUIActiveChange: (active: boolean) => void = null;
    public checkConditionValid: (conditionLine: ConditionLine) => boolean = null;
    public onBGBtnClickCallback: () => void = null;

    init(areasPrefab: Prefab[] = []) {
        this.hideUI();
        Utility.addEventHandlerToButton(this.maskBG, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.closeBtn, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.startBtn, this, 'onStartBtnClick');
        Utility.addEventHandlerToButton(this.keyboardBgBtn, this, 'onKeyboardBgBtnClick');
        this.createAreas(areasPrefab);
        this.setKeyboardBtnEvent();

        this.keyboardRefNode.active = false;
    }

    showUI() {
        this.node.setActive(true);
        this.onUIActiveChange?.(true);
        const spinBtnState = this.spinBtnAnimation.getState('spinRotate');
        const startBtnState = this.startBtnAnimation.getState('spinRotate');
        startBtnState.setTime(spinBtnState.current);
    }

    hideUI() {
        if (!this.node.active) {
            return;
        }
        this.node.setActive(false);
        this.closeBtn.getComponent(Button).resetStatus();
        this.onUIActiveChange?.(false);
    }

    public onWindowResize(orientation: Orientation): void {
        this.calculateKeyboardPosition();
    }

    private onCloseBtnClick = () => {
        AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        this.hideUI();
    }

    private onStartBtnClick() {
        let autoTimes = 0;
        if (this.autoSpinAmountArea) {
            const autoSpinAmountSelectedID = this.autoSpinAmountArea.getCustomData();
            autoTimes = AUTO_VALUE_LIST[autoSpinAmountSelectedID];
        } else {
            autoTimes = AUTO_INFINITY_NUMBER;
        }
        this.onStartBtnClickCallback?.(autoTimes);
    }

    private onKeyboardBgBtnClick() {
        this.onKeyboardFinishClick();
    }

    private hideKeyboard() {
        this.setKeyboardDarkLabel(false);
        this.keyboardRefNode.active = false;
        this.selectedConditionArea = null;
    }

    private createAreas(customAreaPrefabs: Prefab[]): void {
        customAreaPrefabs.forEach((areaPrefab: Prefab) => {
            const areaNode = instantiate(areaPrefab);
            const area = getCustomArea(areaNode);
            area.init?.();
            if (this.autoSpinAmountArea === null && area.autoSpinAreaType === AutoSpinAreaType.Auto) {
                this.autoSpinAmountArea = (area as ToggleGroupArea);
            }
            if (area.autoSpinAreaType === AutoSpinAreaType.Condition) {
                (area as ConditionArea).onShowKeyboardCallback = this.showKeyboard.bind(this);
            }
            this.areaContentLayout.addChild(areaNode);
            this.customAreas.push(area);
        });
    }

    private setKeyboardBtnEvent(): void {
        this.setKeyDot();
        const keyboardDataList = [
            KeyboardData.KEY_0,
            KeyboardData.KEY_1,
            KeyboardData.KEY_2,
            KeyboardData.KEY_3,
            KeyboardData.KEY_4,
            KeyboardData.KEY_5,
            KeyboardData.KEY_6,
            KeyboardData.KEY_7,
            KeyboardData.KEY_8,
            KeyboardData.KEY_9,
            KeyboardData.KEY_DELETE,
            KeyboardData.KEY_DOT,
            KeyboardData.KEY_FINISH,
        ]
        const keyboardBtns = this.keyboardBtnRootNode.getComponentsInChildren(Button);
        keyboardBtns.forEach((btn, index) => {
            Utility.addEventHandlerToButton(btn.node, this, 'onKeyboardBtnClick', keyboardDataList[index]);
            if (keyboardDataList[index] === KeyboardData.KEY_DOT) {
                btn.node.getComponentInChildren(Label).string = KeyboardData.KEY_DOT;
            }
        });
    }

    private setKeyDot(): void {
        if (GameSetting.shouldSwapThousandAndDecimalSeparators) {
            (KeyboardData as any).KEY_DOT = ',';
        }
    }

    private showKeyboard(selectedConditionArea: ConditionArea): void {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.keyboardRefNode.active = true;
        this.selectedConditionArea = selectedConditionArea;
        this.calculateKeyboardPosition();
        const isDark = this.selectedConditionArea.selectedLine.isThresholdMaxLength();
        this.setKeyboardDarkLabel(isDark);
    }

    private calculateKeyboardPosition(): void {
        if (!this.selectedConditionArea) {
            return;
        }
        const worldPosition = this.selectedConditionArea.selectedLine.getThresholdLabelWorldPosition();
        const heightThreshold = (view.getDesignResolutionSize().height / 2) * 0.6;
        const realY = worldPosition.y < heightThreshold ? worldPosition.y + 100 : worldPosition.y - 100;
        this.keyboardNode.setWorldPosition(this.keyboardNode.worldPosition.x, realY, 0);
    }

    private onKeyboardBtnClick(event: EventTouch, customData: KeyboardData) {
        if (customData !== KeyboardData.KEY_FINISH) {
            AudioManager.instance.playGenericSound(GenericSound.Public_On);
            this.selectedConditionArea.selectedLine.onKeyboardBtnClick(customData);
            const isDark = this.selectedConditionArea.selectedLine.isThresholdMaxLength();
            this.setKeyboardDarkLabel(isDark);
        } else {
            this.onKeyboardFinishClick();
        }
    }

    private onKeyboardFinishClick(): void {
        this.selectedConditionArea.selectedLine.onKeyboardFinishClick();
        if (this.checkConditionValid?.(this.selectedConditionArea.selectedLine)) {
            this.selectedConditionArea.selectedLine.enableCheckWhenValidInput();
        } else {
            this.selectedConditionArea.selectedLine.disableCheck();
        }
        this.hideKeyboard();
    }

    private setKeyboardDarkLabel(isDark: boolean): void {
        const keyBoardLabels = this.keyboardBtnRootNode.getComponentsInChildren(Label);
        const lightness = isDark ? 127 : 255;
        keyBoardLabels.forEach((label) => {
            if (label.string && /^[0-9,.]$/.test(label.string)) {
                label.color = color(lightness, lightness, lightness);
            }
        });
    }

    /**
     * 獲取所有區塊的自訂資料
     * @returns 所有區塊自訂資料陣列 (按區塊順序排序)
     */
    public getAreasCustomData(): any[] {
        const autoSpinAreaSelections: any[] = [];
        this.customAreas.forEach((area: AutoSpinAreaBase) => {
            if (area.node.active) {
                const customData = area.getCustomData();
                autoSpinAreaSelections.push(customData);
            }
        });
        return autoSpinAreaSelections;
    }

    /**
     * 回傳自訂遊戲資料是否滿足任意一項自動停止條件
     * @param context 自訂資料物件
     * @returns true: 其中一項條件滿足 false: 所有條件都不滿足 
     */
    public isMeetsAnyStopCondition(context: ConditionContext): boolean {
        const conditionAreas = this.customAreas.filter((area): area is ConditionArea => area.autoSpinAreaType === AutoSpinAreaType.Condition);
        return conditionAreas.some((conditionArea) => conditionArea.isMeetsAnyStopCondition(context));
    }

    public disableConditionLines(autoAreaIndex: number, shouldCloseConditionIndexes: number[]): void {
        (this.customAreas[autoAreaIndex] as ConditionArea).disableConditionLines(shouldCloseConditionIndexes);
    }
}


