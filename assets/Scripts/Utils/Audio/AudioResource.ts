import { _decorator, AudioClip, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioResource')
export class AudioResource extends Component {

    @property(AudioClip)
    public musicAudioClipList: AudioClip[] = []

    @property(AudioClip)
    public soundAudioClipList: AudioClip[] = []
}


