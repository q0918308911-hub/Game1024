/**
 * @author Eric 20260313
 * @description: 提供全域資料存取的寫入介面
 * 只有gamemanager能夠使用
 */

import { globalAccessImpl } from "./GlobalAccessImpl";

export const GlobalAccessWriter = {
    register: globalAccessImpl.register.bind(globalAccessImpl),
    setGlobalData: globalAccessImpl.setGlobalData.bind(globalAccessImpl),
    patch: globalAccessImpl.patch.bind(globalAccessImpl),
    getGlobalData: globalAccessImpl.getGlobalData.bind(globalAccessImpl),
    snapshot: globalAccessImpl.snapshot.bind(globalAccessImpl),
};