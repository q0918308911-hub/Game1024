import { _decorator, macro, Node } from "cc";
import { UniReelView1024 } from "./UniReelView1024";
import { InitRandomGenerator, IRandomData } from "../MyUtils/BasicRandomGenerator/InitRandomGenerator";
import { SymbolOwnerAgentID } from "../DefinitionGameData1024/GameGlobalData1024";
import { IStrategyRandomGenerator } from "../MyUtils/BasicRandomGenerator/IStrategyRandomGenerator";
import {
    FunctionType,
    GameUtilsTools,
    ICrossSystemSymbolAniService,
    IFunctionOwnerAgent,
    IPropertyTransferAgent,
    IPropertyTransferData,
    IReelInfo,
    ISyncDataAgent,
    ISyncDatatype,
    UniSlotMachine
} from "../ReferencePath";
import { DIAgentFactory } from "./DIFactory/DIAgentFactory";
import { SyncBackProcessType1024, SyncDataType1024 } from "../CrossSys1024/SyncData1024/SyncDataDef1024";
import { Call_Function_Type } from "../CrossSys1024/CrossSystem1024/DefinitionFunctionType";



const { ccclass, property } = _decorator;

@ccclass('UniSlotMachine1024')
export class UniSlotMachine1024 extends UniSlotMachine<UniReelView1024> implements IFunctionOwnerAgent, ISyncDataAgent, IPropertyTransferAgent {

    public onStartRollCallBack: () => void = null;
    public oneReelRollEndCallBack: (reelID: number) => void = null;
    private _aryReelAmountIds: number[] = [0, 1, 2, 3, 4, 5, 6]; //--盤面預定顯示的軸數量分布(第6軸為副盤)
    //--slotMediator
    private _onlyOnceToSort: boolean = false;
    private _currentCards: number[][] = [];
    private _cancelTimeDelay?: () => void;
    private _interruptFlag: boolean = false;
    //--checkFastStopMode
    private _isFastStopClick: boolean = false;
    private _previousCards: number[][] = [];
    //--跨系統服務注入
    private _crossSystemService: ICrossSystemSymbolAniService<IReelInfo, Node, string> = null;
    //--跨系統服務代理工廠
    private _aniCrossServiceProxyFactory: DIAgentFactory<this> = null;
    public readonly ownerId: number = SymbolOwnerAgentID.SlotMachine;

    //==========================<跨系統指令接口>interface IFunctionOwnerAgent===========================

    public crossProcess(processType: FunctionType): void {

        switch (processType.name) {


            case Call_Function_Type.SET_ICON_BRIGHTNESS:

                this.setIconLight(processType.args[0] as number, processType.args[1] as number[], processType.args[2] as boolean);
                break;

            case Call_Function_Type.SET_ALL_REEL_BRIGHTNESS:
                this.setAllLight(processType.args[0] as boolean);
                break;
        }
    }

    public crossMultiProcess(processType: FunctionType[]): void {

    }
    public crossReturnData(processType: FunctionType): any {

    }
    public crossMultiReturnData(processType: FunctionType[]): any {

    }

    //==========================<快速屬性轉移接口>interface IPropertyTransferAgent===========================
    /**
     * 接收並應用屬性到目標物件
     * @param obj 目標物件
     * @param properties 要應用的屬性
     * @param transferData 原始轉移資料（可選，提供額外上下文，例如 transferType）
     */
    public applyProperties<T = any>(obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T>): void {

    }

    /**
     * 批次應用屬性到多個物件
     * @param applications 物件與屬性的配對陣列
     */
    public applyMultiProperties<T = any>(applications: Array<{ obj: T, properties: Partial<T>, transferData?: IPropertyTransferData<T> }>): void {

    }

    //==========================<快速資料同步接口>interface ISyncDataAgent===================================

    public getAcquiredData(info: ISyncDatatype): ISyncDatatype | null {
        //----抽取座標後直接轉移資料--這樣太慢了-已改用屬性轉移工具
        let returnData: ISyncDatatype;
        if (info.type === SyncDataType1024.SYNC_DATA_WORLD_POS) {
            return returnData = this._reelView.getSingleIconWorldPos(info);
        }

        return null;
    }

    public getAcquiredMultiData(infos: ISyncDatatype[]): ISyncDatatype[] | null {
        //----抽取座標後直接轉移資料--太慢了-已改用屬性轉移工具
        const results: ISyncDatatype[] = [];
        for (const item of infos) {

            const data = this.getAcquiredData(item);
            if (data) results.push(data);
        }
        return null;
    }

    public onDataReceived(info: ISyncDatatype): Promise<void> {
        //----抽取座標後直接轉移資料
        return;
    }

    public onDataMultiReceived(infos: ISyncDatatype[]): Promise<void> {
        //----抽取座標後直接轉移資料
        return;
    }

    //==========================注入跨系統服務=========================================================
    public registerService(value: ICrossSystemSymbolAniService<IReelInfo, Node, string>): void {

        this._crossSystemService = value;
        this._crossSystemService.registerYourself(this);
        //--再產生盤面首盤資料前要先注入
        this._aniCrossServiceProxyFactory = new DIAgentFactory<this>(this._crossSystemService, this);
        this._reelView.injectAniService(this._aniCrossServiceProxyFactory);
    }

    //==========================註冊回呼函數=============================================================
    public registerStartRollCallBack(): void {
        this._reelView.oneReelRollEndCallBack = this.onOneReelStopRoll;//--單軸停止 
    }

    private onOneReelStopRoll = (reelID: number): void => {

        this.oneReelRollEndCallBack?.(reelID);
    }

    //========================override 父類別方法<以下針對UniReel的基礎滾動>===============================
    public override init(): void {
        super.init();
        //--產生盤面首盤資料
        this.setGenericRandomCreator();
    }

    set aryReelAmountIds(value: number[]) {
        this._aryReelAmountIds = value;
    }

    private setGenericRandomCreator(): void {

        const randomInit = this.initIconSymbol<IRandomData, number[][]>(new InitRandomGenerator(), {
            groupSizes: [4, 2, 5, 3, 2, 4, 4],
            randomGroupSource: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        });
        console.log('randomInit__', randomInit);
        this._reelView.initIconSymbol(randomInit);
    }

    private initIconSymbol<TInput, TResult>(generator: IStrategyRandomGenerator<TInput>, value: TInput): TResult {
        //--要產出亂數初始盤面2ds
        return generator.generate(value) as TResult;
    }

    protected override reset(): void {
        super.reset();

        this._interruptFlag = false;
        this._isFastStopClick = false;
        this._previousCards = [];
    }
    public override async startRoll(isTurboMode: boolean, reelIDs?: number[]): Promise<void> {

        let currentReelIDs: number[] = (reelIDs) ? reelIDs : this._aryReelAmountIds;
        this._onlyOnceToSort = false;
        await super.startRoll(isTurboMode, currentReelIDs);
        this.onStartRollCallBack?.();
    }

    /**
     * 
     * @param resultData --每一軸的資料(原本方法是number[][])
     * @param option ---這個是情非得已的override..option只能給自己用
     * 這邊全部停軸後會resolve,全停就寫在這個後面就好了
     * stopRollCallBack---快速停(guiBtn會接到這個function)
     */
    public override async stopRoll(resultData: number[][]): Promise<void> {

        //this.beforeStopSetWildData(option);
        this._currentCards = GameUtilsTools.deepClone(resultData);
        //this.setScatterInReelData(resultData);
        await super.stopRoll(resultData);
        console.log('=====finish stopRoll=====');
        this._reelView.testCheckResultBoard();
        this._crossSystemService?.debugCheckAllOwners();
    }

    protected override async canStopRoll(): Promise<void> {

        /*
        const timeList = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList);
        const timeBase = (this.isFastMode()) ?
            this._fastRollTime :
            timeList.get(cfg => cfg.roll?.totalRoll);//--這邊要再分是哪一階段的加速
        */
        //--for test
        const timeBase = 2;

        const timeDefer = GameUtilsTools.DeferByTweenPromiseWithCancel(timeBase);
        this._cancelTimeDelay = timeDefer.forceCancelAndResolve; // 暫存取消方法供 stopRollCallBack 使用 
        const dataPromise = new Promise<void>((resolve) => {
            const check = () => {
                if (this._iconResultData.length > 0 && this._startRoll) {
                    this.unschedule(check);
                    resolve();
                }
            };

            this.schedule(check, 0, macro.REPEAT_FOREVER);
        });
        const testStartTime = Date.now();
        await Promise.all([timeDefer.promise, dataPromise]);
        const testEndTime = Date.now();
        const testTime = testEndTime - testStartTime;
        GameUtilsTools.debugLog('GameViewManager1016_TimeBase', 'RollingTime', { testTime }, 'log');
        this._canStop = true;
        //const gameTimeMode = GlobalAccessReader.getGlobalData(GameGlobalKeys.TurboMode);
        if (this._interruptFlag) {
            this._isFastStopClick = true;
            this._reelView.fastStopRoll();
        }
        this._cancelTimeDelay = null;
    }

    public override stopRollCallBack(): void {

        if (this._isStopClick) return;
        this._isStopClick = true;
        if (this._canStop) {
            this._isFastStopClick = true;
            this._reelView.fastStopRoll();
        } else {
            this._interruptFlag = true;
            if (this._cancelTimeDelay) {
                // 提前結束 DeferByTweenPromiseWithCancel
                this._cancelTimeDelay();
            }
        }
    }

    //========================override 父類別方法<以上針對UniReel的基礎滾動>========================

    //======================sp4Ani相關方法==========================================
    public async playSP4Ani(icons: number[]): Promise<void> {
        await this._reelView.playSP4Ani(icons);
    }

    //======================Drop相關方法==========================================
    public setVisibleDropIcon(removeMain: number[][], removeSub: number[], visible: boolean): void {

        this._reelView.setVisibleDropIcon(removeMain, removeSub, visible);
    }


    public async startReFillDrop(main: { reFill: number[][], remove: number[][] }, sub: { reFill: number[], remove: number[] }): Promise<void> {
        //this.setVisibleDropIcon(main.remove, true);
        await this._reelView.startReFillDrop(main, sub);
        console.log('=====finish startReFillDrop=====');
        this._reelView.testCheckResultBoard();
    }

    //======================wild補牌==========================================
    //--塞資料
    public setWildExtraInfo(wildExtraInfo: { reelIndex: number, iconIndex: number, symbolID: number }[][]): void {
        this._reelView.setWildExtraInfo(wildExtraInfo);
    }

    //--等待影格事件後呼叫啟動
    public async updateExpand(triggerWildReels: number[]): Promise<void> {
        await this._reelView.updateExpand(triggerWildReels);
    }

    //======================scatterAni相關=========================================
    //--20251022新增取得bounce結束的promise
    public getScAniPromise(reelIndex: number): Promise<void> | null {
        return this._reelView.getScAniPromise(reelIndex);
    }
    //--給reFillDrop用的取得所有scatterAni的promise
    public getBoardScAniPromises(): Promise<void>[] {

        const promises: Promise<void>[] = [];
        for (let i = 0; i < 6; i++) {
            const scAniPromise = this.getScAniPromise(i);
            if (scAniPromise) {
                promises.push(scAniPromise);
            }
        }
        return promises;
    }

    //======================光頭仔相關==========================================
    //--取得光頭仔的world pos 強制轉移到showAniProcess
    public forceHandoffMonkWorldPos(indexList: number[]): void {

        const infoList: ISyncDatatype[] = [];
        for (let i = 0; i < indexList.length; i++) {
            const reelInfo: IReelInfo = {
                reelIndex: 6,
                iconIndex: indexList[i],
                symbolId: 10//--唐僧的symbolId固定10
            };
            const info: ISyncDatatype = {
                info: reelInfo,
                type: SyncDataType1024.SYNC_DATA_WORLD_POS,
                backProcessType: SyncBackProcessType1024.CREATOR_MONK_EFFECT,
                ownerId: SymbolOwnerAgentID.ShowAniController
            };
            infoList.push(info);
        }

        this._crossSystemService.pushMultiDataToTarget(infoList);
    }


    //====================盤面亮度控制相關==========================================
    //--設定單一個gameIcon的亮度(關閉/開啟)
    public setIconLight(reelIndex: number, iconIndex: number[], isDark: boolean): void {
        this._reelView.setIconLight(reelIndex, iconIndex, isDark);
    }
    //--設定單一個gameIcon的亮度(關閉/開啟)(TWEEN驅動)
    public setIconLightTween(reelIndex: number, iconIndex: number[], isDark: boolean): void {
        this._reelView.setIconLightTween(reelIndex, iconIndex, isDark);
    }

    //--關閉/開啟指定的指定軸的亮度(true=變暗/false=正常)
    public setReelLight(reelIndex: number, brightnessFlag: boolean): void {
        this._reelView.setReelLight(reelIndex, brightnessFlag);
    }

    //--關閉/開啟指定的指定軸<單軸>的亮度(true=變暗/false=正常)(TWEEN驅動)
    public setReelLightTween(reelIndex: number, brightnessFlag: boolean): void {
        this._reelView.setReelLightTween(reelIndex, brightnessFlag);
    }

    //--關閉/開啟多軸的亮度(true=變暗/false=正常)
    public setReelsLight(reelIndex: number[], brightnessFlag: boolean): void {
        this._reelView.setReelsLight(reelIndex, brightnessFlag);
    }

    //--關閉/開啟多軸的亮度(true=變暗/false=正常)(TWEEN驅動)
    public async setReelsLightTween(reelIndex: number[], brightnessFlag: boolean): Promise<void> {
        await this._reelView.setReelsLightTween(reelIndex, brightnessFlag);
    }

    public async setReelsLightTweenExcludeIds(reelIndex: number[], isDark: boolean, excludeSymbolIds: number[]): Promise<void> {

        await this._reelView.setReelsLightTweenExcludeIds(reelIndex, isDark, excludeSymbolIds);
    }

    //--關閉/開啟整個盤面亮度(true=變暗/false=正常)
    public setAllLight(isDark: boolean): void {
        this._reelView.setAllLight(isDark);
    }

    //--關閉/開啟整個盤面亮度(true=變暗/false=正常)(TWEEN驅動)
    public async setAllLightTween(isDark: boolean): Promise<void> {
        await this._reelView.setAllLightTween(isDark);
    }

}