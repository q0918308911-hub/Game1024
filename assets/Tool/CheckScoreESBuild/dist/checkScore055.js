"use strict";
var MyLib = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    checkScore: () => checkScore
  });

  // ../../../Game/Game055/Scripts/GameConfig055.ts
  var GameConfig055;
  ((GameConfig0552) => {
    GameConfig0552.REEL_AMOUNT = 6;
    GameConfig0552.ICON_AMOUNT = 4;
    GameConfig0552.MAX_ICON_AMOUNT = 6;
    GameConfig0552.ICONS_LENGTH = GameConfig0552.REEL_AMOUNT * GameConfig0552.ICON_AMOUNT;
    GameConfig0552.MAX_ICONS_LENGTH = GameConfig0552.REEL_AMOUNT * GameConfig0552.MAX_ICON_AMOUNT;
    GameConfig0552.NORMAL_SYMBOL_LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    GameConfig0552.SCATTER_SYMBOL = 10;
    GameConfig0552.WILD_SYMBOL = 11;
    GameConfig0552.APPEAR_SYMBOL_LIST = [GameConfig0552.SCATTER_SYMBOL, GameConfig0552.WILD_SYMBOL];
    GameConfig0552.NG_COMBO_MULTIPLiER = [1, 1, 1, 3, 3, 5];
    GameConfig0552.FG_COMBO_MULTIPLiER = [0, 1, 0, 3, 0, 1];
    GameConfig0552.SIX_DISK_COMBO = 3;
    GameConfig0552.MAX_COMBO = 6;
    GameConfig0552.ICON_HEIGHT = 112;
    GameConfig0552.SYMBOL_0_ODD_LIST = [0, 0, 0.1, 0.3, 0.5, 1];
    GameConfig0552.SYMBOL_1_ODD_LIST = [0, 0, 0.08, 0.2, 0.4, 0.6];
    GameConfig0552.SYMBOL_2_ODD_LIST = [0, 0, 0.06, 0.16, 0.3, 0.5];
    GameConfig0552.SYMBOL_3_ODD_LIST = [0, 0, 0.06, 0.16, 0.3, 0.5];
    GameConfig0552.SYMBOL_4_ODD_LIST = [0, 0, 0.04, 0.1, 0.2, 0.4];
    GameConfig0552.SYMBOL_5_ODD_LIST = [0, 0, 0.04, 0.08, 0.12, 0.24];
    GameConfig0552.SYMBOL_6_ODD_LIST = [0, 0, 0.04, 0.08, 0.12, 0.24];
    GameConfig0552.SYMBOL_7_ODD_LIST = [0, 0, 0.04, 0.08, 0.12, 0.24];
    GameConfig0552.SYMBOL_8_ODD_LIST = [0, 0, 0.04, 0.08, 0.12, 0.24];
    GameConfig0552.SYMBOL_9_ODD_LIST = [0, 0, 0.04, 0.08, 0.12, 0.24];
    GameConfig0552.ALL_SYMBOL_ODD_LIST = [
      GameConfig0552.SYMBOL_0_ODD_LIST,
      GameConfig0552.SYMBOL_1_ODD_LIST,
      GameConfig0552.SYMBOL_2_ODD_LIST,
      GameConfig0552.SYMBOL_3_ODD_LIST,
      GameConfig0552.SYMBOL_4_ODD_LIST,
      GameConfig0552.SYMBOL_5_ODD_LIST,
      GameConfig0552.SYMBOL_6_ODD_LIST,
      GameConfig0552.SYMBOL_7_ODD_LIST,
      GameConfig0552.SYMBOL_8_ODD_LIST,
      GameConfig0552.SYMBOL_9_ODD_LIST
    ];
    GameConfig0552.SCATTER_STANDARD = 3;
    GameConfig0552.FREE_SPIN = 8;
    GameConfig0552.ADD_FREE_SPIN = 2;
    GameConfig0552.TEST_DATA = [
      //server 4656 client 4786
      "BwYGBAUHBAkICQcABwYGBwQKAgoAAAMGAwkGBgQKBQQJCQgJAAUABgYECgIKAAADBgEAAAYGBAgKBQQDAwgABQAGBgQKAgoAAAMGAgEMCQcJAAYEBgMCCgUEAAUHAwMAAgUBAAYGBwcECgIKCQIAAAMGASAIBQgJAggJAwkIBQQHCAcJBAcDCAUHAggHBAMFCQIFCQMJBQUEBwYHCQQEBwMFCAcCBwMVBQ8HAwkCCAUDCQAEBAcFBgcJCAQHAwgIAgcBBggEBAMJAgkBAQgFCQYHBQAEBAYIBwUGCQYCBggEAwcBBQgIAgEFBQgEBAMJBQkBAQgJAQYHAAQEBgYIBwYJBgIGCAQDBwEFCAgCCAkIBwkFBAgFAgIGBgIGBAIDAQAEBgYEAAUIBwUDAgIFBQQFAAIJAgMIBQYBCQkJBgQCBQgHBgMCAggFBAACCQIDCAUGAQkJCQYDAgkEAwQABwUDBgcCCQcIBgQHBQgFBgEJCQkGARQABwgDBAAHBgkFAwYDAgUCCQgFAQYGBAUJAwgFBgEGAgsJCQYBFQgABwgEAAUHBgkFBgECBQIJCAMFAQYEBQgJCAUGAQcGAgkJBggDCQEFCQMHBwYHBAYCBgkJCQYGCQUJBQAGAAQDCQYDAAYCAgUABgkHBwkJBQUICQgDBQAEAwkJAwAGAgIFAQAJBwcJCQUFCAkIAwMRCAkJBQQJCQUDBwICBQcAAQcCCQcFBQUICAECAQEICQkEAQkFCQkDAAYEBwICAwUHAAEHCQkCCQcFBQUFBQgIARMEBQcBBQEFAgcCCAMJAgUIBwUGBwMHAwUABQADCAUJBgEBAQQJAgAFAwUHAggGAgkGAAYHBwEJCQcABgcCCQQCAwMAAgYEBAkCAQQIBwYBAAkJAAEGAgkEAgMDAAIGBAQJAgEDCRIDAggHBgcDBwkGBwECBAIDAwACCwQECQIBAQgBAQgCCAYJAQkEAwkIAgkEAQIACQQCAwMDBQACCwQJBwQJAgEBGgEFCAIIBgEJCQQDCQgIAgkEAgAJBAIDAwMFCwILBAkHBAkCAQ=="
      //server 1532 client 1616
      // 'AgYICQEDBQACCAgACQgHAQYEAwIKCgoBAAgFCAgIBwkHBQgGAgIACQMACQcIAgADBgUABwYDBQUFAAAFBgcFBwgFBQQGBQYIBwMIAwUHBgMEBgAABAAGBwMBBwgBBAYGCAcDCAMRCQ0ABQcDBwQAAAMEBAcJAwcIBgQBAQgHAwgBAwIFAAAABQIDBAcAAAYEBAcIAwkJBQkDCAADBgQBAQIICAcDCAEXBwMHAAcAAAcJBwYFCQEECAIHBAEHCAgBAQcAAwAIAwAAAgkGBQkBBAgCBwQBBwgIAQMMABQIAQYFBgUFBgYHAwYFBwcIBgkDCQgFBwQEAAgBBQgIBQUBAwcDBQcHCAYJAwkIBQcEAwQACQAIBgQFAQcECQAEBQQHAggGCQMJCAUHBAEBAQcGBQAGBgQEAgEHBQYDAgkACAIHBwIIBAUGCQMJBQQIBQcEARAAAQQFBQAGCAkEBAIGCQUDAgAFAQgCAggEBQYJAwkFBAgFBwQGBQcEBQcFAwUJBQIIBwAGCAgABAYEBgUCCAYHBAYGBwMCBwkCCAcABggIAAQGBAYFAwEVBQUCCAQHCQYDBwcCBwUIAAYICAAEBgsGBQEPBQgEBgQACQYHAAUABwIBBgkHCQYECAMGAAAHCAcJAwkHBwQIAgMIAQkFCAUGBgMEBQIJBQAIBAkDCQYECAIDCAEJBQgFBgYDBAUDBBUWBQkFAAUJAwkBBgQCAgMBCQUFBQYECAYFAQACBAIIAgkFBwkEAwYJBwMDCAgGBgkIBQMA',
    ];
  })(GameConfig055 || (GameConfig055 = {}));

  // ../../GameScripts/BoardAnalysis/v2.0/MegaWaysWinScoreAnalyzer.ts
  var MegaWaysWinScoreAnalyzer = class {
    /**
     * 初始化解析工具所需參數，iconList跟oddList的長度要一樣，工具會是抓相對位置，SCATTER請另外算
     * @param wild WILD圖示
     * @param oddList 賠率表
     * @param iconList 中獎圖示表
     */
    constructor(wild, oddList, iconList) {
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
    getMegaWaysWinData(iconData, reelAmount, symbolLength) {
      this.reelAmount = reelAmount;
      this.symbolLength = symbolLength;
      return this.megaWaysWinData(iconData);
    }
    /**
     * 輸入的盤面資料，回傳盤面百搭得分資訊
     * @param iconData 盤面資訊
     * @returns 盤面所有Icon百搭得分資訊
     */
    megaWaysWinData(iconData) {
      const icon2DData = this.convertSymbolTo2DArray(iconData);
      let matchWinData = [];
      for (let icon of this.iconList) {
        const oneIconMatchMap = this.calculateOneIconMegaWays(icon, icon2DData);
        for (const [key, value] of oneIconMatchMap) {
          const winData = new MegaWaysWinData(key, value.odd, value.pos, value.oneMatchPos, value.win2DPos);
          matchWinData.push(winData);
        }
      }
      return matchWinData;
    }
    /**
     * 計算一個icon的百搭連線
     * @param icon 照{@link iconList}順序去找
     * @param icon2DData 2D盤面
     * @returns 單一個icon的百搭連線資訊
     */
    calculateOneIconMegaWays(icon, icon2DData) {
      const oneIconMatchMap = /* @__PURE__ */ new Map();
      let expandedWinPaths = Array.from({ length: 0 }, () => []);
      let allPosList = [];
      let tempOdds = 0;
      let tempCount = 1;
      for (let i = 0; i < this.reelAmount; i++) {
        const newLineOdds = this.payTable[icon][i];
        const hasWild = this.wild.some((value) => icon2DData[i].includes(value));
        if (icon2DData[i].includes(icon) || hasWild) {
          let winPos = [];
          const pos = icon2DData[i].indexesOf(icon).map((x) => x + i * this.symbolLength);
          allPosList = this.mergeTwoArrays(allPosList, pos);
          winPos = this.mergeTwoArrays(winPos, pos);
          if (hasWild) {
            const wildPos = this.getWildPos(icon2DData[i], i * this.symbolLength);
            allPosList = this.mergeTwoArrays(allPosList, wildPos);
            winPos = this.mergeTwoArrays(winPos, wildPos);
          }
          expandedWinPaths = this.getExpandedWinPaths(expandedWinPaths, winPos);
          const oneReelMatchCount = icon2DData[i].count(icon) + this.getWildCount(icon2DData[i]);
          tempCount = (tempCount * oneReelMatchCount).fixed();
          tempOdds = (newLineOdds * tempCount).fixed();
          if (tempOdds > 0) {
            const win2DPos = this.convertWinIndexTo2DArray(allPosList);
            const payLineData = new MegaWaysWinData(icon, tempOdds, allPosList, expandedWinPaths, win2DPos);
            oneIconMatchMap.set(icon, payLineData);
          }
        } else {
          break;
        }
      }
      return oneIconMatchMap;
    }
    /**
     * 獲取WILD的位置
     * @param iconList 盤面資訊 
     * @param columnOffset 盤面中該 column 的起始索引
     * @returns 獲取Wild位置
     */
    getWildPos(iconList, columnOffset) {
      let wildPosList = [];
      for (let i = 0; i < this.wild.length; i++) {
        const wildPos = iconList.indexesOf(this.wild[i]).map((x) => x + columnOffset);
        wildPosList = wildPosList.concat(wildPos);
      }
      return wildPosList;
    }
    /**
     * 獲取單輪上WILD的數量
     * @param iconList 單輪上的iconList
     * @returns WILD的數量
     */
    getWildCount(iconList) {
      let wildTotal = 0;
      ;
      for (let i = 0; i < this.wild.length; i++) {
        const wildCount = iconList.count(this.wild[i]);
        wildTotal += wildCount;
      }
      return wildTotal;
    }
    /**
     * 將盤面資訊轉成2D陣列
     * @param iconData 盤面資訊
     * @returns 盤面2D陣列
     */
    convertSymbolTo2DArray(iconData) {
      let resultData = [];
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
    getExpandedWinPaths(combinedWire, posList) {
      if (combinedWire.length === 0) {
        combinedWire = posList.map((value) => [value]);
        return combinedWire;
      }
      const newArray = [];
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
    mergeTwoArrays(targetArray, inputArray) {
      targetArray = targetArray.concat(inputArray);
      targetArray = targetArray.set();
      return targetArray;
    }
    /**
     * 將中獎位置轉為2D位置
     * @param winIconPos 贏分位置
     * @returns 贏分2D位置
     */
    convertWinIndexTo2DArray(winIconPos) {
      let resultData = Array.from({ length: this.reelAmount }, () => []);
      for (let index = 0; index < winIconPos.length; index++) {
        let reelID = Math.floor(winIconPos[index] / this.symbolLength);
        let pos = winIconPos[index] % this.symbolLength;
        resultData[reelID].push(pos);
      }
      return resultData;
    }
  };
  var MegaWaysWinData = class {
    constructor(winSymbolIDodd, odd, pos, oneMatchPosList, win2DPos) {
      this._winSymbolID = winSymbolIDodd;
      this._odd = odd;
      this._pos = pos;
      this._oneMatchPosList = oneMatchPosList;
      this._win2DPos = win2DPos;
    }
    /** 設定中獎Icon */
    set winSymbolID(value) {
      this._winSymbolID = value;
    }
    /** 獲取中獎Icon */
    get winSymbolID() {
      return this._winSymbolID;
    }
    /** 設定中獎賠率 */
    set odd(value) {
      this._odd = value;
    }
    /** 獲取中獎賠率 */
    get odd() {
      return this._odd;
    }
    /** 設定中獎位置 */
    set pos(value) {
      this._pos = value;
    }
    /** 獲取中獎位置 */
    get pos() {
      return this._pos;
    }
    /** 設定單一種Icon的中獎組合 */
    set oneMatchPos(value) {
      this._oneMatchPosList = value;
    }
    /** 獲取單一種Icon的中獎位置 */
    get oneMatchPos() {
      return this._oneMatchPosList;
    }
    /** 設定中獎2D位置 */
    set win2DPos(value) {
      this._win2DPos = value;
    }
    /** 獲取中獎2D位置 */
    get win2DPos() {
      return this._win2DPos;
    }
  };

  // ../../../Game/Game055/Scripts/Model/RoundModel055.ts
  var {
    ICON_AMOUNT,
    SIX_DISK_COMBO,
    MAX_COMBO,
    MAX_ICON_AMOUNT,
    REEL_AMOUNT,
    WILD_SYMBOL,
    SCATTER_SYMBOL,
    SCATTER_STANDARD,
    ALL_SYMBOL_ODD_LIST,
    NORMAL_SYMBOL_LIST,
    NG_COMBO_MULTIPLiER,
    FG_COMBO_MULTIPLiER,
    FREE_SPIN,
    ADD_FREE_SPIN
  } = GameConfig055;
  var RoundBaseData055 = class {
    constructor() {
      this.readyHandReelID = -1;
      this.resultData = [];
      this.winPosList = [];
      this.multiplier = 1;
      this.odd = 0;
      this.winScore = 0;
    }
  };
  var ExtraData055 = class extends RoundBaseData055 {
    constructor() {
      super(...arguments);
      this.isSixDisk = false;
      this.wildPosList = [];
      this.extraData = [];
      this.isReadyHand = false;
    }
  };
  var RoundModel055 = class {
    constructor(isFG) {
      this.mainData = new RoundBaseData055();
      this.extraDataList = [];
      this.isFG = false;
      this.freeSpin = 0;
      this.analyzer = new MegaWaysWinScoreAnalyzer([WILD_SYMBOL], ALL_SYMBOL_ODD_LIST, NORMAL_SYMBOL_LIST);
      this.isFG = isFG;
    }
    getTotalOdd() {
      let totalOdd = this.mainData.odd;
      for (let index = 0; index < this.extraDataList.length; index++) {
        const extraDataInfo = this.extraDataList[index];
        totalOdd += extraDataInfo.odd;
      }
      return totalOdd.fixed();
    }
    getTotalScore() {
      let totalScore = this.mainData.winScore;
      for (let index = 0; index < this.extraDataList.length; index++) {
        const extraDataInfo = this.extraDataList[index];
        totalScore += extraDataInfo.winScore;
      }
      return totalScore.fixed();
    }
    setMainData(resultData, betValue, startMultiplier) {
      this.mainData.resultData = this.diskConvert2DArray(resultData, ICON_AMOUNT);
      let winDataList = this.analyzer.getMegaWaysWinData(resultData, REEL_AMOUNT, ICON_AMOUNT);
      this.mainData.winPosList = this.calculateWinPos(winDataList);
      ;
      this.mainData.multiplier = startMultiplier;
      this.mainData.odd = this.calculateOdd(winDataList, this.mainData.multiplier);
      this.mainData.winScore = (this.mainData.odd * betValue).fixed();
      this.mainData.readyHandReelID = this.getReadyHandReelID(this.mainData.resultData);
    }
    setExtraDataList(extraData, wildPosList, betValue) {
      this.extraDataList = Array.from({ length: extraData.length }, () => new ExtraData055());
      this.setExtraResultData2D(extraData);
      let startMultiplier = this.mainData.multiplier;
      for (let index = 0; index < this.extraDataList.length; index++) {
        const extraDataInfo = this.extraDataList[index];
        let lastData;
        if (index === 0) {
          lastData = this.mainData;
        } else {
          lastData = this.extraDataList[index - 1];
        }
        let isChangeSixDisk = index === SIX_DISK_COMBO - 1;
        const extraData2 = this.calculateExtraData(extraDataInfo.resultData, lastData.winPosList, isChangeSixDisk);
        extraDataInfo.extraData = extraData2;
        const iconAmount = extraDataInfo.resultData[0].length;
        let finalResultData = extraDataInfo.resultData.flat();
        if (wildPosList[index]) {
          finalResultData = this.calculateFinalResultData(finalResultData, wildPosList[index]);
          extraDataInfo.wildPosList = this.posConvert2DArray(wildPosList[index], iconAmount);
        }
        extraDataInfo.isSixDisk = iconAmount === MAX_ICON_AMOUNT;
        let winDataList = this.analyzer.getMegaWaysWinData(finalResultData, REEL_AMOUNT, iconAmount);
        winDataList = this.checkWinData(winDataList, finalResultData, iconAmount);
        const winPosList = this.calculateWinPos(winDataList);
        extraDataInfo.winPosList = winPosList;
        extraDataInfo.multiplier = this.isFG ? startMultiplier += this.getMultiplier(index, this.isFG) : this.getMultiplier(index, this.isFG);
        extraDataInfo.odd = this.calculateOdd(winDataList, extraDataInfo.multiplier);
        extraDataInfo.winScore = (extraDataInfo.odd * betValue).fixed();
        extraDataInfo.isReadyHand = this.getExtraIsReadyHand(lastData.resultData);
      }
    }
    calculateFreeSpin() {
      const extraLength = this.extraDataList.length;
      if (!this.isFG) {
        const lastExtraData = extraLength > 0 ? this.extraDataList[extraLength - 1].resultData : this.mainData.resultData;
        const haveFG = this.checkCanEnterFG(lastExtraData.flat());
        this.freeSpin = haveFG ? FREE_SPIN : 0;
      } else {
        this.freeSpin = (extraLength - MAX_COMBO + 1) * ADD_FREE_SPIN;
      }
    }
    /**
     * 因為公版有錯誤，這裡主要是在移除全部為wild的連線，以及重算所有屬性
     * @param winDataList 公版給的中線資料
     * @param diskData 盤面資料
     * @param iconAmount icon數量
     * @returns 
     */
    checkWinData(winDataList, diskData, iconAmount) {
      let result = [...winDataList];
      for (let index = 0; index < winDataList.length; index++) {
        const data = winDataList[index];
        let lineList = [...data.oneMatchPos];
        for (let index2 = 0; index2 < data.oneMatchPos.length; index2++) {
          const line = data.oneMatchPos[index2];
          if (line.filter((pos) => diskData[pos] !== WILD_SYMBOL).length === 0) {
            let lineIndex = lineList.indexOf(line);
            lineList.splice(lineIndex, 1);
          }
        }
        data.oneMatchPos = lineList;
        if (lineList.length > 0) {
          const setPosList = new Set(lineList.flat());
          const allPosList = Array.from(setPosList);
          data.pos = [...allPosList];
          let winPos2D = this.posConvert2DArray(allPosList, iconAmount);
          winPos2D = winPos2D.filter((posList) => posList.length > 0);
          data.win2DPos = winPos2D;
          let symbolCount = data.oneMatchPos[0].length;
          data.odd = this.calculateSymbolOdd(data.winSymbolID, symbolCount, data.oneMatchPos.length);
          result[index] = data;
        }
      }
      result = result.filter((data) => data.oneMatchPos.length > 0);
      return result;
    }
    calculateSymbolOdd(symbolID, symbolCount, line) {
      let symbolOdd = ALL_SYMBOL_ODD_LIST[symbolID][symbolCount - 1];
      let totalOdd = (symbolOdd * line).fixed();
      return totalOdd;
    }
    getMultiplier(index, isFG) {
      const comboMultiplier = isFG ? FG_COMBO_MULTIPLiER : NG_COMBO_MULTIPLiER;
      if (index >= MAX_COMBO) {
        return comboMultiplier[MAX_COMBO - 1];
      }
      return comboMultiplier[index];
    }
    getReadyHandReelID(diskData) {
      let scatterCount = 0;
      for (let index = 0; index < diskData.length; index++) {
        const reelData = diskData[index];
        if (scatterCount >= SCATTER_STANDARD - 1) {
          return index;
        }
        if (reelData.includes(SCATTER_SYMBOL)) {
          scatterCount++;
        }
      }
      return -1;
    }
    getExtraIsReadyHand(diskData) {
      let scatterCount = 0;
      for (let index = 0; index < diskData.length; index++) {
        const reelData = diskData[index];
        if (reelData.includes(SCATTER_SYMBOL)) {
          scatterCount++;
        }
        if (scatterCount >= SCATTER_STANDARD - 1) {
          return true;
        }
      }
      return false;
    }
    setExtraResultData2D(extraData) {
      for (let index = 0; index < extraData.length; index++) {
        const data = extraData[index];
        const iconAmount = index >= SIX_DISK_COMBO - 1 ? MAX_ICON_AMOUNT : ICON_AMOUNT;
        const extraData2D = this.diskConvert2DArray(data, iconAmount);
        this.extraDataList[index].resultData = extraData2D;
      }
    }
    calculateFinalResultData(resultData, wildPosList) {
      let result = resultData.slice();
      for (let posIndex = 0; posIndex < wildPosList.length; posIndex++) {
        const pos = wildPosList[posIndex];
        result[pos] = WILD_SYMBOL;
      }
      return result;
    }
    calculateWinPos(winDataList) {
      let winPosData = [];
      for (let index = 0; index < winDataList.length; index++) {
        const winData = winDataList[index];
        for (let reelID = 0; reelID < winData.win2DPos.length; reelID++) {
          const winPos = winData.win2DPos[reelID];
          if (winPos.length > 0) {
            if (!winPosData[reelID]) {
              winPosData[reelID] = winPos;
            } else {
              winPosData[reelID].push(...winPos);
            }
          }
        }
      }
      winPosData.forEach((posList, index) => {
        let set = Array.from(new Set(posList));
        let sort = set.sort((a, b) => a - b);
        winPosData[index] = sort;
      });
      return winPosData;
    }
    calculateOdd(winDataList, multiplier) {
      let odd = 0;
      for (let index = 0; index < winDataList.length; index++) {
        const winData = winDataList[index];
        odd += winData.odd;
      }
      if (multiplier > 0) {
        odd *= multiplier;
        odd = odd.fixed();
      }
      return odd;
    }
    calculateExtraData(extraData, winPosData, isChangeSixDisk) {
      let result = [];
      for (let index = 0; index < winPosData.length; index++) {
        let count = winPosData[index].length;
        if (isChangeSixDisk) {
          count += 2;
        }
        result[index] = extraData[index].slice(0, count);
      }
      if (isChangeSixDisk) {
        const startReelID = winPosData.length;
        for (let index = startReelID; index < extraData.length; index++) {
          result[index] = extraData[index].slice(0, 2);
        }
      }
      return result;
    }
    diskConvert2DArray(data, iconAmount) {
      let result = [];
      for (let reelID = 0; reelID < REEL_AMOUNT; reelID++) {
        let oneReelData = data.slice(reelID * iconAmount, (reelID + 1) * iconAmount);
        result.push(oneReelData);
      }
      return result;
    }
    posConvert2DArray(data, iconAmount) {
      let result = Array.from({ length: REEL_AMOUNT }, () => []);
      for (let index = 0; index < data.length; index++) {
        const pos = data[index];
        const inReelPos = pos % iconAmount;
        const reelID = Math.floor(pos / iconAmount);
        result[reelID].push(inReelPos);
      }
      return result;
    }
    checkCanEnterFG(diskData) {
      const scatterCount = diskData.filter((symbolID) => symbolID === SCATTER_SYMBOL).length;
      return scatterCount >= SCATTER_STANDARD;
    }
  };

  // ../../../Game/Game055/Scripts/Model/SlotInfo055.ts
  var {
    ICONS_LENGTH,
    MAX_ICONS_LENGTH,
    SIX_DISK_COMBO: SIX_DISK_COMBO2
  } = GameConfig055;
  var FG_COMBO_WILD = [
    0,
    1,
    2,
    4
  ];
  var SlotInfo055 = class {
    constructor(originData, betValue) {
      this.roundModelNG = null;
      this.roundModelFGList = [];
      this.betValue = 0;
      this.betValue = betValue;
      this.roundModelNG = this.parseRoundData(originData, false);
      this.roundModelNG.extraDataList.forEach((extraData, index) => {
      });
      if (this.roundModelNG.freeSpin > 0) {
        const haveFGData = originData.getByte();
        if (haveFGData[0]) {
          let fgCount = haveFGData[1];
          let multiplier = 1;
          for (let index = 0; index < fgCount; index++) {
            const roundModelFG = this.parseRoundData(originData, true, multiplier);
            this.roundModelFGList.push(roundModelFG);
            const extraDataList = roundModelFG.extraDataList;
            if (extraDataList.length > 0) {
              multiplier = extraDataList[extraDataList.length - 1].multiplier;
            }
          }
        }
      }
      console.log(this.getTotalScore());
    }
    parseRoundData(originData, isFG, startMultiplier = 1) {
      let diskData = originData.getBytesArray(ICONS_LENGTH);
      let roundModel = new RoundModel055(isFG);
      roundModel.setMainData(diskData, this.betValue, startMultiplier);
      let haveExtraData = originData.getByte();
      if (haveExtraData[0]) {
        let extraDataLength = haveExtraData[1];
        if (extraDataLength > 0) {
          let extraDataList = Array.from({ length: extraDataLength }, () => []);
          let wildPosList = Array.from({ length: extraDataLength }, () => []);
          for (let index = 0; index < extraDataLength; index++) {
            let iconLength = index >= SIX_DISK_COMBO2 - 1 ? MAX_ICONS_LENGTH : ICONS_LENGTH;
            let extraData = originData.getBytesArray(iconLength);
            extraDataList[index] = extraData;
            if (!isFG || isFG && FG_COMBO_WILD.includes(index)) {
              let wildPos = originData.getBytesArray_WithLength();
              wildPosList[index] = wildPos;
            }
          }
          roundModel.setExtraDataList(extraDataList, wildPosList, this.betValue);
        }
      }
      roundModel.calculateFreeSpin();
      return roundModel;
    }
    getTotalOdd() {
      let totalOdd = this.roundModelNG.getTotalOdd();
      for (let index = 0; index < this.roundModelFGList.length; index++) {
        const roundModelFG = this.roundModelFGList[index];
        totalOdd += roundModelFG.getTotalOdd();
      }
      return totalOdd.fixed();
    }
    getTotalScore() {
      let totalScore = this.getTotalOdd() * this.betValue;
      return totalScore.fixed();
    }
  };

  // ../../Communication/NetConst.ts
  var NetConst = class {
    static {
      this.SAVE_BITS_MEGA_STRING = 3;
    }
    static {
      // 傳給server時用於紀錄超大字串長度的位元組數.
      this.SAVE_BITS_STRING = 2;
    }
    static {
      // 傳給server時用於紀錄字串長度的位元組數.
      this.HEADER_SIZE = 3;
    }
    // 封包表頭大小.
  };

  // ../../Communication/ArrayUtil.ts
  var ArrayUtil = class {
    // 
    /**
     * 將陣列轉成正整數. 
     * @param arbtNumber 每個number代表一個byte, 以BigEndian排列.
     * @return number 正整數, 如果發生溢位則傳回0.
     */
    static convertArrayToNumber(arbtNumber) {
      if (!arbtNumber) return 0;
      let iLength = arbtNumber.length;
      let nValue = 0;
      try {
        for (let i = 0; i < iLength; ++i) {
          nValue += arbtNumber[i] << 8 * (iLength - i - 1);
        }
      } catch (error) {
        nValue = 0;
      }
      return nValue;
    }
    /**
     * 將正整數轉成number陣列.
     * @param nValue 要轉換的數字, 須為正整數.
     * @param iDigits 處理幾位數
     * @return number[] 轉換的結果, 陣列大小等於iDigits, 每個number存放一個byte的資料.
     */
    // 
    static convertNumberToArray(nValue, iDigits) {
      if (iDigits <= 0) {
        return null;
      }
      let arbtNumber = [];
      for (let i = 0; i < iDigits; ++i) {
        arbtNumber[i] = nValue >> 8 * (iDigits - i - 1) & 255;
      }
      return arbtNumber;
    }
    /**
     * 將字串的字碼以number陣列的形式傳回. 
     * @param szData 
     * @return number[] 每2個number代表一個utf16的字元. (LittleEndian)
     */
    static convertStringToUtf16Array(szData) {
      let aruiArray = [];
      let iLength = szData.length;
      let iCharCode = 0;
      for (let i = 0; i < iLength; ++i) {
        iCharCode = szData.charCodeAt(i);
        aruiArray[2 * i] = iCharCode & 255;
        aruiArray[2 * i + 1] = iCharCode >> 8 & 255;
      }
      return aruiArray;
    }
    /**
     * 將utf-16陣列轉成字串.
     * @param arbtArray 每2個number代表一個utf16的字元. (LittleEndian)
     * @return string 失敗傳回空字串.
     */
    static convertUtf16ArrayToString(arbtArray) {
      if (null == arbtArray) {
        return "";
      }
      let iLength = arbtArray.length / 2;
      let aruiCharCode = [];
      for (let i = 0; i < iLength; ++i) {
        aruiCharCode[i] = String.fromCharCode(arbtArray[i * 2] + (arbtArray[i * 2 + 1] << 8));
      }
      return aruiCharCode.join("");
    }
    // // 將整數轉成iDigits個byte, 高位元在前.
    // public static numberToBytes(iValue: number, iDigits: number): Uint8Array {
    // 	if (iDigits <= 0) {
    // 		return null;
    // 	}
    // 	let arbtData: Uint8Array = new Uint8Array[iDigits];
    // 	// 傳給server時, 高位元在前.
    // 	for (let i = iDigits - 1; i >= 0; --i) {
    // 		arbtData[i] = iValue & 0xff;
    // 		iValue >>= 8;
    // 	}
    // 	return arbtData;
    // }
    // // 合併兩個byte array.
    // public static merge(arbtData1: Uint8Array, arbtData2: Uint8Array): Uint8Array {
    // 	let iLength1: number = 0;
    // 	let iLength2: number = 0;
    // 	if (arbtData1) {
    // 		iLength1 = arbtData1.length;
    // 	}
    // 	if (arbtData2) {
    // 		iLength2 = arbtData2.length;
    // 	}
    // 	if (0 == (iLength1 + iLength2)) {
    // 		return null;
    // 	}
    // 	let arbtMerge: Uint8Array = new Uint8Array[iLength1 + iLength2];
    // 	if (iLength1 > 0) {
    // 		arbtMerge.set(arbtData1);
    // 	}
    // 	if (iLength2 > 0) {
    // 		arbtMerge.set(arbtData2, iLength1);
    // 	}
    // 	return arbtMerge;
    // }
    // // 複製byte array.
    // public static duplicate(arbtSource: Uint8Array): Uint8Array {
    // 	if (arbtSource) {
    // 		return null;
    // 	}
    // 	let arbtDuplicate: Uint8Array = new Uint8Array[arbtSource.length];
    // 	arbtDuplicate.set(arbtSource);
    // 	return arbtDuplicate;
    // }
    // // 在陣列後端添加一個數字.
    // public static append(arbtData: Uint8Array, btData: number): Uint8Array {
    // 	return ArrayUtil.merge(arbtData, new Uint8Array[(btData)]);
    // }
    // // 在陣列前端插入一個數字.
    // public static insertFirst(btData: number, arbtData: Uint8Array): Uint8Array {
    // 	return ArrayUtil.merge(new Uint8Array[(btData)], arbtData);
    // }
    /**
     * 數字陣列重新排序(小至大)
     * @param array 
     */
    static sortNumAsce(array) {
      array.sort((a, b) => a - b);
    }
    /**
     * 數字陣列重新排序(大至小)
     * @param array 
     */
    static sortNumDesc(array) {
      array.sort((a, b) => b - a);
    }
  };

  // ../../Communication/DictionaryIterator.ts
  var DictionaryIterator = class {
    constructor(dictionary) {
      this.m_dictTarget = null;
      this.m_arIterKey = null;
      this.m_iCurrentIndex = 0;
      this.m_dictTarget = dictionary;
    }
    getFirst() {
      this.m_iCurrentIndex = 0;
      if (null == this.m_dictTarget) {
        return null;
      }
      this.m_arIterKey = this.m_dictTarget.getKeys();
      return this.getNext();
    }
    getNext() {
      if (null == this.m_dictTarget) {
        return null;
      }
      if (this.m_iCurrentIndex >= this.m_arIterKey.length) {
        return null;
      }
      return this.m_dictTarget.get(this.m_arIterKey[this.m_iCurrentIndex++]);
    }
    getCurrentKey() {
      let tmp = this.m_iCurrentIndex - 1;
      return this.m_arIterKey[tmp];
    }
  };

  // ../../Communication/ListIterator.ts
  var ListIterator = class {
    constructor(list) {
      this.m_listTarget = null;
      this.m_iCurrentIndex = 0;
      this.m_listTarget = list;
    }
    getFirst() {
      this.m_iCurrentIndex = 0;
      return this.getNext();
    }
    getNext() {
      if (null === this.m_listTarget) {
        return null;
      }
      if (this.m_iCurrentIndex >= this.m_listTarget.getCount()) {
        return null;
      }
      return this.m_listTarget.get(this.m_iCurrentIndex++);
    }
  };

  // ../../Communication/IteratorFactory.ts
  var IteratorFactory = class {
    /** 
     * 產生List的迭代器.
     */
    static createListIterator(list) {
      return new ListIterator(list);
    }
    /** 
     * 產生Dictionary的迭代器.
     */
    static createDictionaryIterator(dictionary) {
      return new DictionaryIterator(dictionary);
    }
  };

  // ../../Communication/List.ts
  var List = class {
    constructor(array) {
      this.m_arItem = array ? array : [];
    }
    get array() {
      return this.m_arItem;
    }
    get Count() {
      return this.m_arItem ? this.m_arItem.length : 0;
    }
    // 在串列頭新增.
    insert(value) {
      this.m_arItem.unshift(value);
    }
    // 任意地方新增. 不要太常用.
    insertAt(iIndexAt, value) {
      let iTotalCount = this.getCount();
      if (iIndexAt <= 0) {
        this.insert(value);
      } else if (iIndexAt >= iTotalCount) {
        this.add(value);
      } else {
        let arPart1 = this.m_arItem.slice(0, iIndexAt);
        let arPart2 = this.m_arItem.slice(iIndexAt, iTotalCount);
        this.m_arItem = arPart1.concat([value], arPart2);
      }
    }
    // 新增物件.
    add(value) {
      this.m_arItem.push(value);
    }
    // 取出物件, 找不到傳回undefined.
    get(index) {
      if (index < 0 || index >= this.getCount()) {
        return void 0;
      }
      return this.m_arItem[index];
    }
    // 在指定位置設定數值
    set(index, value) {
      this.m_arItem[index] = value;
    }
    // 移除一個項目(第一個遇到的項目).
    remove(value) {
      let iIndex = this.indexOf(value);
      if (iIndex >= 0) {
        this.m_arItem[iIndex] = null;
        this.m_arItem.splice(iIndex, 1);
      }
    }
    // 移除第iIndex個項目.
    removeAt(iIndex) {
      if (iIndex < 0 || iIndex >= this.m_arItem.length) {
        return;
      } else if (iIndex == 0) {
        this.removeFirst();
      } else if (iIndex == this.m_arItem.length - 1) {
        this.removeLast();
      } else {
        this.m_arItem[iIndex] = null;
        this.m_arItem.splice(iIndex, 1);
      }
    }
    /**
     * 移除第一項
     */
    removeFirst() {
      this.m_arItem.shift();
    }
    removeLast() {
      this.m_arItem.pop();
    }
    // 取出數量.
    getCount() {
      return this.m_arItem.length;
    }
    // 反查value在第幾個index.
    indexOf(value) {
      return this.m_arItem.indexOf(value);
    }
    // 清除全部.
    clear() {
      if (this.m_arItem && this.m_arItem.length > 0) {
        let iCount = this.m_arItem.length;
        for (let i = 0; i < iCount; ++i) {
          this.m_arItem[i] = null;
        }
        this.m_arItem = null;
        this.m_arItem = new Array();
      }
    }
    // 取出Iterator.
    getIterator() {
      return IteratorFactory.createListIterator(this);
    }
    // 轉成陣列.
    toArray() {
      let iCount = this.getCount();
      let arDuplicate = Array(iCount);
      for (let i = 0; i < iCount; ++i) {
        arDuplicate[i] = this.m_arItem[i];
      }
      return arDuplicate;
    }
    forEach(callbackfn, thisArg) {
      this.m_arItem.forEach(callbackfn, thisArg);
    }
    contains(value) {
      return this.m_arItem.indexOf(value) < 0 ? false : true;
    }
    copyTo(target) {
      if (target) {
        this.m_arItem.forEach((item) => {
          target.add(item);
        });
      }
      return target;
    }
  };

  // ../../Communication/BinaryBufferWriter.ts
  var DataBinaryBuffer = class {
    constructor(compositor) {
      this.m_Compositor = null;
      this.m_Compositor = compositor;
    }
    getSize() {
      return this.m_Compositor.getSize();
    }
    writeTo(dataView, iOffset) {
      this.m_Compositor.writeTo(dataView, iOffset);
      return this.m_Compositor.getSize();
    }
  };
  var DataByteArray = class {
    constructor(arbtArray) {
      this.m_arbtArray = null;
      this.m_arbtArray = arbtArray;
    }
    getSize() {
      return this.m_arbtArray.length;
    }
    writeTo(dataView, iOffset) {
      let iLength = this.m_arbtArray.length;
      for (let i = 0; i < iLength; ++i) {
        dataView.setUint8(iOffset + i, this.m_arbtArray[i]);
      }
      return this.m_arbtArray.length;
    }
  };
  var DataLittleEndianBytes = class {
    constructor(nValue, iDigits) {
      this.m_nValue = 0;
      this.m_iDigits = 0;
      this.m_nValue = nValue;
      this.m_iDigits = iDigits;
    }
    getSize() {
      return this.m_iDigits;
    }
    writeTo(dataView, iOffset) {
      let iValue = this.m_nValue;
      for (let i = this.m_iDigits - 1; i >= 0; --i) {
        dataView.setUint8(iOffset + this.m_iDigits - i - 1, iValue & 255);
        iValue >>= 8;
      }
      return this.m_iDigits;
    }
  };
  var DataBytes = class {
    constructor(nValue, iDigits) {
      this.m_nValue = 0;
      this.m_iDigits = 0;
      this.m_nValue = nValue;
      this.m_iDigits = iDigits;
    }
    getSize() {
      return this.m_iDigits;
    }
    writeTo(dataView, iOffset) {
      let iValue = this.m_nValue;
      for (let i = this.m_iDigits - 1; i >= 0; --i) {
        dataView.setUint8(iOffset + i, iValue & 255);
        iValue >>= 8;
      }
      return this.m_iDigits;
    }
  };
  var Data8Bytes = class extends DataBytes {
    constructor(iValue, useLittleEndian = true) {
      super(iValue, 8);
      this.m_UseLittleEndian = true;
      this.m_UseLittleEndian = useLittleEndian;
    }
    // float64 . 沒有long型態, 儲存long資料精度會跑掉.
    writeTo(dataView, iOffset) {
      dataView.setFloat64(iOffset, this.m_nValue, this.m_UseLittleEndian);
      return this.m_iDigits;
    }
  };
  var Data4Bytes = class extends DataBytes {
    constructor(iValue) {
      super(iValue, 4);
    }
    writeTo(dataView, iOffset) {
      dataView.setUint32(iOffset, this.m_nValue, false);
      return this.m_iDigits;
    }
  };
  var Data2Bytes = class extends DataBytes {
    constructor(iValue) {
      super(iValue, 2);
    }
    writeTo(dataView, iOffset) {
      dataView.setUint16(iOffset, this.m_nValue, false);
      return this.m_iDigits;
    }
  };
  var DataFloat32 = class extends DataBytes {
    constructor(iValue) {
      super(iValue, 4);
    }
    writeTo(dataView, iOffset) {
      dataView.setFloat32(iOffset, this.m_nValue, false);
      return this.m_iDigits;
    }
  };
  var DataString = class {
    constructor(szValue, bWithLength = true) {
      //private m_utf8: any[] = null;		
      this.m_utf8 = null;
      // 這邊是utf-8字串.
      this.m_bWithLength = true;
      this.m_utf8 = unescape(encodeURI(szValue));
      this.m_bWithLength = bWithLength;
    }
    getSize() {
      return this.m_utf8.length + (this.m_bWithLength ? NetConst.SAVE_BITS_STRING : 0);
    }
    writeTo(dataView, iOffset) {
      let iStringLength = this.m_utf8.length;
      if (this.m_bWithLength) {
        dataView.setUint16(iOffset, iStringLength, false);
        iOffset += NetConst.SAVE_BITS_STRING;
      }
      for (var i = 0; i < iStringLength; i++) {
        dataView.setUint8(iOffset + i, this.m_utf8.charCodeAt(i));
      }
      return this.getSize();
    }
  };
  var DataString_MegaSize = class {
    constructor(szValue, bWithLength = true) {
      //private m_utf8: any[] = null;
      this.m_utf8 = null;
      // 這邊是utf-8字串.
      this.m_bWithLength = true;
      this.m_utf8 = unescape(encodeURI(szValue));
      this.m_bWithLength = bWithLength;
    }
    getSize() {
      return this.m_utf8.length + (this.m_bWithLength ? NetConst.SAVE_BITS_STRING : 0);
    }
    writeTo(dataView, iOffset) {
      let iStringLength = this.m_utf8.length;
      if (this.m_bWithLength) {
        let iValue = iStringLength;
        for (let i2 = NetConst.SAVE_BITS_MEGA_STRING - 1; i2 >= 0; --i2) {
          dataView.setUint8(iOffset + i2, iValue & 255);
          iValue >>= 8;
        }
        iOffset += NetConst.SAVE_BITS_MEGA_STRING;
      }
      for (var i = 0; i < iStringLength; i++) {
        dataView.setUint8(iOffset + i, this.m_utf8.charCodeAt(i));
      }
      return this.getSize();
    }
  };
  var DataString16 = class {
    constructor(szValue, bWithLength = true) {
      this.m_szValue = null;
      this.m_utf16 = null;
      this.m_bWithLength = true;
      this.m_szValue = szValue;
      this.m_utf16 = ArrayUtil.convertStringToUtf16Array(this.m_szValue);
      this.m_bWithLength = bWithLength;
    }
    getSize() {
      return this.m_utf16.length + (this.m_bWithLength ? NetConst.SAVE_BITS_STRING : 0);
    }
    writeTo(dataView, iOffset) {
      let iLength = this.m_utf16.length;
      if (this.m_bWithLength) {
        dataView.setUint16(iOffset, iLength, false);
        iOffset += NetConst.SAVE_BITS_STRING;
      }
      for (var i = 0; i < this.m_utf16.length; i++) {
        dataView.setUint8(iOffset + i, this.m_utf16[i]);
      }
      return this.getSize();
    }
  };
  var DataLong = class {
    constructor(lValue, iDigits) {
      this.m_lValue = null;
      this.m_iDigits = 8;
      this.m_iDigits = !iDigits || iDigits < 0 || iDigits >= this.m_iDigits ? this.m_iDigits : iDigits;
      this.m_lValue = lValue;
    }
    getSize() {
      return this.m_iDigits;
    }
    writeTo(dataView, iOffset) {
      let iValue = null;
      for (let i = this.m_iDigits - 1; i >= 0; --i) {
        iValue = this.m_lValue.shiftRight(8 * i).and(255).toNumber();
        dataView.setUint8(iOffset + i, iValue);
      }
      return this.m_iDigits;
    }
  };
  var DataLongByBig = class {
    constructor(lValue, iDigits) {
      this.m_lValue = null;
      this.m_iDigits = 8;
      this.m_iDigits = !iDigits || iDigits < 0 || iDigits >= this.m_iDigits ? this.m_iDigits : iDigits;
      this.m_lValue = lValue;
    }
    getSize() {
      return this.m_iDigits;
    }
    writeTo(dataView, iOffset) {
      let iValue = null;
      let move = 0;
      for (let i = this.m_iDigits - 1; i >= 0; --i) {
        iValue = this.m_lValue.shiftRight(8 * i).and(255).toNumber();
        dataView.setUint8(iOffset + move, iValue);
        move++;
      }
      return this.m_iDigits;
    }
  };
  var BinaryBufferWriter = class {
    constructor() {
      this.m_listData = new List();
    }
    addString(szValue, bWithLength = true) {
      this.m_listData.add(new DataString(szValue.toString(), bWithLength));
    }
    addString_MegaSize(szValue, bWithLength = true) {
      this.m_listData.add(new DataString_MegaSize(szValue.toString(), bWithLength));
    }
    /**
     * 字串以UTF-16編碼方式轉換成bytes，再寫入Buffer
     * @param szValue 
     * @param bWithLength 是否寫入字串長度
     */
    addString16(szValue, bWithLength = true) {
      this.m_listData.add(new DataString16(szValue.toString(), bWithLength));
    }
    addInt8(btValue) {
      this.m_listData.add(new DataBytes(btValue, 1));
    }
    addInt16(sValue) {
      this.m_listData.add(new Data2Bytes(sValue));
    }
    //寫入little位
    addInt32ByLittle(inValue) {
      this.m_listData.add(new DataLittleEndianBytes(inValue, 4));
    }
    addInt32(iValue) {
      this.m_listData.add(new Data4Bytes(iValue));
    }
    addFloat32(fValue) {
      this.m_listData.add(new DataFloat32(fValue));
    }
    addFloat64(lValue, useLittleEndian = true) {
      this.m_listData.add(new Data8Bytes(lValue, useLittleEndian));
    }
    /** 在指定index插入內容,
     * iDigits: index,
     * iValue: 內容
     */
    addPositiveNumber(iValue, iDigits) {
      this.m_listData.add(new DataBytes(iValue, iDigits));
    }
    addLong(lValue) {
      this.m_listData.add(new DataLong(lValue));
    }
    addLongByBig(lValue) {
      this.m_listData.add(new DataLongByBig(lValue));
    }
    addPositiveLong(lValue, iDigits) {
      this.m_listData.add(new DataLong(lValue, iDigits));
    }
    // 加入byte array (每個number代表一個byte).
    addByteNumberArray(arbtArray) {
      this.m_listData.add(new DataByteArray(arbtArray));
    }
    // 平常不會用.
    addPositiveNumberLittleEndian(iValue, iDigits) {
      this.m_listData.add(new DataLittleEndianBytes(iValue, iDigits));
    }
    insertBufferWriter(target) {
      this.m_listData.insert(new DataBinaryBuffer(target));
    }
    insertInt8(btValue) {
      this.m_listData.insert(new DataBytes(btValue, 1));
    }
    insertInt16(sValue) {
      this.m_listData.insert(new Data2Bytes(sValue));
    }
    insertInt32(iValue) {
      this.m_listData.insert(new Data4Bytes(iValue));
    }
    insertNumber(iValue, iDigits) {
      this.m_listData.insert(new DataBytes(iValue, iDigits));
    }
    insertFloat64(lValue, useLittleEndian = true) {
      this.m_listData.insert(new Data8Bytes(lValue, useLittleEndian));
    }
    addBufferWriter(target) {
      this.m_listData.add(new DataBinaryBuffer(target));
    }
    toArrayBuffer() {
      let iBufferSize = this.getSize();
      let arrayBuffer = new ArrayBuffer(iBufferSize);
      let dataView = new DataView(arrayBuffer, 0);
      let iter = IteratorFactory.createListIterator(this.m_listData);
      let data = iter.getFirst();
      let iOffset = 0;
      while (data) {
        iOffset += data.writeTo(dataView, iOffset);
        data = iter.getNext();
      }
      return arrayBuffer;
    }
    /**
     * 轉成ArrayBuffer, 並在前面加上3 bytes封包大小資訊.
     */
    toArrayBufferWithSize() {
      let iPacketSize = this.getSize();
      let iBufferSize = iPacketSize + NetConst.HEADER_SIZE;
      let arrayBuffer = new ArrayBuffer(iBufferSize);
      let dataView = new DataView(arrayBuffer, 0);
      let iter = IteratorFactory.createListIterator(this.m_listData);
      let data = iter.getFirst();
      let iOffset = 0;
      let headerData = new DataBytes(iPacketSize, NetConst.HEADER_SIZE);
      iOffset += headerData.writeTo(dataView, iOffset);
      while (data) {
        iOffset += data.writeTo(dataView, iOffset);
        data = iter.getNext();
      }
      return arrayBuffer;
    }
    getSize() {
      let iter = this.m_listData.getIterator();
      let data = iter.getFirst();
      let iSize = 0;
      while (data) {
        iSize += data.getSize();
        data = iter.getNext();
      }
      return iSize;
    }
    writeTo(dataView, iOffset) {
      let iter = this.m_listData.getIterator();
      let data = iter.getFirst();
      while (data) {
        iOffset += data.writeTo(dataView, iOffset);
        data = iter.getNext();
      }
    }
  };

  // ../../Communication/BinaryBuffer.ts
  var BinaryBuffer = class _BinaryBuffer {
    constructor(buffer) {
      this.USE_LITTLE_ENDIAN = false;
      this.m_Buffer = null;
      this.m_DataView = null;
      this.m_nReadIndex = 0;
      this.m_Buffer = buffer;
      this.m_DataView = new DataView(this.m_Buffer);
      this.m_nReadIndex = 0;
    }
    ReadLittleEndianLong(arg0) {
      return this.getPositiveLong(arg0)[1];
    }
    ReadAttachedLengthString() {
      return this.getString()[1];
    }
    getArrayBuffer() {
      return this.m_Buffer;
    }
    getReadIndex() {
      return this.m_nReadIndex;
    }
    hasUnreadData() {
      if (this.m_nReadIndex >= this.m_Buffer.byteLength) {
        return false;
      }
      return true;
    }
    getCurrentReadPos() {
      return this.m_nReadIndex;
    }
    setReadPosition(iReadPos) {
      this.m_nReadIndex = iReadPos;
      if (this.m_nReadIndex < 0) {
        this.m_nReadIndex = 0;
      } else {
        let iTotalLength = this.getCount();
        if (this.m_nReadIndex > iTotalLength) {
          this.m_nReadIndex = iTotalLength;
        }
      }
    }
    /**
     * 跳過幾個位元組.
     * @param iBytes 
     */
    skipBytes(iLength) {
      if (iLength <= 0) {
        return;
      }
      this.m_nReadIndex += iLength;
      let iTotalLength = this.getCount();
      if (this.m_nReadIndex > iTotalLength) {
        this.m_nReadIndex = iTotalLength;
      }
    }
    /**
     * 取出某範圍的bytes, 不會影響讀取位置.
     * @param iStartPos 起始讀取位置.
     * @param iLength 讀取bytes數.
     * @return BinaryBuffer  取出來的資料放進新的BinaryBuffer, 失敗傳回null.
     */
    getBytesRanged(iStartPos, iLength) {
      if (iStartPos < 0 || iLength <= 0) {
        return null;
      }
      if (iStartPos + iLength > this.getCount()) {
        return null;
      }
      let dataView = new _BinaryBuffer(this.m_Buffer.slice(iStartPos, iStartPos + iLength));
      return dataView;
    }
    /**
     * 取出某範圍的資料組合成整數(BigEndian), 不會影響讀取位置.
     * @param iStartPos 起始讀取位置.
     * @param iLength 讀取bytes數.
     * @return number  取出來的資料, 失敗傳回0.
     */
    getNumberRanged(iStartPos, iLength) {
      if (iStartPos < 0 || iLength <= 0) {
        return 0;
      }
      if (iStartPos + iLength > this.getCount()) {
        return 0;
      }
      let nNumber = 0;
      let arbtNumber = [];
      for (let i = 0; i < iLength; ++i) {
        arbtNumber[i] = this.m_DataView.getUint8(iStartPos + i);
      }
      nNumber = ArrayUtil.convertArrayToNumber(arbtNumber);
      return nNumber;
    }
    /**
     * 取出bytes.
     * @param iLength 取出的bytes數, 如果超過範圍或者傳入-1, 則會取出剩下所有資料.
     * @return BinaryBuffer  取出來的資料放進新的BinaryBuffer.
     */
    getBytes(iLength) {
      if (iLength < 0 || iLength > this.getUnreadCount()) {
        iLength = this.getUnreadCount();
      }
      let dataView = new _BinaryBuffer(this.m_Buffer.slice(this.m_nReadIndex, this.m_nReadIndex + iLength));
      this.m_nReadIndex += iLength;
      return dataView;
    }
    // 取bytes array 含長度  等於 先取一個長度 在往後取該長度的陣列
    // 例如  [3, 15, 27, 12, 8 ....] => [15, 27 , 12] 
    getBytesArray_WithLength() {
      let byteResult = this.getByte();
      if (byteResult[0]) {
        let len = byteResult[1];
        let result = this.getBytesArray(len);
        return result;
      }
      return null;
    }
    getBytesArray(iLength) {
      let binaryBuffer = this.getBytes(iLength);
      let result = [];
      for (let i = 0; i < iLength; i++) {
        let byte = binaryBuffer.getByte();
        if (byte[0] === true) {
          result.push(byte[1]);
        } else {
          console.error(`getBytesArray \u89E3\u6790${i}\u6642\u9577\u5EA6\u4E0D\u8DB3\uFF0C\u51FA\u73FE\u932F\u8AA4`);
          result.push(0);
        }
      }
      return result;
    }
    getBytesArrayAll() {
      const iLength = this.m_Buffer.byteLength;
      let binaryBuffer = this.getBytes(iLength);
      let result = [];
      for (let i = 0; i < iLength; i++) {
        let byte = binaryBuffer.getByte();
        if (byte[0] === true) {
          result.push(byte[1]);
        } else {
          break;
        }
      }
      return result;
    }
    UnzipByteArray(bytes) {
      let result = [];
      for (let item of bytes) {
        let strHex = item.toString(16).padStart(2, "0");
        result.push(parseInt(strHex[1], 16));
        result.push(parseInt(strHex[0], 16));
      }
      return result;
    }
    getBytesArrayAndUnzip(iLength) {
      let bytes = this.getBytesArray(iLength);
      let result = this.UnzipByteArray(bytes);
      return result;
    }
    /**
     * 取出字串, 前3bytes紀錄長度.
     */
    getString_MegaSize() {
      let ret = this.getPositiveNumber(NetConst.SAVE_BITS_MEGA_STRING);
      if (!ret[0]) {
        return [false, null];
      }
      let szRet = this.getString_WithLength(ret[1]);
      return [null != szRet, szRet];
    }
    /**
     * 取出字串, 前2bytes紀錄長度.
     */
    getString() {
      let ret = this.getPositiveNumber(NetConst.SAVE_BITS_STRING);
      if (!ret[0]) {
        return [false, null];
      }
      let szRet = this.getString_WithLength(ret[1]);
      return [null != szRet, szRet];
    }
    getByte() {
      let binaryBuffer = this.getBytes(1);
      var byteArray = new Uint8Array(binaryBuffer.getArrayBuffer());
      let success = false;
      if (Number.isInteger(byteArray?.[0])) {
        success = true;
      }
      return [success, byteArray?.[0]];
    }
    /**
     * 取出字串, 自帶長度.
     * @param iLength 字串bytes數.
     * @return string 字串, 找不到傳回null.
     */
    getString_WithLength(iLength) {
      let szRet = null;
      if (this.getUnreadCount() >= iLength) {
        let buffer = this.m_Buffer.slice(this.m_nReadIndex, this.m_nReadIndex + iLength);
        if (buffer) {
          this.m_nReadIndex += iLength;
          let view = new DataView(buffer);
          let arbtNumber = [];
          for (let i = 0; i < iLength; ++i) {
            arbtNumber[i] = view.getUint8(i);
          }
          szRet = ArrayUtil.convertUtf16ArrayToString(arbtNumber);
        }
      }
      return szRet;
    }
    mergeFrom(dataView) {
      if (null == dataView || null == this.m_DataView) {
        return;
      }
      let iLength1 = this.m_DataView.byteLength;
      let iLength2 = dataView.getCount();
      if (0 == iLength2) {
        return;
      }
      let mergedBuffer = new Uint8Array(iLength1 + iLength2);
      let firstBuffer = new Uint8Array(this.m_DataView.buffer);
      let secondBuffer = new Uint8Array(dataView.m_Buffer);
      if (iLength1 > 0) {
        mergedBuffer.set(firstBuffer);
      }
      if (iLength2 > 0) {
        mergedBuffer.set(secondBuffer);
      }
      this.m_Buffer = mergedBuffer.buffer;
      this.m_DataView = new DataView(this.m_Buffer);
    }
    getPositiveNumber(iDigits) {
      if (iDigits <= 0 || iDigits > 8 || this.getUnreadCount() < iDigits) {
        return [false, 0];
      }
      let iValue = 0;
      let bSucceed = true;
      try {
        for (let i = 0; i < iDigits; ++i) {
          iValue += this.m_DataView.getUint8(this.m_nReadIndex + i) << 8 * (iDigits - i - 1);
        }
        this.m_nReadIndex += iDigits;
      } catch (error) {
        bSucceed = false;
        iValue = 0;
      }
      return [bSucceed, iValue];
    }
    // 平常不會用.
    getPositiveNumberLittleEndian(iDigits) {
      if (iDigits <= 0 || iDigits > 8 || this.getUnreadCount() < iDigits) {
        return [false, 0];
      }
      let iValue = 0;
      let bSucceed = true;
      try {
        for (let i = 0; i < iDigits; ++i) {
          iValue += this.m_DataView.getUint8(this.m_nReadIndex + i) << 8 * i;
        }
        this.m_nReadIndex += iDigits;
      } catch (error) {
        bSucceed = false;
        iValue = 0;
      }
      return [bSucceed, iValue];
    }
    getSingle(useLittleEndian = true) {
      let [boolean, num] = this.getFloat32(useLittleEndian);
      return [boolean, boolean ? new Decimal(num) : null];
    }
    getFloat32(useLittleEndian = true) {
      if (this.getUnreadCount() < 4) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getFloat32(this.m_nReadIndex, useLittleEndian);
        this.m_nReadIndex += 4;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getFloat64(useLittleEndian = true) {
      if (this.getUnreadCount() < 8) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getFloat64(this.m_nReadIndex, useLittleEndian);
        this.m_nReadIndex += 8;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getInt8() {
      if (this.getUnreadCount() < 1) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getInt8(this.m_nReadIndex);
        this.m_nReadIndex += 1;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getInt16() {
      if (this.getUnreadCount() < 2) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getInt16(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
        this.m_nReadIndex += 2;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getInt32() {
      if (this.getUnreadCount() < 4) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getInt32(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
        this.m_nReadIndex += 4;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getUint8() {
      if (this.getUnreadCount() < 1) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getUint8(this.m_nReadIndex);
        this.m_nReadIndex += 1;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    /**
     * 取出一個unit8的數值, 但不改變已讀位置.
     */
    peekUint8() {
      if (this.getUnreadCount() < 1) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getUint8(this.m_nReadIndex);
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getUint16() {
      if (this.getUnreadCount() < 2) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getUint16(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
        this.m_nReadIndex += 2;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getUint32() {
      if (this.getUnreadCount() < 4) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getUint32(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
        this.m_nReadIndex += 4;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getUint32ByBig() {
      if (this.getUnreadCount() < 4) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        fValue = this.m_DataView.getUint32(this.m_nReadIndex, false);
        this.m_nReadIndex += 4;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    getLong(bUnsigned = false) {
      return this.getPositiveLong(8, bUnsigned);
    }
    getPositiveLongByBig(iDigits, bUnsigned = true) {
      if (this.getUnreadCount() < iDigits || iDigits < 0 || iDigits > 8) {
        return [false, dcodeIO.Long.ZERO];
      }
      let bSucceed = true;
      let lValue = dcodeIO.Long.fromNumber(0, bUnsigned);
      try {
        for (let i = iDigits - 1; i >= 0; i--) {
          lValue = lValue.add(dcodeIO.Long.fromNumber(this.m_DataView.getUint8(this.m_nReadIndex)).shiftLeft(8 * i));
          this.m_nReadIndex++;
        }
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, lValue];
    }
    getPositiveLong(iDigits, bUnsigned = true) {
      if (this.getUnreadCount() < iDigits || iDigits < 0 || iDigits > 8) {
        return [false, dcodeIO.Long.ZERO];
      }
      let bSucceed = true;
      let lValue = dcodeIO.Long.fromNumber(0, bUnsigned);
      try {
        for (let i = 0; i < iDigits; ++i) {
          lValue = lValue.add(dcodeIO.Long.fromNumber(this.m_DataView.getUint8(this.m_nReadIndex + i)).shiftLeft(8 * i));
        }
        this.m_nReadIndex += iDigits;
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, lValue];
    }
    getCount() {
      if (!this.m_DataView) {
        return 0;
      }
      return this.m_DataView.byteLength;
    }
    getUnreadCount() {
      return this.m_Buffer.byteLength - this.m_nReadIndex;
    }
    /**
     * 讀取剩於資料轉成int
     */
    getUnreadUint8Array() {
      let dataInt8Array = [];
      if (this.getUnreadCount() <= 0) {
        return [false, null];
      }
      let bSucceed = true;
      try {
        while (this.getUnreadCount() > 0) {
          dataInt8Array.push(this.m_DataView.getUint8(this.m_nReadIndex));
          this.m_nReadIndex += 1;
        }
      } catch (error) {
        bSucceed = false;
      }
      return [true, new Uint8Array(dataInt8Array)];
    }
    //add by humbert
    getUInt24() {
      if (this.getUnreadCount() < 3) {
        return [false, 0];
      }
      let fValue = 0;
      let bSucceed = true;
      try {
        for (let i = 2; i >= 0; i--) {
          fValue += this.m_DataView.getUint8(this.m_nReadIndex) * Math.pow(256, i);
          this.m_nReadIndex++;
        }
      } catch (error) {
        bSucceed = false;
      }
      return [bSucceed, fValue];
    }
    /**
     *  utf-8陣列轉成字串(Javascript應該是utf-16).
     */
    fromUTF8Array(buffer) {
      var str = "", i;
      let iCount = buffer.byteLength;
      let dataView = new DataView(buffer);
      for (i = 0; i < iCount; i++) {
        var value = dataView.getUint8(i);
        if (value < 128) {
          str += String.fromCharCode(value);
        } else if (value > 191 && value < 224) {
          str += String.fromCharCode((value & 31) << 6 | dataView.getUint8(i + 1) & 63);
          i += 1;
        } else if (value > 223 && value < 240) {
          str += String.fromCharCode((value & 15) << 12 | (dataView.getUint8(i + 1) & 63) << 6 | dataView.getUint8(i + 2) & 63);
          i += 2;
        } else {
          var charCode = ((value & 7) << 18 | (dataView.getUint8(i + 1) & 63) << 12 | (dataView.getUint8(i + 2) & 63) << 6 | dataView.getUint8(i + 3) & 63) - 65536;
          str += String.fromCharCode(charCode >> 10 | 55296, charCode & 1023 | 56320);
          i += 3;
        }
      }
      return str.toString();
    }
    static fromInt8Array(data) {
      let buffer = new ArrayBuffer(data.length);
      let view = new Int8Array(buffer);
      for (let i = 0, n = data.length; i < n; i++) {
        view.fill(data[i], i);
      }
      return new _BinaryBuffer(view.buffer);
    }
    toString() {
      let szText = "";
      let nOldReadPos = this.getCurrentReadPos();
      this.setReadPosition(0);
      for (let i = 0; i < this.getCount(); i++) {
        szText = szText + this.getUint8()[1].toString() + ", ";
      }
      this.setReadPosition(nOldReadPos);
      return szText;
    }
    //模擬Unity的BytesReader
    ReadAttatchedLengthBytes() {
      let length = this.getUint16()[1];
      let arrTemp = [];
      for (let i = 0; i < length; i++) {
        arrTemp.push(this.getUint8()[1]);
      }
      return this.GetBinaryBuffer(arrTemp);
    }
    ReadBool() {
      return this.getUint8()[1] ? true : false;
    }
    readUnsignedByte() {
      return this.getUint8()[1];
    }
    ReadByte() {
      return this.getUint8()[1];
    }
    ReadBigEndianUShort() {
      return this.getUint16()[1];
    }
    ReadBigEndianULong(num) {
      return this.getPositiveLongByBig(num)[1];
    }
    ReadLittleEndianULong(num) {
      if (num = 8)
        return this.getLong(true)[1];
      else
        window.alert("ReadLittleEndianULong:\u7121\u6B64\u65B9\u6CD5");
    }
    ReadBigEndianUInt(num) {
      return this.getPositiveLongByBig(num)[1].toNumber();
    }
    readInt() {
      return this.getInt32()[1];
    }
    set Position(value) {
      this.setReadPosition(value);
    }
    get Position() {
      return this.getCurrentReadPos();
    }
    GetBinaryBuffer(arrTemp) {
      let binaryBufferWriter = new BinaryBufferWriter();
      binaryBufferWriter.addByteNumberArray(arrTemp);
      let arrayBuffer = binaryBufferWriter.toArrayBuffer();
      let data = new _BinaryBuffer(arrayBuffer);
      return data;
    }
    static GetBinaryBuffer(arrTemp) {
      let binaryBufferWriter = new BinaryBufferWriter();
      binaryBufferWriter.addByteNumberArray(arrTemp);
      let arrayBuffer = binaryBufferWriter.toArrayBuffer();
      let data = new _BinaryBuffer(arrayBuffer);
      return data;
    }
  };

  // ../Utility/PacketHandle.ts
  function base64ToArrayBuffer(base64) {
    var binaryString = window.atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  function base64ToBinaryBuffer(base64) {
    let binaryBuffer = new BinaryBuffer(base64ToArrayBuffer(base64));
    return binaryBuffer;
  }

  // entry.ts
  Array.prototype.count = function(value) {
    return this.filter((x) => x == value).length;
  };
  Array.prototype.countOccurrencesOfArray = function(arr) {
    return arr.reduce((count, elem) => {
      return count + this.filter((x) => x === elem).length;
    }, 0);
  };
  Array.prototype.indexesOf = function(value) {
    var positions = this.map(function(e, i) {
      return e === value ? i : -1;
    }).filter(function(e) {
      return e !== -1;
    });
    return positions;
  };
  Array.prototype.set = function() {
    let set = new Set(this);
    let arr = Array.from(set);
    return arr;
  };
  Array.prototype.setSelf = function() {
    let uniqueValues = Array.from(new Set(this));
    this.length = 0;
    this.push(...uniqueValues);
    return this;
  };
  Array.prototype.remove = function(value) {
    const index = this.indexOf(value);
    if (index > -1) {
      this.splice(index, 1);
    }
    return this;
  };
  Array.prototype.getRandomElement = function() {
    let len = this.length;
    let index = Math.floor(Math.random() * len);
    return this[index];
  };
  Number.prototype.fixed = function() {
    return parseFloat(this.toFixed(4));
  };
  Number.prototype.readByte = function(start, length) {
    let byte = this.valueOf();
    if (byte < 0 || byte > 255) {
      console.error("Number out of range");
      return byte;
    }
    let mask = (1 << length) - 1;
    return byte >> 8 - start - length & mask;
  };
  function checkScore(base64Str) {
    let binaryBuffer = base64ToBinaryBuffer(base64Str);
    let slotInfo = new SlotInfo055(binaryBuffer, 100);
    let odd = slotInfo.getTotalOdd();
    return odd;
  }
  return __toCommonJS(entry_exports);
})();

function checkScore(base64Str) {

  return MyLib.checkScore(base64Str);

}