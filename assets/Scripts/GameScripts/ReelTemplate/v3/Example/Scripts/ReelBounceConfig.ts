import { _decorator, CCBoolean, CCFloat, CCInteger, Component, Enum, Node, RealCurve, Vec2 } from 'cc';
import { EaseType } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('ReelBounceConfig')
export class ReelBounceConfig extends Component {
    @property(CCBoolean)
    public startBounce: boolean = false;

    @property(CCBoolean)
    public endBounce: boolean = false;

    @property(CCBoolean)
    public useRealCurve: boolean = false;

    @property({ type: Enum(EaseType), visible() { let data = (this as ReelBounceConfig); return !data.useRealCurve }, tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png' })
    public downBounceEasing: EaseType = EaseType.CubicOut;

    @property({ type: RealCurve, visible() { let data = (this as ReelBounceConfig); return data.useRealCurve }, tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png' })
    public downBounceRealCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, tooltip: '回彈掉落的時間' })
    public downBounceDuration: number = 0.2;

    @property({ type: Enum(EaseType), visible() { let data = (this as ReelBounceConfig); return !data.useRealCurve }, tooltip: '回彈上升的easing，可以參考PublicReel\\Example\\Arts\\Atlases\\TweenEasing.png' })
    public upBounceEasing: EaseType = EaseType.Linear;

    @property({ type: RealCurve, visible() { let data = (this as ReelBounceConfig); return data.useRealCurve }, tooltip: '回彈上升的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png' })
    public upBounceRealCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, tooltip: '回彈上升的時間' })
    public upBounceDuration: number = 0.1;

    @property({ type: CCFloat, tooltip: '回彈掉落的距離' })
    public bounceDis: number = 50;
}