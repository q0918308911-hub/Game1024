"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const package_json_1 = __importDefault(require("../../../package.json"));
const CoreService = __importStar(require("../../CoreService"));
const MAX_PIXEL_COUNT = 92274688;
module.exports = Editor.Panel.define({
    listeners: {
    // show() { console.log('show'); },
    // hide() { console.log('hide'); },
    },
    template: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
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
        initFolderDefaultInput() {
            const folderInput = this.$.textureTargetFolderInput;
            folderInput.value = 'Arts/Game/, Game/, resources/';
        },
        async refreshAllTextureInfo() {
            const totalTextureAmountText = this.$.totalTextureAmountText;
            const totalMemoryText = this.$.totalMemoryText;
            const totalPixelText = this.$.totalPixelCountText;
            const container = this.$.textureInfoContainer;
            totalTextureAmountText.innerText = '貼圖總數量: ';
            totalMemoryText.innerText = '貼圖總GPU記憶體大小: ';
            container.innerHTML = '讀取貼圖資源中...';
            this.disableAllButton();
            const allTargetFolder = this.getTargetFolder();
            const allTextureInfo = await CoreService.getAllTextureInfo(allTargetFolder);
            container.innerHTML = '';
            let totalSize = 0;
            let totalPixel = 0;
            allTextureInfo.forEach((textureInfo) => {
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
            }
            else {
                totalPixelText.style.color = 'white';
            }
            this.enableAllButton();
        },
        disableAllButton() {
            this.$.refreshTextureInfoButton.disabled = true;
            this.$.closeMipmapButton.disabled = true;
            this.$.trimModeToNoneButton.disabled = true;
        },
        getTargetFolder() {
            const folderInput = this.$.textureTargetFolderInput;
            const allTargetFolder = folderInput.value.split(',');
            // 先寫死
            // const allTargetFolder = ['Arts/Game', 'Game/', 'resources/'];
            return allTargetFolder;
        },
        enableAllButton() {
            this.$.refreshTextureInfoButton.disabled = false;
            this.$.closeMipmapButton.disabled = false;
            this.$.trimModeToNoneButton.disabled = false;
        },
        async closeAllTextureMipmap() {
            const allTargetFolder = this.getTargetFolder();
            await CoreService.closeAllTextureMipmap(allTargetFolder);
        },
        async trimModeToNone() {
            const allTargetFolder = this.getTargetFolder();
            await CoreService.setTrimTypeToNone(allTargetFolder);
            this.refreshAllTextureInfo();
        },
        async onConvertPrefabMaskBtnClick() {
            const allTargetFolder = this.getTargetFolder();
            Editor.Message.send(package_json_1.default.name, 'convert-prefab', allTargetFolder);
        },
        async onConvertSceneMaskBtnClick() {
            const options = {
                name: package_json_1.default.name,
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
        this.$.refreshTextureInfoButton.onclick = () => this.refreshAllTextureInfo();
        this.$.closeMipmapButton.onclick = () => this.closeAllTextureMipmap();
        this.$.trimModeToNoneButton.onclick = () => this.trimModeToNone();
        this.$.convertPrefabMaskButton.onclick = () => this.onConvertPrefabMaskBtnClick();
        this.$.convertSceneMaskButton.onclick = () => this.onConvertSceneMaskBtnClick();
        this.$.allOperationButton.onclick = () => this.onAllOperationBtnClick();
        this.initFolderDefaultInput();
        this.refreshAllTextureInfo();
    },
    beforeClose() { },
    close() { },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUFrQztBQUNsQywrQkFBNEI7QUFFNUIseUVBQWdEO0FBQ2hELCtEQUFpRDtBQUdqRCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUM7QUFFakMsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7SUFDUCxtQ0FBbUM7SUFDbkMsbUNBQW1DO0tBQ3RDO0lBQ0QsUUFBUSxFQUFFLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsNkNBQTZDLENBQUMsRUFBRSxPQUFPLENBQUM7SUFDL0YsS0FBSyxFQUFFLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUseUNBQXlDLENBQUMsRUFBRSxPQUFPLENBQUM7SUFDeEYsQ0FBQyxFQUFFO1FBQ0Msd0JBQXdCLEVBQUUsOEJBQThCO1FBQ3hELHdCQUF3QixFQUFFLDhCQUE4QjtRQUN4RCxpQkFBaUIsRUFBRSxzQkFBc0I7UUFDekMsb0JBQW9CLEVBQUUsMkJBQTJCO1FBQ2pELHVCQUF1QixFQUFFLDZCQUE2QjtRQUN0RCxzQkFBc0IsRUFBRSw0QkFBNEI7UUFDcEQsa0JBQWtCLEVBQUUsdUJBQXVCO1FBQzNDLHNCQUFzQixFQUFFLDRCQUE0QjtRQUNwRCxlQUFlLEVBQUUsb0JBQW9CO1FBQ3JDLG1CQUFtQixFQUFFLHlCQUF5QjtRQUM5QyxvQkFBb0IsRUFBRSx5QkFBeUI7S0FDbEQ7SUFDRCxPQUFPLEVBQUU7UUFDTCxzQkFBc0I7WUFDbEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyx3QkFBNEMsQ0FBQztZQUN4RSxXQUFXLENBQUMsS0FBSyxH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QU0sSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDeEMsTUFBTSxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUV6QyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUNqQyxDQUFDO0tBQ0o7SUFDRCxLQUFLO1FBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyx3QkFBOEMsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDbkcsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBdUMsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDNUYsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBMEMsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3hGLElBQUksQ0FBQyxDQUFDLENBQUMsdUJBQTZDLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ3hHLElBQUksQ0FBQyxDQUFDLENBQUMsc0JBQTRDLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBQ3RHLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQXdDLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBRS9GLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFDRCxXQUFXLEtBQUssQ0FBQztJQUNqQixLQUFLLEtBQUssQ0FBQztDQUNkLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFRleHR1cmVJbmZvIH0gZnJvbSAnLi4vLi4vU2NlbmVTY3JpcHQnO1xuaW1wb3J0IHBhY2thZ2VKU09OIGZyb20gJy4uLy4uLy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgKiBhcyBDb3JlU2VydmljZSBmcm9tICcuLi8uLi9Db3JlU2VydmljZSc7XG5pbXBvcnQgeyBFeGVjdXRlU2NlbmVTY3JpcHRNZXRob2RPcHRpb25zIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL3NjZW5lL0B0eXBlcy9wdWJsaWMnO1xuXG5jb25zdCBNQVhfUElYRUxfQ09VTlQgPSA5MjI3NDY4ODtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcbiAgICBsaXN0ZW5lcnM6IHtcbiAgICAgICAgLy8gc2hvdygpIHsgY29uc29sZS5sb2coJ3Nob3cnKTsgfSxcbiAgICAgICAgLy8gaGlkZSgpIHsgY29uc29sZS5sb2coJ2hpZGUnKTsgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvc3R5bGUvZGVmYXVsdC9pbmRleC5jc3MnKSwgJ3V0Zi04JyksXG4gICAgJDoge1xuICAgICAgICB0ZXh0dXJlVGFyZ2V0Rm9sZGVySW5wdXQ6ICcjdGV4dHVyZS10YXJnZXQtZm9sZGVyLWlucHV0JyxcbiAgICAgICAgcmVmcmVzaFRleHR1cmVJbmZvQnV0dG9uOiAnI3JlZnJlc2gtdGV4dHVyZS1pbmZvLWJ1dHRvbicsXG4gICAgICAgIGNsb3NlTWlwbWFwQnV0dG9uOiAnI2Nsb3NlLW1pcG1hcC1idXR0b24nLFxuICAgICAgICB0cmltTW9kZVRvTm9uZUJ1dHRvbjogJyN0cmltLW1vZGUtdG8tbm9uZS1idXR0b24nLFxuICAgICAgICBjb252ZXJ0UHJlZmFiTWFza0J1dHRvbjogJyNjb252ZXJ0LXByZWZhYi1tYXNrLWJ1dHRvbicsXG4gICAgICAgIGNvbnZlcnRTY2VuZU1hc2tCdXR0b246ICcjY29udmVydC1zY2VuZS1tYXNrLWJ1dHRvbicsXG4gICAgICAgIGFsbE9wZXJhdGlvbkJ1dHRvbjogJyNhbGwtb3BlcmF0aW9uLWJ1dHRvbicsXG4gICAgICAgIHRvdGFsVGV4dHVyZUFtb3VudFRleHQ6ICcjdG90YWwtdGV4dHVyZS1hbW91bnQtdGV4dCcsXG4gICAgICAgIHRvdGFsTWVtb3J5VGV4dDogJyN0b3RhbC1tZW1vcnktdGV4dCcsXG4gICAgICAgIHRvdGFsUGl4ZWxDb3VudFRleHQ6ICcjdG90YWwtcGl4ZWwtY291bnQtdGV4dCcsXG4gICAgICAgIHRleHR1cmVJbmZvQ29udGFpbmVyOiAnI3RleHR1cmUtaW5mby1jb250YWluZXInLFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBpbml0Rm9sZGVyRGVmYXVsdElucHV0KCk6IHZvaWQge1xuICAgICAgICAgICAgY29uc3QgZm9sZGVySW5wdXQgPSB0aGlzLiQudGV4dHVyZVRhcmdldEZvbGRlcklucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICBmb2xkZXJJbnB1dC52YWx1ZSA9ICdBcnRzL0dhbWUvLCBHYW1lLywgcmVzb3VyY2VzLyc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgcmVmcmVzaEFsbFRleHR1cmVJbmZvKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAgICAgY29uc3QgdG90YWxUZXh0dXJlQW1vdW50VGV4dCA9IHRoaXMuJC50b3RhbFRleHR1cmVBbW91bnRUZXh0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCB0b3RhbE1lbW9yeVRleHQgPSB0aGlzLiQudG90YWxNZW1vcnlUZXh0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCB0b3RhbFBpeGVsVGV4dCA9IHRoaXMuJC50b3RhbFBpeGVsQ291bnRUZXh0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLiQudGV4dHVyZUluZm9Db250YWluZXIgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgICAgICAgIHRvdGFsVGV4dHVyZUFtb3VudFRleHQuaW5uZXJUZXh0ID0gJ+iyvOWclue4veaVuOmHjzogJztcbiAgICAgICAgICAgIHRvdGFsTWVtb3J5VGV4dC5pbm5lclRleHQgPSAn6LK85ZyW57i9R1BV6KiY5oa26auU5aSn5bCPOiAnO1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICforoDlj5bosrzlnJbos4fmupDkuK0uLi4nO1xuICAgICAgICAgICAgdGhpcy5kaXNhYmxlQWxsQnV0dG9uKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGFsbFRhcmdldEZvbGRlciA9IHRoaXMuZ2V0VGFyZ2V0Rm9sZGVyKCk7XG4gICAgICAgICAgICBjb25zdCBhbGxUZXh0dXJlSW5mbzogVGV4dHVyZUluZm9bXSA9IGF3YWl0IENvcmVTZXJ2aWNlLmdldEFsbFRleHR1cmVJbmZvKGFsbFRhcmdldEZvbGRlcik7XG5cbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGxldCB0b3RhbFNpemUgPSAwO1xuICAgICAgICAgICAgbGV0IHRvdGFsUGl4ZWwgPSAwO1xuICAgICAgICAgICAgYWxsVGV4dHVyZUluZm8uZm9yRWFjaCgodGV4dHVyZUluZm86IFRleHR1cmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd3JhcHBlciA9IENvcmVTZXJ2aWNlLmNyZWF0ZVRleHR1cmVJbmZvRWxlbWVudCh0ZXh0dXJlSW5mbyk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIHRvdGFsU2l6ZSArPSB0ZXh0dXJlSW5mby5zaXplO1xuICAgICAgICAgICAgICAgIHRvdGFsUGl4ZWwgKz0gdGV4dHVyZUluZm8ud2lkdGggKiB0ZXh0dXJlSW5mby5oZWlnaHQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdG90YWxUZXh0dXJlQW1vdW50VGV4dC5pbm5lclRleHQgPSBgJHthbGxUZXh0dXJlSW5mby5sZW5ndGh9YDtcbiAgICAgICAgICAgIHRvdGFsTWVtb3J5VGV4dC5pbm5lclRleHQgPSBgJHtDb3JlU2VydmljZS5nZXRGb3JtYXR0ZWRTaXplKHRvdGFsU2l6ZSl9YDtcbiAgICAgICAgICAgIHRvdGFsUGl4ZWxUZXh0LmlubmVyVGV4dCA9IGAke0NvcmVTZXJ2aWNlLmFkZENvbW1hKHRvdGFsUGl4ZWwpfWA7XG4gICAgICAgICAgICBpZiAodG90YWxQaXhlbCA+PSBNQVhfUElYRUxfQ09VTlQpIHtcbiAgICAgICAgICAgICAgICB0b3RhbFBpeGVsVGV4dC5zdHlsZS5jb2xvciA9ICdyZWQnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b3RhbFBpeGVsVGV4dC5zdHlsZS5jb2xvciA9ICd3aGl0ZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZW5hYmxlQWxsQnV0dG9uKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGlzYWJsZUFsbEJ1dHRvbigpOiB2b2lkIHtcbiAgICAgICAgICAgICh0aGlzLiQucmVmcmVzaFRleHR1cmVJbmZvQnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAodGhpcy4kLmNsb3NlTWlwbWFwQnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAodGhpcy4kLnRyaW1Nb2RlVG9Ob25lQnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0VGFyZ2V0Rm9sZGVyKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlcklucHV0ID0gdGhpcy4kLnRleHR1cmVUYXJnZXRGb2xkZXJJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgYWxsVGFyZ2V0Rm9sZGVyID0gZm9sZGVySW5wdXQudmFsdWUuc3BsaXQoJywnKTtcbiAgICAgICAgICAgIC8vIOWFiOWvq+atu1xuICAgICAgICAgICAgLy8gY29uc3QgYWxsVGFyZ2V0Rm9sZGVyID0gWydBcnRzL0dhbWUnLCAnR2FtZS8nLCAncmVzb3VyY2VzLyddO1xuICAgICAgICAgICAgcmV0dXJuIGFsbFRhcmdldEZvbGRlcjtcbiAgICAgICAgfSxcblxuICAgICAgICBlbmFibGVBbGxCdXR0b24oKTogdm9pZCB7XG4gICAgICAgICAgICAodGhpcy4kLnJlZnJlc2hUZXh0dXJlSW5mb0J1dHRvbiBhcyBIVE1MQnV0dG9uRWxlbWVudCkuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICh0aGlzLiQuY2xvc2VNaXBtYXBCdXR0b24gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAodGhpcy4kLnRyaW1Nb2RlVG9Ob25lQnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGNsb3NlQWxsVGV4dHVyZU1pcG1hcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgICAgIGNvbnN0IGFsbFRhcmdldEZvbGRlciA9IHRoaXMuZ2V0VGFyZ2V0Rm9sZGVyKCk7XG4gICAgICAgICAgICBhd2FpdCBDb3JlU2VydmljZS5jbG9zZUFsbFRleHR1cmVNaXBtYXAoYWxsVGFyZ2V0Rm9sZGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyB0cmltTW9kZVRvTm9uZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgICAgIGNvbnN0IGFsbFRhcmdldEZvbGRlciA9IHRoaXMuZ2V0VGFyZ2V0Rm9sZGVyKCk7XG4gICAgICAgICAgICBhd2FpdCBDb3JlU2VydmljZS5zZXRUcmltVHlwZVRvTm9uZShhbGxUYXJnZXRGb2xkZXIpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoQWxsVGV4dHVyZUluZm8oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBvbkNvbnZlcnRQcmVmYWJNYXNrQnRuQ2xpY2soKSB7XG4gICAgICAgICAgICBjb25zdCBhbGxUYXJnZXRGb2xkZXIgPSB0aGlzLmdldFRhcmdldEZvbGRlcigpO1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChwYWNrYWdlSlNPTi5uYW1lLCAnY29udmVydC1wcmVmYWInLCBhbGxUYXJnZXRGb2xkZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIG9uQ29udmVydFNjZW5lTWFza0J0bkNsaWNrKCkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uczogRXhlY3V0ZVNjZW5lU2NyaXB0TWV0aG9kT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBwYWNrYWdlSlNPTi5uYW1lLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ3NjYW5NYXNrJyxcbiAgICAgICAgICAgICAgICBhcmdzOiBbXSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGFsbE1hc2tJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIENvcmVTZXJ2aWNlLmNvbnZlcnRNYXNrVHlwZShhbGxNYXNrSW5mby5kZXRhaWxzLCBmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgb25BbGxPcGVyYXRpb25CdG5DbGljaygpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudHJpbU1vZGVUb05vbmUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2xvc2VBbGxUZXh0dXJlTWlwbWFwKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLm9uQ29udmVydFNjZW5lTWFza0J0bkNsaWNrKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLm9uQ29udmVydFByZWZhYk1hc2tCdG5DbGljaygpO1xuXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hBbGxUZXh0dXJlSW5mbygpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZWFkeSgpIHtcbiAgICAgICAgKHRoaXMuJC5yZWZyZXNoVGV4dHVyZUluZm9CdXR0b24gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLm9uY2xpY2sgPSAoKSA9PiB0aGlzLnJlZnJlc2hBbGxUZXh0dXJlSW5mbygpO1xuICAgICAgICAodGhpcy4kLmNsb3NlTWlwbWFwQnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZUFsbFRleHR1cmVNaXBtYXAoKTtcbiAgICAgICAgKHRoaXMuJC50cmltTW9kZVRvTm9uZUJ1dHRvbiBhcyBIVE1MQnV0dG9uRWxlbWVudCkub25jbGljayA9ICgpID0+IHRoaXMudHJpbU1vZGVUb05vbmUoKTtcbiAgICAgICAgKHRoaXMuJC5jb252ZXJ0UHJlZmFiTWFza0J1dHRvbiBhcyBIVE1MQnV0dG9uRWxlbWVudCkub25jbGljayA9ICgpID0+IHRoaXMub25Db252ZXJ0UHJlZmFiTWFza0J0bkNsaWNrKCk7XG4gICAgICAgICh0aGlzLiQuY29udmVydFNjZW5lTWFza0J1dHRvbiBhcyBIVE1MQnV0dG9uRWxlbWVudCkub25jbGljayA9ICgpID0+IHRoaXMub25Db252ZXJ0U2NlbmVNYXNrQnRuQ2xpY2soKTtcbiAgICAgICAgKHRoaXMuJC5hbGxPcGVyYXRpb25CdXR0b24gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm9uQWxsT3BlcmF0aW9uQnRuQ2xpY2soKTtcblxuICAgICAgICB0aGlzLmluaXRGb2xkZXJEZWZhdWx0SW5wdXQoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoQWxsVGV4dHVyZUluZm8oKTtcbiAgICB9LFxuICAgIGJlZm9yZUNsb3NlKCkgeyB9LFxuICAgIGNsb3NlKCkgeyB9LFxufSk7XG4iXX0=