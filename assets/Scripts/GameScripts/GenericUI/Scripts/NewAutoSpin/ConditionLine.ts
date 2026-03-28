import { _decorator, Button, Component, Enum, Label, Node, Sprite, Toggle, Vec3 } from 'cc';
import { ConditionContext } from './ConditionContext';
import { Utility, StringExt } from '../../../../Utils/Core';
import { KeyboardData } from './Enum/KeyboardData';
import { GenericUIRes } from '../../Scripts/GenericUIRes';
import { AutoSpinSelectButton } from './AutoSpinSelectButton';
import { GenericSound } from '../../../Definition';
import { AudioManager } from 'db://assets/Scripts/Utils/Audio';
const { ccclass, property } = _decorator;

// 條件類型
export enum ConditionType {
    // 是否完全相等
    Equal,
    // 是否大於
    GreaterThan,
    // 是否大於等於
    GreaterThanOrEqualTo,
    // 是否小於
    LessThan,
    // 是否小於
    LessThanOrEqualTo,
    // 是否為 true
    IsTrue,
    // 是否為 false
    IsFalse,
}

export class ConditionLineData {
    public enable: boolean;
    public targetAttributeKey: string;
    public conditionType: ConditionType;
    public threshold: number | boolean;
}

@ccclass('ConditionLine')
export class ConditionLine extends Component {
    @property(Toggle)
    private checkbox: Toggle = null;

    @property(Node)
    public thresholdBtn: Node = null;

    @property(Label)
    private thresholdLabel: Label = null;

    @property({ displayName: '比較數值最大長度' })
    private thresholdMaxLength: number = 0;

    @property({ displayName: '比較數值顯示 × 前綴' })
    private addPrefixX: boolean = false;    // 預設不顯示 × 前綴

    @property({ displayName: '比較數值使用千分位分隔' })
    private useNumberComma: boolean = true; // 預設使用千分位分隔

    @property({ displayName: '比較屬性名稱' })
    private targeAttributeKey: string = '';

    @property({ type: Enum(ConditionType), displayName: '比較類型' })
    private conditionType: ConditionType = ConditionType.Equal;

    public onShowKeyboardCallback: (selectedLine: ConditionLine) => void = null;
    private pureString: string = '';

    private canShowKeyboard: boolean = true;

    public init(): void {
        Utility.addEventHandlerToToggle(this.checkbox.node, this, 'onCheckboxClick');
        Utility.addEventHandlerToButton(this.thresholdBtn, this, 'onThresholdBtnClick');

        if (this.isValidThresholdString()) {
            this.pureString = this.thresholdLabel.string;
        } else {
            this.pureString = '0';
        }
        this.setThresholdLabelString();
        this.checkbox.getComponent(AutoSpinSelectButton).setNormalStatus();
        this.thresholdBtn.getComponent(AutoSpinSelectButton).setNormalStatus();
    }

    private setThresholdLabelString(): void {
        let result = '';
        if (this.useNumberComma) {
            const dotChar = KeyboardData.KEY_DOT;
            const intergerPart = this.pureString.split(dotChar)[0];
            const decimalPart = this.pureString.split(dotChar)[1];
            const hasDot = this.pureString.includes(dotChar);
            const commaInterger = Number(intergerPart).numberComma();
            result = `${commaInterger}${hasDot ? dotChar : ''}${decimalPart || ''}`;
        } else {
            result = this.pureString;
        }

        this.thresholdLabel.string = this.addPrefixX ? `×${result}` : result;
    }

    private onCheckboxClick(): void {
        if (this.checkbox.isChecked) {
            this.checkbox.getComponent(AutoSpinSelectButton).setSelectedStatus();
            if (this.needShowKeyboard()) {
                this.showKeyboard();
            } else {
                AudioManager.instance.playGenericSound(GenericSound.Public_On);
            }
        } else {
            AudioManager.instance.playGenericSound(GenericSound.Public_Off);
            this.checkbox.getComponent(AutoSpinSelectButton).setNormalStatus();
        }
    }

    private needShowKeyboard(): boolean {
        return this.canShowKeyboard && this.conditionType !== ConditionType.IsTrue && this.conditionType !== ConditionType.IsFalse
    }

    private onThresholdBtnClick(): void {
        this.showKeyboard();
    }

    private showKeyboard(): void {
        this.thresholdBtn.getComponent(Button).transition = Button.Transition.NONE;
        this.thresholdBtn.getComponent(Sprite).spriteFrame = GenericUIRes.instance.autoFormBtnHold;
        this.onShowKeyboardCallback?.(this);
    }

    private isValidThresholdString(): boolean {
        const string = this.thresholdLabel.string;
        const toNumberResult = StringExt.ToNumber(string);
        const isValid = toNumberResult[0];
        const nonMinusNumber = toNumberResult[1] >= 0;
        return string.length > 0 && isValid && nonMinusNumber;
    }

    /**
     * 檢查自訂物件資料是否符合停止條件
     * @param context 自訂物件資料，將判斷所需資料包裝成物件後傳入
     * @returns 
     */
    public isMeetsStopConditionWithChecked(context: ConditionContext): boolean {
        return this.checkbox.isChecked && this.isMeetsStopCondition(context);
    }

    public isMeetsStopCondition(context: ConditionContext): boolean {
        const threshold = StringExt.ToNumber(this.pureString)[1];
        const target = context[this.targeAttributeKey];
        const evaluator = ConditionLine.Evaluator[this.conditionType];
        if (!evaluator) throw new Error(`Unknown operator: ${this.conditionType}`);
        return evaluator(target, threshold);
    }

    // 條件判斷式
    // target: 資料值，由外部傳入
    // threshold: 目標值，可在組件裡設定
    static Evaluator: Record<ConditionType, (target: any, threshold: any) => boolean> = {
        [ConditionType.Equal]: (target, threshold) => target === threshold,
        [ConditionType.GreaterThan]: (target, threshold) => target > threshold,
        [ConditionType.GreaterThanOrEqualTo]: (target, threshold) => target >= threshold,
        [ConditionType.LessThan]: (target, threshold) => target < threshold,
        [ConditionType.LessThanOrEqualTo]: (target, threshold) => target <= threshold,
        [ConditionType.IsTrue]: (target) => !!target,
        [ConditionType.IsFalse]: (target) => !target,
    };

    public getConditionLineData(): ConditionLineData {
        const conditionLineData = new ConditionLineData();
        conditionLineData.enable = this.checkbox.isChecked;
        conditionLineData.targetAttributeKey = this.targeAttributeKey;
        conditionLineData.conditionType = this.conditionType;
        if (this.conditionType === ConditionType.IsTrue) {
            conditionLineData.threshold = true;
        } else if (this.conditionType === ConditionType.IsFalse) {
            conditionLineData.threshold = false;
        } else {
            conditionLineData.threshold = StringExt.ToNumber(this.pureString)[1];
        }
        return conditionLineData;
    }

    public onKeyboardBtnClick(customData: KeyboardData): void {
        const numberDigit = this.pureString.match(/\d/g)?.length || 0;
        if (customData === KeyboardData.KEY_DELETE) {
            if (this.pureString.length > 0) {
                this.pureString = this.pureString.slice(0, -1);
            }
            if (this.pureString.length === 0) {
                this.pureString = '0';
            }
        } else if (numberDigit < this.thresholdMaxLength) {
            const dotChar = KeyboardData.KEY_DOT;
            if (customData === dotChar) {
                if (!this.pureString.includes(dotChar)) {
                    this.pureString += dotChar;
                }
            } else if (this.pureString === '0') {
                this.pureString = customData;
            }
            else {
                this.pureString += customData;
            }
        }
        this.setThresholdLabelString();
    }

    public isThresholdMaxLength(): boolean {
        const numberDigit = this.pureString.match(/\d/g)?.length || 0;
        return numberDigit >= this.thresholdMaxLength;
    }

    public onKeyboardFinishClick(): void {
        this.thresholdBtn.getComponent(Button).transition = Button.Transition.SPRITE;
        this.thresholdBtn.getComponent(Sprite).spriteFrame = GenericUIRes.instance.autoFormBtnNormal;
        // 小數點號結尾時移除掉小數點
        if (this.pureString.endsWith(KeyboardData.KEY_DOT)) {
            this.pureString = this.pureString.slice(0, -1);
            this.setThresholdLabelString();
        }
    }

    public enableCheckWhenValidInput(): void {
        // 輸入框有數字時自動勾選
        if (this.pureString !== '0') {
            this.canShowKeyboard = false;
            this.checkbox.isChecked = true; // 會觸發 onCheckboxClick 事件
            this.canShowKeyboard = true;
        }
    }

    public disableCheck(): void {
        this.checkbox.isChecked = false;
    }

    public getThresholdLabelWorldPosition(): Vec3 {
        return this.thresholdBtn.getWorldPosition();
    }
}