
import { FlowAsyncFacade } from "../FlowAsyncFacade";
/**
 * 紀錄流程步驟的裝飾器 <採用裝飾器工廠>
 * TIPS:
 * 1. 需要搭配 AsyncScope 使用,並且在有建立 FlowTracker 的情況下使用
 * 2. 會自動取得 FlowTrackerManager 的單例來操作
 * 
 */

/**
 * 流程步驟裝飾器
 * 
 * 用於標記 class 中的方法屬於哪個流程（flowKey），
 * 並在執行時自動向 FlowAsyncFacade 記錄步驟進度。
 * 
 * @param flowKey  流程名稱
 * @param stepKey  此方法的步驟名稱
 */
export function FlowStep(flowKey: string, stepKey: string) {

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const original = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const self = this as any;

            // 從 this 取出 abortKey
            const abortKey =
                self._abortKey ||
                self.abortSignalKey ||
                "DefaultAbortKey";

            // 使用外觀模式統一操作
            const facade = FlowAsyncFacade.getInstance();

            try {
                facade.recordStep(abortKey, flowKey, stepKey);
            } catch (err) {
                console.warn(
                    `[FlowStep] Failed to record step '${stepKey}' under flow '${flowKey}' for abortKey '${abortKey}'`,
                    err
                );
            }

            // 執行原始方法
            const result = original.apply(this, args);

            // 若方法回傳 Promise → 等待完成
            if (result instanceof Promise) {
                return result
                    .then((r) => r)
                    .catch((err) => {
                        console.error(
                            `[FlowStep] Step '${stepKey}' in flow '${flowKey}' encountered an error:`,
                            err
                        );
                        throw err;
                    });
            }

            // 同步方法
            return result;
        };

        return descriptor;
    };
}