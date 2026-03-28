{
  "gameID": "Game1001", // 遊戲場景的名稱
  "gameNumber": 12099,	// 與總部取牌館連線的編號
  "versionCode": 10,	// 遊戲的版號，會顯示在右下角的第二位
  "gameCode": "W002",	// 與北分連線的編號
  "idleTimeoutLimit": 600, // 閒置多久後會被踢出，以秒為單位
  "isExhibition": false,   // 是否是展示模式(如果開啟，在Start頁面就不會連線，進入遊戲後如果是isOnline的sendBet也會直接與取牌館要資料
  "isOnline": true,        // 是否是online如果開啟就要走NetworkHandler的sendBet要資料，不然就要走假資料，這部分每個遊戲要獨立實作
  "debugLocalization": false,  // 是否要強制開啟語系，預設為false，false時會看url的語系調整語系，如果為true會看下方debugLanguageKey決定語系
  "debugLanguageKey": "en" //語系代號 說明如下
}

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