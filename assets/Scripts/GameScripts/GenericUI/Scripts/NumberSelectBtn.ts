import { _decorator, Button, Color, Component, Label, Node } from 'cc';
import { GenericUIRes } from './GenericUIRes';
const { ccclass, property } = _decorator;

@ccclass('NumberSelectBtn')
export class NumberSelectBtn extends Component {

    @property({ type: Label })
    private label: Label = null;

    init() {

    }

    setLabel = (str: string) => {
        this.label.string = `${str}`;
    }

    setNormalStatus() {
        this.getComponent(Button).normalSprite = GenericUIRes.instance.fromBtnNormal;
        this.getComponent(Button).hoverSprite = GenericUIRes.instance.fromBtnHover;
        this.getComponent(Button).pressedSprite = GenericUIRes.instance.fromBtnNormal;
        this.getComponent(Button).disabledSprite = GenericUIRes.instance.fromBtnNormal;
        let labels = this.getComponentsInChildren(Label);
        for (let item of labels) {
            item.color = new Color(206, 205, 205);
        }
    }

    setSelectedStatus() {
        this.getComponent(Button).normalSprite = GenericUIRes.instance.fromBtnSelected;
        this.getComponent(Button).hoverSprite = GenericUIRes.instance.fromBtnSelected;
        this.getComponent(Button).pressedSprite = GenericUIRes.instance.fromBtnSelected;
        this.getComponent(Button).disabledSprite = GenericUIRes.instance.fromBtnNormal;

        let labels = this.getComponentsInChildren(Label);
        for (let item of labels) {
            item.color = Color.WHITE;
        }
    }
}


