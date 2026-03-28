export class EliminationWinScoreAnalyzer {
    protected readonly wild: number[];
    protected readonly iconList: number[];
    protected readonly oddList: number[][];
    protected readonly connectNum: number[];
    protected readonly directions: number[][];
    protected grid: number[][];
    protected reelAmount: number;
    protected symbolLength: number;
    protected normalBroad: boolean[][];
    protected wildBroad: boolean[][];

    /**
     * @param wild WILD圖示
     * @param iconList 中獎圖示表 (將有賠率的連線中獎圖示放入，SCATTER請另外算)
     * @param oddList 賠率表
     * @param connectNum 連線數量
     * @param directions 連線方向(默認為上下左右)
     */
    constructor(wild: number[], iconList: number[], oddList: number[][], connectNum: number[], directions: number[][] = [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        this.wild = wild;
        this.iconList = iconList;
        this.oddList = oddList;
        this.connectNum = connectNum;
        this.directions = directions;
    }

    public getEliminationWinData(iconData: number[], reelAmount: number, symbolLength: number): EliminationWinData[] {
        this.reelAmount = reelAmount;
        this.symbolLength = symbolLength;
        this.grid = this.convertSymbolTo2DArray(iconData);
        this.normalBroad = Array.from({ length: this.reelAmount }, () => Array(this.symbolLength).fill(false));
        if (this.iconListHasWild()) {
            this.wildBroad = Array.from({ length: this.reelAmount }, () => Array(this.symbolLength).fill(false));
            this.setWildBroad();
        }
        return this.getEliminationWinDataList();
    }

    protected convertSymbolTo2DArray(iconData: number[]): number[][] {
        let resultData: number[][] = [];

        for (let index = 0; index < this.reelAmount; index++) {
            resultData[index] = iconData.slice(index * this.symbolLength, (index + 1) * this.symbolLength);
        }
        return resultData;
    }

    protected getEliminationWinDataList(): EliminationWinData[] {
        const WinDataList: EliminationWinData[] = [];
        const blocks: Block[] = this.getEliminationBlocks();
        for (let i = 0; i < blocks.length; i++) {
            const symbol: number = blocks[i].symbol;
            const length: number = blocks[i].cells.length;
            const index: number = this.getWinLength(length);
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

    protected getEliminationBlocks(): Block[] {
        const blocks: Block[] = [];
        this.normalConnect(blocks);

        if (this.iconListHasWild()) {
            for (let r = 0; r < this.reelAmount; r++) {
                for (let c = 0; c < this.symbolLength; c++) {
                    if (this.wildBroad[r][c]) {
                        continue;
                    }
                    const currentValue: number = this.grid[r][c];
                    let targetValue: number = currentValue;
                    const block: Block = new Block(targetValue, []);
                    this.dfs(r, c, targetValue, this.wildBroad, block.cells);
                    if (block.cells.length >= 0) {
                        blocks.push(block);
                    }
                }
            }
        }
        return blocks;
    }

    protected normalConnect(blocks: Block[]): void {
        for (let r = 0; r < this.reelAmount; r++) {
            for (let c = 0; c < this.symbolLength; c++) {
                this.resetWild();
                if (this.normalBroad[r][c]) {
                    continue;
                }
                const currentValue: number = this.grid[r][c];
                let targetValue: number = currentValue;

                if (this.isWild(currentValue)) {
                    let foundTarget: boolean = false;
                    for (let [dr, dc] of this.directions) {
                        const nr: number = r + dr;
                        const nc: number = c + dc;
                        if (this.canConnect(nr, nc)) {
                            targetValue = this.grid[nr][nc];
                            foundTarget = true;
                            break;
                        }
                    }
                    if (!foundTarget) {
                        this.normalBroad[r][c] = true;
                        continue;
                    }
                }

                const block: Block = new Block(targetValue, []);
                this.dfs(r, c, targetValue, this.normalBroad, block.cells);
                if (block.cells.length >= 0) {
                    blocks.push(block);
                }
            }
        }
    }

    protected dfs(r: number, c: number, targetValue: number, broad: boolean[][], block: number[][]): void {
        if (!this.isValidCoordinate(r, c) || broad[r][c]) {
            return;
        }

        const val: number = this.grid[r][c];
        if (val !== targetValue && !this.isWild(val)) {
            return;
        }

        broad[r][c] = true;
        block.push([r, c]);

        for (let [dr, dc] of this.directions) {
            this.dfs(r + dr, c + dc, targetValue, broad, block);
        }
    }

    protected resetWild(): void {
        for (let r = 0; r < this.reelAmount; r++) {
            for (let c = 0; c < this.symbolLength; c++) {
                if (this.isWild(this.grid[r][c])) {
                    this.normalBroad[r][c] = false;
                }
            }
        }
    }

    protected setWildBroad(): void {
        for (let r = 0; r < this.reelAmount; r++) {
            for (let c = 0; c < this.symbolLength; c++) {
                if (!this.isWild(this.grid[r][c])) {
                    this.wildBroad[r][c] = true;
                }
            }
        }
    }

    protected canConnect(nr: number, nc: number): boolean {
        return this.isValidCoordinate(nr, nc) && !this.normalBroad[nr][nc] && !this.isWild(this.grid[nr][nc]);
    }

    protected isValidCoordinate(r: number, c: number): boolean {
        return r >= 0 && c >= 0 && r < this.reelAmount && c < this.symbolLength;
    }

    protected isWild(val: number): boolean {
        return this.wild.includes(val);
    }

    protected iconListHasWild(): boolean {
        return this.iconList.some(val => this.wild.includes(val));
    }

    protected getWinLength(cellLength: number): number {
        for (let i = 0; i < this.connectNum.length; i++) {
            const isMaxConnectNum: boolean = (i === this.connectNum.length - 1 && cellLength >= this.connectNum[i]);
            const isEqualConnectNum: boolean = (cellLength >= this.connectNum[i] && cellLength < this.connectNum[i + 1]);
            if (isMaxConnectNum || isEqualConnectNum) {
                return i;
            }
        }
    }

    protected getPosList(cell: number[][]): number[] {
        const posList: number[] = [];
        for (let i = 0; i < cell.length; i++) {
            posList.push(cell[i][0] * this.symbolLength + cell[i][1]);
        }
        posList.sort((a, b) => a - b);
        return posList;
    }

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

export class Block {
    public readonly symbol: number;
    public readonly cells: number[][];
    constructor(symbol: number, cells: number[][]) {
        this.symbol = symbol;
        this.cells = cells;
    }
}


