
import { AssetInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';
import packageJSON from '../package.json';
import * as CoreService from './CoreService';

export function onAssetMenu(assetInfo: AssetInfo) {
    const subMenuItems = [];
    if (assetInfo.url === `db://${packageJSON.name}/${packageJSON.name}`) {
        subMenuItems.push(createMenuItem('創建插件', () => {
            Editor.Panel.open(packageJSON.name);
        }));
        subMenuItems.push(createMenuItem('安裝所有插件的依賴套件', () => {
            Editor.Message.send(packageJSON.name, 'install-all-extensions-dependencies');
        }));
        subMenuItems.push(createMenuItem('刷新插件列表', () => {
            Editor.Message.send(packageJSON.name, 'refresh-extensions-dummy');
        }));
        subMenuItems.push(createMenuItem('重新載入此插件', () => {
            Editor.Message.send(packageJSON.name, 'reload-extension', assetInfo);
        }));
        return [
            {
                label: '插件工具',
                submenu: subMenuItems,
            },
        ];
    }
    if (assetInfo.url.startsWith(`db://${packageJSON.name}/${packageJSON.name}/`)) {
        const subMenuItems = [];
        subMenuItems.push(createMenuItem('在 vscode 開啟插件', () => {
            Editor.Message.send(packageJSON.name, 'open-extension-in-vscode', assetInfo);
        }));
        subMenuItems.push(createMenuItem('重新載入此插件', () => {
            Editor.Message.send(packageJSON.name, 'reload-extension', assetInfo);
        }));
        subMenuItems.push(createMenuItem('刪除此插件', () => {
            Editor.Message.send(packageJSON.name, 'delete-extension', assetInfo);
        }));

        const cleanName = CoreService.getDummyCleanName(assetInfo);
        const extensionInfo = Editor.Package.getPackages().find(pkg => pkg.name === cleanName);
        if (extensionInfo) {
            const label = extensionInfo.enable ? '禁用此插件' : '啟用此插件';
            const message = extensionInfo.enable ? 'disable-extension' : 'enable-extension';
            subMenuItems.push(createMenuItem(label, () => {
                Editor.Message.send(packageJSON.name, message, assetInfo);
            }));
        }
        return [
            {
                label: '插件工具',
                submenu: subMenuItems,
            },
        ];
    }
    return [];
};

function createMenuItem(label: string, clickCallback: () => void) {
    return {
        label,
        click() {
            clickCallback();
        },
    };
}