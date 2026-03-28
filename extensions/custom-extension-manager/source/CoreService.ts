import { join } from "path";
import { readdirSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync, readFileSync } from 'fs';
import packageJSON from '../package.json';
import { execSync } from "child_process";
import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";
import { BLANK_TEMPLATE, HTML_TEMPLATE } from "./Const";
import { showLog, showWarn, showError, waitTime } from './Utils';

const PLUGIN_DIR = join(Editor.Project.path, 'plugin');
const EXTENSION_DIR = join(Editor.Project.path, 'extensions');
const QUICK_PLUGIN_DIR = join(PLUGIN_DIR, packageJSON.name);

/**
 * 透過管理插件重新載入模組後的事件
 */
export function afterReload() {
    Editor.Dialog.info(`${packageJSON.name} 插件重新載入完成\n該插件需要重新啟動編輯器後才能顯示在資源管理器，要立刻重啟嗎?`, {
        buttons: ['確定', '取消'],
        title: '重新啟動編輯器',
    }).then(result => {
        if (result.response === 0) {
            Editor.Message.send('asset-db', 'refresh');
        }
    });
}

/**
 * 安裝所有插件的 npm 依賴
 */
export function installAllExtensionsDependencies() {
    if (checkNodeEnvironment()) {
        const extensions = getAllDownloadedExtensionsInfo();
        for (const extension of extensions) {
            showLog(`正在安裝插件 [${extension.name}] 的依賴套件`);
            execSync('npm install', { cwd: extension.path, stdio: 'inherit' });
            showLog(`插件 [${extension.name}] 的依賴套件安裝完成`);
        }
    } else {
        showWarn(`未檢測到 Node.js 環境，請安裝 Node.js 後再嘗試。`);
    }
    showLog(`✅ 所有插件的依賴套件安裝完成`);
}

/**
 * 刷新已註冊的插件映射檔案
 */
export function refreshExtensionsDummy() {
    if (!existsSync(PLUGIN_DIR)) {
        mkdirSync(PLUGIN_DIR);
    }
    clearExtensionDummy();
    if (!existsSync(QUICK_PLUGIN_DIR)) {
        mkdirSync(QUICK_PLUGIN_DIR);
    }

    if (existsSync(EXTENSION_DIR)) {
        const extensions = getAllDownloadedExtensionsInfo().filter(ext => ext.name !== packageJSON.name);
        for (const extension of extensions) {
            createExtensionDummy(extension.name, extension.enable);
        }
    }
    showLog(`✅ 所有插件的映射檔案刷新完成`);
}

/**
 * 清除所有插件映射檔案
 */
export function clearExtensionDummy() {
    if (existsSync(QUICK_PLUGIN_DIR)) {
        const files = readdirSync(QUICK_PLUGIN_DIR);
        files.forEach(file => {
            if (file !== '.gitkeep') { // Preserve .gitkeep if it exists
                const filePath = join(QUICK_PLUGIN_DIR, file);
                const metaPath = join(QUICK_PLUGIN_DIR, `${file}.meta`);
                try {
                    rmSync(filePath, { recursive: true, force: true });
                    rmSync(metaPath, { recursive: true, force: true });
                    //showLog(`刪除插件映射檔案: ${file}`);
                } catch (error) {
                    showError(`Failed to remove: ${file}`, error);
                }
            }
        });
    }
}

/**
 * 取得所有在 <專案根目錄>/extensions 底下的插件資訊
 */
function getAllDownloadedExtensionsInfo(): Editor.Interface.PackageInfo[] {
    const allPackages = Editor.Package.getPackages();
    const extensions = allPackages.filter(pkg => pkg.path.startsWith(EXTENSION_DIR));
    return extensions;
}

/**
 * 創建一個插件映射檔案
 * @param extensionName 插件名稱 
 * @param enable 插件是否啟用
 */
async function createExtensionDummy(extensionName: string, enable: boolean = true) {
    const dummyFileName = addPrefixToDummyFileName(extensionName, enable);
    const dummyFile = join(QUICK_PLUGIN_DIR, dummyFileName);
    const dummyPath = `db://${packageJSON.name}/${packageJSON.name}/${dummyFileName}`;
    writeFileSync(dummyFile, '');
    //showLog(`創建插件映射檔案: ${dummyFile}`);
    await Editor.Message.request('asset-db', 'reimport-asset', dummyPath);
    Editor.Message.send('asset-db', 'refresh-asset', dummyPath);
}

export function getTemplateHint(templateName: string) {
    switch (templateName) {
        case BLANK_TEMPLATE:
            return '該模板提供一個簡單的右鍵菜單示範\n創建該模板後，對 assets 底下的 Game 資料夾內任一資源點擊右鍵，可看到"遊戲資源右鍵菜單選項"';
        case HTML_TEMPLATE:
            return '該模板提供簡易的 HTML 面板示範\n創建該模板後，可在上方工具列中看到 <你取的插件名稱> 選項，點擊裡面的 "默認面板" 即可開啟面板';
        default:
            return '';
    }
}

export function checkInputName(name: string) {
    let errorResult = '';
    const templateNameList = [BLANK_TEMPLATE, HTML_TEMPLATE];
    if (name === '') {
        errorResult = '插件名稱不能為空';
    } else if (name.startsWith('_')) {
        errorResult = '插件名稱不能以 _ 開頭';
    } else if (!/^[a-z0-9_-]+$/.test(name)) {
        errorResult = '插件名稱只能包含小寫英文字母、數字、"_"號和"-"號';
    } else if (existsSync(join(EXTENSION_DIR, name))) {
        errorResult = '存在同名插件資料夾';
    } else if (templateNameList.includes(name)) {
        errorResult = '插件名稱不能與模板名稱相同';
    }

    return errorResult;
}

/**
 * 創建一個插件
 * @param template 插件模板名稱
 * @param name 插件名稱
 */
export async function createExtension(template: string, name: string) {
    const zipFilePath = join(EXTENSION_DIR, packageJSON.name, `static/extension-template/${template}.zip`);
    const templatePath = join(EXTENSION_DIR, template);
    const extensionPath = join(EXTENSION_DIR, name);

    try {
        // 把模板解壓到 extensions 目錄下
        // showLog(`解壓插件模板 ${template}`);
        await Editor.Utils.File.unzip(zipFilePath, EXTENSION_DIR);
        //showLog(`解壓插件模板 ${template} 完成`);

        // 重新命名解壓後的模板資料夾
        // showLog(`重新命名解壓後的模板資料夾 ${template} -> ${name}`);
        renameSync(templatePath, extensionPath);
        //showLog(`重新命名解壓後的模板資料夾完成`);

        // 修改新建插件的 package.json 及 package-lock.json
        //showLog(`修改新建插件的 package.json 及 package-lock.json`);
        const packageJsonPath = join(extensionPath, 'package.json');
        const packageLockJsonPath = join(extensionPath, 'package-lock.json');
        if (existsSync(packageJsonPath)) {
            let packageJsonContent = readFileSync(packageJsonPath, 'utf8');
            packageJsonContent = packageJsonContent.replace(new RegExp(template, 'g'), name);
            writeFileSync(packageJsonPath, packageJsonContent);
        }
        if (existsSync(packageLockJsonPath)) {
            let packageLockJsonContent = readFileSync(packageLockJsonPath, 'utf8');
            packageLockJsonContent = packageLockJsonContent.replace(new RegExp(template, 'g'), name);
            writeFileSync(packageLockJsonPath, packageLockJsonContent);
        }
        //showLog(`修改新建插件的 package.json 及 package-lock.json 完成`);

        // 創建插件映射檔案
        //showLog(`創建插件映射檔案`);
        await createExtensionDummy(name);
        //showLog(`創建插件映射檔案完成`);

        if (checkNodeEnvironment()) {
            // 在插件根目錄執行 npm install
            try {
                showLog(`插件[${name}] 執行 npm install`);
                execSync('npm install', { cwd: extensionPath, stdio: 'inherit' });
                showLog(`插件[${name}] npm install 完成`);
            } catch (error) {
                showWarn(`插件[${name}] npm install 失敗`);
            }
        } else {
            showWarn(`未檢測到 Node.js 環境，跳過 npm install。請安裝 Node.js 後再嘗試。`);
        }

        // 註冊插件
        Editor.Package.register(extensionPath);
        // 啟用插件
        Editor.Package.enable(extensionPath);
        showLog(`✅ 插件 [${name}] 建立完成`);
    } catch (error) {
        showError(`插件 [${name}] 建立失敗:`, error);
        throw error;
    }
}

/**
 * 檢測是否有 Node.js 環境
 */
function checkNodeEnvironment() {
    try {
        execSync('node --version');
        return true;
    } catch (error) {
        return false;
    }
}

export function openExtensionInVscode(assetInfo: AssetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    if (extensionPath) {
        try {
            execSync(`code ${extensionPath} ${extensionPath}/source/main.ts`);
        } catch (error) {
            showWarn('以 vscode 開啟插件資料夾失敗，請確認是否有安裝 vscode，並確認 code 指令有效');
        }
    }
}

/**
 * 重新載入插件
 */
export function reloadExtension(assetInfo: AssetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        showLog(`插件 [${cleanName}] 正在重新載入`);
        // 停用插件
        Editor.Package.disable(extensionPath);
        // 在插件根目錄執行 npm run build
        try {
            showLog(`插件 [${cleanName}] 執行 npm run build`);
            execSync('npm run build', { cwd: extensionPath, encoding: 'utf-8' });
            showLog(`插件 [${cleanName}] npm run build 成功`);
        } catch (error) {
            showError(`插件 [${cleanName}] npm run build 失敗:`, (error as any).stdout);
        }

        waitTime(0).then(() => {
            // 啟用插件
            Editor.Package.enable(extensionPath);
            showLog(`✅ 插件 [${cleanName}] 已重新啟用`);
            return waitTime(0);
        }).then(() => {
            // 傳送 after-reload 消息給重載後的插件
            Editor.Message.send(cleanName, 'after-reload');
        });

    } else {
        showError(`找不到插件: ${cleanName}`);
    }
}

/**
 * 刪除插件
 */
export function deleteExtension(assetInfo: AssetInfo) {
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
                const dummyPathEnabled = join(QUICK_PLUGIN_DIR, enableDummyName);
                const dummyPathDisabled = join(QUICK_PLUGIN_DIR, disableDummyName);

                try {
                    rmSync(extensionPath, { recursive: true, force: true });
                    if (existsSync(extensionPath)) {
                        throw new Error();
                    }

                    if (existsSync(dummyPathEnabled)) {
                        rmSync(dummyPathEnabled, { recursive: true, force: true });
                    }
                    if (existsSync(dummyPathDisabled)) {
                        rmSync(dummyPathDisabled, { recursive: true, force: true });
                    }

                    Editor.Package.unregister(extensionPath);
                    showLog(`✅ 插件 [${cleanName}] 已刪除`);
                } catch (error) {
                    showError(`刪除插件失敗，檔案或資料夾可能在使用狀態`);
                }
            }
        });
    } else {
        showError(`找不到插件: ${cleanName}`);
    }
}

export function enableExtension(assetInfo: AssetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        Editor.Package.enable(extensionPath);
        changeDummyEnableState(assetInfo, true);
        showLog(`✅ 插件 [${cleanName}] 已啟用`);
    }
    else {
        showError(`找不到插件: ${cleanName}`);
    }
}

export function disableExtension(assetInfo: AssetInfo) {
    const extensionPath = getExtensionPath(assetInfo);
    const cleanName = getDummyCleanName(assetInfo);
    if (extensionPath) {
        Editor.Package.disable(extensionPath);
        changeDummyEnableState(assetInfo, false);
        showLog(`✅ 插件 [${cleanName}] 已禁用`);
    }
    else {
        showError(`找不到插件: ${cleanName}`);
    }
}

function getExtensionPath(assetInfo: AssetInfo) {
    // Remove status suffix if present
    const cleanName = getDummyCleanName(assetInfo);
    const extensionPath = Editor.Package.getPackages().find((pkg) => pkg.name === cleanName)?.path;
    return extensionPath;
}

export function getDummyCleanName(assetInfo: AssetInfo) {
    const cleanName = assetInfo.name.replace(/\((啟用|禁用)\)/g, '').trim();
    return cleanName;
}

function addPrefixToDummyFileName(extensionName: string, isEnable: boolean) {
    return `${extensionName}${isEnable ? ' (啟用)' : ' (禁用)'}`;
}

async function changeDummyEnableState(assetInfo: AssetInfo, toEnable: boolean) {
    const cleanName = getDummyCleanName(assetInfo);
    const currentDummyFileName = addPrefixToDummyFileName(cleanName, !toEnable);
    const newDummyFileName = addPrefixToDummyFileName(cleanName, toEnable);
    const dummyFile = join(QUICK_PLUGIN_DIR, newDummyFileName);
    renameSync(join(QUICK_PLUGIN_DIR, currentDummyFileName), dummyFile);
    await Editor.Message.request('asset-db', 'reimport-asset', dummyFile);
    Editor.Message.send('asset-db', 'refresh-asset', dummyFile);
}