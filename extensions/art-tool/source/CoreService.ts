import { ExecuteSceneScriptMethodOptions, IProperty } from '@cocos/creator-types/editor/packages/scene/@types/public';
import { AssetInfo, IAssetMeta } from '@cocos/creator-types/editor/packages/asset-db/@types/public';
import packageJSON from '../package.json';
import { TextureInfo } from './SceneScript';
import { PrefabScanContext } from './interface';
import { showLog, showWarn, showError, waitTime } from './Utils';

export function afterReload() {

}

export async function getAllTextureInfo(allTargetFolder: string[]): Promise<TextureInfo[]> {
    const textureAssetInfos: AssetInfo[] = await readAssetInfo(allTargetFolder, 'cc.Texture2D');
    const assetUuids = textureAssetInfos
        .filter((info) => !info.isDirectory)
        .map((info) => info.uuid);
    const args = [assetUuids];

    const spriteFrameInfos: AssetInfo[] = await readAssetInfo(allTargetFolder, 'cc.SpriteFrame');
    const metaInfos = await getSpriteFrameMetaInfo(spriteFrameInfos);
    const spriteFrameTrimTypeMap = getSpriteFrameTrimData(metaInfos);

    const baseUrl = __dirname.split('extensions')[0].replace(/\\/g, '/');
    const allTextureInfo: TextureInfo[] = await Editor.Message.request('scene', 'execute-scene-script', {
        name: packageJSON.name,
        method: 'readAllTexture',
        args: args,
    });

    allTextureInfo.forEach(async (textureInfo: TextureInfo) => {
        const assetInfoUUID = textureInfo.uuid;
        const textureAssetInfo = (textureAssetInfos.find((assetInfo: AssetInfo) => assetInfo.uuid === assetInfoUUID) as AssetInfo);
        const dbUrl = textureAssetInfo.url.replace('/texture', '');
        const imgUrl = baseUrl + dbUrl.replace('db://', '');

        textureInfo.dbUrl = dbUrl;
        textureInfo.imgUrl = imgUrl;

        const uuid = assetInfoUUID.split('@')[0];
        if (spriteFrameTrimTypeMap.has(uuid)) {
            textureInfo.trimType = spriteFrameTrimTypeMap.get(uuid) as string;
        }
    });

    allTextureInfo.sort((infoA, infoB) => {
        // 有開啟 mipmap 的先排前面
        if (infoA.isUsingMipMap !== infoB.isUsingMipMap) {
            return infoA.isUsingMipMap ? -1 : 1;
        }
        // 依照 size 大到小排序
        return infoB.size - infoA.size;
    })

    return allTextureInfo;
}

export async function readAssetInfo(allTargetFolder: string[], targetType: string): Promise<AssetInfo[]> {
    const promiseList = [];
    for (let i = 0; i < allTargetFolder.length; i++) {
        const targetFolder = allTargetFolder[i];
        const pattern = `db://assets/${targetFolder.trim()}/**`;
        promiseList.push(Editor.Message.request('asset-db', 'query-assets', { pattern: pattern, ccType: targetType }));
    }

    const promiseResult = await Promise.all(promiseList);
    const textureAssetInfos: AssetInfo[] = promiseResult.flat();
    return textureAssetInfos;
}

export function createTextureInfoElement(textureInfo: TextureInfo): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.border = '1px solid #555';
    wrapper.style.margin = '8px';
    wrapper.style.padding = '8px';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';

    // 建立固定大小的容器
    const imgWrapper = document.createElement('div');
    imgWrapper.style.width = '128px';
    imgWrapper.style.height = '128px';
    imgWrapper.style.display = 'flex';
    imgWrapper.style.alignItems = 'center';
    imgWrapper.style.justifyContent = 'center';
    imgWrapper.style.overflow = 'hidden'; // 防止圖片超出邊界
    imgWrapper.style.cursor = 'pointer'; // 提示可點擊

    // 建立圖片元素
    const img = document.createElement('img');
    img.src = textureInfo.imgUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain'; // 保持比例縮放，完整顯示
    img.addEventListener('click', () => {
        const imageAssetUuid = textureInfo.uuid.split('@')[0];
        Editor.Selection.clear('asset');
        Editor.Selection.select('asset', imageAssetUuid);
    });

    // 將圖片放入容器
    imgWrapper.appendChild(img);

    // 再把容器加入父元素
    wrapper.appendChild(imgWrapper);

    // 顯示文字資訊
    const info = document.createElement('div');
    info.innerHTML = `
                    <p>圖片路徑:</b> ${textureInfo.dbUrl}</p>
                    <p>尺寸:</b> ${textureInfo.width} x ${textureInfo.height}</p>
                    <p>占用GPU記憶體大小:</b> ${getFormattedSize(textureInfo.size)}</p>
                    <p>是否使用 mipmap:</b> ${textureInfo.isUsingMipMap ? '是' : '否'}</p>
                    <p>trimmed type:</b> ${textureInfo.trimType || ''}</p>
                `;
    wrapper.appendChild(info);
    return wrapper;
}

export function getFormattedSize(size: number): string {
    const unit = ['B', 'KB', 'MB'];
    let unitIndex = 0;
    let tempSize = size;
    let formatResult: string = '';

    do {
        formatResult = `${tempSize.toFixed(2)} ${unit[unitIndex]}`;
        tempSize /= 1024;
        unitIndex++;
    } while (tempSize > 1 && unitIndex < unit.length);

    return formatResult;
}

export async function closeAllTextureMipmap(allTargetFolder: string[]) {
    const textureAssetInfos: AssetInfo[] = await readAssetInfo(allTargetFolder, 'cc.Texture2D');

    const promiseList = [];
    for (let i = 0; i < textureAssetInfos.length; i++) {
        const assetInfo = textureAssetInfos[i];
        promiseList.push(closeTextureMipmap(assetInfo.uuid));
    }
    await Promise.all(promiseList);
}

async function closeTextureMipmap(uuid: string): Promise<void> {
    const textureMetaInfo = await Editor.Message.request('asset-db', 'query-asset-meta', uuid);
    if (textureMetaInfo && !isMipmapDisabled(textureMetaInfo.userData)) {
        textureMetaInfo!.userData.minfilter = 'linear';
        textureMetaInfo!.userData.magfilter = 'linear';
        textureMetaInfo!.userData.mipfilter = 'none';
        const stringifyInfo = JSON.stringify(textureMetaInfo);
        await Editor.Message.request('asset-db', 'save-asset-meta', uuid, stringifyInfo);
    }
}

function isMipmapDisabled(userData: any): boolean {
    return userData.minfilter === 'linear' && userData.magfilter === 'linear' && userData.mipfilter === 'none';
}

async function getSpriteFrameMetaInfo(spriteFrameInfos: AssetInfo[]): Promise<(IAssetMeta | null)[]> {
    const pList = [];
    for (let i = 0; i < spriteFrameInfos.length; i++) {
        const assetInfo = spriteFrameInfos[i];
        pList.push(Editor.Message.request('asset-db', 'query-asset-meta', assetInfo.uuid));

    }

    const promiseResult = await Promise.all(pList);
    return promiseResult.flat();
}

function getSpriteFrameTrimData(metaInfos: (IAssetMeta | null)[]): Map<string, string> {
    const trimTypeMap: Map<string, string> = new Map();
    for (let i = 0; i < metaInfos.length; i++) {
        const metaInfo = metaInfos[i];
        if (metaInfo) {
            const uuid = metaInfo.uuid.split('@')[0];
            const trimType = metaInfo.userData?.trimType as string | undefined;
            if (trimType) {
                trimTypeMap.set(uuid, trimType);
            }
        }
    }
    return trimTypeMap;
}

export async function setTrimTypeToNone(allTargetFolder: string[]) {
    const spriteFrameAssetInfos: AssetInfo[] = await readAssetInfo(allTargetFolder, 'cc.SpriteFrame');
    const metaInfos = await getSpriteFrameMetaInfo(spriteFrameAssetInfos);
    for (let i = 0; i < metaInfos.length; i++) {
        const metaInfo = metaInfos[i];
        if (metaInfo) {
            const trimType = metaInfo.userData?.trimType as string | undefined;
            if (trimType && trimType !== 'none') {
                metaInfo.userData.trimType = 'none';
                const stringifyInfo = JSON.stringify(metaInfo);
                Editor.Message.request('asset-db', 'save-asset-meta', metaInfo.uuid, stringifyInfo);
            }
        }
    }
}

export async function convertMaskType(maskNodeInfos: AssetInfo[], isPrefab: boolean) {
    const SPRITE_STENCIL_TYPE = 3;
    const defaultSpriteFrameUUID = '7d8f9b89-4fd1-4c9f-a3ab-38ec7cded7ca@f9941';
    let originContentSizeList = [];
    let result = [];

    for (let index = 0; index < maskNodeInfos.length; index++) {
        const nodeUUID = maskNodeInfos[index].uuid;
        let nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
        const uiTransform = nodeInfo.__comps__.find((comp) => comp.type === 'cc.UITransform');
        const originContentSize = (uiTransform as any).value.contentSize.value;
        originContentSizeList.push(originContentSize);

        const maskInfo = nodeInfo.__comps__.find((comp) => comp.type === 'cc.Mask');

        if (maskInfo) {
            const compIndex = nodeInfo.__comps__.indexOf(maskInfo);
            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUUID,
                path: `__comps__[${compIndex}].type`,
                dump: {
                    type: 'Enum',
                    value: SPRITE_STENCIL_TYPE
                },
            });

            nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
            const spriteInfo = nodeInfo.__comps__.find((comp) => comp.type === 'cc.Sprite') as IProperty;
            const spriteCompIndex = nodeInfo.__comps__.indexOf(spriteInfo);
            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUUID,
                path: `__comps__[${spriteCompIndex}].spriteFrame`,
                dump: {
                    type: 'cc.SpriteFrame',
                    value: {
                        uuid: defaultSpriteFrameUUID,
                    },
                },
            });

            if (isPrefab) {
                let nodePath = await findNodePath(nodeUUID);

                result.push({
                    name: maskNodeInfos[index].name,
                    path: nodePath
                });
            }
            else {
                result.push(maskNodeInfos[index]);
            }
        }
    }

    //Sprite換圖後，需要調整為原先的contentSize
    for (let index = 0; index < maskNodeInfos.length; index++) {
        const nodeUUID = maskNodeInfos[index].uuid;
        let nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
        const uiTransform = nodeInfo.__comps__.find((comp) => comp.type === 'cc.UITransform') as IProperty;
        const originContentSize = originContentSizeList[index];

        const uiTransformIndex = nodeInfo.__comps__.indexOf(uiTransform);

        await Editor.Message.request('scene', 'set-property', {
            uuid: nodeUUID,
            path: `__comps__[${uiTransformIndex}].contentSize`,
            dump: {
                type: 'cc.Size',
                value: originContentSize
            },
        });
    }

    await Editor.Message.request('scene', 'save-scene');
    return result;
}


export async function convertPrefab(ctx: PrefabScanContext, targetFolder: string[]) {
    ctx.prefabInfos = await readAssetInfo(targetFolder, 'cc.Prefab');
    if (ctx.prefabInfos.length > 0) {
        ctx.isCheckMask = true;
        ctx.currentIndex = 0;
        ctx.result = [];
        await openCurrentPrefab(ctx);
    }
}

export async function openCurrentPrefab(ctx: PrefabScanContext) {
    if (!ctx.isCheckMask) return;

    const info = ctx.prefabInfos[ctx.currentIndex];
    await Editor.Message.request('asset-db', 'open-asset', info.uuid);
}

async function findNodePath(targetUUID: string): Promise<string> {
    let sceneNodeInfo = await Editor.Message.request('scene', 'query-node-tree');
    let rootInfo = sceneNodeInfo.children[0].children[0];
    let path = findNodeChildren(targetUUID, rootInfo);

    return path;
}

/**
 * 找到節點的路徑，遞迴尋找
 * @param targetUUID 目標的uuid
 * @param nodeInfo 節點資訊
 * @param path 目前路徑
 * @returns 節點路徑
 */
function findNodeChildren(targetUUID: string, nodeInfo: any, path: string = ''): string {
    let nodePath = path ? `${path}/${nodeInfo.name}` : nodeInfo.name;

    if (nodeInfo.uuid === targetUUID) {
        return nodePath;
    }

    if (nodeInfo.children.length > 0) {
        for (let index = 0; index < nodeInfo.children.length; index++) {
            const child = nodeInfo.children[index];
            let result = findNodeChildren(targetUUID, child, nodePath);

            if (result !== '') {
                return result;
            }
        }
    }

    return '';
}

export async function sceneReady(ctx: PrefabScanContext, assetUUID: string) {
    if (!ctx.isCheckMask) return;

    const info = ctx.prefabInfos[ctx.currentIndex];
    if (assetUUID === info.uuid) {
        await scanAndConvertMask(ctx, info);
    }
}

async function scanAndConvertMask(ctx: PrefabScanContext, info: AssetInfo): Promise<void> {
    const options: ExecuteSceneScriptMethodOptions = {
        name: packageJSON.name,
        method: 'scanMask',
        args: [],
    };

    const maskResult = await Editor.Message.request('scene', 'execute-scene-script', options);

    let prefabObj: any = info;
    if (maskResult.details.length > 0) {
        let maskNodeInfos = await convertMaskType(maskResult.details, true);
        prefabObj['details'] = maskNodeInfos;
        ctx.result.push(prefabObj);
        await Editor.Message.request('scene', 'save-scene');
    }

    await Editor.Message.request('scene', 'close-scene');
    ctx.currentIndex++;

    if (ctx.currentIndex >= ctx.prefabInfos.length) {
        if (ctx.result.length > 0) {
            let resultStr = '變更的Mask節點資訊如下：\n';

            for (let prefabIndex = 0; prefabIndex < ctx.result.length; prefabIndex++) {
                let prefabStr = '';
                const prefab = ctx.result[prefabIndex];

                prefabStr += `Prefab：${prefab.name}\n`;
                prefabStr += `UUID：${prefab.uuid}\n`;
                prefabStr += '詳細節點：\n';

                for (let index = 0; index < prefab.details.length; index++) {
                    const data = prefab.details[index];

                    prefabStr += `　名稱：${data.name}\n`;//一定全形空白才能正常顯示
                    prefabStr += `　路徑：${data.path}\n`;

                    if (index !== prefab.details.length - 1) {
                        prefabStr += '　-\n';
                    }
                }

                if (prefabIndex !== ctx.result.length - 1) {
                    prefabStr += '\n-\n'; // \n\n沒辦法換行是空白的
                }

                resultStr += prefabStr;
            }

            showLog(resultStr);
        }
        else {
            showLog('沒有需要轉換的Mask');
        }

        ctx.isCheckMask = false;
    }
    else {
        Editor.Message.send(packageJSON.name, 'open-current-prefab');
    }
}

export function addComma(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}