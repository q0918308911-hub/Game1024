"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssetMenu = void 0;
function onAssetMenu(assetInfo) {
    return [
        {
            label: 'i18n:check-pos-z.asset_menu.check_prefab_pos_Z',
            enabled: assetInfo.isDirectory,
            click() {
                Editor.Message.send('check-pos-z', 'check-node-position-z', assetInfo.url, true);
            },
        },
    ];
}
exports.onAssetMenu = onAssetMenu;
;
