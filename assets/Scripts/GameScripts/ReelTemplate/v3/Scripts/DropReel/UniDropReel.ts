import { _decorator, Enum, RealCurve, Vec3 } from 'cc';
import { LayoutType, UniReel } from '../UniReel';
import { SymbolBase } from '../Interface/SymbolBase';
import { IDropReel } from '../Interface/IDropReel';
import { DropType, UniDropIconBase } from './UniDropIconBase';
import { EaseType } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('DropUniReel')
export abstract class UniDropReel<S extends SymbolBase, Icon extends UniDropIconBase<S>> extends UniReel<S, Icon> implements IDropReel {

    public onStartDropOut: (idList: number[]) => void;
    public onStartDropIn: (idList: number[]) => void;
    public onStartRefill: (dropOutIds: number[]) => void;
    public waitForDropComplete: () => void = null;

    public startDropOut(dropOutIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        this.initLayout();
        this.resetMovements();
        this.setIconListDropType(dropOutIdList, DropType.DropOut);
        this.onStartDropOut?.(dropOutIdList);
        this.drop(ease, easedValueCustom);
    }

    public startDropIn(dropInIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        this.setIconListDropType(dropInIdList, DropType.DropIn);
        this.setDropIconTopPos(dropInIdList);
        this.onStartDropIn?.(dropInIdList);
        this.drop(ease, easedValueCustom);
    }

    public startDropRefill(removeIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        const refillIdList = this.getRefillIdList(removeIdList);
        this.setDropIconTopPos(removeIdList);
        this.reorderDropIcon(removeIdList);
        this.setIconListDropType(refillIdList, DropType.Refill);
        this.onStartRefill?.(refillIdList);
        this.drop(ease, easedValueCustom);
    }

    public async startDropOutAsync(dropOutIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.waitForDropComplete = resolve;
            this.startDropOut(dropOutIdList, ease, easedValueCustom);
        })
    }

    public async startDropInAsync(dropInIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.waitForDropComplete = resolve;
            this.startDropIn(dropInIdList, ease, easedValueCustom);
        })
    }

    public async startDropRefillAsync(removeIdList: number[], ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.waitForDropComplete = resolve;
            this.startDropRefill(removeIdList, ease, easedValueCustom);
        })
    }

    protected drop(ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        const dropIcons = this._iconList.filter(icon => icon.dropType !== DropType.NoDrop);

        for (let i = 0; i < dropIcons.length; ++i) {
            const dropCount = this.getDropCount(dropIcons[i]);
            const dropDis = this.moveDir.clone().multiplyScalar(this.moveDis * dropCount);
            const dropTime = this.moveInterval * dropCount;
            dropIcons[i].moveBy(dropDis, dropTime, ease, easedValueCustom);
            dropIcons[i].addCallback(() => { this.dropComplete(dropIcons[i]); });
        }
    }

    protected setIconListDropType(iconIndexes: number[], dropType: DropType): void {
        for (const index of iconIndexes) {
            this._iconList[index].dropType = dropType;
        }
    }

    protected getDropCount(icon: Icon): number {
        switch (icon.dropType) {
            case DropType.DropOut:
                return this.iconAmount;
            case DropType.DropIn:
            case DropType.Refill:
                return this._getRefillDropDistanceByPos(icon);
            default:
                return 0;
        }
    }

    protected _getRefillDropDistanceByPos(icon: Icon): number {
        const index = this._iconList.indexOf(icon);
        const currentPos = this.isVertical ? icon.node.position.y : icon.node.position.x;
        const targetPos = this.isVertical ?
            this.iconDis.multiplyScalar(0.5 * (this.iconList.length - 1) - index).y :
            this.iconDis.multiplyScalar(0.5 * (this.iconList.length - 1) - index).x;
        const distance = Math.abs(currentPos - targetPos);
        const dropCount = Math.round(distance / this.moveDis);
        return dropCount;
    }

    protected setDropIconTopPos(idList: number[]): void {
        const resetIdList = !this.inverseDirection ? [...idList].reverse() : [...idList];
        const startPos = !this.inverseDirection ?
            this.iconList[0].node.getPosition().clone() :
            this.iconList[this.iconList.length - 1].node.getPosition().clone();

        for (let i = 0; i < resetIdList.length; i++) {
            const iconIndex = resetIdList[i];
            const moveDis = !this.inverseDirection ? (this.moveDis * i) : -(this.moveDis * i);
            const offset = this.isVertical ? moveDis + startPos.y : moveDis + startPos.x;
            const targetPos = this.isVertical ? new Vec3(0, offset, 0) : new Vec3(offset, 0, 0);

            this._iconList[iconIndex].moveTo(targetPos, 0);
            this._iconList[iconIndex].addCallback(() => {
                this.setDropIconData(iconIndex);
            });
        }
    }

    protected setDropIconData(index: number): void {
        let symbol = this.iconList[index].symbol;
        if (symbol !== null) {
            this.destroySymbol(symbol);
        }

        this.iconList[index].symbol = this.getData();
        this.onSetIconData?.(this.iconList[index].symbol, index);
    }

    protected getRefillIdList(removeIdList: number[]): number[] {
        const refillIdList: number[] = [];
        const start = 1;
        const end = this._iconList.length - 1;

        if (!this.inverseDirection) {
            const max = Math.max(...removeIdList);
            for (let i = start; i <= max; i++) {
                refillIdList.push(i);
            }
        }
        else {
            const min = Math.min(...removeIdList);
            for (let i = min; i < end; i++) {
                refillIdList.push(i);
            }
        }

        return refillIdList;
    }

    protected reorderDropIcon(removeIdList: number[]): void {
        const firstIcon = this._iconList[0];
        const lastIcon = this._iconList[this._iconList.length - 1];
        const middleIcons = this._iconList.slice(1, this._iconList.length - 1);
        const dropOutIcons: Icon[] = [];
        const remainIcons: Icon[] = [];

        for (let i = 0; i < middleIcons.length; i++) {
            const icon = middleIcons[i];
            if (removeIdList.includes(i + 1)) {
                dropOutIcons.push(icon);
            } else {
                remainIcons.push(icon);
            }
        }

        this._iconList = !this.inverseDirection ?
            [firstIcon, ...dropOutIcons, ...remainIcons, lastIcon] :
            [firstIcon, ...remainIcons, ...dropOutIcons, lastIcon];
        this.changeSibling(this._iconList);
    }

    protected dropComplete(dropIcon: Icon): void {
        dropIcon.dropType = DropType.NoDrop;
        if (this._iconList.every(icon => icon.dropType === DropType.NoDrop)) {
            this.waitForDropComplete?.();
        }
    }
}


