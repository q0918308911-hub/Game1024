import { _decorator, AudioClip, Component, Node, resources } from 'cc';
import { AudioResource } from '../../Utils/Audio';
import { Debug, IdStringPair } from '../../Utils/Core';
import { SlotRelayLang } from '../Definition';

const { ccclass, requireComponent, property } = _decorator;

@ccclass('LocalizationSound')
@requireComponent(AudioResource)
export class LocalizationSound extends Component {

    @property([IdStringPair])
    private soundList: IdStringPair[] = [];

    public loadSound(langKey: SlotRelayLang) {
        let promiseList = this.soundList.map((item) => {
            return this.loadOneSound(langKey, item.content, item.key);
        });
        return Promise.all(promiseList);
    }

    private loadOneSound(langKey: SlotRelayLang, path: string, id: number): Promise<void> {
        const langString = SlotRelayLang[langKey];
        let _path = path.trim();
        if (_path) {
            let path = `Game/AudioLocalization/${langString}/${_path}`;
            return new Promise<void>((resolve, reject) => {
                resources.load(path, AudioClip, (err, audioClip: AudioClip) => {
                    if (err) {
                        // 如果不存在該圖片，則使用英文圖片
                        if (err.message.includes("Bundle resources doesn't contain") && langKey !== SlotRelayLang.en) {
                            this.loadOneSound(SlotRelayLang.en, path, id)
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
                        this.getComponent(AudioResource).soundAudioClipList[id] = audioClip
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


