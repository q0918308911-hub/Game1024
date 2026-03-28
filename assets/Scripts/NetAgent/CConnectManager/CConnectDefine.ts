export enum CCommand {
    Login = 1,
    Spin = 2,
    Join = 31,
    LeaveService = 32,
    Logout = 33,
    Connect = 112,
    ReConnect = 113,
    Life = 255
}

//Login Status
export enum CCommandStatus {
    Failure = 0, // 失敗
    Success = 1, // 成功
    PlayerNotFound = 2, // 玩家不存在
    PlatformNOResponse = 3, // 平台沒有回應
    ParameterError = 4, // 參數錯誤
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
}

//加購類型
export enum AdditionalPurchaseType {
    None = 0,
    RiseFGRate = 1,
    FG,
    BG,
    FG_2,
    SuperFG,
}

export enum CConnectError {
    //找不到分流
    DispatcherNotFound = -9981,
    //分流連線失敗
    DispatcherConnectFail = -9982,
    //分流連線超時
    DispatcherConnectTimeout = -9983,
    //重連找不到分流
    ReDispatcherNotFound = -9971,
    //重連分流連線失敗
    ReDispatcherConnectFail = -9972,
    //重連分流連線超時
    ReDispatcherConnectTimeout = -9973
}