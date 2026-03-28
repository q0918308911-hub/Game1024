import { _decorator, Component, Node } from 'cc';
import { UniReelView } from './ReferencePathForUniSlot';
import { UniReel1024 } from './Reel/UniReel1024';
import { UniDropIcon1024 } from './Icon/UniDropIcon1024';
import { ChangeReelsColor } from '../MyUtils/BasicEffect/Classes/ChangeReelsColor';
import { IDIAgentFactory } from './DIFactory/IDIAgentFactory';
import { IPlayAniData, ISyncDatatype } from '../ReferencePath';
import { SyncDataType1024 } from '../CrossSys1024/SyncData1024/SyncDataDef1024';
const { ccclass, property } = _decorator;

@ccclass('UniReelView1024')
export class UniReelView1024 extends UniReelView<UniReel1024> {


    public oneReelRollEndCallBack: (reelID: number) => void = null;
    private _currentBoard: UniDropIcon1024[][] = [];
    private _changeReelsColor: ChangeReelsColor = new ChangeReelsColor();


    public override init(): void {

        super.init();
        this.setReelDataCallback = this.setReelData;
        this.showReadyHandCallback = this.showReadyHand;
        this.hideReadyHandCallback = this.hideReadyHand;
    }

    //--在init完之後馬上接著做要在initIconSymbol之前..需要等待icon產完dropReel才行
    public injectAniService(proxyOwner: IDIAgentFactory): void {

        for (let i = 0; i < this.reelList.length; i++) {
            const reel = this.reelList[i];
            reel.injectAniService(proxyOwner);
        }
    }

    //--初始盤面資料(從slotMachine進來)
    public initIconSymbol(randomCard2ds: number[][]): void {

        for (let reelID = 0; reelID < this.reelList.length; reelID++) {
            const reel = this.reelList[reelID];
            reel.setInitIconData(randomCard2ds[reelID]);
        }
    }

    public testRunRandom(): void {

        for (let reelID = 0; reelID < this.reelList.length; reelID++) {
            const reel = this.reelList[reelID];
            reel.testRandom();
        }
    }

    public testCheckResultBoard(): void {
        console.log('===testCheckResultBoard===');
        const testBoard = [];
        for (let reelID = 0; reelID < this.reelList.length; reelID++) {
            const reel = this.reelList[reelID];
            const iconsInReel = reel.getWholeIconsInReel();
            testBoard.push(iconsInReel);
        }
        console.log('testCheckResultBoard:', testBoard);

    }
    //=========================override 父類別方法<以下針對UniReelView的基礎滾動>========================
    protected override oneReelRollEnd(reelID: number): void {

        super.oneReelRollEnd(reelID);//--關閉聽牌
        this.oneReelRollEndCallBack?.(reelID);//--單軸停

        this._currentBoard[reelID] = this.reelList[reelID].getWholeIconsInReel();
        //--湊盤面
        //GameUtilsTools.debugLog(DEBUG_TITLE, 'oneReelRollEnd:', { finishedReel: reelID, isFinalRound: this._isFinalResultRound });
    }

    //--startRoll 裡面會呼叫
    protected override reset(): void {
        super.reset();
        for (let i = 0; i < this.reelList.length; i++) {
            this.reelList[i].reset();
        }
    }

    public fastStopRoll(): void {

        for (let index = 0; index < this._currentRollingReelIDs.length; index++) {
            let reelID = this._currentRollingReelIDs[index];
            this.reelList[reelID].clearRandomData();
        }
    }

    //--stop之前寫資料(stopRoll裡面會呼叫)
    /**
     * 
     * @param reelID 
     * @param data -顯示的盤面資料
     */
    protected setReelData(reelID: number, data: number[]): void {
        this.reelList[reelID].setData(data, 0);
        /*
        let length = 0;

        if (!this.isFastModeCallback()) {
            length = this.calculateRandomDataLength(reelID);//可以在這裡加隨機資料，實現間隔暫停
        }

        let symbolData = this.createSymbolData(data);
        this.reelList[reelID].setData(symbolData, length);
        */
    }

    protected showReadyHand(reelID: number): void {
        /*
        this.setAllReelBrightness(true);
        this.setIconBrightness(reelID, false);

        this.readyHandList[reelID].active = true;
        */
    }

    protected hideReadyHand(reelID: number): void {
        /*
        if (reelID === this.reelAmount - 1) {
            this.setAllReelBrightness(false);
        }
        else {
            this.setIconBrightness(reelID, false);
        }

        this.readyHandList[reelID].active = false;
        */
    }



    //======================DropReel相關方法==========================================
    private setBoardDropReelData(wholeBoardData: number[][]): void {

        for (let i: number = 0; i < wholeBoardData.length; i++) {
            const reFillData = wholeBoardData[i];
            if (reFillData.length > 0) {
                this.reelList[i].setDropReelData(reFillData);
            }
        }

    }

    //--這段要在處理過(盡量不要放在這裡)---
    private processRemoveList(removeList: number[][]): number[][] {

        const processedList: number[][] = [[], [], [], [], [], [], [], []];
        for (let i: number = 0; i < removeList.length; i++) {

            if (removeList[i] && removeList[i].length > 0) {
                processedList[i] = removeList[i].map(id => id + 1); //-補正掉落盤面index
            }
        }
        return processedList;
    }

    public setVisibleDropIcon(removeMain: number[][], removeSub: number[], visible: boolean): void {

        let removeData: number[][] = [];
        if (removeMain) {
            removeData = [...removeMain];
        }
        if (removeSub) {
            removeData.push(removeSub);
        }
        const processedRemoveData = this.processRemoveList(removeData);

        for (let i = 0; i < processedRemoveData.length; i++) {
            const removeList = processedRemoveData[i];
            if (removeList && removeList.length > 0) {
                this.reelList[i].setVisibleDropIcon(removeList, visible);
            }
        }
    }

    public async startReFillDrop(main: { reFill: number[][], remove: number[][] }, sub: { reFill: number[], remove: number[] }): Promise<void> {

        let finalData = [];
        let removeData = [];
        if (main) {
            finalData = [...main.reFill];
            removeData = [...main.remove];
        }

        if (sub) {
            finalData.push(sub.reFill);
            removeData.push(sub.remove);
        }

        this.setBoardDropReelData(finalData);
        const processedRemoveData = this.processRemoveList(removeData);
        const promises = [];
        for (let i: number = 0; i < processedRemoveData.length; i++) {
            const removeList = processedRemoveData[i];
            if (removeList.length > 0) {
                promises.push(this.reelList[i].startDropRefill(removeList));
            }
        }

        await Promise.all(promises);
    }

    //=====================wild補牌======================================================================================
    public setWildExtraInfo(wildInfoList: { reelIndex: number, iconIndex: number, symbolID: number }[][]): void {

        //const Promises = [];
        for (let i = 0; i < wildInfoList.length; i++) {
            const wildInfo = wildInfoList[i];
            const reelIndex = wildInfo[0].reelIndex;
            const p = this.reelList[reelIndex].setWildFillSymbol(wildInfo);
            //const p=this.reelList[1].setWildFillSymbol(wildInfo);
            //Promises.push(p);
        }

        //await Promise.all(Promises);
    }

    public async updateExpand(triggerWildReels: number[]): Promise<void> {

        const promises = [];
        for (let i = 0; i < triggerWildReels.length; i++) {
            const p = this.reelList[triggerWildReels[i]].updateExpand();
        }

        await Promise.all(promises);
    }

    //=========================Sp4Ani相關=========================================
    public async playSP4Ani(icons: number[]): Promise<void> {
        await this.reelList[6].playSP4Ani(icons);
    }

    //=========================ScatterAni相關=========================================
    public getScAniPromise(reelIndex: number): Promise<void> | null {
        return this.reelList[reelIndex].getScAniEndPromise();
    }

    //=========================跨系統抽取資料區域========================================
    public getWholeWorldPosOfIcons(): Partial<IPlayAniData>[][] {

        const returnDataList: Partial<IPlayAniData>[][] = [];
        for (let i = 0; i < this.reelList.length; i++) {
            const reel = this.reelList[i];
            const worldPosData = reel.getWholeWorldPosOfIcons();
            returnDataList.push(worldPosData);
        }
        return returnDataList;
    }

    public getSingleIconWorldPos(info: ISyncDatatype): ISyncDatatype | null {

        const reel = this.reelList[info.info.reelIndex];
        if (reel) {
            const data = reel.getSingleIconWorldPos(info.info);
            info.payload = data;
            return info;

        }
        return null;
    }

    public getMultipleIconWorldPos(info: ISyncDatatype[]): ISyncDatatype[] {

        //const returnDataList: Partial<IPlayAniData>[] = [];
        //const returnDataList: ISyncDatatype[] = [];
        for (let i = 0; i < info.length; i++) {
            const reel = this.reelList[info[i].info.reelIndex];
            if (reel) {
                const target = info[i];
                const worldPosData = reel.getSingleIconWorldPos(info[i].info);
                target.payload = worldPosData;
            }
        }
        return info;
    }

    //======================change icon color==========================================
    /**
     * <一般>-關閉/開啟指定的指定軸的<指定位置icon>亮度(true=變暗/false=正常)
     * @param reelIndex 軸
     * @param iconIndex 指定位置icon
     * @param isDark 亮度(true=變暗/false=正常)
     */
    public setIconLight(reelIndex: number, iconIndex: number[], isDark: boolean): void {
        this._changeReelsColor.setIconLight(this.reelList, reelIndex, iconIndex, isDark);
    }
    /**
     * <TWEEN驅動>-關閉/開啟指定的指定軸的<指定位置icon>亮度(true=變暗/false=正常)
     * @param reelIndex 軸
     * @param iconIndex 指定位置icon
     * @param isDark 亮度(true=變暗/false=正常)
     */
    public setIconLightTween(reelIndex: number, iconIndex: number[], isDark: boolean): void {
        this._changeReelsColor.setIconLightTween(this.reelList, reelIndex, iconIndex, isDark);
    }

    /**
     * 關閉/開啟指定的指定軸的<整軸>亮度(true=變暗/false=正常)
     * @param reelIndex 
     * @param brightnessFlag 
     */
    public setReelLight(reelIndex: number, brightnessFlag: boolean): void {
        this._changeReelsColor.setReelLight(this.reelList, reelIndex, brightnessFlag);
    }

    /**
    * <TWEEN驅動> 關閉/開啟指定的指定軸的<整軸>亮度(true=變暗/false=正常)
    * @param reelIndex 
    * @param brightnessFlag 
    */
    public async setReelLightTween(reelIndex: number, brightnessFlag: boolean): Promise<void> {
        await this._changeReelsColor.setReelLightTween(this.reelList, reelIndex, brightnessFlag);
    }

    public async setReelLightTweenExcludeIds(reelIndex: number, isDark: boolean, excludeSymbolIds: number[]): Promise<void> {
        await this._changeReelsColor.setReelLightTweenExcludeIds(this.reelList, reelIndex, isDark, excludeSymbolIds);
    }

    public setReelsLight(reelIndex: number[], brightnessFlag: boolean): void {
        this._changeReelsColor.setReelsLight(this.reelList, reelIndex, brightnessFlag);
    }

    public async setReelsLightTweenExcludeIds(reelIndex: number[], isDark: boolean, excludeSymbolIds: number[]): Promise<void> {
        await this._changeReelsColor.setReelsLightTweenExcludeIds(this.reelList, reelIndex, isDark, excludeSymbolIds);
    }

    public async setReelsLightTween(reelIndex: number[], brightnessFlag: boolean): Promise<void> {
        await this._changeReelsColor.setReelsLightTween(this.reelList, reelIndex, brightnessFlag);
    }

    /**
     * <一般>-關閉/開啟指定的全部(整個盤面)的亮度(true=變暗/false=正常) 
     * @param isDark 
     */
    public setAllLight(isDark: boolean): void {
        this._changeReelsColor.setAllLight(this.reelList, isDark);
    }

    /**
    * 
    * @param isDark true=變暗/false=正常
    * @param excludeSymbolIds 不參與改變的symbolID陣列
    */
    public setAllLightExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): void {
        this._changeReelsColor.setAllLightExcludeSymbolIds(this.reelList, isDark, excludeSymbolIds);
    }
    /**
     * <TWEEN驅動> 關閉/開啟指定的全部(整個盤面)的亮度(true=變暗/false=正常) 
     * @param isDark 
     */
    public async setAllLightTween(isDark: boolean): Promise<void> {
        await this._changeReelsColor.setAllLightTween(this.reelList, isDark);
    }

    //======================change icon color==========================================

}


