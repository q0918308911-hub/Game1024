export const autoTestRegistry = new Map<any, { name: string, args: any[] }[]>();

// 在方法前加入該裝飾器，可讓方法顯示在 TestTool → TestScript 的裝飾器測試按鈕列表
// 測試範例: TestUnitExample.ts
export function UnitTest(...args: any[]): Function {
    return function (target: any, propertyKey: string) {
        if (!autoTestRegistry.has(target.constructor)) {
            autoTestRegistry.set(target.constructor, []);
        }
        autoTestRegistry.get(target.constructor)!.push({ name: propertyKey, args });
    };
}
