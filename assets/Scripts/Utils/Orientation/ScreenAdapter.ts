import { _decorator, Component, ResolutionPolicy, screen, view, Camera, director, Enum, sys, game, error, Canvas } from 'cc';
import { RotationResize } from './RotationResize';
import { RotationContentResize } from './RotationContentResize';
import { EDITOR } from 'cc/env';
import { AutoOrientation } from './AutoOrientation';
import { IWindowResize } from './IWindowResize';
import { Debug } from '../Core';
import { OrientationTip } from './OrientationTip';
import { Orientation, OrientationMode } from '../../GameScripts/Definition';
const { ccclass, property } = _decorator;
const DESIGN_WIDTH: number = 1280;
const DESIGN_HEIGHT: number = 720;

enum ResolutionPolicyValue {
    EXACT_FIT = 0,
    NO_BORDER = 1,
    SHOW_ALL = 2,
    FIXED_HEIGHT = 3,
    FIXED_WIDTH = 4,
    UNKNOWN = 5,
}
@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {


    @property({ type: Enum(OrientationMode), tooltip: '設定螢幕方向' })
    public orientationMode: OrientationMode = OrientationMode.Both;
    public static UI_Orientation: Orientation = Orientation.Landscape;

    @property({ type: Enum(ResolutionPolicyValue), displayName: 'Landscape', tooltip: '橫版的自適配模式' })
    public landscapeResolutionPolicy: number = ResolutionPolicy.SHOW_ALL;

    @property({ type: Enum(ResolutionPolicyValue), displayName: 'Portrait', tooltip: '直版的自適配模式' })
    public portraitResolutionPolicy: number = ResolutionPolicy.SHOW_ALL;

    private autoOrientations: AutoOrientation[] = [];
    private cameras: Camera[] = [];
    private orientationTip: OrientationTip = null;

    start() {
        const canvasResizeEvent: string = 'canvas-resize';
        Debug.Log("ScreenAdapter start");
        screen.on("orientation-change", this.onOrientationChange, this);
        screen.on("window-resize", this.onWindowResize, this);
        this.autoOrientations = this.getComponentsInChildren(AutoOrientation);

        switch (this.orientationMode) {
            case OrientationMode.Landscape:
                view.setResolutionPolicy(this.landscapeResolutionPolicy);
                break;
            case OrientationMode.Portrait:
                view.setResolutionPolicy(this.portraitResolutionPolicy);
                break;
            case OrientationMode.Both:
            default:
                if (screen.windowSize.width >= screen.windowSize.height) {
                    view.setResolutionPolicy(this.landscapeResolutionPolicy);
                } else {
                    view.setResolutionPolicy(this.portraitResolutionPolicy);
                }
                break;
        }

        this.resetDesignResolution(screen.windowSize.width, screen.windowSize.height);
        view.emit(canvasResizeEvent); // 這行是為了讓畫面立即更新，因為3.8.4有一進入後canvas跑版的問題 3.8.5記得拿掉再試試看
        let canvases = director.getScene().getComponentsInChildren(Canvas);
        this.cameras = canvases.map((canvas) => canvas.cameraComponent);
        if (this.orientationMode !== OrientationMode.Both) {
            this.orientationTip = director.getScene().getComponentInChildren(OrientationTip)
            if (this.orientationTip) {
                this.orientationTip.init(this.orientationMode);
                this.orientationTip.checkOrientation(this.orientationMode);
            }
            else {
                console.error("OrientationTip not found");
            }
        }
    }

    protected onDestroy(): void {
        screen.off("orientation-change", this.onOrientationChange, this);
        screen.off("window-resize", this.onWindowResize, this);
    }

    public forceResize() {
        this.resetDesignResolution(screen.windowSize.width, screen.windowSize.height);
    }

    private resetDesignResolution(windowWidth: number, windowHeight: number) {

        switch (this.orientationMode) {
            case OrientationMode.Landscape:
                this.setToLandscape(windowWidth, windowHeight);
                break;
            case OrientationMode.Portrait:
                this.setToPortrait(windowWidth, windowHeight);
                break;
            case OrientationMode.Both:
            default:
                if (windowWidth >= windowHeight) {
                    this.setToLandscape(windowWidth, windowHeight);
                }
                else {
                    this.setToPortrait(windowWidth, windowHeight);
                }
                break;
        }


        let resizeComponents = director.getScene().getComponentsInChildren(RotationResize)
        for (let item of resizeComponents) {
            item.resetPosition(ScreenAdapter.UI_Orientation);
            item.onRotationResize?.(ScreenAdapter.UI_Orientation);
        }

        let resizeContent = director.getScene().getComponentsInChildren(RotationContentResize)
        for (let item of resizeContent) {
            item.onRotationResize(ScreenAdapter.UI_Orientation);
        }

        const windowResizeComponents = this.getComponentsInChildren(IWindowResize);
        for (let item of windowResizeComponents) {
            item.onWindowResize(ScreenAdapter.UI_Orientation);
        }

        for (let item of this.autoOrientations) {
            item.onResize(ScreenAdapter.UI_Orientation);
        }

        if (this.orientationTip) {
            this.orientationTip.checkOrientation(this.orientationMode);
        }

        if (EDITOR) {
            for (let camera of this.cameras) {
                camera.orthoHeight = view.getVisibleSize().height / 2;
            }
        }
    }

    private setToLandscape(windowWidth: number, windowHeight: number) {
        Debug.Log("橫版模式");
        if (ScreenAdapter.UI_Orientation === Orientation.Landscape) {
            return;
        }

        ScreenAdapter.UI_Orientation = Orientation.Landscape;
        // view.setOrientation(macro.ORIENTATION_LANDSCAPE); //手機瀏覽器打開這行反而會壞
        view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, this.landscapeResolutionPolicy);
    }

    private setToPortrait(windowWidth: number, windowHeight: number) {
        Debug.Log("直版模式");
        if (ScreenAdapter.UI_Orientation === Orientation.Portrait) {
            return;
        }
        ScreenAdapter.UI_Orientation = Orientation.Portrait;
        // view.setOrientation(macro.ORIENTATION_PORTRAIT); //手機瀏覽器打開這行反而會壞
        view.setDesignResolutionSize(DESIGN_HEIGHT, DESIGN_WIDTH, this.portraitResolutionPolicy);
    }

    private onWindowResize: () => void = () => {
        Debug.Log("onWindowResize");
        this.resetDesignResolution(screen.windowSize.width, screen.windowSize.height);
    }

    private onOrientationChange: () => void = () => {
        Debug.Log("onOrientationChange");
        this.resetDesignResolution(screen.windowSize.width, screen.windowSize.height);
    }

}

