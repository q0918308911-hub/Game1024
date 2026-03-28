import { _decorator, sp, Texture2D } from 'cc';
import { SlotAttaches } from './SlotAttaches';
const { ccclass, property } = _decorator;


@ccclass('SkeletonExtension')
export class SkeletonExtension extends sp.Skeleton {
    @property({ tooltip: "是否需要創建新的 attachment, 如果為 false, 所有共享相同 attachment 的组件都將受影響。" })
    isCreateNew: boolean = true;

    @property(SlotAttaches)
    slotAttaches: SlotAttaches[] = [];

    private needUpdate: boolean = false;

    public onEnable(): void {
        super.onEnable();
        if (this.needUpdate) {
            this.updateSlotTexture();
            this.needUpdate = false;
        }
    }

    /**
     * slot 需要 spine 在 hierarchy 上 active 下才能被讀取，
     * 故若原為 inactive，採取先更改 flag 狀態，等到 active 後再更新。
     */
    public checkAndUpdateSlot(): void {
        if (this.node.activeInHierarchy) {
            this.updateSlotTexture();
        }
        else {
            this.needUpdate = true;
        }
    }

    public updateSlotTexture() {
        for (let slotAttach of this.slotAttaches) {
            let tex = slotAttach.spriteFrame.texture as Texture2D;
            this.setSlotTexture(slotAttach.slotName, tex, this.isCreateNew);
        }
    }

    public playLocalizationSpine(animName: string, track: number = 0, isLoop = false) {
        this.clearAnimation(track);
        this.updateSlotTexture();
        this.setAnimation(track, animName, isLoop);
    }

    public playLocalizationSpinePromise(animName: string, track: number = 0, isLoop = false) {
        this.clearAnimation(track);
        this.updateSlotTexture();
        return new Promise<void>((resolve, reject) => {
            let tr = this.setAnimation(track, animName, isLoop);
            this.setTrackCompleteListener(tr, () => {
                resolve();
            })
        })
    }

}
