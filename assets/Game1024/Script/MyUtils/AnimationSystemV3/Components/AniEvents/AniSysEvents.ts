/**
 * @author: Eric
 * @description: AniSysEvents 定義
 * 看你要透過eventTarget/Notification/其他方式傳送都可以
 */

export enum ANI_SYS_EVENTS {
    CTRL_LOADED = 'ctrl_loaded',
    CTRL_UNLOADED = 'ctrl_unloaded',
    CTRL_PLAY_ANI_START = 'ctrl_play_ani_start',
    CTRL_PLAY_ANI_END = 'ctrl_play_ani_end',
    CTRL_DESTROY = 'ctrl_destroy'
}




//--透過事件傳送出去的物件基本格式
export interface AniSysEventData {
    eventName: ANI_SYS_EVENTS;
    ctrlId: string;
    ctrlUuid?: string;
    aniState?: string;
    [key: string]: any;
}