/** 所有的 Agent 至少都要有 ownerId */
export interface IBaseOwner {
    readonly ownerId: number;
}