import { _decorator, Button, Component, EventTouch, instantiate, Label, Node } from 'cc';
import { Utility } from '../../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('GameRecordDropdownMenu')
export class GameRecordDropdownMenu extends Component {
    @property(Button)
    private mainButton: Button;

    @property(Label)
    private mainButtonLabel: Label;

    @property(Node)
    private scrollNode: Node;

    @property(Button)
    private ngButton: Button;

    @property(Button)
    private fgButton: Button;

    @property(Button)
    private fgButtonList: Button[] = [];

    @property(Node)
    private contentRoot: Node;

    public onNGBtnClickCallback: Function = null;
    public onFGBtnClickCallback: (id: number) => void = null;

    public init(fgAmount: number) {
        for (let i = 0; i < fgAmount; i++) {
            this.generateFGBtn();
        }
        Utility.addEventHandlerToButton(this.mainButton.node, this, 'onMainBtnClick');
        Utility.addEventHandlerToButton(this.ngButton.node, this, 'onNGBtnClick');
    }

    private generateFGBtn() {
        let id = this.fgButtonList.length;
        let newFGBtn = instantiate(this.fgButton.node);
        newFGBtn.setParent(this.contentRoot);
        newFGBtn.setActive(true);
        newFGBtn.name = 'FG_' + (id + 1);
        newFGBtn.getComponentInChildren(Label).string = newFGBtn.name;
        this.fgButtonList.push(newFGBtn.getComponent(Button));
        Utility.addEventHandlerToButton(newFGBtn, this, 'onFGBtnClick', id.toString());
    }

    private onNGBtnClick() {
        this.scrollNode.active = false;
        this.mainButtonLabel.string = 'NG';
        this.onNGBtnClickCallback?.();

    }

    private onFGBtnClick(event: EventTouch, customEventData: string) {
        this.scrollNode.active = false;
        let id = parseInt(customEventData);
        this.mainButtonLabel.string = `FG_${id + 1}`;
        this.onFGBtnClickCallback?.(id);

    }

    public onMainBtnClick() {
        this.scrollNode.active = !this.scrollNode.active;
    }
}


