export class MegaWaysWinScoreAnalyzer {
    /** WILD圖示 */
    protected readonly wild: number[];
    /** 賠率表 */
    protected readonly payTable: number[][];
    /** 中獎圖示 */
    protected readonly iconList: number[];
    /** 滾輪數量 */
    protected reelAmount: number;
    /** 單一輪有幾個圖示 */
    protected symbolLength: number;

    /**
     * 初始化解析工具所需參數，iconList跟oddList的長度要一樣，工具會是抓相對位置，SCATTER請另外算
     * @param wild WILD圖示
     * @param oddList 賠率表
     * @param iconList 中獎圖示表
     */
    constructor(wild: number[], oddList: number[][], iconList: number[]) {
        this.wild = wild;
        this.iconList = iconList;
        this.payTable = oddList;
    }

    /**
     * 輸入的盤面資料，回傳盤面所有得分連線
     * @param iconData 盤面
     * @param reelAmount 滾輪數量
     * @param symbolLength 單一輪有幾個圖示
     * @return 盤面所有Icon百搭得分資訊
     */
    public getMegaWaysWinData(iconData: number[], reelAmount: number, symbolLength: number): MegaWaysWinData[] {
        this.reelAmount = reelAmount;
        this.symbolLength = symbolLength;
        return this.megaWaysWinData(iconData);
    }

    /**
     * 輸入的盤面資料，回傳盤面百搭得分資訊
     * @param iconData 盤面資訊
     * @returns 盤面所有Icon百搭得分資訊
     */
    protected megaWaysWinData(iconData: number[]): MegaWaysWinData[] {
        const icon2DData: number[][] = this.convertSymbolTo2DArray(iconData);
        let matchWinData: MegaWaysWinData[] = [];
        for (let icon of this.iconList) {
            const oneIconMatchMap: MegaWaysWinData = this.calculateOneIconMegaWays(icon, icon2DData);
            if (oneIconMatchMap) {
                matchWinData.push(oneIconMatchMap);
            }
        }
        return matchWinData;
    }

    /**
     * 計算一個icon的百搭連線
     * @param icon 照{@link iconList}順序去找
     * @param icon2DData 2D盤面
     * @returns 單一個icon的百搭連線資訊或者是沒有得獎null
     */
    protected calculateOneIconMegaWays(icon: number, icon2DData: number[][]): MegaWaysWinData {
        let expandedWinPaths: number[][] = Array.from({ length: 0 }, () => []);
        for (let i = 0; i < this.reelAmount; i++) {
            let hasWild: boolean = this.wild.some(value => icon2DData[i].includes(value));//如果需要WILD都要匹配 some=>every
            if (icon2DData[i].includes(icon) || hasWild) {
                let winPos: number[] = [];
                let wildPos: number[] = [];
                const pos: number[] = icon2DData[i].indexesOf(icon).map((x) => x + (i * this.symbolLength));
                winPos = this.mergeTwoArrays(winPos, pos);
                if (hasWild) {
                    wildPos = this.getWildPos(icon2DData[i], (i * this.symbolLength));
                    winPos = this.mergeTwoArrays(winPos, wildPos);
                }
                expandedWinPaths = this.getExpandedWinPaths(expandedWinPaths, winPos);
            }
            else {
                break;
            }
        }
        if (!this.wild.includes(icon)) {
            const wildPos: number[] = this.getWildPos(icon2DData.flat(), 0);
            expandedWinPaths = expandedWinPaths.filter(path => {
                return !path.every(pos => wildPos.includes(pos));
            });
        }

        return this.getOneIconWinData(icon, expandedWinPaths);
    }

    /**
    * 回傳一個icon的百搭連線贏分資料
    * @param icon 照{@link iconList}順序去找
    * @param expandedWinPaths 分裂後的贏分位置
    * @returns 單一個icon的百搭連線資訊或者是沒有得獎null
    */
    private getOneIconWinData(icon: number, expandedWinPaths: number[][]): MegaWaysWinData {
        if (expandedWinPaths.length !== 0) {
            const tempCount: number = expandedWinPaths[0].length - 1;
            const targetOdds: number = this.payTable[icon][tempCount];
            const tempOdds = (targetOdds * expandedWinPaths.length).fixed();
            if (tempOdds > 0) {
                const allPosList = expandedWinPaths.flat().set().sort((a, b) => (a - b));
                const win2DPos: number[][] = this.convertWinIndexTo2DArray(allPosList);
                return new MegaWaysWinData(icon, tempOdds, allPosList, expandedWinPaths, win2DPos);
            }
        }
        return null;
    }

    /**
     * 獲取WILD的位置
     * @param iconList 盤面資訊 
     * @param columnOffset 盤面中該 column 的起始索引
     * @returns 獲取Wild位置
     */
    protected getWildPos(iconList: number[], columnOffset: number): number[] {
        let wildPosList: number[] = [];
        for (let i = 0; i < this.wild.length; i++) {
            const wildPos: number[] = iconList.indexesOf(this.wild[i]).map((x) => x + columnOffset);
            wildPosList = wildPosList.concat(wildPos);
        }
        return wildPosList;
    }

    /**
     * 獲取單輪上WILD的數量
     * @param iconList 單輪上的iconList
     * @returns WILD的數量
     */
    protected getWildCount(iconList: number[]): number {
        let wildTotal: number = 0;;
        for (let i = 0; i < this.wild.length; i++) {
            const wildCount: number = iconList.count(this.wild[i]);
            wildTotal += wildCount;
        }
        return wildTotal;
    }

    /**
     * 將盤面資訊轉成2D陣列
     * @param iconData 盤面資訊
     * @returns 盤面2D陣列
     */
    protected convertSymbolTo2DArray(iconData: number[]): number[][] {
        let resultData: number[][] = [];
        for (let index = 0; index < this.reelAmount; index++) {
            resultData[index] = iconData.slice(index * this.symbolLength, (index + 1) * this.symbolLength);
        }
        return resultData;
    }

    /**
     * 從既有的贏分位置延伸新的配對成功位置
     * EX:combinedWire:[0] posList:[1,2] => [0,1],[0,2]
     * @param combinedWire 先前的中獎位置
     * @param posList 新的中獎位置
     * @returns 合併後的中獎位置
     */
    protected getExpandedWinPaths(combinedWire: number[][], posList: number[]): number[][] {
        if (combinedWire.length === 0) {
            combinedWire = posList.map((value) => [value]);
            return combinedWire;
        }
        const newArray: number[][] = [];

        for (let item of combinedWire) {
            for (let pos of posList) {
                newArray.push([...item, pos]);
            }
        }
        combinedWire = newArray.map((arr) => [...arr]);
        return combinedWire;
    }

    /**
     * 合併兩個陣列
     * @param targetArray 主陣列 
     * @param inputArray  附加陣列
     * @returns 合併後的陣列
     */
    private mergeTwoArrays(targetArray: number[], inputArray: number[]): number[] {
        targetArray = targetArray.concat(inputArray);
        targetArray = targetArray.set();
        return targetArray;
    }

    /**
     * 將中獎位置轉為2D位置
     * @param winIconPos 贏分位置
     * @returns 贏分2D位置
     */
    protected convertWinIndexTo2DArray(winIconPos: number[]): number[][] {
        let resultData: number[][] = Array.from({ length: this.reelAmount }, () => []);
        for (let index = 0; index < winIconPos.length; index++) {
            let reelID: number = Math.floor(winIconPos[index] / this.symbolLength);
            let pos: number = winIconPos[index] % this.symbolLength;
            resultData[reelID].push(pos);
        }
        return resultData;
    }
}

/**
 * 中獎資訊
 */
export class MegaWaysWinData {
    /** 中獎IconID */
    private _winSymbolID: number;
    /** 中獎賠率 */
    private _odd: number;
    /** 中獎位置 */
    private _pos: number[];
    /** 中獎2D位置 */
    private _win2DPos: number[][];
    /** Icon的中獎位置組合 */
    private _oneMatchPosList: number[][];

    constructor(winSymbolIDodd: number, odd: number, pos: number[], oneMatchPosList: number[][], win2DPos: number[][]) {
        this._winSymbolID = winSymbolIDodd;
        this._odd = odd;
        this._pos = pos;
        this._oneMatchPosList = oneMatchPosList;
        this._win2DPos = win2DPos;
    }

    /** 設定中獎Icon */
    set winSymbolID(value: number) {
        this._winSymbolID = value;
    }

    /** 獲取中獎Icon */
    get winSymbolID(): number {
        return this._winSymbolID;
    }

    /** 設定中獎賠率 */
    set odd(value: number) {
        this._odd = value;
    }

    /** 獲取中獎賠率 */
    get odd(): number {
        return this._odd;
    }

    /** 設定中獎位置 */
    set pos(value: number[]) {
        this._pos = value;
    }

    /** 獲取中獎位置 */
    get pos(): number[] {
        return this._pos;
    }

    /** 設定單一種Icon的中獎組合 */
    set oneMatchPos(value: number[][]) {
        this._oneMatchPosList = value;
    }

    /** 獲取單一種Icon的中獎位置 */
    get oneMatchPos(): number[][] {
        return this._oneMatchPosList;
    }

    /** 設定中獎2D位置 */
    set win2DPos(value: number[][]) {
        this._win2DPos = value;
    }

    /** 獲取中獎2D位置 */
    get win2DPos(): number[][] {
        return this._win2DPos;
    }
}
