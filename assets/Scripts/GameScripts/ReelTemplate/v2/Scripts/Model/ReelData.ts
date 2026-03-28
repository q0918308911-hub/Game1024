import { _decorator, CCFloat, CCString, easing, Enum, Prefab, RealCurve, TweenEasing } from 'cc';
import { ReelDataBase } from './ReelDataBase';
const { ccclass, property } = _decorator;

/**
 * 一局的狀態
 */
export enum ReelRoundState {
    /**尚未初始化 */
    Unknown,
    /**初始化完成 */
    Init,
    FirstRoll,
    Rolling,
    FinalRoll,
    RollEnd,
}

export enum ReelEvent {
    Init,
    Start,
    Update,
    End,
}

/**
 * 滾一輪的狀態
 */
export enum ReelState {
    Unknown,
    Idle,
    Rolling,
}

/**
 * TweenEasing的類型 可以參考PublicReel\Example\Arts\Atlases\TweenEasing.png
 */
export enum TweenEasingType {
    linear,
    smooth,
    fade,
    constant,
    quadIn,
    quadOut,
    quadInOut,
    quadOutIn,
    cubicIn,
    cubicOut,
    cubicInOut,
    cubicOutIn,
    quartIn,
    quartOut,
    quartInOut,
    quartOutIn,
    quintIn,
    quintOut,
    quintInOut,
    quintOutIn,
    sineIn,
    sineOut,
    sineInOut,
    sineOutIn,
    expoIn,
    expoOut,
    expoInOut,
    expoOutIn,
    circIn,
    circOut,
    circInOut,
    circOutIn,
    elasticIn,
    elasticOut,
    elasticInOut,
    elasticOutIn,
    backIn,
    backOut,
    backInOut,
    backOutIn,
    bounceIn,
    bounceOut,
    bounceInOut,
    bounceOutIn,
}


@ccclass('ReelData')
export class ReelData extends ReelDataBase {

    @property({ type: CCFloat, visible: true, tooltip: '滾輪速度，基準值為8' })
    protected _rollSpeed: number = 8;

    @property({ tooltip: '是否啟用最開始的回拉效果', visible: true, group: 'StartPull' })
    protected _startPull: boolean = false;

    @property({ type: RealCurve, visible() { return (this as ReelData)._startPull; }, group: 'StartPull' })
    protected _startCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, visible() { return (this as ReelData)._startPull; }, tooltip: '在startCurve拉條開始停滯的時間，配合滾動速度', group: 'StartPull' })
    protected _startPullTime: number = 0.3;

    @property({ tooltip: '是否啟用結束的回彈效果', visible: true, group: 'EndBounce' })
    protected _endBounce: boolean = false;

    @property({ type: Enum(TweenEasingType), visible() { return (this as ReelData)._endBounce; }, tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png', group: 'EndBounce' })
    protected _downBounceEasing: TweenEasingType = TweenEasingType.cubicOut;

    @property({ type: CCFloat, visible() { return (this as ReelData)._endBounce; }, tooltip: '回彈掉落的時間', group: 'EndBounce' })
    protected _downBounceDuration: number = 0.2;

    @property({ type: Enum(TweenEasingType), visible() { return (this as ReelData)._endBounce; }, tooltip: '回彈上升的easing，可以參考PublicReel\\Example\\Arts\\Atlases\\TweenEasing.png', group: 'EndBounce' })
    protected _upBounceEasing: TweenEasingType = TweenEasingType.linear;

    @property({ type: CCFloat, visible() { return (this as ReelData)._endBounce; }, tooltip: '回彈上升的時間', group: 'EndBounce' })
    protected _upBounceDuration: number = 0.1;

    @property({ type: CCFloat, visible() { return (this as ReelData)._endBounce; }, tooltip: '在掉落後接上升的延遲', group: 'EndBounce' })
    protected _bounceDelay: number = 0.1;

    @property({ type: CCFloat, visible() { return (this as ReelData)._endBounce; }, tooltip: '回彈掉落的距離', group: 'EndBounce' })
    protected _bounceDis: number = 50;

    public set rollSpeed(speed: number) {
        this._rollSpeed = speed;
    }

    public get rollSpeed(): number {
        return this._rollSpeed;
    }

    public get startPull(): boolean {
        return this._startPull;
    }

    public set startPull(value: boolean) {
        this._startPull = value;
    }

    public get startCurve(): RealCurve {
        return this._startCurve;
    }

    public set startCurve(curve: RealCurve) {
        this._startCurve = curve;
    }

    public get startPullTime(): number {
        return this._startPullTime;
    }

    public set startPullTime(time: number) {
        this._startPullTime = time;
    }

    public get endBounce(): boolean {
        return this._endBounce;
    }

    public set endBounce(value: boolean) {
        this._endBounce = value;
    }

    public get downBounceEasing(): TweenEasingType {
        return this._downBounceEasing;
    }

    public set downBounceEasing(easing: TweenEasingType) {
        this._downBounceEasing = easing;
    }

    public get downBounceDuration(): number {
        return this._downBounceDuration;
    }

    public set downBounceDuration(duration: number) {
        this._downBounceDuration = duration;
    }

    public get upBounceEasing(): TweenEasingType {
        return this._upBounceEasing;
    }

    public set upBounceEasing(easing: TweenEasingType) {
        this._upBounceEasing = easing;
    }

    public get upBounceDuration(): number {
        return this._upBounceDuration;
    }

    public set upBounceDuration(duration: number) {
        this._upBounceDuration = duration;
    }

    public get bounceDelay(): number {
        return this._bounceDelay;
    }

    public set bounceDelay(delay: number) {
        this._bounceDelay = delay;
    }

    public get bounceDis(): number {
        return this._bounceDis;
    }

    public set bounceDis(dis: number) {
        this._bounceDis = dis;
    }
}


