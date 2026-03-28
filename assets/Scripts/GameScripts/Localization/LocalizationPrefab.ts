import { _decorator, CCString, Component, instantiate, Node, Prefab, resources, v3, Vec3 } from 'cc';
import { GameSetting, SlotRelayLang } from '../Definition';
import { Debug } from '../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('LocalizationPrefab')
export class LocalizationPrefab extends Component {

    @property(CCString)
    resourcePath: string = '';

    @property(Vec3)
    position: Vec3 = v3(0, 0, 0);

    @property(Vec3)
    scale: Vec3 = v3(1, 1, 1);

    public _targetNode: Node = null;

    private isLoaded: boolean = false;
    public onLoaded: (target: Node) => void = null;

    public async updateLocalization() {
        let lang = GameSetting.gameLang;
        await this.loadPrefab(lang);
    }

    public loadPrefab(langKey: SlotRelayLang): Promise<void> {
        if (this.isLoaded) {
            return Promise.resolve();
        }

        const langString = SlotRelayLang[langKey];
        this.resourcePath = this.resourcePath.trim();
        if (this.resourcePath) {
            this.isLoaded = true; // 避免重複加載
            let path = `Game/PrefabLocalization/${langString}/${this.resourcePath}`;
            return new Promise<void>((resolve, reject) => {
                resources.load(path, Prefab, (err, prefab: Prefab) => {
                    if (err) {
                        // 如果不存在該圖片，則使用英文資源
                        if (err.message.includes("Bundle resources doesn't contain")) {
                            this.isLoaded = false; // 如果語系不存在 設定加載flag為false 以便重新加載英文
                            this.loadPrefab(SlotRelayLang.en)
                                .then(() => {
                                    resolve();
                                })
                        }
                        else {
                            Debug.LogWarning("LocalizationPrefab loadPrefab err: " + err.message);
                            resolve();
                        }
                    }
                    else {
                        const newNode = instantiate(prefab);
                        this.node.addChild(newNode);
                        this.node.setPosition(this.position);
                        this.node.setScale(this.scale);
                        this._targetNode = newNode;
                        this.onLoaded?.(newNode);
                        this.isLoaded = true;
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

    public get targetNode(): Node {
        if (this._targetNode) {
            return this._targetNode;
        }
        else {
            console.warn(`targetNode 尚未加載完成，請先註冊 onLoaded 方法後接收`);
        }
    }
}


