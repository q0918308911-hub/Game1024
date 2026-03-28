import { _decorator, Component } from 'cc';
import { IBasicPoolObjComponent } from '../Definitions/IBasicPoolObject';

const { ccclass, property } = _decorator;
@ccclass('BasicPoolObject')
//--為了能夠透過getComponent拿到這個interface所以得繼承過component的interface
//--而且不能寫成抽象的abstract
export class BasicPoolObject extends Component implements IBasicPoolObjComponent {
    public onObjInstance(): void {

    }
    public onAfterDestroy(): void {

    }//-不能用onDestroy這個字component拿去用了
    public beforeDestroy(): void {

    }
    public resetData(): void {

    }
}

