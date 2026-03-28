import { Layers } from "cc";

export enum SlotRelayLang {
    tw = 0, //繁體中文
    cn = 1, //簡體中文
    en = 2, //英文
    vn = 3, //越南文
    jp = 4, //日文
    th = 5, //泰文
    es = 6, //西班牙文
    kr = 7, //韓文
}

export enum OrientationMode {
    Both = 0,
    Landscape = 1,
    Portrait = 2,
}


export enum GenericSound {
    Public_Choice = 0,
    Public_On = 1,
    Public_Off = 2,
}

export enum WinType {
    EpicWin,
    MegaWin,
    SuperWin,
    BigWin,
}

export enum GameMode {
    OfflineDemo,
    OnlineTest,
    Online
}

export enum Orientation {
    Landscape = 1,
    Portrait = 2,
}

export enum BuyFGType {
    None = 0,
    OddsUpFG = 1,
    BuyFG = 2,
    BuyBG = 3,
    BuyFGTwoHitOne = 4,
    BuySuperFG = 5,
    BuyOther1 = 101,
    BuyOther2 = 102,
    BuyOther3 = 103,
}

// 自定義的Layer，可以直接指定給node.layer使用 
export enum MyLayer {
    LAYER_18 = 1 << Layers.nameToLayer("LAYER_18"),
    LAYER_19 = 1 << Layers.nameToLayer("LAYER_19"),
}

export enum ButtonStatus {
    Normal = 'normal',
    Pressed = 'pressed',
    Hover = 'hover',
    Disabled = 'disabled',
}

export enum BuyFeatureMode {
    None,
    BuyBonus,
    ExtraBet
}
