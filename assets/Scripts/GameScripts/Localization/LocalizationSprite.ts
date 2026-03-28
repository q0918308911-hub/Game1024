import { _decorator, CCString, Component, Node, resources, Sprite, SpriteFrame } from 'cc';
import { GameSetting, SlotRelayLang } from '../Definition';
import { Debug } from '../../Utils/Core';

const { ccclass, requireComponent, property } = _decorator;

@ccclass('LocalizationSprite')
@requireComponent(Sprite)
export class LocalizationSprite extends Component {

    @property(CCString)
    resourcePath: string = '';

    public async updateLocalization() {
        let lang = GameSetting.gameLang;
        await this.loadImage(lang);
    }

    public loadImage(langKey: SlotRelayLang): Promise<void> {
        const langString = SlotRelayLang[langKey];
        if (this.resourcePath === "") {
            return Promise.resolve();
        }
        this.resourcePath = this.resourcePath.trim();
        if (this.resourcePath) {
            let path = `Game/ImageLocalization/${langString}/${this.resourcePath}/spriteFrame`;
            return new Promise<void>((resolve, reject) => {
                resources.load(path, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                    if (err) {
                        // 如果不存在該圖片，則使用英文圖片
                        if (err.message.includes("Bundle resources doesn't contain") && langKey !== SlotRelayLang.en) {
                            this.loadImage(SlotRelayLang.en)
                                .then(() => {
                                    resolve();
                                })
                        }
                        else {
                            Debug.LogWarning("LocalizationSprite loadImage err: " + err.message);
                            resolve();
                        }
                    }
                    else {
                        this.getComponent(Sprite).spriteFrame = spriteFrame;
                        resolve();
                    }
                });
            });
        }
        else {
            console.error(`Node "${this.node.name}" LocalizationSprite No resource path`);
            return Promise.resolve();
        }
    }
}


