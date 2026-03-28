import { _decorator } from 'cc';
import { ReelView } from '../../Scripts/ReelView';

const { ccclass, property } = _decorator;

@ccclass('ReelViewTest')
export class ReelViewTest extends ReelView {
    public setAllReelBrightness(isDark: boolean): void {
        for (let reelID = 0; reelID < this.reelAmount; reelID++) {
            this.setIconBrightness(reelID, isDark);
        }
    }

    protected allReelRollEnd(): void {
        this.setAllReelBrightness(false);
        super.allReelRollEnd();
    }
}


