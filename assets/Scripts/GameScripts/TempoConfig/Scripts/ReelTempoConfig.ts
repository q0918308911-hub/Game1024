import { _decorator, CCFloat, CCInteger, Component, Enum, Node, RealCurve } from 'cc';
import { EaseType } from '../../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('ReelTempoConfig')
export class ReelTempoConfig {
    @property({ displayName: '滾輪啟動時回彈', group: { name: '回彈配置', displayOrder: 1 } })
    public startBounce: boolean = false;

    @property({ displayName: '滾輪停止時回彈', group: { name: '回彈配置', displayOrder: 1 } })
    public endBounce: boolean = false;

    @property({ displayName: '滾輪回彈使用自定義曲線', group: { name: '回彈配置', displayOrder: 1 } })
    public useRealCurve: boolean = false;

    @property({ type: Enum(EaseType), displayName: '滾輪回彈掉落曲線', visible(this: ReelTempoConfig) { return !this.useRealCurve }, tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png', })
    public downBounceEasing: EaseType = EaseType.CubicOut;

    @property({ type: RealCurve, displayName: '滾輪回彈掉落曲線', visible(this: ReelTempoConfig) { return this.useRealCurve } })
    public downBounceRealCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, displayName: '回彈掉落的時間', group: { name: '回彈配置', displayOrder: 1 } })
    public downBounceDuration: number = 0.2;

    @property({ type: Enum(EaseType), displayName: '滾輪回彈向上曲線', visible(this: ReelTempoConfig) { return !this.useRealCurve }, tooltip: '回彈上升的easing，可以參考PublicReel\\Example\\Arts\\Atlases\\TweenEasing.png', })
    public upBounceEasing: EaseType = EaseType.Linear;

    @property({ type: RealCurve, displayName: '滾輪回彈向上曲線', visible(this: ReelTempoConfig) { return this.useRealCurve } })
    public upBounceRealCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, displayName: '回彈上升的時間', group: { name: '回彈配置', displayOrder: 1 } })
    public upBounceDuration: number = 0.1;

    @property({ type: CCFloat, displayName: '滾輪滾動一格', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public rollingOnceTime: number = 0.05;

    @property({ type: CCFloat, displayName: '滾輪滾動', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public rollingTime: number = 0.5;

    @property({ type: CCFloat, displayName: '滾輪啟動間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public startSpaceTime: number = 0.05;

    @property({ type: CCFloat, displayName: '滾輪停止間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public stopSpaceTime: number = 0.1;

    @property({ type: CCFloat, displayName: '滾輪聽牌間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public readyHandSpaceTime: number = 0.1;

    @property({ type: RealCurve, displayName: '滾輪滾動曲線', group: { name: '時間配置', id: '1' } })
    public rollingCurve: RealCurve = new RealCurve();

    @property({ type: CCInteger, displayName: '滾輪隨機資料長度', min: 0, max: 99, step: 1, slide: true, group: { name: '其他配置', id: '3' } })
    public randomDataLength: number = 4;

    @property({ type: CCFloat, displayName: '滾輪聽牌隨機資料長度', min: 0, max: 99, step: 1, slide: true, group: { name: '其他配置', id: '3' } })
    public readyHandDataLength: number = 12;

    constructor() {
        this.rollingCurve.addKeyFrame(0, 0);
        this.rollingCurve.addKeyFrame(1, 1);
        this.downBounceRealCurve.addKeyFrame(0, 0);
        this.downBounceRealCurve.addKeyFrame(1, 1);
        this.upBounceRealCurve.addKeyFrame(0, 0);
        this.upBounceRealCurve.addKeyFrame(1, 1);
    }
}


