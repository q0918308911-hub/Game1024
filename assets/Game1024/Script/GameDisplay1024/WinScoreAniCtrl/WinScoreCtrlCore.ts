import { _decorator, Component, Label, Node, UITransform, v3, Vec3 } from "cc";
import { WinScoreAniCtrl } from "./WinScoreAniCtrl";
import { FGWinScoreAniCtrl } from "./FGWinScoreAniCtrl";
import { GameState, IGameMode, NotifyCation, NotifySubject } from "../../ReferencePath";
import { FGWinExplodeAniCtrl } from "./FGWinExplodeAniCtrl";
import { GameEventType1024 } from "../../DefinitionGameData1024/GameEventTypeDef1024";


const { ccclass, property } = _decorator;
@ccclass('WinScoreCtrlCore')
export class WinScoreCtrlCore extends Component implements IGameMode {

    @property({ type: WinScoreAniCtrl, visible: true, displayName: "WinScoreAniCtrl", tooltip: "得分動畫控" })
    private _winScoreAniCtrl: WinScoreAniCtrl = null;

    @property({ type: FGWinScoreAniCtrl, visible: true, displayName: "FGWinScoreAniCtrl", tooltip: "免費遊戲倍數動畫控" })
    private _fgWinScoreAniCtrl: FGWinScoreAniCtrl = null;

    @property({ type: FGWinExplodeAniCtrl, visible: true, displayName: "FGWinExplodeAniCtrl", tooltip: "免費遊戲爆炸動畫控" })
    private _fgWinExplodeAniCtrl: FGWinExplodeAniCtrl = null;

    @property({ type: Label, visible: true, displayName: "WinScoreLabel", tooltip: "得分Label" })
    private _winScoreLabel: Label = null;

    private _dirtyFlag: boolean = false;
    private _currentGameState: GameState = GameState.NULL;

    protected async onLoad(): Promise<void> {

        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        await this.waitAllCtrlReady();
    }

    private async waitAllCtrlReady(): Promise<void> {

        const promises: Promise<void>[] = [];
        promises.push(this._winScoreAniCtrl.waitForReady());
        promises.push(this._fgWinScoreAniCtrl.waitForReady());
        promises.push(this._fgWinExplodeAniCtrl.waitForReady());
        await Promise.all(promises);
    }

    public async test(): Promise<void> {
        this._currentGameState = GameState.FREE_GAME;
        await this.showFGWinScoreIn(123456789, 5);
        console.log('All Animations Completed');
    }

    public changeGameState(value: GameState): void {
        this._currentGameState = value;
    }

    public register(): void {
        //---註冊時間列表中---
        this._winScoreAniCtrl.register();
        this._fgWinScoreAniCtrl.register();
        this._fgWinExplodeAniCtrl.register();
    }

    public reset(): void {

        this._winScoreAniCtrl?.reset();
        this._fgWinScoreAniCtrl?.reset();
        this._fgWinExplodeAniCtrl?.reset();
    }


    public forceToDefault(): void {
        this._winScoreAniCtrl.forceToDefault();
        this._fgWinScoreAniCtrl.forceToDefault();
        this._fgWinExplodeAniCtrl.forceToDefault();
    }

    //---停止更新--(new Round開始前清除輪播系統)
    public stopToDefault(): void {
        this._winScoreAniCtrl.stopToDefault();
        this._fgWinScoreAniCtrl.forceToDefault();
        this._fgWinExplodeAniCtrl.forceToDefault();
    }

    public forceToLastFrame(): void {
        this._winScoreAniCtrl.forceToLastFrame();
        this._fgWinScoreAniCtrl.forceToLastFrame();
        this._fgWinExplodeAniCtrl.forceToLastFrame();
    }
    //=================FG使用========================
    private adjustLayoutAndGetAPosition(value: { trans: UITransform, scaleRate: number }): { targetLocalPos: Vec3, multiplierWPos: Vec3 } {

        const mainLabel = this._winScoreLabel;
        const mainTrans = value.trans;

        const A_WIDTH = 280;
        const SPACING = 0;

        //mainLabel.updateRenderData(true);
        const mainRealWidth = mainTrans.width * value.scaleRate;
        const totalWidth = mainRealWidth + SPACING + A_WIDTH;

        const mainTargetLocalX = -(totalWidth / 2) + (mainRealWidth / 2);
        const scoreLocalPox = v3(mainTargetLocalX, 0, 0);

        // 手動計算 Label 抵達目標後的世界座標，而不是直接轉
        // 不依賴 convertToWorldSpaceAR，因為它現在指向舊位置
        // 取父節點的世界座標，手動加上位移
        const parentWorldPos = mainLabel.node.parent!.worldPosition;

        // 計算 Label 抵達目標後，中心點的世界座標
        // 注意：這裡假設父節點沒有旋轉且縮放為 1，若有複雜層級，矩陣相乘
        const labelTargetWorldX = parentWorldPos.x + (mainTargetLocalX * mainLabel.node.parent!.worldScale.x);

        // 「預期」的 Label 位置，算出右邊界
        const halfWidth = (mainTrans.width * (1 - mainTrans.anchorX)) * value.scaleRate;
        const expectedRightWorldX = labelTargetWorldX + halfWidth;

        //  算出目標位置
        const finalAWorldX = expectedRightWorldX + (SPACING + (A_WIDTH / 2) * 1); // 假設 A scale 1
        const finalAWorldPos = v3(finalAWorldX, parentWorldPos.y, parentWorldPos.z);

        return { targetLocalPos: scoreLocalPox, multiplierWPos: finalAWorldPos };
    }

    private frameEvtCallBack = (payload: { trans: UITransform, scaleRate: number }) => {

        const { targetLocalPos, multiplierWPos } = this.adjustLayoutAndGetAPosition(payload);
        this._winScoreAniCtrl.moveLabelNodeToPosition(targetLocalPos);
        this._fgWinExplodeAniCtrl.showExplodeAni();
        this._fgWinScoreAniCtrl.showMultiplier(this.multiplierFrameEvtCallBack);
        //--叫上面搖攝影機--
        const evtData = {
            eventType: GameEventType1024.FG_SHOW_MULTIPLIER_EVENT,
            eventData: {}
        }
        NotifyCation.getInstance().emitSync(NotifySubject.GAME_ANI_PROCESS_SUBJECT, evtData.eventType, evtData);

        this._fgWinScoreAniCtrl.moveMultiplierLabelToPosition(multiplierWPos);//--這邊就要resolve了
    }

    private multiplierFrameEvtCallBack = async (payLoad?: any): Promise<void> => {

        /*
        const promises: Promise<void>[] = [];
        promises.push(this._fgWinScoreAniCtrl.fadeOut());
        promises.push(this._winScoreAniCtrl.fadeOut());
        await Promise.all(promises);
        */
        this._fgWinScoreAniCtrl.fadeOut();
        this._winScoreAniCtrl.fadeOut();
        return;
        //--退場--
    }

    public async showFGWinScoreIn(finalScore: number, multiplier: number): Promise<void> {

        if (this._currentGameState !== GameState.FREE_GAME) return;

        return new Promise<void>(async (resolve) => {

            const originalFrameCallback = this.frameEvtCallBack;
            this.frameEvtCallBack = (payload: { trans: UITransform, scaleRate: number }) => {
                originalFrameCallback(payload);
                resolve();
            };
            /*
            const originalMultiplierCallback = this.multiplierFrameEvtCallBack;
            this.multiplierFrameEvtCallBack = async (payLoad?: any): Promise<void> => {
                await originalMultiplierCallback(payLoad);
                resolve();
            }*/
            this._fgWinScoreAniCtrl.setMultiplier(multiplier);
            this._winScoreAniCtrl.showFGFinalScoreIn(finalScore, this.frameEvtCallBack);
        });

    }

    //=================NG使用(winSore 專用)========================
    public async showFinalScoreIn(finalScore: number, multiplier?: number): Promise<void> {
        await this._winScoreAniCtrl.showFinalScoreIn(finalScore);
    }

    public async showFinalScoreOut(): Promise<void> {
        await this._winScoreAniCtrl.showFinalScoreOut();
    }

    public setScoreLabel(value: number): void {
        this._winScoreAniCtrl.setScoreLabel(value);
    }

    public resetStatus(): void {
        this._winScoreAniCtrl.resetStatus();
    }

    public cancelAniAndResolve(): void {
        this._winScoreAniCtrl.cancelAniAndResolve();
    }

    public cleanPreviousAni(): void {
        this._winScoreAniCtrl.cleanPreviousAni();
    }

    //================winSore 專用=========================

}