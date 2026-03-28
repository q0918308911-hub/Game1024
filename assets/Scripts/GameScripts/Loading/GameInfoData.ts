import { _decorator, CCString, Component, Node, resources, SpriteFrame } from 'cc';
import { SlotRelayLang } from '../Definition';
import { Debug } from '../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('GameInfoData')
export class GameInfoData {
    @property({
        displayName: "SpriteFrame",
        type: SpriteFrame,
        serializable: true,
    } as any)
    public spriteFrame: SpriteFrame | null = null;

    @property({
        displayName: "KeyI18n",
        type: CCString,
        serializable: true,
    } as any)
    public key: string;

    @property({
        displayName: "localizationSpriteKey",
        serializable: true,
    } as any)
    public localizationSpriteKey: string = "";

    public loadLocalizationKey(langKey: SlotRelayLang): Promise<void> {
        if (this.localizationSpriteKey) {
            return this.loadImage(langKey, this.localizationSpriteKey);
        }
        else {
            return Promise.resolve();
        }
    }

    public loadImage(langKey: SlotRelayLang, path: string): Promise<void> {
        const langString = SlotRelayLang[langKey];
        let resourcePath = path.trim();
        if (resourcePath) {
            let path = `Game/ImageLocalization/${langString}/${resourcePath}/spriteFrame`;
            return new Promise<void>((resolve, reject) => {
                resources.load(path, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                    if (err) {
                        // 如果不存在該圖片，則使用英文圖片
                        if (err.message.includes("Bundle resources doesn't contain") && langKey !== SlotRelayLang.en) {
                            this.loadImage(SlotRelayLang.en, path)
                                .then(() => {
                                    resolve();
                                })
                        }
                        else {
                            Debug.LogWarning("GameInfoData loadImage err: " + err.message);
                            resolve();
                        }
                    }
                    else {
                        this.spriteFrame = spriteFrame;
                        resolve();
                    }
                });
            });
        }
        else {
            console.error(`GameInfoData "${this.localizationSpriteKey}"  No resource path`);
            return Promise.resolve();
        }
    }
}


