import { _decorator, Node, randomRangeInt } from 'cc';
import { SlotMachineController } from '../../Scripts/SlotMachineController';
import { ReelViewTest } from './ReelViewTest';
const { ccclass, property } = _decorator;

@ccclass('SlotMachineTest')
export class SlotMachineTest extends SlotMachineController {
    @property({ type: Node, visible: true })
    private _readyHandNode: Node = null;

    private _reelViewTest: ReelViewTest = null;

    public init(): void {
        this.showReadyHandCallback = this.readyHandShow.bind(this);
        this.hideReadyHandCallback = this.readyHandHide.bind(this);

        super.init();

        this._reelViewTest = this._view as ReelViewTest;
    }

    protected generateInitIconData(): number[][] {
        let initSymbolData: number[][] = [[0, 1, 2], [3, 4, 5], [6, 7, 7], [8, 9, 10]];
        this._previousResultData = initSymbolData;
        return initSymbolData;
    }

    protected readyHandShow(currentReadyHandReel: number): void {
        this._reelViewTest.setAllReelBrightness(true);
        this._reelViewTest.setIconBrightness(currentReadyHandReel, false);
        this._readyHandNode.active = true;
    }

    protected readyHandHide(currentReadyHandReel: number): void {
        if (currentReadyHandReel === this.reelAmount - 1) {
            this._reelViewTest.setAllReelBrightness(false);
        }
        else {
            this._reelViewTest.setIconBrightness(currentReadyHandReel, false);
        }
        this._readyHandNode.active = false;
    }
}


