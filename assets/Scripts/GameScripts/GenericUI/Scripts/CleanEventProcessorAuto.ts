import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CleanEventProcessorAuto')
export class CleanEventProcessorAuto extends Component {
    protected onDisable(): void {
        const eventProcessor = (this.node as any)._eventProcessor;
        if (eventProcessor) {
            //重新初始化claimedTouchIdList
            eventProcessor.claimedTouchIdList.length = 0;
        }
    }
}


