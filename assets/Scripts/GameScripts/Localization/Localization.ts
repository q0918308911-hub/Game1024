import { _decorator, assetManager, director, JsonAsset, Label, resources, RichText, Scene, TextAsset } from 'cc';
import { LocalizationSprite } from './LocalizationSprite';
import { LocalizationLabel } from './LocalizationLabel';
import { LocalizationButton } from './LocalizationButton';
import { LocalizationEvent } from './LocalizationEvent';
import { LocalizationPrefab } from './LocalizationPrefab';
import { LocalizationSpine } from './LocalizationSpine';
import { LocalizationSound } from './LocalizationSound';
import { EDITOR } from 'cc/env';
import { SlotRelayLang } from '../Definition';
import { Utility } from '../../Utils/Core';

export class Localization {
    private static _instance: Localization = null;

    /**
     * 獲取實例
     * @returns Localization
     */
    public static get instance(): Localization {
        if (this._instance === null) {
            this._instance = new Localization();
        }
        return this._instance;
    }

    private languages: any = {};
    private langKey: SlotRelayLang = SlotRelayLang.tw;
    public isInit: boolean = false;

    /**
     * 獲取當前語系代碼
     * @returns 語系代碼
     */
    public get currentLangKey(): SlotRelayLang {
        return this.langKey;
    }

    /**
     * 初始化
     * @param gameID 遊戲編號
     * @param langKey 語系代碼
     * @returns Promise
     */
    public init(gameID: string, langKey: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInit) {
                resolve();
                return;
            }
            let timestamp = new Date().getTime();
            let urlSystem = `https://${Utility.getHost()}/h5_game/cocos/Localization/json/Localization_System.json?timestamp=${timestamp}`;
            if (EDITOR) {
                urlSystem = urlSystem.replace('https://', 'http://');
            }
            this.setLanguage(langKey);

            Promise.all([this.getLocalizationData(urlSystem), this.getGameLocalizationData(gameID)])//GameID Example:Game1001;
                .then((jsonArrays) => {
                    for (let json of jsonArrays) {
                        if (json) {
                            let jsonData = json;
                            for (let langKey in jsonData) {
                                if (langKey) {
                                    if (!this.languages[langKey]) {
                                        this.languages[langKey] = {};
                                    }
                                    for (let dataKey in jsonData[langKey]) {
                                        if (dataKey) {
                                            this.languages[langKey][dataKey] = jsonData[langKey][dataKey];
                                        }
                                    }
                                }
                            }
                        }
                    }
                    this.updateAllSpriteAndLabel(this.langKey);
                    this.isInit = true;
                    resolve();
                })
                .catch((error) => {
                    console.error('Localization init error:', error);
                    resolve();
                });
        });
        // console.log("Localization init");
    }

    /**
     * 設定語系
     * @param langStr 語系字串
     */
    public setLanguage(langStr: string): void {
        let lang = (<any>SlotRelayLang)[langStr];
        if (lang === undefined) {
            console.error('無效語系字串 langStr:', langStr);
            lang = SlotRelayLang.tw;
        }
        this.langKey = (<any>SlotRelayLang)[langStr];;
    }

    /**
     * 取得語系代碼
     * @returns 語系代碼
     */
    public getLanguage(): SlotRelayLang {
        return this.langKey;
    }

    /**
     * 取得語系字串
     * @returns 語系字串
     */
    public getLanguageString(): string {
        if (SlotRelayLang[this.langKey] === undefined) {
            return SlotRelayLang[SlotRelayLang.en];
        }
        return SlotRelayLang[this.langKey];
    }

    /**
     * 取得 key 值
     * @param key key的資料路徑 ex: GenericUI.HISTORY.BET
     * @returns 對應 key 的語系資料
     */
    public t(key: string): string {
        let jsonData = this.languages?.[this.getLanguageString()];
        if (jsonData) {
            let result = this.getNestedProperty(jsonData, key);
            if (typeof result === 'string') {
                return result;
            } else {
                return key;
            }
        }
        return key;
    }

    /**
     * 取得巢狀(深層)物件屬性值
     * @param obj object 資料
     * @param path key的資料路徑 ex: GenericUI.HISTORY.BET
     * @returns 該屬性的值 ex: 押注
     */
    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * 解析本文文件
     * @param textAsset 本文文件 ex: .txt .csv .json
     */
    private parseTextAsset(textAsset: TextAsset): void {
        let jsonData = Papa.parse(textAsset.text).data;

        for (let i = 1; i < jsonData[0].length; i++) {
            let langKey = jsonData[0][i];
            if (langKey) {
                if (!this.languages[langKey]) {
                    this.languages[langKey] = {};
                }
                for (let j = 1; j < jsonData.length; j++) {
                    if (jsonData[j][0]) {
                        this.languages[langKey][jsonData[j][0]] = jsonData[j][i];
                    }
                }
            }
        }
    }

    /**
     * 更新所有語系文字
     */
    public updateAllLabel() {
        let localizationLabels = director.getScene().getComponentsInChildren(LocalizationLabel);
        for (let item of localizationLabels) {
            let t = this.t.bind(this);
            item.updateLabel(t);
        }
    }

    /**
     * 更新所有語系圖片及文字
     * @param lang 語系代碼
     * @returns Promise[]
     */
    public updateAllSpriteAndLabel(lang: SlotRelayLang): Promise<[void[], void[][], void[], void[], void[]]> {
        let scene: Scene = director.getScene();

        let localizationLabels = scene.getComponentsInChildren(LocalizationLabel);
        let localizationEvents = scene.getComponentsInChildren(LocalizationEvent);

        for (let item of localizationLabels) {
            let t = this.t.bind(this);
            item.updateLabel(t);
        }

        for (let item of localizationEvents) {
            item.process?.(lang);
        }

        this.checkFont(lang);

        return Promise.all([
            this.updateSpritesImage(lang),
            this.updateButtonImage(lang),
            this.updatePrefabLocalization(lang),
            this.updateSpineImage(lang),
            this.updateSound(lang)
        ]);
    }

    /**
     * 檢查使用字型
     * @param lang 語系
     */
    private checkFont(lang: SlotRelayLang) {
        let allLabels = director.getScene().getComponentsInChildren(Label);
        let allRichTexts = director.getScene().getComponentsInChildren(RichText);
        if (lang !== SlotRelayLang.tw && lang !== SlotRelayLang.cn) {
            for (let item of allLabels) {
                if (item.font?.name === 'NotoSansTC-Regular_Sub') {
                    if (item.string === "\u{221E}") {
                        // 非簡繁中文換系統字，不要處理到無限符號 ∞
                        continue;
                    }
                    item.useSystemFont = true;
                }
            }
        }

        for (let item of allRichTexts) {
            if (item.font?.name === 'NotoSansTC-Regular_Sub') {
                if (lang !== SlotRelayLang.tw && lang !== SlotRelayLang.cn) {
                    item.useSystemFont = true;
                }
            }
        }
    }

    /**
     * 更新 Sprite 圖片
     * @param lang 語系
     * @returns Promise[]
     */
    private updateSpritesImage(lang: SlotRelayLang): Promise<void[]> {
        let scene: Scene = director.getScene();
        let localizationSprites = scene.getComponentsInChildren(LocalizationSprite);
        let promises: Promise<void>[] = localizationSprites.map(v => v.loadImage(lang));
        return Promise.all(promises);
    }

    /**
     * 更新按鈕圖片
     * @param lang 語系
     * @returns Promise[][]
     */
    private updateButtonImage(lang: SlotRelayLang): Promise<void[][]> {
        let scene: Scene = director.getScene();
        let localizationButtons = scene.getComponentsInChildren(LocalizationButton);
        let promises: Promise<void[]>[] = localizationButtons.map(v => v.loadButtonImage(lang));
        return Promise.all(promises);
    }

    /**
     * 更新 Prefab 語系
     * @param lang 語系
     * @returns Promise[]
     */
    private updatePrefabLocalization(lang: SlotRelayLang): Promise<void[]> {
        let scene: Scene = director.getScene();
        let localizationPrefabs = scene.getComponentsInChildren(LocalizationPrefab);
        let promises: Promise<void>[] = localizationPrefabs.map(v => v.loadPrefab(lang));
        return Promise.all(promises);
    }

    /**
     * 更新 Spine 圖片
     * @param lang 語系
     * @returns Promise[]
     */
    private updateSpineImage(lang: SlotRelayLang): Promise<void[]> {
        let scene: Scene = director.getScene();
        let localizationSprites = scene.getComponentsInChildren(LocalizationSpine);
        let promises: Promise<void>[] = localizationSprites.map(v => v.loadAllSpine(lang));
        return Promise.all(promises);
    }

    /**
     * 更新聲音
     * @param lang 語系
     * @returns Promise
     */
    private updateSound(lang: SlotRelayLang): Promise<void[]> {
        let scene: Scene = director.getScene();
        let localizationSound = scene.getComponentInChildren(LocalizationSound);
        if (localizationSound) {
            return localizationSound.loadSound(lang);
        }
        else {
            return Promise.all([]);
        }
    }

    /**
     * 取得語系資料
     * @param url 語系資料的網址
     * @returns Promise<json資料>
     */
    private getLocalizationData(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                    return response.json()
                })
                .then((json) => {
                    resolve(json);
                })
                .catch((error) => {
                    console.warn('Failed to load JSON:', error);
                    resolve({});
                });
        });
    }

    /**
     * 取得本地端語系資料
     * @param gameID 遊戲編號
     * @returns Promise<json資料>
     */
    private getGameLocalizationData(gameID: string): Promise<any> {
        return new Promise((resolve, reject) => {
            gameID = gameID.replace('g', 'G');
            let path = `Game/MessageLocalization/Localization_${gameID}`;
            resources.load(path, JsonAsset, (err, jsonAsset: JsonAsset) => {
                if (err) {
                    console.warn('Failed to load JSON:', err);
                    resolve({});
                }
                else {
                    resolve(jsonAsset.json);
                }

            });
        });
    }

    /**
     * 取得本地端資料
     * @param jsonUrl json 資料網址
     * @returns Promise<json資料>
     */
    private getLocalizationDataAsset(jsonUrl: string): Promise<any> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote(jsonUrl, (err, data: JsonAsset) => {
                if (err) {
                    console.error('Failed to load JSON:', err);
                    reject(err);
                    return;
                }
                // 將加載的 JSON 資料解析
                let jsonData = null;
                try {
                    jsonData = data.json;
                    resolve(jsonData);
                    // 您可以在這裡使用解析後的資料
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                    reject(error);
                }
            });
        });
    }
}


