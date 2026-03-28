import { _decorator, Canvas, Color, Component, director, math, Node, Prefab, SpriteFrame, view, Widget } from 'cc';
import { Debug, KeySpriteFramePair } from '../../../Utils/Core';
import { MainUI, NewFlashModeEnum } from './MainUI';
import { MenuUI } from './MenuUI';
import { BetSelectUI } from './BetSelectUI';
import { AutoSpinSelectUI } from './AutoSpinSelectUI';
import { BottomBarUI } from './BottomBarUI';
import { GenericUIRes } from './GenericUIRes';
import { InfoType, InfoUI } from './InfoUI';
import { AUTO_INFINITY_NUMBER, MainUIBtnState } from './GenericUIConfig';
import { AudioManager } from '../../../Utils/Audio';
import { BuyFeatureMode, GenericSound, Orientation, SlotRelayLang, GameStatus } from '../../Definition';
import { Localization } from '../../Localization';
import { HistoryUI } from './HistoryUI';
import { FeatureSettingUI } from './FeatureSettingUI';
import { BuyFeatureInfoUI } from './BuyFeatureInfoUI';
import { BuyFeatureCardInfo } from './BuyFeatureCard';
import { RotationContentResize, ScreenAdapter } from '../../../Utils/Orientation';
import { AdaptWindowSize } from '../../../Utils/Adaptive';
import { PlayerInfo } from '../../Networks';
import { AutoSpinAreaUI } from '../Scripts/NewAutoSpin/AutoSpinAreaUI';
import { ConditionLine } from './NewAutoSpin';

const { ccclass, property } = _decorator;

@ccclass('GenericUIManager')
export class GenericUIManager extends Component {

    private static _instance: GenericUIManager = null;

    @property(GenericUIRes)
    public genericUIRes: GenericUIRes;

    @property(MainUI)
    private mainUI: MainUI;

    @property(MenuUI)
    private menuUI: MenuUI;

    @property(BetSelectUI)
    private betSelectUI: BetSelectUI;

    @property(AutoSpinSelectUI)
    private autoSpinSelectUI: AutoSpinSelectUI;

    @property(AutoSpinAreaUI)
    private autoSpinAreaUI: AutoSpinAreaUI;

    @property(BottomBarUI)
    private bottomBarUI: BottomBarUI;

    @property(InfoUI)
    private infoUI: InfoUI;

    @property(HistoryUI)
    private historyUI: HistoryUI;

    @property(FeatureSettingUI)
    private featureSettingUI: FeatureSettingUI;

    @property(BuyFeatureInfoUI)
    private buyFeatureInfoUI: BuyFeatureInfoUI;

    private currentTurboMode: NewFlashModeEnum = NewFlashModeEnum.None;
    private autoSpinUI: AutoSpinSelectUI | AutoSpinAreaUI = null;

    public onSpinBtnClickCallback: () => void = null;
    public onAutoSpinStartClickCallback: (autoTimes: number) => void = null;
    public onBetSelectBtnClickCallback: (betValues: number) => void = null;
    public onStopBtnClickCallback: () => void = null;
    public onMenuUIShowCallback: () => void = null;
    public onSetMainUIToSpinModeCallback: () => void = null;
    public onSetMainUIToNormalModeCallback: () => void = null;
    public onNewFlashBtnSwitch: (mode: NewFlashModeEnum) => void = null;
    public onFeatureSettingUIBuyBonusBtnClickCallback: () => void = null;
    public onBuyFeatureModeChangeCallback: (mode: BuyFeatureMode, multiply: number, cardIndex: number) => void = null;
    public newCheckConditionValidCallback: (conditionLine: ConditionLine) => boolean = null;
    public onShowAutoUICallback: () => void = null;

    private _isAutoMode: boolean = false;
    private _resizeMaximumSize: math.Size = new math.Size(0, 0);

    /**
     * 是否自動模式
     * @returns 是否為自動模式
     */
    public get isAutoMode(): boolean {
        return this._isAutoMode;
    }

    /**
     * 設定是否為自動模式
     * @param value 是或否
     */
    public set isAutoMode(value: boolean) {
        this._isAutoMode = value;
    }

    // 剩餘FG的次數，非FG時為-1，無限次數為9999
    private autoTimes: number = -1;

    private langKey: SlotRelayLang = SlotRelayLang.tw;

    /**
     * 獲取實例
     * @returns GenericUIManager
     */
    public static get instance(): GenericUIManager {
        if (this._instance === null) {
            Debug.LogWarning("GenericUIManager _instance 為空");
        }
        return this._instance;
    }

    /**
     * 載入
     */
    onLoad(): void {
        GenericUIManager._instance = this.node.getComponent(GenericUIManager);
    }

    /**
     *  初始化  
     * @param langKey 語系
     */
    init(langKey: SlotRelayLang, gameCanvasNode: Node, autoSpinAreasPrefab: Prefab[] = []): void {
        this.autoSpinUI = this.autoSpinAreaUI ? this.autoSpinAreaUI : this.autoSpinSelectUI;

        this.langKey = langKey;
        this.genericUIRes.init(); // singleton的第一次初始化
        this.mainUI.init();
        this.menuUI.init();
        this.betSelectUI.init();
        this.autoSpinUI.init(autoSpinAreasPrefab);
        this.bottomBarUI.init();
        this.infoUI.init();
        this.historyUI.init();
        this.featureSettingUI.init();
        this.buyFeatureInfoUI.init();

        this.bottomBarUI.addBottomRichTextSprite(this.genericUIRes.bottomTextSpriteFrameMaps);
        this.mainUI.onMenuBtnClickCallback = this.onMainUIMenuBtnClick.bind(this);
        this.mainUI.onBetBtnClickCallback = this.onMainUIBetBtnClick.bind(this);
        this.mainUI.onAutoBtnClickCallback = this.onMainUIAutoBtnClick.bind(this);
        this.mainUI.onSpinBtnClickCallback = this.onMainUIonSpinBtnClick.bind(this);
        this.mainUI.onStopAutoBtnClickCallback = this.onMainUIStopAutoBtnClick.bind(this);
        this.mainUI.onMainBGClickCallback = this.onMainBGClick.bind(this);
        this.mainUI.onSpecialBtnClickCallback = this.onMainUISpecialBtnClick.bind(this);
        this.mainUI.onStopBtnClickCallback = this.onMainUIStopBtnClick.bind(this);
        this.mainUI.onNewFlashBtnSwitchCallback = this.onMainUINewFlashBtnSwitch.bind(this);
        this.menuUI.onRuleBtnClickCallback = this.onMenuUIRuleBtnClick.bind(this);
        this.menuUI.onPayTableBtnClickCallback = this.onMenuUIPayTableBtnClick.bind(this);
        this.menuUI.onHistoryBtnClickCallback = this.onMenuUIHistoryBtnClick.bind(this);
        this.menuUI.onMenuUIHideCallback = this.onMenuUIHide.bind(this);

        this.autoSpinUI.onStartBtnClickCallback = this.onAutoSpinStartClick.bind(this);
        this.autoSpinUI.checkConditionValid = this.checkConditionValid.bind(this);

        this.betSelectUI.onBetSelectBtnClickCallback = this.onBetSelectUIBetSelectBtnClick.bind(this);
        this.betSelectUI.onUIActiveChange = this.onBetSelectUIActiveChange.bind(this);
        this.autoSpinUI.onUIActiveChange = this.onAutoSpinUIActiveChange.bind(this);


        this.menuUI.onBGBtnClickCallback = this.onMainBGClick.bind(this);
        this.infoUI.onBGBtnClickCallback = this.onMainBGClick.bind(this);
        this.historyUI.onBGBtnClickCallback = this.onMainBGClick.bind(this);
        this.betSelectUI.onBGBtnClickCallback = this.onMainBGClick.bind(this);
        this.autoSpinUI.onBGBtnClickCallback = this.onMainBGClick.bind(this);

        this.featureSettingUI.onBuyBonusBtnClickCallback = this.onFeatureSettingUIBuyBonusBtnClick.bind(this);
        this.buyFeatureInfoUI.onChangeBetValueCallback = this.onBuyFeatureInfoUIChangeBetValue.bind(this);
        this.buyFeatureInfoUI.onFinalBuyFeatureCardConfirmBtnClickCallback = this.onBuyFeatureInfoUIFinalBuyFeatureCardConfirmBtnClick.bind(this);
        this.featureSettingUI.onExtraBetToggleChangeCallback = this.onFeatureSettingUIExtraBetToggleChange.bind(this);
        this.featureSettingUI.onBuyBonusIconCloseClickCallback = this.onFeatureSettingUIBuyBonusIconCloseClick.bind(this);
        this.setMainUIKeyboardLock(true);

    }

    /**
     * 點擊主畫面背景
     */
    private onMainBGClick() {

        if (this.autoSpinUI.node.active ||
            this.betSelectUI.node.active ||
            this.menuUI.node.active ||
            this.infoUI.node.active ||
            this.historyUI.node.active) {
            AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        }

        this.hideAllUI();
    }

    /**
     * 點擊主畫面選單
     */
    private onMainUIMenuBtnClick() {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.hideAllUI();
        this.menuUI.showUI();
        this.mainUI.setMenuBtnActive(false);
        this.onMenuUIShowCallback?.();
    }

    /**
     * 隱藏所有UI
     */
    private hideAllUI() {
        this.autoSpinUI.hideUI();
        this.betSelectUI.hideUI();
        this.infoUI.hideUI();
        this.historyUI.hideUI();
        this.menuUI.hideUI();
        this.featureSettingUI.hideExtraBetTip();
    }

    /**
     * 點擊主畫面下注鈕
     */
    private onMainUIBetBtnClick() {
        if (this.betSelectUI.node.active === false) {
            AudioManager.instance.playGenericSound(GenericSound.Public_On);
            this.hideAllUI();
            this.betSelectUI.showUI();
        }
        else {
            AudioManager.instance.playGenericSound(GenericSound.Public_Off);
            this.betSelectUI.hideUI();
        }
    }

    /**
     * 點擊主畫面自動旋轉
     */
    private onMainUIAutoBtnClick() {
        if (this.autoSpinUI.node.active === false) {
            AudioManager.instance.playGenericSound(GenericSound.Public_On);
            this.hideAllUI();
            this.onShowAutoUICallback?.();
            this.autoSpinUI.showUI();
        }
        else {
            AudioManager.instance.playGenericSound(GenericSound.Public_Off);
            this.autoSpinUI.hideUI();
        }
    }

    /**
     * 點擊主畫面 Spin 按鈕
     */
    private onMainUIonSpinBtnClick() {
        this.menuUI.hideUI();
        this.hideUIToSpinMode();
        this.onSpinBtnClickCallback?.();
    }

    /**
     * 點擊開始自動 Spin
     * @param autoTimes 
     */
    private onAutoSpinStartClick(autoTimes: number) {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.autoTimes = autoTimes;
        this.hideUIToSpinMode();
        this.isAutoMode = true;
        this.mainUI.openAutoMode();
        this.onAutoSpinStartClickCallback?.(autoTimes);
    }

    private checkConditionValid(conditionLine: ConditionLine): boolean {
        return this.newCheckConditionValidCallback?.(conditionLine) ?? false;
    }

    /**
     * 點擊主畫面停止自動旋轉
     */
    private onMainUIStopAutoBtnClick() {
        AudioManager.instance.playGenericSound(GenericSound.Public_Off);
        this.stopAutoMode();
    }

    /**
     * 停止自動旋轉
     */
    public stopAutoMode() {
        if (this.isAutoMode) {
            this.mainUI.closeAutoMode();
            this.autoTimes = -1;
            this.isAutoMode = false;
        }
    }

    public disableAutoSpinConditions(conditionAreaIndex: number, shouldCloseConditionIndexes: number[]) {
        this.autoSpinUI.disableConditionLines(conditionAreaIndex, shouldCloseConditionIndexes);
    }

    /**
     * 更新Auto次數並檢查是否還可以Auto
     * @param context 額外檢查條件的參數
     * @returns 下一局是否還可以Auto
     */
    public checkAutoStatus(context?: any): boolean {
        if (this.autoTimes !== AUTO_INFINITY_NUMBER) {
            this.autoTimes--;
        }
        this.mainUI.setAutoCntLabel(this.autoTimes);

        const hasAutoNext = this.hasAutoNext(context);
        if (!hasAutoNext) {
            this.stopAutoMode();
        }

        return hasAutoNext;
    }

    /**
     * 檢查自動狀態
     * @param context 額外檢查條件的參數
     * @returns 下一局是否還可以Auto
     */
    public hasAutoNext(context?: any): boolean {
        // 滿足任一停止自動 spin 條件
        let isMeetsAnyStopCondition = context ? this.autoSpinUI.isMeetsAnyStopCondition(context) : false;
        // 下一局是否還可以Auto
        let hasAutoNext = this.autoTimes >= 0 && !isMeetsAnyStopCondition;
        return hasAutoNext;
    }

    /**
     * 點擊下注金額選單裡的金額按鈕
     * @param betValue 
     */
    private onBetSelectUIBetSelectBtnClick(betValue: number) {
        this.setBetValue(betValue);
        this.onBetSelectBtnClickCallback?.(betValue);

        if (GameStatus.isBuyBonusOn) {
            this.mainUI.setBuyFeatureBet(betValue * this.buyFeatureInfoUI.selectedCardInfo.multiply);
        }
        else if (GameStatus.isExtraBetOn) {
            this.mainUI.setBuyFeatureBet(betValue * this.featureSettingUI.extraBetMultiply);
        }
    }

    private onMenuUIRuleBtnClick() {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.infoUI.setTitle(Localization.instance.t("GenericUI.GAME_RULES"));
        this.infoUI.showUI(InfoType.Rule);
        this.menuUI.hideUI();
    }

    private onMenuUIPayTableBtnClick() {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.infoUI.setTitle(Localization.instance.t("GenericUI.PAYTABLE"));
        this.infoUI.showUI(InfoType.PayTable);
        this.menuUI.hideUI();
    }

    private onMenuUIHistoryBtnClick() {
        AudioManager.instance.playGenericSound(GenericSound.Public_On);
        this.menuUI.hideUI();
        this.historyUI.showUI()
    }

    private onMenuUIHide() {
        this.mainUI.setMenuBtnActive(true);
    }

    public presetHistoryUrl(url: string) {
        if (this.getHistoryBtnActive()) {
            this.historyUI.setHistoryUrl(url);
        }
    }

    public showBottomTextWinScore(score: number) {
        this.bottomBarUI.showWinScore(score);
    }

    public setBetValue(score: number) {
        this.bottomBarUI.setTotalBet(score);
    }

    public setMainUIToSpinMode() {
        this.mainUI.setToSpinMode();
        this.menuUI.setHistoryBtnEnable(false);
        this.featureSettingUI.setToSpinMode();
    }

    public setMainUIToNormalMode() {
        this.mainUI.setToIdleMode();
        this.menuUI.setHistoryBtnEnable(true);
        this.featureSettingUI.setToNormalMode();
    }

    /** 
     * @deprecated 請改用 !isStopBtnEnabled ，這個方法將在未來版本移除。
     */
    public get isStopClicked(): boolean {
        return !this.mainUI.isStopBtnEnabled;
    }

    public get isStopBtnEnabled(): boolean {
        return this.mainUI.isStopBtnEnabled;
    }

    public get isTurboOn(): boolean {
        return this.mainUI.isTurboOn();
    }

    private hideUIToSpinMode() {
        this.autoSpinUI.hideUI();
        this.betSelectUI.hideUI();
        this.infoUI.hideUI();
        this.historyUI.hideUI();
    }

    public setScreenBtnRoot(screenBtn: Node) {
        this.mainUI.setScreenBtnRoot(screenBtn);
    }

    public setUrl(urlPayTable: string, urlRule: string) {
        this.infoUI.setURL(InfoType.Rule, urlRule);
        this.infoUI.setURL(InfoType.PayTable, urlPayTable);
    }

    public showBottomTextFirst() {
        this.bottomBarUI.showBottomTextFirst();
    }

    private showBottomTextGaming() {
        this.bottomBarUI.showBottomTextGaming();
    }

    public showBottomTextIdle() {
        this.bottomBarUI.showBottomTextIdle();
    }

    public showBottomTextEmpty() {
        this.bottomBarUI.showBottomTextEmpty();
    }

    public showBottomTextStartSpin() {
        if (!this.isAutoMode) {
            this.showBottomTextGaming();
        }
        else {
            this.showBottomTextEmpty();
        }
    }

    public addBottomRichTextSprite(spriteFrameMap: KeySpriteFramePair[]) {
        this.bottomBarUI.addBottomRichTextSprite(spriteFrameMap);
    }

    public setBalance(balance: number) {
        this.bottomBarUI.setBalance(balance);
    }

    /** 
     * @deprecated 請改用 setMainUIStopBtnEnabled，這個方法將在未來版本移除。
     */
    public resetMainUIStopBtn() {
        this.mainUI.setStopBtnEnabled();
    }

    public setMainUIStopBtnEnabled() {
        this.mainUI.setStopBtnEnabled();
    }

    public addGamingShowTexts(text: string[]) {
        this.bottomBarUI.addGamingShowTexts(text);
    }

    public setBetSelectInfos(betValues: number[]) {
        this.betSelectUI.setInfos(betValues);
        this.buyFeatureInfoUI.setBetValueList(betValues);
    }

    private onMainUISpecialBtnClick() {

    }

    private onMainUIStopBtnClick() {
        this.onStopBtnClickCallback?.();
    }

    private onMainUINewFlashBtnSwitch(mode: NewFlashModeEnum): void {
        this.currentTurboMode = mode;
        this.onNewFlashBtnSwitch?.(mode);
    }

    public getCurrentTurboMode(): NewFlashModeEnum {
        return this.currentTurboMode;
    }

    public setBottomText(text: string) {
        this.bottomBarUI.setDebugText(text);
    }

    public setVersion(version: string) {
        this.bottomBarUI.setVersionText(version);
    }

    public setLogoText(logo: string) {
        this.bottomBarUI.setLogoText(logo);
    }

    private onBetSelectUIActiveChange(active: boolean) {
        if (active) {
            this.mainUI.setBetBtnState(MainUIBtnState.UIOpen);
        }
        else {
            this.mainUI.setBetBtnState(MainUIBtnState.Normal);
        }
    }

    private onAutoSpinUIActiveChange(active: boolean) {
        if (active) {
            this.mainUI.setAutoBtnState(MainUIBtnState.UIOpen);
            if (this.autoSpinAreaUI) {
                this.mainUI.setAutoBtnForNewPanel();
            }
        }
        else {
            this.mainUI.setAutoBtnState(MainUIBtnState.Normal);
        }
    }

    public setHistoryBtnActive(b: boolean) {
        this.menuUI.setHistoryBtnActive(b);
    }

    public getHistoryBtnActive(): boolean {
        return this.menuUI.getHistoryBtnActive();
    }

    public setMainBtnInteractable(b: boolean) {
        this.mainUI.setBetSpinAutoBtnInteractable(b);
    }

    /*
    public setHistoryBtnEnable(b: boolean) {
        this.menuUI.setHistoryBtnEnable(b);
    }
    */

    public forceClickMainUIStopBtn() {
        if (!this.isStopClicked) {
            this.mainUI.forceClickStopBtn();
        }
    }

    public setMainUIRightBtnVisible(b: boolean) {
        this.mainUI.setLandscapeRightBtnGroupVisible(b);
    }

    // 設定為true時，鎖上空白鍵 會觸發Spin與Stop的功能
    public setMainUIKeyboardLock(b: boolean) {
        this.mainUI.setKeyboardLock(b);
    }

    // 由於MainBG要能穿透點擊下方遊戲的UI 故將 preventSwallow 設定為 true
    // 會造成MainBG與其重疊的UI MouseEnter與MouseLeave事件互相快速交錯被觸發
    // 導致Hover效果無法正常顯示 ，故如果是全螢幕的遊戲被開啟時，有時要將MainBG關閉
    /*
    public setMainBGActive(b: boolean) {
        this.mainUI.setMainBGActive(b);
    }
    */

    // 獨立設定StopBtn的Active
    public setMainUIStopBtnActive(b: boolean) {
        this.mainUI.setStopBtnActive(b);
    }

    // public setMainUIStopBtnInteractable(b: boolean) {
    //     this.mainUI.setStopBtnInteractable(b);
    // }

    public setMainUISpinBtnActive(b: boolean) {
        this.mainUI.setSpinBtnActive(b);
    }

    public setMainUIRightDownBtnActive(b: boolean) {
        this.mainUI.setRightDownBtnActive(b);
    }

    public setMainUIAutoBtnActive(b: boolean) {
        this.mainUI.setAutoBtnActive(b);
    }

    public setMainUISpinBtnInteractable(b: boolean) {
        this.mainUI.setSpinBtnInteractable(b);
    }

    public show() {
        this.node.setScale(1, 1);
    }

    public hide() {
        this.node.setScale(0, 0);
    }

    public setBetUITitleLocalizationKey(key: string) {
        this.betSelectUI.setBetTitleLocalizationKey(key);
    }

    public setTwoLevelTurboMode(b: boolean) {
        this.mainUI.setTwoLevelTurboMode(b);

    }

    private onFeatureSettingUIBuyBonusBtnClick(): void {
        this.hideAllUI();
        this.buyFeatureInfoUI.showUI(this.betSelectUI.getSelectedBetValue());
        this.onFeatureSettingUIBuyBonusBtnClickCallback?.();
    }

    private onBuyFeatureInfoUIChangeBetValue(betIndex: number, betValue: number): void {
        this.betSelectUI.setSelectedBtn(betIndex);
        // 在BuyFeatureInfoUI中選擇下注金額後，是同點選注額改變
        this.onBetSelectUIBetSelectBtnClick(betValue);
    }

    public setBetSelectUIBetValue(betValue: number): void {
        let betIndex = PlayerInfo.betValueList.indexOf(betValue);
        this.betSelectUI.setSelectedBtn(betIndex);
        this.setBetValue(betValue);
    }

    // BuyFeatureCard的確認按鈕點擊事件
    private onBuyFeatureInfoUIFinalBuyFeatureCardConfirmBtnClick(cardInfo: BuyFeatureCardInfo, betValue: number, cardIndex: number): void {
        this.buyFeatureInfoUI.hideUI();
        this.featureSettingUI.setBuyBonusOn(true, cardInfo.icon);
        this.mainUI.setBuyFeatureLabelActive(true);
        this.mainUI.setBuyFeatureBet(betValue * cardInfo.multiply);
        this.onBuyFeatureModeChangeCallback?.(BuyFeatureMode.BuyBonus, cardInfo.multiply, cardIndex);
    }

    //  ExtraBetToggle Switch變更事件
    private onFeatureSettingUIExtraBetToggleChange(isOn: boolean): void {
        this.hideAllUI();
        this.mainUI.setBuyFeatureLabelActive(isOn);
        let betValue = this.betSelectUI.getSelectedBetValue();
        if (isOn) {
            this.mainUI.setBuyFeatureBet(betValue * this.featureSettingUI.extraBetMultiply);
            this.onBuyFeatureModeChangeCallback?.(BuyFeatureMode.ExtraBet, this.featureSettingUI.extraBetMultiply, null);
            this.featureSettingUI.showExtraBetTip();
        }
        else {
            this.onBuyFeatureModeChangeCallback?.(BuyFeatureMode.None, 1, null);
        }


    }

    // BuyBonusIcon關閉按鈕點擊事件
    private onFeatureSettingUIBuyBonusIconCloseClick(): void {
        this.mainUI.setBuyFeatureLabelActive(false);
        this.onBuyFeatureModeChangeCallback?.(BuyFeatureMode.None, 1, null);
    }

    // 設定BuyBonos卡片資訊
    public setBuyFeatureCardInfo(cardInfoList: BuyFeatureCardInfo[]): void {
        this.buyFeatureInfoUI.setCardAmount(cardInfoList.length);
        for (let i = 0; i < cardInfoList.length; i++) {
            this.buyFeatureInfoUI.setCardInfo(i, cardInfoList[i]);
        }
    }

    public setBuyBonusOpen() {
        GameStatus.isBuyBonusOpen = true;
        this.featureSettingUI.setBuyBonusOpen();
    }

    public setExtraBetOpen(multiply: number) {
        GameStatus.isExtraBetOpen = true;
        this.featureSettingUI.setExtraBetOpen(multiply);
    }


    public setFeatureSettingUIIconsActive(b: boolean): void {
        this.featureSettingUI.setAllIconsActive(b);
    }

    public setAutoResize(isOn: boolean) {
        if (isOn) {
            const rotationContentResize = this.getComponent(RotationContentResize);
            if (rotationContentResize != null) {
                rotationContentResize.destroy();
            }

            let adaptWindowSize = this.node.getComponent(AdaptWindowSize);
            if (adaptWindowSize === null) {
                adaptWindowSize = this.node.addComponent(AdaptWindowSize);
            }

            adaptWindowSize.maxSize = this._resizeMaximumSize;
            adaptWindowSize.onWindowResize(ScreenAdapter.UI_Orientation);
        } else {
            const adaptWindowSize = this.getComponent(AdaptWindowSize);
            if (adaptWindowSize != null) {
                adaptWindowSize.destroy();
            }

            let rotationContentResize = this.node.getComponent(RotationContentResize);
            if (rotationContentResize === null) {
                rotationContentResize = this.node.addComponent(RotationContentResize);
            }

            const size = view.getDesignResolutionSize();
            rotationContentResize.landscapeContent = size;
            rotationContentResize.portraitContent = new math.Size(size.height, size.width);
            rotationContentResize.onRotationResize(ScreenAdapter.UI_Orientation);
        }
    }

    public setAutoResizeMaximumSize(width: number, height: number) {
        this._resizeMaximumSize.width = width;
        this._resizeMaximumSize.height = height;

        const adaptWindowSize = this.getComponent(AdaptWindowSize);
        if (adaptWindowSize != null) {
            adaptWindowSize.maxSize = this._resizeMaximumSize;
            adaptWindowSize.onWindowResize(ScreenAdapter.UI_Orientation);
        }
    }

    public setBuyBonusIconBGInfo(opacity: number, color: Color): void {
        this.featureSettingUI.setBuyBonusIconBGInfo(opacity, color);
    }

    public setBuyBonusBtnCustomSprite(
        normalSpriteBG: SpriteFrame,
        pressedSpriteBG: SpriteFrame,
        hoverSpriteBG: SpriteFrame,
        disabledSpriteBG: SpriteFrame,
        normalSpriteCrown: SpriteFrame,
        pressedSpriteCrown: SpriteFrame,
        hoverSpriteCrown: SpriteFrame,
        disabledSpriteCrown: SpriteFrame,
        textPath: string
    ) {
        this.featureSettingUI.setBuyBonusBtnCustomSprite(
            normalSpriteBG,
            pressedSpriteBG,
            hoverSpriteBG,
            disabledSpriteBG,
            normalSpriteCrown,
            pressedSpriteCrown,
            hoverSpriteCrown,
            disabledSpriteCrown,
            textPath
        );
    }

    public getFeatureUIWidget(mode: BuyFeatureMode.ExtraBet | BuyFeatureMode.BuyBonus, orientation: Orientation): Widget {
        if (mode === BuyFeatureMode.ExtraBet) {
            if (orientation === Orientation.Landscape) {
                return this.featureSettingUI.extraBetLandscapeWidget;
            } else {
                return this.featureSettingUI.extraBetPortraitWidget;
            }
        } else {
            if (orientation === Orientation.Landscape) {
                return this.featureSettingUI.buyBonusLandscapeWidget;
            } else {
                return this.featureSettingUI.buyBonusPortraitWidget;
            }
        }
    }

    /** 
     * @deprecated 請改用 setExtraBetTipText，這個方法將在未來版本移除。
     */
    public updateExtraBetTipSpriteFrame(spritePath: string): void {
        // 已捨棄
    }

    public setExtraBetTipText(text: string): void {
        this.featureSettingUI.setExtraBetTipText(text);
    }

    public getAutoSpinAreasCustomData(): any[] {
        return this.autoSpinUI.getAreasCustomData();
    }
}


