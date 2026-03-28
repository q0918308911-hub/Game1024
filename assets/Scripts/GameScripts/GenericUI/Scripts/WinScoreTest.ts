import { _decorator, Component, Node } from 'cc';
import { ShowWin } from '../ShowWin/Scripts/ShowWin';
const { ccclass, property } = _decorator;

@ccclass('WinScoreTest')
export class WinScoreTest extends Component {

    @property(ShowWin)
    showWin: ShowWin = null!;

    start() {

    }

    update(deltaTime: number) {

    }

    onClick1() {
        this.showWin.showSpecialWin(50, 10000).then(() => {
            // AudioManager.instance.stop();
        });
    }

    onClick2() {
        this.showWin.showSpecialWin(100, 10000).then(() => {
            // AudioManager.instance.stop();
        });

    }

    onClick3() {
        this.showWin.showSpecialWin(200, 10000).then(() => {
            // AudioManager.instance.stop();
        });

    }

    onClick4() {
        this.showWin.showSpecialWin(300, 10000).then(() => {
            // AudioManager.instance.stop();
        });

    }

}


