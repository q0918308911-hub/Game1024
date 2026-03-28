import { _decorator, AudioClip, AudioSource, Component, director, Node, Tween, tween, warn } from 'cc';
import { Debug, Utility } from '../Core';

const { ccclass, property } = _decorator;

export enum SOUND_TYPE {
    NORMAL = 0,
    ONE_SHOT = 1,
}

@ccclass('AudioManager')
export class AudioManager extends Component {

    @property(AudioSource)
    private musicAudioSource: AudioSource;

    @property(AudioSource)
    private music2AudioSource: AudioSource;

    @property([AudioSource])
    private musicExtraAudioSource: AudioSource[] = [];

    @property(AudioSource)
    private soundAudioSource: AudioSource;

    @property([AudioSource])
    private soundAudioSources: AudioSource[] = [];

    private static _instance: AudioManager = null;
    private musicAudioClips: AudioClip[] = null;
    private soundAudioClips: AudioClip[] = null;
    private genericSoundAudioClips: AudioClip[] = null;

    private fadeMusicTween: Tween<BindTarget> = null;
    private fadeMusic2Tween: Tween<BindTarget> = null;
    private fadeMusicExtraTween: Tween<BindTarget>[] = [];

    private _isAudioEnable: boolean = true;

    private musicVolume: number = 1;
    private music2Volume: number = 1;
    private musicExtraVolume: number[] = [];

    private activeOnsShotSoundCnt: number = 0;
    private lastOneShotSoundClip: AudioClip = null;

    public static get instance(): AudioManager {
        if (this._instance === null) {
            Debug.LogError("AudioManager _instance 為空");
        }
        return this._instance;
    }

    onLoad(): void {
        Debug.Log("AudioManager onLoad");
        if (!AudioManager._instance) {
            AudioManager._instance = this.node.getComponent(AudioManager);
        }
        else {
            this.node.destroy();
            return;
        }
        director.addPersistRootNode(this.node);

        for (let i = 0; i < this.musicExtraAudioSource.length; i++) {
            this.musicExtraVolume.push(1);
        }
    }

    public setGenericSoundAudioClips(clips: AudioClip[]) {
        this.genericSoundAudioClips = clips;
    }

    public setMusicAudioClips(clips: AudioClip[]) {
        this.musicAudioClips = clips;
    }

    public setSoundAudioClips(clips: AudioClip[]) {
        this.soundAudioClips = clips;
    }

    public playGenericSound(id: number, type: SOUND_TYPE = SOUND_TYPE.ONE_SHOT, isLoop: boolean = false, sourceID: number = -1) {
        if (!this.genericSoundAudioClips) {
            return;
        }

        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];
        let soundClip = this.genericSoundAudioClips[id];

        if (type === SOUND_TYPE.ONE_SHOT) {
            targetSource.playOneShot(soundClip);
        }
        else if (type === SOUND_TYPE.NORMAL) {
            targetSource.clip = soundClip;
            targetSource.loop = isLoop;
            targetSource.play();
        }
    }

    public isPlaying(sourceID: number = -1): boolean {
        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];
        return targetSource.playing;
    }

    public playSound(clipID: number, type: SOUND_TYPE = SOUND_TYPE.ONE_SHOT, sourceID: number = -1) {
        if (!this.soundAudioClips) {
            return;
        }

        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];

        let soundClip: AudioClip = this.soundAudioClips[clipID];
        if (type === SOUND_TYPE.ONE_SHOT) {
            if (this.lastOneShotSoundClip !== soundClip) {
                this.activeOnsShotSoundCnt = 0;
            }
            let volume = 1 / Math.pow(3, this.activeOnsShotSoundCnt);
            targetSource.playOneShot(soundClip, volume);
            this.activeOnsShotSoundCnt++;
            this.scheduleOnce(() => {
                this.activeOnsShotSoundCnt--;
                if (this.activeOnsShotSoundCnt < 0) {
                    this.activeOnsShotSoundCnt = 0;
                }
            }, 0.01);

            this.lastOneShotSoundClip = soundClip;
        }
        else if (type === SOUND_TYPE.NORMAL) {
            targetSource.loop = false;
            targetSource.clip = soundClip;
            targetSource.play();
        }
    }

    public playSoundLoop(id: number, sourceID: number = -1) {
        if (!this.soundAudioClips) {
            return;
        }

        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];
        targetSource.clip = this.soundAudioClips[id];
        targetSource.loop = true;
        targetSource.play();
    }

    public stopSound(sourceID: number[] = [-1]): void {
        if (!this.soundAudioClips) {
            return;
        }

        for (let i = 0; i < sourceID.length; i++) {
            if (sourceID[i] === -1) {
                this.soundAudioSource.stop();
            }
            else {
                this.soundAudioSources[sourceID[i]].stop();
            }
        }

    }

    public stopAllSound(): void {
        for (let i = 0; i < this.soundAudioSources.length; i++) {
            this.soundAudioSource.stop();
            this.soundAudioSources[i].stop();
        }
    }

    public playSoundClip(clip: AudioClip, sourceID: number = -1) {
        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];
        targetSource.playOneShot(clip);
    }

    public playSoundRandom(ids: number[], sourceID: number = -1) {
        if (!this.soundAudioClips) {
            return;
        }

        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];
        let len = ids.length;
        let id = Utility.getRandomInt(len);
        targetSource.playOneShot(this.soundAudioClips[ids[id]]);
    }

    // playSoundConsecutively 專用 請勿隨意呼叫
    private playSoundPromise(id: number, sourceID: number = -1): Promise<unknown> {
        let targetSource = sourceID === -1 ? this.soundAudioSource : this.soundAudioSources[sourceID];
        return new Promise((resolve, reject) => {
            targetSource.clip = this.soundAudioClips[id];
            targetSource.loop = false;
            targetSource.node.off(AudioSource.EventType.ENDED);
            targetSource.node.once(AudioSource.EventType.ENDED, () => {
                resolve?.(null);
            }, this);
            targetSource.play();
        });
    }

    public playSoundConsecutively(ids: number[], sourceID: number = -1): Promise<unknown> {
        if (!this.soundAudioClips) {
            return;
        }
        let len = ids.length;
        if (len <= 0) {
            return Promise.resolve();
        }
        else if (len === 1) {
            return this.playSoundPromise(ids[0], sourceID);
        }
        else {
            return this.playSoundPromise(ids[0], sourceID)
                .then(() => {
                    return this.playSoundConsecutively(ids.slice(1));
                });
        }
    }

    //#region Music

    private stopFadeMusicTween() {
        if (this.fadeMusicTween) {
            this.fadeMusicTween.stop();
            this.fadeMusicTween = null;
            this.setMusicVolume(1);
        }
    }

    private stopFadeMusic2Tween() {
        if (this.fadeMusic2Tween) {
            this.fadeMusic2Tween.stop();
            this.fadeMusic2Tween = null;
            this.setMusic2Volume(1);
        }
    }

    private stopFadeMusicExtraTween(index: number) {
        if (this.fadeMusicExtraTween[index]) {
            this.fadeMusicExtraTween[index].stop();
            this.fadeMusicExtraTween[index] = null;
            this.setMusicExtraVolume(index, 1);
        }
    }

    public fadeMusicVolume(startVolume: number, targetVolume: number, duration: number = 0.5, callback: Function = null) {
        this.stopFadeMusicTween();
        let target = new BindTarget();
        target.volume = startVolume;
        this.fadeMusicTween = tween(target)
            .to(duration, { volume: targetVolume }, {
                onUpdate: (v: any, progress) => {
                    this.setMusicVolume(v.volume);
                }
            })
            .call(() => {
                this.fadeMusicTween = null;
                callback?.();
            })
            .start();
    }

    /** 
     * @deprecated 請改用 fadeMusicExtraVolume，這個方法將在未來版本移除。
     */
    public fadeMusic2Volume(startVolume: number, targetVolume: number, duration: number = 0.5, callback: Function = null) {
        this.stopFadeMusic2Tween();
        let target = new BindTarget();
        target.volume = startVolume;
        this.fadeMusic2Tween = tween(target)
            .to(duration, { volume: targetVolume }, {
                onUpdate: (v: any, progress) => {
                    this.setMusic2Volume(v.volume);
                }
            })
            .call(() => {
                this.fadeMusic2Tween = null;
                callback?.();
            })
            .start();
    }

    public fadeMusicExtraVolume(index: number, startVolume: number, targetVolume: number, duration: number = 0.5, callback: Function = null) {
        this.stopFadeMusicExtraTween(index);
        let target = new BindTarget();
        target.volume = startVolume;
        this.fadeMusicExtraTween[index] = tween(target)
            .to(duration, { volume: targetVolume }, {
                onUpdate: (v: any, progress) => {
                    this.setMusicExtraVolume(index, v.volume);
                }
            })
            .call(() => {
                this.fadeMusicExtraTween[index] = null;
                callback?.();
            })
            .start();
    }

    public fadeMusicVolumePromise(startVolume: number, targetVolume: number, duration: number = 0.5): Promise<void> {
        return new Promise((resolve, reject) => {
            this.fadeMusicVolume(startVolume, targetVolume, duration, () => {
                resolve?.(null);
            });
        });
    }


    /** 
     * @deprecated 請改用 fadeMusicExtraVolumePromise，這個方法將在未來版本移除。
     */
    public fadeMusic2VolumePromise(startVolume: number, targetVolume: number, duration: number = 0.5): Promise<void> {
        return new Promise((resolve, reject) => {
            this.fadeMusic2Volume(startVolume, targetVolume, duration, () => {
                resolve?.(null);
            });
        });
    }

    public fadeMusicExtraVolumePromise(index: number, startVolume: number, targetVolume: number, duration: number = 0.5): Promise<void> {
        return new Promise((resolve, reject) => {
            this.fadeMusicExtraVolume(index, startVolume, targetVolume, duration, () => {
                resolve?.(null);
            });
        });
    }

    public pauseMusic() {
        this.musicAudioSource.pause();
    }

    /** 
     * @deprecated 請改用 pauseMusicExtra ，這個方法將在未來版本移除。
     */
    public pauseMusic2() {
        this.music2AudioSource.pause();
    }

    public pauseMusicExtra(index: number) {
        this.musicExtraAudioSource[index].pause();
    }

    public playMusic(id: number) {
        this.stopFadeMusicTween();
        if (!this.musicAudioClips || !this.musicAudioClips[id]) {
            console.error("playMusic id error", id);
            return;
        }

        if (this.musicAudioSource.clip === this.musicAudioClips[id]) {
            warn("playMusic id is playing", id);
            return;
        }

        this.playMusicClip(this.musicAudioClips[id]);
    }

    /** 
     * @deprecated 請改用 playMusicExtra ，這個方法將在未來版本移除。
     */
    public playMusic2(id: number) {
        // this.stopFadeMusic2Tween();
        if (!this.musicAudioClips || !this.musicAudioClips[id]) {
            console.error("playMusic2 id error", id);
            return;
        }

        if (this.music2AudioSource.clip === this.musicAudioClips[id]) {
            warn("playMusic2 id is playing", id);
            return;
        }

        this.playMusic2Clip(this.musicAudioClips[id]);
    }

    public playMusicExtra(index: number, id: number) {
        // this.stopFadeMusic2Tween();
        if (!this.musicAudioClips || !this.musicAudioClips[id]) {
            console.error("playMusic2 id error", id);
            return;
        }

        if (this.musicExtraAudioSource[index].clip === this.musicAudioClips[id]) {
            warn("playMusic2 id is playing", id);
            return;
        }

        this.playMusicExtraClip(index, this.musicAudioClips[id]);
    }

    public resumeMusic() {
        this.musicAudioSource.play();
    }

    public resume2Music() {
        this.music2AudioSource.play();
    }

    public resumeMusicExtra(index: number) {
        this.musicExtraAudioSource[index].play();
    }

    public playMusicClip(clip: AudioClip) {
        this.musicAudioSource.stop();
        this.musicAudioSource.clip = clip;
        this.musicAudioSource.loop = true;
        this.musicAudioSource.play();
    }

    public playMusic2Clip(clip: AudioClip) {
        this.music2AudioSource.stop();
        this.music2AudioSource.clip = clip;
        this.music2AudioSource.loop = true;
        this.music2AudioSource.play();
    }

    public playMusicExtraClip(index: number, clip: AudioClip) {
        this.musicExtraAudioSource[index].stop();
        this.musicExtraAudioSource[index].clip = clip;
        this.musicExtraAudioSource[index].loop = true;
        this.musicExtraAudioSource[index].play();
    }

    public stopMusic() {
        this.musicAudioSource.stop();
        this.musicAudioSource.clip = null;
    }

    public stopMusic2() {
        this.music2AudioSource.stop();
        this.music2AudioSource.clip = null;
    }

    public stopMusicExtra(index: number) {
        this.musicExtraAudioSource[index].stop();
        this.musicExtraAudioSource[index].clip = null;
    }

    public playMusicOncePromise(id: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.musicAudioSource.stop();
            this.musicAudioSource.clip = this.musicAudioClips[id];
            this.musicAudioSource.loop = false;
            this.musicAudioSource.node.once(AudioSource.EventType.ENDED, () => {
                resolve?.(null);
            }, this);
            this.musicAudioSource.play();
        });
    }

    public playMusic2OncePromise(id: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.music2AudioSource.stop();
            this.music2AudioSource.clip = this.musicAudioClips[id];
            this.music2AudioSource.loop = false;
            this.music2AudioSource.node.once(AudioSource.EventType.ENDED, () => {
                resolve?.(null);
            }, this);
            this.music2AudioSource.play();
        });
    }

    public playMusicExtraOncePromise(index: number, id: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.musicExtraAudioSource[index].stop();
            this.musicExtraAudioSource[index].clip = this.musicAudioClips[id];
            this.musicExtraAudioSource[index].loop = false;
            this.musicExtraAudioSource[index].node.once(AudioSource.EventType.ENDED, () => {
                resolve?.(null);
            }, this);
            this.musicExtraAudioSource[index].play();
        });
    }

    public setAudioEnable(b: boolean) {
        let audioSources: AudioSource[] = director.getScene().getComponentsInChildren(AudioSource);
        this._isAudioEnable = b;
        for (let item of audioSources) {
            if (this._isAudioEnable) {
                item.volume = 1;
            }
            else {
                item.volume = 0;
            }
        }

        // 強制將音樂音量設為目標音量(因為音樂有可能因為fade效果不直接是1)
        if (this._isAudioEnable) {
            this.setMusicVolume(this.musicVolume);
            this.setMusic2Volume(this.music2Volume);
            for (let i = 0; i < this.musicExtraAudioSource.length; i++) {
                this.setMusicExtraVolume(i, this.musicExtraVolume[i]);
            }
        }
    }

    public setMusicVolume(volume: number) {
        this.musicVolume = volume;
        if (!this._isAudioEnable) {
            return;
        }
        this.musicAudioSource.volume = volume;
    }

    public setMusic2Volume(volume: number) {
        this.music2Volume = volume;
        if (!this._isAudioEnable) {
            return;
        }
        if (!this.music2AudioSource) {
            return;
        }
        this.music2AudioSource.volume = volume;
    }

    public setMusicExtraVolume(index: number, volume: number) {
        this.musicExtraVolume[index] = volume;
        if (!this._isAudioEnable) {
            return;
        }
        if (!this.musicExtraAudioSource[index]) {
            return;
        }
        this.musicExtraAudioSource[index].volume = volume;
    }

    public getMusicVolume(): number {
        return this.musicVolume;
    }

    public getMusic2Volume(): number {
        return this.music2Volume;
    }

    public getMusicExtraVolume(index: number): number {
        return this.musicExtraVolume[index];
    }

    public isAudioEnable(): boolean {
        return this._isAudioEnable;
    }

    //#endregion
}


class BindTarget {
    volume: number = 1
}
