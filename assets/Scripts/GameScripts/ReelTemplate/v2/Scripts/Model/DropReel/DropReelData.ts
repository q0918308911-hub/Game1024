import { _decorator, CCFloat, RealCurve } from 'cc';
import { ReelDataBase } from '../ReelDataBase';
const { ccclass, property } = _decorator;

/**
 * 滾輪掉落狀態分為：
 * DROP_IN：由上方掉落進入盤面
 * DROP_OUT：由盤面掉落離開
 * FILL：保持在盤面上，因消除而往下掉落的狀態
 */
export enum DropState {
    DROP_IN,
    DROP_OUT,
    FILL
}

export enum DropMode {
    IDLE,
    STOP,
    TURBO,
    READY_HAND
}

@ccclass('DropReelData')
export class DropReelData extends ReelDataBase {

    @property({ type: CCFloat, visible: true, tooltip: "一個Icon完整掉落的時間", group: "Idle" })
    protected _dropDuration: number = 0.5;

    public get dropDuration(): number {
        return this._dropDuration;
    }

    public set dropDuration(duration: number) {
        this._dropDuration = duration;
    }

    @property({ type: CCFloat, visible: true, tooltip: "Icon之間,掉落的間隔時間", group: "Idle" })
    protected _dropSpacingTime: number = 0.2;

    public get dropSpacingTime(): number {
        return this._dropSpacingTime;
    }

    public set dropSpacingTime(time: number) {
        this._dropSpacingTime = time;
    }

    @property({ type: CCFloat, visible: true, tooltip: "按下停止後,一個Icon完整掉落的時間", group: "Stop" })
    protected _stopDropDuration: number = 0;

    public get stopDropDuration(): number {
        return this._stopDropDuration;
    }

    public set stopDropDuration(duration: number) {
        this._stopDropDuration = duration;
    }

    @property({ type: CCFloat, visible: true, tooltip: "按下停止後,Icon之間,掉落的間隔時間", group: "Stop" })
    protected _stopDropSpacingTime: number = 0;

    public get stopDropSpacingTime(): number {
        return this._stopDropSpacingTime;
    }

    public set stopDropSpacingTime(time: number) {
        this._stopDropSpacingTime = time;
    }


    @property({ type: CCFloat, visible: true, tooltip: "Turbo模式下,一個Icon完整掉落的時間", group: "Turbo" })
    protected _turboDropDuration: number = 0;

    public get turboDropDuration(): number {
        return this._turboDropDuration;
    }

    public set turboDropDuration(duration: number) {
        this._turboDropDuration = duration;
    }

    @property({ type: CCFloat, visible: true, tooltip: "Turbo模式下,Icon之間掉落的間隔時間", group: "Turbo" })
    protected _turboDropSpacingTime: number = 0;

    public get turboDropSpacingTime(): number {
        return this._turboDropSpacingTime;
    }

    public set turboDropSpacingTime(time: number) {
        this._turboDropSpacingTime = time;
    }

    @property({ type: CCFloat, visible: true, tooltip: "ReadyHand模式下,一個Icon完整掉落的時間", group: "ReadyHand" })
    protected _readyHandDropDuration: number = 0;

    public get readyHandDropDuration(): number {
        return this._readyHandDropDuration;
    }

    public set readyHandDropDuration(duration: number) {
        this._readyHandDropDuration = duration;
    }

    @property({ type: CCFloat, visible: true, tooltip: "ReadyHand模式下,Icon之間掉落的間隔時間", group: "ReadyHand" })
    protected _readyHandDropSpacingTime: number = 0;

    public get readyHandDropSpacingTime(): number {
        return this._readyHandDropSpacingTime;
    }

    public set readyHandDropSpacingTime(time: number) {
        this._readyHandDropSpacingTime = time;
    }

    @property({ visible: true, tooltip: "是否使用預設DropIn曲線" })
    protected _autoDropInCurve: boolean = false;

    public get autoDropInCurve(): boolean {
        return this._autoDropInCurve;
    }

    public set autoDropInCurve(value: boolean) {
        this._autoDropInCurve = value;
    }

    @property({ type: RealCurve, visible() { return !(this as DropReelData)._autoDropInCurve } })
    protected _inCurve: RealCurve = new RealCurve();

    public get inCurve(): RealCurve {
        return this._inCurve;
    }

    public set inCurve(curve: RealCurve) {
        this._inCurve = curve;
    }

    @property({ visible: true, tooltip: "是否使用預設DropOut曲線" })
    protected _autoDropOutCurve: boolean = false;

    public get autoDropOutCurve(): boolean {
        return this._autoDropOutCurve;
    }

    public set autoDropOutCurve(value: boolean) {
        this._autoDropOutCurve = value;
    }

    @property({ type: RealCurve, visible() { return !(this as DropReelData)._autoDropOutCurve } })
    protected _outCurve: RealCurve = new RealCurve();

    public get outCurve(): RealCurve {
        return this._outCurve;
    }

    public set outCurve(curve: RealCurve) {
        this._outCurve = curve;
    }

    @property({ visible: true, tooltip: "是否使用預設Fill曲線" })
    protected _autoFillCurve: boolean = false;

    public get autoFillCurve(): boolean {
        return this._autoFillCurve;
    }

    public set autoFillCurve(value: boolean) {
        this._autoFillCurve = value;
    }

    @property({ type: RealCurve, visible() { return !(this as DropReelData)._autoFillCurve } })
    protected _fillCurve: RealCurve = new RealCurve();

    public get fillCurve(): RealCurve {
        return this._fillCurve;
    }

    public set fillCurve(curve: RealCurve) {
        this._fillCurve = curve;
    }

}


