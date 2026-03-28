import { _decorator, Component, Label, Node, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { AnimationController, AnimationStateType, ContainerWholeBehavior, IBkgDisplay } from '../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';

const { ccclass, property } = _decorator;

@ccclass('FGWinExplodeAniCtrl')
export class FGWinExplodeAniCtrl extends Component {

    @property({ type: AnimationController, visible: true, displayName: 'Animation Controller', tooltip: 'NG_Ani_BKG_Display' })
    private _animationController: AnimationController = null;
    private _dirtyFlag: boolean = false;
    private _opacity: UIOpacity = null;

    private _initialized: boolean = false;


    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;

        //--確保完成初始化物件控制..
        // 雖然有 _initialized,but onLoad 保留自動初始化邏輯是好習慣
        // 這樣就算沒被 Promise.all 管理的物件也能正常運作
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
        } else {
            this._animationController?.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
            });
        }
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


    public init(): void {

        if (!this._dirtyFlag) return;
        this._opacity = this._animationController.node.getComponent(UIOpacity);
        this._animationController?.playAni(AnimationStateType.Default);
        this._initialized = true;
    }

    public test(): void {

        this._animationController?.playAni(AnimationStateType.Win);
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
        return 1.08;
    }


    public reset(): void {

        this._animationController?.playAni(AnimationStateType.Default);
        this.node.active = false;
    }



    public showExplodeAni(): void {
        this._opacity!.opacity = 255;
        this.node.active = true;
        this._animationController?.playAni(AnimationStateType.Win);
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


