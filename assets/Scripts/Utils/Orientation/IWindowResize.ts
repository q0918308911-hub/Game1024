import { _decorator, Component, Node } from 'cc';
import { Orientation } from '../../GameScripts/Definition';
const { ccclass, property } = _decorator;

@ccclass('IWindowResize')
export class IWindowResize extends Component {
    public onWindowResize(orientation: Orientation): void {
        throw new Error('Method not implemented.');
    }
}


