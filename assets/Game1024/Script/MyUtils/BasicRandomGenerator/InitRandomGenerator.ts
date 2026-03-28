import { IStrategyRandomGenerator } from './IStrategyRandomGenerator';

/**
 * 更新的亂數資料介面--20251208
 * - totalGroups --old 已不再需要，
 *   因為總組數就是 groupSizes.length
 * - groupSize 變更為 groupSizes: number[] (陣列)
 */
export interface IRandomData {
    groupSizes: number[]; //-- 每組的大小陣列
    randomGroupSource: number[]; //-- 亂數來源
}

/**
 * 根據 groupSizes 產生多個群組
 * 確保從第二組開始，內容至少與前一組有 1 個元素不同。
 */
export class InitRandomGenerator implements IStrategyRandomGenerator<IRandomData> {

    /**
     * 根據亂數來源和每組大小陣列產生多個亂數群組。
     * @param value 包含群組大小陣列和亂數來源的資料。
     * @returns 亂數群組的二維陣列。
     */
    public generate(value: IRandomData): number[][] {
        const { randomGroupSource: source, groupSizes } = value;
        const n = source.length;
        const totalGroups = groupSizes.length;

        // --- 基本檢查 ---
        if (totalGroups === 0) return [];

        for (let i = 0; i < groupSizes.length; i++) {
            const k = groupSizes[i];
            if (k <= 0) throw new Error(`groupSizes[${i}](${k}) 必須 > 0`);
            if (k > n) throw new Error(`groupSizes[${i}](${k}) 不能大於來源長度(${n})`);
        }

        const result: number[][] = [];

        for (let i = 0; i < totalGroups; i++) {
            const k = groupSizes[i]; // 當前群組的大小

            // 先複製並打散來源
            const bag = this.shuffleArray(source);

            if (i === 0) {
                // 第一組無限制，直接取 k 個
                result.push(bag.slice(0, k));
                continue;
            }

            // 之後每一組：確保與上一組不同
            const prev = result[i - 1];
            const prevSet = new Set(prev);

            // 1) 打散後的來源分成「不在上一組」和「在上一組」的兩個池子
            const poolNotPrev: number[] = [];
            const poolPrev: number[] = [];
            for (const x of bag) {
                (prevSet.has(x) ? poolPrev : poolNotPrev).push(x);
            }

            const group: number[] = [];

            // 2) 盡量多的「非上一組元素」
            const takeFromNotPrev = Math.min(k, poolNotPrev.length);
            group.push(...poolNotPrev.slice(0, takeFromNotPrev));

            /*
                3) 若不夠，再從「上一組」補到足數
                由於 group 中已包含來自 poolNotPrev 的元素，只要 takeFromNotPrev > 0，內容就必定不同。
                唯一需要擔心的狀況是 takeFromNotPrev === 0，但這只在 (poolNotPrev.length === 0) 
                且 (k > 0) 的情況下發生，這意味著 source 的所有元素都在 prev 中，
                且當前群組大小 k > 0。此時 poolNotPrev = [] 且 poolPrev = source。
                由於只在 k > 0 時進入迴圈，且 source.length === n > 0，
                因此只要 k <= n，poolPrev 總是有足夠的元素來補足。
            
            */

            if (group.length < k) {
                // 為了更隨機，對上一組元素也打散後補。
                const needed = k - group.length;
                const remainingPrev = this.shuffleArray(poolPrev); // 重新打散上一組元素，確保隨機性

                group.push(...remainingPrev.slice(0, needed));
            }

            // 處理當 groupSize === source.length 時，totalGroups 應只有 1 組內容不同結果的檢查，
            // 由於新的邏輯會動態處理 k，只需要確保當 k=n 時，不能產生第二組。
            // 由於只檢查 k 與 n 的關係，且保證 group.length 總是在 source.length 範圍內，
            // 可以「至少一個不同」的邏輯可以處理這個問題，除非 n=k 且上一組就是 source 的全集。
            // 如果 n = k 且上一組就是 source 的全集，則 poolNotPrev.length = 0。
            // 此時 group 會從 poolNotPrev 拿 0 個，然後從 poolPrev 拿 k 個，
            // 也就是 group 會與 prev 內容完全一樣，這違反了我們的「內容不同」的目標。
            // 雖然原始程式碼有這個檢查，但當 groupSizes 是陣列時，這個檢查會變得複雜。
            // 如果用戶保證當 groupSizes 包含 n 時，它只出現一次，則可以省略這個複雜檢查。


            if (k === n && i > 0) {
                // 如果 k=n 且不是第一組，則 poolNotPrev 必定為空 (因為 prev 已經是 source 的全集)
                // 除非 source 內容發生變化，否則無法保證與上一組內容不同。
                // 為了符合原始邏輯的意圖，我們在 k=n 時，拋出錯誤。
                throw new Error(`當 groupSizes[${i}] === source.length (${n}) 時，只能產生 1 組與上一組內容不同的結果 (在內容完全來自 source 的假設下)。`);
            }

            result.push(group);
        }

        return result;
    }

    // 隨機打散陣列的 Fisher-Yates 演算法
    private shuffleArray<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // 原始程式碼中的這兩個方法在新邏輯中不再被直接使用，可以移除或保留
    private removeMatchingElements(arr: number[], toRemove: number[]): number[] {
        const setA = new Set(arr);
        return toRemove.filter(element => !setA.has(element));
    }

    private sampleK(arr: number[], k: number): number[] {
        return arr.slice(0, k);
    }
}