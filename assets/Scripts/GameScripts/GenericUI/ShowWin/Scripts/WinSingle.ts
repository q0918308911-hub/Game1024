import { _decorator, Component, Node, Animation, Vec3, Label, AnimationClip, tween, Tween } from 'cc';

const { ccclass, property } = _decorator;

enum WinScoreState {
    None,
    Start,
    IdleLoop,
    End
}

@ccclass('WinSingle')
export class WinSingle extends Component {

    @property(Animation)
    winAnimation: Animation;

    @property(Node)
    numberRoot: Node;

    @property(AnimationClip)
    showWinDefault: AnimationClip;

    @property(AnimationClip)
    ShowWinIn: AnimationClip;

    @property(AnimationClip)
    ShowWinLoop: AnimationClip;

    @property(AnimationClip)
    ShowWinOut: AnimationClip;

    private scoreLabelNode: Node = null;
    private currentState: WinScoreState = WinScoreState.Start;
    private idleLoopDuration: number = 1;
    private scoreRunDuration: number = 2;
    private onShowWinEnd: Function = null;
    private onScoreRunEnd: Function = null;
    public onBGClickCB: Function = null;
    private score: number = 0;
    private scoreRunTween: Tween<BindTarget> = null;

    showWin(score: number, scoreRunDuration: number, idleLoopDuration: number, onScoreRunEnd: Function, onEnd: Function = null) {
        this.score = score;
        this.onBGClickCB = this.onBGClick;
        this.scoreRunDuration = scoreRunDuration;
        this.idleLoopDuration = idleLoopDuration;
        this.onShowWinEnd = onEnd;
        this.onScoreRunEnd = onScoreRunEnd;
        this.node.setActive(true);
        this.currentState = WinScoreState.None;
        this.winAnimation.playWithCallback(this.showWinDefault.name, () => {
            this.currentState = WinScoreState.Start;
            this.winAnimation.playWithCallback(this.ShowWinIn.name, () => {
                this.winAnimation.play(this.ShowWinLoop.name);
            })

            this.runScore(score, this.scoreRunDuration)
        })

    }

    private onRunScoreTweenEnd(isClickEnd: boolean) {
        this.onScoreRunEnd?.(isClickEnd);
        this.currentState = WinScoreState.IdleLoop;
        this.scheduleOnce(this.onIdleLoopEnd, this.idleLoopDuration);
    }

    private onIdleLoopEnd() {
        this.currentState = WinScoreState.End;
        this.winAnimation.playWithCallback(this.ShowWinOut.name, () => {
            this.node.setActive(false);
            this.onShowWinEnd?.();
        });
    }

    private runScore(score: number, duration: number) {
        this.scoreLabelNode.setActive(true);

        let target = new BindTarget();
        this.scoreRunTween = tween(target)
            .to(duration, { score: score }, {
                onUpdate: (v: any, ratio: number) => {
                    let current = Math.floor(score * ratio);
                    this.setScore(current);
                },
                onComplete: (target?: object) => {                  // 回调，当缓动动作更新时触发。
                    this.setScore(score);
                    this.onRunScoreTweenEnd(false);
                },
            })
            .start();
    }


    private setScore(score: number) {
        this.scoreLabelNode.getComponent(Label).string = `${score.numberComma()}`;
    }


    public setScoreLabel(scoreLabelNode: Node) {
        scoreLabelNode.setParent(this.numberRoot);
        scoreLabelNode.setPosition(Vec3.ZERO);
        scoreLabelNode.setScale(Vec3.ONE);
        scoreLabelNode.setActive(false);
        scoreLabelNode.getComponent(Label).string = '';
        this.scoreLabelNode = scoreLabelNode;
    }

    private onBGClick() {
        switch (this.currentState) {
            case WinScoreState.Start:
                this.unscheduleAllCallbacks();
                this.stopScoreRunTween();
                this.setScore(this.score);
                this.onRunScoreTweenEnd(true);
                break;
            case WinScoreState.IdleLoop:
                this.unscheduleAllCallbacks();
                this.onIdleLoopEnd();
                break;
            default:
                break;
        }

    }

    private stopScoreRunTween() {
        if (this.scoreRunTween) {
            this.scoreRunTween.stop();
            this.scoreRunTween = null;
        }
    }
}


class BindTarget {
    score: number = 0;
}
