import { _decorator, CCFloat, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProcessTempoConfig')
export class ProcessTempoConfig {
    @property({ type: CCFloat, displayName: '滾輪結束到中獎間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public rollToWinTime: number = 0.5;

    @property({ type: CCFloat, displayName: '圖示中獎到秀分間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public winToScoreTime: number = 0.5;

    @property({ type: CCFloat, displayName: '圖示中獎到大獎間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public winToBigWinTime: number = 0.5;

    @property({ type: CCFloat, displayName: '得分到Scatter演繹間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public scoreToScatterTime: number = 0.5;

    @property({ type: CCFloat, displayName: 'Scatter演繹到FG轉場版間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public scatterToFGTime: number = 0.5;

    @property({ type: CCFloat, displayName: 'Scatter演繹到FG加局間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public scatterToFGAddTime: number = 0.5;

    @property({ type: CCFloat, displayName: 'FG結束到FG退場版間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public fgOverToOutTime: number = 0.5;

    @property({ type: CCFloat, displayName: '整局結束到輪播間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public rollOverToStandByTime: number = 0.5;

    @property({ type: CCFloat, displayName: '待機中獎輪播間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public standBySpaceTime: number = 0.5;

    @property({ type: CCFloat, displayName: '無得分換局間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public autoSpaceTime: number = 0.5;

    @property({ type: CCFloat, displayName: '有得分換局間隔', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public winAutoSpaceTime: number = 0.5;
}


