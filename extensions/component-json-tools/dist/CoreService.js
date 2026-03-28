"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterReload = afterReload;
exports.exportComponentProps = exportComponentProps;
exports.importComponentProps = importComponentProps;
exports.exportJsonForComponent = exportJsonForComponent;
exports.handleCompData = handleCompData;
exports.createComponentData = createComponentData;
const fs = __importStar(require("fs"));
const Utils_1 = require("./Utils");
const Const_1 = require("./Const");
let lastPath = Editor.Project.path + '\\assets';
function afterReload() {
}
async function exportComponentProps(nodeUUID, compName, filename) {
    // 取得 Node 資訊
    const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
    // 找指定的 component
    const comp = nodeInfo.__comps__.find((c) => c.type === compName);
    if (!comp) {
        (0, Utils_1.showWarn)(`Node 上沒有找到 ${compName}`);
        return;
    }
    // 序列化屬性
    const json = JSON.stringify(comp.value, null, 2);
    const savePath = await Editor.Dialog.save({
        title: '請輸出匯出檔名',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        path: lastPath + `\\${filename}.json`,
    });
    if (!savePath.canceled) {
        fs.writeFileSync(savePath.filePath, json, 'utf-8');
        (0, Utils_1.showLog)(`已輸出到 ${savePath.filePath}`);
        await Editor.Message.request('scene', 'save-scene');
        lastPath = savePath.filePath;
        return savePath.filePath;
    }
    else {
        (0, Utils_1.showLog)(`匯出取消`);
        return null;
    }
}
async function importComponentProps(nodeUUID, jsonUUID) {
    // 取得 json 資訊
    const jsonAsset = await Editor.Message.request('asset-db', 'query-asset-info', jsonUUID);
    const json = fs.readFileSync(jsonAsset.file, 'utf-8');
    const jsonData = JSON.parse(json);
    const match = jsonData.name.value.match(/<([^>]+)>/);
    const componentName = match[1];
    let nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
    let comp = nodeInfo.__comps__.find((c) => c.type === componentName);
    if (!comp) {
        (0, Utils_1.showLog)(`[ImportJson] Node 上沒有找到 ${componentName}，創建新組件`);
        await Editor.Message.request('scene', 'create-component', {
            uuid: nodeUUID,
            component: componentName,
        });
        nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
        comp = nodeInfo.__comps__.find((c) => c.type === componentName);
        if (!comp) {
            (0, Utils_1.showLog)(`[ImportJson] Node 添加組件失敗 ${componentName}`);
            return false;
        }
    }
    const compIndex = nodeInfo.__comps__.indexOf(comp);
    let count = 0;
    // 設定屬性
    for (const key in jsonData) {
        count++;
        if (count <= Const_1.BasePropertyCount) { // 略過基本屬性
            continue;
        }
        if (jsonData[key].type === 'cc.RealCurve' && !jsonData[key].value.keyFrames) {
            jsonData[key].value = Const_1.defaultRealCurvePoints;
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
async function exportJsonForComponent(nodeUUID, compName, filename) {
    // 取得 Node 資訊
    const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUUID);
    // 找指定的 component
    const comp = nodeInfo.__comps__.find((c) => c.type === compName);
    if (!comp) {
        (0, Utils_1.showWarn)(`Node 上沒有找到 ${compName}`);
        return;
    }
    let newData = await handleCompData(comp);
    let compData = createComponentData(newData);
    // 序列化屬性
    let json = JSON.stringify(compData, null, 2);
    const savePath = await Editor.Dialog.save({
        title: '請輸入匯出檔名',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        path: lastPath + `\\${filename}.json`,
    });
    if (!savePath.canceled) {
        fs.writeFileSync(savePath.filePath, json, 'utf-8');
        lastPath = savePath.filePath;
        await Editor.Message.request('scene', 'save-scene');
        (0, Utils_1.showLog)(`[ExportJson] 已輸出到 ${savePath.filePath}`);
    }
    else {
        (0, Utils_1.showLog)(`[ExportJson] 匯出取消`);
    }
}
/**
 * 刪除不需要的屬性
 * @param originData component所有屬性資料
 */
function handleCompData(originData) {
    let handleCompData = originData.value;
    let count = 0;
    for (const key in handleCompData) {
        count++;
        if (count <= Const_1.BasePropertyCount + 3) { // 略過基本屬性，還有importJson跟exportJson
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
function createComponentData(originData) {
    let componentData = {};
    for (const key in originData) {
        if (typeof originData[key].value === 'object') {
            if (originData[key].type === 'cc.RealCurve') {
                let realCurveData = {};
                if (!originData[key].value.keyFrames) {
                    realCurveData.value = Const_1.defaultRealCurvePoints;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29yZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvQ29yZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxrQ0FFQztBQUVELG9EQWtDQztBQUVELG9EQXNEQztBQUVELHdEQW1DQztBQU1ELHdDQWdCQztBQU9ELGtEQTJCQztBQWpNRCx1Q0FBeUI7QUFDekIsbUNBQWlFO0FBQ2pFLG1DQUFvRTtBQUVwRSxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7QUFFaEQsU0FBZ0IsV0FBVztBQUUzQixDQUFDO0FBRU0sS0FBSyxVQUFVLG9CQUFvQixDQUFDLFFBQWdCLEVBQUUsUUFBZ0IsRUFBRSxRQUFnQjtJQUMzRixhQUFhO0lBQ2IsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRS9FLGlCQUFpQjtJQUNqQixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQztJQUNqRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDUixJQUFBLGdCQUFRLEVBQUMsY0FBYyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLE9BQU87SUFDWCxDQUFDO0lBRUQsUUFBUTtJQUNSLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFakQsTUFBTSxRQUFRLEdBQTZDLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEYsS0FBSyxFQUFFLFNBQVM7UUFDaEIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDakQsSUFBSSxFQUFFLFFBQVEsR0FBRyxLQUFLLFFBQVEsT0FBTztLQUN4QyxDQUFDLENBQUE7SUFFRixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JCLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFbkQsSUFBQSxlQUFPLEVBQUMsUUFBUSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUVyQyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUVwRCxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUM3QixPQUFPLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFDN0IsQ0FBQztTQUNJLENBQUM7UUFDRixJQUFBLGVBQU8sRUFBQyxNQUFNLENBQUMsQ0FBQztRQUNoQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQztBQUVNLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxRQUFnQixFQUFFLFFBQWdCO0lBQ3pFLGFBQWE7SUFDYixNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVsQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDckQsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRS9CLElBQUksUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3RSxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxhQUFhLENBQUMsQ0FBQztJQUVwRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDUixJQUFBLGVBQU8sRUFBQywyQkFBMkIsYUFBYSxRQUFRLENBQUMsQ0FBQztRQUMxRCxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtZQUN0RCxJQUFJLEVBQUUsUUFBUTtZQUNkLFNBQVMsRUFBRSxhQUFhO1NBQzNCLENBQUMsQ0FBQztRQUVILFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekUsSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNSLElBQUEsZUFBTyxFQUFDLDRCQUE0QixhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFbkQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBRWQsT0FBTztJQUNQLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7UUFDekIsS0FBSyxFQUFFLENBQUM7UUFFUixJQUFJLEtBQUssSUFBSSx5QkFBaUIsRUFBRSxDQUFDLENBQUMsU0FBUztZQUN2QyxTQUFTO1FBQ2IsQ0FBQztRQUVELElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxjQUFjLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsOEJBQXNCLENBQUM7UUFDakQsQ0FBQztRQUVELE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRTtZQUNsRCxJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxhQUFhLFNBQVMsS0FBSyxHQUFHLEVBQUU7WUFDdEMsSUFBSSxFQUFFO2dCQUNGLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSTtnQkFDeEIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLO2FBQzdCO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFTSxLQUFLLFVBQVUsc0JBQXNCLENBQUMsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLFFBQWdCO0lBQzdGLGFBQWE7SUFDYixNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFL0UsaUJBQWlCO0lBQ2pCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNSLElBQUEsZ0JBQVEsRUFBQyxjQUFjLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbkMsT0FBTztJQUNYLENBQUM7SUFFRCxJQUFJLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QyxJQUFJLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QyxRQUFRO0lBQ1IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTdDLE1BQU0sUUFBUSxHQUE2QyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2pELElBQUksRUFBRSxRQUFRLEdBQUcsS0FBSyxRQUFRLE9BQU87S0FDeEMsQ0FBQyxDQUFBO0lBRUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNyQixFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRW5ELFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBRTdCLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXBELElBQUEsZUFBTyxFQUFDLHFCQUFxQixRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUV0RCxDQUFDO1NBQ0ksQ0FBQztRQUNGLElBQUEsZUFBTyxFQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDakMsQ0FBQztBQUNMLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixjQUFjLENBQUMsVUFBZTtJQUMxQyxJQUFJLGNBQWMsR0FBUSxVQUFVLENBQUMsS0FBSyxDQUFDO0lBRTNDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLEtBQUssTUFBTSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7UUFDL0IsS0FBSyxFQUFFLENBQUM7UUFFUixJQUFJLEtBQUssSUFBSSx5QkFBaUIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlDQUFpQztZQUNuRSxPQUFPLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixDQUFDO2FBQ0ksQ0FBQztZQUNGLE1BQU07UUFDVixDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU8sY0FBYyxDQUFDO0FBQzFCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsVUFBZTtJQUMvQyxJQUFJLGFBQWEsR0FBUSxFQUFFLENBQUM7SUFFNUIsS0FBSyxNQUFNLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUMzQixJQUFJLE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM1QyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQzFDLElBQUksYUFBYSxHQUFRLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ25DLGFBQWEsQ0FBQyxLQUFLLEdBQUcsOEJBQXNCLENBQUM7Z0JBQ2pELENBQUM7cUJBQ0ksQ0FBQztvQkFDRixhQUFhLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ2hELENBQUM7Z0JBRUQsYUFBYSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7Z0JBQ2pDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUM7WUFDdkMsQ0FBQztpQkFDSSxDQUFDO2dCQUNGLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEUsQ0FBQztRQUNMLENBQUM7YUFDSSxDQUFDO1lBQ0YsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDL0MsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN6QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgeyBzaG93TG9nLCBzaG93V2Fybiwgc2hvd0Vycm9yLCB3YWl0VGltZSB9IGZyb20gJy4vVXRpbHMnO1xyXG5pbXBvcnQgeyBCYXNlUHJvcGVydHlDb3VudCwgZGVmYXVsdFJlYWxDdXJ2ZVBvaW50cyB9IGZyb20gJy4vQ29uc3QnO1xyXG5cclxubGV0IGxhc3RQYXRoID0gRWRpdG9yLlByb2plY3QucGF0aCArICdcXFxcYXNzZXRzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZnRlclJlbG9hZCgpIHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRDb21wb25lbnRQcm9wcyhub2RlVVVJRDogc3RyaW5nLCBjb21wTmFtZTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIC8vIOWPluW+lyBOb2RlIOizh+ioilxyXG4gICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVVVSUQpO1xyXG5cclxuICAgIC8vIOaJvuaMh+WumueahCBjb21wb25lbnRcclxuICAgIGNvbnN0IGNvbXAgPSBub2RlSW5mby5fX2NvbXBzX18uZmluZCgoYykgPT4gYy50eXBlID09PSBjb21wTmFtZSk7XHJcbiAgICBpZiAoIWNvbXApIHtcclxuICAgICAgICBzaG93V2FybihgTm9kZSDkuIrmspLmnInmib7liLAgJHtjb21wTmFtZX1gKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8g5bqP5YiX5YyW5bGs5oCnXHJcbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkoY29tcC52YWx1ZSwgbnVsbCwgMik7XHJcblxyXG4gICAgY29uc3Qgc2F2ZVBhdGg6IHsgY2FuY2VsZWQ6IGJvb2xlYW47IGZpbGVQYXRoOiBzdHJpbmc7IH0gPSBhd2FpdCBFZGl0b3IuRGlhbG9nLnNhdmUoe1xyXG4gICAgICAgIHRpdGxlOiAn6KuL6Ly45Ye65Yyv5Ye65qqU5ZCNJyxcclxuICAgICAgICBmaWx0ZXJzOiBbeyBuYW1lOiAnSlNPTicsIGV4dGVuc2lvbnM6IFsnanNvbiddIH1dLFxyXG4gICAgICAgIHBhdGg6IGxhc3RQYXRoICsgYFxcXFwke2ZpbGVuYW1lfS5qc29uYCxcclxuICAgIH0pXHJcblxyXG4gICAgaWYgKCFzYXZlUGF0aC5jYW5jZWxlZCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGguZmlsZVBhdGgsIGpzb24sICd1dGYtOCcpO1xyXG5cclxuICAgICAgICBzaG93TG9nKGDlt7LovLjlh7rliLAgJHtzYXZlUGF0aC5maWxlUGF0aH1gKTtcclxuXHJcbiAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2F2ZS1zY2VuZScpO1xyXG5cclxuICAgICAgICBsYXN0UGF0aCA9IHNhdmVQYXRoLmZpbGVQYXRoO1xyXG4gICAgICAgIHJldHVybiBzYXZlUGF0aC5maWxlUGF0aDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHNob3dMb2coYOWMr+WHuuWPlua2iGApO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0Q29tcG9uZW50UHJvcHMobm9kZVVVSUQ6IHN0cmluZywganNvblVVSUQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgLy8g5Y+W5b6XIGpzb24g6LOH6KiKXHJcbiAgICBjb25zdCBqc29uQXNzZXQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywganNvblVVSUQpO1xyXG4gICAgY29uc3QganNvbiA9IGZzLnJlYWRGaWxlU3luYyhqc29uQXNzZXQuZmlsZSwgJ3V0Zi04Jyk7XHJcbiAgICBjb25zdCBqc29uRGF0YSA9IEpTT04ucGFyc2UoanNvbik7XHJcblxyXG4gICAgY29uc3QgbWF0Y2ggPSBqc29uRGF0YS5uYW1lLnZhbHVlLm1hdGNoKC88KFtePl0rKT4vKTtcclxuICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBtYXRjaFsxXTtcclxuXHJcbiAgICBsZXQgbm9kZUluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVVVSUQpO1xyXG4gICAgbGV0IGNvbXAgPSBub2RlSW5mby5fX2NvbXBzX18uZmluZCgoYykgPT4gYy50eXBlID09PSBjb21wb25lbnROYW1lKTtcclxuXHJcbiAgICBpZiAoIWNvbXApIHtcclxuICAgICAgICBzaG93TG9nKGBbSW1wb3J0SnNvbl0gTm9kZSDkuIrmspLmnInmib7liLAgJHtjb21wb25lbnROYW1lfe+8jOWJteW7uuaWsOe1hOS7tmApO1xyXG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1jb21wb25lbnQnLCB7XHJcbiAgICAgICAgICAgIHV1aWQ6IG5vZGVVVUlELFxyXG4gICAgICAgICAgICBjb21wb25lbnQ6IGNvbXBvbmVudE5hbWUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5vZGVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVVUlEKTtcclxuICAgICAgICBjb21wID0gbm9kZUluZm8uX19jb21wc19fLmZpbmQoKGMpID0+IGMudHlwZSA9PT0gY29tcG9uZW50TmFtZSk7XHJcbiAgICAgICAgaWYgKCFjb21wKSB7XHJcbiAgICAgICAgICAgIHNob3dMb2coYFtJbXBvcnRKc29uXSBOb2RlIOa3u+WKoOe1hOS7tuWkseaVlyAke2NvbXBvbmVudE5hbWV9YCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tcEluZGV4ID0gbm9kZUluZm8uX19jb21wc19fLmluZGV4T2YoY29tcCk7XHJcblxyXG4gICAgbGV0IGNvdW50ID0gMDtcclxuXHJcbiAgICAvLyDoqK3lrprlsazmgKdcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGpzb25EYXRhKSB7XHJcbiAgICAgICAgY291bnQrKztcclxuXHJcbiAgICAgICAgaWYgKGNvdW50IDw9IEJhc2VQcm9wZXJ0eUNvdW50KSB7IC8vIOeVpemBjuWfuuacrOWxrOaAp1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChqc29uRGF0YVtrZXldLnR5cGUgPT09ICdjYy5SZWFsQ3VydmUnICYmICFqc29uRGF0YVtrZXldLnZhbHVlLmtleUZyYW1lcykge1xyXG4gICAgICAgICAgICBqc29uRGF0YVtrZXldLnZhbHVlID0gZGVmYXVsdFJlYWxDdXJ2ZVBvaW50cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgdXVpZDogbm9kZVVVSUQsXHJcbiAgICAgICAgICAgIHBhdGg6IGBfX2NvbXBzX19bJHtjb21wSW5kZXh9XS4ke2tleX1gLFxyXG4gICAgICAgICAgICBkdW1wOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBqc29uRGF0YVtrZXldLnR5cGUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToganNvbkRhdGFba2V5XS52YWx1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydEpzb25Gb3JDb21wb25lbnQobm9kZVVVSUQ6IHN0cmluZywgY29tcE5hbWU6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgLy8g5Y+W5b6XIE5vZGUg6LOH6KiKXHJcbiAgICBjb25zdCBub2RlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVVVJRCk7XHJcblxyXG4gICAgLy8g5om+5oyH5a6a55qEIGNvbXBvbmVudFxyXG4gICAgY29uc3QgY29tcCA9IG5vZGVJbmZvLl9fY29tcHNfXy5maW5kKChjKSA9PiBjLnR5cGUgPT09IGNvbXBOYW1lKTtcclxuICAgIGlmICghY29tcCkge1xyXG4gICAgICAgIHNob3dXYXJuKGBOb2RlIOS4iuaykuacieaJvuWIsCAke2NvbXBOYW1lfWApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbmV3RGF0YSA9IGF3YWl0IGhhbmRsZUNvbXBEYXRhKGNvbXApO1xyXG4gICAgbGV0IGNvbXBEYXRhID0gY3JlYXRlQ29tcG9uZW50RGF0YShuZXdEYXRhKTtcclxuICAgIC8vIOW6j+WIl+WMluWxrOaAp1xyXG4gICAgbGV0IGpzb24gPSBKU09OLnN0cmluZ2lmeShjb21wRGF0YSwgbnVsbCwgMik7XHJcblxyXG4gICAgY29uc3Qgc2F2ZVBhdGg6IHsgY2FuY2VsZWQ6IGJvb2xlYW47IGZpbGVQYXRoOiBzdHJpbmc7IH0gPSBhd2FpdCBFZGl0b3IuRGlhbG9nLnNhdmUoe1xyXG4gICAgICAgIHRpdGxlOiAn6KuL6Ly45YWl5Yyv5Ye65qqU5ZCNJyxcclxuICAgICAgICBmaWx0ZXJzOiBbeyBuYW1lOiAnSlNPTicsIGV4dGVuc2lvbnM6IFsnanNvbiddIH1dLFxyXG4gICAgICAgIHBhdGg6IGxhc3RQYXRoICsgYFxcXFwke2ZpbGVuYW1lfS5qc29uYCxcclxuICAgIH0pXHJcblxyXG4gICAgaWYgKCFzYXZlUGF0aC5jYW5jZWxlZCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGguZmlsZVBhdGgsIGpzb24sICd1dGYtOCcpO1xyXG5cclxuICAgICAgICBsYXN0UGF0aCA9IHNhdmVQYXRoLmZpbGVQYXRoO1xyXG5cclxuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzYXZlLXNjZW5lJyk7XHJcblxyXG4gICAgICAgIHNob3dMb2coYFtFeHBvcnRKc29uXSDlt7LovLjlh7rliLAgJHtzYXZlUGF0aC5maWxlUGF0aH1gKTtcclxuXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBzaG93TG9nKGBbRXhwb3J0SnNvbl0g5Yyv5Ye65Y+W5raIYCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDliKrpmaTkuI3pnIDopoHnmoTlsazmgKdcclxuICogQHBhcmFtIG9yaWdpbkRhdGEgY29tcG9uZW505omA5pyJ5bGs5oCn6LOH5paZXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlQ29tcERhdGEob3JpZ2luRGF0YTogYW55KTogYW55IHtcclxuICAgIGxldCBoYW5kbGVDb21wRGF0YTogYW55ID0gb3JpZ2luRGF0YS52YWx1ZTtcclxuXHJcbiAgICBsZXQgY291bnQgPSAwO1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gaGFuZGxlQ29tcERhdGEpIHtcclxuICAgICAgICBjb3VudCsrO1xyXG5cclxuICAgICAgICBpZiAoY291bnQgPD0gQmFzZVByb3BlcnR5Q291bnQgKyAzKSB7IC8vIOeVpemBjuWfuuacrOWxrOaAp++8jOmChOaciWltcG9ydEpzb27ot59leHBvcnRKc29uXHJcbiAgICAgICAgICAgIGRlbGV0ZSBoYW5kbGVDb21wRGF0YVtrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYW5kbGVDb21wRGF0YTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOeUoueUn+e1hOS7tuizh+aWmVxyXG4gKiBAcGFyYW0gb3JpZ2luRGF0YSBjb21wb25lbnTlsazmgKfos4fmlplcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50RGF0YShvcmlnaW5EYXRhOiBhbnkpOiBhbnkge1xyXG4gICAgbGV0IGNvbXBvbmVudERhdGE6IGFueSA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIG9yaWdpbkRhdGEpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9yaWdpbkRhdGFba2V5XS52YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgaWYgKG9yaWdpbkRhdGFba2V5XS50eXBlID09PSAnY2MuUmVhbEN1cnZlJykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlYWxDdXJ2ZURhdGE6IGFueSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvcmlnaW5EYXRhW2tleV0udmFsdWUua2V5RnJhbWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhbEN1cnZlRGF0YS52YWx1ZSA9IGRlZmF1bHRSZWFsQ3VydmVQb2ludHM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZWFsQ3VydmVEYXRhLnZhbHVlID0gb3JpZ2luRGF0YVtrZXldLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlYWxDdXJ2ZURhdGEuaXNSZWFsQ3VydmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50RGF0YVtrZXldID0gcmVhbEN1cnZlRGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudERhdGFba2V5XSA9IGNyZWF0ZUNvbXBvbmVudERhdGEob3JpZ2luRGF0YVtrZXldLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29tcG9uZW50RGF0YVtrZXldID0gb3JpZ2luRGF0YVtrZXldLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29tcG9uZW50RGF0YTtcclxufSJdfQ==