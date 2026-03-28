// StateBase.ts
export abstract class StateBase {
    public previousStateName: string = "";
    public stateName: string = "";
    public nextStateName: string = "";
    constructor(stateName: string) {
        this.stateName = stateName;
    }

    abstract onEnter(): void;

    abstract onExit(): void;

    abstract onUpdate(dt: number);
}


