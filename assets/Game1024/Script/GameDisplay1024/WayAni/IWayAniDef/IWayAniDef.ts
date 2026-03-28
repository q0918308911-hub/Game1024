import { _decorator, Component, Label } from "cc";
import { AnimationController } from "../../../ReferencePath";

export interface IWayAni {

    playWayAni(): void;
    goBackToDefault(): void;
    resetWayAni(): void;
    setScoreLabel(value: number): void;
    hideWayLabel(): void;
    showWayLabel(): void;
}

const { ccclass, property } = _decorator;
@ccclass('BasicWayAni')
export class BasicWayAni extends Component implements IWayAni {

    @property({ type: AnimationController, visible: true, displayName: "WayAniController", tooltip: "路數動畫控制器" })
    protected _wayAniController: AnimationController = null;

    @property({ type: Label, visible: true, displayName: "WayLabel", tooltip: "way數字Label" })
    protected _wayNumLabel: Label = null;
    protected _dirtyFirstOnLoad: boolean = false;
    protected _currentWayNum: number = 0;

    get currentWayNum(): number {
        return this._currentWayNum;
    }

    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;
        this.init();
    }

    public init(): void {

        if (!this._dirtyFirstOnLoad) return;
        this._wayAniController.init();
        this.reset();
    }

    public reset(): void {


        this._currentWayNum = 1;
        this.showWayLabel(); // 初始化分數顯示為0
        this.goBackToDefault();
    }

    //--這邊純數值運算就好
    public setScoreLabel(value: number): void {

        this._currentWayNum = value * this._currentWayNum;
        console.log('check_currentWayNum', this._currentWayNum, value);
    }

    public showWayLabel(): void {
        this._wayNumLabel.string = this._currentWayNum.numberComma();
    }

    public playWayAni(): void {
        console.log('BasicWayAni-playWayAni');
    }
    public goBackToDefault(): void {
        console.log('BasicWayAni-goBackToDefault');
    }
    public resetWayAni(): void {
        console.log('BasicWayAni-resetWayAni');
    }

    public hideWayLabel(): void {
        this._wayNumLabel.node.active = false;
    }
    public appearWayLabel(): void {
        this._wayNumLabel.node.active = true;
    }

    public isOpenVisible(): boolean {
        return this._wayNumLabel.node.active;
    }

    protected getStepTime(): number {
        return 0;
    }
}