import { _decorator, Component, Node } from 'cc';
import { ReelTempoConfig } from './ReelTempoConfig';
import { ProcessTempoConfig } from './ProcessTempoConfig';
import { AnimTempoConfig } from './AnimTempoConfig';
import { JsonSerialization } from './JsonSerialization';
const { ccclass, property, } = _decorator;

@ccclass('TempoConfig')
export class TempoConfig {
    @property({ type: ProcessTempoConfig, displayName: "流程設定" })
    public processTempoConfig: ProcessTempoConfig = new ProcessTempoConfig();

    @property({ type: ReelTempoConfig, displayName: "滾輪設定" })
    public reelTempoConfig: ReelTempoConfig = new ReelTempoConfig();

    @property({ type: AnimTempoConfig, displayName: "動畫設定" })
    public animTempoConfig: AnimTempoConfig = new AnimTempoConfig();
}

@ccclass('GameTempoConfig')
export class GameTempoConfig extends JsonSerialization {
    @property({ type: TempoConfig, displayName: '普通模式設定' })
    public normalTempoConfig: TempoConfig = new TempoConfig();

    @property({ type: TempoConfig, displayName: '快速模式設定' })
    public turboTempoConfig: TempoConfig = new TempoConfig();

    @property({ type: TempoConfig, displayName: '急速模式設定' })
    public superTempoConfig: TempoConfig = new TempoConfig();
}


