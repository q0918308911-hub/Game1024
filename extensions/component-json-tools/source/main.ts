// @ts-ignore
import * as fs from 'fs';
import { BasePropertyCount, defaultRealCurvePoints } from './Const';
import * as CoreService from './CoreService';

let lastPath = Editor.Project.path + '\\assets';

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     */
    afterReload() {
        CoreService.afterReload();
    },
    openExportJsonPanel() {
        Editor.Panel.open('component-json-tools.ExportJson');
    },

    openImportJsonPanel() {
        Editor.Panel.open('component-json-tools.ImportJson');
    },

    async exportComponentProps(nodeUUID: string, compName: string, filename: string): Promise<string> {
        return await CoreService.exportComponentProps(nodeUUID, compName, filename);
    },

    async importComponentProps(nodeUUID: string, jsonUUID: string): Promise<boolean> {
        return await CoreService.importComponentProps(nodeUUID, jsonUUID);
    },

    async exportJsonForComponent(nodeUUID: string, compName: string, filename: string): Promise<void> {
        return await CoreService.exportJsonForComponent(nodeUUID, compName, filename);
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