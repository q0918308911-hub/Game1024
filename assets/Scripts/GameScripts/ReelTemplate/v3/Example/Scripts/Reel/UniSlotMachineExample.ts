import { _decorator, } from 'cc';
import { UniReelViewExample } from './UniReelViewExample';
import { UniSlotMachine } from '../../../Scripts/UniSlotMachine';
const { ccclass, property } = _decorator;

@ccclass('UniSlotMachineExample')
export class UniSlotMachineExample extends UniSlotMachine<UniReelViewExample> {
    start() {

    }

    update(deltaTime: number) {

    }
}