// 在方法前加入該裝飾器，可在方法執行完時顯示方法總執行時間
// 測試範例: TestUnitExample.ts
export function LogExecutionTime(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]): Promise<any> {
        const startTime = Date.now();
        const result = await original.apply(this, args);
        const endTime = Date.now();
        console.log(`${this.constructor.name}.${propertyKey} | execute ${(endTime - startTime) / 1000}s`);
        return result;
    };
    return descriptor;
}