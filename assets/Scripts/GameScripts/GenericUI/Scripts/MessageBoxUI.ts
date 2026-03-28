import { _decorator, Component, director, Label, Node, UITransform } from 'cc';
import { WebViewH5 } from '../../../Utils/WebView';
import { Utility } from '../../../Utils/Core';
import { AudioManager } from '../../../Utils/Audio';
import { GenericSound } from '../../Definition';
const { ccclass, property } = _decorator;

@ccclass('MessageBoxUI')
export class MessageBoxUI extends Component {

    @property(Node)
    private closeBtn: Node;

    @property(Node)
    private confirmBtn: Node;

    @property(Label)
    private titleText: Label;

    @property(Label)
    private contentText: Label;

    private onCloseBtnClickCallback: Function = null;

    private onConfirmBtnClickCallback: Function = null;

    private isInit: boolean = false;

    private temporarilyHideWebviewList: WebViewH5[] = [];

    public init() {
        if (this.isInit) {
            return;
        }
        this.hideUI();
        Utility.addEventHandlerToButton(this.closeBtn, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.confirmBtn, this, 'onConfirmBtnClick');
        this.isInit = true;
    }

    public showUI(title: string, content: string, isShowConfirm: boolean, confirmCallback: Function = null, showCloseBtn: boolean = false, closeCallback: Function = null) {
        this.hideWebview();
        this.setCloseAndConfirmBtnActive(isShowConfirm)
        this.titleText.string = title;
        this.contentText.string = content;
        this.node.setActive(true);
        this.onConfirmBtnClickCallback = confirmCallback;
        this.onCloseBtnClickCallback = closeCallback;
        this.closeBtn.setActive(showCloseBtn);
    }

    public hideUI() {
        this.showWebview();
        this.node.setActive(false);
    }

    private onCloseBtnClick() {
        AudioManager.instance?.playGenericSound(GenericSound.Public_Off);
        this.hideUI();
        this.onCloseBtnClickCallback?.();
    }

    private onConfirmBtnClick() {
        AudioManager.instance?.playGenericSound(GenericSound.Public_Off);
        this.hideUI();
        this.onConfirmBtnClickCallback?.();
    }

    private setCloseAndConfirmBtnActive(active: boolean) {
        // this.closeBtn.setActive(active);
        this.confirmBtn.setActive(active);
        if (active) {
            this.contentText.getComponent(UITransform).setContentSize(380, 130);
        }
        else {
            this.contentText.getComponent(UITransform).setContentSize(380, 240);
        }
    }

    private hideWebview() {
        let webviews = director.getScene().getComponentsInChildren(WebViewH5);
        for (let item of webviews) {
            if (item.node.active) {
                item.node.setActive(false);
                this.temporarilyHideWebviewList.push(item);
            }
        }
    }

    private showWebview() {
        for (let item of this.temporarilyHideWebviewList) {
            item.node.setActive(true);
        }
        this.temporarilyHideWebviewList = [];
    }
}


