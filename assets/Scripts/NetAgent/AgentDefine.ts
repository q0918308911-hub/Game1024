

/**
 * 環境
 */
export enum Environment {
    Test = 0,
    Release = 1
}

//Default Timeout
export const REQUEST_TIMEOUT: number = 6000;
//Default Timeout Error Code
export const REQUEST_TIMEOUT_ERROR_CODE: number = -9999;
//Parser Url Fail Error Code
export const PARSER_URL_FAIL: number = -9998;
//分流登入連線時敗
export const LoginReDispatcherConnectFail: number = -9997;
//分流Spin連線時敗
export const SpinReDispatcherConnectFail: number = -9996;
//歷史紀錄請求失敗
export const AskHistoryFail: number = -9995;
//歷程請求重試次數
export const AskHistoryRetryCount: number = 3;

//ConnectSettingList
export interface IConnectSettingList {
    [key: number]: string
}

//PlayerInfo
export interface IPlayerInfo {
    game_code: string,
    platform: string,
    name: string,
    serviceId: string,
    awKey: string,
    webConfigUrl: string,
    webConfig?: IGameConfig,
    ParserSuccess: boolean,

}

//歷史紀錄
export interface IHistory {
    暱稱: string
    異動前: number,
    異動後: number,
    Bet: number,
    Win: number,
    盤面演繹: string,
    遊戲館: string,
    編號: string,
    Time: number,
    加購: number,
    扣幣倍: number,
}

//遊戲相關web設定
export interface IGameConfig {
    Result: number
    CommonSetting: ICommonSetting,
    GameSetting: IGameSetting
    PlatformSetting: IPlatformSetting,
}

export interface ICommonSetting {
    ClientKey: string;
    Client_GameEvent_API: string;
    Client_GameIssue_API: string
    ConnectSetting: string[];
    LifeSecond: number;
    CustomData: string,
    ESAPIHistory_UrlList: string[]
}

export interface IGameSetting {
    GameRule_Url: string;
    PayTable_Url: string;
    PlayerHistory_Url: string;
    CustomData: string
}

export interface IPlatformSetting {
    LoadingLogoType: SwitchType;
    GameBottomLogoType: SwitchType;
    BuyFeatureLogoType: SwitchType;
    ThousandPlace: ThousandPlaceType;
    Range: number[];
}

//遊戲歷程請求格式
export const askHistoryBodyFormat: string = "{平台}:{暱稱}:{GameCode}:{歷程高度}";
//遊戲歷程高度最大值
export const HistoryHeightMax: number = 100;
//歷程高度回傳格式
export interface historyHeightFormat {
    at: string;
    id: string;
    st: string;
    tag1: string;
    tag2: string;
}

//ConfigType
export enum ConfigType {
    SLOT = "Slot",
    Fish = "Fish",
}
//開關類型
export enum SwitchType {
    Normal = "Normal",
    Close = "Close",
}
//千分位類型
export enum ThousandPlaceType {
    ENG = "ENG",
    EUR = "EUR"
}

export const HistoryErrorCode =
{
    "0\tdata is nothing": -9994,
    "0\taccount error": -9993,
    "0\ttable error": -9992,
    "0\tid error": -9991,
    "0\tdb error": -9990,
}