import { _decorator } from 'cc';
import { IconReelView } from '../../Scripts/IconReelView';


const { ccclass, property } = _decorator;

@ccclass('IconReelViewTest')
export class IconReelViewTest extends IconReelView {
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


