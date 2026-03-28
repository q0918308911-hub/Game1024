import { CCFloat, Mask, Prefab, RealCurve, Size, UITransform, Vec2, _decorator, instantiate, tween, v2, v3, } from 'cc';
import { UniDropReel, UniIconBase, UniMovement } from '../ReferencePathForUniSlot';
import { SymbolNumber1024 } from '../SymbolNumber1024';
import { UniDropIcon1024 } from '../Icon/UniDropIcon1024'
//import { LayoutType } from 'db://assets/Scripts/ReelTemplate/ReelTemplate_3/Scripts/UniReel';
//--20251209--測試用路徑
import { GameState } from '../../MyUtils/GameStateConfigDef/GameStateConfigDef';
//--這個比較特殊一點要解構的方式抽出config裡面的變數就要單獨出來免得造成循環引用
import { DefinitionGameConfigData } from '../../DefinitionGameData1024/GameConfigInstance1024';
import { UniIcon1024 } from '../Icon/UniIcon1024';
import { EaseType, LayoutType } from 'db://assets/Scripts/ModuleEntry';
import { ChangeIconsColor } from '../../MyUtils/BasicEffect/Classes/ChangeIconsColor';
import { IDIAgentFactory } from '../DIFactory/IDIAgentFactory';
import { AnimationControllersPoolManager, IPlayAniData, IReelInfo, IRegisterObjectData } from '../../ReferencePath';
const {
    ALL_SYMBOL_LIST_NG,
    ALL_SYMBOL_LIST_FG,
    UNIQUE_SYMBOL_LIST_NG,
    UNIQUE_SYMBOL_LIST_FG,
    WILD_LIST,
    SCATTER_LIST,
    SP_REEL_ID,
    SP_BOARD
} = DefinitionGameConfigData;
/**
 * 巢狀解構特殊軸的設定
 * 在命名衝突的情況下加上前墜"S P _"來區分
 */
const {
    REEL_AMOUNT: SP_REEL_AMOUNT,
    REEL_SYMBOL_AMOUNT: SP_REEL_SYMBOL_AMOUNT,
    ALL_SYMBOL_LIST_NG: SP_ALL_SYMBOL_LIST_NG,//--特殊軸ng模式當中會出現的牌組
    ALL_SYMBOL_LIST_FG: SP_ALL_SYMBOL_LIST_FG,//--特殊軸fg模式當中會出現的牌組
    UNIQUE_SYMBOL_LIST_NG: SP_UNIQUE_SYMBOL_LIST_NG,//--特殊軸NG模式當中會出現的特殊牌組(包含wild和scatter)
    UNIQUE_SYMBOL_LIST_FG: SP_UNIQUE_SYMBOL_LIST_FG,//--特殊軸FG模式當中會出現的特殊牌組(包含wild和scatter)
} = SP_BOARD;

const enum PREFAB_ID {
    SCATTER_ANI = 'icon_11_inGame',
    SP4_ANI = 'icon_12_inGame'
}
/**
 * dropReel不用管多少長度,上一層的uniReel會去控制要產生的長度
 * 這邊負責生產出相對長度的亂數內容即可
 */
const { ccclass, property } = _decorator;
@ccclass('UniDropReel1024')
export class UniDropReel1024 extends UniDropReel<SymbolNumber1024, UniDropIcon1024> {

    @property({ type: CCFloat, visible: true, tooltip: '完成一軸的掉落所需時間(秒)' })
    public _moveSpeed: number = 800;//--掉落速度

    private _sizeMap: Map<number, Vec2> = new Map<number, Vec2>();//--icon數量 對應 icon尺寸
    private _currentRandomData: number[] = [];//--這裡每次要生就要生滿足iconAmount的數量
    private _resultData: number[] = [];//--結果資料(純number)   
    private _expandReelSize: number = 0;//--用於記錄目前reel被撐開的高度 
    private _currentReelSize: number = 0;//--用於記錄目前reel的高度
    private _wildLens: number[] = [];//--目前補了多少張wild牌
    private _changeColor: ChangeIconsColor = new ChangeIconsColor();
    private _isFastMode: boolean = false;
    private _aniCrossServiceProxyFactory: IDIAgentFactory;//--代理擁有者
    private _scAniEndPromise: Promise<void> | null = null;//--異步scatter動畫結束的promise

    public getDropIcon(icoIndex: number): UniDropIcon1024 {
        return this._iconList[icoIndex];
    }

    public getAllDropIcons(): UniDropIcon1024[] {
        return this._iconList;
    }

    //--開轉就洗掉
    public reset(): void {

        this.data.clear();
        this._resultData = [];
        this._expandReelSize = 0;
        this._currentReelSize = 0;
        this._wildLens = [];
    }

    public setFastModeState(isFast: boolean): void {
        this._isFastMode = isFast;
    }

    public setMoveInterval(speed: number): void {
        this.moveInterval = speed;
    }

    public getScAniEndPromise(): Promise<void> | null {
        return this._scAniEndPromise;
    }
    //=======================cross system ani service injection=========================
    //--產完reel後要注入代理擁有者
    public injectAniService(proxyOwner: IDIAgentFactory): void {
        this._aniCrossServiceProxyFactory = proxyOwner;
    }
    //=================override uniReel==================================================================

    public setInitData(reelId?: number): void {
        this.reelID = reelId !== undefined ? reelId : -1;

        this._sizeMap = new Map<number, Vec2>([
            [2, new Vec2(150, 210)],
            [3, new Vec2(150, 140)],
            [4, new Vec2(150, 104)],
            [5, new Vec2(150, 84)],
            [6, new Vec2(150, 70)],
            [7, new Vec2(150, 60)]
        ]);
        //--副盤的軸/mask大小要改變
        if (this.reelID === SP_REEL_ID[0]) {
            this.layoutType = LayoutType.Horizontal;
            this.iconSpacing = 10;
            const mask = this.node.getComponent(Mask);
            if (mask) {
                const uiTrans = this.node.getComponent(UITransform);
                if (uiTrans) {
                    uiTrans.contentSize = new Size(620, 104);
                }
            }

        }

    }

    /**
     * 寫入這次該軸要出現多少個Symbol--這裡要動態改變滾輪裡面icon的大小與數量
     * @param sizeLen 
     */
    public changeDropReelSize(sizeLen: number): void {

        this._iconAmount = sizeLen;
        const iconSize = this._sizeMap.get(sizeLen);
        if (iconSize) {
            this.iconSize = iconSize;
        }
    }

    public reInitIconSymbol(): void {
        this.initIconSymbol();//--這是protected方法--沒法度
    }
    /**
     * 重製整輪內容
     * (setData會呼叫)
     * 1.先洗掉原本的iconList-->
     * 2.重新建立iconList-->
     * 3.set size-->
     * 4.set speed-->
     * 5.重新排版-->
     * 6.初始化icon的symbol
     */
    public reSetReelContent(): void {
        //--洗掉原本的iconList

        this.cleanIconList();
        //--重新建立iconList
        this.createIcon(this._iconAmount + 2); // 預設預備兩個icon，上跟下
        //--set size---
        this.reSetIconSize();
        //--set speed---
        this.reSetSpeed();
        //--重新排版
        this.initLayout();
        //--初始化icon的symbol
        //this.initIconSymbol();
    }

    //----重置初始不連線的盤面
    public setInitBoardForReel(randomData: number[]): void {

        this.reSetReelContent();

        let data: SymbolNumber1024[] = this.initBeginRandomSymbol(randomData);
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.symbol = data[index];
        }
    }

    private reSetSpeed(): void {
        this.moveInterval = this._moveSpeed / this.iconList.length;
    }

    private reSetIconSize(): void {

        for (let i = 0; i < this.iconList.length; i++) {
            const icon = this.iconList[i];
            icon.currentIconLength = this._iconAmount;
        }
    }

    private cleanIconList(): void {

        //----之後再考慮要不要推回物件池
        for (let i: number = this._iconList.length - 1; i >= 0; i--) {
            const icon: UniDropIcon1024 = this._iconList[i];
            let symbol = icon.symbol;
            if (symbol !== null) {
                this.destroySymbol(symbol);
            }
            icon.destroyIcon();
            icon.node.removeFromParent();
            icon.node.destroy();
            this._iconList.splice(i, 1);
        }

        this._iconList = [];
    }

    private initBeginRandomSymbol(randomDataInput: number[]): SymbolNumber1024[] {

        //if (!this._initRandomData) return;
        const randomData = [];
        for (let i = 0; i < randomDataInput.length; i++) {
            let symbol = SymbolNumber1024.pool.instance();
            symbol.symbolID = randomDataInput[i];
            randomData.push(symbol);

            //const icon: UniDropIcon1024 = this._iconList[i + 1]; //-因為最上面有一個預備icon
            //icon.symbol = new SymbolNumber1024();
            //icon.symbol.symbolID = data[i];
        }
        return randomData;
    }

    protected override initIconSymbol(): void {

        let data = this.createRandomSymbolList();
        //console.log('initIconSymbol data==', this.reelID, data);
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.symbol = data[index];
        }
    }

    //=========================wild補牌/變形==================================================
    public async setWildFillSymbol(wilds: number[], randomData: number[]): Promise<void> {
        //--清洗整軸的盤面資訊
        //await this.multiUnRegisterOfReel();
        await this.unRegisterByThisReel();
        this._wildLens = wilds;
        const finalLen = this._iconAmount + wilds.length;
        this.setBaseExtraSpriteSelf(finalLen);
        this.createWildFillIconList(wilds, randomData);
        this._expandReelSize = this.setReelContentSize(this.iconSize, this._iconAmount + wilds.length);
        this._currentReelSize = this.setReelContentSize(this.iconSize, this._iconAmount);
        //await this.updateExpand();
        //await this.registerMultipleReelData();
    }

    //--開始變形
    public updateExpand(): Promise<void> {

        const startY = this._expandReelSize;
        const endY = this._currentReelSize;
        const currentContentSize = this.iconSize.clone();

        let state = {
            y: startY,
            hasReachedPercent: false// 完成百分比flag
        };
        const targetPercent = 0.3; // 目標 30%

        return new Promise<void>((resolve) => {
            tween(state)
                .to(0.3, { y: endY }, {
                    onUpdate: (target, ratio) => {
                        //--1.計算Y軸改變的比例
                        //@ts-ignore
                        let scaleMultiplier = target.y / startY;
                        const newIconSize = new Vec2(currentContentSize.x, currentContentSize.y * scaleMultiplier);

                        // 計算數值進度百分比 (不論變大或變小都適用) ---
                        // 公式: (當前 - 起始) / (終點 - 起始)
                        let valueProgressRatio = 0;
                        if (endY !== startY) {
                            //@ts-ignore
                            valueProgressRatio = (target.y - startY) / (endY - startY);
                        }

                        let canChange = false;
                        if (!state.hasReachedPercent && valueProgressRatio >= targetPercent) {
                            state.hasReachedPercent = true;
                            canChange = true;
                        }
                        //--利用比例去改變iconSize
                        this.updateIconsLayout(newIconSize, canChange);

                    }
                })
                .call(() => {
                    this.afterExpandTransform();
                    this.registerMultipleReelData();
                    resolve();
                })
                .start();
        })

    }


    /**
     * 1.寫回真正的iconSize
     * 2.寫回真正的amount
     * 3.重新設定深度
     * 4.寫回正確的_resultData
     */
    private afterExpandTransform(): void {

        this._iconAmount += this._wildLens.length;
        this.iconSize = this._sizeMap.get(this._iconAmount)!;
        //--重新設定深度
        this.changeSibling(this._iconList);
        this._resultData.splice(1, 0, ...this._wildLens);
        console.log();
    }

    private updateIconsLayout(size: Vec2, canChange: boolean): void {

        // 計算 Box 的底部 Y 座標 (相對於中心 0,0)
        const boxBottomY = -this._currentReelSize / 2;
        let count = 0;
        for (let i = this.iconList.length - 1; i >= 0; i--) {
            const icon = this.iconList[i];
            icon.updateContentSize(size);
            const targetY = boxBottomY + (count * size.y) - (size.y / 2);
            icon.node.setPosition(v3(0, targetY, 0));
            if (canChange) {
                icon.changeIcon();
            }
            count++;
        }
    }


    /**
     * 1.先計算虛幻中撐開的的reel高度
     * 2.利用漸變去逐步改變icon的size
     * 從reel的高度改變換出縮放值 再去與updateIocnSize結合
     * PS-可以利用layout
     * 1.每次改變後換算出目前的iocnSize,然後重新排版
     */
    private setReelContentSize(targetContentSize: Vec2, len: number): number {

        let totalHeight = 0;
        for (let i: number = 0; i < len; i++) {
            let childHeight = targetContentSize.y;
            totalHeight += childHeight;
        }
        return totalHeight;
    }

    /**
     * 
     * @param wilds --要補的wild symbolID列表
     * @param randomData 補充icon[0]表演上方補牌所需的randomData
     */
    private createWildFillIconList(wilds: number[], randomData: number[]): void {

        const finalLen = this._iconAmount + wilds.length;
        const firstPos = this._iconList[0].node.getPosition();
        for (let i = 0; i < wilds.length; i++) {

            let symbolNumber;
            let icon: UniDropIcon1024;
            if (i == 0) {
                //--塞在最上面補牌那格
                icon = this._iconList[0];
                icon.reSetIcon();
            } else {
                //--剩下的往上塞
                icon = instantiate(this.iconPrefab).getComponent(UniIconBase);
                icon.node.setParent(this.node);
                icon.init();
                icon.node.setPosition(v3(firstPos.x, firstPos.y + this.iconSize.y + this.iconSpacing, firstPos.z));
                this._iconList.unshift(icon);//--補到最前面
            }

            symbolNumber = SymbolNumber1024.pool.instance();
            symbolNumber.symbolID = wilds[0];
            icon.currentIconLength = finalLen;
            icon.symbol = symbolNumber;
            icon.setExtraWild(this.iconSize);
        }


        const extraIcon = instantiate(this.iconPrefab).getComponent(UniIconBase);
        extraIcon.node.setParent(this.node);
        extraIcon.init();
        const symbolNumber = SymbolNumber1024.pool.instance();
        symbolNumber.symbolID = randomData[0];
        extraIcon.currentIconLength = finalLen;
        extraIcon.symbol = symbolNumber;
        extraIcon.setExtraWild(this.iconSize);
        extraIcon.node.setPosition(v3(firstPos.x, firstPos.y + this.iconSize.y * 2 + this.iconSpacing, firstPos.z));
        this._iconList.unshift(extraIcon);
        //this._iconList.push(extraIcon);//--補到最前面(這樣用原本的layout就可行)

    }


    //--寫原本的牌的表演sprite node
    private setBaseExtraSpriteSelf(finalLen: number): void {

        const len = this.iconList.length - 1;
        const beforeSize = this._sizeMap.get(this._iconAmount);
        for (let i = 1; i < len; i++) {
            const icon = this.iconList[i];
            icon.changeGameSpr(finalLen, beforeSize);
        }
    }

    //=========================wild補牌/變形============================================

    //=========================處理特殊牌出現的動畫======================================
    //--20260127取消-超框了不能再reel裡面做.拔到showAniProcessController去做
    public async setSP4SymbolWinAni(iconIndex: number[]): Promise<void> {

        const promises: Promise<void>[] = [];
        for (let i = 0; i < iconIndex.length; i++) {
            const iconTarget = this._iconList[iconIndex[i]];//--因為iconList[0]是預備牌()
            const aniNode = AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(PREFAB_ID.SP4_ANI);
            const p = iconTarget.playSP4Ani(aniNode, 0, PREFAB_ID.SP4_ANI);
            promises.push(p);
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }

    }

    public setSPSymbolAppearAni(): void {

        const promises: Promise<void>[] = [];
        for (let i = 0; i < this._iconAmount; i++) {
            const iconTarget = this._iconList[i + 1];//--因為iconList[0]是預備牌()
            const symbolId = iconTarget.symbol.symbolID;
            const isScatter = SCATTER_LIST.includes(symbolId);
            const hsSCbeforeInRound = iconTarget.hasScatterAniInThisRound;

            if (isScatter && !hsSCbeforeInRound) {

                iconTarget.hasScatterAniInThisRound = true;
                const aniNode = AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(PREFAB_ID.SCATTER_ANI);
                const p = iconTarget.addSymbolAniNode(aniNode, 0, PREFAB_ID.SCATTER_ANI);
                promises.push(p);
            }
        }

        if (promises.length > 0) {
            this._scAniEndPromise = Promise.all(promises).then(() => {
                this._scAniEndPromise = null
            });
        }

    }

    //======================寫/清除-盤面資料============================================


    //--外層的uniReel轉完先寫一次
    //--增加wild補牌的支援也要寫一次
    public async registerMultipleReelData(): Promise<void> {

        if (this.reelID === 4) {
            console.log();
        }

        //const registerDataList: IReelInfo[] = [];
        const registerDataList: IRegisterObjectData[] = [];

        for (let i: number = 0; i < this._iconAmount; i++) {
            const iconTarget = this._iconList[i + 1];//--因為iconList[0]是預備牌()

            //const symbolId = iconTarget.symbol.symbolID;
            const reelIndex = this.reelID;
            const iconIndex = i + 1;
            //--寫資料
            iconTarget.symbol.reelIndex = reelIndex;
            iconTarget.symbol.iconIndex = iconIndex;
            /*
            const registerData: Partial<IPlayAniData> = {
                reelIndex,
                iconIndex,
                symbolId
            };*/

            const registerData: IRegisterObjectData = {
                reelIndex: iconTarget.symbol.reelIndex,
                iconIndex: iconTarget.symbol.iconIndex,
                symbolId: iconTarget.symbol.symbolID,
                obj: iconTarget.node,
                ownerId: this._aniCrossServiceProxyFactory.ownerId
            };
            registerDataList.push(registerData);
        }

        await this._aniCrossServiceProxyFactory.multiRegisterObjectDataFull(registerDataList);
    }

    public unRegisterByThisReel(): void {
        this._aniCrossServiceProxyFactory.unRegisterByReel(this.reelID);
    }

    public multiUnRegisterByReels(reelIndices: number[]): void {
        this._aniCrossServiceProxyFactory.multiUnRegisterByReels(reelIndices);
    }


    //--洗掉整軸的盤面資料--太慢啦-已改用unRegisterByThisReel
    public multiUnRegisterOfReel(): void {
        //multiUnRegister
        const unRegisterDataList: IReelInfo[] = [];
        for (let i: number = 0; i < this._iconAmount; i++) {
            const iconTarget = this._iconList[i + 1];//--因為iconList[0]是預備牌()

            const registerData: IReelInfo = {
                reelIndex: iconTarget.symbol.reelIndex,
                iconIndex: i + 1,
                symbolId: iconTarget.symbol.symbolID
            };
            unRegisterDataList.push(registerData);
        }
        this._aniCrossServiceProxyFactory.multiUnRegister(unRegisterDataList);
    }


    //======================Drop相關方法==========================================
    public async startDropRefillAsync(removeIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): Promise<void> {
        await super.startDropRefillAsync(removeIdList, ease, easedValueCustom);
        //--補scatter出現動畫
        this.setSPSymbolAppearAni();
        //--掉完就寫盤面資料
        this.unRegisterByThisReel();
        await this.registerMultipleReelData();
    }


    //--這裡不會有startDropIn<因為是整軸掉落>,但是refill會用到
    /*
    protected setIconData(movement: UniMovement): void {

        let moveOutIndex = this.inverseDirection ? 0 : this.iconList.length - 1;

        let moveOutSymbol = this.iconList[moveOutIndex].symbol;
        if (moveOutSymbol !== null) {
            this.destroySymbol(moveOutSymbol);
        }

        this.iconList[moveOutIndex].symbol = this.getData();
        this.onSetIconData?.(this.iconList[moveOutIndex].symbol, moveOutIndex);
    }*/


    /**
     * 1個icon裡面有一個dropReel
     * 這邊直接要寫就要寫整軸的資料
     */
    private setDropIconsData(targetIcon: UniIcon1024): void {

    }


    /*
    protected override getData(): SymbolNumber1024 {

        if (this.data.count > 0) {
            this.dequeueSymbol = this.data.dequeue();
        }
        else {
            this.dequeueSymbol = this.createRandomSymbol();
        }

        return this.dequeueSymbol;
    }*/

    //=========================結果資料區域=======================================
    public setResultData(cards: number[]): void {
        this._resultData = cards;
    }

    //========================reFill setData/get Data========================================
    public setData(symbolData: number[]): void {
        /*
        const isSPreel = (this.reelID === SP_REEL_ID[0]);
        if (isSPreel) {

            for (let index = 0; index < symbolData.length; index++) {
                const symbol = this.createRandomSymbol();
                symbol.symbolID = symbolData[index];
                this.data.enqueue(symbol);
            }

        } else {
            for (let index = symbolData.length - 1; index >= 0; index--) {
                const symbol = this.createRandomSymbol();
                symbol.symbolID = symbolData[index];
                this.data.enqueue(symbol);
            }
        }*/

        for (let index = symbolData.length - 1; index >= 0; index--) {
            const symbol = this.createRandomSymbol();
            symbol.symbolID = symbolData[index];
            this.data.enqueue(symbol);
        }

    }

    //=========================跨系統抽取資料區域=======================================
    public getWholeWorldPosOfIcons(): Partial<IPlayAniData>[] {

        const returnDataList: Partial<IPlayAniData>[] = [];
        for (let i = 0; i < this._iconAmount; i++) {
            const icon = this._iconList[i + 1];//--因為iconList[0]是預備牌()
            const worldPos = icon.node.getWorldPosition();
            //icon.node.worldPosition
            const playAniData: Partial<IPlayAniData> = {
                reelIndex: this.reelID,
                iconIndex: i + 1,
                symbolId: icon.symbol.symbolID,
                wPos: worldPos
            }
            returnDataList.push(playAniData);
        }
        return returnDataList;
    }

    public getSingleIconWorldPos(info: Pick<IReelInfo, "reelIndex" | "iconIndex">): Partial<IPlayAniData> {

        const icon = this._iconList[info.iconIndex];//--因為iconList[0]是預備牌()
        const worldPos = icon.node.getWorldPosition();
        const playAniData: Partial<IPlayAniData> = {
            reelIndex: this.reelID,
            iconIndex: info.iconIndex,
            symbolId: icon.symbol.symbolID,
            wPos: worldPos
        }
        return playAniData;
    }

    public getMultipleIconWorldPos(info: Pick<IReelInfo, "reelIndex" | "iconIndex">[]): Partial<IPlayAniData>[] {

        const returnDataList: Partial<IPlayAniData>[] = [];
        for (let i = 0; i < info.length; i++) {

            const data = this.getSingleIconWorldPos(info[i]);
            returnDataList.push(data);
        }
        return returnDataList;
    }


    public setVisibleDropIcon(iconIndex: number[], visible: boolean): void {

        for (let i = 0; i < iconIndex.length; i++) {
            const icon = this._iconList[iconIndex[i]];
            icon.setVisibleDropIcon(visible);
        }

    }

    //=========================亂數資料產生區域=======================================
    public setRandomList(randomList: number[]): void {
        this._currentRandomData = randomList;
    }

    /*
    private checkRandomPool(): void {

        const ranDomLen = this.iconAmount + 2;
        const getAmount = ranDomLen - this._currentRandomData.length;
        if (getAmount > 0) {
            const additionalData = this.generateRandomSymbolList(getAmount);
            this._currentRandomData.push(...additionalData);
            console.log('==========reelLength:', this.reelID, 'total length:', this._currentRandomData.length);
            this.testOutputRandomData();
        }

    }*/

    private testOutputRandomData(): void {
        for (let i = 0; i < this._currentRandomData.length; i++) {
            console.log('reelId:', this.reelID, 'randomData:', this._currentRandomData[i]);
        }
    }

    //--用來取代原本createRandomSymbol的功能-這邊一次生就是要生一整軸(他沒有逐步掉落的功能)
    private createRandomSymbolList(): SymbolNumber1024[] {

        const resultSymbols: SymbolNumber1024[] = [];
        //-如果resultData有值就用resultData(代表結果),沒有就用randomData
        if (this._resultData.length > 0) {
            console.log();
        }

        //let targetData = (this._resultData.length > 0) ? this._resultData.reverse() : this._currentRandomData;
        let targetData = (this._resultData.length > 0) ? this._resultData : this._currentRandomData;

        for (let i: number = 0; i < this._iconList.length; i++) {
            const symbol = SymbolNumber1024.pool.instance();
            symbol.symbolID = targetData[i];
            resultSymbols.push(symbol);
        }
        targetData = [];



        return resultSymbols;
    }

    //=========================changeIcon brightness=======================================
    public setIconLight(isDark: boolean, iconIndex?: number[]): void {
        this._changeColor.setIconLight(isDark, this._iconList, false, iconIndex);
    }

    public setAllLightExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): void {
        this._changeColor.setAllLightExcludeSymbolIds(isDark, this._iconList, false, excludeSymbolIds);
    }

    public async setIconLightTween(isDark: boolean, iconIndex?: number[]): Promise<void> {
        await this._changeColor.setIconLightTween(isDark, this._iconList, false, iconIndex);
    }

    public async setIconLightTweenExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): Promise<void> {
        await this._changeColor.setIconLightTweenExcludeSymbolIds(isDark, this._iconList, false, excludeSymbolIds);
    }

    //=========================changeIcon brightness=======================================

    //========抽象類別實作======================================================================
    protected createRandomSymbol(): SymbolNumber1024 {

        //this.checkRandomPool();
        const symbol = SymbolNumber1024.pool.instance();
        symbol.symbolID = this._currentRandomData.pop();
        return symbol;

    }
    protected destroySymbol(symbol: SymbolNumber1024) {
        SymbolNumber1024.pool.destroy(symbol);
    }


}