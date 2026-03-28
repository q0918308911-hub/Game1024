import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SymbolOpacityEffect')
export class SymbolOpacityEffect extends Component {

    @property({ type: UIOpacity, visible: true, displayName: 'symbol_Opacity', tooltip: 'symbol_Opacity' })
    private _targetOpacity: UIOpacity = null;

    @property({ type: Node, visible: true, displayName: 'targetNode', tooltip: 'targetNode' })
    private _targetNode: Node = null;

    get targetOpacity(): UIOpacity {
        return this._targetOpacity;
    }

    public closeContainerTween(t: number): void {
        if (!this._targetOpacity) return;
        tween(this._targetOpacity)
            .to(t, { opacity: 0 })
            .call(() => {
                this._targetOpacity.opacity = 255;
                this._targetNode.active = false;
            })
            .start();
    }

    public openContainerTween(t: number): void {

        if (!this._targetOpacity) return;

        if (!this._targetNode.active) {
            this._targetNode.active = true;
        }
        if (this._targetOpacity.opacity !== 0) {
            this._targetOpacity.opacity = 0;
        }

        tween(this._targetOpacity)
            .to(t, { opacity: 255 })
            .start();
    }

    public async openContainerTweenPromise(t: number): Promise<void> {

        if (!this._targetOpacity) return;
        this._targetNode.active = true;
        this._targetOpacity.opacity = 0;
        return new Promise<void>((resolve) => {
            tween(this._targetOpacity)
                .to(t, { opacity: 255 })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    public async closeContainerTweenPromise(t: number): Promise<void> {

        if (!this._targetOpacity) return;

        return new Promise<void>((resolve) => {
            tween(this._targetOpacity)
                .to(t, { opacity: 0 })
                .call(() => {
                    this._targetOpacity.opacity = 255;
                    this._targetNode.active = false;
                    resolve();
                })
                .start();
        });
    }

}


