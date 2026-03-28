# 網路連線架構

> 目前連線有兩種模式，分別為直連總部取牌館及透過北分連線。

實作連線程式 NetworkHandler(Singleton) 進行包裝

## 直連總部取牌館

> 測試專用，玩家無須登入，進入遊戲後使用 Http Post 方式呼叫 Game Server 取得單局資料

以下方式皆可達成此模式

* CocosCreator 直接執行
* 包版發布時，設定 gameConfig.json 的 isExhibition (展示模式) 為 true
  以女巫學院為例，開啟 Web_Slot\assets\Game\Game008\Config\gameConfig008.json

  ```"isExhibition":
  "isExhibition": true,
  ```

### 下注取得單局資料

**NetworkHandler.ts**
```
private sendBetFetch(gameNumber: number, totalBet: number, balance: number, buyFGType: number) {
    // ....
        let url = `https://bpdev2.xin-stars.com/60887/Bet`; // 
        fetch(url, { method: "POST", body: JSON.stringify(raw) })
    // ....
}
```

## 透過北分連線

需使用北分提供的 NetAgent 連線，故 NetworkHandler 會將 NetAgent 引入使用，達成連線接送資料

1. 連線
   測試站環境下，遊戲必定從 GameStart(說明頁)開始
   先對 NetworkHandler 初始化後，註冊 NetworkEvent.Login 事件 callback 呼叫 onLogin()
   
   **GameStart.ts**
   ```
   protected start() {
       // ....
       NetworkHandler.instance.init(this.gameID, this.idleTimeoutLimit, this.isExhibition);
       if (!this.isExhibition && !Utility.isDev()) {
           NetworkHandler.instance.addEventListener(NetworkEvent.Login, this.onLogin.bind(this));
           NetworkHandler.instance.connectServer();
       }
       // ....
   }
   ```

   connectServer() 完成後進入 onLogin() 會取得玩家的基本資料

   ```
   private onLogin(isLogin: boolean, gameMachineInfo: GameMachineInfo) {
       if (isLogin) {
           PlayerInfo.balance = gameMachineInfo.Balance;
           PlayerInfo.userName = gameMachineInfo.Nickname;
           PlayerInfo.betMax = gameMachineInfo.MaxBet;
           PlayerInfo.betMin = gameMachineInfo.MinBet;
           PlayerInfo.machineID = gameMachineInfo.Id;
           PlayerInfo.buyFG = gameMachineInfo.BuyFG;
           this.getPlayerInfoDone = true;
           this.checkInitGameScene();
       }
       else {
           console.error('login fail');
           ErrorHandler.Instance.TriggerError(ErrorCode.Client_LoginFail);
       }
   }
   ```

2. 註冊事件及使用
   連線成功進入遊戲主 Scene，GameController 針對 NetworkEvent 的事件進行 callback 註冊，目前有 Bet 及 SpinFail
   
   **GameController.ts**
   ```
   public init(gameNumber: number, isOnline: boolean) {
       this.gameNumber = gameNumber;
       this.isOnline = isOnline;
       NetworkHandler.instance.addEventListener(NetworkEvent.Bet, this.onReceiveBet.bind(this));
       NetworkHandler.instance.addEventListener(NetworkEvent.SpinFail, this.onSpinFail.bind(this));
   }
   ```

   玩家下注時，透過 send 發送
   ```
   public sendBet(bet: number, additionalPurchaseType: AdditionalPurchaseType = AdditionalPurchaseType.None) {
       NetworkHandler.instance.send(NetworkEvent.Bet, this.gameNumber, bet, PlayerInfo.balance, additionalPurchaseType);
   }
   ```

   送出完成後，即會觸發在 init() 註冊的 NetworkEvent 事件進入指定 callback function
   ex: 接收下注結果
   ```
   public onReceiveBet(betData: BetData) {
       this.finalBalance = betData.coin;
       // 下注後得分前的餘額 先計算為balance減掉下注金額，如果還有購買FG等機制要重新計算
       this.balanceAfterSpin = PlayerInfo.balance - betData.bet;
       PlayerInfo.balance = this.finalBalance;

       if (this.isOnline) {
           let debugText = `${betData.spinId}`;
           if (NetworkHandler.instance.demo !== true) {
               GenericUIManager.instance.setBottomText(debugText);
           }
       }

       this.onReceiveBetCallback?.(betData);
   }
   ```

