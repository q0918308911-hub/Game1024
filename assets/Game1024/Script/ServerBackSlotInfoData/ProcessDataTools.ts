import { BinaryBuffer } from 'db://assets/Scripts/Communication/BinaryBuffer';
import { Utility } from 'db://assets/Scripts/ModuleEntry';


export interface ITwoDCoordinate {
    reel: number; // reel index
    index: number; // index within the reel
}

export class ProcessDataTools {

    //--攤平
    public getFlatArrayFrom2Ds(original: number[][]): number[] {
        return original.reduce((acc, row) => acc.concat(row), []);
    }

    //--拷貝
    public getClone2DArray(original: number[][]): number[][] {
        return original.map(row => row.slice());
    }

    //--展開
    public get2DArray(card: number[], reelAmount: number, reelSymbolAmount: number): number[][] {

        const ary2d: number[][] = [];
        for (let i: number = 0; i < reelAmount; i++) {
            const row = [];
            for (let j: number = 0; j < reelSymbolAmount; j++) {
                row.push(card[i * reelSymbolAmount + j]);
            }
            ary2d.push(row);
        }
        return ary2d;
    }


    /**
     * 連續查找二維陣列中所有子陣列的索引當中是否有某個指定的值
     * @param twoDArray 待檢查的二維陣列 (number[][] 或 any[][])
     * @param targetValue 要比對的目標值。
     * @returns 包含所有匹配項索引的陣列。如果沒有匹配，則返回一個空陣列 []
     */
    public findAllElementMatch(twoDArray: number[][], targetValue: number): { reelIndex: number, iconIndex: number }[] {

        const results: { reelIndex: number, iconIndex: number }[] = [];

        for (let i = 0; i < twoDArray.length; i++) {
            const subArray = twoDArray[i];
            for (let j = 0; j < subArray.length; j++) {
                if (subArray[j] === targetValue) {
                    results.push({ reelIndex: i, iconIndex: j });
                }
            }
        }

        // 過濾掉所有不匹配 (即 -1) 的索引
        //const matchingIndexes: number[] = indexedResults.filter(index => index !== -1);
        return results;
    }

    //--去重
    public removeDuplicateInArray(targetArray: number[]): number[] {

        const uniqueElementsSet: Set<number> = new Set(targetArray);
        const uniqueArray: number[] = Array.from(uniqueElementsSet);
        return uniqueArray;
    }

    /**
    
     * @param isAscending 排序方向。
     * - true (或不傳入): 由小到大 (a - b)。
     * - false: 由大到小 (b - a)。
     * @returns 排序後的新陣列 (不修改原始陣列)。
     */
    public sortArrayWithDirection(arr: number[], isAscending: boolean = true): number[] {

        const arrayCopy = arr.slice();
        // 2. 定義比較函式
        const comparator = (a: number, b: number) => {
            if (isAscending) {
                // 升冪 (由小到大): a - b
                return a - b;
            } else {
                // 降冪 (由大到小): b - a
                return b - a;
            }
        };
        return arrayCopy.sort(comparator);
    }


    /**
     * 將一維攤平後的索引轉換為二維陣列的 (行, 列) 座標。
     * * @param flatIndexes 攤平後的一維索引陣列 (e.g., [1, 10, 11, 19])。
     * @param SYMBOL_LENGTH 每一行 (Reel) 的長度 (W)。
     * @returns 包含 {reel, index} 座標物件的陣列。
     */
    public convertWinFlatToTwoD(flatIndexes: number[], SYMBOL_LENGTH: number): ITwoDCoordinate[] {

        if (SYMBOL_LENGTH <= 0) {
            throw new Error("SYMBOL_LENGTH 必須為正數且大於零。");
        }
        const twoDCoordinates: ITwoDCoordinate[] = [];
        for (const flatIndex of flatIndexes) {
            // 確保索引有效
            if (flatIndex < 0) {
                console.warn(`跳過無效的索引: ${flatIndex}`);
                continue;
            }
            const reelIndex = Math.floor(flatIndex / SYMBOL_LENGTH);

            const symbolIndex = flatIndex % SYMBOL_LENGTH;

            twoDCoordinates.push({
                reel: reelIndex,
                index: symbolIndex
            });
        }

        return twoDCoordinates;
    }

    public getBase64Data(buffer: BinaryBuffer): string {
        const arrayBuffer = buffer.getArrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        return Utility.uint8ArrayToBase64(uint8Array);
    }


    public cloneBinaryBuffer(original: BinaryBuffer): BinaryBuffer {
        const bufferCopy = original.getArrayBuffer().slice(0); // clone the buffer
        const clone = new BinaryBuffer(bufferCopy);
        clone.setReadPosition(original.getReadIndex());
        clone.USE_LITTLE_ENDIAN = original.USE_LITTLE_ENDIAN;
        return clone;
    }


}