import { _decorator, Component, SpriteFrame, Label, Toggle, EditBox, Color, Node } from "cc";
import { ErrorHandler } from "db://assets/Scripts/ErrorHandler/ErrorHandler";
import { UnitTest } from "db://assets/Scripts/TestTool/TestableFunction";
import { ErrorCode } from "db://assets/WaninPlayer/WaninPlayer";
import { BuyFeatureCardInfo } from "../BuyFeatureCard";
import { GenericUIManager } from "../GenericUIManager";
import { MessageBox } from "../MessageBox";
import { GameSetting, SlotRelayLang } from "../../../Definition";
import { PlayerInfo } from "../../../Networks";
import { Utility } from "db://assets/Scripts/Utils/Core";


const { ccclass, property } = _decorator;

@ccclass('GenericUISceneUnitTest')
export class GenericUISceneUnitTest extends Component {

    @property(Node)
    private button: Node;

    @property(Node)
    private spriteNode: Node;

    @property(SpriteFrame)
    private featureSpriteFrame: SpriteFrame;

    @property(Node)
    private canvasNode: Node;

    @property(Node)
    private testGroupNode: Node;

    @property(Label)
    private testGroupActiveButtonLabel: Label;

    @property(Toggle)
    private twoTurboToggle: Toggle;

    @property(EditBox)
    private winScoreEditBox: EditBox;

    @property(EditBox)
    private bottomTextEditBox: EditBox;

    @property(EditBox)
    private updateBalanceEditBox: EditBox;

    @property(EditBox)
    private minBetValueEditBox: EditBox;

    @property(EditBox)
    private maxBetValueEditBox: EditBox;

    @property(EditBox)
    private cardTitleEditBox: EditBox;

    @property(EditBox)
    private cardContentEditBox: EditBox;

    @property(EditBox)
    private cardMultipleEditBox: EditBox;

    @property(SpriteFrame)
    private normalSpriteBG: SpriteFrame;

    @property(SpriteFrame)
    private pressedSpriteBG: SpriteFrame;

    @property(SpriteFrame)
    private hoverSpriteBG: SpriteFrame;

    @property(SpriteFrame)
    private disabledSpriteBG: SpriteFrame;

    @property(SpriteFrame)
    private normalSpriteCrown: SpriteFrame;

    @property(SpriteFrame)
    private pressedSpriteCrown: SpriteFrame;

    @property(SpriteFrame)
    private hoverSpriteCrown: SpriteFrame;

    @property(SpriteFrame)
    private disabledSpriteCrown: SpriteFrame;

    private spinIndex: number = 0;
    private betValue: number = -1;
    private cardInfoList: BuyFeatureCardInfo[] = [];

    start() {
        GenericUIManager.instance.init(SlotRelayLang.tw, this.canvasNode);

        // 為了測試，直接把GameSetting裡面的下注金額列表設定進去，一般要透過PlayerInfo來設定
        this.betValue = GameSetting.platformBetValueList[0];
        GenericUIManager.instance.setBetSelectInfos(GameSetting.platformBetValueList);
        GenericUIManager.instance.setBetValue(GameSetting.platformBetValueList[0]);
        GenericUIManager.instance.onBetSelectBtnClickCallback = this.onGenericUIBetSelectBtnClick.bind(this);
        PlayerInfo.updateBetValueList(GameSetting.platformBetValueList);

        GenericUIManager.instance.setExtraBetTipText("GenericUI/ExtraBet_info")
        GenericUIManager.instance.setBuyBonusIconBGInfo(153, new Color(1, 255, 1)); // 60% opacity
        GenericUIManager.instance.onAutoSpinStartClickCallback = this.onGenericUIAutoSpinStartClick.bind(this);
        GenericUIManager.instance.onSpinBtnClickCallback = this.onGenericUISpinClick.bind(this);

        GenericUIManager.instance.setBuyBonusOpen();
        GenericUIManager.instance.setExtraBetOpen(1.2)
        GenericUIManager.instance.onBuyFeatureModeChangeCallback = (mode, multiply, cardIndex) => {
            console.log(`Buy Feature Mode Changed: ${mode}, Multiply: ${multiply}, Card Index: ${cardIndex}`);
        };

        // GenericUIManager.instance.setBuyBonusBtnCustomSprite(
        //     this.normalSpriteBG, this.pressedSpriteBG, this.hoverSpriteBG, this.disabledSpriteBG,
        //     this.normalSpriteCrown, this.pressedSpriteCrown, this.hoverSpriteCrown, this.disabledSpriteCrown,
        //     "BuyFG_btn_txt"
        // );

        this.testGroupNode.active = false;
        MessageBox.instance.init();
    }

    public setTestGroupActive() {
        this.testGroupNode.active = !this.testGroupNode.active;
        if (this.testGroupNode.active) {
            this.testGroupActiveButtonLabel.string = "關閉測試按鈕";
        }
        else {
            this.testGroupActiveButtonLabel.string = "開啟測試按鈕";
        }
    }

    @UnitTest()
    public setTwoTurboActive(isOpen?: any) {
        if (typeof isOpen !== "boolean") {
            isOpen = "";
        }

        let isTwoLevelTurboOpen: boolean;
        if (isNaN(isOpen) || isOpen === "") {
            isTwoLevelTurboOpen = this.twoTurboToggle.isChecked;
        } else {
            isTwoLevelTurboOpen = isOpen;
        }

        GenericUIManager.instance.setTwoLevelTurboMode(isTwoLevelTurboOpen);
    }

    @UnitTest()
    public showBottomTextWinScore(input?: any) {
        let score: number;

        if (typeof input === "number") {
            score = input;
        }
        else {
            score = Number(this.winScoreEditBox.string);
        }

        GenericUIManager.instance.showBottomTextWinScore(score);
    }

    @UnitTest()
    public showBottomText(input?: any) {
        let text: string;

        if (typeof input === "string") {
            const trimmed = input.trim();
            if (trimmed === "") {
                text = this.bottomTextEditBox.string.trim();
            } else {
                text = trimmed;
            }
        }
        else {
            text = this.bottomTextEditBox.string.trim();
        }

        GenericUIManager.instance.setBottomText(text);
    }

    @UnitTest()
    public setBalance(input?: any) {
        let balance: number;

        if (typeof input === "number") {
            balance = input;
        }
        else {
            balance = Number(this.updateBalanceEditBox.string);
        }

        PlayerInfo.balance = balance;
        GenericUIManager.instance.setBalance(PlayerInfo.balance);
    }

    @UnitTest()
    public setBuyFeatureCardInfo(title?: any, content?: any, multiply?: any) {
        const isButtonEvent = (v: any) => v && typeof v === "object" && "type" in v;

        if (isButtonEvent(title)) title = undefined;
        if (isButtonEvent(content)) content = undefined;
        if (isButtonEvent(multiply)) multiply = undefined;

        const finalTitle = (typeof title === "string" ? title.trim() : this.cardTitleEditBox.string.trim());
        const finalContent = (typeof content === "string" ? content.trim() : this.cardContentEditBox.string.trim());
        const multipleStr = String(typeof multiply === "number" ? multiply : (multiply ?? this.cardMultipleEditBox.string)).trim();
        const finalMultiply = Number(multipleStr);

        if (!finalTitle) {
            console.warn("⚠️ 請輸入卡片標題！");
            return;
        }

        if (!finalContent) {
            console.warn("⚠️ 請輸入卡片內容！");
            return;
        }

        if (finalMultiply <= 0) {
            console.warn("⚠️ 倍率必須大於 0！");
            return;
        }

        const cardInfo = new BuyFeatureCardInfo();
        cardInfo.title = finalTitle;
        cardInfo.content = finalContent;
        cardInfo.icon = this.featureSpriteFrame;
        cardInfo.multiply = finalMultiply;

        this.cardInfoList.push(cardInfo);
        GenericUIManager.instance.setBuyFeatureCardInfo(this.cardInfoList);
    }

    @UnitTest()
    public removeBuyFeatureCardInfo() {
        this.cardInfoList = [];
        GenericUIManager.instance.setBuyFeatureCardInfo(this.cardInfoList);
    }

    @UnitTest()
    public setBetSelectInfos(minInput?: any, maxInput?: any) {
        const isButtonEvent = (v: any) => v && typeof v === "object" && "type" in v;
        if (isButtonEvent(minInput)) minInput = undefined;
        if (isButtonEvent(maxInput)) maxInput = undefined;

        const minStr = String(minInput ?? this.minBetValueEditBox.string).trim();
        const maxStr = String(maxInput ?? this.maxBetValueEditBox.string).trim();

        if (!minStr || !maxStr) {
            console.warn("⚠️ 請輸入最小值與最大值！");
            return;
        }

        const min = Number(minStr);
        const max = Number(maxStr);

        if (min > max) {
            console.warn("⚠️ 最小值不可大於最大值！");
            return;
        }

        if (max >= GameSetting.platformBetValueList[0]) {
            const filtered = this.updateBetValueList(min, max, GameSetting.platformBetValueList);
            GenericUIManager.instance.setBetSelectUIBetValue(filtered[0]);
            GenericUIManager.instance.setBetSelectInfos(filtered);
        } else {
            console.warn("⚠️ 輸入的最大值小於押注額列表的最小值！");
        }
    }

    private onGenericUIAutoSpinStartClick(autoTimes: number) {
        this.autoSpin();
    }

    private autoSpin() {
        if (GenericUIManager.instance.checkAutoStatus()) {
            this.spinIndex++;
            this.spin();
            if (this.checkBalanceEnough()) {
                Utility.waitPromise(1).then(() => {
                    this.autoSpin();
                });
            }
        }
        else {
            this.spinIndex = 0;
            GenericUIManager.instance.setMainUIToNormalMode();
        }
    }

    private onGenericUISpinClick() {
        this.spin();
    }

    private spin() {
        if (!this.checkBalanceEnough()) {
            if (GenericUIManager.instance.isAutoMode) {
                GenericUIManager.instance.stopAutoMode();
                GenericUIManager.instance.setMainUIToNormalMode();
            }
            return;
        }

        GenericUIManager.instance.setMainUIStopBtnEnabled();
        console.log("spin: " + this.spinIndex);
    }

    private checkBalanceEnough(): boolean {
        if (PlayerInfo.balance < this.betValue) {
            ErrorHandler.Instance.TriggerError(ErrorCode.Client_BetBankruptcy, true);
            return false;
        }
        return true;
    }

    private onGenericUIBetSelectBtnClick(bet: number): void {
        this.betValue = bet;
    }

    private updateBetValueList(min: number, max: number, totalBetValueList: number[]): number[] {
        const betValueList: number[] = [];

        for (const value of totalBetValueList) {
            if (value >= min && value <= max) {
                betValueList.push(value);
            }
        }
        return betValueList;
    }
}



