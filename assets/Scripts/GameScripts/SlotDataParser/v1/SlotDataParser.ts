export type IconDataProcessor = (list: SlotDataIconData[]) => SlotDataIconData[];
export type Item = [string, string | number | SlotDataBoardData];
export type Line = [string, Item[]];
export type Section = [string, Item[] | Line[]];
export type SlotDataBoard = [string, SlotDataBoardData];
export type SlotRoundData = [string, (Section | SlotDataBoard)[]];
export type AllRoundSlotData = [string, SlotRoundData[]];

export type GameRecordAST = {
    /** 整體細單架構 */
    ast: AllRoundSlotData[],
    /** Icon圖片設定 */
    icons?: Record<number, IconConfig>
}

export type IconConfig = {
    /** Icon路徑 */
    src: string;
    /** Icon寬度 */
    width: number;
    /** Icon高度 */
    height: number;
};

export type DetailData = {
    /** 中獎圖案List */
    winIconSymbolList: number[];
    /** 中獎賠率List */
    odds: number[];
    /** 中獎線號List */
    lineID?: number[];
    /** 百搭路徑組合數量List */
    megaWayCombinationCount?: number[];
}

export enum SlotDataStringType {
    /**遊戲模式*/
    gameMode = "gamemode",
    /**細單紀錄*/
    records = "records",
    /**當局Spin紀錄 */
    round = "round",
    /**當次顯示的標題 */
    title = "title",
    /**當次盤面 */
    board = "board",
    /**當次說明 */
    summary = "summary",
    /**詳細中獎資訊 */
    details = "details",
    /**分行 */
    line = "line",
    /**文字顯示 */
    text = "text",
    /**圖片編號 */
    icon = "icon",
    /**數字 */
    number = "number",
    /**運算符號 */
    symbol = "symbol",
}

export enum SlotDataGameModeType {
    normal = "一般遊戲",
    free = "免費遊戲",
    bonus = "獎勵遊戲"
}

export class SlotDataParser {
    /**整個細單紀錄 */
    protected steps: any[] = [];
    /**單次盤面紀錄 */
    protected oneRound: (Section | SlotDataBoard)[] = [];
    /**當局所有盤面紀錄 */
    protected allRoundData: SlotRoundData[] = [];
    /**下注金額 */
    protected bet: number = 0;

    /**
     * 建立SlotDataParser
     * @param bet 下注金額
     */
    constructor(bet: number) {
        this.bet = bet;
    }

    /**
     * 組裝要顯示的文字
     * @param tag  Key值
     * @param value 顯示文字
     * @returns 當次文字排序
     */
    public createItem(key: string, value: string | number): Item {
        return [key, value];
    }

    /**
     * 組裝當次區塊文字排序
     * @param tag  Key值
     * @param arr 文字排序
     * @returns 當次盤面文字排序
     */
    public createSection(tag: string, arr: Item[] | Line[]): Section {
        return [tag, arr];
    }

    /**
     * 組裝當次盤面Icon紀錄
     * @param tag  Key值
     * @param board 盤面資訊
     * @returns 當次盤面Icon紀錄
     */
    public createBoard(tag: string, board: SlotDataBoardData): SlotDataBoard {
        return [tag, board];
    }

    /**
     * 組裝當次盤面紀錄
     * @param tag  Key值
     * @param round 當次盤面紀錄 
     * @returns 當次盤面紀錄
     */
    public createRound(tag: string, round: (Section | SlotDataBoard)[]): SlotRoundData {
        return [tag, round];
    }

    /**
     * 組裝此局全部盤面紀錄
     * @param tag  Key值
     * @param allRoundData 當前盤面紀錄 
     * @returns 此局全部盤面紀錄
     */
    public createAllRoundData(tag: string, allRoundData: SlotRoundData[]): AllRoundSlotData {
        return [tag, allRoundData];
    }

    /**
     * 設置此局遊戲模式，如果下局盤面紀錄與此局盤面紀錄不一樣，再重新呼叫一次
     * @param gameMode 遊戲模式
     * @returns  SlotDataParser，會把當前資料記錄起來
     */
    public setGameMode(gameMode: string): SlotDataParser {
        const item = this.createItem(SlotDataStringType.text, gameMode);
        const section = this.createSection(SlotDataStringType.gameMode, [item]);
        this.steps.push(section);
        return this;
    }

    /**
     * 設置盤面Title，由使用者組裝要顯示的資訊
     * @param items 顯示的資訊
     * @returns  SlotDataParser，會把當前資料記錄起來
     */
    public setTitle(items: Item[]): SlotDataParser {
        const section = this.createSection(SlotDataStringType.title, items);
        this.oneRound.push(section);
        return this;
    }

    /**
     * 設置盤面資訊，由使用者組裝要顯示的資訊
     * @param items 顯示的資訊
     * @returns  SlotDataParser，會把當前資料記錄起來
     */
    public setSummary(items: Item[]): SlotDataParser {
        const section = this.createSection(SlotDataStringType.summary, items);
        this.oneRound.push(section);
        return this;
    }

    /**
     * 設置盤面資訊，由使用者組裝要顯示的資訊，使用後會置中
     * @param items 顯示的資訊
     * @returns  SlotDataParser，會把當前資料記錄起來
     */
    public setLineSummary(items: Line[]): SlotDataParser {
        const section = this.createSection(SlotDataStringType.summary, items);
        this.oneRound.push(section);
        return this;
    }

    /**
     * 設置詳細中獎資訊，由使用者組裝要顯示的資訊
     * @param items 顯示的資訊
     * @returns  SlotDataParser，會把當前資料記錄起來
     */
    public setDetailDescription(items: Line[]): SlotDataParser {
        let section: Section = null;
        if (items.length === 0) {
            section = this.createSection(SlotDataStringType.details, [this.createItem(SlotDataStringType.text, "無中獎")]);
        }
        else {
            section = this.createSection(SlotDataStringType.details, items);
        }
        this.oneRound.push(section);
        return this;
    }

    /**
     * 設置盤面詳細得分資訊，由工具組裝
     * @param isWin 是否贏分 
     * @param detailDataList 詳細得分，{@link DetailData}可根據不同的遊戲類型傳入不同的類型 
     * @returns SlotDataParser，會把當前資料記錄起來
     */
    public setDetail(isWin: boolean, detailDataList?: DetailData): SlotDataParser {
        let section: Section = null;
        if (!isWin) {
            section = this.createSection(SlotDataStringType.details, [
                this.createItem(SlotDataStringType.text, "無中獎")
            ]);
        }
        else {
            const winSection = [];
            for (let i = 0; i < detailDataList.winIconSymbolList.length; i++) {
                const allDetails: Item[] = [];
                const score = detailDataList.megaWayCombinationCount !== undefined ?
                    detailDataList.odds[i] * this.bet * detailDataList.megaWayCombinationCount[i] : detailDataList.odds[i] * this.bet;
                allDetails.push(this.createItem(SlotDataStringType.icon, detailDataList.winIconSymbolList[i]))
                allDetails.push(this.createItem(SlotDataStringType.number, this.bet))
                allDetails.push(this.createItem(SlotDataStringType.symbol, "*"))
                allDetails.push(this.createItem(SlotDataStringType.number, detailDataList.odds[i]))
                if (detailDataList.megaWayCombinationCount !== undefined) {
                    allDetails.push(this.createItem(SlotDataStringType.symbol, "*"))
                    allDetails.push(this.createItem(SlotDataStringType.number, detailDataList.megaWayCombinationCount[i]))
                }
                allDetails.push(this.createItem(SlotDataStringType.symbol, "="))
                allDetails.push(this.createItem(SlotDataStringType.number, score.fixed()))
                if (detailDataList.lineID !== undefined) {
                    allDetails.push(this.createItem(SlotDataStringType.symbol, "("))
                    allDetails.push(this.createItem(SlotDataStringType.text, "線"))
                    allDetails.push(this.createItem(SlotDataStringType.number, (detailDataList.lineID[i] + 1)))
                    allDetails.push(this.createItem(SlotDataStringType.symbol, ")"))
                }
                winSection.push(this.createSection(SlotDataStringType.line, allDetails));
            }
            section = this.createSection(SlotDataStringType.details, winSection);
        }

        this.oneRound.push(section);
        return this;
    }

    /**
     * 將先前的一局盤面紀錄包裝，並清空一局盤面紀錄
     * @returns SlotDataParser，會把當前資料記錄起來
     */
    public combineOneRoundData(): SlotDataParser {
        const round: SlotRoundData = this.createRound(SlotDataStringType.round, this.oneRound);
        this.allRoundData.push(round);
        this.oneRound = [];
        return this;
    }

    /**
     * 設置一次盤面紀錄結束
     * @param isOneRoundEnd 判斷是否為當局最後一次盤面紀錄，有ReSpin請設False
     * @returns SlotDataParser 會把當前資料記錄起來
     */
    public setRecords(): SlotDataParser {
        const allRoundData = this.createAllRoundData(SlotDataStringType.records, this.allRoundData);
        this.steps.push(allRoundData);
        this.allRoundData = [];
        return this;
    }

    /**
     * 獲取細單最終結果
     * @returns SlotDataParser紀錄的整體細單架構
     */
    public getFinalSlotData(): AllRoundSlotData[] {
        return this.steps;
    }

    /**
     * 處理細單盤面，在{@link processors}裡放入需要額外處理的盤面功能，會按照順序執行
     * EX:標記顏色{@link setMark}，需要合併{@link mergesIconData}，多層圖案顯示{@link addIconList}
     * @param row 盤面高度
     * @param col 盤面寬度
     * @param iconList 盤面資料
     * @param processors 擴充功能
     * @param maxWidth 盤面最大顯示寬
     * @returns SlotDataParser 會把盤面資料記錄起來
     */
    public processIconData(row: number, col: number, iconList: number[], processors: IconDataProcessor[], maxWidth?: number): SlotDataParser {
        const baseList = this.setIconList(row, iconList);
        const showBoard: SlotDataIconData[] = processors.reduce((list, processor) => processor(list), baseList);
        this.setBoard(row, col, showBoard, maxWidth);
        return this;
    }

    /**
     * 設置細單盤面Icon的架構
     * @param row 盤面高度
     * @param col 盤面寬度
     * @param showBoard 盤面IconList
     * @param maxWidth  盤面最大寬
     * @returns 
     */
    public setBoard(row: number, col: number, showBoard: SlotDataIconData[], maxWidth?: number): SlotDataParser {
        const board: SlotDataBoardData = new SlotDataBoardData(col, row, showBoard, maxWidth);
        const section = this.createBoard(SlotDataStringType.board, board);
        this.oneRound.push(section);
        return this;
    }

    /**
     * 根據iconList，設定每個Icon
     * @param row 盤面高度
     * @param col 盤面寬度
     * @param iconList 盤面Icon
     * @returns 盤面Icon資訊
     */
    public setIconList(row: number, iconList: number[]): SlotDataIconData[] {
        const baseList = iconList.map((icon, i) => {
            const data = new SlotDataIconData();
            data.icon = icon;
            data.x = Math.floor(i / row) + 1;
            data.y = (i % row) + 1;
            data.width = 1;
            data.height = 1;
            return data;
        });
        return baseList;
    }

    /**
     * 設置整體標記，可多次標記顏色
     * @param set2DPos 標記的2D位置
     * @param color 顏色 請傳入"#RRGGBB"
     * @returns 合併後的盤面 請放在{@link processIconData}的processors陣列裡
     */
    public setMark(set2DPos: number[][], color: string): IconDataProcessor {
        return (list) => list.map((data) => {
            const xIndex = data.x - 1;
            const yIndex = data.y - 1;
            if (set2DPos[xIndex]) {
                if (set2DPos[xIndex].includes(yIndex)) {
                    data.mark = true;
                    data.markColor = color;
                }
            }
            return data;
        });
    }

    /**
     * 設置背景標記，可多次標記顏色
     * @param set2DPos 標記的2D位置
     * @param color 顏色 請傳入"#RRGGBB"
     * @returns 合併後的盤面 請放在{@link processIconData}的processors陣列裡
     */
    public setBackGroundMark(set2DPos: number[][], color: string): IconDataProcessor {
        return (list) => list.map((data) => {
            const xIndex = data.x - 1;
            const yIndex = data.y - 1;
            if (set2DPos[xIndex]) {
                if (set2DPos[xIndex].includes(yIndex)) {
                    data.markBackground = true;
                    data.markBackgroundColor = color;
                }
            }
            return data;
        });
    }

    /**
     * 設置外框標記，可多次標記顏色
     * @param set2DPos 標記的2D位置
     * @param color 顏色 請傳入"#RRGGBB"
     * @returns 合併後的盤面 請放在{@link processIconData}的processors陣列裡
     */
    public setBorderMark(set2DPos: number[][], color: string): IconDataProcessor {
        return (list) => list.map((data) => {
            const xIndex = data.x - 1;
            const yIndex = data.y - 1;
            if (set2DPos[xIndex]) {
                if (set2DPos[xIndex].includes(yIndex)) {
                    data.markBorder = true;
                    data.markBorderColor = color;
                }
            }
            return data;
        });
    }

    /**
     * 添加多層圖案，請按照順序填入 會抓取每個資料的相對位置做處理
     * @param zIndex icon的層級從2開始
     * @param row 盤面高度
     * @param posList 新增加icon的位置
     * @param iconList 新增加icon相對應的圖案
     * @param size icon的大小，可不放默認為{@link initNewSize}，輸入的話請放[[width1,height1],[width2,height2]...]
     * @returns 合併後的盤面，請放在{@link processIconData}的processors陣列裡
     */
    public addIconList(zIndex: number, row: number, posList: number[], iconList: number[], size: number[][] = []): IconDataProcessor {
        return (list) => {
            if (size.length === 0) {
                size = this.initNewSize(posList.length);
            }

            posList.forEach((pos, i) => {
                const data = new SlotDataIconData();
                data.icon = iconList[i];
                data.x = Math.floor(pos / row) + 1;
                data.y = (pos % row) + 1;
                data.z = zIndex;
                data.width = size[i][0];
                data.height = size[i][1];
                list.push(data);
            })
            return list;
        }
    }

    /**
     * 初始化icon的大小，都為[1,1]
     * @returns 符合盤面Icon數量的[1,1]陣列
     */
    private initNewSize(iconLength: number): number[][] {
        const size = [];
        for (let i = 0; i < iconLength; i++) {
            size.push([1, 1]);
        }
        return size;
    }

    /**
     * 設置盤面上Icon的文字，會根據位置陣列Index抓取相對應的文字
     * @param posList 位置陣列
     * @param textList 文字陣列
     * @returns 合併後的盤面，請放在{@link processIconData}的processors陣列裡
     */
    public setIconText(posList: number[], textList: string[]): IconDataProcessor {
        return (list: SlotDataIconData[]) => {
            for (let i = 0; i < posList.length; i++) {
                const pos = posList[i];
                list[pos].text = textList[i];
            }
            return list;
        }
    }

    /**
     * 會將盤面上的圖示合併，請傳入符合盤面的長度，並以大於0的數字分組
     * EX:3*5盤面，傳入[0,0,1,2,2,1..]，會將第2個位置與第5個位置合併以及第3個位置與第4個位置合併
     * @param merges 合併模板
     * @returns 合併後的盤面，請放在{@link processIconData}的processors陣列裡
     */
    public mergesIconData(merges: number[]): IconDataProcessor {
        return (list: SlotDataIconData[]) => {
            const groups = new Map<number, number[]>();

            for (let i = 0; i < list.length; i++) {
                const g = merges[i];
                if (g > 0) {
                    if (!groups.has(g)) {
                        groups.set(g, []);
                    }
                    groups.get(g).push(i);
                }
            }

            for (const indices of groups.values()) {
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

                for (const idx of indices) {
                    const c = list[idx];
                    if (c.x < minX) {
                        minX = c.x;
                    }
                    if (c.y < minY) {
                        minY = c.y;
                    }
                    if (c.x > maxX) {
                        maxX = c.x;
                    }
                    if (c.y > maxY) {
                        maxY = c.y;
                    }
                }

                const mainIdx = indices.find(idx => list[idx].x === minX && list[idx].y === minY)!;
                const main = list[mainIdx];
                main.width = maxX - minX + 1;
                main.height = maxY - minY + 1;

                for (const idx of indices) {
                    if (idx !== mainIdx) {
                        list[idx].icon = -1;
                        list[idx].width = 0;
                        list[idx].height = 0;
                    }
                }
            }

            return list.filter(c => c.icon !== -1 && c.width > 0 && c.height > 0);
        };
    }
}

/**
 * 盤面的資訊
 */
export class SlotDataBoardData {
    /** 盤面的寬 */
    public width: number = 0;
    /** 盤面的高 */
    public height: number = 0;
    /** 盤面的顯示最大寬 */
    public maxWidth: number = 0;
    /** 盤面的Icon */
    public icons: SlotDataIconData[] = [];

    constructor(width: number, height: number, icons: SlotDataIconData[], maxWidth?: number) {
        this.width = width;
        this.height = height;
        this.icons = icons;
        this.maxWidth = maxWidth ? maxWidth : width;
    }
}

/**
 * 盤面上的圖示
 */
export class SlotDataIconData {
    /** 盤面上的Icon */
    public icon: number = 0;
    /** 盤面上的X位置 */
    public x: number = 1;
    /** 盤面上的Y位置 */
    public y: number = 1;
    /** 盤面上Icon的層級 */
    public z?: number;
    /** 盤面上Icon的整體標記 */
    public mark?: boolean;
    /** 盤面上Icon的整體標記顏色 */
    public markColor?: string;
    /** 盤面上Icon的外框標記 */
    public markBorder?: boolean;
    /** 盤面上Icon的外框標記顏色 */
    public markBorderColor?: string;
    /** 盤面上Icon的背景標記 */
    public markBackground?: boolean;
    /** 盤面上Icon的背景標記顏色 */
    public markBackgroundColor?: string;
    /** 盤面上Icon的寬，如果有倍數大的話，都以左上角為基準點往右下做縮放*/
    public width?: number;
    /** 盤面上Icon的高，如果有倍數大的話，都以左上角為基準點往右下做縮放*/
    public height?: number;
    /** 盤面上Icon的角度 */
    public rotate?: number;
    /** 盤面上Icon的CSS樣式 */
    public style?: string;

    /** 圖上文字 */
    public text?: string;
    /** 文字顏色 */
    public textColor?: string
    /** 文字大小 */
    public textSize?: number;
    /** 文字水平位置 */
    public textPosX?: string; //'left' | 'center' | 'right' 預設: center
    /** 文字垂直位置 */
    public textPosY?: string; //'top' | 'center' | 'bottom' 預設: center

    /**圖示黯淡 */
    public dark?: boolean;
    /**圖示明亮 */
    public light?: boolean;
    /**圖示灰階 */
    public gray?: boolean;
}


//架構:
// [
//     [
//         "gamemode",
//         [["text", "一般遊戲"]]
//     ],
//     [
//         "records",
//         [
//             [
//                 "round",
//                 [
//                     [
//                         "title",
//                         [["text", "一般遊戲"], ["symbol", "-"], ["text", "回合"], ["number", 0]]
//                     ],
//                     [
//                         "board",
//                         {
//                             "width": 5,
//                             "height": 4,
//                             "icons": [
//                                 {
//                                     "icon": "3",
//                                     "x": 1,
//                                     "y": 1,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "4",
//                                     "x": 1,
//                                     "y": 2,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "8",
//                                     "x": 1,
//                                     "y": 3,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "7",
//                                     "x": 1,
//                                     "y": 4,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "6",
//                                     "x": 2,
//                                     "y": 1,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "3",
//                                     "x": 2,
//                                     "y": 2,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "4",
//                                     "x": 2,
//                                     "y": 3,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "0",
//                                     "x": 2,
//                                     "y": 4,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "7",
//                                     "x": 3,
//                                     "y": 1,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "8",
//                                     "x": 3,
//                                     "y": 2,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "2",
//                                     "x": 3,
//                                     "y": 3,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "7",
//                                     "x": 3,
//                                     "y": 4,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "6",
//                                     "x": 4,
//                                     "y": 1,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "5",
//                                     "x": 4,
//                                     "y": 2,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "2",
//                                     "x": 4,
//                                     "y": 3,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "2",
//                                     "x": 4,
//                                     "y": 4,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "4",
//                                     "x": 5,
//                                     "y": 1,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "4",
//                                     "x": 5,
//                                     "y": 2,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "4",
//                                     "x": 5,
//                                     "y": 3,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 },
//                                 {
//                                     "icon": "5",
//                                     "x": 5,
//                                     "y": 4,
//                                     "z": 1,
//                                     "mark": false,
//                                     "markColor": "#ff0000",
//                                     "width": 1,
//                                     "height": 1
//                                 }
//                             ]
//                         }
//                     ],
//                     [],
//                     //無中獎的版本
//                     [
//                         "details",
//                         [
//                             ["text", "無中獎"]
//                         ]
//                     ],

//                     //有中獎的版本
//                     [
//                         "details",
//                         [
//                             [
//                                 "line",
//                                 [
//                                     ["icon", 7],
//                                     ["number", 10000],
//                                     ["symbol", "*"],
//                                     ["number", 0.5],
//                                     ["symbol", "="],
//                                     ["number", 5000],
//                                     ["symbol", "("],
//                                     ["text", "線"],
//                                     ["number", 23],
//                                     ["symbol", ")"]
//                                 ]
//                             ],
//                             [

//                             ]
//                         ]
//                     ]
//                 ],
//                 [
//                     "summary",
//                     [["text", "單次贏分"], ["symbol", "="], ["number", 0]]
//                 ],
//                 [],
//                 [
//                     "summary",
//                     [["text", "總贏分"], ["symbol", "="], ["number", 0]]
//                 ]
//             ]
//         ]
//     ]
// ],
//     [],//一樣是從GameMode開始
//     [],//然後records下去
// ]
