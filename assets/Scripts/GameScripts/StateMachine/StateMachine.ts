// StateMachine.ts
import { StateBase } from "./StateBase";

export class StateMachine {
    private states: Map<string, StateBase> = new Map();
    private currentState: StateBase = null;
    private currentStateName: string = "";

    public addState(name: string, state: StateBase) {
        if (this.states.get(name)) {
            console.error(`State ${name} already exists.`);
            return;
        }
        this.states.set(name, state);
    }

    public changeState(stateName: string) {
        if (!this.states.get(stateName)) {
            console.error(`State ${stateName} does not exist.`);
            return;
        }

        if (this.currentStateName === stateName) {
            console.warn(`Already in state ${stateName}.`);
            return
        };

        // 離開舊狀態
        if (this.currentState) {
            // 將要離開的狀態的 nextStateName 設為即將進入的狀態名稱
            this.currentState.nextStateName = stateName;
            this.currentState.onExit();
        }

        // 切換新狀態
        this.currentState = this.states.get(stateName);
        // 將要進入的狀態的 previousStateName 設為之前的狀態名稱
        this.currentState.previousStateName = this.currentStateName;
        // 更新目前狀態名稱
        this.currentStateName = stateName;
        this.currentState.onEnter();
    }

    public update(dt: number) {
        if (this.currentState) {
            this.currentState?.onUpdate(dt);
        }
    }

    public getCurrentStateName(): string {
        if (!this.currentState) {
            console.error("Current state is null.");
            return null;
        }

        return this.currentStateName;
    }
}
