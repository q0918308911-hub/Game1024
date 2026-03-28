import { _decorator, assetManager, Component, EffectAsset, Material, Node, Sprite, SpriteFrame, UITransform, VideoClip } from 'cc';
import { PlayMode, WaninPlayer } from './WaninPlayer'


const { ccclass, property, requireComponent } = _decorator;

@ccclass('WaninAnimation')
@requireComponent(Sprite)
export class WaninAnimation extends Component {

    @property(VideoClip)
    public videoClipList: VideoClip[] = [];

    private player: WaninPlayer = null;
    private isLoaded: boolean = false;
    private sprite: Sprite;

    private onInitCompleteCallback: () => void = null;

    public init(onInitComplete: () => void = null): void {
        this.isLoaded = false;
        this.player = new WaninPlayer();
        this.onInitCompleteCallback = onInitComplete;
        this.sprite = this.getComponent(Sprite);
        this.loadEffectFromBundle()
            .then((effect) => {
                let material = new Material();
                material.initialize({
                    effectAsset: effect,
                });

                let height = this.node.getComponent(UITransform).height;

                let colorUVScale = height / (2 * height + 16);
                let alphaUVScale = height / (2 * height + 16);
                let alphaUVOffset = (height + 16) / (2 * height + 16);

                material.setProperty('colorUVScale', colorUVScale);
                material.setProperty('alphaUVScale', alphaUVScale);
                material.setProperty('alphaUVOffset', alphaUVOffset);

                this.sprite.setSharedMaterial(material, 0);
                return this.loadAsset();
            })
            .then(() => {
                this.isLoaded = true;
            });

    }

    protected update(dt: number): void {
        this.player?.update(dt);
    }

    private async loadAsset() {
        await this.loadMp4();
    }

    private async loadMp4(): Promise<void> {
        let url = [];
        for (let clipItem of this.videoClipList) {
            url.push(clipItem.nativeUrl);
        }
        await this.player.loadVideo(url);
        if (this.isLoaded === true) {
            return;
        }
        // 依照載入的影片開啟對應的Decoder
        this.player.createDecoder()
            .then(() => {
                // 建一個SpriteFrame
                const spriteFrame = new SpriteFrame();

                // 影片產生的RenderTexture  * 影片播放時會一直更新此RenderTexture
                spriteFrame.texture = this.player.GetRenderTexture();
                this.sprite.spriteFrame = spriteFrame;

                this.onInitCompleteCallback?.();

            })
    }

    // public play(mode: PlayMode = PlayMode.Once, list: number[] = [], onComplete?: () => void): void {
    //     this.player.play(mode, list);
    //     this.player.event.onEnd = () => {
    //         onComplete();
    //         // 清除事件
    //         this.player.event.onEnd = null;
    //     };
    // }

    public playOncePromise(clipIDs: number[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.playOnce(clipIDs, resolve);
        });
    }

    public playOnce(clipIDs: number[], onComplete?: () => void): void {
        if (this.isLoaded === false) {
            console.log('影片尚未載入完成');
            return;
        }
        let resultIDs = clipIDs.map((id) => id + 1);
        this.player.play(PlayMode.Once, resultIDs);

        this.player.event.onEnd = () => {
            // 清除事件
            this.player.event.onEnd = null;
            onComplete?.();
        };

    }

    public closeDecoder() {
        this.sprite.spriteFrame = null;
        this.player.closeDecoder();
        this.player.unloadVideo();
        // 要再使用要重新init一次
    }

    protected onDestroy(): void {
        this.player.closeDecoder();
    }

    public playLoop(clipIDs: number[]): void {
        if (this.isLoaded === false) {
            console.log('影片尚未載入完成');
            return;
        }
        let resultIDs = clipIDs.map((id) => id + 1);
        this.player.play(PlayMode.RepeatAll, resultIDs);
    }

    public pause(): void {
        this.player.pause(true);
    }

    public resume(): void {
        this.player.pause(false);
    }

    private async loadEffectFromBundle(): Promise<EffectAsset> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle('WaninPlayerEffect', (err, bundle) => {
                if (err) {
                    reject(err);
                    return;
                }
                bundle.load('playerEffect', EffectAsset, (err, effect) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(effect);
                    }
                });
            });
        });
    }
}


/*
        let a = this.clip._nativeAsset;
        console.log(a.innerHTML)
        const str = a.innerHTML
        const container = document.createElement("div"); // 創建一個容器
        container.innerHTML = str;
        const element = container.firstChild; // 取得轉換後的元素
        console.log(element.src); // <source> 元素
        
*/