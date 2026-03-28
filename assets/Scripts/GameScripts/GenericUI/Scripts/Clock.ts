import { _decorator, Component, Label, macro, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Clock')
export class Clock extends Component {

    private clockLabel: Label = null;

    onLoad() {
        this.clockLabel = this.getComponent(Label);
        this.schedule(this.updateClock, 1, macro.REPEAT_FOREVER, 0.001);
        this.updateClock();
    }

    updateClock() {
        let nowDate: Date = new Date();
        let hours = nowDate.getHours();
        let min = nowDate.getMinutes();
        let minStr = min < 10 ? `0${min}` : `${min}`;
        let str = `${hours}:${minStr}`;
        this.clockLabel.string = `${str}`;
    }
}


