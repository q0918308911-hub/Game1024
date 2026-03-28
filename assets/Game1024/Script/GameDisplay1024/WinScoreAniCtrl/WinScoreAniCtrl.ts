import { _decorator, color, Component, Graphics, Label, Layers, Node, tween, UIOpacity, UITransform, v3, Vec3 } from 'cc';
import { AnimationController, AnimationStateType } from '../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';
const { ccclass, property } = _decorator;

const enum SIGNAL_KEY {
    GET_RS_EFFECT = 'GET_NG_WIN_SCORE',
    GET_FG_EFFECT = 'GET_FG_WIN_SCORE'
}
const ANIMATION_SCORE_TYPE = {
    In: 'In',
    Out: 'Out',
    Loop: 'Loop',
    Default: 'Default'
};
@ccclass('WinScoreAniCtrl')
export class WinScoreAniCtrl extends Component {

    @property({ type: Label, visible: true, displayName: "WinScoreLabel", tooltip: "得分Label" })
    private _winScoreLabel: Label = null;

    @property({ type: AnimationController, visible: true, displayName: "WinScoreAnimationController", tooltip: "得分動畫控制器" })
    private _winScoreAniController: AnimationController = null;

    @property({ type: Node, visible: true, displayName: "testNode", tooltip: "測試用的容器" })
    private _testShowNode: Node = null;


    private _finishResolvePromise: (() => void) | undefined; // promise resolve 函式(stop使用)


    private _dirtyFirstOnLoad: boolean = false;
    private _currentScore: number = 0; // 當前分數
    private _isForceStopped = false;
    private _currentScale: number = 1;
    private _ogLabelPos: Vec3;//--原始位置
    private _status: string = '';
    private _initialized: boolean = false;
    private _opacity: UIOpacity = null;

    public test1(): void {
        //this.showFinalScoreIn(1000);
        //this.forceToDefault();
        this.showFGFinalScoreIn(123456789, (payload) => {
            console.log("Frame Event Callback Triggered", payload);
            this.testGraphicPos(payload.wP);
        });
    }

    private testGraphicPos(wPos: Vec3): void {

        let testNode: Node = new Node();
        let graphic: Graphics = testNode.addComponent(Graphics);
        //-graphic 不受到UIOpacity組件影響~有夠78(color 0-255)       
        graphic.fillColor = color(255, 0, 0, 255);
        graphic.rect(-10, -10, 20, 20);
        graphic.fill();
        testNode.layer = Layers.Enum.UI_2D;
        this._testShowNode.addChild(testNode);

        const uiTrans = this._testShowNode.getComponent(UITransform);
        const localPos = uiTrans.convertToNodeSpaceAR(wPos);
        testNode.setPosition(localPos);
        //testNode.setPosition(testNode.position.clone());
    }

    get currentScore(): number {
        return this._currentScore;
    }

    protected onLoad(): void {

        if (this._dirtyFirstOnLoad) return;
        this._dirtyFirstOnLoad = true;

        //--確保完成初始化物件控制..
        // 雖然有 _initialized,but onLoad 保留自動初始化邏輯是好習慣
        // 這樣就算沒被 Promise.all 管理的物件也能正常運作
        if (this._winScoreAniController && this._winScoreAniController.isLoaded) {
            this.init();
        } else {
            this._winScoreAniController?.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
            });
        }

    }

    public init(): void {

        if (!this._dirtyFirstOnLoad) return;
        this._opacity = this._winScoreAniController.node.getComponent(UIOpacity);
        this._ogLabelPos = this._winScoreLabel.node.position.clone();
        this.setScoreLabel(0); // 初始化分數顯示為0
        this._isForceStopped = false;
        this.forceToDefault();
        this.node.active = false;
        this._initialized = true;
    }

    /**
     * 提供給 Manager 呼叫，確保三個物件都 ready
     */
    public async waitForReady(): Promise<void> {

        if (this._initialized) return;

        // 如果已經載入完成，直接 init 並回傳
        if (this._winScoreAniController && this._winScoreAniController.isLoaded) {
            this.init();
            return;
        }

        // 否則，開啟一個 Promise 等待事件
        return new Promise<void>((resolve) => {
            this._winScoreAniController.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
                resolve();
            });
        });
    }

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

    public reset(): void {
        this.setScoreLabel(0);
        this._isForceStopped = false;
        this._winScoreLabel.node.setPosition(this._ogLabelPos);
    }

    public setScoreLabel(value: number): number {

        this._currentScore = value;
        const formattedValue = value.numberComma();
        this._currentScale = formattedValue.length >= 11 ? 0.9 : 1.0;
        this._winScoreLabel.node.setScale(this._currentScale, this._currentScale, 1);
        this._winScoreLabel.string = formattedValue;

        return formattedValue.length;//--抽出長度
    }

    public forceToDefault(): void {
        this._winScoreAniController.goBackToDefault();
    }

    //---停止更新--(new Round開始前清除輪播系統)
    public stopToDefault(): void {

        this._isForceStopped = true;
        this._winScoreAniController.stopAni();
        this.safeResolveFinishPromise();
    }


    public resetStatus(): void {
        this._status = ANIMATION_SCORE_TYPE.Default;
    }


    public async showFinalScoreIn(finalScore: number): Promise<void> {

        if (this._isForceStopped) return;

        if (this._finishResolvePromise) {
            this.safeResolveFinishPromise();
            this.forceToDefault();
            console.log();
        }

        this._status = ANIMATION_SCORE_TYPE.In;
        return new Promise<void>(async (resolve) => {
            this._finishResolvePromise = resolve;
            this.setScoreLabel(finalScore);
            this.node.active = true;
            const aniTime = this.getAniTime(ANIMATION_SCORE_TYPE.In);
            if (aniTime > 0) {
                this._winScoreAniController.changeSpeedWithAep(AnimationStateType.Win, aniTime);
            }
            await this._winScoreAniController.playAniInPromise(AnimationStateType.Win, true);
            this._status = ANIMATION_SCORE_TYPE.Loop;
            this.safeResolveFinishPromise();
        })
    }

    public async showFinalScoreOut(): Promise<void> {

        if (this._isForceStopped) return;
        this._status = ANIMATION_SCORE_TYPE.Out;
        this.forceToDefault();
        this.node.active = false;
    }

    //=================FG使用=============================

    private getLabelTransFormInfo2(): { w: number; h: number; wP: Vec3 } {

        const info = {
            w: 0,
            h: 0,
            wP: Vec3.ZERO.clone(),

        };
        this._winScoreLabel.updateRenderData(true);//--強制更新label 
        const labelNode = this._winScoreLabel.node;
        const uiTrans = labelNode.getComponent(UITransform);
        info.w = uiTrans.width;
        info.h = uiTrans.height;


        // 右側邊界中心的本地座標
        // X 方向偏移：寬度 * (1 - 錨點X) -> 得到從錨點到最右邊的距離
        // Y 方向偏移：0 -> 保持在錨點的水平線上（即 Label 的垂直中心）
        const rightLocalX = uiTrans.width * (1 - uiTrans.anchorX);
        const rightLocalPos = v3(rightLocalX, 0, 0);
        // Scale 與 Rotation(換成wops)
        const worldPos = uiTrans.convertToWorldSpaceAR(rightLocalPos);
        info.wP.set(worldPos);
        return info;
    }

    private getLabelTransFormInfo(): { trans: UITransform, scaleRate: number } {

        this._winScoreLabel.updateRenderData(true);//--強制更新label 
        const uiTrans = this._winScoreLabel.node.getComponent(UITransform)!;
        return { trans: uiTrans, scaleRate: this._currentScale };
    }

    public moveLabelNodeToPosition(localPos: Vec3): void {
        tween(this._winScoreLabel.node)
            .to(0.08, { position: localPos }, { easing: 'quadOut' })
            .start();
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

    //--取得需要表演的時間
    private getTime(): number {
        return 0.3;
    }

    public async showFGFinalScoreIn(finalScore: number, frameEvtCallBack: (payLoad?: any) => void): Promise<void> {

        const lens = this.setScoreLabel(finalScore);
        this.node.active = true;
        this._winScoreAniController.playAniWithFrameEvtCallBack(
            async () => {
                //--收到事件
                const labelInfo = this.getLabelTransFormInfo();
                frameEvtCallBack?.(labelInfo);
            },
            async () => {
                //--complete
                console.log();
            },
            false,
            { aniState: AnimationStateType.Win }
        );

    }

    //=================FG使用=============================

    //--強制到最後一幀
    public forceToLastFrame(): void {
        this._winScoreAniController.gotoPlayLastFrame();
    }

    //--強制取消動畫並結束promise
    public cancelAniAndResolve(): void {
        this.cleanPreviousAni();
        this.safeResolveFinishPromise();
    }

    public cleanPreviousAni(): void {

        this._isForceStopped = true;
        this._winScoreAniController.goBackToDefault();
        this.node.active = false; // 隱藏節點
        this.setScoreLabel(0); // 重置分數顯示
    }



    private safeResolveFinishPromise(): void {

        if (this._finishResolvePromise) {
            this._finishResolvePromise();
            this._finishResolvePromise = undefined;
        }
    }


    private getAniTime(value: string): number {

        let returnTime = 0;
        switch (value) {
            case ANIMATION_SCORE_TYPE.In:
                returnTime = 1;
                break;
            case ANIMATION_SCORE_TYPE.Out:
                break;
            case ANIMATION_SCORE_TYPE.Loop:
                break;
            //return this._mapAniTimeData.get(value) ?? DEFAULT_ANI_TIME; // 預設動畫時間

        }
        return returnTime;
    }


}


