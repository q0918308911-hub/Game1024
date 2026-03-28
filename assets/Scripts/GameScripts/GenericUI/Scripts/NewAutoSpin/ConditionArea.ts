import { _decorator, Node, Vec3 } from 'cc';
import { ConditionLine, ConditionLineData } from './ConditionLine';
import { ConditionContext } from './ConditionContext';
import { AutoSpinAreaBase } from './AutoSpinAreaBase';
import { KeyboardData } from './Enum/KeyboardData';
const { ccclass, property } = _decorator;

@ccclass('ConditionArea')
export class ConditionArea extends AutoSpinAreaBase {
    @property(Node)
    private conditionLinesRoot: Node = null;

    private conditionLines: ConditionLine[] = [];
    private _selectedLine: ConditionLine = null;

    public get selectedLine(): ConditionLine {
        return this._selectedLine;
    }

    public onShowKeyboardCallback: (conditionArea: ConditionArea) => void = null;

    public init(): void {
        this.conditionLinesRoot.children.forEach((child: Node) => {
            const conditionLine = child.getComponent(ConditionLine);
            conditionLine.init();
            conditionLine.onShowKeyboardCallback = this.onShowKeyboard.bind(this);
            this.conditionLines.push(conditionLine);
        });
    }

    /**
     * 檢查自訂物件資料是否有屬性符合區塊中任一停止條件
     * @param context 自訂物件資料，將判斷所需資料包裝成物件後傳入
     * @returns 
     */
    public isMeetsAnyStopCondition(context: ConditionContext): boolean {
        return this.conditionLines.some(conditionLine => conditionLine.isMeetsStopConditionWithChecked(context));
    }

    public getCustomData(): ConditionLineData[] {
        const conditionLinesData: ConditionLineData[] = [];
        this.conditionLines.forEach((conditionLine) => {
            conditionLinesData.push(conditionLine.getConditionLineData());
        });
        return conditionLinesData;
    }

    private onShowKeyboard(selectedLine: ConditionLine): void {
        this._selectedLine = selectedLine;
        this.onShowKeyboardCallback(this);
    }

    public disableConditionLines(shouldCloseConditionIndexes: number[]): void {
        this.conditionLines.forEach((conditionLine, index) => {
            if (shouldCloseConditionIndexes.includes(index)) {
                conditionLine.disableCheck();
            }
        });
    }
}


