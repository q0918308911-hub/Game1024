import { _decorator, Component, log, Node, sp } from 'cc';
import { Debug } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('SpineTest')
export class SpineTest extends Component {

    @property(sp.Skeleton)
    spineNode: sp.Skeleton;

    start() {


        // this.spineNode.setCompleteListener((x: sp.spine.TrackEntry) => {
        //     Debug.Log(x.animation.name);
        //     Debug.Log('setCompleteListener end');
        // });

        // this.spineNode.setTrackCompleteListener(tr, () => {
        //     Debug.Log("completed")
        // })
    }

    update(deltaTime: number) {

    }

    Banner() {



        //this.spineNode.setAnimation(0, "Banner", false);
        this.spineNode.clearTrack(0);
        let tr = this.spineNode.setAnimation(1, "Banner", false);

        console.log(tr.trackIndex);
        this.spineNode.setTrackCompleteListener(tr, () => {
            Debug.Log("completed")
        })
        tr = this.spineNode.addAnimation(1, "Icon", false);

        this.spineNode.setTrackCompleteListener(tr, () => {
            Debug.Log("completed2")
        })

    }

    Icon() {

        // this.spineNode.setAnimation(0, "Icon", false);
        //this.spineNode.setAnimation(0, "walk", false);

    }
}


