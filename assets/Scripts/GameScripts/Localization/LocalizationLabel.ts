import { _decorator, CCString, Component, Label, Node } from 'cc';
const { ccclass, property, requireComponent } = _decorator;


@ccclass('LocalizationLabel')
@requireComponent(Label)
export class LocalizationLabel extends Component {

    @property(CCString)
    key: string = '';

    private translate: Function = null;

    public updateLabel(t: Function): void {
        if (t) {
            this.translate = t;
        }
        this.key = this.key.trim();
        if (this.key) {
            if (this.translate) {
                this.getComponent(Label).string = this.translate(this.key);
                return;

            }
            console.error(`Node "${this.node.name}"  No translation function provided`);
            return;
        }
        console.error(`Node "${this.node.name}"  No content for language`);
    }
}


