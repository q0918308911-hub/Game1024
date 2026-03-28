import { _decorator, Component, Node } from 'cc';
import { UniDropReelViewExample } from './UniDropReelViewExample';
import { UniDropSlotMachine } from '../../../Scripts/DropReel/UniDropSlotMachine';
const { ccclass, property } = _decorator;

@ccclass('DropUniReelSlotMachine')
export class UniDropSlotMachineExample extends UniDropSlotMachine<UniDropReelViewExample> {

}


