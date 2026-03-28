/**
 * 處理一條線內最終結果
 */
export type OutputConditionDelegate = (data: WaysWinData[]) => WaysWinData;
/**
 * 連線條件
 */
export type ConnectConditionDelegate = (mainSymbolID: number, nextSymbolID: number) => number;

export class WaysWinScoreAnalyzer {
    /** 中獎圖示 */
    protected readonly iconList: number[];
    /** 賠率表   */
    protected readonly oddList: number[][];
    /** 連線表 */
    protected readonly waysTable: number[][];
    /** 滾輪數量 */
    protected reelAmount: number;
    /** 單一輪有幾個圖示 */
    protected symbolLength: number;
    /** 請實作方法處理一條線內最終結果 */
    protected outPutCondition: OutputConditionDelegate;
    /** 請實作方法處理連線條件 */
    public connectCondition: ConnectConditionDelegate;

    /**
     * 初始化解析工具所需參數,iconList跟oddList的長度要一樣,工具會是抓相對位置 
     * @param iconList 中獎圖示表
     * @param oddList  賠率表
     * @param waysTable 連線表
     * @param connectCondition 連線條件{@link ConnectConditionDelegate}初始化可以放Null後續可以再修改,連線失敗請回傳負數
     */
    constructor(iconList: number[], oddList: number[][], waysTable: number[][], connectCondition?: ConnectConditionDelegate) {
        this.iconList = iconList;
        this.oddList = oddList;
        this.waysTable = waysTable;
        this.connectCondition = connectCondition;
    }

    /**
     * 輸入的盤面資料，回傳盤面所有得分連線
     * @param iconData 盤面資料
     * @param reelAmount 滾輪數量
     * @param symbolLength 單一輪有幾個圖示
     * @param outPutCondition 自定義方法處理一條線內最終結果{@link OutputConditionDelegate}
     * @returns 盤面所有得分連線
     */
    public getWaysAllWinData(iconData: number[], reelAmount: number, symbolLength: number, outPutCondition: OutputConditionDelegate): WaysWinData[] {
        this.reelAmount = reelAmount;
        this.symbolLength = symbolLength;
        this.outPutCondition = outPutCondition;
        return this.getAllWaysWinDataList(iconData);
    }

    /**
     * 回傳盤面所有得分連線
     * @param iconData 盤面資料
     * @returns 盤面所有中線組合
     */
    protected getAllWaysWinDataList(iconData: number[]): WaysWinData[] {
        const winDataList: WaysWinData[] = [];
        for (let i = 0; i < this.waysTable.length; i++) {
            const line: number[] = this.waysTable[i];
            const oneLineAllData: WaysWinData[] = this.getOneLineData(i, line, iconData);
            if (oneLineAllData.length > 0) {
                const result = this.outPutCondition(oneLineAllData);
                winDataList.push(result);
            }
        }
        return winDataList;
    }

    /**
     * 獲取單一條線中獎資訊,並根據{@link OutputConditionDelegate}決定最終結果
     * @param lineID 線號
     * @param line 單一連線所有位置
     * @param iconData 盤面
     * @returns 單一條線中最終中獎資訊(中獎線號,中獎圖示,中獎圖示的賠率,位置,2D位置)
     */
    protected getOneLineData(lineID: number, line: number[], iconData: number[]): WaysWinData[] {
        const lineMap: WaysWinData[] = [];
        const initPos: number = line[0];
        let tempSymbolId: number = iconData[initPos];
        for (let i = 1; i < line.length; i++) {
            const linePos: number = line[i];
            const symbolID: number = iconData[linePos];
            const newSymbolID = this.connectCondition(tempSymbolId, symbolID);
            if (newSymbolID > -1) {
                tempSymbolId = newSymbolID;
                const iconIndex = this.iconList.indexOf(tempSymbolId);
                const newLineOdds: number = this.oddList[iconIndex][i];
                if (newLineOdds > 0) {
                    const posList: number[] = line.slice(0, i + 1);
                    const pos2DData: number[][] = this.convertWinIndexTo2DArray(posList);
                    const oneLineWinData: WaysWinData = new WaysWinData(lineID, tempSymbolId, newLineOdds, posList, pos2DData);
                    lineMap.push(oneLineWinData);
                }
            }
            else {
                break;
            }
        }
        return lineMap;
    }

    /**
     * 將中獎位置轉為2D位置
     * @param winIconPos 中獎位置
     * @returns 2D位置
     */
    protected convertWinIndexTo2DArray(winIconPos: number[]): number[][] {
        let resultData: number[][] = Array.from({ length: this.reelAmount }, () => []);
        for (let index = 0; index < winIconPos.length; index++) {
            let reelID = Math.floor(winIconPos[index] / this.symbolLength);
            let pos = winIconPos[index] % this.symbolLength;
            resultData[reelID].push(pos);
        }

        return resultData;
    }
}

/**
 * 中獎資訊
 */
export class WaysWinData {
    /** 中獎線號 */
    private _winLineID: number;
    /** 中獎圖示 */
    private _symbolID: number;
    /** 中獎賠率 */
    private _odd: number;
    /** 中獎位置 */
    private _pos: number[];
    /** 中獎2D位置 */
    private _win2DPos: number[][];

    constructor(winLineID: number, symbolID: number, odd: number, pos: number[], Win2DPos: number[][]) {
        this._winLineID = winLineID;
        this._symbolID = symbolID;
        this._odd = odd;
        this._pos = pos;
        this._win2DPos = Win2DPos;
    }

    /** 取得中獎線號 */
    get winLineID(): number {
        return this._winLineID;
    }

    /** 設定中獎線號 */
    set winLineID(value: number) {
        this._winLineID = value;
    }

    /** 取得中獎圖示 */
    get symbolID(): number {
        return this._symbolID;
    }

    /** 設定中獎圖示 */
    set symbolID(value: number) {
        this._symbolID = value;
    }

    /** 取得中獎賠率 */
    get odd(): number {
        return this._odd;
    }

    /** 設定中獎賠率 */
    set odd(value: number) {
        this._odd = value;
    }

    /** 取得中獎位置 */
    get pos(): number[] {
        return this._pos;
    }

    /** 設定中獎位置 */
    set pos(value: number[]) {
        this._pos = value;
    }

    /** 取得中獎2D位置 */
    get win2DPos(): number[][] {
        return this._win2DPos;
    }

    /** 設定中獎2D位置 */
    set win2DPos(value: number[][]) {
        this._win2DPos = value;
    }
}