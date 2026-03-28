import { _decorator, Button, CCInteger, Component, Node } from 'cc';
import { Utility } from '../../../../Utils/Core';
import { GenericSound } from '../../../Definition';
import { AudioManager } from '../../../../Utils/Audio';
import { AutoSpinAreaBase } from './AutoSpinAreaBase';
import { AutoSpinSelectButton } from './AutoSpinSelectButton';
const { ccclass, property } = _decorator;

@ccclass('ToggleGroupArea')
export class ToggleGroupArea extends AutoSpinAreaBase {
    @property({ type: Node })
    public toggleGroupRoot: Node = null;

    @property({ type: CCInteger, displayName: '預設選項 index' })
    private selectedID: number = 0;

    private toggleGroupBtns: Button[] = [];

    public init(): void {
        this.toggleGroupRoot.children.forEach((child: Node, index: number) => {
            const button = child.getComponent(Button);
            button.getComponent(AutoSpinSelectButton).init();
            Utility.addEventHandlerToButton(button.node, this, 'onToggleBtnClick', index.toString());
            this.toggleGroupBtns.push(button);
        });
        this.setSelectedBtn(this.selectedID);
    }

    private setSelectedBtn(id: number) {
        this.selectedID = id;
        for (let i = 0; i < this.toggleGroupBtns.length; i++) {
            this.toggleGroupBtns[i].getComponent(AutoSpinSelectButton).setNormalStatus();
        }
        this.toggleGroupBtns[this.selectedID = id].getComponent(AutoSpinSelectButton).setSelectedStatus();
    }

    private onToggleBtnClick = (event: Event, customEventData: string) => {
        AudioManager.instance.playGenericSound(GenericSound.Public_Choice);
        let id = parseInt(customEventData);
        this.setSelectedBtn(id);
    }

    public getCustomData(): number {
        return this.selectedID;
    }
}


