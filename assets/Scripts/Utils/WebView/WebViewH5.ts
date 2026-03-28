import { _decorator, Component, Node, WebView } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WebViewH5')
export class WebViewH5 extends WebView {

    private _preloadExecuted: boolean = false;

    public init(): void {
        this.__preload();
        this.nativeWebView.parentElement.style.visibility = 'hidden';
    }

    public scrollToTop(): void {
        this.nativeWebView.contentWindow.postMessage('scrollToTop', '*');
    }

    override __preload(): void {
        if (this._preloadExecuted) {
            return;
        }
        super.__preload();
        this._preloadExecuted = true;
    }

    public setUrlToSrcdoc(url: string, onLoaded: () => void = null): void {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                this.nativeWebView.srcdoc = data;
                onLoaded?.();
            });
    }

    public setUrl(url: string, onLoaded: () => void = null): void {
        this.url = url;
        this.node.once(WebView.EventType.LOADED, () => {
            onLoaded?.();
        }, this)
    }
}


