import { _decorator, Component, Node } from 'cc';
import { SlotRelayLang } from './Config';
const { ccclass, property } = _decorator;

@ccclass('GameSetting')
export class GameSetting {

    static _gameLang: SlotRelayLang = SlotRelayLang.tw

    static _gameLogo: string = "ApexWin";

    static isShowAWLogo: boolean = true; // 是否顯示AW Logo，預設為true

    static isShowBottomAWLogo: boolean = true; // 是否顯示底部AW Logo，預設為true

    static isShowCoinAWLogo: boolean = true; // 是否顯示硬幣AW Logo，預設為true 但暫時不使用 先預留欄位

    static shouldSwapThousandAndDecimalSeparators: boolean = false; // 是否需要交換千分位和小數點符號，預設為false

    static keyboardLock: boolean = false; // 是否鎖定鍵盤輸入，預設為false

    static historyURL: string = "https://dev-gamerecord.apex-win.com/#/game-list?lang=[lang]&history=[json]";

    static payTableURL: string = "https://gameapi.apex-win.com/ApexWin?gameID=[gameID]&lang=[lang]&page=introduction";

    static ruleURL: string = "https://gameapi.apex-win.com/ApexWin?gameID=[gameID]&lang=[lang]&page=operation";

    static customData: string = ""; // 自訂資料欄位，預設為空字串

    static customDataJson: any = {}; // 自訂資料欄位的Json物件，預設為 {}

    // 該平台所有可提供下注的金額列表，由Server提供，這邊先寫台灣站的設定，讓離線時可以使用
    static _platformBetValueList: number[] = [
        100, 200, 300, 500, 800, 1000, 1500, 2000, 2500, 3000, 5000, 5500,
        6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000, 20000, 30000, 50000
    ];

    static get gameLogo(): string {
        return this._gameLogo;
    }

    static set gameLogo(value: string) {
        this._gameLogo = value;
    }


    static get gameLang(): SlotRelayLang {
        return this._gameLang;
    }

    static set gameLang(value: SlotRelayLang) {
        this._gameLang = value;
    }

    static get platformBetValueList(): number[] {
        return this._platformBetValueList;
    }

    static set platformBetValueList(value: number[]) {
        this._platformBetValueList = value;
    }
}


export class GameStatus {
    public static isBuyBonusOpen: boolean = false;
    public static isExtraBetOpen: boolean = false;
    public static isBuyBonusOn: boolean = false;
    public static isExtraBetOn: boolean = false;
    public static isEnterFromGameStart: boolean = false; // 是否從遊戲開始畫面進入遊戲
}