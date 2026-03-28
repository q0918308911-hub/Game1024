import { _decorator, } from 'cc';
import { SlotMachineData } from '../../Scripts/Model/SlotMachineData';
import { PublicReelConfigTest } from './PublicReelConfigTest';
const { ccclass, property } = _decorator;

const {
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    WILD_ID,
    ALL_SYMBOL_LIST,
} = PublicReelConfigTest;

@ccclass('SlotMachineDataTest')
export class SlotMachineDataTest extends SlotMachineData {
    public allSymbolList: number[] = [...ALL_SYMBOL_LIST];

    public uniqueSymbolList: number[][] =
        [[WILD_ID], [WILD_ID], [WILD_ID], [...MAGNIFICATION_SYMBOLS_LIST]];

    public noAppearSymbolList: number[][] =
        [
            [...MAGNIFICATION_SYMBOLS_LIST],
            [...MAGNIFICATION_SYMBOLS_LIST],
            [...MAGNIFICATION_SYMBOLS_LIST],
            [...NORMAL_SYMBOLS_LIST],
        ];

    public initSymbolList: number[][] = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 0],
        [8, 9, 10],
    ];
}