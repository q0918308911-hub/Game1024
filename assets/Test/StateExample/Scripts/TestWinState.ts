import { StateBase } from "db://assets/Scripts/ModuleEntry";

export class TestWinState extends StateBase {

    constructor(stateName: string, view: any = null) {
        super(stateName);
    }

    onEnter(): void {
        console.log(`進入${this.stateName}狀態, 上一個狀態是${this.previousStateName}`);
    }

    onExit(): void {
        console.log(`離開${this.stateName}狀態, 下一個狀態是${this.nextStateName}`);
    }

    onUpdate(dt: number): void {
        // 閒置中更新邏輯（通常不會有）
    }
}