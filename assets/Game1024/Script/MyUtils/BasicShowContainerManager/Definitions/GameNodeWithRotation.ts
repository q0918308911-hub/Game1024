//import { Orientation } from 'db://assets/Scripts/Utils/Config';
import { IBasicShowContainer } from '../IBasicShowContainerManager';
import { IGameMode } from '../../ReferencePathForMyUtils';
import { Orientation } from 'db://assets/Scripts/ModuleEntry';
//--將由IBasicShowContainerManager接管
export interface IGameNodeWithRotation extends IBasicShowContainer {
    changeRotationResolution(value: Orientation): void;
}
export interface IBG_Ani extends IBasicShowContainer {
    stopAllAni(): void;
    playAni(value?: string): void;
}

//--背景反黑的共通行為
export interface IBkgDisplay 
{
    //---開啟背景反黑
    openDark(spColorMode?:boolean): void;
    //---關閉背景反黑
    closeDark(spColorMode?:boolean): void;
    //---漸變反黑
    openTweenDark(spColorMode?:boolean): Promise<void>;
    closeTweenDark(spColorMode?:boolean): Promise<void>;
}



