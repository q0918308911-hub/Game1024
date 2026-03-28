import { readFileSync } from 'fs';
import { join } from 'path';
import { TextureInfo } from '../../SceneScript';
import packageJSON from '../../../package.json';
import * as CoreService from '../../CoreService';
import { ExecuteSceneScriptMethodOptions } from '@cocos/creator-types/editor/packages/scene/@types/public';

const MAX_PIXEL_COUNT = 92274688;

module.exports = Editor.Panel.define({
    listeners: {
        // show() { console.log('show'); },
        // hide() { console.log('hide'); },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        textureTargetFolderInput: '#texture-target-folder-input',
        refreshTextureInfoButton: '#refresh-texture-info-button',
        closeMipmapButton: '#close-mipmap-button',
        trimModeToNoneButton: '#trim-mode-to-none-button',
        convertPrefabMaskButton: '#convert-prefab-mask-button',
        convertSceneMaskButton: '#convert-scene-mask-button',
        allOperationButton: '#all-operation-button',
        totalTextureAmountText: '#total-texture-amount-text',
        totalMemoryText: '#total-memory-text',
        totalPixelCountText: '#total-pixel-count-text',
        textureInfoContainer: '#texture-info-container',
    },
    methods: {
        initFolderDefaultInput(): void {
            const folderInput = this.$.textureTargetFolderInput as HTMLInputElement;
            folderInput.value = 'Arts/Game/, Game/, resources/';
        },

        async refreshAllTextureInfo(): Promise<void> {
            const totalTextureAmountText = this.$.totalTextureAmountText as HTMLTextAreaElement;
            const totalMemoryText = this.$.totalMemoryText as HTMLTextAreaElement;
            const totalPixelText = this.$.totalPixelCountText as HTMLTextAreaElement;
            const container = this.$.textureInfoContainer as HTMLElement;

            totalTextureAmountText.innerText = '貼圖總數量: ';
            totalMemoryText.innerText = '貼圖總GPU記憶體大小: ';
            container.innerHTML = '讀取貼圖資源中...';
            this.disableAllButton();

            const allTargetFolder = this.getTargetFolder();
            const allTextureInfo: TextureInfo[] = await CoreService.getAllTextureInfo(allTargetFolder);

            container.innerHTML = '';
            let totalSize = 0;
            let totalPixel = 0;
            allTextureInfo.forEach((textureInfo: TextureInfo) => {
                const wrapper = CoreService.createTextureInfoElement(textureInfo);
                container.appendChild(wrapper);
                totalSize += textureInfo.size;
                totalPixel += textureInfo.width * textureInfo.height;
            });

            totalTextureAmountText.innerText = `${allTextureInfo.length}`;
            totalMemoryText.innerText = `${CoreService.getFormattedSize(totalSize)}`;
            totalPixelText.innerText = `${CoreService.addComma(totalPixel)}`;
            if (totalPixel >= MAX_PIXEL_COUNT) {
                totalPixelText.style.color = 'red';
            } else {
                totalPixelText.style.color = 'white';
            }

            this.enableAllButton();
        },

        disableAllButton(): void {
            (this.$.refreshTextureInfoButton as HTMLButtonElement).disabled = true;
            (this.$.closeMipmapButton as HTMLButtonElement).disabled = true;
            (this.$.trimModeToNoneButton as HTMLButtonElement).disabled = true;
        },

        getTargetFolder(): string[] {
            const folderInput = this.$.textureTargetFolderInput as HTMLInputElement;
            const allTargetFolder = folderInput.value.split(',');
            // 先寫死
            // const allTargetFolder = ['Arts/Game', 'Game/', 'resources/'];
            return allTargetFolder;
        },

        enableAllButton(): void {
            (this.$.refreshTextureInfoButton as HTMLButtonElement).disabled = false;
            (this.$.closeMipmapButton as HTMLButtonElement).disabled = false;
            (this.$.trimModeToNoneButton as HTMLButtonElement).disabled = false;
        },

        async closeAllTextureMipmap(): Promise<void> {
            const allTargetFolder = this.getTargetFolder();
            await CoreService.closeAllTextureMipmap(allTargetFolder);
        },

        async trimModeToNone(): Promise<void> {
            const allTargetFolder = this.getTargetFolder();
            await CoreService.setTrimTypeToNone(allTargetFolder);
            this.refreshAllTextureInfo();
        },

        async onConvertPrefabMaskBtnClick() {
            const allTargetFolder = this.getTargetFolder();
            Editor.Message.send(packageJSON.name, 'convert-prefab', allTargetFolder);
        },

        async onConvertSceneMaskBtnClick() {
            const options: ExecuteSceneScriptMethodOptions = {
                name: packageJSON.name,
                method: 'scanMask',
                args: [],
            };

            const allMaskInfo = await Editor.Message.request('scene', 'execute-scene-script', options);
            CoreService.convertMaskType(allMaskInfo.details, false);
        },

        async onAllOperationBtnClick() {
            await this.trimModeToNone();
            await this.closeAllTextureMipmap();
            await this.onConvertSceneMaskBtnClick();
            await this.onConvertPrefabMaskBtnClick();

            this.refreshAllTextureInfo();
        }
    },
    ready() {
        (this.$.refreshTextureInfoButton as HTMLButtonElement).onclick = () => this.refreshAllTextureInfo();
        (this.$.closeMipmapButton as HTMLButtonElement).onclick = () => this.closeAllTextureMipmap();
        (this.$.trimModeToNoneButton as HTMLButtonElement).onclick = () => this.trimModeToNone();
        (this.$.convertPrefabMaskButton as HTMLButtonElement).onclick = () => this.onConvertPrefabMaskBtnClick();
        (this.$.convertSceneMaskButton as HTMLButtonElement).onclick = () => this.onConvertSceneMaskBtnClick();
        (this.$.allOperationButton as HTMLButtonElement).onclick = () => this.onAllOperationBtnClick();

        this.initFolderDefaultInput();
        this.refreshAllTextureInfo();
    },
    beforeClose() { },
    close() { },
});
