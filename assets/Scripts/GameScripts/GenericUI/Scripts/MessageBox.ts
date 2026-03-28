import { _decorator, Component, director, Node } from 'cc';
import { MessageBoxUI } from './MessageBoxUI';
import { Debug } from '../../../Utils/Core';


const { ccclass, property } = _decorator;

@ccclass('MessageBox')
export class MessageBox extends Component {

    @property(MessageBoxUI)
    private msgBoxUI: MessageBoxUI;

    private static _instance: MessageBox = null;

    public static get instance(): MessageBox {
        let component = director.getScene().getComponentInChildren(MessageBox);
        if (this._instance === null || this._instance !== component) {
            if (component) {
                this._instance = component;
            }
            else {
                Debug.LogError("MessageBox _instance is null");
                return null;
            }
        }
        return this._instance;
    }

    public init() {
        this.msgBoxUI.init();
    }

    public showMsgBox(title: string, content: string, isShowConfirm: boolean = true, confirmCallback: Function = null, isShowClose: boolean = false, closeCallback: Function = null) {
        Debug.Log("showMsgBox");
        this.msgBoxUI.showUI(title, content, isShowConfirm, confirmCallback, isShowClose, closeCallback);
    }

    /*
    public showNetworkError(reason: string = '') {
        Debug.Log("showNetworkError");
        let content = Localization.instance.t('ErrorMessage.UnstableConnection');
        content = content.replace(MessageReplaceFlag, `\n(${reason})`);
        this.showMsgBox(Localization.instance.t('ErrorTitle.UnstableConnection'), content, false, () => {
            //location.reload();
        });
    }
    */

}


