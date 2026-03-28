import * as fs from 'fs';
import { showLog, showWarn, showError, waitTime } from './Utils';
import { BasePropertyCount, defaultRealCurvePoints } from './Const';

let lastPath = Editor.Project.path + '\\assets';

export function afterReload() {

}

export async function exportComponentProps(nodeUUID: string, compName: string, filename: string): Promise<string> {
    // 取得 Node 資訊
    const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);

    // 找指定的 component
    const comp = nodeInfo.__comps__.find((c) => c.type === compName);
    if (!comp) {
        showWarn(`Node 上沒有找到 ${compName}`);
        return;
    }

    // 序列化屬性
    const json = JSON.stringify(comp.value, null, 2);

    const savePath: { canceled: boolean; filePath: string; } = await Editor.Dialog.save({
        title: '請輸出匯出檔名',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        path: lastPath + `\\${filename}.json`,
    })

    if (!savePath.canceled) {
        fs.writeFileSync(savePath.filePath, json, 'utf-8');

        showLog(`已輸出到 ${savePath.filePath}`);

        await Editor.Message.request('scene', 'save-scene');

        lastPath = savePath.filePath;
        return savePath.filePath;
    }
    else {
        showLog(`匯出取消`);
        return null;
    }
}

export async function importComponentProps(nodeUUID: string, jsonUUID: string): Promise<boolean> {
    // 取得 json 資訊
    const jsonAsset = await Editor.Message.request('asset-db', 'query-asset-info', jsonUUID);
    const json = fs.readFileSync(jsonAsset.file, 'utf-8');
    const jsonData = JSON.parse(json);

    const match = jsonData.name.value.match(/<([^>]+)>/);
    const componentName = match[1];

    let nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
    let comp = nodeInfo.__comps__.find((c) => c.type === componentName);

    if (!comp) {
        showLog(`[ImportJson] Node 上沒有找到 ${componentName}，創建新組件`);
        await Editor.Message.request('scene', 'create-component', {
            uuid: nodeUUID,
            component: componentName,
        });

        nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
        comp = nodeInfo.__comps__.find((c) => c.type === componentName);
        if (!comp) {
            showLog(`[ImportJson] Node 添加組件失敗 ${componentName}`);
            return false;
        }
    }

    const compIndex = nodeInfo.__comps__.indexOf(comp);

    let count = 0;

    // 設定屬性
    for (const key in jsonData) {
        count++;

        if (count <= BasePropertyCount) { // 略過基本屬性
            continue;
        }

        if (jsonData[key].type === 'cc.RealCurve' && !jsonData[key].value.keyFrames) {
            jsonData[key].value = defaultRealCurvePoints;
        }

        await Editor.Message.request('scene', 'set-property', {
            uuid: nodeUUID,
            path: `__comps__[${compIndex}].${key}`,
            dump: {
                type: jsonData[key].type,
                value: jsonData[key].value,
            },
        });
    }

    return true;
}

export async function exportJsonForComponent(nodeUUID: string, compName: string, filename: string): Promise<void> {
    // 取得 Node 資訊
    const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);

    // 找指定的 component
    const comp = nodeInfo.__comps__.find((c) => c.type === compName);
    if (!comp) {
        showWarn(`Node 上沒有找到 ${compName}`);
        return;
    }

    let newData = await handleCompData(comp);
    let compData = createComponentData(newData);
    // 序列化屬性
    let json = JSON.stringify(compData, null, 2);

    const savePath: { canceled: boolean; filePath: string; } = await Editor.Dialog.save({
        title: '請輸入匯出檔名',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        path: lastPath + `\\${filename}.json`,
    })

    if (!savePath.canceled) {
        fs.writeFileSync(savePath.filePath, json, 'utf-8');

        lastPath = savePath.filePath;

        await Editor.Message.request('scene', 'save-scene');

        showLog(`[ExportJson] 已輸出到 ${savePath.filePath}`);

    }
    else {
        showLog(`[ExportJson] 匯出取消`);
    }
}

/**
 * 刪除不需要的屬性
 * @param originData component所有屬性資料
 */
export function handleCompData(originData: any): any {
    let handleCompData: any = originData.value;

    let count = 0;
    for (const key in handleCompData) {
        count++;

        if (count <= BasePropertyCount + 3) { // 略過基本屬性，還有importJson跟exportJson
            delete handleCompData[key];
        }
        else {
            break;
        }
    }

    return handleCompData;
}

/**
 * 產生組件資料
 * @param originData component屬性資料
 * @returns 
 */
export function createComponentData(originData: any): any {
    let componentData: any = {};

    for (const key in originData) {
        if (typeof originData[key].value === 'object') {
            if (originData[key].type === 'cc.RealCurve') {
                let realCurveData: any = {};
                if (!originData[key].value.keyFrames) {
                    realCurveData.value = defaultRealCurvePoints;
                }
                else {
                    realCurveData.value = originData[key].value;
                }

                realCurveData.isRealCurve = true;
                componentData[key] = realCurveData;
            }
            else {
                componentData[key] = createComponentData(originData[key].value);
            }
        }
        else {
            componentData[key] = originData[key].value;
        }
    }

    return componentData;
}