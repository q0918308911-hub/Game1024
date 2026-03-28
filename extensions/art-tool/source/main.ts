// @ts-ignore
import packageJSON from '../package.json';
import * as CoreService from './CoreService'
import { PrefabScanContext } from './interface';

const ctx: PrefabScanContext = {
    prefabInfos: [],
    currentIndex: 0,
    result: [],
    isCheckMask: false,
};

export const methods: { [key: string]: (...any: any) => any } = {
    openPanel() {
        Editor.Panel.open(packageJSON.name);
    },

    async convertPrefab(targetFolder: string[]) {
        await CoreService.convertPrefab(ctx, targetFolder);
    },

    afterReload() {
        CoreService.afterReload();
    },

    async openCurrentPrefab(): Promise<void> {
        await CoreService.openCurrentPrefab(ctx);
    },

    async sceneReady(assetUUID: string) {
        await CoreService.sceneReady(ctx, assetUUID);
    },
};



/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
export function load() { }

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export function unload() { }
