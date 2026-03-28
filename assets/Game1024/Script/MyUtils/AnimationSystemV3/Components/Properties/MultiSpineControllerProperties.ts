import { _decorator, Component, Node, Prefab, CCString } from 'cc';
import { SpineController } from '../SpineController';

const { ccclass, property } = _decorator;

@ccclass('SpineMultiPropertyDef')
export class SpineMultiPropertyDef {

    @property({ type: CCString, visible: true, displayName: 'Key', tooltip: '用來索引的key' })
    public key: string = '';

    @property({ type: SpineController, visible: true, displayName: 'SpineController', tooltip: 'SpineController的Prefab' })
    public spineController: SpineController = null;

}

@ccclass('MultiSpineControllerProperties')
export class MultiSpineControllerProperties {
    @property({ type: SpineMultiPropertyDef, visible: true, displayName: 'Prefab List', tooltip: '塞入尚未實體化的prefab,依照key當作索引' })
    public spineControllerPropertyList: SpineMultiPropertyDef[] = [];
}