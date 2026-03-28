import { _decorator, Node } from 'cc';

/**
 * Game: 整局遊戲從start到全部表演完成
 * Round: Game裡面一盤面一盤面的結果
 *  
*/


export class GameDropResultData {
    private _firstRoundData: number[][] = [];
    get firstRoundData(): number[][] {
        return this._firstRoundData;
    }

    private _roundRemoveDataList: RoundRemoveData[] = [];
    get roundRemoveDataList(): RoundRemoveData[] {
        return this._roundRemoveDataList;
    }

    constructor(firstRoundData: number[][], roundRemoveDataList: RoundRemoveData[]) {
        this._firstRoundData = firstRoundData;
        this._roundRemoveDataList = roundRemoveDataList;
    }
}

export class RoundRemoveData {
    /**
     * 此資料為消除Icon在Reel上的Index
     * 例如消除第1~3輪第1&第2個Icon = [[0, 1], [0, 1], [0, 1], [], []] (假設共5輪)
     */

    private _removeIconData: number[][] = [];
    get removeIconData(): number[][] {
        return this._removeIconData;
    }

    /**
     * 此資料為每輪按removeIconData順序新增的Icon
     * 沿用上面的範例 [[11, 13], [12, 14], [15, 16], [], []]
     * 表示第一輪新增11&13，第二輪新增12&14，第三輪新增15&16
     */
    private _newIconData: number[][] = [];
    get newIconData(): number[][] {
        return this._newIconData;
    }

    constructor(removeIconData: number[][], newIconData: number[][]) {
        this._removeIconData = removeIconData;
        this._newIconData = newIconData;
    }
}

/**
 * 以下資料型態為公版自動產生&計算出來的，若沒有需要不用特地改寫
 */

export class IconMoveData {
    private _node: Node;
    private _moveCount: number = 0;
    private _resetCount: number = 0;

    constructor(node: Node, moveCount: number, resetCount: number) {
        this._node = node;
        this._moveCount = moveCount;
        this._resetCount = resetCount;
    }

    get node(): Node {
        return this._node;
    }

    set node(node: Node) {
        this._node = node;
    }

    set moveCount(newCount: number) {
        this._moveCount = newCount;
    }

    get moveCount(): number {
        return this._moveCount;
    }

    set resetCount(newCount: number) {
        this._resetCount = newCount;
    }

    get resetCount(): number {
        return this._resetCount;
    }
}

export class RoundMoveData {
    private _roundIconMoveData: IconMoveData[][] = [];
    private _roundIconMoveDataReverse: IconMoveData[][] = [];

    get roundIconMoveData(): IconMoveData[][] {
        return this._roundIconMoveData;
    }

    set roundIconMoveData(roundIconMoveData: IconMoveData[][]) {
        this._roundIconMoveData = roundIconMoveData;
    }

    set roundMoveCount(newMoveCount: number[] | number) {
        if (Array.isArray(newMoveCount)) {
            for (let i = 0; i < newMoveCount.length; i++) {
                for (let j = 0; j < this._roundIconMoveData[i].length; j++) {
                    this._roundIconMoveData[i][j].moveCount = newMoveCount[i];
                }
            }
        }
        else {
            for (let i = 0; i < this._roundIconMoveData.length; i++) {
                for (let j = 0; j < this._roundIconMoveData[i].length; j++) {
                    this._roundIconMoveData[i][j].moveCount = newMoveCount;
                }
            }
        }
    }

    set roundResetCount(newResetCount: number[] | number) {
        if (Array.isArray(newResetCount)) {
            for (let i = 0; i < newResetCount.length; i++) {
                for (let j = 0; j < this._roundIconMoveData[i].length; j++) {
                    this._roundIconMoveData[i][j].resetCount = newResetCount[i];
                }
            }
        }
        else {
            for (let i = 0; i < this._roundIconMoveData.length; i++) {
                for (let j = 0; j < this._roundIconMoveData[i].length; j++) {
                    this._roundIconMoveData[i][j].resetCount = newResetCount;
                }
            }
        }
    }

    public addReelMoveData(reelMoveData: IconMoveData[]): void {
        this._roundIconMoveData.push(reelMoveData);
    }

    public getReelMoveDataByIndex(index: number): IconMoveData[] {
        return this._roundIconMoveData[index];
    }

    public checkIfReelHasIconNeedToMove(index: number): boolean {
        for (let i = 0; i < this._roundIconMoveData[index].length; i++) {
            if (this._roundIconMoveData[index][i].moveCount > 0) {
                return true;
            }
        }
        return false;
    }

    public generateReverseOrderIndexList(): void {
        for (let i = 0; i < this._roundIconMoveData.length; i++) {
            this._roundIconMoveDataReverse[i] = [...this._roundIconMoveData[i]].reverse();
        }
    }

    public getReverseOrderIndex(nodeData: IconMoveData, reelID: number): number {
        return this._roundIconMoveDataReverse[reelID].findIndex(data => data === nodeData);
    }
}



