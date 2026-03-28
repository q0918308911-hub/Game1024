import { _decorator } from 'cc';
import { UniSlotMachine } from '../UniSlotMachine';
import { IDropReel } from '../Interface/IDropReel';
import { UniDropReelView } from './UniDropReelView';
const { ccclass, property } = _decorator;

@ccclass('UniDropSlotMachine')
export class UniDropSlotMachine<View extends UniDropReelView<IDropReel>> extends UniSlotMachine<View> {
    @property({ type: UniDropReelView, visible: true })
    protected _dropReelView: View = null;

    /**
     * 開始掉落方法，資料由實作層設定好傳入
     * @param dropOutIdList 掉落的 icon 索引 (不包含頭尾Icon)
     */
    public async startDropOut(isTurboMode: boolean, dropOutIdList: number[][]): Promise<void> {
        this.reset();
        this._isTurboMode = isTurboMode;
        await this._dropReelView.startDropOut(dropOutIdList);
    }

    /**
     * 收到盤面資料時掉入畫面中方法，資料由實作層設定好傳入
     * @param dropInIdList 掉入的 icon 索引 (不包含頭尾Icon)
     * @param resultData 盤面資料
     */
    public async startDropIn(dropInIdList: number[][], resultData: number[][]): Promise<void> {
        this._iconResultData = [...resultData];
        await this._dropReelView.startDropIn(dropInIdList, this._iconResultData);
    }

    /**
     * 補盤方法，資料由實作層設定好傳入
     * @param removeIdList 被消除的 icon 索引 (不包含頭尾Icon)
     * @param resultData 盤面資料
     */
    public async startDropRefill(removeIdList: number[][], resultData: number[][]): Promise<void> {
        this._iconResultData = [...resultData];
        await this._dropReelView.startDropRefill(removeIdList, this._iconResultData);
    }
}


