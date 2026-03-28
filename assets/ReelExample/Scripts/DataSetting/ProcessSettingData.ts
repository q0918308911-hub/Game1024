import { _decorator, CCBoolean, CCFloat, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProcessSettingData')
export class ProcessSettingData extends Component {
    @property({ type: CCFloat, displayName: '普通模式滾輪停止後到中獎', group: { id: '1', name: '流程設定' }, min: 0 })
    public normalStopToPlayWinTime: number = 0.2;

    @property({ type: CCFloat, displayName: '快速模式滾輪停止後到中獎', group: { id: '1', name: '流程設定' }, min: 0 })
    public turboStopToPlayWinTime: number = 0.2;

    @property({ type: CCFloat, displayName: '普通模式每局間隔時間', group: { id: '1', name: '流程設定' }, min: 0 })
    public normalRoundSpaceTime: number = 0.2;

    @property({ type: CCFloat, displayName: '快速模式每局間隔時間', group: { id: '1', name: '流程設定' }, min: 0 })
    public turboRoundSpaceTime: number = 0.2;

    @property({ type: CCFloat, displayName: 'ICON中獎動畫後接到跑分', group: { id: '2', name: '動畫' }, min: 0 })
    public winAnimToScoreTime: number = 0.2;

    @property({ type: CCFloat, displayName: 'ICON中獎動畫時長', group: { id: '2', name: '動畫' }, min: 0 })
    public winAnimTime: number = 1;

    @property({ type: CCFloat, displayName: '顯示得分動畫時長', group: { id: '2', name: '動畫' }, min: 0 })
    public showScoreTime: number = 0.2;

    @property({ type: CCFloat, displayName: '關閉得分動畫時長', group: { id: '2', name: '動畫' }, min: 0 })
    public hideScoreTime: number = 0.1;

    @property({ displayName: '得分是否跑分', group: { id: '2', name: '動畫' } })
    public needRunScore: boolean = false;

    @property({ type: CCFloat, displayName: '分數跑分時長', visible() { return (this as ProcessSettingData).needRunScore }, group: { id: '2', name: '動畫' }, min: 0 })
    public runScoreTime: number = 1;

    @property({ type: CCFloat, displayName: '分數顯示時長', group: { id: '2', name: '動畫' }, min: 0 })
    public scoreShowTime: number = 1;

    @property({ type: CCFloat, displayName: '跑分結束接待機動畫', group: { id: '2', name: '動畫' }, min: 0 })
    public runScoreToStandbyTime: number = 0.2;

    @property({ type: CCFloat, displayName: '待機動畫間隔時長', group: { id: '2', name: '動畫' }, min: 0 })
    public standbySpaceTime: number = 1;

    @property({ displayName: '中獎動畫與得分一起顯示', group: { id: '2', name: '動畫' } })
    public winAnimAndRunScore: boolean = false;

    @property({ displayName: '跑分與底下得分一起顯示', group: { id: '2', name: '動畫' } })
    public runScoreAndBottomScore: boolean = false;

    @property({ displayName: '待機動畫與得分一起顯示', group: { id: '2', name: '動畫' } })
    public readyHandAnimAndRunScore: boolean = false;
}


