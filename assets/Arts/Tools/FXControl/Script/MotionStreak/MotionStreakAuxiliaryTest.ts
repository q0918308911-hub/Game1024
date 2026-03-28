import { _decorator, Component, Vec3 } from 'cc';
import { MotionStreakAuxiliary } from './MotionStreakAuxiliary';
const { ccclass, property } = _decorator;

@ccclass('MotionData')
class MotionData {
    @property({ visible: true })
    public aniName: string = "";
    @property({ visible: true })
    public startPos: Vec3 = new Vec3();
    @property({ visible: true })
    public endPos: Vec3 = new Vec3();
    @property(MotionStreakAuxiliary)
    public motionStreakAuxiliary: MotionStreakAuxiliary = null;
}
@ccclass('MotionStreakAuxiliaryTest')
export class MotionStreakAuxiliaryTest extends Component {

    @property(MotionData)
    private motionDataList: MotionData[] = [];

    public async onclick(): Promise<void> {
        this.playMotionStreak();
    }

    private async playMotionStreak(): Promise<void> {
        for (let i = 0; i < this.motionDataList.length; i++) {
            const item = this.motionDataList[i];
            await item.motionStreakAuxiliary.play(item.aniName, item.startPos, item.endPos);
        }
    }
}




