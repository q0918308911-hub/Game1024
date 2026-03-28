// import { error } from "console";

//Error Code
export enum ErrorCode {
	Failure = 0, // 失敗
	Success = 1, // 成功
	PlayerNotFound = 2, // 玩家不存在
	PlatformNOResponse = 3, // 平台沒有回應
	ParameterError = 4, // 參數錯誤1
	ServerSettingError = 5, // 伺服器設定錯誤
	PlatformNotFound = 6, // 無此平台
	InsufficientBalance = 7, // 餘額不足
	Timeout = 8, // Timeout
	BalanceError = 9, // 餘額錯誤
	AlreadyLoggedIn = 10, // 已登入過
	PlatformResponseParameterError = 11, // 平台回傳參數錯誤
	PlatformVerificationFailure = 12, // 平台登入驗證失敗
	SubPlatformVerificationFailure = 13, // 平台Bet驗證失敗
	PlatformExceptionError = 254, // 平台例外錯誤
	None = 255, // 無
	//Client Define
	ServerKick = -1,
	PARSER_URL_FAIL = -9998,
	Client_Timeout = -9999,
	Client_LoginFail = -10000,
	Click_ReqUserFail = -20000,
	Client_BetError = -30000,
	Client_BetBankruptcy = -30001,
	Client_IdleTimeout = - 40002,
	Client_CalculateError = -50001,
	Client_BuyFeatureError = -60001,
	Client_UNKNOWN = -7777,
	Client_None = -255

}

//Error Event Process
export enum ErrorCodeEventProcess {
	Default = 0,
	//返回
	Back = 1
}

//錯誤代碼對應要顯示的Title
export const ErrorCodeToTitle =
{
	Default_Title: [
		ErrorCode.Client_IdleTimeout,//ok
		ErrorCode.Timeout,//??? 是否為Server發現App無回應斷線
		ErrorCode.AlreadyLoggedIn, //??? 是不是我登入時，線上已有同樣user在線?
		ErrorCode.Client_CalculateError,//ok
		ErrorCode.Client_Timeout,//ok 玩家指令送出無回應
		ErrorCode.Client_LoginFail, //ok
		ErrorCode.Click_ReqUserFail, //ok
		ErrorCode.Client_BetError, //ok
		ErrorCode.BalanceError,// 餘額錯誤
		ErrorCode.ServerSettingError,// 伺服器設定錯誤
		ErrorCode.Failure,// 失敗
		ErrorCode.ParameterError,// 參數錯誤
		ErrorCode.PlayerNotFound,// 玩家不存在
		ErrorCode.PlatformResponseParameterError,// 平台回傳參數錯誤
		ErrorCode.PlatformNotFound, // 無此平台
		ErrorCode.PlatformExceptionError,// 平台例外錯誤
		ErrorCode.PlatformVerificationFailure, // 平台登入驗證失敗
		ErrorCode.SubPlatformVerificationFailure,// 平台Bet驗證失敗
		ErrorCode.PlatformNOResponse, // 平台沒有回應
		ErrorCode.None, // 無
		ErrorCode.ServerKick,// Server端斷線玩家
		ErrorCode.Client_BetBankruptcy,//ok
		ErrorCode.InsufficientBalance,//ok
		ErrorCode.ParameterError,
		ErrorCode.Client_BuyFeatureError
	]
}


//錯誤代碼對應要顯示的訊息
export const ErrorCodeToMsg =
{
	//閒置過久，請重新進入遊戲
	ConnectTimeout: [
		ErrorCode.Client_IdleTimeout//ok
	],
	//連線中斷，請重新進入遊戲 
	Disconnect: [
		ErrorCode.Client_Timeout,//玩家指令送出無回應
		ErrorCode.None, // 無
		ErrorCode.ServerKick,// Server端斷線玩家
		ErrorCode.SubPlatformVerificationFailure,// 平台Bet驗證失敗
		ErrorCode.Failure,// 失敗
		ErrorCode.PlayerNotFound,// 玩家不存在
		ErrorCode.PlatformNOResponse, // 平台沒有回應
		ErrorCode.PlatformResponseParameterError,// 平台回傳參數錯誤
		ErrorCode.PlatformVerificationFailure, // 平台登入驗證失敗
		ErrorCode.ServerSettingError,// 伺服器設定錯誤
		ErrorCode.PlatformNotFound, // 無此平台
		ErrorCode.InsufficientBalance,//餘額不足
		ErrorCode.Timeout,//Timeout
		ErrorCode.BalanceError,// 餘額錯誤
		ErrorCode.AlreadyLoggedIn, //已登入
		ErrorCode.PlatformExceptionError,// 平台例外錯誤
		ErrorCode.ParameterError,// 參數錯誤
		ErrorCode.PARSER_URL_FAIL //Parser Url Fail Error Code

	],
	//連線異常，請重新進入遊戲
	UnstableConnection: [
		ErrorCode.Client_CalculateError,//ok
		ErrorCode.Client_LoginFail, //ok
		ErrorCode.Click_ReqUserFail, //ok
		ErrorCode.Client_BetError, //ok
	],
	//系統異常，請截圖聯繫客服
	SystemException: [
	],
	//系統維護中
	UnderMaintenance: [

	],
	//餘額不足無法進行遊戲
	NoMoneyAvailable: [
		ErrorCode.Client_BetBankruptcy//ok
	],
	//購買特色失敗的
	BuyFeatureError: [
		ErrorCode.Client_BuyFeatureError//ok
	]
}


//有需要Cancel 處理的 Error
export const ErrorCodeCancelEvent =
{
	CanCancel: [ErrorCode.Client_BetBankruptcy]
}
//不需要顯示BG 的 Event
export const ErrorCodeNoShowBGEvent = [];
//預設的Error Title
export const DefaultTitle = "Default_Title";
//預設的 Error Message
export const DefaultMsg = "Default_Msg";
//Error Message replace flag
export const MessageReplaceFlag = "{%d}";

//Error Handle 錯誤的語系key資料
export const ErrorTitleLanguageKey = "ErrorTitle.";
export const ErrorMessageLanguageKey = "ErrorMessage.";
//是否要顯示Error Code
export const ShowErrorCodeFlag: boolean = true;
