"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDummyCleanName = exports.disableExtension = exports.enableExtension = exports.deleteExtension = exports.reloadExtension = exports.openExtensionInVscode = exports.createExtension = exports.checkInputName = exports.getTemplateHint = exports.clearExtensionDummy = exports.refreshExtensionsDummy = exports.installAllExtensionsDependencies = exports.afterReload = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const package_json_1 = __importDefault(require("../package.json"));
const child_process_1 = require("child_process");
const Const_1 = require("./Const");
const Utils_1 = require("./Utils");
const PLUGIN_DIR = (0, path_1.join)(Editor.Project.path, 'plugin');
const EXTENSION_DIR = (0, path_1.join)(Editor.Project.path, 'extensions');
const QUICK_PLUGIN_DIR = (0, path_1.join)(PLUGIN_DIR, package_json_1.default.name);
/**
 * 透過管理插件重新載入模組後的事件
 */
function afterReload() {
    Editor.Dialog.info(`${package_json_1.default.name} 插件重新載入完成\n該插件需要重新啟動編輯器後才能顯示在資源管理器，要立刻重啟嗎?`, {
        buttons: ['確定', '取消'],
        title: '重新啟動編輯器',
    }).then(result => {
        if (result.response === 0) {
            Editor.Message.send('asset-db', 'refresh');
        }
    });
}
exports.afterReload = afterReload;
/**
 * 安裝所有插件的 npm 依賴
 */
function installAllExtensionsDependencies() {
    if (checkNodeEnvironment()) {
        const extensions = getAllDownloadedExtensionsInfo();
        for (const extension of extensions) {
            (0, Utils_1.showLog)(`正在安裝插件 [${extension.name}] 的依賴套件`);
            (0, child_process_1.execSync)('npm install', { cwd: extension.path, stdio: 'inherit' });
            (0, Utils_1.showLog)(`插件 [${extension.name}] 的依賴套件安裝完成`);
        }
    }
    else {
        (0, Utils_1.showWarn)(`未檢測到 Node.js 環境，請安裝 Node.js 後再嘗試。`);
    }
    (0, Utils_1.showLog)(`✅ 所有插件的依賴套件安裝完成`);
}
exports.installAllExtensionsDependencies = installAllExtensionsDependencies;
/**
 * 刷新已註冊的插件映射檔案
 */
function refreshExtensionsDummy() {
    if (!(0, fs_1.existsSync)(PLUGIN_DIR)) {
        (0, fs_1.mkdirSync)(PLUGIN_DIR);
    }
    clearExtensionDummy();
    if (!(0, fs_1.existsSync)(QUICK_PLUGIN_DIR)) {
        (0, fs_1.mkdirSync)(QUICK_PLUGIN_DIR);
    }
    if ((0, fs_1.existsSync)(EXTENSION_DIR)) {
        const extensions = getAllDownloadedExtensionsInfo().filter(ext => ext.name !== package_json_1.default.name);
        for (const extension of extensions) {
            createExtensionDummy(extension.name, extension.enable);
        }
    }
    (0, Utils_1.showLog)(`✅ 所有插件的映射檔案刷新完成`);
}
exports.refreshExtensionsDummy = refreshExtensionsDummy;
/**
 * 清除所有插件映射檔案
 */
function clearExtensionDummy() {
    if ((0, fs_1.existsSync)(QUICK_PLUGIN_DIR)) {
        const files = (0, fs_1.readdirSync)(QUICK_PLUGIN_DIR);
        files.forEach(file => {
            if (file !== '.gitkeep') { // Preserve .gitkeep if it exists
                const filePath = (0, path_1.join)(QUICK_PLUGIN_DIR, file);
                const metaPath = (0, path_1.join)(QUICK_PLUGIN_DIR, `${file}.meta`);
                try {
                    (0, fs_1.rmSync)(filePath, { recursive: true, force: true });
                    (0, fs_1.rmSync)(metaPath, { recursive: true, force: true });
                    //showLog(`刪除插件映射檔案: ${file}`);
                }
                catch (error) {
                    (0, Utils_1.showError)(`Failed to remove: ${file}`, error);
                }
            }
        });
    }
}
exports.clearExtensionDummy = clearExtensionDummy;
/**
 * 取得所有在 <專案根目錄>/extensions 底下的插件資訊
 */
function getAllDownloadedExtensionsInfo() {
    const allPackages = Editor.Package.getPackages();
    const extensions = allPackages.filter(pkg => pkg.path.startsWith(EXTENSION_DIR));
    return extensions;
}
/**
 * 創建一個插件映射檔案
 * @param extensionName 插件名稱
 * @param enable 插件是否啟用
 */
async function createExtensionDummy(extensionName, enable = true) {
    const dummyFileName = addPrefixToDummyFileName(extensionName, enable);
    const dummyFile = (0, path_1.join)(QUICK_PLUGIN_DIR, dummyFileName);
    const dummyPath = `db://${package_json_1.default.name}/${package_json_1.default.name}/${dummyFileName}`;
    (0, fs_1.writeFileSync)(dummyFile, '');
    //showLog(`創建插件映射檔案: ${dummyFile}`);
    await Editor.Message.request('asset-db', 'reimport-asset', dummyPath);
    Editor.Message.send('asset-db', 'refresh-asset', dummyPath);
}
function getTemplateHint(templateName) {
    switch (templateName) {
        case Const_1.BLANK_TEMPLATE:
            return '該模板提供一個簡單的右鍵菜單示範\n創建該模板後，對 assets 底下的 Game 資料夾內任一資源點擊右鍵，可看到"遊戲資源右鍵菜單選項"';
        case Const_1.HTML_TEMPLATE:
            return '該模板提供簡易的 HTML 面板示範\n創建該模板後，可在上方工具列中看到 <你取的插件名稱> 選項，點擊裡面的 "默認面板" 即可開啟面板';
        default:
            return '';
    }
}
exports.getTemplateHint = getTemplateHint;
function checkInputName(name) {
    let errorResult = '';
    const templateNameList = [Const_1.BLANK_TEMPLATE, Const_1.HTML_TEMPLATE];
    if (name === '') {
        errorResult = '插件名稱不能為空';
    }
    else if (name.startsWith('_')) {
        errorResult = '插件名稱不能以 _ 開頭';
    }
    else if (!/^[a-z0-9_-]+$/.test(name)) {
        errorResult = '插件名稱只能包含小寫英文字母、數字、"_"號和"-"號';
    }
    else if ((0, fs_1.existsSync)((0, path_1.join)(EXTENSION_DIR, name))) {
        errorResult = '存在同名插件資料夾';
    }
    else if (templateNameList.includes(name)) {
        errorResult = '插件名稱不能與模板名稱相同';
    }
    return errorResult;
}
exports.checkInputName = checkInputName;
/**
 * 創建一個插件
 * @param template 插件模板名稱
 * @param name 插件名稱
 */
async function createExtension(template, name) {
    const zipFilePath = (0, path_1.join)(EXTENSION_DIR, package_json_1.default.name, `static/extension-template/${template}.zip`);
    const templatePath = (0, path_1.join)(EXTENSION_DIR, template);
    const extensionPath = (0, path_1.join)(EXTENSION_DIR, name);
    try {
        // 把模板解壓到 extensions 目錄下
        // showLog(`解壓插件模板 ${template}`);
        await Editor.Utils.File.unzip(zipFilePath, EXTENSION_DIR);
        //showLog(`解壓插件模板 ${template} 完成`);
        // 重新命名解壓後的模板資料夾
        // showLog(`重新命名解壓後的模板資料夾 ${template} -> ${name}`);
        (0, fs_1.renameSync)(templatePath, extensionPath);
        //showLog(`重新命名解壓後的模板資料夾完成`);
        // 修改新建插件的 package.json 及 package-lock.json
        //showLog(`修改新建插件的 package.json 及 package-lock.json`);
        const packageJsonPath = (0, path_1.join)(extensionPath, 'package.json');
        const packageLockJsonPath = (0, path_1.join)(extensionPath, 'package-lock.json');
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            let packageJsonContent = (0, fs_1.readFileSync)(packageJsonPath, 'utf8');
            packageJsonContent = packageJsonContent.replace(new RegExp(template, 'g'), name);
            (0, fs_1.writeFileSync)(packageJsonPath, packageJsonContent);
        }
        if ((0, fs_1.existsSync)(packageLockJsonPath)) {
            let packageLockJsonContent = (0, fs_1.readFileSync)(packageLockJsonPath, 'utf8');
            packageLockJsonContent = packageLockJsonContent.replace(new RegExp(template, 'g'), name);
            (0, fs_1.writeFileSync)(packageLockJsonPath, packageLockJsonContent);
        }
        //showLog(`修改新建插件的 package.json 及 package-lock.json 完成`);
        // 創建插件映射檔案
        //showLog(`創建插件映射檔案`);
        await createExtensionDummy(name);
        //showLog(`創建插件映射檔案完成`);
        if (checkNodeEnvironment()) {
            // 在插件根目錄執行 npm install
            try {
                (0, Utils_1.showLog)(`插件[${name}] 執行 npm install`);
                (0, child_process_1.execSync)('npm install', { cwd: extensionPath, stdio: 'inherit' });
                (0, Utils_1.showLog)(`插件[${name}] npm install 完成`);
            }
            catch (error) {
                (0, Utils_1.showWarn)(`插件[${name}] npm install 失敗`);
            }
        }
        else {
            (0, Utils_1.showWarn)(`未檢測到 Node.js 環境，跳過 npm install。請安裝 Node.js 後再嘗試。`);
        }
        // 註冊插件
        Editor.Package.register(extensionPath);
        // 啟用插件
        Editor.Package.enable(extensionPath);
        (0, Utils_1.showLog)(`✅ 插件 [${name}] 建立完成`);
    }
    catch (error) {
        (0, Utils_1.showError)(`插件 [${name}] 建立失敗:`, error);
        throw error;
    }
}
exports.createExtension = createExtension;
/**
 * 檢測是否有 Node.js 環境
 */
function checkNodeEnvironment() {
    try {
        (0, child_process_1.execSync)('node --version');
        return true;
    }
    catch (error) {
        return false;
    }
}
function openExtensionInVscode(assetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    if (extensionPath) {
        try {
            (0, child_process_1.execSync)(`code ${extensionPath} ${extensionPath}/source/main.ts`);
        }
        catch (error) {
            (0, Utils_1.showWarn)('以 vscode 開啟插件資料夾失敗，請確認是否有安裝 vscode，並確認 code 指令有效');
        }
    }
}
exports.openExtensionInVscode = openExtensionInVscode;
/**
 * 重新載入插件
 */
function reloadExtension(assetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        (0, Utils_1.showLog)(`插件 [${cleanName}] 正在重新載入`);
        // 停用插件
        Editor.Package.disable(extensionPath);
        // 在插件根目錄執行 npm run build
        try {
            (0, Utils_1.showLog)(`插件 [${cleanName}] 執行 npm run build`);
            (0, child_process_1.execSync)('npm run build', { cwd: extensionPath, encoding: 'utf-8' });
            (0, Utils_1.showLog)(`插件 [${cleanName}] npm run build 成功`);
        }
        catch (error) {
            (0, Utils_1.showError)(`插件 [${cleanName}] npm run build 失敗:`, error.stdout);
        }
        (0, Utils_1.waitTime)(0).then(() => {
            // 啟用插件
            Editor.Package.enable(extensionPath);
            (0, Utils_1.showLog)(`✅ 插件 [${cleanName}] 已重新啟用`);
            return (0, Utils_1.waitTime)(0);
        }).then(() => {
            // 傳送 after-reload 消息給重載後的插件
            Editor.Message.send(cleanName, 'after-reload');
        });
    }
    else {
        (0, Utils_1.showError)(`找不到插件: ${cleanName}`);
    }
}
exports.reloadExtension = reloadExtension;
/**
 * 刪除插件
 */
function deleteExtension(assetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        Editor.Dialog.info(`確定要刪除該插件嗎?\n插件名稱: ${cleanName}\n 插件路徑: ${extensionPath}`, {
            buttons: ['確定', '取消'],
            title: '刪除插件',
        }).then(result => {
            if (result.response === 0) {
                // 嘗試刪除兩種可能的 dummy file
                const enableDummyName = addPrefixToDummyFileName(cleanName, true);
                const disableDummyName = addPrefixToDummyFileName(cleanName, false);
                const dummyPathEnabled = (0, path_1.join)(QUICK_PLUGIN_DIR, enableDummyName);
                const dummyPathDisabled = (0, path_1.join)(QUICK_PLUGIN_DIR, disableDummyName);
                try {
                    (0, fs_1.rmSync)(extensionPath, { recursive: true, force: true });
                    if ((0, fs_1.existsSync)(extensionPath)) {
                        throw new Error();
                    }
                    if ((0, fs_1.existsSync)(dummyPathEnabled)) {
                        (0, fs_1.rmSync)(dummyPathEnabled, { recursive: true, force: true });
                    }
                    if ((0, fs_1.existsSync)(dummyPathDisabled)) {
                        (0, fs_1.rmSync)(dummyPathDisabled, { recursive: true, force: true });
                    }
                    Editor.Package.unregister(extensionPath);
                    (0, Utils_1.showLog)(`✅ 插件 [${cleanName}] 已刪除`);
                }
                catch (error) {
                    (0, Utils_1.showError)(`刪除插件失敗，檔案或資料夾可能在使用狀態`);
                }
            }
        });
    }
    else {
        (0, Utils_1.showError)(`找不到插件: ${cleanName}`);
    }
}
exports.deleteExtension = deleteExtension;
function enableExtension(assetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        Editor.Package.enable(extensionPath);
        changeDummyEnableState(assetInfo, true);
        (0, Utils_1.showLog)(`✅ 插件 [${cleanName}] 已啟用`);
    }
    else {
        (0, Utils_1.showError)(`找不到插件: ${cleanName}`);
    }
}
exports.enableExtension = enableExtension;
function disableExtension(assetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        Editor.Package.disable(extensionPath);
        changeDummyEnableState(assetInfo, false);
        (0, Utils_1.showLog)(`✅ 插件 [${cleanName}] 已禁用`);
    }
    else {
        (0, Utils_1.showError)(`找不到插件: ${cleanName}`);
    }
}
exports.disableExtension = disableExtension;
function getExtensionPath(assetInfo) {
    var _a;
    // Remove status suffix if present
    const cleanName = getDummyCleanName(assetInfo);
    const extensionPath = (_a = Editor.Package.getPackages().find((pkg) => pkg.name === cleanName)) === null || _a === void 0 ? void 0 : _a.path;
    return extensionPath;
}
function getDummyCleanName(assetInfo) {
    const cleanName = assetInfo.name.replace(/\((啟用|禁用)\)/g, '').trim();
    return cleanName;
}
exports.getDummyCleanName = getDummyCleanName;
function addPrefixToDummyFileName(extensionName, isEnable) {
    return `${extensionName}${isEnable ? ' (啟用)' : ' (禁用)'}`;
}
async function changeDummyEnableState(assetInfo, toEnable) {
    const cleanName = getDummyCleanName(assetInfo);
    const currentDummyFileName = addPrefixToDummyFileName(cleanName, !toEnable);
    const newDummyFileName = addPrefixToDummyFileName(cleanName, toEnable);
    const dummyFile = (0, path_1.join)(QUICK_PLUGIN_DIR, newDummyFileName);
    (0, fs_1.renameSync)((0, path_1.join)(QUICK_PLUGIN_DIR, currentDummyFileName), dummyFile);
    await Editor.Message.request('asset-db', 'reimport-asset', dummyFile);
    Editor.Message.send('asset-db', 'refresh-asset', dummyFile);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29yZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvQ29yZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQTRCO0FBQzVCLDJCQUF5RztBQUN6RyxtRUFBMEM7QUFDMUMsaURBQXlDO0FBRXpDLG1DQUF3RDtBQUN4RCxtQ0FBaUU7QUFFakUsTUFBTSxVQUFVLEdBQUcsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdkQsTUFBTSxhQUFhLEdBQUcsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDOUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLFdBQUksRUFBQyxVQUFVLEVBQUUsc0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUU1RDs7R0FFRztBQUNILFNBQWdCLFdBQVc7SUFDdkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxzQkFBVyxDQUFDLElBQUksNENBQTRDLEVBQUU7UUFDaEYsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztRQUNyQixLQUFLLEVBQUUsU0FBUztLQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ2IsSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMvQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBVEQsa0NBU0M7QUFFRDs7R0FFRztBQUNILFNBQWdCLGdDQUFnQztJQUM1QyxJQUFJLG9CQUFvQixFQUFFLEVBQUUsQ0FBQztRQUN6QixNQUFNLFVBQVUsR0FBRyw4QkFBOEIsRUFBRSxDQUFDO1FBQ3BELEtB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Q0FBQyxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCB3cml0ZUZpbGVTeW5jLCBleGlzdHNTeW5jLCBta2RpclN5bmMsIHJlbmFtZVN5bmMsIHJtU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xyXG5pbXBvcnQgcGFja2FnZUpTT04gZnJvbSAnLi4vcGFja2FnZS5qc29uJztcclxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xyXG5pbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcclxuaW1wb3J0IHsgQkxBTktfVEVNUExBVEUsIEhUTUxfVEVNUExBVEUgfSBmcm9tIFwiLi9Db25zdFwiO1xyXG5pbXBvcnQgeyBzaG93TG9nLCBzaG93V2Fybiwgc2hvd0Vycm9yLCB3YWl0VGltZSB9IGZyb20gJy4vVXRpbHMnO1xyXG5cclxuY29uc3QgUExVR0lOX0RJUiA9IGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3BsdWdpbicpO1xyXG5jb25zdCBFWFRFTlNJT05fRElSID0gam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnZXh0ZW5zaW9ucycpO1xyXG5jb25zdCBRVUlDS19QTFVHSU5fRElSID0gam9pbihQTFVHSU5fRElSLCBwYWNrYWdlSlNPTi5uYW1lKTtcclxuXHJcbi8qKlxyXG4gKiDpgI/pgY7nrqHnkIbmj5Lku7bph43mlrDovInlhaXmqKHntYTlvoznmoTkuovku7ZcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZnRlclJlbG9hZCgpIHtcclxuICAgIEVkaXRvci5EaWFsb2cuaW5mbyhgJHtwYWNrYWdlSlNPTi5uYW1lfSDmj5Lku7bph43mlrDovInlhaXlrozmiJBcXG7oqbLmj5Lku7bpnIDopoHph43mlrDllZ/li5Xnt6jovK/lmajlvozmiY3og73poa/npLrlnKjos4fmupDnrqHnkIblmajvvIzopoHnq4vliLvph43llZ/ll44/YCwge1xyXG4gICAgICAgIGJ1dHRvbnM6IFsn56K65a6aJywgJ+WPlua2iCddLFxyXG4gICAgICAgIHRpdGxlOiAn6YeN5paw5ZWf5YuV57eo6Lyv5ZmoJyxcclxuICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOWuieijneaJgOacieaPkuS7tueahCBucG0g5L6d6LO0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbEFsbEV4dGVuc2lvbnNEZXBlbmRlbmNpZXMoKSB7XHJcbiAgICBpZiAoY2hlY2tOb2RlRW52aXJvbm1lbnQoKSkge1xyXG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbnMgPSBnZXRBbGxEb3dubG9hZGVkRXh0ZW5zaW9uc0luZm8oKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGV4dGVuc2lvbiBvZiBleHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgIHNob3dMb2coYOato+WcqOWuieijneaPkuS7tiBbJHtleHRlbnNpb24ubmFtZX1dIOeahOS+neiztOWll+S7tmApO1xyXG4gICAgICAgICAgICBleGVjU3luYygnbnBtIGluc3RhbGwnLCB7IGN3ZDogZXh0ZW5zaW9uLnBhdGgsIHN0ZGlvOiAnaW5oZXJpdCcgfSk7XHJcbiAgICAgICAgICAgIHNob3dMb2coYOaPkuS7tiBbJHtleHRlbnNpb24ubmFtZX1dIOeahOS+neiztOWll+S7tuWuieijneWujOaIkGApO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvd1dhcm4oYOacquaqoua4rOWIsCBOb2RlLmpzIOeSsOWig++8jOiri+WuieijnSBOb2RlLmpzIOW+jOWGjeWYl+ippuOAgmApO1xyXG4gICAgfVxyXG4gICAgc2hvd0xvZyhg4pyFIOaJgOacieaPkuS7tueahOS+neiztOWll+S7tuWuieijneWujOaIkGApO1xyXG59XHJcblxyXG4vKipcclxuICog5Yi35paw5bey6Ki75YaK55qE5o+S5Lu25pig5bCE5qqU5qGIXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEV4dGVuc2lvbnNEdW1teSgpIHtcclxuICAgIGlmICghZXhpc3RzU3luYyhQTFVHSU5fRElSKSkge1xyXG4gICAgICAgIG1rZGlyU3luYyhQTFVHSU5fRElSKTtcclxuICAgIH1cclxuICAgIGNsZWFyRXh0ZW5zaW9uRHVtbXkoKTtcclxuICAgIGlmICghZXhpc3RzU3luYyhRVUlDS19QTFVHSU5fRElSKSkge1xyXG4gICAgICAgIG1rZGlyU3luYyhRVUlDS19QTFVHSU5fRElSKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzU3luYyhFWFRFTlNJT05fRElSKSkge1xyXG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbnMgPSBnZXRBbGxEb3dubG9hZGVkRXh0ZW5zaW9uc0luZm8oKS5maWx0ZXIoZXh0ID0+IGV4dC5uYW1lICE9PSBwYWNrYWdlSlNPTi5uYW1lKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGV4dGVuc2lvbiBvZiBleHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZUV4dGVuc2lvbkR1bW15KGV4dGVuc2lvbi5uYW1lLCBleHRlbnNpb24uZW5hYmxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzaG93TG9nKGDinIUg5omA5pyJ5o+S5Lu255qE5pig5bCE5qqU5qGI5Yi35paw5a6M5oiQYCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDmuIXpmaTmiYDmnInmj5Lku7bmmKDlsITmqpTmoYhcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckV4dGVuc2lvbkR1bW15KCkge1xyXG4gICAgaWYgKGV4aXN0c1N5bmMoUVVJQ0tfUExVR0lOX0RJUikpIHtcclxuICAgICAgICBjb25zdCBmaWxlcyA9IHJlYWRkaXJTeW5jKFFVSUNLX1BMVUdJTl9ESVIpO1xyXG4gICAgICAgIGZpbGVzLmZvckVhY2goZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChmaWxlICE9PSAnLmdpdGtlZXAnKSB7IC8vIFByZXNlcnZlIC5naXRrZWVwIGlmIGl0IGV4aXN0c1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBqb2luKFFVSUNLX1BMVUdJTl9ESVIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSBqb2luKFFVSUNLX1BMVUdJTl9ESVIsIGAke2ZpbGV9Lm1ldGFgKTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm1TeW5jKGZpbGVQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm1TeW5jKG1ldGFQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zaG93TG9nKGDliKrpmaTmj5Lku7bmmKDlsITmqpTmoYg6ICR7ZmlsZX1gKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvd0Vycm9yKGBGYWlsZWQgdG8gcmVtb3ZlOiAke2ZpbGV9YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDlj5blvpfmiYDmnInlnKggPOWwiOahiOagueebrumMhD4vZXh0ZW5zaW9ucyDlupXkuIvnmoTmj5Lku7bos4foqIpcclxuICovXHJcbmZ1bmN0aW9uIGdldEFsbERvd25sb2FkZWRFeHRlbnNpb25zSW5mbygpOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvW10ge1xyXG4gICAgY29uc3QgYWxsUGFja2FnZXMgPSBFZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcygpO1xyXG4gICAgY29uc3QgZXh0ZW5zaW9ucyA9IGFsbFBhY2thZ2VzLmZpbHRlcihwa2cgPT4gcGtnLnBhdGguc3RhcnRzV2l0aChFWFRFTlNJT05fRElSKSk7XHJcbiAgICByZXR1cm4gZXh0ZW5zaW9ucztcclxufVxyXG5cclxuLyoqXHJcbiAqIOWJteW7uuS4gOWAi+aPkuS7tuaYoOWwhOaqlOahiFxyXG4gKiBAcGFyYW0gZXh0ZW5zaW9uTmFtZSDmj5Lku7blkI3nqLEgXHJcbiAqIEBwYXJhbSBlbmFibGUg5o+S5Lu25piv5ZCm5ZWf55SoXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVFeHRlbnNpb25EdW1teShleHRlbnNpb25OYW1lOiBzdHJpbmcsIGVuYWJsZTogYm9vbGVhbiA9IHRydWUpIHtcclxuICAgIGNvbnN0IGR1bW15RmlsZU5hbWUgPSBhZGRQcmVmaXhUb0R1bW15RmlsZU5hbWUoZXh0ZW5zaW9uTmFtZSwgZW5hYmxlKTtcclxuICAgIGNvbnN0IGR1bW15RmlsZSA9IGpvaW4oUVVJQ0tfUExVR0lOX0RJUiwgZHVtbXlGaWxlTmFtZSk7XHJcbiAgICBjb25zdCBkdW1teVBhdGggPSBgZGI6Ly8ke3BhY2thZ2VKU09OLm5hbWV9LyR7cGFja2FnZUpTT04ubmFtZX0vJHtkdW1teUZpbGVOYW1lfWA7XHJcbiAgICB3cml0ZUZpbGVTeW5jKGR1bW15RmlsZSwgJycpO1xyXG4gICAgLy9zaG93TG9nKGDlibXlu7rmj5Lku7bmmKDlsITmqpTmoYg6ICR7ZHVtbXlGaWxlfWApO1xyXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVpbXBvcnQtYXNzZXQnLCBkdW1teVBhdGgpO1xyXG4gICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIGR1bW15UGF0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUZW1wbGF0ZUhpbnQodGVtcGxhdGVOYW1lOiBzdHJpbmcpIHtcclxuICAgIHN3aXRjaCAodGVtcGxhdGVOYW1lKSB7XHJcbiAgICAgICAgY2FzZSBCTEFOS19URU1QTEFURTpcclxuICAgICAgICAgICAgcmV0dXJuICfoqbLmqKHmnb/mj5DkvpvkuIDlgIvnsKHllq7nmoTlj7PpjbXoj5zllq7npLrnr4RcXG7libXlu7roqbLmqKHmnb/lvozvvIzlsI0gYXNzZXRzIOW6leS4i+eahCBHYW1lIOizh+aWmeWkvuWFp+S7u+S4gOizh+a6kOm7nuaTiuWPs+mNte+8jOWPr+eci+WIsFwi6YGK5oiy6LOH5rqQ5Y+z6Y216I+c5Zau6YG46aCFXCInO1xyXG4gICAgICAgIGNhc2UgSFRNTF9URU1QTEFURTpcclxuICAgICAgICAgICAgcmV0dXJuICfoqbLmqKHmnb/mj5DkvpvnsKHmmJPnmoQgSFRNTCDpnaLmnb/npLrnr4RcXG7libXlu7roqbLmqKHmnb/lvozvvIzlj6/lnKjkuIrmlrnlt6XlhbfliJfkuK3nnIvliLAgPOS9oOWPlueahOaPkuS7tuWQjeeosT4g6YG46aCF77yM6bue5pOK6KOh6Z2i55qEIFwi6buY6KqN6Z2i5p2/XCIg5Y2z5Y+v6ZaL5ZWf6Z2i5p2/JztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja0lucHV0TmFtZShuYW1lOiBzdHJpbmcpIHtcclxuICAgIGxldCBlcnJvclJlc3VsdCA9ICcnO1xyXG4gICAgY29uc3QgdGVtcGxhdGVOYW1lTGlzdCA9IFtCTEFOS19URU1QTEFURSwgSFRNTF9URU1QTEFURV07XHJcbiAgICBpZiAobmFtZSA9PT0gJycpIHtcclxuICAgICAgICBlcnJvclJlc3VsdCA9ICfmj5Lku7blkI3nqLHkuI3og73ngrrnqbonO1xyXG4gICAgfSBlbHNlIGlmIChuYW1lLnN0YXJ0c1dpdGgoJ18nKSkge1xyXG4gICAgICAgIGVycm9yUmVzdWx0ID0gJ+aPkuS7tuWQjeeoseS4jeiDveS7pSBfIOmWi+mgrSc7XHJcbiAgICB9IGVsc2UgaWYgKCEvXlthLXowLTlfLV0rJC8udGVzdChuYW1lKSkge1xyXG4gICAgICAgIGVycm9yUmVzdWx0ID0gJ+aPkuS7tuWQjeeoseWPquiDveWMheWQq+Wwj+Wvq+iLseaWh+Wtl+avjeOAgeaVuOWtl+OAgVwiX1wi6Jmf5ZKMXCItXCLomZ8nO1xyXG4gICAgfSBlbHNlIGlmIChleGlzdHNTeW5jKGpvaW4oRVhURU5TSU9OX0RJUiwgbmFtZSkpKSB7XHJcbiAgICAgICAgZXJyb3JSZXN1bHQgPSAn5a2Y5Zyo5ZCM5ZCN5o+S5Lu26LOH5paZ5aS+JztcclxuICAgIH0gZWxzZSBpZiAodGVtcGxhdGVOYW1lTGlzdC5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIGVycm9yUmVzdWx0ID0gJ+aPkuS7tuWQjeeoseS4jeiDveiIh+aooeadv+WQjeeoseebuOWQjCc7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVycm9yUmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICog5Ym15bu65LiA5YCL5o+S5Lu2XHJcbiAqIEBwYXJhbSB0ZW1wbGF0ZSDmj5Lku7bmqKHmnb/lkI3nqLFcclxuICogQHBhcmFtIG5hbWUg5o+S5Lu25ZCN56ixXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlRXh0ZW5zaW9uKHRlbXBsYXRlOiBzdHJpbmcsIG5hbWU6IHN0cmluZykge1xyXG4gICAgY29uc3QgemlwRmlsZVBhdGggPSBqb2luKEVYVEVOU0lPTl9ESVIsIHBhY2thZ2VKU09OLm5hbWUsIGBzdGF0aWMvZXh0ZW5zaW9uLXRlbXBsYXRlLyR7dGVtcGxhdGV9LnppcGApO1xyXG4gICAgY29uc3QgdGVtcGxhdGVQYXRoID0gam9pbihFWFRFTlNJT05fRElSLCB0ZW1wbGF0ZSk7XHJcbiAgICBjb25zdCBleHRlbnNpb25QYXRoID0gam9pbihFWFRFTlNJT05fRElSLCBuYW1lKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIOaKiuaooeadv+ino+Wjk+WIsCBleHRlbnNpb25zIOebrumMhOS4i1xyXG4gICAgICAgIC8vIHNob3dMb2coYOino+Wjk+aPkuS7tuaooeadvyAke3RlbXBsYXRlfWApO1xyXG4gICAgICAgIGF3YWl0IEVkaXRvci5VdGlscy5GaWxlLnVuemlwKHppcEZpbGVQYXRoLCBFWFRFTlNJT05fRElSKTtcclxuICAgICAgICAvL3Nob3dMb2coYOino+Wjk+aPkuS7tuaooeadvyAke3RlbXBsYXRlfSDlrozmiJBgKTtcclxuXHJcbiAgICAgICAgLy8g6YeN5paw5ZG95ZCN6Kej5aOT5b6M55qE5qih5p2/6LOH5paZ5aS+XHJcbiAgICAgICAgLy8gc2hvd0xvZyhg6YeN5paw5ZG95ZCN6Kej5aOT5b6M55qE5qih5p2/6LOH5paZ5aS+ICR7dGVtcGxhdGV9IC0+ICR7bmFtZX1gKTtcclxuICAgICAgICByZW5hbWVTeW5jKHRlbXBsYXRlUGF0aCwgZXh0ZW5zaW9uUGF0aCk7XHJcbiAgICAgICAgLy9zaG93TG9nKGDph43mlrDlkb3lkI3op6Plo5PlvoznmoTmqKHmnb/os4fmlpnlpL7lrozmiJBgKTtcclxuXHJcbiAgICAgICAgLy8g5L+u5pS55paw5bu65o+S5Lu255qEIHBhY2thZ2UuanNvbiDlj4ogcGFja2FnZS1sb2NrLmpzb25cclxuICAgICAgICAvL3Nob3dMb2coYOS/ruaUueaWsOW7uuaPkuS7tueahCBwYWNrYWdlLmpzb24g5Y+KIHBhY2thZ2UtbG9jay5qc29uYCk7XHJcbiAgICAgICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gam9pbihleHRlbnNpb25QYXRoLCAncGFja2FnZS5qc29uJyk7XHJcbiAgICAgICAgY29uc3QgcGFja2FnZUxvY2tKc29uUGF0aCA9IGpvaW4oZXh0ZW5zaW9uUGF0aCwgJ3BhY2thZ2UtbG9jay5qc29uJyk7XHJcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocGFja2FnZUpzb25QYXRoKSkge1xyXG4gICAgICAgICAgICBsZXQgcGFja2FnZUpzb25Db250ZW50ID0gcmVhZEZpbGVTeW5jKHBhY2thZ2VKc29uUGF0aCwgJ3V0ZjgnKTtcclxuICAgICAgICAgICAgcGFja2FnZUpzb25Db250ZW50ID0gcGFja2FnZUpzb25Db250ZW50LnJlcGxhY2UobmV3IFJlZ0V4cCh0ZW1wbGF0ZSwgJ2cnKSwgbmFtZSk7XHJcbiAgICAgICAgICAgIHdyaXRlRmlsZVN5bmMocGFja2FnZUpzb25QYXRoLCBwYWNrYWdlSnNvbkNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzU3luYyhwYWNrYWdlTG9ja0pzb25QYXRoKSkge1xyXG4gICAgICAgICAgICBsZXQgcGFja2FnZUxvY2tKc29uQ29udGVudCA9IHJlYWRGaWxlU3luYyhwYWNrYWdlTG9ja0pzb25QYXRoLCAndXRmOCcpO1xyXG4gICAgICAgICAgICBwYWNrYWdlTG9ja0pzb25Db250ZW50ID0gcGFja2FnZUxvY2tKc29uQ29udGVudC5yZXBsYWNlKG5ldyBSZWdFeHAodGVtcGxhdGUsICdnJyksIG5hbWUpO1xyXG4gICAgICAgICAgICB3cml0ZUZpbGVTeW5jKHBhY2thZ2VMb2NrSnNvblBhdGgsIHBhY2thZ2VMb2NrSnNvbkNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3Nob3dMb2coYOS/ruaUueaWsOW7uuaPkuS7tueahCBwYWNrYWdlLmpzb24g5Y+KIHBhY2thZ2UtbG9jay5qc29uIOWujOaIkGApO1xyXG5cclxuICAgICAgICAvLyDlibXlu7rmj5Lku7bmmKDlsITmqpTmoYhcclxuICAgICAgICAvL3Nob3dMb2coYOWJteW7uuaPkuS7tuaYoOWwhOaqlOahiGApO1xyXG4gICAgICAgIGF3YWl0IGNyZWF0ZUV4dGVuc2lvbkR1bW15KG5hbWUpO1xyXG4gICAgICAgIC8vc2hvd0xvZyhg5Ym15bu65o+S5Lu25pig5bCE5qqU5qGI5a6M5oiQYCk7XHJcblxyXG4gICAgICAgIGlmIChjaGVja05vZGVFbnZpcm9ubWVudCgpKSB7XHJcbiAgICAgICAgICAgIC8vIOWcqOaPkuS7tuagueebrumMhOWft+ihjCBucG0gaW5zdGFsbFxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgc2hvd0xvZyhg5o+S5Lu2WyR7bmFtZX1dIOWft+ihjCBucG0gaW5zdGFsbGApO1xyXG4gICAgICAgICAgICAgICAgZXhlY1N5bmMoJ25wbSBpbnN0YWxsJywgeyBjd2Q6IGV4dGVuc2lvblBhdGgsIHN0ZGlvOiAnaW5oZXJpdCcgfSk7XHJcbiAgICAgICAgICAgICAgICBzaG93TG9nKGDmj5Lku7ZbJHtuYW1lfV0gbnBtIGluc3RhbGwg5a6M5oiQYCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93V2Fybihg5o+S5Lu2WyR7bmFtZX1dIG5wbSBpbnN0YWxsIOWkseaVl2ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2hvd1dhcm4oYOacquaqoua4rOWIsCBOb2RlLmpzIOeSsOWig++8jOi3s+mBjiBucG0gaW5zdGFsbOOAguiri+WuieijnSBOb2RlLmpzIOW+jOWGjeWYl+ippuOAgmApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g6Ki75YaK5o+S5Lu2XHJcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoZXh0ZW5zaW9uUGF0aCk7XHJcbiAgICAgICAgLy8g5ZWf55So5o+S5Lu2XHJcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKGV4dGVuc2lvblBhdGgpO1xyXG4gICAgICAgIHNob3dMb2coYOKchSDmj5Lku7YgWyR7bmFtZX1dIOW7uueri+WujOaIkGApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBzaG93RXJyb3IoYOaPkuS7tiBbJHtuYW1lfV0g5bu656uL5aSx5pWXOmAsIGVycm9yKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIOaqoua4rOaYr+WQpuaciSBOb2RlLmpzIOeSsOWig1xyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tOb2RlRW52aXJvbm1lbnQoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGV4ZWNTeW5jKCdub2RlIC0tdmVyc2lvbicpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvcGVuRXh0ZW5zaW9uSW5Wc2NvZGUoYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcclxuICAgIGNvbnN0IGV4dGVuc2lvblBhdGggPSBnZXRFeHRlbnNpb25QYXRoKGFzc2V0SW5mbyk7XHJcbiAgICBpZiAoZXh0ZW5zaW9uUGF0aCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGV4ZWNTeW5jKGBjb2RlICR7ZXh0ZW5zaW9uUGF0aH0gJHtleHRlbnNpb25QYXRofS9zb3VyY2UvbWFpbi50c2ApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHNob3dXYXJuKCfku6UgdnNjb2RlIOmWi+WVn+aPkuS7tuizh+aWmeWkvuWkseaVl++8jOiri+eiuuiqjeaYr+WQpuacieWuieijnSB2c2NvZGXvvIzkuKbnorroqo0gY29kZSDmjIfku6TmnInmlYgnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDph43mlrDovInlhaXmj5Lku7ZcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZWxvYWRFeHRlbnNpb24oYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcclxuICAgIGNvbnN0IGV4dGVuc2lvblBhdGggPSBnZXRFeHRlbnNpb25QYXRoKGFzc2V0SW5mbyk7XHJcbiAgICBjb25zdCBjbGVhbk5hbWUgPSBnZXREdW1teUNsZWFuTmFtZShhc3NldEluZm8pO1xyXG4gICAgaWYgKGV4dGVuc2lvblBhdGgpIHtcclxuICAgICAgICBzaG93TG9nKGDmj5Lku7YgWyR7Y2xlYW5OYW1lfV0g5q2j5Zyo6YeN5paw6LyJ5YWlYCk7XHJcbiAgICAgICAgLy8g5YGc55So5o+S5Lu2XHJcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuZGlzYWJsZShleHRlbnNpb25QYXRoKTtcclxuICAgICAgICAvLyDlnKjmj5Lku7bmoLnnm67pjITln7fooYwgbnBtIHJ1biBidWlsZFxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHNob3dMb2coYOaPkuS7tiBbJHtjbGVhbk5hbWV9XSDln7fooYwgbnBtIHJ1biBidWlsZGApO1xyXG4gICAgICAgICAgICBleGVjU3luYygnbnBtIHJ1biBidWlsZCcsIHsgY3dkOiBleHRlbnNpb25QYXRoLCBlbmNvZGluZzogJ3V0Zi04JyB9KTtcclxuICAgICAgICAgICAgc2hvd0xvZyhg5o+S5Lu2IFske2NsZWFuTmFtZX1dIG5wbSBydW4gYnVpbGQg5oiQ5YqfYCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgc2hvd0Vycm9yKGDmj5Lku7YgWyR7Y2xlYW5OYW1lfV0gbnBtIHJ1biBidWlsZCDlpLHmlZc6YCwgKGVycm9yIGFzIGFueSkuc3Rkb3V0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdhaXRUaW1lKDApLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAvLyDllZ/nlKjmj5Lku7ZcclxuICAgICAgICAgICAgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKGV4dGVuc2lvblBhdGgpO1xyXG4gICAgICAgICAgICBzaG93TG9nKGDinIUg5o+S5Lu2IFske2NsZWFuTmFtZX1dIOW3sumHjeaWsOWVn+eUqGApO1xyXG4gICAgICAgICAgICByZXR1cm4gd2FpdFRpbWUoMCk7XHJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIOWCs+mAgSBhZnRlci1yZWxvYWQg5raI5oGv57Wm6YeN6LyJ5b6M55qE5o+S5Lu2XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoY2xlYW5OYW1lLCAnYWZ0ZXItcmVsb2FkJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzaG93RXJyb3IoYOaJvuS4jeWIsOaPkuS7tjogJHtjbGVhbk5hbWV9YCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDliKrpmaTmj5Lku7ZcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVFeHRlbnNpb24oYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcclxuICAgIGNvbnN0IGV4dGVuc2lvblBhdGggPSBnZXRFeHRlbnNpb25QYXRoKGFzc2V0SW5mbyk7XHJcbiAgICBjb25zdCBjbGVhbk5hbWUgPSBnZXREdW1teUNsZWFuTmFtZShhc3NldEluZm8pO1xyXG4gICAgaWYgKGV4dGVuc2lvblBhdGgpIHtcclxuICAgICAgICBFZGl0b3IuRGlhbG9nLmluZm8oYOeiuuWumuimgeWIqumZpOipsuaPkuS7tuWXjj9cXG7mj5Lku7blkI3nqLE6ICR7Y2xlYW5OYW1lfVxcbiDmj5Lku7bot6/lvpE6ICR7ZXh0ZW5zaW9uUGF0aH1gLCB7XHJcbiAgICAgICAgICAgIGJ1dHRvbnM6IFsn56K65a6aJywgJ+WPlua2iCddLFxyXG4gICAgICAgICAgICB0aXRsZTogJ+WIqumZpOaPkuS7ticsXHJcbiAgICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDlmJfoqabliKrpmaTlhannqK7lj6/og73nmoQgZHVtbXkgZmlsZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5hYmxlRHVtbXlOYW1lID0gYWRkUHJlZml4VG9EdW1teUZpbGVOYW1lKGNsZWFuTmFtZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNhYmxlRHVtbXlOYW1lID0gYWRkUHJlZml4VG9EdW1teUZpbGVOYW1lKGNsZWFuTmFtZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZHVtbXlQYXRoRW5hYmxlZCA9IGpvaW4oUVVJQ0tfUExVR0lOX0RJUiwgZW5hYmxlRHVtbXlOYW1lKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGR1bW15UGF0aERpc2FibGVkID0gam9pbihRVUlDS19QTFVHSU5fRElSLCBkaXNhYmxlRHVtbXlOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJtU3luYyhleHRlbnNpb25QYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZXh0ZW5zaW9uUGF0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkdW1teVBhdGhFbmFibGVkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBybVN5bmMoZHVtbXlQYXRoRW5hYmxlZCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkdW1teVBhdGhEaXNhYmxlZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm1TeW5jKGR1bW15UGF0aERpc2FibGVkLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFja2FnZS51bnJlZ2lzdGVyKGV4dGVuc2lvblBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3dMb2coYOKchSDmj5Lku7YgWyR7Y2xlYW5OYW1lfV0g5bey5Yiq6ZmkYCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3dFcnJvcihg5Yiq6Zmk5o+S5Lu25aSx5pWX77yM5qqU5qGI5oiW6LOH5paZ5aS+5Y+v6IO95Zyo5L2/55So54uA5oWLYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvd0Vycm9yKGDmib7kuI3liLDmj5Lku7Y6ICR7Y2xlYW5OYW1lfWApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlRXh0ZW5zaW9uKGFzc2V0SW5mbzogQXNzZXRJbmZvKSB7XHJcbiAgICBjb25zdCBleHRlbnNpb25QYXRoID0gZ2V0RXh0ZW5zaW9uUGF0aChhc3NldEluZm8pO1xyXG4gICAgY29uc3QgY2xlYW5OYW1lID0gZ2V0RHVtbXlDbGVhbk5hbWUoYXNzZXRJbmZvKTtcclxuICAgIGlmIChleHRlbnNpb25QYXRoKSB7XHJcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKGV4dGVuc2lvblBhdGgpO1xyXG4gICAgICAgIGNoYW5nZUR1bW15RW5hYmxlU3RhdGUoYXNzZXRJbmZvLCB0cnVlKTtcclxuICAgICAgICBzaG93TG9nKGDinIUg5o+S5Lu2IFske2NsZWFuTmFtZX1dIOW3suWVn+eUqGApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgc2hvd0Vycm9yKGDmib7kuI3liLDmj5Lku7Y6ICR7Y2xlYW5OYW1lfWApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUV4dGVuc2lvbihhc3NldEluZm86IEFzc2V0SW5mbykge1xyXG4gICAgY29uc3QgZXh0ZW5zaW9uUGF0aCA9IGdldEV4dGVuc2lvblBhdGgoYXNzZXRJbmZvKTtcclxuICAgIGNvbnN0IGNsZWFuTmFtZSA9IGdldER1bW15Q2xlYW5OYW1lKGFzc2V0SW5mbyk7XHJcbiAgICBpZiAoZXh0ZW5zaW9uUGF0aCkge1xyXG4gICAgICAgIEVkaXRvci5QYWNrYWdlLmRpc2FibGUoZXh0ZW5zaW9uUGF0aCk7XHJcbiAgICAgICAgY2hhbmdlRHVtbXlFbmFibGVTdGF0ZShhc3NldEluZm8sIGZhbHNlKTtcclxuICAgICAgICBzaG93TG9nKGDinIUg5o+S5Lu2IFske2NsZWFuTmFtZX1dIOW3suemgeeUqGApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgc2hvd0Vycm9yKGDmib7kuI3liLDmj5Lku7Y6ICR7Y2xlYW5OYW1lfWApO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25QYXRoKGFzc2V0SW5mbzogQXNzZXRJbmZvKSB7XHJcbiAgICAvLyBSZW1vdmUgc3RhdHVzIHN1ZmZpeCBpZiBwcmVzZW50XHJcbiAgICBjb25zdCBjbGVhbk5hbWUgPSBnZXREdW1teUNsZWFuTmFtZShhc3NldEluZm8pO1xyXG4gICAgY29uc3QgZXh0ZW5zaW9uUGF0aCA9IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCkuZmluZCgocGtnKSA9PiBwa2cubmFtZSA9PT0gY2xlYW5OYW1lKT8ucGF0aDtcclxuICAgIHJldHVybiBleHRlbnNpb25QYXRoO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlDbGVhbk5hbWUoYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcclxuICAgIGNvbnN0IGNsZWFuTmFtZSA9IGFzc2V0SW5mby5uYW1lLnJlcGxhY2UoL1xcKCjllZ/nlKh856aB55SoKVxcKS9nLCAnJykudHJpbSgpO1xyXG4gICAgcmV0dXJuIGNsZWFuTmFtZTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWRkUHJlZml4VG9EdW1teUZpbGVOYW1lKGV4dGVuc2lvbk5hbWU6IHN0cmluZywgaXNFbmFibGU6IGJvb2xlYW4pIHtcclxuICAgIHJldHVybiBgJHtleHRlbnNpb25OYW1lfSR7aXNFbmFibGUgPyAnICjllZ/nlKgpJyA6ICcgKOemgeeUqCknfWA7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNoYW5nZUR1bW15RW5hYmxlU3RhdGUoYXNzZXRJbmZvOiBBc3NldEluZm8sIHRvRW5hYmxlOiBib29sZWFuKSB7XHJcbiAgICBjb25zdCBjbGVhbk5hbWUgPSBnZXREdW1teUNsZWFuTmFtZShhc3NldEluZm8pO1xyXG4gICAgY29uc3QgY3VycmVudER1bW15RmlsZU5hbWUgPSBhZGRQcmVmaXhUb0R1bW15RmlsZU5hbWUoY2xlYW5OYW1lLCAhdG9FbmFibGUpO1xyXG4gICAgY29uc3QgbmV3RHVtbXlGaWxlTmFtZSA9IGFkZFByZWZpeFRvRHVtbXlGaWxlTmFtZShjbGVhbk5hbWUsIHRvRW5hYmxlKTtcclxuICAgIGNvbnN0IGR1bW15RmlsZSA9IGpvaW4oUVVJQ0tfUExVR0lOX0RJUiwgbmV3RHVtbXlGaWxlTmFtZSk7XHJcbiAgICByZW5hbWVTeW5jKGpvaW4oUVVJQ0tfUExVR0lOX0RJUiwgY3VycmVudER1bW15RmlsZU5hbWUpLCBkdW1teUZpbGUpO1xyXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVpbXBvcnQtYXNzZXQnLCBkdW1teUZpbGUpO1xyXG4gICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIGR1bW15RmlsZSk7XHJcbn0iXX0=