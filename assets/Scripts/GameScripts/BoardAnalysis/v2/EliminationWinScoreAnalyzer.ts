/**
 * 消除成功條件
 */
export type EliminationConditionDelegate = (mainSymbolID: number) => boolean;

export class EliminationWinScoreAnalyzer {
    /** WILD圖示 */
    protected wild: number[];
    /** 賠率表 */
    protected readonly oddList: number[][];
    /** 連線數量 */
    protected readonly connectNum: number[];
    /** 連線方向 */
    protected readonly directions: number[][];
    /** 紀錄2D盤面Icon */
    protected grid: number[][];
    /** 滾輪數量 */
    protected reelAmount: number;
    /** 單一輪有幾個圖示 */
    protected symbolLength: number;
    /** 一般圖示紀錄是否處理過 */
    protected normalBroad: boolean[][];
    /** WILD圖示紀錄是否處理過 */
    protected wildBroad: boolean[][];
    /** 請實作方法處理連線條件 */
    public eliminationCondition: EliminationConditionDelegate;

    /**
     * 初始化解析工具所需參數，{@link iconList}跟{@link oddList}的總數長度以及{@link connectNum}跟{@link oddList}裡的賠率長度要一樣，工具會是抓相對位置，SCATTER請另外算
     * @param oddList 賠率表
     * @param connectNum 連線數量
     * @param directions 連線方向(默認為上下左右)
     */
    constructor(oddList: number[][], connectNum: number[], eliminationCondition?: EliminationConditionDelegate, directions: number[][] = [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        this.oddList = oddList;
        this.connectNum = connectNum;
        this.directions = directions;
        this.eliminationCondition = eliminationCondition;
    }

    /**
     * 輸入的盤面資料，回傳盤面所有消除得分連線
     * @param iconData 盤面
     * @param reelAmount 滾輪數量
     * @param symbolLength 單一輪有幾個圖示
     * @param wildList WILD圖示
     * @return 盤面所有Icon消除得分資訊
     */
    public getEliminationWinData(iconData: number[], reelAmount: number, symbolLength: number, wildList: number[] = []): EliminationWinData[] {
        this.reelAmount = reelAmount;
        this.symbolLength = symbolLength;
        this.wild = wildList;
        this.grid = this.convertSymbolTo2DArray(iconData);
        this.normalBroad = Array.from({ length: this.reelAmount }, () => Array(this.symbolLength).fill(false));
        if (this.wild.length > 0) {
            this.setWildBroad();
        }
        return this.getEliminationWinDataList();
    }

    /**
     * 將盤面資訊轉成2D陣列
     * @param iconData 盤面資訊
     * @returns 2D盤面
     */
    protected convertSymbolTo2DArray(iconData: number[]): number[][] {
        let resultData: number[][] = [];
        for (let index = 0; index < this.reelAmount; index++) {
            resultData[index] = iconData.slice(index * this.symbolLength, (index + 1) * this.symbolLength);
        }
        return resultData;
    }

    /**
     * 獲取盤面所有Icon消除得分資訊
     * @returns 盤面所有Icon消除得分資訊
     */
    protected getEliminationWinDataList(): EliminationWinData[] {
        const WinDataList: EliminationWinData[] = [];
        const blocks: Block[] = this.getEliminationBlocks();
        for (let i = 0; i < blocks.length; i++) {
            const symbol: number = blocks[i].mainSymbol;
            const length: number = blocks[i].cells.length;
            const index: number = this.getWinConnectIndex(length);
            const odd: number = this.oddList[symbol][index];
            if (length >= this.connectNum[0] && odd > 0) {
                const pos: number[] = this.getPosList(blocks[i].cells);
                const win2DPos: number[][] = this.get2DPosList(blocks[i].cells);
                blocks[i].cells.sort(
                    (a, b) => a[0] - b[0] || a[1] - b[1]
                );
                const winData: EliminationWinData = new EliminationWinData(symbol, odd, pos, win2DPos);
                WinDataList.push(winData);
            }
        }
        return WinDataList;
    }

    /**
     * 獲取盤面所有Icon消除資訊
     * @returns 盤面所有Icon消除資訊
     */
    protected getEliminationBlocks(): Block[] {
        const blocks: Block[] = [];
        this.normalSymbolConnect(blocks); //一般連線

        if (this.wild.length > 0) { //有WILD 去計算WILD連線
            for (let r = 0; r < this.reelAmount; r++) {
                for (let c = 0; c < this.symbolLength; c++) {
                    if (this.wildBroad[r][c]) {
                        continue;
                    }
                    const currentSymbol: number = this.grid[r][c];
                    let mainSymbol: number = currentSymbol;
                    const block: Block = new Block(mainSymbol, []);
                    this.dfs(r, c, mainSymbol, this.wildBroad, block.cells);
                    if (block.cells.length >= 0) {
                        blocks.push(block);
                    }
                }
            }
        }
        return blocks;
    }

    /**
     * 一般Symbol連線
     * @param blocks 盤面所有Icon消除資訊
     */
    protected normalSymbolConnect(blocks: Block[]): void {
        for (let r = 0; r < this.reelAmount; r++) {
            for (let c = 0; c < this.symbolLength; c++) {
                this.updateNormalBoardForWild();
                if (this.normalBroad[r][c]) {
                    continue;
                }
                const currentSymbol: number = this.grid[r][c];
                let mainSymbol: number = currentSymbol;

                if (!this.eliminationCondition(mainSymbol)) {
                    continue;
                }

                if (this.isWild(currentSymbol)) {
                    let foundTarget: boolean = false;
                    for (let [dr, dc] of this.directions) {
                        const nr: number = r + dr;
                        const nc: number = c + dc;
                        if (this.canConnect(nr, nc)) {
                            mainSymbol = this.grid[nr][nc];
                            foundTarget = true;
                            break;
                        }
                    }
                    if (!foundTarget) {
                        this.normalBroad[r][c] = true;
                        continue;
                    }
                }

                const block: Block = new Block(mainSymbol, []);
                this.dfs(r, c, mainSymbol, this.normalBroad, block.cells);
                if (block.cells.length >= 0) {
                    blocks.push(block);
                }
            }
        }
    }

    /**
     * 深度優先搜尋
     * @param r row
     * @param c column
     * @param mainSymbol 當前搜尋值 
     * @param broad 版面
     * @param block 紀錄方塊座標
     */
    protected dfs(r: number, c: number, mainSymbol: number, broad: boolean[][], block: number[][]): void {
        if (!this.isValidCoordinate(r, c) || broad[r][c]) {
            return;
        }

        const val: number = this.grid[r][c];
        if (val !== mainSymbol && !this.isWild(val)) {
            return;
        }

        broad[r][c] = true;
        block.push([r, c]);

        for (let [dr, dc] of this.directions) {
            this.dfs(r + dr, c + dc, mainSymbol, broad, block);
        }
    }

    /**
     * 更新一般Bool版面
     */
    protected updateNormalBoardForWild(): void {
        for (let r = 0; r < this.reelAmount; r++) {
            for (let c = 0; c < this.symbolLength; c++) {
                if (this.isWild(this.grid[r][c])) {
                    this.normalBroad[r][c] = false;
                }
            }
        }
    }

    /**
     * 設置WildBool版面
     */
    protected setWildBroad(): void {
        this.wildBroad = Array.from({ length: this.reelAmount }, () => Array(this.symbolLength).fill(false));
        for (let r = 0; r < this.reelAmount; r++) {
            for (let c = 0; c < this.symbolLength; c++) {
                if (!this.isWild(this.grid[r][c])) {
                    this.wildBroad[r][c] = true;
                }
            }
        }
    }

    /**
     * 判斷是否可以連線
     * @param nr 下一個row座標
     * @param nc 下一個column座標
     * @returns 是否可以連線
     */
    protected canConnect(nr: number, nc: number): boolean {
        return this.isValidCoordinate(nr, nc) && !this.normalBroad[nr][nc] && !this.isWild(this.grid[nr][nc]);
    }

    /**
     * 判斷是否為有效座標
     * @param r row
     * @param c column
     * @returns 是否為有效座標
     */
    protected isValidCoordinate(r: number, c: number): boolean {
        return r >= 0 && c >= 0 && r < this.reelAmount && c < this.symbolLength;
    }

    /**
     * val是否為Wild
     * @param val 盤面資料
     * @returns  是否為Wild
     */
    protected isWild(val: number): boolean {
        return this.wild.includes(val);
    }

    /**
     * 獲取方格連線長度在連線數量中的相對應位置
     * @param cellLength 中獎位置的長度 
     * @returns 連線長度在連線數量中的相對應位置
     */
    protected getWinConnectIndex(cellLength: number): number {
        for (let i = 0; i < this.connectNum.length; i++) {
            const isMaxConnectNum: boolean = (i === this.connectNum.length - 1 && cellLength >= this.connectNum[i]);
            const isEqualConnectNum: boolean = (cellLength >= this.connectNum[i] && cellLength < this.connectNum[i + 1]);
            if (isMaxConnectNum || isEqualConnectNum) {
                return i;
            }
        }
    }

    /**
     * 獲取單一Symbol中獎位置
     * @param cell 方塊位置
     * @returns 中獎位置
     */
    protected getPosList(cell: number[][]): number[] {
        const posList: number[] = [];
        for (let i = 0; i < cell.length; i++) {
            posList.push(cell[i][0] * this.symbolLength + cell[i][1]);
        }
        posList.sort((a, b) => a - b);
        return posList;
    }

    /**
     * 獲取單一Symbol中獎的2D位置
     * @param cell 方塊位置
     * @returns 中獎的2D位置
     */
    protected get2DPosList(cell: number[][]): number[][] {
        const result: number[][] = Array.from({ length: this.reelAmount }, () => []);
        for (const [x, y] of cell) {
            if (result[x]) {
                result[x].push(y);
                result[x].sort((a, b) => a - b);
            }
        }
        return result;
    }
}
/**
 * 中獎資訊
 */
export class EliminationWinData {
    public readonly SymbolID: number;
    public readonly Odd: number;
    public readonly Pos: number[];
    public readonly Win2DPos: number[][];

    constructor(symbolID: number, odd: number, pos: number[], Win2DPos: number[][]) {
        this.SymbolID = symbolID;
        this.Odd = odd;
        this.Pos = pos;
        this.Win2DPos = Win2DPos;
    }
}

/**
 * 所有Icon消除資訊
 */
export class Block {
    /** 當前符號 */
    public readonly mainSymbol: number;
    /** 方塊位置 [[x,y],[x,y]...]*/
    public readonly cells: number[][];

    constructor(mainSymbol: number, cells: number[][]) {
        this.mainSymbol = mainSymbol;
        this.cells = cells;
    }
}


