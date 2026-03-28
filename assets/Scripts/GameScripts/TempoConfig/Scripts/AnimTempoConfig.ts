import { _decorator, CCFloat, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimTempoConfig')
export class AnimTempoConfig {
    @property({ type: CCFloat, displayName: '圖示中獎演繹', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public winAnimTime: number = 0.5;

    @property({ type: CCFloat, displayName: '分數持續', min: 0, max: 99, step: 0.01, slide: true, group: { name: '時間配置', id: '1' } })
    public scoreShowTime: number = 0.5;
}


