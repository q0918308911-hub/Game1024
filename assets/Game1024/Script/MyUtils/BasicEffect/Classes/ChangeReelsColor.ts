import { SymbolBase, UniIconBase, UniReel } from "db://assets/Scripts/ModuleEntry";
import { IChangeReelsColor } from "../InterfaceDef/IChangeColor";

/**
 * @author Eric
 * @description 控制軸上icon顏色變化的工具類別
 * @Date 2025-12-22
 */
export class ChangeReelsColor {

    constructor() {

    }

    /**
     * <一般>-關閉/開啟指定的指定軸的<指定位置icon>亮度(true=變暗/false=正常)
     * @param reelIndex 軸
     * @param iconIndex 指定位置icon
     * @param isDark 亮度(true=變暗/false=正常)
     */
    public setIconLight<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number,
        iconIndex: number[],
        isDark: boolean
    ): void {
        reelList[reelIndex].setIconLight(isDark, iconIndex);
    }

    /**
     * <TWEEN驅動>-關閉/開啟指定的指定軸的<指定位置icon>亮度(true=變暗/false=正常)
     * @param reelIndex 軸
     * @param iconIndex 指定位置icon
     * @param isDark 亮度(true=變暗/false=正常)
     */
    public setIconLightTween<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number,
        iconIndex: number[],
        isDark: boolean
    ): void {

        reelList[reelIndex].setIconLightTween(isDark, iconIndex);
    }

    /**
    * 關閉/開啟指定的指定軸的<整軸>亮度(true=變暗/false=正常)
    * @param reelIndex 
    * @param brightnessFlag 
    */
    public setReelLight<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number,
        brightnessFlag: boolean
    ): void {
        reelList[reelIndex].setIconLight(brightnessFlag);
    }

    /**
    * <TWEEN驅動> 關閉/開啟指定的指定軸的<整軸>亮度(true=變暗/false=正常)
    * @param reelIndex 
    * @param brightnessFlag 
    */
    public async setReelLightTween<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number,
        brightnessFlag: boolean
    ): Promise<void> {
        await reelList[reelIndex].setIconLightTween(brightnessFlag);
    }

    public async setReelLightTweenExcludeIds<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number,
        isDark: boolean,
        excludeSymbolIds: number[]
    ): Promise<void> {
        await reelList[reelIndex].setIconLightTweenExcludeSymbolIds(isDark, excludeSymbolIds);
    }


    public setReelsLight<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number[],
        brightnessFlag: boolean
    ): void {

        for (const id of reelIndex) {
            this.setReelLight<TSymbolBase, TUniIconBase, TReel>(reelList, id, brightnessFlag)
        }
    }


    public async setReelsLightTweenExcludeIds<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number[],
        isDark: boolean,
        excludeSymbolIds: number[]
    ): Promise<void> {

        const promises: Promise<void>[] = [];
        for (const id of reelIndex) {
            promises.push(this.setReelLightTweenExcludeIds<TSymbolBase, TUniIconBase, TReel>(reelList, id, isDark, excludeSymbolIds));
        }
        await Promise.all(promises);
    }


    public async setReelsLightTween<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        reelIndex: number[],
        brightnessFlag: boolean
    ): Promise<void> {

        const promises: Promise<void>[] = [];
        for (const id of reelIndex) {
            promises.push(this.setReelLightTween<TSymbolBase, TUniIconBase, TReel>(reelList, id, brightnessFlag));
        }
        await Promise.all(promises);
    }

    /**
     * <一般>-關閉/開啟指定的全部(整個盤面)的亮度(true=變暗/false=正常) 
     * @param isDark 
     */
    public setAllLight<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        isDark: boolean
    ): void {
        const reelAmount = reelList.length;
        for (let reelID = 0; reelID < reelAmount; reelID++) {
            reelList[reelID].setIconLight(isDark);
        }
    }

    /**
     * 
     * @param isDark true=變暗/false=正常
     * @param excludeSymbolIds 不參與改變的symbolID陣列
     */
    public setAllLightExcludeSymbolIds<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        isDark: boolean,
        excludeSymbolIds: number[]
    ): void {
        const thisReelAmount = reelList.length;
        for (let reelID = 0; reelID < thisReelAmount; reelID++) {
            reelList[reelID].setAllLightExcludeSymbolIds(isDark, excludeSymbolIds);
        }
    }

    /**
    * <TWEEN驅動> 關閉/開啟指定的全部(整個盤面)的亮度(true=變暗/false=正常) 
    * @param isDark 
    */
    public async setAllLightTween<
        TSymbolBase extends SymbolBase,
        TUniIconBase extends UniIconBase<TSymbolBase>,
        TReel extends UniReel<TSymbolBase, TUniIconBase> & IChangeReelsColor
    >(
        reelList: TReel[],
        isDark: boolean
    ): Promise<void> {

        const promises: Promise<void>[] = [];
        const thisReelAmount = reelList.length;
        for (let reelID = 0; reelID < thisReelAmount; reelID++) {
            promises.push(reelList[reelID].setIconLightTween(isDark));
        }
        await Promise.all(promises);
    }

}