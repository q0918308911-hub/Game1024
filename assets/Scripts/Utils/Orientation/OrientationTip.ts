import { _decorator, Component, Node, sys, screen, CCBoolean, director, } from 'cc';
import { GameSetting, OrientationMode } from '../../GameScripts/Definition';
import { WebViewH5 } from '../WebView';

const { ccclass, property } = _decorator;

@ccclass('OrientationTip')
export class OrientationTip extends Component {
    @property(CCBoolean)
    private isStartScene: boolean = false;

    @property(Node)
    private tipToPortrait: Node;

    @property(Node)
    private tipToLandscape: Node;

    @property({ type: WebViewH5, readonly: true })
    private webviewList: WebViewH5[] = [];


    private webviewActiveMap: Map<WebViewH5, boolean> = new Map(); //紀錄上一個狀態
    private lastOrientation: OrientationMode = OrientationMode.Landscape;

    init(orientationMode: OrientationMode = OrientationMode.Both): void {
        if (orientationMode !== OrientationMode.Both) {
            if (sys.isMobile) {
                this.node.active = true;
            }
            else {
                this.node.active = false;
            }

            if (!this.isStartScene) {
                this.webviewInit();
            }
        }
        else {
            console.error("OrientationMode 為 Both 時，不該使用 OrientationTip");
        }
    }

    /**
     * 變更螢幕方向時會檢查
     * @param orientationMode 當前鎖定的螢幕方向 EX: 鎖橫屏的話，這個參數就都是 Landscape
     */
    public checkOrientation(orientationMode: OrientationMode): void {
        let currentOrientation = this.checkCurrentOrientation(); //當前的螢幕方向
        let isChange = this.isChangeOrientation(currentOrientation);

        if (orientationMode === OrientationMode.Landscape) {
            this.tipToPortrait.active = false;
            if (currentOrientation === OrientationMode.Portrait) {
                this.tipToLandscape.active = true;
                this.setWebviewActive(false, isChange);
                if (sys.isMobile) {
                    GameSetting.keyboardLock = true; //鎖定鍵盤輸入
                }

            }
            else {
                this.tipToLandscape.active = false;
                this.setWebviewActive(true);
                if (sys.isMobile) {
                    GameSetting.keyboardLock = false; //鎖定鍵盤輸入
                }
            }
        }
        else if (orientationMode === OrientationMode.Portrait) {
            this.tipToLandscape.active = false;

            if (currentOrientation === OrientationMode.Landscape) {
                this.tipToPortrait.active = true;
                this.setWebviewActive(false, isChange);
                if (sys.isMobile) {
                    GameSetting.keyboardLock = true; //鎖定鍵盤輸入
                }
            }
            else {
                this.tipToPortrait.active = false;
                this.setWebviewActive(true);
                if (sys.isMobile) {
                    GameSetting.keyboardLock = false; //鎖定鍵盤輸入
                }
            }
        }
    }

    protected webviewInit(): void {
        if (!sys.isMobile) {
            return;
        }

        this.webviewList = director.getScene().getComponentsInChildren(WebViewH5);

        this.webviewList.forEach((webview: WebViewH5) => {
            this.webviewActiveMap.set(webview, true);
        });
    }

    protected checkCurrentOrientation(): OrientationMode {
        if (screen.windowSize.width >= screen.windowSize.height) {
            return OrientationMode.Landscape;
        }
        else {
            return OrientationMode.Portrait;
        }
    }

    protected isChangeOrientation(currentOrientation: OrientationMode): boolean {
        let isChange: boolean = this.lastOrientation !== currentOrientation;

        if (isChange) {
            this.lastOrientation = currentOrientation;
        }

        return isChange;
    }

    protected setWebviewActive(isActive: boolean, isChange: boolean = false): void {
        if (!sys.isMobile) {
            return;
        }

        if (isActive) {
            this.webviewList.forEach((webview: WebViewH5) => {
                webview.enabled = this.webviewActiveMap.get(webview);
            });
        }
        else {
            this.webviewList.forEach((webview: WebViewH5) => {
                if (isChange) { //因為在editor執行會觸發window resize以及 change orientation 事件，有變更螢幕方向才要記錄上一個狀態
                    this.webviewActiveMap.set(webview, webview.enabled);
                }
                webview.enabled = false;
            });
        }
    }
}