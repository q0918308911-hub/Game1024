import { IProcessSlotSymbolAniData, IProcessInput, IPlayAniData, ISymbolAniKey } from "./IAniBuilder";

export abstract class AbstractProcessSlotSymbolAniData<
    T extends IProcessInput,
    P extends IPlayAniData = IPlayAniData,//---包含
    K extends ISymbolAniKey = ISymbolAniKey//---
> implements IProcessSlotSymbolAniData<T, P, K> {

    abstract getPrefabKey(inp: T): string;

    abstract createPlayAniData(inp: T, containerNodeId?: string): P;

    //getAnimationPlayInfo(inp: T): AnimationPlayInfo | null {
    getAnimationPlayInfo(inp: T): null {
        return null; // 預設外部自行塞；要內建規則就 override
    }

    /**
     * 
     * @param inp 
     * interface IProcessInput
        {
            symbolId: number;       // server symbol id
            reelIndex: number;
            iconIndex: number;
            score: number;
            groupId?: number[];       // 伺服器給的中線群組（若有）
            worldPos?: Vec3;        // 需要時才填
        }
     * @returns
     * interface ISymbolAniKey {
            symbolId: number;
            reelIndex: number;
            symbolIndex: number;
            aniId:string;
            groupId?: number[]; // 可選，server給的中線群組（若有）
            prefabKey?: string; // 可選，預設的prefabKey
        } 
     */
    getAniKey(inp: T): K {
        const base = this.buildBaseAniKey(inp);
        return base as K; // 轉型為 K，確保符合 ISymbolAniKey 的結構
    }

    setAniGroup(inp: T, groupId: number): void {
        inp.groupId = groupId;
    }

    protected buildBaseAniKey(inp: T): ISymbolAniKey {
        const base: ISymbolAniKey = {
            symbolId: inp.symbolId,
            reelIndex: inp.reelIndex,
            // 若你的 ISymbolAniKey 需要的是 symbolIndex，請把來源對齊：
            iconIndex: inp.iconIndex,
            groupId: inp.groupId,
            aniId: ""
        };

        base.prefabKey = this.getPrefabKey(inp);

        return base;
    }


}