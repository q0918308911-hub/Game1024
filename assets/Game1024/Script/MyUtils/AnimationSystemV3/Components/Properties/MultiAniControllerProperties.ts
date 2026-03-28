import { _decorator, Component, Node, Prefab, CCString } from 'cc';
import { AnimationController } from '../AnimationController';

const { ccclass, property } = _decorator;

@ccclass('AniMultiPropertyDef')
export class AniMultiPropertyDef {

    @property({ type: CCString, visible: true, displayName: 'Key', tooltip: '用來索引的key' })
    public key: string = '';

    @property({ type: AnimationController, visible: true, displayName: 'AnimationController', tooltip: 'AnimationController的Prefab' })
    public aniController: AnimationController = null;

}

@ccclass('MultiAniControllerProperties')
export class MultiAniControllerProperties {
    @property({ type: AniMultiPropertyDef, visible: true, displayName: 'Prefab List', tooltip: '塞入尚未實體化的prefab,依照key當作索引' })
    public aniControllerPropertyList: AniMultiPropertyDef[] = [];
}