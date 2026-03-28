"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNodePositionZ = exports.afterReload = void 0;
const Utils_1 = require("./Utils");
function afterReload() {
    // 在這裡實作插件被重新載入後的邏輯
}
exports.afterReload = afterReload;
function checkNodePositionZ(message, isUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let prefabUUIDs = yield getAllPrefabUUIDs(message, isUrl);
            if (prefabUUIDs.length > 0) {
                yield checkPrefabPosition(prefabUUIDs);
                (0, Utils_1.showLog)(Editor.I18n.t('check-pos-z.convert_complete'));
            }
            else {
                (0, Utils_1.showLog)(Editor.I18n.t('check-pos-z.no_prefab'));
            }
        }
        catch (error) {
            (0, Utils_1.showError)("catch error in convert process", error);
        }
    });
}
exports.checkNodePositionZ = checkNodePositionZ;
function getAllPrefabUUIDs(message, isUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let prefabUUIDs = [];
        let url = isUrl ? message : yield Editor.Message.request('asset-db', 'query-url', message); //轉成url，檢查路徑是否是在專案內
        if (url) {
            let globUrl = url.replace(/\\/g, '/'); //要把他轉成glob格式，API需求
            globUrl += '/*.prefab'; //只抓取prefab檔案
            let assets = yield Editor.Message.request('asset-db', 'query-assets', { pattern: globUrl });
            for (let index = 0; index < assets.length; index++) {
                const asset = assets[index];
                prefabUUIDs.push(asset.uuid);
            }
        }
        else {
            (0, Utils_1.showError)(Editor.I18n.t("check-pos-z.folderNotInProject"));
        }
        return prefabUUIDs;
    });
}
function checkPrefabPosition(prefabUUIDs) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < prefabUUIDs.length; index++) {
            const uuid = prefabUUIDs[index];
            let rootNodeList = yield getRootNode(uuid);
            let rootNode = rootNodeList.children[0];
            yield setNodePositionZ(rootNode);
            yield Editor.Message.request('scene', 'save-scene');
            yield Editor.Message.request('scene', 'close-scene');
        }
    });
}
function getRootNode(uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Editor.Message.request('asset-db', 'open-asset', uuid);
        yield (0, Utils_1.waitTime)(500); // 等待prefab打開
        let sceneRootNodeTree = yield Editor.Message.request('scene', 'query-node-tree');
        let sceneRootNodeTreeInode;
        sceneRootNodeTreeInode = sceneRootNodeTree;
        return sceneRootNodeTreeInode;
    });
}
function setNodePositionZ(rootNode, isChildren = false) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < rootNode.children.length; index++) {
            const uuid = isChildren ? rootNode.children[index].value.uuid : rootNode.children[index].uuid;
            let node = yield Editor.Message.request('scene', 'query-node', uuid);
            if (node) {
                let pos = node.position.value;
                let result = yield Editor.Message.request('scene', 'set-property', {
                    uuid: uuid,
                    path: 'position',
                    dump: {
                        type: 'cc.Vec3',
                        value: {
                            x: pos.x,
                            y: pos.y,
                            z: 0,
                        },
                    }
                });
                if (result) {
                    if (node.children.length > 0) {
                        yield setNodePositionZ(node, true);
                    }
                }
                else {
                    (0, Utils_1.showError)(Editor.I18n.t("check-pos-z.no_find_property"));
                }
            }
            else {
                (0, Utils_1.showError)(Editor.I18n.t("check-pos-z.no_find_node"));
            }
        }
    });
}
