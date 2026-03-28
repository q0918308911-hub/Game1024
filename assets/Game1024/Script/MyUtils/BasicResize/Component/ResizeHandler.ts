import { Node, UITransform } from 'cc';
import { ResizeState, ResizeStateType, ResizeStateList } from '../Definitions/BasicResizeState';

export class ResizeHandler {

    protected _resizeActionMap: Partial<Record<ResizeStateType | string, (target: Node, currentContainer: Node | null, state?: ResizeState) => void>>;

    constructor() {
        this._resizeActionMap = {};
        this.initializeDefaultActions();
    }

    /**
     * 自己註冊啦...
     * @param resizeStateType The type of the resize state.
     * @param action The action to be executed when the resize state is triggered.
     */
    public registerAction(resizeStateType: ResizeStateType | string, action: (target: Node, currentContainer: Node | null, state?: ResizeState) => void): void {

        if (!this._resizeActionMap[resizeStateType]) {
            this._resizeActionMap[resizeStateType] = action;
        } else {
            console.warn(`Action for ${resizeStateType} is already registered.`);
        }
    }

    public initializeDefaultActions(): void {

        this._resizeActionMap[ResizeStateType.RESIZE] = (target) => this.doResize(target);
        this._resizeActionMap[ResizeStateType.SET_SCALE_TO_DEFAULT] = (target) => this.doSetScaleDefault(target);
        this._resizeActionMap[ResizeStateType.SET_SCALE_TO_SWITCH] = (target, container) => this.doSetScaleToSwitch(target, container);
        // ... 其他所有 do... 的方法都移到這裡 ...
        this._resizeActionMap[ResizeStateType.SET_UI_TRANSFORM_SWITCH_CONTAINER] = (target, container) => this.doSwitchUITransform(target, container);
        this._resizeActionMap[ResizeStateType.SET_UI_TRANSFORM_CUSTOM_CONTAINER] = (target, container, state) => this.doSetCustomUITransform(target, state!);
        this._resizeActionMap[ResizeStateType.DEFAULT] = () => { /* do nothing */ };
    }

    public applyMultiResize(target: Node, resizeStateList: ResizeStateList, currentContainer?: Node | null): void {

        for (const stateInfo of resizeStateList.stateInfo) {
            const action = this._resizeActionMap[stateInfo.resizeStateType];
            if (action) {
                // 傳入目標節點、當前容器和狀態資訊
                action(target, currentContainer, stateInfo);
            } else {
                this.doDefaultResize(target);
            }
        }
    }

    //=================<private/protected function>============================================================================================
    //--自己override..
    protected doChangeAnimation(target: Node): void {

    }
    //--自己override..
    protected doCustomProcess(target: Node): void {

    }

    protected doResize(target: Node): void {
        return;
    }
    //--自己override..
    protected doDefaultResize(target?: Node): void {
        //--do nothing
    }

    protected doSwitchUITransform(target: Node, currentContainer: Node | null): void {
        if (target && currentContainer) {
            // Perform UI transform on the target node
            const currentUITransform = currentContainer.getComponent(UITransform);
            if (currentUITransform) {
                const targetTransform = target.getComponent(UITransform);
                targetTransform.setContentSize(currentUITransform.contentSize.width, currentUITransform.contentSize.height);
            }
        }
    }

    protected doSetScaleToSwitch(target: Node, currentContainer: Node | null): void {
        if (target && currentContainer) {
            target.setScale(currentContainer.scale.x, currentContainer.scale.y, currentContainer.scale.z);
        }
    }

    protected doSetScaleDefault(target: Node): void {
        target?.setScale(1, 1, 1);
    }

    protected doSetPositionDefault(target: Node): void {
        target?.setPosition(0, 0, 0);
    }

    protected doSetPositionToSwitch(target: Node, currentContainer: Node | null): void {
        if (target && currentContainer) {
            target.setPosition(currentContainer.position);
        }
    }

    //--交換自定義的node的uiTransform
    protected doSetCustomUITransform(target: Node, custom: ResizeState): void {

        if (target) {
            // Perform UI transform on the target node
            const targetUITransform = custom.customChangeUITransformTarget.getComponent(UITransform);
            const contentSize = targetUITransform.contentSize;
            if (targetUITransform) {
                // Apply the desired UI transformation
                const targetTransform = target.getComponent(UITransform);
                targetTransform.setContentSize(contentSize.width, contentSize.height);
            }
        }
    }


}