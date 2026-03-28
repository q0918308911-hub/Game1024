import { _decorator, Button, CCBoolean, Component, Enum, EventKeyboard, Input, input, KeyCode, Node } from 'cc';
import { GameSetting } from '../../GameScripts/Definition';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('ButtonKeyboardTrigger')
@requireComponent(Button)
export class ButtonKeyboardTrigger extends Component {

    @property(CCBoolean)
    private triggerActive: boolean = true; // 是否啟用觸發

    @property({ type: Enum(KeyCode) })
    public keyCodeArray: KeyCode[] = [];

    private enableLock: boolean = true;
    start() {
        input.on(Input.EventType.KEY_PRESSING, this.onKeyBoardEvent, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyBoardEvent, this);
    }

    private onKeyBoardEvent(event: EventKeyboard) {

        if (this.enableLock) {
            return;
        }

        if (GameSetting.keyboardLock) {
            return; // 如果鍵盤被鎖定，則不執行任何操作
        }

        if (!this.triggerActive) {
            return; // 如果觸發被禁用，則不執行任何操作
        }

        let btn = this.getComponent(Button);

        if (this.node.activeInHierarchy && btn.enabled && btn.interactable && this.enabled) {
            if (this.keyCodeArray.includes(event.keyCode)) {
                this.getComponent(Button).emitEvents(); // 觸發按鈕事件
            }
        }


    }

    protected onEnable(): void {
        this.enableLock = true; // 設置冷卻鎖定，防止重複觸發
        this.scheduleOnce(() => {
            this.enableLock = false; // 在一段時間後解除冷卻鎖
        }); // 0.1秒後解除冷卻鎖
    }

    public setTriggerActive(active: boolean) {
        this.triggerActive = active; // 設置觸發是否啟用
    }


}


