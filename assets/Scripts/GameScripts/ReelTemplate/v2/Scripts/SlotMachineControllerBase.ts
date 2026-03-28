import { _decorator, Component } from 'cc';
import { SlotMachineViewBase } from './SlotMachineViewBase';
const { ccclass, property } = _decorator;

/**
 * 用來管理表演的流程和數據，只負責開始與結束
 */
@ccclass('SlotMachineControllerBase')
export abstract class SlotMachineControllerBase extends Component {
    @property({ type: SlotMachineViewBase, visible: true })
    protected _view: SlotMachineViewBase = null;

    protected _iconResultData: number[][] = []; //紀錄最終顯示的資料
    protected _isReceiveData: boolean = false;

    protected _isTurboMode: boolean = false; //判斷是否為快速模式
    protected _isStopClick: boolean = false; //判斷是否點擊了stop按鈕

    /**
    * 開始滾輪表演
    * @param reelIDs 要表演的滾輪，沒有傳入預設全部滾輪表演 ex:[2, 1, 0]代表從2開始停，0最後
    */
    public startRoll(isTurboMode: boolean, reelIDs?: number[]): void {
        this.reset();
        this._isTurboMode = isTurboMode;
        this._view.startRoll(reelIDs);
    }

    /**
     * 停止滾輪表演
     * @param resultData 最終顯示的資料，
     * 如果表演特定滾輪，要照順序傳入資料 ex:[2, 1, 0]，resultData[[2要顯示的data], [1要顯示的data], [0要顯示的data]]
     */
    public stopRoll(resultData: number[][]): void {
        this._iconResultData = resultData;
        this._isReceiveData = true;

        this._view.stopRoll();
    }

    protected reset(): void {
        this._iconResultData.length = 0;
        this._isReceiveData = false;
        this._isStopClick = false;
    }

    protected isFastMode(): boolean {
        return this._isStopClick || this._isTurboMode;
    }
}


