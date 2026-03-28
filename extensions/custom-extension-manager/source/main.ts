import { AssetInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';
import * as CoreService from './CoreService';
import { waitTime } from './Utils';

export const methods: { [key: string]: (...any: any) => any } = {
    installAllExtensionsDependencies() {
        CoreService.installAllExtensionsDependencies();
    },
    refreshExtensionsDummy() {
        CoreService.refreshExtensionsDummy();
    },
    async createExtension(template: string, name: string) {
        await CoreService.createExtension(template, name);
    },
    openExtensionInVscode(assetInfo: AssetInfo) {
        CoreService.openExtensionInVscode(assetInfo);
    },
    reloadExtension(assetInfo: AssetInfo) {
        CoreService.reloadExtension(assetInfo);
    },
    deleteExtension(assetInfo: AssetInfo) {
        CoreService.deleteExtension(assetInfo);
    },
    enableExtension(assetInfo: AssetInfo) {
        CoreService.enableExtension(assetInfo);
    },
    disableExtension(assetInfo: AssetInfo) {
        CoreService.disableExtension(assetInfo);
    },
    afterReload() {
        CoreService.afterReload();
    },
};

export function load() {
    // 避免有插件載入完成時機較晚 導致實際上是啟用 但被標記成禁用 
    waitTime(1).then(() => {
        CoreService.refreshExtensionsDummy();
    });
}

export function unload() {
    CoreService.clearExtensionDummy();
}