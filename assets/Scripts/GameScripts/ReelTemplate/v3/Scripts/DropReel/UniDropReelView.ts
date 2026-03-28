import { _decorator, CCFloat, Component, Node } from 'cc';
import { UniReelView } from '../UniReelView';
import { IDropReel } from '../Interface/IDropReel';
import { UniDropReel } from './UniDropReel';
import { Utility } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('DropUniReelView')
export class UniDropReelView<DropReel extends IDropReel> extends UniReelView<DropReel> {

    @property(UniDropReel)
    protected dropReelList: DropReel[] = [];

    @property({ type: CCFloat, tooltip: '停輪間隔的時間，目前只有掉落式公版使用，小於0代表一起齊停' })
    protected stopDropSpaceTime: number = 0.1;

    /**
     * 開始掉落方法，資料由實作層設定好傳入
     * @param dropOutIdList 掉落的 icon 索引 (不包含頭尾Icon)
     */
    public async startDropOut(dropOutIdList: number[][]): Promise<void> {
        const lastIndex = dropOutIdList.length - 1;
        this.reset();

        for (let index = 0; index < dropOutIdList.length; index++) {
            if (index === lastIndex) {
                await this.dropReelList[index].startDropOutAsync(dropOutIdList[index]);
            }
            else {
                this.dropReelList[index].startDropOut(dropOutIdList[index]);
                if (this.startSpaceTime >= 0 && !this.isFastModeCallback()) {
                    await Utility.waitPromise(this.startSpaceTime);
                }
            }
        }
    }

    /**
      * 收到盤面資料時掉入畫面中方法，資料由實作層設定好傳入
      * @param dropInIdList 掉落的 icon 索引 (不包含頭尾Icon)
      * @param resultData 盤面資料
      */
    public async startDropIn(dropInIdList: number[][], resultData: number[][]): Promise<void> {
        const lastIndex = dropInIdList.length - 1;
        for (let index = 0; index < dropInIdList.length; index++) {
            this.setReelDataCallback(index, resultData[index]);

            if (index === lastIndex) {
                await this.dropReelList[index].startDropInAsync(dropInIdList[index]);
            }
            else {
                this.dropReelList[index].startDropIn(dropInIdList[index]);
                if (this.stopDropSpaceTime >= 0 && !this.isFastModeCallback()) {
                    await Utility.waitPromise(this.stopDropSpaceTime);
                }
            }
        }
    }

    /**
     * 補盤方法，資料由實作層設定好傳入
     * @param removeIdList 被消除的 icon 索引 (不包含頭尾Icon)
     * @param resultData 盤面資料
     */
    public async startDropRefill(removeIdList: number[][], resultData: number[][]) {
        let promiseList = [];
        for (let index = 0; index < removeIdList.length; index++) {
            this.setReelDataCallback(index, resultData[index]);
            if (removeIdList[index].length > 0) {
                promiseList.push(this.dropReelList[index].startDropRefillAsync(removeIdList[index]));
            }
        }

        await Promise.all(promiseList);
    }

    public fastStopRoll(): void { }
}


