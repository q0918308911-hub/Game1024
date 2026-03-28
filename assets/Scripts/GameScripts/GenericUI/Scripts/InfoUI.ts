import { _decorator, Button, Component, Label, Node, UIOpacity, UITransform, Widget } from 'cc';
import { WebViewH5 } from '../../../Utils/WebView';
import { Utility } from '../../../Utils/Core';
import { RotationResize, ScreenAdapter } from '../../../Utils/Orientation';
import { GenericSound, Orientation } from '../../Definition';
import { AudioManager } from '../../../Utils/Audio';
const { ccclass, property } = _decorator;

export enum InfoType {
    Rule,
    PayTable,
}


@ccclass('InfoUI')
export class InfoUI extends Component {

    @property(Node)
    private bg: Node;

    @property(Node)
    private title: Node;

    @property(Node)
    private line: Node;

    @property(Node)
    private closeBtn: Node;

    @property(Node)
    private webviewRoot: Node;

    @property(Node)
    private webviewRule: Node;

    @property(Node)
    private webviewPayTable: Node;

    @property(Node)
    private bgBtn: Node;

    private currentWebview: Node;

    private isLock: boolean = false;

    private ruleHTML: string = '';
    private payTableHTML: string = '';

    private isLoadRuleReady: boolean = false;
    private isLoadPayTableReady: boolean = false;

    public onBGBtnClickCallback: () => void = null;

    init() {
        this.hideUI();
        Utility.addEventHandlerToButton(this.closeBtn, this, 'onCloseBtnClick');
        Utility.addEventHandlerToButton(this.bgBtn, this, 'onBGBtnClick');
        this.getComponent(RotationResize).onRotationResize = this.onRotationResize.bind(this);

    }

    showUI(infoType: InfoType) {
        this.onRotationResize(ScreenAdapter.UI_Orientation);
        if (this.isLock) {
            return;
        }

        this.webviewRule.setActive(false);
        this.webviewPayTable.setActive(false);
        this.node.setActive(true);
        let targetWebview: Node = null;
        if (infoType === InfoType.Rule) {
            targetWebview = this.webviewRule;
        }
        else if (infoType === InfoType.PayTable) {
            targetWebview = this.webviewPayTable;
        }

        targetWebview.setActive(true);
        this.currentWebview = targetWebview;
        this.currentWebview.getComponent(WebViewH5).scrollToTop();
    }

    public hideUI() {
        if (this.getComponent(UIOpacity).opacity === 0) {
            return;
        }

        this.node.setActive(false);
        this.closeBtn.getComponent(Button).resetStatus();

    }

    private onCloseBtnClick = () => {
        AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        this.hideUI();
    }

    public setTitle(title: string) {
        this.title.getComponent(Label).string = title;
    }

    private onRotationResize(orientation: Orientation) {
        if (orientation === Orientation.Landscape) {
            this.bg.getComponent(UITransform).setContentSize(950, 568);
            this.title.setPosition(0, 250);
            this.line.setPosition(0, 218);
            this.line.getComponent(UITransform).setContentSize(930, 2);
            this.closeBtn.setPosition(440, 250);
            this.setWebviewContentSize(925, 494);
        }
        else if (orientation === Orientation.Portrait) {
            this.bg.getComponent(UITransform).setContentSize(670, 750);
            this.title.setPosition(0, 337);
            this.line.setPosition(0, 308);
            this.line.getComponent(UITransform).setContentSize(650, 2);
            this.closeBtn.setPosition(300, 336);
            this.setWebviewContentSize(650, 672.5);
        }
    }

    public setWebviewContentSize(width: number, height: number) {
        this.webviewRoot?.getComponent(UITransform).setContentSize(width, height);
    }

    public setURL(infoType: InfoType, url: string) {
        let webviewNode: Node = null;
        if (infoType === InfoType.Rule) {
            webviewNode = this.webviewRule;
        }
        else if (infoType === InfoType.PayTable) {
            webviewNode = this.webviewPayTable;
        }

        let webview = webviewNode.getComponent(WebViewH5);
        webview.init();
        webviewNode.getComponent(Widget).enabled = true;
        webviewNode.getComponent(Widget).updateAlignment();
        webviewNode.getComponent(WebViewH5).setUrl(url);
    }

    private getLoadFlag(infoType: InfoType): boolean {
        if (infoType === InfoType.Rule) {
            return this.isLoadRuleReady;
        }
        else if (infoType === InfoType.PayTable) {
            return this.isLoadPayTableReady;
        }
    }

    private setLoadFlag(infoType: InfoType, b: boolean) {
        if (infoType === InfoType.Rule) {
            this.isLoadRuleReady = b;
        }
        else if (infoType === InfoType.PayTable) {
            this.isLoadPayTableReady = b;
        }
    }

    private onBGBtnClick() {
        this.onBGBtnClickCallback?.();
    }
}


