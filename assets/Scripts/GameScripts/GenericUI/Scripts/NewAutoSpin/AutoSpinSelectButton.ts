import { _decorator, Button, Color, Component, Label, Node, Sprite, Toggle } from 'cc';
import { GenericUIRes } from '../../Scripts/GenericUIRes';
import { AutoSpinSelectButtonIcon } from './AutoSpinSelectButtonIcon';
const { ccclass, property } = _decorator;

@ccclass('AutoSpinSelectButton')
export class AutoSpinSelectButton extends Component {
    @property({ type: Label })
    private label: Label = null;

    init() {

    }

    setLabel = (str: string) => {
        this.label.string = `${str}`;
    }

    setNormalStatus() {
        const buttonComponent = this.getComponent(Button) || this.getComponent(Toggle);
        buttonComponent.normalSprite = GenericUIRes.instance.autoFormBtnNormal;
        buttonComponent.hoverSprite = GenericUIRes.instance.autoFormBtnHover;
        buttonComponent.pressedSprite = GenericUIRes.instance.autoFormBtnNormal;
        buttonComponent.disabledSprite = GenericUIRes.instance.autoFormBtnNormal;
        let labels = this.getComponentsInChildren(Label);
        for (let item of labels) {
            item.color = new Color(206, 205, 205);
        }
        let buttonIcons = this.getComponentsInChildren(AutoSpinSelectButtonIcon);
        for (let item of buttonIcons) {
            item.setNormalStatus();
        }
    }

    setSelectedStatus() {
        const buttonComponent = this.getComponent(Button) || this.getComponent(Toggle);
        buttonComponent.normalSprite = GenericUIRes.instance.autoFormBtnSelected;
        buttonComponent.hoverSprite = GenericUIRes.instance.autoFormBtnSelected;
        buttonComponent.pressedSprite = GenericUIRes.instance.autoFormBtnSelected;
        buttonComponent.disabledSprite = GenericUIRes.instance.autoFormBtnNormal;

        let labels = this.getComponentsInChildren(Label);
        for (let item of labels) {
            item.color = Color.WHITE;
        }
        let buttonIcons = this.getComponentsInChildren(AutoSpinSelectButtonIcon);
        for (let item of buttonIcons) {
            item.setSelectedStatus();
        }
    }
}


