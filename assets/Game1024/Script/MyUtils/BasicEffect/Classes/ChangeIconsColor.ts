/**
 * ChangeIconsColor.ts
 */
import { Node } from "cc";
import { BkgChangeColor } from "../Components/BkgChangeColor";

export class ChangeIconsColor {

    constructor() {

    }


    public setIconLight(isDark: boolean, targets: any | Node[], spColorMode: boolean = false, iconIndex?: number[]): void {

        const targetList = targets;
        if (iconIndex) {

            for (let i = 0; i < iconIndex.length; i++) {
                let index: number = iconIndex[i];
                const compBkgChangeColor = targetList[index].getComponent(BkgChangeColor);
                if (compBkgChangeColor) {
                    compBkgChangeColor.setIconLight(isDark, spColorMode);
                }
            }

        } else {

            for (let index = 0; index < targetList.length; index++) {

                const compBkgChangeColor = targetList[index].getComponent(BkgChangeColor);
                if (compBkgChangeColor) {
                    compBkgChangeColor.setIconLight(isDark, spColorMode);
                }
            }
        }
    }

    /**
     * 
     * @param isDark true=開啟變暗效果 false=關閉變暗效果
     * @param excludeSymbolIds 不參與效果的symbolID陣列
     */
    public setAllLightExcludeSymbolIds(isDark: boolean, targets: any | Node[], spColorMode: boolean = false, excludeSymbolIds: number[]): void {

        const targetList = targets;
        for (let index = 0; index < targetList.length; index++) {
            const icon = targetList[index];
            const id = (icon as any).symbol?.symbolID ?? -1;
            if (!excludeSymbolIds.includes(id)) {
                const compBkgChangeColor = icon.getComponent(BkgChangeColor);
                if (compBkgChangeColor) {
                    compBkgChangeColor.setIconLight(isDark, spColorMode);
                }
            }
        }
    }

    /**
     * 
     * @param isDark true=開啟變暗效果 false=關閉變暗效果
     * @param iconIndex 哪一個icon要改變,不給值的話則是全部改變
     */
    public async setIconLightTween(isDark: boolean, targets: any | Node[], spColorMode: boolean = false, iconIndex?: number[]): Promise<void> {

        const promises: Promise<void>[] = [];
        const targetList = targets;
        if (iconIndex !== undefined) {
            for (let i = 0; i < iconIndex.length; i++) {
                let index: number = iconIndex[i];
                const compBkgChangeColor = targetList[index].getComponent(BkgChangeColor);
                if (compBkgChangeColor) {
                    promises.push(compBkgChangeColor.setTweenBrightness(isDark, spColorMode));
                }
            }
        } else {
            for (let index = 0; index < targetList.length; index++) {
                const compBkgChangeColor = targetList[index].getComponent(BkgChangeColor);
                if (compBkgChangeColor) {
                    promises.push(compBkgChangeColor.setTweenBrightness(isDark, spColorMode));
                }
            }
        }
        await Promise.all(promises);
    }

    public async setIconLightTweenExcludeSymbolIds(isDark: boolean, targets: any | Node[], spColorMode: boolean = false, excludeSymbolIds: number[]): Promise<void> {

        const promises: Promise<void>[] = [];
        const targetList = targets;
        for (let index = 0; index < targetList.length; index++) {
            const icon = targetList[index];
            const id = (icon as any).symbol?.symbolID ?? -1;
            if (!excludeSymbolIds.includes(id)) {
                const compBkgChangeColor = targetList[index].getComponent(BkgChangeColor);
                if (compBkgChangeColor) {
                    promises.push(compBkgChangeColor.setTweenBrightness(isDark, spColorMode));
                }
            }
        }
        await Promise.all(promises);
    }

}