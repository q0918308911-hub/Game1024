/**
 * 基本顯示中線得分動畫流程接口
 * TIMatchInfo=中線得分資料類型IMatchInfoForRound
 * TWinScore=中線得分動畫資料類型WinScoreData
 */
export interface IBasicShowAniProcess<TIMatchInfo, TWinScore> {
    init(): void;//--初始化流程
    register(): void;//--註冊流程
    //=====移除處理=====
    cancelAllDelays(): void;//--取消所有延遲
    stopAndRemoveAllAnis(): void;//--強制移除所有動畫

    //=== 統一清理入口（start spin 都呼叫這個） ===
    cleanAllPlayingAniForNewStart(): Promise<void>
    resetRoundData(): void;//--重置Round資料(還在該局內)
    resetAllData(): void;//--重置所有資料(包含該局內的)
    cleanAllPlayingBeforeNewStart(): Promise<void>;//--在新一局開始前，清除所有正在播放的動畫(尚未交還動畫,只有停止播放)

    //=====跳過流程=====
    skipCurrentProcess(): void;//--跳過目前的流程(包含動畫)

    //=====資料處理與交換=====
    //解析回合得分資料
    beforeProcessWinScoreData(winScoreData: TWinScore, lines?: TIMatchInfo[], otherInfo?: any): Promise<{ hasWin: boolean, bigWin: boolean }>;//--在處理得分資料前的動作(可修改資料)
    //外部統一入得分/非得分表演
    //runShowProcess(winScoreData?: W, lines?: T[]): Promise<boolean>;//--執行顯示流程(包含動畫)
    runShowProcess(showWinFlag: boolean): Promise<boolean>;//--執行顯示流程(包含動畫)

    //=====播放處理=====
    playNoWinInThisRound(lines?: TIMatchInfo[]): Promise<void>;
    playWinInThisRound(winScoreData: TWinScore, lines?: TIMatchInfo[]): Promise<void>
    resetWinSore(): void;//--重置得分
    showWinScoreAni(score: number, multiplier?: number, showBottomText?: boolean): Promise<void>;//--顯示得分動畫
    showScoreForBottomText(score?: number): void;//--顯示底部文字
    stopAndHideConnectBoxAni(): void;//--強制中斷連線中動畫(單純的指線/框的動畫)
    stopAndResetOtherAni(): void;//--20260102:強制停止/重置其他動畫
    //stopAndPauseWinAni(): void;//--強制移除/中斷得分動畫(單純的指線/框的動畫)
    playOtherWinShowAni(): void;//--在全秀之後要走的分支
    playWildAni(): void;//--播放wild動畫
    playBonusAni(): void;//--播放bonus動畫
    processBeforePlaySequence(): Promise<void>;//--輪播前的準備工作
    processResetAni(): Promise<void>;//--重置動畫狀態
    playMultipleSequence(): Promise<void>;//--輪播動畫
    stopMultipleSequence(): void;//--停止輪播
    playShowAnimation(): void;
    stopShowAnimation(): void;
    showBigWinAni(winScoreData: TWinScore, lines?: TIMatchInfo[]): Promise<void>;//--顯示大贏動畫
    showAndWaitForVerticalAni(totalScore: number): Promise<void>;//--在FG當中顯示垂直動畫
    stopShowVerticalAni(): void;//--停止垂直動畫
    //processBigWin(): Promise<void>;//--處理大贏動畫的流程
    //processNormalWin(): Promise<void>;//--處理一般贏動畫的流程
    runTest(value?: any): Promise<void> | void;//--可選測試模式
}
