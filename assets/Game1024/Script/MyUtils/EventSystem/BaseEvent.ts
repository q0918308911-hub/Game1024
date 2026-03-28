/**
 * Created by EricHuang on 2016/4/14.
 */
import { EventDispatcher } from './EventDispatcher';

export class BaseEvent {
    public static COMPLETE: string = "H5Event_complete";
    public static CHANGE: string = "H5Event_change";
    public static REMOVED: string = "H5Event_removed";
    public static IO_ERROR: string = "H5Event_ioError";

    protected _target: EventDispatcher;//---事件流中的目標(觸發者)--事件流的目標階段
    protected _currentTarget: EventDispatcher;//--有註冊事件監聽or正在處理事件者--事件流的冒泡/目標/捕獲階段
    //--PS只有在事件流的<目標階段>target與currentTarget才會相同
    //--總之~target指的就是發送者的本身,currenttarget指的是當前事件活動的對象
    //protected _bubbles:boolean;
    protected _sendObject: any;//---用於隨事件夾帶的值
    protected _type: string;
    protected _stopOtherListener: boolean = false;//---不要讓其他的監聽接受
    protected _stopCommunication: boolean = false;//---阻斷事件流的傳遞
    constructor(type: string, obj: any = null) {
        this._type = type;
        //this._bubbles=bubbles;
        this._currentTarget = null;
        this._target = null;
        this._sendObject = obj;
    }

    get type(): string { return this._type; }
    get target(): EventDispatcher { return this._target; }
    get currentTarget(): EventDispatcher { return this._currentTarget; }
    get sendObject(): any { return this._sendObject; }
    //get bubbles():boolean{return this._bubbles;}
    get stopOtherListener(): boolean { return this._stopOtherListener; }
    get stopCommunication(): boolean { return this._stopCommunication; }

    set sendObject(value: any) { this._sendObject = value }
    set target(value: EventDispatcher) { this._target = value; }
    set currentTarget(value: EventDispatcher) { this._currentTarget = value; }
    set stopOtherListener(value: boolean) { this._stopOtherListener = value; }
    set stopCommunication(value: boolean) { this._stopCommunication = value; }

    //----自己override吧=..=
    public clone(): BaseEvent {
        return new BaseEvent(this._type, this._sendObject);
    }

}

