import { _decorator, Component, Label, Node, RichText, UIOpacity, UITransform, Vec3 } from 'cc';
import { KeySpriteFramePair, Utility } from '../../../Utils/Core';
import { Localization } from '../../Localization';

const { ccclass, property } = _decorator;
const TIP_WIDTH: number = 588;
enum TipMode {
    Empty = 0,
    First = 1,
    Idle = 2,
    Gaming = 3,
}

@ccclass('BottomBarUI')
export class BottomBarUI extends Component {

    @property(RichText)
    private tipRichText: RichText;

    @property(Node)
    private winGroup: Node;

    @property(Label)
    private winScoreLabel: Label;

    @property(Label)
    private totalBetLabel: Label;

    @property(Label)
    private balanceLabel: Label;

    @property(Label)
    private debugLabels: Label[] = [];

    @property(Label)
    private logoLabels: Label[] = [];

    @property(Label)
    private versionLabels: Label[] = [];

    private bottomFistShowText: string = "";

    private bottomIdleShowTexts: string[] = [];

    private bottomGamingShowTexts: string[] = [];

    private tipMode: TipMode = TipMode.Empty;

    init() {
        // console.log("BottomBarUI init");
        // 關閉 Logo顯示功能
        this.logoLabels.forEach(label => {
            label.node.active = false;
        });
        this.bottomFistShowText = 'GameMsg_000_0_1';

        this.bottomIdleShowTexts = [
            'GameMsg_000_2_1',
            'GameMsg_000_2_2',
            'GameMsg_000_2_3',
        ];

        this.bottomGamingShowTexts = ['GameMsg_000_1_1'];

        this.showWinScore(0);
        this.setTotalBet(0);
        this.setBalance(0);

        this.tipRichText.getComponent(UITransform).width = TIP_WIDTH;
    }

    public showWinScore = (score: number) => {
        let originalActive = this.winGroup.active;
        this.setWinScoreActive();
        this.winScoreLabel.string = `${score.numberComma()}`;
        if (!originalActive) {
            this.winGroup.getComponent(UIOpacity).opacity = 0;
            this.scheduleOnce(() => {
                this.winGroup.getComponent(UIOpacity).opacity = 255;
            }, 0);
        }
    }

    // 一進入遊戲時要先Call這個Function，顯示歡迎文字
    public showBottomTextFirst() {
        this.setTipActive();
        this.setTipTextWithKey(this.bottomFistShowText, TipMode.First);
    }

    // 開始一局，沒有自動，進入Gaming狀態時，要Call這個Function，隨機顯示一個文字
    public showBottomTextGaming() {
        this.setTipActive();
        let len = this.bottomGamingShowTexts.length;
        let id = Utility.getRandomInt(len);
        this.setTipTextWithKey(this.bottomGamingShowTexts[id], TipMode.Gaming);
    }

    // 結束一局，沒有自動，回到Idle狀態時，要Call這個Function，隨機顯示一個文字
    public showBottomTextIdle() {
        this.setTipActive();
        let len = this.bottomIdleShowTexts.length;
        let id = Utility.getRandomInt(len);
        this.setTipTextWithKey(this.bottomIdleShowTexts[id], TipMode.Idle);
    }

    public addGamingShowTexts(texts: string[]) {
        this.setTipActive();
        for (let text of texts) {
            this.bottomGamingShowTexts.push(text);
        }
    }

    public showBottomTextEmpty() {
        this.setTipActive();
        this.setTipText('', TipMode.Empty);
    }

    public setTotalBet = (totalBet: number) => {
        this.totalBetLabel.string = `${totalBet.numberComma()}`;
    }

    public setBalance = (balance: number) => {
        this.balanceLabel.string = `${balance.numberComma()}`;
    }

    public addBottomRichTextSprite(spriteFrameMap: KeySpriteFramePair[]) {
        this.tipRichText.addSpriteFrame(spriteFrameMap);
    }

    private setWinScoreActive() {
        this.winGroup.active = true;
        this.tipRichText.node.active = false;
    }

    private setTipActive() {
        this.winGroup.active = false;
        this.tipRichText.node.active = true;
    }

    public setDebugText(text: string) {
        for (let label of this.debugLabels) {
            label.string = text;
        }
    }

    public setVersionText(text: string) {
        for (let label of this.versionLabels) {
            label.string = text;
        }
    }

    public setLogoText(text: string) {
        for (let label of this.logoLabels) {
            label.string = text;
        }
    }

    private setTipText(text: string, tipMode: TipMode) {
        this.tipMode = tipMode;
        this.tipRichText.string = Utility.replaceRichTextImgKey(text); //588
        let tipTransform = this.tipRichText.getComponent(UITransform);
        if (tipTransform.width <= TIP_WIDTH) {
            this.tipRichText.node.scale = Vec3.ONE;
        }
        else {
            let scaleNum = TIP_WIDTH / tipTransform.width;
            this.tipRichText.node.scale = new Vec3(scaleNum, scaleNum, 1);
            if ((tipTransform.width / TIP_WIDTH) > 1.2) {
                console.error("tipRichText is too much");
            }
        }
    }

    private setTipTextWithKey(textKey: string, tipMode: TipMode) {
        let text = Localization.instance.t(textKey);
        this.setTipText(text, tipMode);
    }
}


