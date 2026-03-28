import { _decorator, Button, Component, Node } from 'cc';
import { ButtonStatus } from '../Definition';
const { ccclass, property } = _decorator;

@ccclass('ButtonDynamic')
export class ButtonDynamic extends Button {
    protected override _applyTransition(state: string): void {
        super._applyTransition(state);
        let stateEnum: ButtonStatus = state as ButtonStatus
        this.onStateChange(stateEnum);
    }

    protected onStateChange(state: string): void {

    }
}


