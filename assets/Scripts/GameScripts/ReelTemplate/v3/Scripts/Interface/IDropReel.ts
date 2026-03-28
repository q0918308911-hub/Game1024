import { IReel } from "./IReel";

export interface IDropReel extends IReel {
    startDropOut(idList: number[]): void;
    startDropIn(idList: number[]): void;
    startDropRefill(removeIdList: number[]): void;

    startDropOutAsync(dropOutList: number[]): Promise<void>;
    startDropInAsync(dropInIdList: number[]): Promise<void>;
    startDropRefillAsync(removeIdList: number[]): Promise<void>;

    onStartDropOut: (dropOutList: number[]) => void;
    onStartDropIn: (dropInIdList: number[]) => void;
    onStartRefill: (removeIdList: number[]) => void;
}


