import { _decorator, Component, Label, Node, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { AnimationController, AnimationStateType, ContainerWholeBehavior, IBkgDisplay } from '../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';

const { ccclass, property } = _decorator;

@ccclass('FGWinScoreAniCtrl')
export class FGWinScoreAniCtrl extends Component {

    @property({ type: AnimationController, visible: true, displayName: 'Animation Controller', tooltip: 'NG_Ani_BKG_Display' })
    private _animationController: AnimationController = null;

    @property({ type: Label, visible: true, displayName: 'Multiplier Label', tooltip: '顯示倍數的Label' })
    private _multiplierLabel: Label = null;


    private _dirtyFlag: boolean = false;
    private _currentMultiplier: number = 1;
    private _extraMultiplierString: string = 'X';
    private _initialized: boolean = false;
    private _opacity: UIOpacity = null;
    private _ogLabelPos: Vec3;//--原始位置


    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;

        //--確保完成初始化物件控制..
        // 雖然有 _initialized,but onLoad 保留自動初始化邏輯
        // 這樣就算沒被 Promise.all 管理的物件也能正常運作
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
        } else {
            this._animationController?.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
            });
        }
    }

    public init(): void {

        if (!this._dirtyFlag) return;
        this._opacity = this._animationController.node.getComponent(UIOpacity);
        this._ogLabelPos = this.node.getPosition().clone();
        this._animationController?.playAni(AnimationStateType.Default);
        this._initialized = true;
    }

    /**
    * 提供給 Manager 呼叫，確保三個物件都 ready
    */
    public async waitForReady(): Promise<void> {

        if (this._initialized) return;

        // 如果已經載入完成，直接 init 並回傳
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
            return;
        }

        // 否則，開啟一個 Promise 等待事件
        return new Promise<void>((resolve) => {
            this._animationController.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
                resolve();
            });
        });
    }

    //--註冊時間列表中
    public register(): void {

        /*
        const timeDataList = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList);
        this._mapAniTimeData = new Map<string, number>(
            [
                [ANIMATION_SCORE_TYPE.In, timeDataList.get(cfg => cfg.score?.in)],
                [ANIMATION_SCORE_TYPE.Out, timeDataList.get(cfg => cfg.score?.out)],
                [ANIMATION_SCORE_TYPE.Loop, timeDataList.get(cfg => cfg.score?.loop)]
            ]
        );
        console.log();
        */
    }

    //--取得需要表演的時間
    private getTime(): number {
        return 0.3;
    }


    public test(): void {
        this.setMultiplier(5);
        this._animationController?.playAni(AnimationStateType.Win);
    }

    public reset(): void {

        this.setMultiplier(0);
        this.node.setPosition(this._ogLabelPos);
        this._animationController?.playAni(AnimationStateType.Default);
    }


    public setMultiplier(multiplier: number): void {
        this._currentMultiplier = multiplier;
        if (this._multiplierLabel) {
            this._multiplierLabel.string = this._extraMultiplierString + this._currentMultiplier.toString();
        }
    }

    public moveMultiplierLabelToPosition(targetWorldPos: Vec3): void {

        if (!this.node.parent) return;

        // 【修正點 2】必須使用 parent 的 UITransform，因為 setPosition 是相對於 parent 的
        /*
        const parentTrans = this.node.parent.getComponent(UITransform)!;
        const localPos = parentTrans.convertToNodeSpaceAR(targetWorldPos);

        this.node.setPosition(localPos);
        */

        const uiTrans = this.node.getComponent(UITransform)!;
        const localPos = uiTrans.convertToNodeSpaceAR(targetWorldPos);
        this.node.setPosition(localPos);

    }

    public showMultiplier(frameEvtCallBack: (payLoad?: any) => void, multiplier?: number): void {
        if (multiplier !== undefined) {
            this.setMultiplier(multiplier);
        }
        this.node.active = true;
        this._animationController.playAniWithFrameEvtCallBack(
            async () => {
                //--收到事件
                console.log("FG Win Score Frame Event Triggered");
                frameEvtCallBack?.();
            },
            async () => {
                //--complete
                console.log();
            },
            false,
            { aniState: AnimationStateType.Win }
        );

    }

    public async fadeOut(): Promise<void> {

        return new Promise<void>((resolve) => {
            tween(this._opacity)
                .to(this.getTime(), { opacity: 0 })
                .call(() => {
                    this.node.active = false;
                    this._opacity.opacity = 255;
                    resolve();
                })
                .start();
        });
    }



    public forceToDefault(): void {
        this._animationController.goBackToDefault();
    }

    //--強制到最後一幀
    public forceToLastFrame(): void {
        this._animationController.gotoPlayLastFrame();
    }

    public stopShowMultiplier(): void {
        this._animationController?.playAni(AnimationStateType.Default);
    }

    public hideMultiplier(): void {
        this._animationController?.playAni(AnimationStateType.Default);
        this.node.active = false;
    }



}


