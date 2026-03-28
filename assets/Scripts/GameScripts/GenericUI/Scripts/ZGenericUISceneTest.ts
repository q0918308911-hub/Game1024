import { _decorator, Button, Color, color, Component, DynamicAtlasManager, dynamicAtlasManager, EventHandler, EventTouch, macro, Node, NodeEventType, SpriteFrame } from 'cc';
import { GenericUIManager } from './GenericUIManager';
import { BuyFeatureCardInfo } from './BuyFeatureCard';
import { PlayerInfo } from '../../Networks';
import { GameSetting, SlotRelayLang } from '../../Definition';

const { ccclass, property } = _decorator;

@ccclass('ZGenericUISceneTest')
export class ZGenericUISceneTest extends Component {

    @property(Node)
    private button: Node;

    @property(Node)
    private spriteNode: Node;

    @property(SpriteFrame)
    private featureSpriteFrame: SpriteFrame;

    @property(Node)
    private canvasNode: Node;

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

    start() {
        // const clickEventHandler = new EventHandler();
        // clickEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
        // clickEventHandler.component = 'ZGenericUISceneTest';// 这个是脚本类名
        // clickEventHandler.handler = 'onBtnClick';
        // clickEventHandler.customEventData = 'foobar';
        // const button = this.button.getComponent(Button);
        // button.clickEvents.push(clickEventHandler);

        // this.spriteNode.on(NodeEventType.MOUSE_DOWN, () => {
        //     Debug.Log("Sprite click");
        // });
        // Node.EventType

        // let name = this.name;
        // Debug.Log(name);
        // Debug.Log(this.constructor.name);
        // Debug.Log(name.indexOf('<'));
        // Debug.Log(name.indexOf('>'));
        // Debug.Log(name.slice(name.indexOf('<'), name.indexOf('>')));
        // Utility.addEventHandlerToButton(this.button, this, this.onBtnClick, 'wahaha');

        GenericUIManager.instance.init(SlotRelayLang.tw, this.canvasNode);

        // 為了測試，直接把GameSetting裡面的下注金額列表設定進去，一般要透過PlayerInfo來設定
        GenericUIManager.instance.setBetSelectInfos(GameSetting.platformBetValueList);
        GenericUIManager.instance.setBetValue(GameSetting.platformBetValueList[0]);
        // GenericUIManager.instance.updateExtraBetTipSpriteFrame("GenericUI/ExtraBet_info")
        // GenericUIManager.instance.setBuyBonusIconBGInfo(153, new Color(1, 255, 1)); // 60% opacity
        PlayerInfo.updateBetValueList(GameSetting.platformBetValueList);
        // GenericUIManager.instance.setBetSelectInfos(GenericUIConfig.BET_VALUE_LIST, PlayerInfo.betMin, PlayerInfo.betMax);
        // GenericUIManager.instance.setTwoLevelTurboMode(true);
        let cardInfo0 = new BuyFeatureCardInfo();
        cardInfo0.title = "Card 0 Title";
        cardInfo0.content = "Card 0 Content";
        cardInfo0.icon = this.featureSpriteFrame;
        cardInfo0.multiply = 20;

        let cardInfo1 = new BuyFeatureCardInfo();
        cardInfo1.title = "Card 1 Title";
        cardInfo1.content = "Card 1 Content";
        cardInfo1.icon = this.featureSpriteFrame;
        cardInfo1.multiply = 40;

        let cardInfo2 = new BuyFeatureCardInfo();
        cardInfo2.title = "Card 2 Title";
        cardInfo2.content = "Card 2 Content";
        cardInfo2.icon = this.featureSpriteFrame;
        cardInfo2.multiply = 60;

        let cardInfo3 = new BuyFeatureCardInfo();
        cardInfo3.title = "Card 3 Title";
        cardInfo3.content = "Card 3 Content";
        cardInfo3.icon = this.featureSpriteFrame;
        cardInfo3.multiply = 80;

        let cardInfo4 = new BuyFeatureCardInfo();
        cardInfo4.title = "Card 4 Title";
        cardInfo4.content = "Card 4 Content";
        cardInfo4.icon = this.featureSpriteFrame;
        cardInfo4.multiply = 100;
        GenericUIManager.instance.setBuyFeatureCardInfo([cardInfo0, cardInfo1]);
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
    }


    update(deltaTime: number) {

    }

    onBtnClick1(event: EventTouch, data: string) {
        // GenericUIManager.instance.featureSettingUI.setToSpinMode();
        GenericUIManager.instance.setBetSelectUIBetValue(100);
    }

    onBtnClick2(event: EventTouch, data: string) {
        // GenericUIManager.instance.featureSettingUI.setToNormalMode();
        GenericUIManager.instance.setFeatureSettingUIIconsActive(true);
    }
}


