import { _decorator, Component, Node, AudioSource, AudioClip, randomRangeInt } from 'cc';
import { WinType } from 'db://assets/Scripts/ModuleEntry';
//import { WinType } from 'db://assets/Scripts/Utils/Config';
const { ccclass, property } = _decorator;

enum WinScoreSound {
    Win_Sound = 0,
    Voice_BigWin = 1,
    Voice_SuperWin = 2,
    Voice_MegaWin = 3,
    Voice_EpicWin = 4,
}

@ccclass('JpSoundController')
export class JpSoundController extends Component {
    //---照搬原本公板的音效設定
    @property(AudioSource)
    audioSource: AudioSource;

    @property(AudioClip)
    winSoundNormalClip: AudioClip;

    @property(AudioClip)
    winSoundEpicClip: AudioClip;

    @property(AudioClip)
    winSoundEnd: AudioClip;

    @property(AudioClip)
    bigWinClips: AudioClip[] = [];

    @property(AudioClip)
    superWinClips: AudioClip[] = [];

    @property(AudioClip)
    megaWinClips: AudioClip[] = [];

    @property(AudioClip)
    epicWinClips: AudioClip[] = [];

    public playJPSound(value: WinType): void {
        let voiceClips: AudioClip[] = [];
        let voiceType = WinScoreSound.Voice_BigWin;
        if (value == WinType.EpicWin) {
            voiceType = WinScoreSound.Voice_EpicWin;
            voiceClips = this.epicWinClips;
        } else if (value == WinType.MegaWin) {
            voiceType = WinScoreSound.Voice_MegaWin;
            voiceClips = this.megaWinClips;
        } else if (value == WinType.SuperWin) {
            voiceType = WinScoreSound.Voice_SuperWin;
            voiceClips = this.superWinClips;
        } else if (value == WinType.BigWin) {
            voiceType = WinScoreSound.Voice_BigWin;
            voiceClips = this.bigWinClips;
        }
        if (value === WinType.EpicWin) {
            this.playSound(this.winSoundEpicClip);
        }
        else {
            this.playSound(this.winSoundNormalClip);
        }

        this.scheduleOnce(() => {
            this.playSoundOneShotRandom(voiceClips);
        }, 0.5);

    }

    public playSoundOneShotRandom(audioClips: AudioClip[]) {
        if (this.audioSource) {
            let len = audioClips.length;
            let randomClip = audioClips[randomRangeInt(0, len)];
            this.playSoundOneShot(randomClip);
        }
    }

    public playSoundOneShot(audioClips: AudioClip) {
        if (this.audioSource) {
            this.audioSource.playOneShot(audioClips)
        }
    }

    public playSound(audioClips: AudioClip) {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.loop = false;
            this.audioSource.clip = audioClips;
            this.audioSource.play();
        }
    }

    public stopSound() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
    }
    //--JP結束播放的
    public playSoundEnd(value: boolean): void {
        if (value) {
            this.playSoundOneShot(this.winSoundEnd);
        }

    }

}


