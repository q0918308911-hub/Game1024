
import { readFileSync, statSync, existsSync, readdirSync } from "fs";
import path from "path";
import { FileGroup, FileInfo } from "./FileGroup";
import { showLog, showWarn, showError, waitTime } from './Utils';

const PROJECT_ROOT_PATH = Editor.Project.path;
const BUILD_DIR = path.join(PROJECT_ROOT_PATH, 'build');


let mainConfigJson: any = null;
let resourcesConfigJson: any = null;

export function afterReload() {
    // 在這裡實作插件被重新載入後的邏輯
}

/**
 * 找到所有包體 (build 資料夾內所有子資料夾)
 */
export function getAllPackageSelection(): string[] {
    if (!existsSync(BUILD_DIR)) return [];

    return readdirSync(BUILD_DIR, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
}

/**
 * 讀取指定 build folder 下的 config.json（支援 md5 cache）
 * @param folder - build 資料夾路徑
 */
export function setConfigJson(folder: string) {
    mainConfigJson = null;
    resourcesConfigJson = null;

    // 讀取 assets/main/config*.json
    try {
        const mainFolder = path.join(BUILD_DIR, folder, 'assets', 'main');
        if (!existsSync(mainFolder)) throw new Error();

        const mainFiles = readdirSync(mainFolder)
            .filter(file => /^config(\.[a-zA-Z0-9]+)?\.json$/.test(file));

        if (mainFiles.length === 0) throw new Error();

        const mainFilePath = path.join(mainFolder, mainFiles[0]);
        const mainRaw = readFileSync(mainFilePath, 'utf8');
        mainConfigJson = JSON.parse(mainRaw);
    } catch (e) {
        const mainFolder = path.join(BUILD_DIR, folder, 'assets', 'main');
        showError(`路徑: ${mainFolder}\n嘗試讀取 config.json 失敗\n請確認檔案及資料夾是否存在、json 內容是否正確`);
    }

    // 讀取 assets/resources/config*.json
    try {
        const resourcesFolder = path.join(BUILD_DIR, folder, 'assets', 'resources');
        if (!existsSync(resourcesFolder)) throw new Error();

        const resourcesFiles = readdirSync(resourcesFolder)
            .filter(file => /^config(\.[a-zA-Z0-9]+)?\.json$/.test(file));

        if (resourcesFiles.length === 0) throw new Error();

        const resourcesFilePath = path.join(resourcesFolder, resourcesFiles[0]);
        const resourcesRaw = readFileSync(resourcesFilePath, 'utf8');
        resourcesConfigJson = JSON.parse(resourcesRaw);
    } catch (e) {
        const resourcesFolder = path.join(BUILD_DIR, folder, 'assets', 'resources');
        showError(`路徑: ${resourcesFolder}\n嘗試讀取 config.json 失敗\n請確認檔案及資料夾是否存在、json 內容是否正確`);
    }
}

/**
 * 從包體內取出所有檔案資訊
 * @param packageName 包體名稱
 * @returns {Map<string, FileGroup>}
 */
export function getAllFileInPackage(packageName: string) {
    // 遞迴取得所有檔案
    function getAllFiles(dir: string) {
        let files: string[] = [];
        const items = readdirSync(dir, { withFileTypes: true });
        items.forEach(item => {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                files = files.concat(getAllFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        });
        return files;
    }

    const packagePath = path.join(BUILD_DIR, packageName);
    const allFiles = getAllFiles(packagePath);
    const fileDict: Map<string, FileGroup> = new Map();

    allFiles.forEach(filePath => {
        const fileExtension = path.extname(filePath) || 'No Extension';
        const stats = statSync(filePath);
        const fileInfo = new FileInfo(filePath, stats.size);

        const existingInfo = fileDict.get(fileExtension) || new FileGroup();
        existingInfo.fileInfos.push(fileInfo);
        existingInfo.totalSize += stats.size;
        fileDict.set(fileExtension, existingInfo);
    });

    const arrayFileDict: [string, FileGroup][] = [...fileDict.entries()];
    const sortedArrayFileDict: [string, FileGroup][] = arrayFileDict.sort((a, b) => b[1].totalSize - a[1].totalSize);
    const sortedFileDict = new Map(sortedArrayFileDict);

    return sortedFileDict;
}

export function formatBytes(bytes: number) {
    const postfix = ['B', 'KB', 'MB', 'GB'];
    let postfixIndex = 0;
    while (bytes >= 1024 && postfixIndex < postfix.length) {
        bytes /= 1024;
        postfixIndex++;
    }
    return `${bytes.toFixed(2)}${postfix[postfixIndex]}`;
}

export function getRelativePath(targetPath: string) {
    const relativePath = path.relative(BUILD_DIR, targetPath);
    return relativePath;
}

export function selectFile(fileFullPath: string) {
    const fileKey = getFileKeyByPath(fileFullPath);
    // 重設資源管理器目前被選中的項目
    Editor.Selection.clear('asset');
    if (Editor.Utils.UUID.isUUID(fileKey)) {
        // fileKey 是 uuid 就直接選中該資源
        Editor.Selection.select('asset', fileKey);
    } else {
        let autoPacUuids: string[] = [];
        if (fileFullPath.includes('main')) {
            // 從 main config json 取圖集內所有圖片的 uuid
            autoPacUuids = getAutoPacAllImage(mainConfigJson, fileKey);
        } else if (fileFullPath.includes('resources')) {
            // 從 resources config json 取圖集內所有圖片的 uuid
            autoPacUuids = getAutoPacAllImage(resourcesConfigJson, fileKey);
        }
        // 選中所有圖集用到的資源
        if (autoPacUuids.length !== 0) {
            autoPacUuids.forEach((uuid) => {
                Editor.Selection.select('asset', uuid);
            });
        }
    }
}

/**
 * 根據包體內檔案路徑取得 uuid
 * @param fileFullPath 包體內特定檔案絕對路徑
 * @returns 
 */
function getFileKeyByPath(fileFullPath: string) {
    const fileExtension = path.extname(fileFullPath).toLowerCase();
    const excludeExtensions = ['.json', '.css', '.html', '.ico', '.js', '.wasm'];
    let fileKey = '';

    if (fileExtension === '.ttf') {
        // .ttf 路徑會是 xxx/xxx/<uuid>/<檔案名稱>.ttf
        fileKey = path.basename(path.dirname(fileFullPath));
    } else if (excludeExtensions.includes(fileExtension)) {
        // 部分檔案沒有或不需要提供 uuid
        fileKey = '';
    } else {
        // 資源檔案路徑會是 xxx/xxx/<檔案名稱>.<副檔名>
        fileKey = path.basename(fileFullPath, fileExtension);
    }

    // 檢查是否有 MD5 標記，例如 logo.7f2a1
    const md5Match = fileKey.match(/^(.+?)\.[a-f0-9]{4,}$/);
    // md5Match[0] 是原字串，例如 logo.7f2a1
    // md5Match[1] 是去除 md5 code 的結果，例如 logo
    if (md5Match) {
        return md5Match[1];
    }

    return fileKey;
}

/**
 * 根據包體內圖集檔案的 uuid (檔案名稱) 取得圖集所有圖片的資源 uuid
 * @param jsonData config json
 * @param autoPacFileName 
 * @returns 
 */
function getAutoPacAllImage(jsonData: any, autoPacFileName: string) {
    const allUuid: string[] = [];
    if (/^[0-9a-fA-F]+$/.test(autoPacFileName)) {
        const prefix = autoPacFileName.substring(0, 2);
        const subDirNum = ((parseInt(prefix, 16) - 0x10) & 0xff).toString(16).padStart(2, '0');
        const dataKey = subDirNum + autoPacFileName.substring(2);

        const pack = jsonData.packs[dataKey];
        if (pack) {
            for (const data of pack) {
                // 去掉 "@xxxx..." 後綴
                const compressedUuid = jsonData.uuids[data]?.replace(/@[0-9a-fA-F]+$/, '');
                if (!compressedUuid) continue;

                const uuid = Editor.Utils.UUID.decompressUUID(compressedUuid);
                allUuid.push(uuid);
            }
        }
    }
    return allUuid;
}