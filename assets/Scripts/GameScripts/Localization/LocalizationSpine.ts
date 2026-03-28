import { _decorator, Component, resources, SpriteFrame } from 'cc';
import { SkeletonExtension } from '../../ArtTool/SkeletonExtension';
import { GameSetting, SlotRelayLang } from '../Definition';
import { SlotAttaches } from '../../ArtTool/SlotAttaches';
import { Debug } from '../../Utils/Core';

const { ccclass, requireComponent, property } = _decorator;

@ccclass('LocalizationSpine')
@requireComponent(SkeletonExtension)
export class LocalizationSpine extends Component {

    public async updateLocalization() {
        let lang = GameSetting.gameLang;
        await this.loadAllSpine(lang);
    }

    public async loadAllSpine(langKey: SlotRelayLang): Promise<void> {
        let promiseList: Promise<void>[] = [];
        const langString = SlotRelayLang[langKey];
        let localizationSpine = this.getComponent(SkeletonExtension);

        if (localizationSpine === null) {
            console.error(`Node "${this.node.name}" LocalizationSpine No SpineAttach`);
        }

        let attachments = localizationSpine.slotAttaches;

        for (let i = 0; i < attachments.length; i++) {
            let name = attachments[i].spriteFrame.name;
            promiseList.push(this.loadSpine(langString, name, attachments[i]));
        }

        await Promise.all(promiseList);
        localizationSpine.checkAndUpdateSlot();
    }

    private loadSpine(langString: string, name: string, attachment: SlotAttaches) {
        let path = `Game/ImageLocalization/${langString}/${name}/spriteFrame`;
        return new Promise<void>((resolve, reject) => {
            resources.load(path, SpriteFrame, (err, texture: SpriteFrame) => {
                if (err) {
                    console.log(err);
                    // 如果不存在該圖片，則使用英文圖片
                    if (err.message.includes("Bundle resources doesn't contain")) {
                        this.loadSpine(SlotRelayLang[SlotRelayLang.en], name, attachment)
                            .then(() => {
                                resolve();
                            })
                    }
                    else {
                        Debug.LogWarning("LocalizationSpine loadImage err: " + err.message);
                        resolve();
                    }
                }
                else {
                    attachment.spriteFrame = texture;
                    resolve();
                }
            });
        })
    }
}


