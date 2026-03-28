"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfo = exports.FileGroup = void 0;
class FileGroup {
    constructor() {
        this.totalSize = 0;
        this.fileInfos = [];
    }
}
exports.FileGroup = FileGroup;
class FileInfo {
    constructor(path, size) {
        this.path = path;
        this.size = size;
    }
}
exports.FileInfo = FileInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlsZUdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL0ZpbGVHcm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFhLFNBQVM7SUFBdEI7UUFDVyxjQUFTLEdBQVcsQ0FBQyxDQUFDO1FBQ3RCLGNBQVMsR0FBZSxFQUFFLENBQUM7SUFDdEMsQ0FBQztDQUFBO0FBSEQsOEJBR0M7QUFFRCxNQUFhLFFBQVE7SUFJakIsWUFBWSxJQUFZLEVBQUUsSUFBWTtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0NBQ0o7QUFSRCw0QkFRQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBGaWxlR3JvdXAge1xyXG4gICAgcHVibGljIHRvdGFsU2l6ZTogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBmaWxlSW5mb3M6IEZpbGVJbmZvW10gPSBbXTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZpbGVJbmZvIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBwYXRoOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2l6ZTogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZywgc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcclxuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xyXG4gICAgfVxyXG59Il19