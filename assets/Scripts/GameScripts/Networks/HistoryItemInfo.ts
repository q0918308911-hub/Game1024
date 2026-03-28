import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

export class HistoryItemInfo {
    public gameCode: string = '';
    public date: number = 0;
    public bet: number = 0;
    public winScore: number = 0;
    public betID: string = '';
    public slotData: string = '';
    public playerId: string = '';
    public version: string = '';
    public beforeTotal: number = 0;
    public afterTotal: number = 0;
    public featureRatio: number = 0;
}


