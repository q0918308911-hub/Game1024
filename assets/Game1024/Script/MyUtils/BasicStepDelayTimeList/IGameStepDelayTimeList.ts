/**
 * 每個遊戲節點需要的延遲時間列表
 * type Ms-->他只是定義時間的變數
 * 真正需要區隔秒或毫秒的話關鍵在 IGameStepDelayTimeList 裡的 unit
 * 
 */
export interface DelayLevel<T> {
  regular: T;//--常規時間
  fast_L1: T;//--快速(1階)時間
  fast_L2: T;//--快速(2階)時間
}
export type Ms = number;//--這邊只是定義單位
export type ReelDelayMap = Record<number, Ms>;
export interface IOtherDelayMap {
  [key: string]: Ms | undefined;
}

export interface IGameStepDelayTimeList {
  unit?: 'ms' | 's';

  //-轉動前與起轉相關
  roll?: {
    moveInterval?: Ms;//--該軸symbol移動間隔時間
    superMoveInterval?: Ms;//--該軸symbol超速移動間隔時間
    totalRoll?: Ms;//--盤面滾動時間
    debounce?: Ms;
    preRoll?: Ms;//--開始轉動前的準備時間(這是給動畫/音效用的準備時間)
    staggerRoll?: Ms;//--每軸起動的錯開時間(軸與軸之間的錯開delay時間)
    /**
     * 每軸滾動時間
     * 1.可以設定全部軸一樣的時間 reelRoll: 2
     * 2.也可以設定每軸不一樣的時間 reelRoll: {0:2,1:2.5,2:3,3:2,4:2}
     */
    reelRoll?: Ms | ReelDelayMap;
  };

  //-停軸/收束相關
  stop?: {
    earlyStop?: Ms;//--提前停軸時間(要滿足全部軸在某時間內停完,所以要提早進入stop的指令)
    perReel?: Ms //--停轉前的準備時間(這是給動畫/音效用的準備時間);
    staggerStop?: Ms;//--每軸停輪錯開時間(軸與軸之間的錯開delay時間)
    afterAllStop?: Ms;//--全部軸停好後,到開始秀的等待時間
    fastStopExtra?: Ms;//--快速停軸時,額外減少的時間
  };
  //-每局/每輪相關
  round?:
  {
    roundStep_NG_noWin?: Ms;//--局間停頓
    roundStep_NG_win?: Ms;//--局間停頓
    roundStep_NG_JP?: Ms;//--局間停頓
    roundStep_NG_wild?: Ms;//--局間停頓
    roundStep_RS_noWin?: Ms;//--局間停頓
    roundStep_RS_win?: Ms;//--局間停頓
    roundStep_RS_JP?: Ms;//--局間停頓
    roundStep_RS_wild?: Ms;//--局間停頓
    roundStep_FG_noWin?: Ms;//--局間停頓
    roundStep_FG_win?: Ms;//--局間停頓
    roundStep_FG_JP?: Ms;//--局間停頓
    roundStep_FG_wild?: Ms;//--局間停頓
    //roundStep_EXTRA?: Ms;//--吻合條件要加入局間停頓時間用的
    //interRoundDelay_NG?: Ms;//--NG局間停頓(新局)
    interRoundDelay_FG?: Ms;//--FG轉多久停止
    interRoundDelay_RS?: Ms;//--RS轉多久停止
    interRoundDelay_AUTO?: Ms;//--自動轉局間停頓(跟server要資料的間隔時間)

  }

  score?: {
    in?: Ms;//--得分進場時間
    out?: Ms;//--得分退場時間
    loop?: Ms;//--得分顯示loop時間
    fastLoop?: Ms;//--快速得分顯示loop時間
  },
  //-結算/得分顯示相關
  result?: {
    interruptTime?: Ms;//--可中斷的時間點
    interruptEndTime?: Ms;//--中斷後移動到的時間點
    noWinWait?: Ms;//--沒有得分的等待時間
    beforeShowWin?: Ms;//--秀得分前的等待時間
    totalShowWin?: Ms;//--秀全部得分的時間
    afterShowAll?: Ms;//--第一次秀全部後進入輪播前
    eachWin?: Ms;//--每條線之間的間隔時間(輪播間格時間)
    showScoreAppear?: Ms;//--顯示得分出現時間(開始秀得分)
    beforeShowSequence?: Ms;//--秀輪播前的等待時間
    //showScoreAppearDelay?: Ms; //--顯示得分出現持續時間(結束接退場)-要刪除
  };
  //-聽牌相關
  forecast?: {
    totalTime?: Ms;//--預測總時間
    eachReel?: Ms;//--每個預報軸的時間
  }

  Jackpot?: {
    beforeWait?: Ms;//--秀大獎前的等待時間(有得分又有大獎)
    interruptTime?: Ms;//--可中斷的時間點
    interruptEndTime?: Ms;//--中斷後移動到的時間點
    runDuration?: Ms;//--秀彩金的時間(背景音樂6S,但大約在5S就差不多了)
    loopDuration?: Ms;//--loop時間(背景音樂6S,但大約在5S就差不多了)
    fastLoopDuration?: Ms;//--中斷下的loop時間
  }

  respin?: {
    beforeBoardWait?: Ms;//--開始前的等待時間
    openBoard?: Ms;//--開啟RS面板時間
    duringBoard?: Ms;//--RS面板持續時間
    showRSTimes?: Ms;//--顯示RS次數時間
    closeBoard?: Ms;//--關閉RS面板時間
  }

  fg?: {
    beforeWait?: Ms;//--開始前的等待時間(scatter拿去用了)
    beforeOpenWait?: Ms;//--開啟FG面板前的等待時間
    openBoard?: Ms;//--開啟FG面板時間
    duringBoardIn?: Ms;//--FG面板持續時間(進場)
    duringBoardOut?: Ms;//--FG面板持續時間(退場)
    showFgTimes?: Ms;//--顯示FG次數時間
    closeBoard?: Ms;//--關閉FG面板時間
  }

  //-Wild/特殊機制相關（可視專案略過）
  wild?: {
    beforeWait?: Ms;//--wild秀前的等待時間
    appear?: Ms;
    move?: Ms;
    noMove?: Ms;
    afterWildWait?: Ms;//--wild秀完後的等待時間
    others?: IOtherDelayMap;
  };
  //-Bonus/FG 相關
  bonus?: {
    enter?: Ms;
    betweenRounds?: Ms;
    exit?: Ms;
  };
  //-一般 UI/流程銜接
  ui?: {
    showBottomText?: Ms;
    collectScore?: Ms;
    autoNextRound?: Ms;
    //loopBoard?: Ms;//-FG轉場面板的loop時間
  };
  //-場景/面板轉場
  transitions?: {
    fadeIn?: Ms;
    fadeOut?: Ms;
  };

  other?: IOtherDelayMap//--其他額外的延遲時間
  //[key: string]: string | IOtherDelayMap | null;//--允許動態擴增
}
