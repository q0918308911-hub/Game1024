import {
    AbstractProcessSlotSymbolAniData,
    IPlayAniData,
    IProcessInput,
    ISymbolAniKey
} from "../../ReferencePath";

/**
 * 有些專案會有複雜的情況,可能雖然是同一個prefab但是會有不同的skin或是不同的animation key
 * 在這邊可以實做這些輔助你要播放的索引資料.
 * 這樣就可以把這些繁瑣的塞資料過程抽離主要流程且容易擴增
 * TIP:
 * 如果你不想要懶人建立prefab的話,可以利用IPlayAniData的資料幫助你手動建立與填入相關播放資訊
 */
export class ProcessSlotSymbolAniData1024 extends AbstractProcessSlotSymbolAniData<IProcessInput, IPlayAniData, ISymbolAniKey> {

    private _prefabKey: Map<number, string>;

    constructor() {
        super();
        this._prefabKey = new Map<number, string>([
            [0, 'icon_00'],
            [1, 'icon_01'],
            [2, 'icon_02'],
            [3, 'icon_03'],
            [4, 'icon_04'],
            [5, 'icon_05'],
            [6, 'icon_06'],
            [7, 'icon_07'],
            [8, 'icon_08'],
            [9, 'icon_09'],
            [10, 'icon_10_inGame'],
            [99, 'Iconbox_inGame'],//--連線框
        ]);
    }

    //---這邊可以實作復合的邏輯去產出不同的 prefabKey
    public getPrefabKey(inp: IProcessInput): string {
        return this.getKeyFromMap(inp.symbolId) || 'default_icon';
    }

    //--就是存這筆資料在map當中
    public createPlayAniData(inp: IProcessInput, containerNodeId?: string): IPlayAniData {

        let playAniData: IPlayAniData =
        {
            aniId: '', // 預設動畫ID
            reelIndex: inp.reelIndex,
            iconIndex: inp.iconIndex,
            symbolId: inp.symbolId,
            prefabKey: this.getPrefabKey(inp), // 使用 getPrefabKey 方法獲取 prefabKey
            tokenId: '',
            wPos: null,
            aniInfo: null,
            groupId: inp.groupId || -1, // 預設值為 -1
        }
        return playAniData;
    }

    private getKeyFromMap(key: number): string | undefined {
        return this._prefabKey.get(key);
    }
}   