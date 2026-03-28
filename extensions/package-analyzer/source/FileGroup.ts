export class FileGroup {
    public totalSize: number = 0;
    public fileInfos: FileInfo[] = [];
}

export class FileInfo {
    public readonly path: string;
    public readonly size: number;

    constructor(path: string, size: number) {
        this.path = path;
        this.size = size;
    }
}