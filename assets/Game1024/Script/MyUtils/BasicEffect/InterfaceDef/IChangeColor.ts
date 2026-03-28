
export interface IChangeReelsColor {

    setIconLight(isDark: boolean, iconIndex?: number[]): void;

    setAllLightExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): void;

    setIconLightTween(isDark: boolean, iconIndex?: number[]): Promise<void>;

    setIconLightTweenExcludeSymbolIds(isDark: boolean, excludeSymbolIds: number[]): Promise<void>;
}