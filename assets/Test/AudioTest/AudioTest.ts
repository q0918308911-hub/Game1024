import { _decorator, AudioClip, AudioSource, Component, Node } from 'cc';
import { AudioManager } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('AudioTest')
export class AudioTest extends Component {

    @property([AudioClip])
    musicAudioClips: AudioClip[] = [];

    @property([AudioClip])
    soundAudioClips: AudioClip[] = [];

    start() {
        AudioManager.instance.setMusicAudioClips(this.musicAudioClips);
        AudioManager.instance.setSoundAudioClips(this.soundAudioClips);

    }

    protected update(dt: number): void {
        // console.log(AudioManager.instance.soundAudioSource.playing);
    }


    onBtnClick1() {
        AudioManager.instance.playSound(0);
        AudioManager.instance.playSound(1);
        AudioManager.instance.playSound(0);
        AudioManager.instance.playSound(1);
        AudioManager.instance.playSound(0);

    }

    onBtnClick2() {
        AudioManager.instance.playMusic(1);

    }
}


