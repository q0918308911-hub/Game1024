import { _decorator, CCBoolean, CCFloat, CCInteger, Component, Enum, Node, Prefab, RealCurve, Size, SpriteFrame, Vec2 } from 'cc';
import { SymbolData } from './SymbolData';
import { EaseType, LayoutType } from 'db://assets/Scripts/ModuleEntry';
const { ccclass, property, } = _decorator;

@ccclass('ReelSettingData')
export class ReelSettingData extends Component {
    @property({ type: CCInteger, displayName: '單個滾輪icon數量', group: { id: '0', name: 'Icon設定', }, min: 0 })
    public iconAmount: number = 0;

    @property({ displayName: 'icon尺寸', group: { id: '0', name: 'Icon設定', } })
    public iconSize: Size = new Size(0, 0);

    @property({ type: CCFloat, displayName: 'icon相隔距離', group: { id: '0', name: 'Icon設定', }, })
    public iconSpacing: number = 0;

    @property({ range: [0, 255], displayName: '壓黑的明亮度', slide: true, group: { id: '0', name: 'Icon設定', } })
    protected darkBrightness: number = 0;

    @property({ type: SymbolData, displayName: 'symbol資料列表', group: { id: '0', name: 'Icon設定', } })
    public symbolDataList: SymbolData[] = [];

    @property({ displayName: '滾輪可視範圍', group: { id: '1', name: '滾輪設定', } })
    public reelViewSize: Size = new Size(0, 0);

    @property({ type: CCInteger, displayName: '滾輪數量', group: { id: '1', name: '滾輪設定', }, min: 0 })
    public reelAmount: number = 0;

    @property({ type: Enum(LayoutType), displayName: '滾輪方向', group: { id: '1', name: '滾輪設定', } })
    public layoutType: LayoutType = LayoutType.Vertical;

    @property({ displayName: '翻轉方向', group: { id: '1', name: '滾輪設定', }, })
    public inverseDirection: boolean = false;

    @property({ type: CCFloat, displayName: '滾輪間隔', group: { id: '1', name: '滾輪設定', }, min: 0 })
    public reelSpace: number = 0;

    @property({ type: CCFloat, displayName: '普通模式滾輪時間', group: { id: '1', name: '滾輪設定', }, min: 0 })
    public normalRollTime: number = 0.5;

    @property({ type: CCFloat, displayName: '快速模式滾輪時間', group: { id: '1', name: '滾輪設定' }, min: 0 })
    public turboRollTime: number = 0.2;

    @property({ type: CCFloat, displayName: '開始滾間隔時間(小於0同時滾)', tooltip: '開始滾動間隔的時間，小於0代表一起滾動', group: { id: '1', name: '滾輪設定' } })
    public startSpaceTime: number = 0.1;

    @property({ displayName: '聽牌時是否受即停影響', group: { id: '1', name: '滾輪設定' } })
    public readyHandImmediatelyStop: boolean = true;

    @property({ type: CCInteger, displayName: '聽牌停輪間隔資料長度', group: { id: '1', name: '滾輪設定' }, min: 0 })
    public readyHandDataLength: number = 12;

    @property({ type: RealCurve, displayName: '聽牌的easing', tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png', group: { id: '1', name: '滾輪設定' } })
    public readyHandRealCurve: RealCurve = new RealCurve();


    @property({ displayName: '開始回彈, 掉落會變成上升', group: 'Bounce' })
    public startBounce: boolean = false;

    @property({ displayName: '結束回彈', group: 'Bounce' })
    public endBounce: boolean = false;

    @property({ displayName: '使用真實曲線', group: 'Bounce' })
    public useRealCurve: boolean = false;

    @property({ type: Enum(EaseType), visible() { let data = (this as ReelSettingData); return data.isVisible() && !data.useRealCurve }, displayName: '回彈掉落的easing', tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png', group: 'Bounce' })
    public downBounceEasing: EaseType = EaseType.CubicOut;

    @property({ type: RealCurve, visible() { let data = (this as ReelSettingData); return data.isVisible() && data.useRealCurve }, displayName: '回彈掉落的easing', tooltip: '回彈掉落的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png', group: 'Bounce' })
    public downBounceRealCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, visible() { return (this as ReelSettingData).isVisible() }, displayName: '回彈掉落的時間', group: 'Bounce' })
    public downBounceDuration: number = 0.2;

    @property({ type: Enum(EaseType), visible() { let data = (this as ReelSettingData); return data.isVisible() && !data.useRealCurve }, displayName: '回彈上升的easing', tooltip: '回彈上升的easing，可以參考PublicReel\\Example\\Arts\\Atlases\\TweenEasing.png', group: 'Bounce' })
    public upBounceEasing: EaseType = EaseType.Linear;

    @property({ type: RealCurve, visible() { let data = (this as ReelSettingData); return data.isVisible() && data.useRealCurve }, displayName: '回彈上升的easing', tooltip: '回彈上升的easing，可以參考PublicReel\\Example\\Arts\Atlases\\TweenEasing.png', group: 'Bounce' })
    public upBounceRealCurve: RealCurve = new RealCurve();

    @property({ type: CCFloat, visible() { return (this as ReelSettingData).isVisible() }, displayName: '回彈上升的時間', group: 'Bounce' })
    public upBounceDuration: number = 0.1;

    @property({ type: CCFloat, visible() { return (this as ReelSettingData).isVisible() }, displayName: '回彈掉落的距離', group: 'Bounce' })
    public bounceDis: number = 20;


    @property({ type: CCFloat, displayName: 'NG滾輪轉速(越小越快)', group: { id: '2', name: 'NG' }, min: 0.001, step: 0.001 })
    public ngMoveInterval: number = 0.05;

    @property({ type: CCInteger, displayName: 'NG停輪間隔資料長度', group: { id: '2', name: 'NG' }, min: 0 })
    public ngStopDataLength: number = 4;

    @property({ type: CCFloat, displayName: 'FG滾輪轉速(越小越快)', group: { id: '3', name: 'FG' }, min: 0.001, step: 0.001 })
    public fgMoveInterval: number = 0.06;

    @property({ type: CCInteger, displayName: 'FG停輪間隔資料長度', group: { id: '3', name: 'FG' }, min: 0 })
    public fgStopDataLength: number = 4;

    protected isVisible(): boolean {
        return this.startBounce || this.endBounce;
    }
}


