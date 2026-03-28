/**
 * @author:Eric 20250805
 * @description:
 * 使用interface來定義讀取與寫入的行為,將存取global data的權限分開
 * 只有gameManager能夠取得寫入權限
 * 金鑰是GLOBAL_DATA_WRITE_KEY
 */
export interface GlobalReader<T> {
    get<K extends keyof T>(key: K): T[K];
    snapshot(): Readonly<T>;
}
  
export interface GlobalWriter<T> {
    set<K extends keyof T>(key: K, value: T[K]): void;
    patch(partial: Partial<T>): void;
}
  