import { AbstractProcessSlotSymbolAniData } from "./AbstractProcessSlotSymbolAniData";
import { IProcessInput, IPlayAniData, ISymbolAniKey } from "./IAniBuilder";

/**
 * 基本的處理動畫資料類別
 * T= IProcessInput,
 * P= IPlayAniData,
 * K= ISymbolAniKey
 */
export class BasicProcessSlotSymbolAniDataExample extends AbstractProcessSlotSymbolAniData<IProcessInput, IPlayAniData, ISymbolAniKey> {
    public getPrefabKey(inp: IProcessInput): string {
        //--自己寫產生的條件
        return '';
    }

    public createPlayAniData(inp: IProcessInput, containerNodeId?: string): IPlayAniData {
        //--自己寫產生的條件
        return null;
    }

    public override getAniKey(inp: IProcessInput): ISymbolAniKey {
        //--自己寫產生的條件
        //const base = this.buildBaseAniKey(inp);
        //return base as K; // 轉型為 K，確保符合 ISymbolAniKey 的結構
        return null;
    }
    public override getAnimationPlayInfo(inp: IProcessInput): null {
        //--自己寫產生的條件
        // 預設外部自行塞；要內建規則就 override
        return null;
    }



}
