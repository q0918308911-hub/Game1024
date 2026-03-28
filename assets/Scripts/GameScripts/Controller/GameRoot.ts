import '../../../Lib/externalDefinitions'; // 將自行定義的函式加入到全域範圍
import { _decorator, Canvas, Camera, Component, director, game, instantiate, JsonAsset, Node, Prefab } from 'cc';
import { NetworkHandler } from '../Networks/NetworkHandler';
import { GameSetting, GameStatus, SlotRelayLang } from '../Definition';
import { AudioManager, AudioResource } from '../../Utils/Audio';
import { GameController } from './GameController';
import { KeySpriteFramePair, Utility } from '../../Utils/Core';
import { Localization } from '../Localization';
import { ConditionLine, GenericUIManager, GenericUIRes, MessageBox, NewFlashModeEnum } from '../GenericUI/Scripts';
import { BetData, PlayerInfo } from '../Networks';
import { ErrorHandler } from '../../ErrorHandler/ErrorHandler';
import { ScreenAdapter } from '../../Utils/Orientation';

const { ccclass, property, requireComponent } = _decorator;


@ccclass('GameRoot')
@requireComponent(AudioResource)
export class GameRoot extends Component {

    @property(JsonAsset)
    public gameConfig: JsonAsset;

    // 是否為線上，會吃上面gameConfig的isOnline
    // 為true時，bet時要製作使用NetworkHandler sendBet功能的功能
    // 為false時，要製作使用假資料的功能，要在gameController自行設計
    protected isOnline: boolean = false;
    protected isExhibition: boolean = false;

    protected debugLocalization: boolean = false;
    protected debugLanguageKey: string = '';

    @property(Node)
    canvasNode: Node;

    @property(Prefab)
    genericUIPrefab: Prefab;

    @property(Node)
    genericUIRootNode: Node;

    @property(Prefab)
    messageBoxPrefab: Prefab;

    @property(Node)
    messageBoxRootNode: Node;

    @property(GameController)
    gameController: GameController;


    private gameNumber: number = 0; // 總部取牌館的遊戲編號 12103, 12104 等
    private gameID: string = ""; // 遊戲編號 Game1001, Game002 等
    private gameCode: string = ""; // 北分連線編號 W002 , W001 等
    public static canvas: Canvas = null;
    public static canvasCamera: Camera = null;
    private versionCode: string = '';

    @property(Node)
    public screenBtnRoot: Node;

    @property([Prefab])
    private autoSpinAreasPrefab: Prefab[] = [];

    @property([KeySpriteFramePair])
    private bottomTextSpriteFrameMaps: KeySpriteFramePair[] = [];

    public balanceAfterSpin: number = 0;
    public finalBalance: number = 0;

    protected onLoad(): void {
        GameRoot.canvas = this.canvasNode.getComponent(Canvas);
        GameRoot.canvasCamera = GameRoot.canvas.cameraComponent;

        if (GameStatus.isEnterFromGameStart) {
            GameRoot.canvas.enabled = false;
            this.scheduleOnce(() => {
                // 如果不晚 1 frame關掉，不知為啥DragNodeEvent拖曳功能或出問題 QQ
                GameRoot.canvasCamera.enabled = false;
            });
        }

        this.gameCode = Utility.getGameCode();

        this.gameID = this.gameConfig.json.gameID;
        this.gameNumber = this.gameConfig.json.gameNumber;
        this.isOnline = this.gameConfig.json.isOnline;
        this.isExhibition = this.gameConfig.json.isExhibition;
        this.debugLocalization = this.gameConfig.json.debugLocalization;
        this.debugLanguageKey = this.gameConfig.json.debugLanguageKey;
        this.versionCode = this.gameConfig.json.versionCode ?? '';

        if (true) {
            let fps = this.gameConfig.json.mobileFPS ?? 61;
            game.frameRate = fps;
        }
    }

    protected start(): void {
        if (GameStatus.isEnterFromGameStart === false) {
            this.loadLocalization();
        }
    }

    private loadLocalization() {
        let lang = this.getLanguage()
        Localization.instance.init(this.gameID, lang)
            .then(() => {
                this.init();
            });
    }

    public init() {

        return new Promise<void>((resolve) => {
            let genericUI = instantiate(this.genericUIPrefab);
            if (this.genericUIRootNode) {
                genericUI.setParent(this.genericUIRootNode);
            }
            if (director.getScene().getComponentInChildren(MessageBox) === null) {
                let messageBox = instantiate(this.messageBoxPrefab);
                if (this.messageBoxRootNode) {
                    messageBox.setParent(this.messageBoxRootNode);
                }
            }

            Promise.all(
                [
                    Localization.instance.updateAllSpriteAndLabel(SlotRelayLang[this.getLanguage()])
                ])
                .then(() => {
                    GenericUIManager.instance.init(Localization.instance.currentLangKey, this.canvasNode, this.autoSpinAreasPrefab);
                    // 更新 auto UI 區塊的文字語系
                    Localization.instance.updateAllLabel();
                    MessageBox.instance.init();
                    ErrorHandler.Instance.setShowErrorMessageCallback(
                        (title: string, content: string, isShowConfirm: boolean, callback?: Function) => {
                            MessageBox.instance.showMsgBox(title, content, isShowConfirm, callback);
                        }
                    );
                    director.getScene().getComponentInChildren(ScreenAdapter).forceResize();
                    GameSetting.gameLang = SlotRelayLang[this.getLanguage()];
                    let payTableURL = Utility.getPayTableURL(this.gameID, this.getLanguage());
                    let ruleURL = Utility.getRuleURL(this.gameID, this.getLanguage());

                    GenericUIManager.instance.onSpinBtnClickCallback = this.onGenericUISpinClick.bind(this);
                    GenericUIManager.instance.onBetSelectBtnClickCallback = this.onGenericUIBetSelectBtnClick.bind(this);
                    GenericUIManager.instance.onAutoSpinStartClickCallback = this.onGenericUIAutoSpinStartClick.bind(this);
                    GenericUIManager.instance.onMenuUIShowCallback = this.onGenericUIMenuUIShow.bind(this);
                    GenericUIManager.instance.onNewFlashBtnSwitch = this.onNewFlashBtnSwitch.bind(this);
                    GenericUIManager.instance.newCheckConditionValidCallback = this.checkConditionValid.bind(this);
                    GenericUIManager.instance.onShowAutoUICallback = this.onShowAutoUI.bind(this);

                    GenericUIManager.instance.setScreenBtnRoot(this.screenBtnRoot);
                    GenericUIManager.instance.setUrl(payTableURL, ruleURL);
                    GenericUIManager.instance.addBottomRichTextSprite(this.bottomTextSpriteFrameMaps);
                    GenericUIManager.instance.showBottomTextFirst();
                    AudioManager.instance.setGenericSoundAudioClips(GenericUIRes.instance.genericSoundAudioClipList);
                    AudioManager.instance.setSoundAudioClips(this.getComponent(AudioResource).soundAudioClipList);
                    AudioManager.instance.setMusicAudioClips(this.getComponent(AudioResource).musicAudioClipList);
                    GenericUIManager.instance.setBalance(PlayerInfo.balance);
                    PlayerInfo.updateBetValueList(GameSetting.platformBetValueList);
                    GenericUIManager.instance.setBetSelectInfos(PlayerInfo.betValueList);
                    this.gameController.init(this.gameNumber, this.isOnline);
                    this.gameController.onReceiveBetCallback = this.onGameControllerReceiveBet.bind(this);
                    this.gameController.forceChangeLanguage = this.forceChangeLanguage.bind(this);
                    if (NetworkHandler.instance.demo) {
                        GenericUIManager.instance.setBottomText('Demo');
                    }

                    if (NetworkHandler.instance.demo || this.isExhibition || !NetworkHandler.instance.isLogin) {
                        GenericUIManager.instance.setHistoryBtnActive(false);
                    }

                    // 在官網測試站登入時，顯示細單按鈕
                    if (NetworkHandler.instance.isLogin && Utility.isTestEnvironment() && NetworkHandler.instance.platform === 3) {
                        GenericUIManager.instance.setHistoryBtnActive(true);
                    }

                    if (NetworkHandler.instance.isLogin) {
                        GenericUIManager.instance.setBalance(PlayerInfo.balance);
                    }
                    else {
                        PlayerInfo.balance = 3000000;
                        GenericUIManager.instance.setBalance(PlayerInfo.balance);
                    }

                    // 一律不顯示左下方Logo功能
                    /*
                    if (GameSetting.isShowBottomAWLogo) {
                        GenericUIManager.instance.setLogoText(GameSetting.gameLogo);
                    }
                    else {
                        let gameName = Localization.instance.t(`GameName.${this.gameID.toLowerCase()}`);
                        GenericUIManager.instance.setLogoText(gameName);
                    }
                    */
                    let platform = NetworkHandler.instance.platform;
                    GenericUIManager.instance.setVersion(`v${platform}.${this.versionCode}`);

                    Utility.checkLabelBold(this.getLanguage());

                    if (!GameStatus.isEnterFromGameStart) {
                        // 如果不是從GameStart進入遊戲的話，直接開啟鍵盤功能(開發模式)
                        GenericUIManager.instance.setMainUIKeyboardLock(false);
                    }

                    // 取得初始盤面
                    return this.gameController.getLastPlantData()
                })
                .then(() => {
                    // 各遊戲最後的前置設定
                    return this.gameController.setupBeforeGame()
                })
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    console.error("GameRoot init error: ", err);
                });
        });


    }

    protected update(dt: number): void {
        NetworkHandler.instance.update(dt);
    }

    private onGenericUISpinClick() {
        this.gameController?.onStartSpin();
    }

    private onGenericUIBetSelectBtnClick(betValue: number) {
        this.gameController?.onUpdateBetValue(betValue);
    }

    private onGenericUIAutoSpinStartClick(autoTimes: number) {
        this.gameController?.onStartAuto(autoTimes);
    }

    private onGenericUIMenuUIShow() {
        // 預先設定細單網址 提前loading 免得打開的時候閃一下
        let historyJsonString = PlayerInfo.getHistoryJson(this.gameID);
        let historyURL = Utility.getHistoryURL(this.getLanguage(), historyJsonString);
        GenericUIManager.instance.presetHistoryUrl(historyURL);
    }

    private onNewFlashBtnSwitch(mode: NewFlashModeEnum) {
        this.gameController?.onNewFlashBtnSwitch(mode);
    }

    private checkConditionValid(conditionLine: ConditionLine): boolean {
        return this.gameController?.checkConditionValid(conditionLine) ?? false;
    }

    private onShowAutoUI() {
        this.gameController?.onShowAutoUI();
    }

    private onGameControllerReceiveBet(betData: BetData) {

    }

    private getLanguage(): string {
        let key: string = null;
        if (this.debugLocalization) {
            key = this.debugLanguageKey;
        }
        else {
            key = Utility.getURLLanguage();
        }
        return key;
    }

    public showCanvas(): void {

        GameRoot.canvas.enabled = true;
        GameRoot.canvasCamera.enabled = true;

        // 要按下continue後 才能把spin的空白鍵功能打開
        GenericUIManager.instance.setMainUIKeyboardLock(false);
        // 將MessageBox從GameStart移到GameScene
        let messageBoxNode = director.getScene().getComponentInChildren(MessageBox).node;
        if (this.messageBoxRootNode) {
            messageBoxNode.setParent(this.messageBoxRootNode);
        }

        this.gameController?.onContinueBtnClick();
    }

    public forceChangeLanguage(lang: SlotRelayLang) {
        let langStr = SlotRelayLang[lang];
        Localization.instance.setLanguage(langStr);
        Localization.instance.updateAllSpriteAndLabel(lang);

        this.debugLanguageKey = langStr;
        this.debugLocalization = true;

        let payTableURL = Utility.getPayTableURL(this.gameID, this.getLanguage());
        let ruleURL = Utility.getRuleURL(this.gameID, this.getLanguage());
        GenericUIManager.instance.setUrl(payTableURL, ruleURL);

    }

    public getIsExhibition(): boolean {
        return this.isExhibition;
    }
}


