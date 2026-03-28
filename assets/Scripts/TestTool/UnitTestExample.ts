import { _decorator, Component, tween } from 'cc';
import { UnitTest } from './TestableFunction';
import { LogExecutionTime } from './LogExecutionTIme';
import { UnitTestComponent } from './UnitTestComponent';
import { Utility } from '../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('UnitTestExample')
export class UnitTestExample extends Component {
    protected onLoad(): void {
        // 可以在編輯器運行時手動拖入 UnitTestComponent，也可以在待測組件的 onLoad 用 addComponent
        this.node.addComponent(UnitTestComponent);
    }

    // 有 TestableFunction 裝飾器，會被執行
    // 案例: 方法顯示順序由腳本內排序決定 (UnitTest 註冊時機)
    @UnitTest()
    public funcZ(): void {
        console.log('funcZ executed');
    }

    // 有 TestableFunction 裝飾器，會顯示在裝飾器測試按鈕列表
    @UnitTest()
    public funcA(): void {
        console.log('funcA executed');
    }

    // 沒有 TestableFunction 裝飾器，不會顯示在裝飾器測試按鈕列表
    public funcB(): void {
        console.log('funcB executed');
    }

    // 有 TestableFunction 裝飾器
    @UnitTest()
    public funcC(): void {
        console.log('funcC executed');
        this.funcD();
        this.funcE();
    }

    // 有 TestableFunction 裝飾器，會顯示在裝飾器測試按鈕列表，也會被 funcC 呼叫執行
    @UnitTest()
    public funcD(): void {
        console.log('funcD executed');
    }

    // 沒有 TestableFunction 裝飾器，不會顯示在裝飾器測試按鈕列表，但會被 funcC 呼叫執行
    public funcE(): void {
        console.log('funcE executed');
    }

    @UnitTest(123, '456', false, [1, 2, 3], ['a', 'b', 'c'])
    public funcArgs(arg1: number, arg2: string, arg3: boolean, arg4: number[], arg5: string[]) {
        console.log(`${arg1}: ${typeof arg1}`);
        console.log(`${arg2}: ${typeof arg2}`);
        console.log(`${arg3}: ${typeof arg3}`);
        console.log(`${arg4}: ${typeof arg4}`);
        console.log(`${arg5}: ${typeof arg5}`);
    }

    @LogExecutionTime
    async delayBySetTimeout(): Promise<void> {
        console.log('delayBySetTimeout executed start');
        return new Promise<void>((resolve, reject) => {
            // 注意: 這裡使用 setTimeout 只是方便於不需要跑遊戲就可以直接測試，一般情況請勿使用 setTimeout
            setTimeout(() => {
                console.log('delayBySetTimeout executed end');
                resolve();
            }, 1000);
        });
    }

    @LogExecutionTime
    async delayByScheduleOnce(): Promise<void> {
        console.log('delayByScheduleOnce executed start');
        return new Promise<void>((resolve, reject) => {
            this.scheduleOnce(() => {
                console.log('delayByScheduleOnce executed end');
                resolve();
            }, 1);
        });
    }

    @LogExecutionTime
    async delayByTween(): Promise<void> {
        console.log('delayByTween executed start');
        return new Promise<void>((resolve, reject) => {
            const a = {};
            tween(a)
                .delay(1)
                .call(() => {
                    console.log('delayByTween executed end');
                    resolve();
                })
                .start();
        });
    }

    @LogExecutionTime
    async delayByWaitPromise(): Promise<void> {
        console.log('delayByWaitPromise executed start');
        await Utility.waitPromise(1);
        console.log('delayByWaitPromise executed end');
    }
}
