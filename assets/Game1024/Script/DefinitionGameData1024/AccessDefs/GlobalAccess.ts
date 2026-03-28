import { globalAccessImpl } from "./GlobalAccessImpl";
/**
 * 對外暴露的讀取外部全局數據的接口
 * 只能讀取，不能寫入
 */
export const GlobalAccessReader = {
    getGlobalData: globalAccessImpl.getGlobalData.bind(globalAccessImpl),
    snapshot: globalAccessImpl.snapshot.bind(globalAccessImpl),
};