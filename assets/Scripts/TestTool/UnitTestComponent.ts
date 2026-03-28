import { _decorator, Component, Node } from 'cc';
import { TestScriptUnit } from './TestScriptUnit';
const { ccclass, property } = _decorator;

@ccclass('UnitTestComponent')
export class UnitTestComponent extends Component {
    @property({ type: [TestScriptUnit], readonly: true, serializable: false })
    private testScriptUnits: TestScriptUnit[] = [];

    protected onLoad(): void {
        this.testScriptUnits.length = 0;
        const components = this.node.components.filter((component) => component !== this);
        components.forEach((component) => {
            /*
             * constructor 會因為序列化一直被觸發 所以只能做額外 assign
             * 潛在問題: 序列化不斷創建物件 (根據 constructor 一直被觸發) 可能造成 memory leak
             * 但如果不把這個腳本掛到場景上就沒事
            */
            const newUnit = new TestScriptUnit();
            newUnit.targetComponent = component;
            this.testScriptUnits.push(newUnit);
        });
    }
}


