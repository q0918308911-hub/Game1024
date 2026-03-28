import { _decorator } from 'cc';
import { DropReelViewTest } from './DropReelViewTest';
import { DropSlotMachineController } from '../../../Scripts/DropReel/DropSlotMachineController';
const { ccclass } = _decorator;

@ccclass('DropSlotMachineTest')
export class DropSlotMachineTest extends DropSlotMachineController {

    protected _reelViewTest: DropReelViewTest = null;

    public init(): void {
        this.showReadyHand = this.readyHandShow.bind(this);
        this.hideReadyHand = this.readyHandHide.bind(this);
        super.init();
        this._reelViewTest = this.view as DropReelViewTest;
    }

    protected readyHandShow(currentReadyHandReel: number): void {

    }

    protected readyHandHide(currentReadyHandReel: number): void {

    }
}


