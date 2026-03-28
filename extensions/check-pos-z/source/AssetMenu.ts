import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";

export function onAssetMenu(assetInfo: AssetInfo) {
    return [
        {
            label: 'i18n:check-pos-z.asset_menu.check_prefab_pos_Z',
            enabled: assetInfo.isDirectory,
            click() {
                Editor.Message.send('check-pos-z', 'check-node-position-z', assetInfo.url, true);
            },
        },
    ];
};