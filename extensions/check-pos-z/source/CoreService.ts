import { INode, Vec3 } from "@cocos/creator-types/editor/packages/scene/@types/public";
import { showLog, showWarn, showError, waitTime } from './Utils';

export function afterReload() {
    // 在這裡實作插件被重新載入後的邏輯
}


export async function checkNodePositionZ(message: string, isUrl: boolean): Promise<void> {
    try {
        let prefabUUIDs = await getAllPrefabUUIDs(message, isUrl);

        if (prefabUUIDs.length > 0) {
            await checkPrefabPosition(prefabUUIDs);
            showLog(Editor.I18n.t('check-pos-z.convert_complete'));
        }
        else {
            showLog(Editor.I18n.t('check-pos-z.no_prefab'));
        }
    }
    catch (error) {
        showError("catch error in convert process", error);
    }
}

async function getAllPrefabUUIDs(message: string, isUrl: boolean): Promise<string[]> {
    let prefabUUIDs: string[] = [];
    let url = isUrl ? message : await Editor.Message.request('asset-db', 'query-url', message); //轉成url，檢查路徑是否是在專案內

    if (url) {
        let globUrl = url.replace(/\\/g, '/'); //要把他轉成glob格式，API需求
        globUrl += '/*.prefab'; //只抓取prefab檔案
        let assets = await Editor.Message.request('asset-db', 'query-assets', { pattern: globUrl });

        for (let index = 0; index < assets.length; index++) {
            const asset = assets[index];
            prefabUUIDs.push(asset.uuid);
        }
    }
    else {
        showError(Editor.I18n.t("check-pos-z.folderNotInProject"));
    }

    return prefabUUIDs;
}

async function checkPrefabPosition(prefabUUIDs: string[]): Promise<void> {
    for (let index = 0; index < prefabUUIDs.length; index++) {
        const uuid = prefabUUIDs[index];

        let rootNodeList = await getRootNode(uuid);
        let rootNode = rootNodeList.children[0];
        await setNodePositionZ(rootNode);
        await Editor.Message.request('scene', 'save-scene');
        await Editor.Message.request('scene', 'close-scene');
    }
}

async function getRootNode(uuid: string): Promise<INode> {
    await Editor.Message.request('asset-db', 'open-asset', uuid);
    await waitTime(500); // 等待prefab打開
    let sceneRootNodeTree = await Editor.Message.request('scene', 'query-node-tree');

    let sceneRootNodeTreeInode: INode;
    sceneRootNodeTreeInode = sceneRootNodeTree as unknown as INode;
    return sceneRootNodeTreeInode;
}

async function setNodePositionZ(rootNode: INode, isChildren: boolean = false): Promise<void> {
    for (let index = 0; index < rootNode.children.length; index++) {
        const uuid = isChildren ? rootNode.children[index].value.uuid : rootNode.children[index].uuid;

        let node = await Editor.Message.request('scene', 'query-node', uuid);

        if (node) {
            let pos = node.position.value as Vec3;
            let result = await Editor.Message.request('scene', 'set-property',
                {
                    uuid: uuid,
                    path: 'position',
                    dump:
                    {
                        type: 'cc.Vec3',
                        value: {
                            x: pos.x,
                            y: pos.y,
                            z: 0,
                        },
                    }
                }
            )

            if (result) {
                if (node.children.length > 0) {
                    await setNodePositionZ(node, true);
                }
            }
            else {
                showError(Editor.I18n.t("check-pos-z.no_find_property"));
            }

        }
        else {
            showError(Editor.I18n.t("check-pos-z.no_find_node"));
        }
    }
}