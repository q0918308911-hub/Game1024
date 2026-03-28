import { _decorator, AudioClip, AudioSource, Component, EventKeyboard, KeyCode, Node, randomRangeInt } from 'cc';
import { WinSingle } from './WinSingle';
import { WinType } from '../../../Definition';
import { Debug, Utility } from 'db://assets/Scripts/Utils/Core';

const { ccclass, property } = _decorator;

enum WinScoreSound {
    Win_Sound = 0,
    Voice_BigWin = 1,
    Voice_SuperWin = 2,
    Voice_MegaWin = 3,
    Voice_EpicWin = 4,
}

@ccclass('ShowWin')
export class ShowWin extends Component {

    @property(WinSingle)
    epicWin: WinSingle;

    @property(WinSingle)
    megaWin: WinSingle;

    @property(WinSingle)
    superWin: WinSingle;

    @property(WinSingle)
    bigWin: WinSingle;

    @property(Node)
    scoreLabelNode: Node;

    @property(Node)
    bgMask: Node;

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

    currentWin: WinSingle;

    protected onLoad(): void {
        Utility.addEventHandlerToButton(this.bgMask, this, 'onBGClick');

    }

    public showSpecialWin(odds: number, totalBet: number, needShowEpic: boolean = false): Promise<unknown> {
        return new Promise((resolve, reject) => {
            let type: WinType = WinType.BigWin;

            if (odds >= 25 && odds <= 50) {
                type = WinType.BigWin;
            }
            else if (odds > 50 && odds <= 100) {
                type = WinType.SuperWin;
            }
            else if (odds > 100 && odds <= 200) {
                type = WinType.MegaWin;
            }
            else if (odds > 200) {
                if (needShowEpic) {
                    type = WinType.EpicWin;
                }
                else {
                    type = WinType.MegaWin;
                }
            }
            else {
                Debug.LogError(`錯誤倍數 ${odds}`)
            }
            let totalScore = odds * totalBet;
            totalScore = totalScore.fixed();
            this.showWin(type, totalScore, resolve);
        });
    }

    public showWin(type: WinType, score: number, onEnd: Function = null): void {
        let voiceType = WinScoreSound.Voice_BigWin;
        this.bgMask.setActive(true);
        let scoreRunDuration = 4.8;
        let idleLoopDuration = 2;
        let voiceClips: AudioClip[] = [];
        switch (type) {
            case WinType.EpicWin:
                this.currentWin = this.epicWin;
                voiceType = WinScoreSound.Voice_EpicWin;
                voiceClips = this.epicWinClips;
                break;
            case WinType.MegaWin:
                this.currentWin = this.megaWin;
                voiceType = WinScoreSound.Voice_MegaWin;
                voiceClips = this.megaWinClips;
                break;
            case WinType.SuperWin:
                this.currentWin = this.superWin;
                voiceType = WinScoreSound.Voice_SuperWin;
                voiceClips = this.superWinClips;
                break;
            case WinType.BigWin:
                this.currentWin = this.bigWin;
                voiceType = WinScoreSound.Voice_BigWin;
                voiceClips = this.bigWinClips;
                break;
        }

        if (type === WinType.EpicWin) {
            this.playSound(this.winSoundEpicClip);
        }
        else {
            this.playSound(this.winSoundNormalClip);
        }

        this.scheduleOnce(() => {
            this.playSoundOneShotRandom(voiceClips);
        }, 0.5);
        this.currentWin.setScoreLabel(this.scoreLabelNode);
        this.currentWin.showWin(score, scoreRunDuration, idleLoopDuration, this.onScoreRunEnd.bind(this), () => {
            this.bgMask.setActive(false);
            onEnd?.();
        });
    }

    private onScoreRunEnd(isClickEnd: boolean) {
        if (isClickEnd) {
            this.stopSound();
        }
        this.playSoundOneShot(this.winSoundEnd);
    }

    public showWinPromise(type: WinType, score: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.showWin(type, score, resolve);
        });
    }

    private onBGClick() {
        if (this.currentWin.node.active) {
            this.currentWin.onBGClickCB?.();
        }
    }

    private playSoundRandom(audioClips: AudioClip[]) {
        if (this.audioSource) {
            let len = audioClips.length;
            let randomClip = audioClips[randomRangeInt(0, len)];
            this.playSound(randomClip);
        }
    }

    private playSound(audioClips: AudioClip) {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.loop = false;
            this.audioSource.clip = audioClips;
            this.audioSource.play();
        }
    }

    private playSoundOneShotRandom(audioClips: AudioClip[]) {
        if (this.audioSource) {
            let len = audioClips.length;
            let randomClip = audioClips[randomRangeInt(0, len)];
            this.playSoundOneShot(randomClip);
        }
    }

    private playSoundOneShot(audioClips: AudioClip) {
        if (this.audioSource) {
            this.audioSource.playOneShot(audioClips)
        }
    }

    private stopSound() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
    }

    private Test() {
        this.showWinPromise(WinType.BigWin, 200000).then(() => {
            // console.log('end');
        });
    }

    private onKeyDownOrPressing(event: EventKeyboard) {
        if (event.keyCode === KeyCode.SPACE) {
            if (this.bgMask.active) {
                this.onBGClick();
            }
        }
    }

}