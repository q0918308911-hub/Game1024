import type { AssetInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';

export interface PrefabScanContext {
    prefabInfos: AssetInfo[];
    currentIndex: number;
    result: any[];
    isCheckMask: boolean;
}
