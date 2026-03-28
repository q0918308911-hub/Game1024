import { _decorator, CCBoolean, CCFloat, CCInteger, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NewAutoSpinPanelGameModel')
export class NewAutoSpinPanelGameModel extends Component {
    @property(CCBoolean)
    public isEnterFeatureGame: boolean = false;

    @property(CCFloat)
    public odd: number = 0;

    @property(CCInteger)
    public balance: number = 0;
}


