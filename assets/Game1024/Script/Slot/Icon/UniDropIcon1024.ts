import { _decorator, UIOpacity, Node, Size, Sprite, SpriteFrame, UITransform, v3, Vec2, tween } from 'cc';
import { UniDropIconBase } from '../ReferencePathForUniSlot';
import { SymbolNumber1024 } from '../SymbolNumber1024';
import { BkgChangeColor } from '../../MyUtils/BasicEffect/Components/BkgChangeColor';
import { AnimationController, AnimationControllersPoolManager, AnimationStateType, AniSysTools } from '../../ReferencePath';
import { MultiAniController } from '../../MyUtils/AnimationSystemV3/Components/MultiAniController';
const { ccclass, property } = _decorator;
const ENCODING_FACTOR = 100; // 用百位數來編碼
const WILD_LIST = [10]; // 1024遊戲的wild圖示ID列表
const SPIN4_SYMBOL_ID = 12;//--spin4的symbolID
@ccclass('UniDropIcon1024')
export class UniDropIcon1024 extends UniDropIconBase<SymbolNumber1024> {

    //@property({ range: [0, 255] })
    //protected darkBrightness: number = 0;
    //--美術78的要求
    //@property({ range: [0, 255], visible: true, tooltip: '美術要求在特殊時期要使用的漸變參數' })
    //protected _sp_darkBrightness: number = 0;
    @property({ type: BkgChangeColor, visible: true, tooltip: '用於改變spine顏色的背景顏色組件' })
    protected _bkgChangeColor: BkgChangeColor = null;

    @property({ type: Sprite, visible: true, tooltip: '用於顯示靜態圖示的Sprite' })
    protected _gameSprite: Sprite = null;

    @property({ type: Sprite, visible: true, tooltip: '用於顯示Wild擠壓效果表演的Sprite' })
    protected _showSprite: Sprite = null;

    @property(SpriteFrame)
    protected spriteFrameList: SpriteFrame[] = [];

    @property({ type: UIOpacity, visible: true, tooltip: '用於控制icon整體透明度的組件' })
    protected _uiOpacity: UIOpacity = null;

    private _aniSymbol: Node = null;// 用於存放spine動畫的節點
    private _hasScatterAniInThisRound: boolean = false;//--一個回合只播一次scatter出現動畫


    //--根據目前該軸的圖示數量來決定要顯示的圖示
    private _currentIconLength: number = 0;

    private _currentLanguage: string = 'en';

    //--一個回合只播一次scatter出現動畫
    set hasScatterAniInThisRound(value: boolean) {
        this._hasScatterAniInThisRound = value;
    }

    get hasScatterAniInThisRound(): boolean {
        return this._hasScatterAniInThisRound;
    }

    set currentIconLength(length: number) {
        this._currentIconLength = length;
    }

    set currentLanguage(lang: string) {
        this._currentLanguage = lang;
    }

    public override get symbol(): SymbolNumber1024 {
        return this._symbol;
    }

    public override set symbol(symbol: SymbolNumber1024) {
        this._symbol = symbol;
        this.setVisibleDropIcon(true);
        this.updateSymbol();
    }

    public init(): void {
        super.init();
        this._showSprite.node.active = false;
    }

    //--回收物件池做準備--因為是不固定的長度下,uniDropReel會不斷的銷毀與建立出iconPrefab

    public reSetIcon(): void {

        if (this._symbol) {
            SymbolNumber1024.pool.destroy(this._symbol);
            this._symbol = null;
        }
        this._hasScatterAniInThisRound = false;
        this.destroyIcon();
    }

    public destroyIcon(): void {

        if (this._aniSymbol) {
            this._aniSymbol.removeFromParent();
            //--進物件池
            this._aniSymbol = null;
        }
        this._gameSprite.spriteFrame = null; // 清除圖像
    }

    public setVisibleDropIcon(visible: boolean): void {
        this.node.active = visible;
        //const opacity = visible ? 255 : 0;
        //this._uiOpacity.opacity = opacity;
    }

    public updateSymbol(symbol?: SymbolNumber1024): void {

        if (symbol) {
            this._symbol = symbol;
        }
        const spriteFrameId = this.getCurrentIconSpriteFrameId();
        const spriteFrame = this.spriteFrameList.find((sf) => sf.name === spriteFrameId);
        if (spriteFrame) {
            this._gameSprite.spriteFrame = spriteFrame;
        } else {
            console.error('UniDropIcon1024 updateSymbol not found spriteFrameId=', spriteFrameId);
        }
    }

    public async playSP4Ani(aniSymbol: Node, offsetY: number = 0, prefabId: string): Promise<void> {

        if (this.symbol.symbolID === SPIN4_SYMBOL_ID) {

            this.findAndRemoveLeftoverNode();
            this._aniSymbol = aniSymbol;
            this._aniSymbol.active = true;
            this._gameSprite.node.active = false;
            this.node.addChild(this._aniSymbol);
            this._aniSymbol.setPosition(v3(0, offsetY, 0));
            const comp = AniSysTools.findAndGetIAniComponent(aniSymbol) as AnimationController;
            if (comp) {
                const aniState = { aniState: AnimationStateType.Win };
                await comp.playAniInPromise(aniState);
                AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, aniSymbol);
                this._aniSymbol = null;
                this._gameSprite.node.active = true;
            }

        }
    }

    public async addSymbolAniNode(aniSymbol: Node, offsetY: number = 0, prefabId: string): Promise<void> {

        this.findAndRemoveLeftoverNode();
        this._aniSymbol = aniSymbol;
        this._aniSymbol.active = true;
        this._gameSprite.node.active = false;
        this.node.addChild(this._aniSymbol);
        this._aniSymbol.setPosition(v3(0, offsetY, 0));

        const comp = AniSysTools.findAndGetIAniComponent(aniSymbol) as MultiAniController;
        if (comp) {
            const aniState = { aniState: this._currentIconLength + '_appear' }
            await comp.playAniInPromiseById('Root_AniSymbol', aniState);
            comp.goBackToDefault();
            aniSymbol.removeFromParent();
            AnimationControllersPoolManager.getInstance().pushInstanceToPool(prefabId, aniSymbol);
            this._aniSymbol = null;
            this._gameSprite.node.active = true;
        }


        //--應該可以刪了
        if (this._bkgChangeColor) {
            const darkValue = this._bkgChangeColor.getDarkBrightness(this._bkgChangeColor.colorState);
            if (darkValue != 255) {
                //--直接對那個動畫開始改變顏色
            }
        }
        //return { leftover: leftover };
    }

    //--取消..不需要了
    //private findAndRemoveLeftoverNode(aniSymbol?: Node): Node[] {
    private findAndRemoveLeftoverNode(): void {

        //const leftover: Node[] = [];
        if (this._aniSymbol && this._aniSymbol.isValid) {

            const aniLeftover = this._aniSymbol;
            //leftover.push(aniLeftover);
            this._aniSymbol.removeFromParent();
            this._aniSymbol = null;
            AnimationControllersPoolManager.getInstance().pushInstanceToPool('Scatter_Ani', aniLeftover);
            //this._gameSprite.spriteFrame = null; // 清除圖像
            //this._gameSprite.node.active = true;
            //this._aniWPos = v3(0, 0, 0);
        }

        //return leftover;
    }

    private getCurrentIconSpriteFrameId(): string {

        let targetSprId = 'icon_' + (this.symbol.symbolID + this._currentIconLength * ENCODING_FACTOR);
        //console.log('check_scatter_symbolId=', this.symbol.symbolID, ' currentIconLength=', this._currentIconLength, ' targetSprId=', targetSprId);
        //--特殊處理spin+4圖示-->掛語系
        if (this.symbol.symbolID === SPIN4_SYMBOL_ID) {
            targetSprId += `_${this._currentLanguage}`;
        }

        return targetSprId;
    }

    //============================================================================
    //--交給iconReel去設定wildExtraSprite(要補給來的也是)
    //--補自己的表演牌
    public setExtraWild(beforeTransVec2: Vec2): void {
        //--會根據目前的圖示數量來決定要顯示的圖示
        let spriteFrameId = this.getCurrentIconSpriteFrameId();
        const showSprFrame = this.spriteFrameList.find((sf) => sf.name === spriteFrameId);
        if (showSprFrame) {

            this._showSprite.spriteFrame = showSprFrame;
        }

        this._gameSprite.node.getComponent(UITransform).setContentSize(new Size(beforeTransVec2.x, beforeTransVec2.y));
        this._showSprite.node.getComponent(UITransform).setContentSize(new Size(beforeTransVec2.x, beforeTransVec2.y));
        this._showSprite.node.active = true;

    }

    //---先改變currentIconLength再去改變gameSprite/symbol
    public changeGameSpr(len: number, beforeTransVec2: Vec2): void {
        //--仿造一個一樣的
        let spriteFrameId = this.getCurrentIconSpriteFrameId();

        const showSprFrame = this.spriteFrameList.find((sf) => sf.name === spriteFrameId);
        if (showSprFrame) {
            this._showSprite.spriteFrame = showSprFrame;
            this._showSprite.node.active = true;
        }

        this._currentIconLength = len;

        spriteFrameId = this.getCurrentIconSpriteFrameId();
        const gameSprFrame = this.spriteFrameList.find((sf) => sf.name === spriteFrameId);
        if (gameSprFrame) {
            this._gameSprite.spriteFrame = gameSprFrame;
            //--撐開
            this._gameSprite.node.getComponent(UITransform).setContentSize(new Size(beforeTransVec2.x, beforeTransVec2.y));
        }
    }


    /**
     * 
     * @param transVec2 變形中的content size
     */
    public updateContentSize(transVec2: Vec2): void {
        this._showSprite.node.getComponent(UITransform).setContentSize(new Size(transVec2.x, transVec2.y));
        this._gameSprite.node.getComponent(UITransform).setContentSize(new Size(transVec2.x, transVec2.y));
    }

    public changeIcon(): void {

        if (this._symbol.symbolID != WILD_LIST[0]) {
            let opacity = this._showSprite.node.getComponent(UIOpacity);
            tween(opacity)
                .to(0.5, { opacity: 0 })
                .call(() => {
                    this._showSprite.node.active = false;
                    this._showSprite.node.getComponent(UIOpacity).opacity = 255;
                })
                .start();
            //this._showNode.active=false;
            //this._finalNode.getComponent(UITransform).setContentSize(new Size(beforeTransSize.x, beforeTransSize.y));     
        }
    }

    //============================change color================================================
    /**
     * false=正常顏色,true=變暗顏色
     * @param isDark 
     */
    public async setTweenBrightness(isDark: boolean): Promise<void> {

        if (this._bkgChangeColor) {
            if (isDark) {
                await this._bkgChangeColor.openTweenDark();
            } else {
                await this._bkgChangeColor.closeTweenDark();
            }
        }
    }

    /**
     * false=正常顏色,true=變暗顏色
     * @param isDark 
     */
    public setBrightness(isDark: boolean): void {
        if (this._bkgChangeColor) {
            if (isDark) {
                this._bkgChangeColor.openDark();
            } else {
                this._bkgChangeColor.closeDark();
            }
        }
    }



    private changeSymbolAniNodeColor(colorValue: number): void {

        /*
        if (this._aniSymbol) {

            const baseComponent = AniSysTools.findAndGetIAniComponent(this._aniSymbol) as IAnimationControl;
            if (HIGH_ODDS_SYMBOL_LIST.includes(this._symbol.symbolID)) {
                if (baseComponent && baseComponent instanceof MultiSpineController) {
                    let spineMap = baseComponent.getMultiSpineController();
                    for (const controller of spineMap) {
                        const sp = controller.spine;
                        sp.color = color(colorValue, colorValue, colorValue, sp.color.a);
                    }
                }
            } else if (SCATTER_LIST.includes(this._symbol.symbolID)) {

                if (baseComponent && baseComponent instanceof AnimationController) {
                    // 使用aniCtrl獨有的API
                    const aniCtrl: AnimationController = baseComponent as AnimationController;
                    if (aniCtrl && aniCtrl.isAEP_SPINE && aniCtrl.aepSpines.length > 0) {
                        for (const sp of aniCtrl.aepSpines) {
                            sp.color = color(colorValue, colorValue, colorValue, sp.color.a);
                        }
                    }
                }
            } else {
                //---??fuck..可能是wild這邊要在處理非MultiSpineController的型別(特別是animationController的狀態)
                if (baseComponent) {

                    if (!(<SpineController>baseComponent).spine) {
                        //console.log('wtf');
                    } else {
                        (<SpineController>baseComponent).spine.color = color(colorValue, colorValue, colorValue, (<SpineController>baseComponent).spine.color.a);
                    }
                }
            }
        } else if (this.checkWildIsExist() && this._symbol.symbolID == WILD_LIST[0]) {
            //有在包裝一層,且它是用AEP去控制spine
            const skeletons = this._wildNode[DYN_NODE_PROPERTIES.ANIMATION_CTRL].aepSpines;
            for (const sp of skeletons) {
                sp.color = color(colorValue, colorValue, colorValue, sp.color.a);
            }

        }*/
    }

}


