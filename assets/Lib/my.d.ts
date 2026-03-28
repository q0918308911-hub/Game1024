interface Array<T> {
    count(value: T): number;
    countOccurrencesOfArray(array: T[]): number;
    indexesOf(value: T): number[];
    set(): any[];
    setSelf(): void;
    getRandomElement(): T;
    remove(value: T): void;
}

interface Number {
    fixed(): number;
    numberComma(): string;
    readByte(start: number, length: number): number;
}

interface windows {
    Papa: any;
}

interface String {
    replaceAll(search: string, replace: string): string;
}

declare module "cc" {
    interface Node {
        setActive(b: boolean): void;
        forceTouchEnd(x: number, y: number): void; // 强制觸摸結束
        cleanClaimedTouchIdList(): void; // 清理 claimedTouchIdList
    }

    interface Animation {
        playWithCallback(clipName: string, callback: Function): void;
        playPromise(clipName?: string): Promise<unknown>;
        setSpeedByClipName(clipName: string, speed: number): void;
    }

    interface RichText {
        addSpriteFrame(spriteFrameMap: any[]): void; // KeySpriteFramePair[]
    }

    interface Button {
        resetStatus(): void;
        emitEvents(): void;
    }

    export namespace sp {
        export interface Skeleton {
            playWithCallback(clipName: string, callback: Function, track?: number): void;
            playPromise(clipName: string, track?: number): Promise<unknown>;
            playAnimPromise(animName: string, track?: number): Promise<void>;
            playLoop(animationName: string, track?: number): void;
            tuneAnimationByTimeScale(gameTimeScale?: number): void;
            setOpacity(opacity: number): void;
        }
    }

    export namespace math {
        export interface Vec3 {
            toVec2(): Vec2;
        }

        export interface Vec2 {
            toVec3(): Vec3;
        }
    }
}

declare var Papa: any & typeof globalThis;
