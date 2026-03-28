import '../../../Lib/externalDefinitions'; // 將自行定義的函式加入到全域範圍
import { _decorator, Animation, AudioClip, Button, CCBoolean, Component, director, find, instantiate, JsonAsset, Node, Prefab, ProgressBar, SceneAsset, sp, Sprite, SpriteFrame, tween, UIOpacity, UITransform } from 'cc';
import { GameInfoUI } from './GameInfoUI';
import { GameInfoData } from './GameInfoData';
import { KeySpriteFramePair, Utility } from '../../Utils/Core';
import { NetAgent } from '../../NetAgent/NetAgent';
import { ConfigType, SwitchType, ThousandPlaceType } from '../../NetAgent/AgentDefine';
import { GameSetting, GameStatus, SlotRelayLang } from '../Definition';
import { GameRoot } from '../Controller';
import { Localization } from '../Localization';
import { AudioManager } from '../../Utils/Audio';
import { MessageBox } from '../GenericUI/Scripts';
import { NetworkEvent, NetworkHandler, PlayerInfo } from '../Networks';
import GameMachineInfo from '../../NetAgent/GameMachineInfo';
import { ErrorCode } from '../../ErrorHandler/ErrorHandleDefine';
import { ErrorHandler } from '../../ErrorHandler/ErrorHandler';
import { ScreenAdapter } from '../../Utils/Orientation';

const { ccclass, property } = _decorator;


const loadingBarBGContentSize = { width: 290, height: 15 };
const loadingBarContentSize = { width: 282, height: 8 };
let LOGO_Y_POS: number = 80;

const loadingBarPosition = { x: 0, y: -102 };

@ccclass('GameStart')
export class GameStart extends Component {

    @property(CCBoolean)
    private isNewLoading: boolean = false;

    @property(JsonAsset)
    public gameConfig: JsonAsset;

    //#region Config

    // 是否為展示模式，會吃上面gameConfig的isExhibition
    // 要出Demo版本時，請設為true，正式版請設為false
    // 為true時，會直接進入遊戲場景，不會連線webserver伺服器
    protected isExhibition: boolean = false;
    protected debugLocalization: boolean = false;
    protected debugLanguageKey: string = '';
    protected gameID: string = ""; // 遊戲編號 Game1001, Game002 等
    // protected gameCode: string = ''; //北分連線編號 W002 , W001 等
    protected idleTimeoutLimit: number = 600; // 閒置 timeout 時間，單位秒

    public isShowProgressBar: boolean = true;

    //#endregion

    @property(Prefab)
    messageBoxPrefab: Prefab;

    @property(Node)
    messageBoxRootNode: Node;

    @property(ProgressBar)
    private progressBar: ProgressBar

    @property(Node)
    private continueBtn: Node;

    @property(GameInfoUI)
    private gameInfoUI: GameInfoUI;

    // 靜態ApexWin的Sprite
    private apexWinSprite: Sprite;

    // 關閉 ApexWin 後，自定義的 Logo
    @property(SpriteFrame)
    private gameSplashLogo: SpriteFrame;

    // old loading
    @property({ type: GameInfoData, visible(this: GameStart) { return !this.isNewLoading } })
    private gameInfoDataList: GameInfoData[] = [];

    // old loading
    @property({ type: [KeySpriteFramePair], visible(this: GameStart) { return !this.isNewLoading } })
    private gameInfoSpriteFrameMaps: KeySpriteFramePair[] = [];

    @property(Node)
    private apexWin: Node;

    @property(AudioClip)
    private bgm: AudioClip;

    @property(AudioClip)
    private publicOn: AudioClip;

    private progress: number = 0;
    private gameScene: SceneAsset = null;
    private readonly LOGO_SPINE_ANIMATION_IN: string = 'in';
    private readonly LOGO_SPINE_ANIMATION_OUT: string = 'out';
    private readonly LOGO_ANIMATION_IN: string = 'ApexLogoShow';
    private readonly LOGO_ANIMATION_OUT: string = 'ApexLogoFadeout';

    private loginResolve: Function = null;

    private apexWinLogoNode: Node = null;


    protected async onLoad() {

        if (this.gameConfig) {
            this.gameID = this.gameConfig.json.gameID;
            // this.gameCode = this.gameConfig.json.gameCode;
            this.idleTimeoutLimit = this.gameConfig.json.idleTimeoutLimit;
            this.isExhibition = this.gameConfig.json.isExhibition;
            this.debugLocalization = this.gameConfig.json.debugLocalization;
            this.debugLanguageKey = this.gameConfig.json.debugLanguageKey;
        }

        if (this.isNewLoading) {
            this.apexWinLogoNode = find("Apex_Logo", this.apexWin);
        }
        else {
            this.apexWinLogoNode = find("Logo", this.apexWin);
        }
        this.apexWinLogoNode.active = false;
        this.apexWin.active = true;

        this.progressBar.node.active = false;
        this.progressBar.progress = 0;

        if (Utility.isDev() || this.isExhibition) {
            // 展示或是開發模式
            this.startGame();
        }
        else {
            // 上站環境連線北分
            const gameUrl = window.location.href;

            try {
                NetAgent.GetInstance().ParserBaseConfig(gameUrl)
                await NetAgent.GetInstance().AskWebConfig(ConfigType.SLOT);

                // 是否要show主頁AWLogo
                GameSetting.isShowAWLogo = NetAgent.GetInstance().PlayerInfo.webConfig?.PlatformSetting?.LoadingLogoType === SwitchType.Normal;
                // 是否要底部Bar的ApexWin
                GameSetting.isShowBottomAWLogo = NetAgent.GetInstance().PlayerInfo.webConfig?.PlatformSetting?.GameBottomLogoType === SwitchType.Normal;
                // 是否要購買功能金幣的AW Logo
                GameSetting.isShowCoinAWLogo = NetAgent.GetInstance().PlayerInfo.webConfig?.PlatformSetting?.BuyFeatureLogoType === SwitchType.Normal;
                // 平台下注金額列表
                GameSetting.platformBetValueList = NetAgent.GetInstance().PlayerInfo.webConfig?.PlatformSetting?.Range;
                // 是否需要交換千分位和小數點符號
                GameSetting.shouldSwapThousandAndDecimalSeparators = NetAgent.GetInstance().PlayerInfo.webConfig?.PlatformSetting?.ThousandPlace === ThousandPlaceType.EUR;

                GameSetting.payTableURL = NetAgent.GetInstance().PlayerInfo.webConfig?.GameSetting?.PayTable_Url;
                GameSetting.ruleURL = NetAgent.GetInstance().PlayerInfo.webConfig?.GameSetting?.GameRule_Url;
                GameSetting.historyURL = NetAgent.GetInstance().PlayerInfo.webConfig?.GameSetting?.PlayerHistory_Url;
                GameSetting.customData = NetAgent.GetInstance().PlayerInfo.webConfig?.GameSetting?.CustomData; // 如果設定網頁沒填，會是 undefined

                if (GameSetting.customData) {
                    try {
                        GameSetting.customDataJson = JSON.parse(GameSetting.customData);
                    }
                    catch (error) {
                        console.error('customData 轉 Json 失敗');
                        console.error(`customData 內容 : ${GameSetting.customData}`);
                    }
                }

                this.startGame();
            }
            catch (error) {
                //表示參數 Parser 失敗
                //ErrorHandler.Instance.TriggerError(PARSER_URL_FAIL);
                console.error(error);
                console.error("參數 Parser 失敗");
            }

        }
    }

    protected start(): void {

    }

    protected startGame() {

        this.setProgressInfo();

        director.addPersistRootNode(this.node);
        GameStatus.isEnterFromGameStart = true;

        if (!GameSetting.isShowAWLogo) {
            if (this.isNewLoading) {
                const newSpriteNode = new Node("Logo");
                newSpriteNode.setParent(this.apexWin);
                newSpriteNode.setPosition(0, LOGO_Y_POS, 0);
                newSpriteNode.layer = this.apexWin.layer;
                this.apexWinSprite = newSpriteNode.addComponent(Sprite);
            }
            else {
                this.apexWinSprite = find("Logo", this.apexWin).getComponent(Sprite);
                this.apexWinSprite.spriteFrame = this.gameSplashLogo;
                this.apexWinSprite.node.setScale(1, 1)
            }
            this.apexWinSprite.spriteFrame = this.gameSplashLogo;
            if (this.gameSplashLogo) {
                this.apexWinSprite.getComponent(UITransform).setContentSize(this.gameSplashLogo.rect);
            }
            else {
                console.error('關閉 ApexWin Logo後, 沒有設置獨立的遊戲Logo (gameSplashLogo)');
            }

        }
        this.apexWin.active = true;
        this.apexWinLogoNode.active = true;
        this.startLoad();
    }

    protected async startLoad() {
        try {

            let lang = this.getLanguage();
            GameSetting.gameLang = SlotRelayLang[lang];
            this.gameInfoUI.init(this.gameInfoSpriteFrameMaps);

            if (this.isNewLoading) {
                let spine = this.apexWin.getComponentInChildren(sp.Skeleton);
                if (spine) {
                    if (GameSetting.isShowAWLogo) {
                        await spine.playPromise(this.LOGO_SPINE_ANIMATION_IN);
                    }
                }
                else {
                    console.error('ApexWin spine not found');
                }
            }
            else {
                await this.apexWin.getComponent(Animation).playPromise(this.LOGO_ANIMATION_IN);
            }

            if (this.isShowProgressBar) {
                this.progressBar.node.active = true;
            }

            await Localization.instance.init(this.gameID, lang);
            await Localization.instance.updateAllSpriteAndLabel(SlotRelayLang[this.getLanguage()]);

            if (!this.isNewLoading) {
                let gameInfoPromiseList: Promise<void>[] = [];
                for (let item of this.gameInfoDataList) {
                    gameInfoPromiseList.push(item.loadLocalizationKey(SlotRelayLang[this.getLanguage()]));
                }
                await Promise.all(gameInfoPromiseList);
                this.gameInfoUI.setInfo(this.gameInfoDataList);
            }

            AudioManager.instance.playMusicClip(this.bgm);
            this.continueBtn.setActive(false);
            Utility.addEventHandlerToButton(this.continueBtn, this, 'onContinueBtnClick');
            this.continueBtn.getComponent(Button).interactable = true;

            let messageBox = instantiate(this.messageBoxPrefab);
            if (this.messageBoxRootNode) {
                messageBox.setParent(this.messageBoxRootNode);
            }
            MessageBox.instance.init();
            ErrorHandler.Instance.setShowErrorMessageCallback(
                (title: string, content: string, isShowConfirm: boolean, callback?: Function) => {
                    MessageBox.instance.showMsgBox(title, content, isShowConfirm, callback);
                }
            );

            await Promise.all([this.connectPromise(), this.loadScenePromise()]);
            // 等待連線和場景載入完成後，才會顯示繼續按鈕
            this.showContinueBtn();

            // 淡出 ApexWin Logo
            if (this.isNewLoading) {
                this.fadeOutLogo(this.apexWin);
                this.gameInfoUI.startDetect();
                this.gameInfoUI.playTargetSpine(0);
            }
            else {
                this.apexWin.getComponent(Animation).playPromise(this.LOGO_ANIMATION_OUT)
                    .then(() => {
                        this.apexWin.active = false;
                        this.gameInfoUI.startAutoChangePage();
                    });
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    private connectPromise(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.loginResolve = resolve;
            NetworkHandler.instance.init(this.gameID, this.idleTimeoutLimit, this.isExhibition);
            if (!this.isExhibition && !Utility.isDev()) {
                NetworkHandler.instance.addEventListener(NetworkEvent.Login, this.onLogin.bind(this)); // connectServer 後回傳
                NetworkHandler.instance.connectServer();
            }
            else {
                this.loginResolve();
            }
        });
    }

    private async loadScenePromise(): Promise<void> {
        director.getScene().getComponentInChildren(ScreenAdapter).forceResize();

        await this.loadScene();

        let gameRoot = director.getScene().getComponentInChildren(GameRoot);
        await gameRoot.init();

    }



    /**
     * 更新
     * @param dt NetAgent 的 Update 參數，但實際傳入並未使用
     */
    protected update(dt: number): void {
        NetworkHandler.instance.update(dt);
    }

    /**
     * 登入
     * @param isLogin 使否已登入
     * @param gameMachineInfo 遊戲機台資訊
     */
    private onLogin(isLogin: boolean, gameMachineInfo: GameMachineInfo) {
        if (isLogin) {
            PlayerInfo.balance = gameMachineInfo.Balance;
            PlayerInfo.userName = gameMachineInfo.Nickname;
            PlayerInfo.betMax = gameMachineInfo.MaxBet;
            PlayerInfo.betMin = gameMachineInfo.MinBet;
            PlayerInfo.machineID = gameMachineInfo.Id;
            PlayerInfo.buyFG = gameMachineInfo.BuyFG;
            PlayerInfo.lastPlant = gameMachineInfo.LastPlant;
            PlayerInfo.record = gameMachineInfo.Record;
            PlayerInfo.JP = gameMachineInfo.JP;
            PlayerInfo.lastHistory = gameMachineInfo.LastHistory;
            PlayerInfo.result = gameMachineInfo.Result;

            this.loginResolve();
        }
        else {
            console.error('login fail');
            ErrorHandler.Instance.TriggerError(ErrorCode.Client_LoginFail);
        }
    }


    /**
     * 更新載入場景進度百分比
     * @param completedCount 已完成計數
     * @param totalCount 總計數
     * @param item ?未使用
     */
    private onProgress(completedCount: number, totalCount: number, item: any) {
        let p = completedCount / totalCount;
        //console.log(`p  ${p}  this.progress  ${this.progress}   `);

        if (p > this.progress) {
            // console.log(`completedCount  ${completedCount}  totalCount  ${totalCount}   ${p.fixed()}`);
            this.progress = p;
            this.progressBar.progress = this.progress;
        }
    }

    /**
     * 繼續鍵被觸發
     */
    private onContinueBtnClick() {
        AudioManager.instance.playSoundClip(this.publicOn);
        this.continueBtn.getComponent(Button).interactable = false;
        let gameRoot = director.getScene().getComponentInChildren(GameRoot);
        gameRoot.showCanvas();
        this.node.destroy();
    }


    /**
     * 顯示繼續鍵
     */
    public showContinueBtn() {
        this.continueBtn.setActive(true);
        this.progressBar.node.setActive(false);
    }

    /**
     * 取得語系
     * @returns 語系字串
     */
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

    private fadeOutLogo(logo: Node) {
        let opacity = logo.getComponent(UIOpacity);
        if (GameSetting.isShowAWLogo) {
            this.apexWin.getComponentInChildren(sp.Skeleton).setAnimation(0, this.LOGO_SPINE_ANIMATION_OUT, false);
        }
        tween(opacity)
            .to(0.2, { opacity: 0 })
            .start();

    }

    private async loadScene() {
        const scene = await Utility.preloadScenePromise(this.gameID, this.onProgress.bind(this))
        if (this.node) {
            this.gameScene = scene;
            await this.runScenePromise();
        }
    }

    private runScenePromise(): Promise<void> {
        return new Promise((resolve, reject) => {
            director.runScene(this.gameScene, null, () => {
                resolve();
            });
        });
    }

    private setProgressInfo() {

        if (this.isShowProgressBar === false) {
            LOGO_Y_POS = 0;
        }

        this.progressBar.node.active = false;
        this.progressBar.node.setParent(this.apexWin);
        this.progressBar.getComponent(UITransform).setContentSize(loadingBarBGContentSize.width, loadingBarBGContentSize.height);
        this.progressBar.node.setPosition(loadingBarPosition.x, loadingBarPosition.y);
        this.progressBar.totalLength = loadingBarContentSize.width;
        this.progressBar.barSprite.node.getComponent(UITransform).setContentSize(this.progressBar.totalLength, loadingBarContentSize.height);
        this.progressBar.barSprite.node.setPosition(-141, this.progressBar.barSprite.node.position.y);
        this.progressBar.progress = 0;
        if (!this.isNewLoading) {
            let logo = find("Logo", this.apexWin);
            logo.setPosition(0, LOGO_Y_POS);
        }
        else {
            let logo = find("Apex_Logo", this.apexWin);
            logo.setPosition(0, LOGO_Y_POS);
        }
    }
}
