import { _decorator, Component, Label, Node } from 'cc';
import { Utility } from '../../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('GameRecord')
export class GameRecord extends Component {
    @property(Label)
    private recordTime: Label;

    @property(Label)
    private recordID: Label;

    @property(Label)
    private playerID: Label;

    @property(Label)
    private betValue: Label;

    @property(Label)
    private winScore: Label;

    @property(Label)
    private originalScore: Label;

    @property(Label)
    private finalScore: Label;

    protected id: string = ''; //交易序號
    protected slotdata: string = ''; //盤⾯資料
    protected time: string = ''; //timestamp (utc+0)
    protected version: string = ''; //版本號
    protected bet: string = ''; //押注⾦額
    protected win: string = ''; //贏分
    protected account: string = ''; //玩家id
    protected total: string = ''; //玩家spin 結束後財產
    protected before_total: string = ''; //玩家spin 開始前財產

    protected timeFormat: string = '';

    init() {
        let url = window.location.href;
        let urlParams: Map<string, string> = Utility.getURLParams(url);

        if (!Utility.isDev()) {
            this.slotdata = urlParams.get('slotdata');
            this.id = urlParams.get('id');
            this.time = urlParams.get('time');
            this.version = urlParams.get('version');
            this.bet = urlParams.get('bet');
            this.win = urlParams.get('win');
            this.account = urlParams.get('account');
            this.total = urlParams.get('total');
            this.before_total = urlParams.get('before_total');
        }
        else {
            this.slotdata = '';
            this.id = '12345';
            this.time = '1721962280';
            this.version = '1.5';
            this.bet = '300';
            this.win = '100';
            this.account = 'myID';
            this.total = '800';
            this.before_total = '1000';
        }

        this.timeFormat = this.getTimeFormatByTimestamp(parseInt(this.time));
        this.setRecordID(this.id);
        this.setPlayerID(this.account);
        this.setRecordTime(this.timeFormat);
        this.setBetValue(this.bet);
        this.setWinScore(this.win);
        this.setOriginalScore(this.before_total);
        this.setFinalScore(this.total);
    }

    setRecordTime(time: string) {
        this.recordTime.string = time;
    }

    setRecordID(id: string) {
        this.recordID.string = id;
    }

    setPlayerID(id: string) {
        this.playerID.string = id;
    }

    setBetValue(value: string) {
        this.betValue.string = parseFloat(value).fixed().numberComma();
    }

    setWinScore(score: string) {
        this.winScore.string = parseFloat(score).fixed().numberComma();
    }

    setOriginalScore(score: string) {
        this.originalScore.string = parseFloat(score).fixed().numberComma();
    }

    setFinalScore(score: string) {
        this.finalScore.string = parseFloat(score).fixed().numberComma();
    }

    private getTimeFormatByTimestamp(timestamp: number): string {
        let date = new Date(timestamp * 1000);

        // 使用 toLocaleString 方法并传递时区选项
        let options: any = {
            timeZone: 'Asia/Taipei', // 设定时区，例如：Asia/Taipei
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // 使用24小时制
        };

        let formattedDateTime = date.toLocaleString('zh-TW', options,);
        return formattedDateTime;
    }
}


