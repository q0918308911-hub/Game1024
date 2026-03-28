import { _decorator, randomRangeInt, instantiate, v3, Prefab, Node, UITransform, Graphics, color, Vec3, tween, Layers, Size, Pool, TweenEasing, Game, Vec2 } from 'cc';
import { UniIconBase, UniMovement, UniReel } from '../ReferencePathForUniSlot';
import { SymbolNumber1024 } from '../SymbolNumber1024';
import { UniIcon1024 } from '../Icon/UniIcon1024';
import { GameUtilsTools } from '../../MyUtils/GameUtilsTool';
//--這個比較特殊一點要解構的方式抽出config裡面的變數就要單獨出來免得造成循環引用

import { GameState } from '../../MyUtils/GameStateConfigDef/GameStateConfigDef';
//--這個比較特殊一點要解構的方式抽出config裡面的變數就要單獨出來免得造成循環引用
import { DefinitionGameConfigData } from '../../DefinitionGameData1024/GameConfigInstance1024';
import { UniDropIcon1024 } from '../Icon/UniDropIcon1024';
import { UniDropReel1024 } from './UniDropReel1024';
import { IChangeReelsColor } from '../../MyUtils/BasicEffect/InterfaceDef/IChangeColor';
import { IDIAgentFactory } from '../DIFactory/IDIAgentFactory';
import { IPlayAniData, IReelInfo } from '../../ReferencePath';

const {
    ALL_SYMBOL_LIST_NG,
    ALL_SYMBOL_LIST_FG,
    UNIQUE_SYMBOL_LIST_NG,
    UNIQUE_SYMBOL_LIST_FG,
    WILD_LIST,
    SCATTER_LIST,
    SP_REEL_ID,
    REEL_RANDOM_LIMIT_LIST,
    SP_BOARD
} = DefinitionGameConfigData;

/**
 * 巢狀解構特殊軸的設定
 * 在命名衝突的情況下加上前墜"S P _"來區分
 */
const {
    REEL_AMOUNT: SP_REEL_AMOUNT,
    REEL_SYMBOL_AMOUNT: SP_REEL_SYMBOL_AMOUNT,
    REEL_RANDOM_LIMIT_LIST: SP_REEL_RANDOM_LIMIT_LIST,
    ALL_SYMBOL_LIST_NG: SP_ALL_SYMBOL_LIST_NG,//--特殊軸ng模式當中會出現的牌組
    ALL_SYMBOL_LIST_FG: SP_ALL_SYMBOL_LIST_FG,//--特殊軸fg模式當中會出現的牌組
    UNIQUE_SYMBOL_LIST_NG: SP_UNIQUE_SYMBOL_LIST_NG,//--特殊軸NG模式當中會出現的特殊牌組(包含wild和scatter)
    UNIQUE_SYMBOL_LIST_FG: SP_UNIQUE_SYMBOL_LIST_FG,//--特殊軸FG模式當中會出現的特殊牌組(包含wild和scatter)
} = SP_BOARD;

const { ccclass, property } = _decorator;


/**
 * 這個是slotMachine對外操作的reel類別
 */
@ccclass('UniReel1024')
export class UniReel1024 extends UniReel<SymbolNumber1024, UniIcon1024> implements IChangeReelsColor {

    //private _currentRandomData: Map<number, number[]> = new Map<number, number[]>();
    //---要結果軸的資料
    //private _resultData: Map<number, { cards: number[], randomLen: number }> = new Map<number, { cards: number[], randomLen: number }>();
    private _resultData: number[] = [];//--結果資料(純number)

    public override init(reelID: number): void {
        super.init(reelID);
        //this.onStartRoll = this.upBouncing;
    }

    public setInitIconData(data: number[]): void {

        //--這邊產出來的數量是沒有包含前後補的2個..所以再補兩個
        const additionalData = this.generateRandomSymbolList(2);
        data.unshift(additionalData[0]);
        data.push(additionalData[1]);

        for (let i = 0; i < this.iconList.length; i++) {

            const icon: UniIcon1024 = this.iconList[i];
            const cloneInitData = data.slice();
            icon?.setRandomList(cloneInitData);
            const symbol = SymbolNumber1024.pool.instance();
            symbol.symbolID = cloneInitData.length - 2;
            icon.symbol = symbol;
        }
    }

    //--產完reel後要注入代理擁有者
    public injectAniService(proxyOwner: IDIAgentFactory): void {

        for (let i = 0; i < this._iconList.length; i++) {
            const icon = this._iconList[i];
            icon.injectAniService(proxyOwner);
        }
    }

    public reset(): void {

        for (let i = 0; i < this._iconList.length; i++) {
            const icon = this._iconList[i];
            icon.reset();
        }
    }

    /**
     * 20251208-舊有的fastStopRoll不在uniReel裡面處理
     * 將舊有的fastStopRoll改成clearRandomData
     * <實際上裡面的功能是相同的>
     */
    public clearRandomData(): void {

        while (this.data.count > this.iconAmount + 2) { //把隨機資料直接移除直到剩餘伺服器資料
            let data = this.data.dequeue();
            this.destroySymbol(data);
        }
    }

    protected override createIcon(amount: number): void {

        this._iconList = [];
        for (let index = 0; index < amount; index++) {
            let icon: UniIcon1024 = instantiate(this.iconPrefab).getComponent(UniIconBase);
            icon._iconTestId = this.reelID + '_' + index;
            icon.node.setParent(this.node);
            icon.init(this.reelID);//-塞reelID進去
            this._iconList.push(icon);
        }
    }

    //=========================取得目前軸上顯示的icon資料=============================
    /**
     * 取出這個軸盤面上結果的dropReel
     * @returns 
     */
    public getCurrentResultDropReel(): UniDropReel1024 {

        for (let i = 0; i < this._iconList.length; i++) {
            const icon = this._iconList[i];
            if (icon.isResultIcon) {
                return icon.dropReel;
            }
        }
        return null;
    }

    /**
     * 取出這個軸盤面上裝載結果reel的icon
     */
    public getCurrentIconForDropReel(): UniIcon1024 {

        for (let i = 0; i < this._iconList.length; i++) {
            const icon = this._iconList[i];
            if (icon.isResultIcon) {
                return icon;
            }
        }
        return null;
    }

    /**
     * 取出這個軸盤面上指定index的dropIcon
     * @param iconIndex 
     * @returns 
     */
    public getCurrentDropIcon(iconIndex: number): UniDropIcon1024 {

        const dropReel = this.getCurrentResultDropReel();
        if (dropReel) {
            return dropReel.getDropIcon(iconIndex);
        }
    }

    /**
     * 取出這個軸的icon資料
     * @returns 
     */
    public getWholeIconsInReel(): UniDropIcon1024[] {

        const dropReel = this.getCurrentResultDropReel();
        if (dropReel) {
            return dropReel.getAllDropIcons();
        }
        return [];
    }


    //=========================取得目前軸上顯示的icon資料=============================

    public testRandom(): void {

        let len = this._iconList.length;
        let symbol: SymbolNumber1024;
        for (let i = 0; i < len; i++) {
            const icon = this._iconList[i];
            symbol = icon.symbol;
            //--在初始化的時候因為沒有走initIconSymbol所以symbol會是null
            if (symbol) {
                this.destroySymbol(symbol);
            }
            icon.symbol = this.getData(icon);
        }
    }

    //--這裡整個複寫掉

    protected override setIconData(movement: UniMovement): void {

        let moveOutIndex = this.inverseDirection ? 0 : this.iconList.length - 1;

        let moveOutSymbol = this.iconList[moveOutIndex].symbol;
        if (moveOutSymbol !== null && moveOutSymbol !== undefined) {
            this.destroySymbol(moveOutSymbol);
        } else {
            console.warn('moveOutSymbol is null or undefined,reelID:', this.reelID, 'iconIndex:', moveOutIndex);
        }

        this.iconList[moveOutIndex].symbol = this.getData(this.iconList[moveOutIndex]);
        this.onSetIconData?.(this.iconList[moveOutIndex].symbol, moveOutIndex);
    }

    /**
     * 只產生軸長度
     * @returns 
     */

    protected override getData(iconTarget?: UniIcon1024): SymbolNumber1024 {

        //--這邊產的就是每一個icon裡面的軸長度()
        //let symNum: SymbolNumber1024;//--每個icon當中裡面的dropReel軸長度
        if (this.data.count > 0) {

            const resultLenSymbol = this.data.dequeue();

            if (this._resultData.length == 0) {

                const randomReelDropListFinal = this.createRandomSymbolList(resultLenSymbol.symbolID);
                iconTarget?.setRandomList(randomReelDropListFinal);

            } else {

                //--這邊產出來的數量是沒有包含前後補的2個..所以再補兩個
                const additionalData = this.generateRandomSymbolList(2);
                let data = this._resultData.slice();
                data.unshift(additionalData[0]);
                data.push(additionalData[1]);
                iconTarget?.setResultData(data);
                this._resultData = [];
            }

            this.dequeueSymbol = resultLenSymbol;
        }
        else {
            const symNum = this.createRandomSymbol();
            //--依照長度產出亂數陣列(純number)
            const randomReelDropList = this.createRandomSymbolList(symNum.symbolID);
            iconTarget?.setRandomList(randomReelDropList);
            this.dequeueSymbol = symNum;
        }
        return this.dequeueSymbol;
    }

    /**
     * 這邊寫this.data--
     * @param symbolData drop的內容
     * @param randomDataLength 延遲產生的軸數量--
     */
    public setData(symbolData: number[], randomDataLength: number): void {

        this.data.clear();
        const resultLenSymBolNum = SymbolNumber1024.pool.instance();
        resultLenSymBolNum.symbolID = symbolData.length;
        //--將dropReel的結果資料存起來
        //this._resultData.set(this.reelID, { cards: symbolData, randomLen: randomDataLength });
        this._resultData = symbolData;
        let randomData: SymbolNumber1024[] = [];
        //根據randomDataLength生成隨機資料-要演多久決定在此資料的長度
        for (let index = 0; index < randomDataLength; index++) {
            //--剔除結果顯示的長度,這樣才能在getData的時候正確比對出來,把資料正確塞進DropReel裡面
            const symbol = this.getCutRandomSymbol(resultLenSymBolNum.symbolID);
            randomData.push(symbol);
        }

        //--[頭(延遲)-結果-尾]
        let resultData: SymbolNumber1024[] = [this.getCutRandomSymbol(resultLenSymBolNum.symbolID), resultLenSymBolNum, ...randomData];

        for (let index = resultData.length - 1; index >= 0; index--) {
            const symbol = resultData[index];
            this.data.enqueue(symbol);
        }

    }

    //======================sp4相關方法==========================================
    public async playSP4Ani(icons: number[]): Promise<void> {
        const currentDropIconReel = this.getCurrentResultDropReel();
        if (currentDropIconReel) {
            await currentDropIconReel.setSP4SymbolWinAni(icons);
        }
    }

    //======================reelRoll相關方法==========================================
    public onStopRoll = async (): Promise<void> => {

        const dropReel = this.getCurrentResultDropReel();
        if (dropReel) {
            //--寫資料
            dropReel.setSPSymbolAppearAni();
            await dropReel.registerMultipleReelData();
        }
    }
    //======================Drop相關方法==========================================
    public setDropReelData(symbolData: number[]): void {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            currentDropIconReel.setDropReelData(symbolData);
        }
    }

    public setVisibleDropIcon(iconIndex: number[], visible: boolean): void {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            currentDropIconReel.setVisibleDropIcon(iconIndex, visible);
        }
    }

    public async startDropRefill(removeIdList: number[]): Promise<void> {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            await currentDropIconReel.startDropRefill(removeIdList);
            //--drop完就寫盤面資料
        }
    }



    //======================Drop相關方法==========================================

    //======================wild補牌==========================================
    public setWildFillSymbol(wildInfoList: { reelIndex: number, iconIndex: number, symbolID: number }[]): void {
        //--上下兩個表演用的補牌
        const randomData: number[] = this.generateRandomSymbolList(2);
        const wilds: number[] = [];
        wilds.length = wildInfoList.length;
        wilds.fill(9);//--反正都是wild
        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            currentDropIconReel.setWildFillSymbol(wilds, randomData);
        }
    }

    public async updateExpand(): Promise<void> {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            await currentDropIconReel.updateExpand();
        }
    }

    //======================wild補牌================================================

    //=======================scatterAni相關=========================================
    public getScAniEndPromise(): Promise<void> | null {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            return currentDropIconReel.dropReel.getScAniEndPromise();
        }
        return null;
    }


    //=========================跨系統抽取資料區域=======================================
    public getWholeWorldPosOfIcons(): Partial<IPlayAniData>[] {

        const currentReel = this.getCurrentResultDropReel();
        if (currentReel) {
            return currentReel.getWholeWorldPosOfIcons();
        }
        return null;
    }

    public getSingleIconWorldPos(info: Pick<IReelInfo, "reelIndex" | "iconIndex">): Partial<IPlayAniData> {

        const currentReel = this.getCurrentResultDropReel();
        if (currentReel) {
            return currentReel.getSingleIconWorldPos(info);
        }
        return null;
    }

    public getMultipleIconWorldPos(info: Pick<IReelInfo, "reelIndex" | "iconIndex">[]): Partial<IPlayAniData>[] {

        const currentReel = this.getCurrentResultDropReel();
        if (currentReel) {
            return currentReel.getMultipleIconWorldPos(info);
        }
        return null;
    }
    //======================change icon color==========================================
    public setIconLight(isDark: boolean, iconIndex?: number[]): void {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            currentDropIconReel.dropReel.setIconLight(isDark, iconIndex);
        }
    }

    public setAllLightExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): void {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            currentDropIconReel.dropReel.setAllLightExcludeSymbolIds(isDark, excludeSymbolIds);
        }
    }

    public async setIconLightTween(isDark: boolean, iconIndex?: number[]): Promise<void> {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            await currentDropIconReel.dropReel.setIconLightTween(isDark, iconIndex);
        }
    }

    public async setIconLightTweenExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): Promise<void> {

        const currentDropIconReel = this.getCurrentIconForDropReel();
        if (currentDropIconReel) {
            await currentDropIconReel.dropReel.setIconLightTweenExcludeSymbolIds(isDark, excludeSymbolIds);
        }
    }
    //======================change icon color==========================================

    protected override initIconSymbol(): void {
        return;
    }


    /**
     * -這邊只產軸的長度-
     * 會藉由frameWork的流程把亂數set進去symbol裡面
     * @returns 
     */
    protected createRandomSymbol(): SymbolNumber1024 {

        const isSP_reel = SP_REEL_ID.includes(this.reelID);
        let randomIndex: number;

        if (isSP_reel) {

            randomIndex = SP_REEL_RANDOM_LIMIT_LIST[0];

        } else {
            const maxLimit = REEL_RANDOM_LIMIT_LIST[this.reelID];
            randomIndex = GameUtilsTools.getRangeRandomInt(2, maxLimit);

        }
        const symbol = SymbolNumber1024.pool.instance();
        symbol.symbolID = randomIndex;
        //console.log('createRandom::', symbol.symbolID, 'reelId:', this.reelID);
        return symbol;
    }

    /**
     * 這邊會產生一個剃除結果值的reel長度亂數
     * 這樣我要抽取的時候就可以很確定比對出來
     * @param cutNum 亂數要剃除的值
     */
    private getCutRandomSymbol(cutNum: number): SymbolNumber1024 {

        const isSP_reel = SP_REEL_ID.includes(this.reelID);

        let targetNum: number = 0;
        if (isSP_reel) {

            targetNum = SP_REEL_RANDOM_LIMIT_LIST[0];

        } else {

            const minValue = 2;
            const fullPool = new Set<number>();
            const maxValue = REEL_RANDOM_LIMIT_LIST[this.reelID];
            for (let i = minValue; i <= maxValue; i++) {
                if (i !== cutNum) {
                    fullPool.add(i);
                }
            }

            const validCandidates = Array.from(fullPool);//-轉陣列
            const index = Math.floor(Math.random() * validCandidates.length);
            targetNum = validCandidates[index];
        }

        const symbol = SymbolNumber1024.pool.instance();
        symbol.symbolID = targetNum;
        return symbol;

    }


    protected destroySymbol(symbol: SymbolNumber1024) {
        SymbolNumber1024.pool.destroy(symbol);
    }

    //=========================亂數資料產生區域=======================================
    private createRandomWithSymbolNum(amount: number): SymbolNumber1024[] {

        const randomSymbols: SymbolNumber1024[] = [];
        const randomNumbers = this.createRandomSymbolList(amount);
        for (let i = 0; i < randomNumbers.length; i++) {
            const symbol = SymbolNumber1024.pool.instance();
            symbol.symbolID = randomNumbers[i];
            randomSymbols.push(symbol);
        }
        return randomSymbols;
    }

    private createRandomSymbolList(lens: number): number[] {

        //const ranDomLen = this.iconAmount + 2;
        const ranDomLen = lens + 2;
        const additionalData = this.generateRandomSymbolList(ranDomLen);
        return additionalData;
        /*
        const getAmount = ranDomLen - this._currentRandomData.length;
        if (getAmount > 0) {
            const additionalData = this.generateRandomSymbolList(getAmount);
            this._currentRandomData.push(...additionalData);
            console.log('==========reelLength:', this.reelID, 'total length:', this._currentRandomData.length);
            this.testOutputRandomData();
        }*/

    }

    private generateRandomSymbolList(amount?: number): number[] {

        const sourceList = this.getTargetAllSymbolList();
        const uniqueList = this.getTargetUniqueSymbolList();
        const pickedSymbols: number[] = [];
        const possibleSymbols: number[] = [];
        const usedUniqueSymbols: number[] = [];

        const iconAmount = (amount) ? amount : this.iconAmount;
        // 產生所有可能的符號組合
        for (let i = 0; i < sourceList.length; i++) {
            possibleSymbols.push(sourceList[i]);
        }
        possibleSymbols.push(...uniqueList);
        // 隨機選擇符號
        for (let i = 0; i < iconAmount; i++) {
            if (possibleSymbols.length === 0) {
                break; // 如果沒有剩餘的符號，則跳出迴圈
            }
            const randomIndex = Math.floor(Math.random() * possibleSymbols.length);
            const symbolTarget = possibleSymbols[randomIndex];
            // 檢查唯一性
            if (uniqueList && uniqueList.includes(symbolTarget)) {
                if (usedUniqueSymbols.includes(symbolTarget)) {
                    // 如果已經使用過，則重新選擇
                    i--;
                    possibleSymbols.splice(randomIndex, 1); // 移除已經使用過的符號
                    continue;
                } else {
                    usedUniqueSymbols.push(symbolTarget);
                }
            }

            pickedSymbols.push(symbolTarget);
            possibleSymbols.splice(randomIndex, 1); // 移除已經選取的符號
        }

        return pickedSymbols;
    }

    private getTargetAllSymbolList(): number[] {

        //const globalGameState = GlobalAccessReader.getGlobalData(GameGlobalKeys.GameState);
        const globalGameState = GameState.NORMAL;
        const isSP_reel = SP_REEL_ID.includes(this.reelID);
        if (isSP_reel) {
            if (globalGameState == GameState.NORMAL) {
                return SP_ALL_SYMBOL_LIST_NG;
            } else if (globalGameState == GameState.FREE_GAME) {
                return SP_ALL_SYMBOL_LIST_FG;
            }
        } else {

            if (globalGameState == GameState.NORMAL) {
                return ALL_SYMBOL_LIST_NG;
            } else if (globalGameState == GameState.FREE_GAME) {
                return ALL_SYMBOL_LIST_FG;
            }
        }
    }

    private getTargetUniqueSymbolList(): number[] {

        //const globalGameState = GlobalAccessReader.getGlobalData(GameGlobalKeys.GameState);
        //--for test
        const globalGameState = GameState.NORMAL;
        const isSP_reel = SP_REEL_ID.includes(this.reelID);
        //--for test
        let targetList;

        if (isSP_reel) {

            if (globalGameState == GameState.NORMAL) {
                targetList = SP_UNIQUE_SYMBOL_LIST_NG;
            } else if (globalGameState == GameState.FREE_GAME) {
                targetList = SP_UNIQUE_SYMBOL_LIST_FG;
            }
            return targetList[0];

        } else {

            if (globalGameState == GameState.NORMAL) {
                targetList = UNIQUE_SYMBOL_LIST_NG;
            } else if (globalGameState == GameState.FREE_GAME) {
                targetList = UNIQUE_SYMBOL_LIST_FG;
            }
            return targetList[this.reelID];
        }

    }
}