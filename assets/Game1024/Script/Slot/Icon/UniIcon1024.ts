import { _decorator, Enum, Size, CCFloat, Prefab, Sprite, SpriteFrame, Vec2, v3, Node, Vec3, UITransform, NodeEventType, tween, RealCurve, Mask, instantiate } from 'cc';
import { UniIconBase } from '../ReferencePathForUniSlot';
import { SymbolNumber1024 } from '../SymbolNumber1024';
import { UniDropReel1024 } from '../Reel/UniDropReel1024';
import { EaseType } from 'db://assets/Scripts/ModuleEntry';
import { IDIAgentFactory } from '../DIFactory/IDIAgentFactory';
const { ccclass, property } = _decorator;

@ccclass('UniIcon1024')
export class UniIcon1024 extends UniIconBase<SymbolNumber1024> {


    @property({ type: Prefab, visible: true, tooltip: 'dropReel物件池預製體' })
    private _dropReel_poolPrefab: Prefab = null;



    private _dropReel: UniDropReel1024;
    private _isResultIcon: boolean = false;
    public _iconTestId: string = '';

    public override get symbol(): SymbolNumber1024 {
        return this._symbol;
    }

    public override set symbol(value: SymbolNumber1024) {
        this._symbol = value;
        //--產生dropReel 長度-
        this.setDropReelLength(value.symbolID);
    }

    get isResultIcon(): boolean {
        return this._isResultIcon;
    }

    get dropReel(): UniDropReel1024 {
        return this._dropReel;
    }

    //--開轉就洗掉
    public reset(): void {
        this._isResultIcon = false;
        this._dropReel.reset();
    }

    public override init(reelId?: number): void {

        super.init();
        const dropReelNode = instantiate(this._dropReel_poolPrefab);
        this.node.addChild(dropReelNode);
        this._dropReel = dropReelNode.getComponent(UniDropReel1024);
        this._dropReel.setInitData(reelId);


        //--這邊要改變init的邏輯..因為要塞初始盤面的亂數
        /**
         * 原本的邏輯是>>
         *   this.reelID = reelID;
         * ----->這一步開始要改變
            this.createIcon(this.iconAmount + 2); // 預備兩個icon，上跟下
            this.initLayout();
            this.initIconSymbol();
         */
        //this._dropReel.init(reelId);
        //-uniReel會去初始化icon
    }


    //--產完reel後要注入代理擁有者
    public injectAniService(proxyOwner: IDIAgentFactory): void {
        this._dropReel.injectAniService(proxyOwner);
    }

    //=================寫入結果==============================================================
    public setResultData(cards: number[]): void {
        this._isResultIcon = true;
        this._dropReel.setResultData(cards);
    }
    //==============產生dropReel亂數長度========================================================================
    public setRandomList(randomList: number[]): void {
        this._dropReel.setRandomList(randomList);
    }
    //==============DropReel setData========================================================================
    public setDropReelData(symbolData: number[]): void {
        this._dropReel.setData(symbolData);
    }




    /**
     * 只會運作一次，初始化隨機盤面長度
     * PS:這邊的資料是已經塞入上下兩個補充牌.所以真實盤面秀出來的長度會是data.length -2
     * @param data 
     */
    public initBeginRandomSymbol(data: number[]): void {

        this._dropReel.changeDropReelSize(data.length - 2);
        this._dropReel.setInitBoardForReel(data);
    }
    //--產生dropReel亂數的長度
    private setDropReelLength(length: number): void {

        this._dropReel.changeDropReelSize(length);
        this._dropReel.reSetReelContent();
        this._dropReel.reInitIconSymbol();
    }

    //--進場(軸為單位)
    public startDropIn(dropInIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {

    }

    //--出場(軸為單位)
    public startDropOut(dropOutIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {

    }

    //==============startDropRefillAsync==========================================================================
    public setVisibleDropIcon(iconIndex: number[], visible: boolean): void {
        this._dropReel.setVisibleDropIcon(iconIndex, visible);
    }

    //--填充(軸為單位)
    public async startDropRefill(removeIdList: number[]): Promise<void> {
        await this._dropReel.startDropRefillAsync(removeIdList);

    }

    public createDropReel(): void {

    }

    public reSetDropReel(): void {

    }
    //==============wild補牌======================================================================================
    /**
     * 
     * @param symbolID 
     * @param fillIndex 
     */
    public setWildFillSymbol(wilds: number[], randomData: number[]): void {
        //--取上下兩個表演用的補牌亂數
        this._dropReel.setWildFillSymbol(wilds, randomData);
    }

    public async updateExpand(): Promise<void> {
        await this._dropReel.updateExpand();
    }


}


