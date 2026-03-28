import { _decorator, Button, CCString, Component, resources, Sprite, SpriteFrame } from 'cc';
import { ButtonStatus, GameSetting, SlotRelayLang } from '../Definition';
import { Debug } from '../../Utils/Core';
const { ccclass, requireComponent, property } = _decorator;

@ccclass('LocalizationButton')
@requireComponent(Button)
export class LocalizationButton extends Component {

    // 只填入按鈕前綴名稱 後面要加上 _狀態_語言名稱
    // btn_normal_tw  btn_pressed_tw  btn_hover_tw  btn_disabled_tw
    @property(CCString)
    resourcePath: string = '';

    public async updateLocalization() {
        let lang = GameSetting.gameLang;
        await this.loadButtonImage(lang);
    }

    public loadButtonImage(langKey: SlotRelayLang): Promise<void[]> {
        return Promise.all([
            this.loadImageByStatus(langKey, ButtonStatus.Normal),
            this.loadImageByStatus(langKey, ButtonStatus.Pressed),
            this.loadImageByStatus(langKey, ButtonStatus.Hover),
            this.loadImageByStatus(langKey, ButtonStatus.Disabled)
        ]);
    }

    private loadImageByStatus(langKey: SlotRelayLang, status: ButtonStatus): Promise<void> {
        const langString = SlotRelayLang[langKey];
        if (this.resourcePath === "") {
            return Promise.resolve();
        }
        this.resourcePath = this.resourcePath.trim();
        if (this.resourcePath) {
            let path = `Game/ImageLocalization/${langString}/${this.resourcePath}_${status}/spriteFrame`;
            return new Promise<void>((resolve, reject) => {
                resources.load(path, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                    if (err) {
                        // 如果不存在該圖片，則使用英文圖片
                        if (err.message.includes("Bundle resources doesn't contain") && langKey !== SlotRelayLang.en) {
                            this.loadImageByStatus(SlotRelayLang.en, status)
                                .then(() => {
                                    resolve();
                                })
                        }
                        else {
                            Debug.LogWarning("LocalizationButton loadImage err: " + err.message);
                            resolve();
                        }

                    }
                    else {
                        switch (status) {
                            case ButtonStatus.Normal:
                                this.getComponent(Button).normalSprite = spriteFrame;
                                this.getComponent(Button).target.getComponent(Sprite).spriteFrame = spriteFrame;
                                break;
                            case ButtonStatus.Pressed:
                                this.getComponent(Button).pressedSprite = spriteFrame;
                                break;
                            case ButtonStatus.Hover:
                                this.getComponent(Button).hoverSprite = spriteFrame;
                                break;
                            case ButtonStatus.Disabled:
                                this.getComponent(Button).disabledSprite = spriteFrame;
                                break;
                        }
                        resolve();
                    }
                });
            });
        }
        else {
            console.error(`Node "${this.node.name}" LocalizationButton No resource path`);
            return Promise.resolve();
        }
    }
}


