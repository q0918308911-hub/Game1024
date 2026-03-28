export interface IFlowProcess {
    getFlowKeyGroups(processKey?: string): string[][];
    buildFlowStages(processKey?: string): string[];
}