import { _decorator, Canvas, EPSILON, Label, Node, Size, UITransform, view, Widget } from 'cc';
import { IWindowResize, ScreenAdapter } from '../Orientation';
import { Orientation } from '../../GameScripts/Definition';
import { BUILD, EDITOR, PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

type ResizeListener = (newSize: Size) => void;

@ccclass('AdaptWindowSize')
export class AdaptWindowSize extends IWindowResize {
    @property({ visible: true, editorOnly: true, readonly: true })
    private _description: string = 'Auto resize the node to fit the window size while window size changes.';

    @property({ visible: true, tooltip: '設定自適應拓展的最大範圍，0表示不限制' })
    public maxSize: Size = new Size(1400, 1400);

    protected _resizeListeners: ResizeListener[] = [];

    protected _uiTransform: UITransform | null = null;
    protected _canvasTransform: UITransform | null = null;
    protected _canvasHtmlElement: HTMLElement | null = null;

    start() {
        this._uiTransform = this.node.getComponent(UITransform);

        const canvas = this.getCanvasFromParentRecursively(this.node);
        if (canvas) {
            this._canvasTransform = canvas.getComponent(UITransform);
        } else {
            console.error('AdaptWindowSize: Canvas not found');
            return;
        }

        this._canvasHtmlElement = document.getElementById('GameCanvas');
    }

    /**
     * 註冊UITransform的ContentSize修改事件，會在ContentSize修改，所有Child的Widget updateAlignment後觸發
     * @param listener 註冊的事件
     */
    public addResizeListener(listener: ResizeListener): void {
        if (this._resizeListeners.indexOf(listener) === -1) {
            this._resizeListeners.push(listener);
        }
    }

    /**
     * 移除UITransform的ContentSize修改事件
     * @param listener 移除的事件
     */
    public removeResizeListener(listener: ResizeListener): void {
        if (!this._resizeListeners) {
            return;
        }

        const index = this._resizeListeners.indexOf(listener);
        if (index !== -1) {
            this._resizeListeners.splice(index, 1);
        }
    }

    public onEnable(): void {
        this.onWindowResize(ScreenAdapter.UI_Orientation);
    }

    public override onWindowResize(orientation: Orientation): void {
        this.scheduleOnce(() => {
            this.onResize(orientation);
        });
    }

    protected onResize(orientation: Orientation) {
        if (!this.node.activeInHierarchy) {
            return;
        }

        if (!this._uiTransform || !this._canvasTransform || !this._canvasHtmlElement) {
            console.error('AdaptWindowSize: UITransform or CanvasTransform or CanvasHtmlElement not found');
            return;
        }

        let actualWidth = this._canvasHtmlElement.clientWidth;
        let actualHeight = this._canvasHtmlElement.clientHeight;

        let preferredWidth = this._canvasHtmlElement.clientWidth;
        let preferredHeight = this._canvasHtmlElement.clientHeight;

        const viewSize = view.getVisibleSizeInPixel();
        if (orientation === Orientation.Landscape) {
            const actualAspectRatio = preferredWidth / preferredHeight;
            const canvasAspectRatio = this._canvasTransform.contentSize.width / this._canvasTransform.contentSize.height;
            if (EDITOR) {
                if (actualAspectRatio > canvasAspectRatio) {
                    actualWidth = preferredWidth / viewSize.width * this._canvasTransform.contentSize.width;
                    actualHeight = preferredHeight / viewSize.height * this._canvasTransform.contentSize.height;
                } else {
                    actualWidth = this._canvasTransform.contentSize.width * viewSize.height / preferredHeight;
                    actualHeight = this._canvasTransform.contentSize.height;
                }
            } else if (PREVIEW || BUILD) {
                if (actualAspectRatio > canvasAspectRatio) {
                    actualWidth = preferredWidth * this._canvasTransform.contentSize.height / preferredHeight;
                    actualHeight = this._canvasTransform.contentSize.height;
                } else {
                    actualWidth = this._canvasTransform.contentSize.width;
                    actualHeight = preferredHeight * this._canvasTransform.contentSize.width / preferredWidth;
                }
            }
        } else {
            const actualAspectRatio = preferredHeight / preferredWidth;
            const canvasAspectRatio = this._canvasTransform.contentSize.height / this._canvasTransform.contentSize.width;

            if (EDITOR) {
                if (actualAspectRatio < canvasAspectRatio) {
                    actualWidth = preferredWidth / viewSize.width * this._canvasTransform.contentSize.width;
                    actualHeight = preferredHeight / viewSize.height * this._canvasTransform.contentSize.height;
                } else {
                    actualWidth = this._canvasTransform.contentSize.width * viewSize.height / preferredHeight;
                    actualHeight = this._canvasTransform.contentSize.height;
                }
            } else if (PREVIEW || BUILD) {
                if (actualAspectRatio > canvasAspectRatio) {
                    actualWidth = this._canvasTransform.contentSize.width;
                    actualHeight = preferredHeight * this._canvasTransform.contentSize.width / preferredWidth;
                } else {
                    actualWidth = preferredWidth * this._canvasTransform.contentSize.height / preferredHeight;
                    actualHeight = this._canvasTransform.contentSize.height;
                }
            }
        }

        if (this.maxSize.width > 0 && actualWidth > this.maxSize.width) {
            actualWidth = this.maxSize.width;
        }
        if (this.maxSize.height > 0 && actualHeight > this.maxSize.height) {
            actualHeight = this.maxSize.height;
        }

        this._uiTransform.setContentSize(actualWidth, actualHeight);

        const widgets = this.node.getComponentsInChildren(Widget);
        for (let i = 0; i < widgets.length; i++) {
            widgets[i].updateAlignment();
        }

        for (let i = 0; i < this._resizeListeners.length; i++) {
            this._resizeListeners[i](new Size(actualWidth, actualHeight));
        }
    }

    /**
     * 遞迴向上尋找Canvas
     * @param node 
     * @returns 從node網上找第一個Canvas, 或是找不到Canvas時回傳null
     */
    protected getCanvasFromParentRecursively(node: Node): Canvas | null {
        let canvas = node.getComponent(Canvas);
        if (canvas) {
            return canvas;
        }

        if (node.parent) {
            return this.getCanvasFromParentRecursively(node.parent);
        }

        return null;
    }
}


