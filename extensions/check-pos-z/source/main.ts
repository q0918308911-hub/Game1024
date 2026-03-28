
"use strict";
import * as CoreService from './CoreService';

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
    async checkNodePositionZ(message: string, isUrl: boolean): Promise<void> {
        await CoreService.checkNodePositionZ(message, isUrl);
    },
};