
/**
 * @author:Eric 20250805
 * @description:
 * 不要亂用這個key,這是唯一能有<寫入>權限的key
 * 交給gameManager來使用
 * @example:
 * https://www.typescriptlang.org/docs/handbook/symbols.html
 * https://wangdoc.com/typescript/symbol
 * 
 * 
 */
export const GLOBAL_DATA_WRITE_KEY: unique symbol = Symbol('GLOBAL_DATA_WRITE_KEY');