import {
    AniSysTools,
    DYN_NODE_PROPERTIES,
    IAnimationControl,
    IPlayAniData,
    ISymbolAniMediatorHooks
} from '../../ReferencePath';
import { Node } from 'cc';
/**
 * 用來修飾 SymbolAniMediator產出的 Node
 */

export class SymbolAniMediatorHooks1024 implements ISymbolAniMediatorHooks<Node, IPlayAniData> {

    constructor() {

    }
    //--builderMediator會呼叫
    public decorate(target: Node, playData: IPlayAniData): void | Promise<void> {

        let slotMachineIndexInfo = {
            reelIndex: playData.reelIndex,
            iconIndex: playData.iconIndex,
            symbolId: playData.symbolId,
        }

        target[DYN_NODE_PROPERTIES.PREFAB_ID] = playData.prefabKey;
        target[DYN_NODE_PROPERTIES.TOKEN_ID] = playData.tokenId;
        target[DYN_NODE_PROPERTIES.GROUP_ID] = [];//--在reel建立起的時候尚未知道表演群組,要中線得分後才知道
        target[DYN_NODE_PROPERTIES.SYMBOL_ICON_INFO] = slotMachineIndexInfo;
        target[DYN_NODE_PROPERTIES.ADDED] = false;//--是否被創造出來加入過表演層(回收是null)
        target[DYN_NODE_PROPERTIES.LOCKED] = false;//--是否被創造出來加入過表演層(回收是null)
        target[DYN_NODE_PROPERTIES.OTHER] = null;//--是否被創造出來加入過表演層(回收是null)
        target[DYN_NODE_PROPERTIES.IS_PLAYING_EXPECT] = false;//--是否播放聽牌動畫
        let aniInterfaceComponent: IAnimationControl | null;
        aniInterfaceComponent = AniSysTools.findAndGetIAniComponent(target) as IAnimationControl;
        if (aniInterfaceComponent) {
            aniInterfaceComponent.slotMachineIndexInfo = slotMachineIndexInfo;
            //aniInterfaceComponent.setAniDataInfo(playData.aniInfo);
            aniInterfaceComponent.tokenID = playData.tokenId;
            target[DYN_NODE_PROPERTIES.ANIMATION_CTRL] = aniInterfaceComponent;//--直接在node動態的掛上,省去以後都要find的消耗
            //aniInterfaceComponent.groupID = [playData.groupId];//-只有在得分的狀態才能知道groupId
        }
    }

    public setAniGroup(inp: Node, groupId: number): void {
        if (inp[DYN_NODE_PROPERTIES.GROUP_ID]) {
            inp[DYN_NODE_PROPERTIES.GROUP_ID].push(groupId);
        } else {
            inp[DYN_NODE_PROPERTIES.GROUP_ID] = [groupId];
        }
    }
}