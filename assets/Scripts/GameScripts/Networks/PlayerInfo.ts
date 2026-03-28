import { IHistory } from "../../NetAgent/AgentDefine";
import { CCommandStatus } from "../../NetAgent/CConnectManager/CConnectDefine";
import { NetAgent } from "../../NetAgent/NetAgent";
import SpinAck from "../../NetAgent/SpinAck";
import { HistoryItemInfo } from "./HistoryItemInfo";

export class PlayerInfo {
    static _userName: string = '';
    static _balance: number = 0;
    static _betMax: number = 10000;
    static _betMin: number = 100;
    static _betValueList: number[] = [];
    static _machineID: number = null;
    static _historyItemInfos: HistoryItemInfo[] = null;
    static _buyFG: number = 0;
    static _lastPlant: Uint8Array = null;
    static _record: Uint8Array = null;
    static _JP: number[] = [];
    static _lastHistory: string[] = [];
    static _result: CCommandStatus = null;

    static get userName(): string {
        return PlayerInfo._userName;
    }

    static set userName(value: string) {
        PlayerInfo._userName = value;
    }

    static get balance(): number {
        return PlayerInfo._balance;
    }

    static set balance(value: number) {
        PlayerInfo._balance = value;
    }

    static get betMax(): number {
        return PlayerInfo._betMax;
    }

    static set betMax(value: number) {
        PlayerInfo._betMax = value;
    }

    static get betMin(): number {
        return PlayerInfo._betMin;
    }

    static set betMin(value: number) {
        PlayerInfo._betMin = value;
    }

    static get machineID(): number {
        return PlayerInfo._machineID;
    }

    static set machineID(value: number) {
        PlayerInfo._machineID = value;
    }

    static set buyFG(value: number) {
        PlayerInfo._buyFG = value;
    }

    static get buyFG(): number {
        return PlayerInfo._buyFG;
    }

    static get lastPlant(): Uint8Array {
        return PlayerInfo._lastPlant;
    }

    static set lastPlant(value: Uint8Array) {
        PlayerInfo._lastPlant = value;
    }

    static get record(): Uint8Array {
        return PlayerInfo._record;
    }

    static set record(value: Uint8Array) {
        PlayerInfo._record = value;
    }

    static get JP(): number[] {
        return PlayerInfo._JP;
    }

    static set JP(value: number[]) {
        PlayerInfo._JP = value;
    }

    static get betValueList(): number[] {
        return PlayerInfo._betValueList;
    }

    static get lastHistory(): string[] {
        return PlayerInfo._lastHistory;
    }

    static set lastHistory(value: string[]) {
        PlayerInfo._lastHistory = value;
    }

    static get result(): CCommandStatus {
        return PlayerInfo._result;
    }

    static set result(value: CCommandStatus) {
        PlayerInfo._result = value;
    }


    static updateBetValueList(totalBetValueList: number[]) {
        PlayerInfo._betValueList = [];
        for (let value of totalBetValueList) {
            if (value >= PlayerInfo._betMin && value <= PlayerInfo._betMax) {
                PlayerInfo._betValueList.push(value);
            }
        }
    }

    static updateHistoryItemInfos(historyItem: HistoryItemInfo) {
        if (!PlayerInfo._historyItemInfos) {
            PlayerInfo._historyItemInfos = [];
        }
        if (PlayerInfo._historyItemInfos.length >= 100) {
            PlayerInfo._historyItemInfos = PlayerInfo._historyItemInfos.slice(0, 99);
        }
        PlayerInfo._historyItemInfos.unshift(historyItem);
    }

    static insertHistory(spinResponse: SpinAck) {
        NetAgent.GetInstance().insertHistory(spinResponse);
    }

    static getHistoryJson(gameID: string): string {
        PlayerInfo._historyItemInfos = NetAgent.GetInstance().CurrentHistoryData.map((item: IHistory) => {
            let historyItemInfoItem = new HistoryItemInfo();
            historyItemInfoItem.gameCode = gameID.toLowerCase();
            historyItemInfoItem.date = item.Time;
            historyItemInfoItem.bet = item.Bet;
            historyItemInfoItem.winScore = item.Win;
            historyItemInfoItem.betID = item.編號;
            historyItemInfoItem.slotData = item.盤面演繹;
            historyItemInfoItem.playerId = item.暱稱;
            historyItemInfoItem.beforeTotal = item.異動前;
            historyItemInfoItem.afterTotal = item.異動後;
            historyItemInfoItem.featureRatio = item.扣幣倍;
            historyItemInfoItem.version = '';
            return historyItemInfoItem;
        });

        let result =
        {
            gamecode: gameID.toLowerCase(),
            history: PlayerInfo._historyItemInfos.map((item) => {
                return {
                    gamecode: item.gameCode,
                    slotdata: item.slotData,
                    id: item.betID,
                    time: item.date.toString(),
                    version: item.version,
                    bet: item.bet,
                    win: item.winScore,
                    before_total: item.beforeTotal,
                    total: item.afterTotal,
                    account: item.playerId,
                    featureRatio: item.featureRatio,
                }
            })
        }

        return JSON.stringify(result);
    }
}

