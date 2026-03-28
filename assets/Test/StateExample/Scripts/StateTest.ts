import { _decorator, Component, Node } from 'cc';
import { TestStateEnum } from './StateTestConfig';
import { TestIdleState } from './TestIdleState';
import { TestSpinState } from './TestSpinState';
import { TestWinState } from './TestWinState';
import { StateMachine } from 'db://assets/Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('StateTest')
export class StateTest extends Component {

    private fsm: StateMachine = new StateMachine();

    start() {
        this.fsm.addState(TestStateEnum.Idle, new TestIdleState(TestStateEnum.Idle));
        this.fsm.addState(TestStateEnum.Spin, new TestSpinState(TestStateEnum.Spin));
        this.fsm.addState(TestStateEnum.Win, new TestWinState(TestStateEnum.Win));

        this.fsm.changeState(TestStateEnum.Idle);
    }


    onBtnGoWinClick() {
        this.fsm.changeState(TestStateEnum.Win);
    }

    onBtnGoIdleClick() {
        this.fsm.changeState(TestStateEnum.Idle);
    }

    onBtnGoSpinClick() {
        this.fsm.changeState(TestStateEnum.Spin);
    }

    update(deltaTime: number) {
        this.fsm.update(deltaTime);
    }
}


