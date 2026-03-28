declare module '*/waninplayer/index.mjs' {
  import { RenderTexture } from 'cc';

  enum PlayMode {
    /**
     * 單次播放。
     *
     * @description
     * 此播放模式會進行"插斷播放"。
     * 即立即中止上一部影片並播放此次影片。
     * 如不想插斷播放，請改用接續模式。
     */
    Once = 0,
    /**
     * 循環播放。
     *
     * @description
     * 此播放模式會進行"插斷播放"，
     * 並持續循環播放 playList 中所有影片。
     */
    RepeatAll = 1,
    /**
     * 循環播放列表最後一個檔案。
     *
     *
     * 此播放模式會進行"插斷播放"，
     * 並在播放一次 playList 中所有影片後，
     * 循環播放最後一個影片。
     *
     *  @example
     *  // 播放順序即為 0 1 2 3 3 3 3 ...。
     *  play(PlayMode.RepeatLast, {0 ,1 ,2 ,3 } )
     *
     */
    RepeatLast = 2,
    /**
     * 單次播放 (接續)。
     *
     * @description
     * 此播放模式會進行"插斷播放"，
     * 即等待上一次播放列表結束後，才接著播放此次影片。
     * 如不想接續播放，請改用插斷模式。
     */
    AppendOnce = 3,
    /**
     * 循環播放 (接續)。
     *
     * @description
     * 此播放模式會進行"接續播放"，
     * 並持續循環播放 playList 中所有影片。
     */
    AppendRepeatAll = 4,
    /**
     * 循環播放列表最後一個檔案 (接續)。
     *
     * @description
     * 此播放模式會進行"接續播放"，
     * 並在播放一次 playList 中所有影片後，
     * 循環播放最後一個影片。
     *
     * @example
     * // 播放順序即為 (上一次 playList 結束後) 0 1 2 3 3 3 3 ...。
     * play( PlayMode.AppendRepeatLast, {0,1,2,3} )
     */
    AppendRepeatLast = 5,
  }
  enum ErrorCode {
    /**
     * 預設錯誤碼。
     */
    UnknownError = 0,
    /**
     * 影片解碼錯誤。
     * @description 解碼器無法運行，常見原因是硬體資源不足或資料錯誤導。
     */
    DecoderError = 1,
    /**
     * 播放器設定了不可用的參數。
     */
    InvalidParameter = 2,
    DecoderIsNull = 3,
    /**
     * 播放器創建codec失敗。
     */
    CreateCodecFailed = 4,
  }
  interface WaninPlayerEvent {
    onStart: (() => void) | null;
    onEnd: (() => void) | null;
    onNext: (() => void) | null;
    onRepeat: (() => void) | null;
    onError: ((code: ErrorCode, msg: string) => void) | null;
    onDecoderReady: ((config: VideoDecoderConfig) => void) | null;
    onStartOnce: (() => void) | null;
    onEndOnce: (() => void) | null;
    onNextOnce: (() => void) | null;
    onRepeatOnce: (() => void) | null;
    onErrorOnce: ((code: ErrorCode, msg: string) => void) | null;
    onDecoderReadyOnce: ((config: VideoDecoderConfig) => void) | null;
  }
  interface IWaninPlayer {
    event: WaninPlayerEvent;
    loadVideo(urls: RequestInfo[] | URL[]): Promise<void>;
    createDecoder(): Promise<void>;
    play(mode?: PlayMode, list?: number[]): void;
    pause(sw: boolean): void;
    GetRenderTexture(): RenderTexture | null;
    unloadVideo(): void;
    closeDecoder(): void;
    update(deltaTime: number): void;
    resetPlaybackState(): void;
  }

  class EventManager implements WaninPlayerEvent {
    onStart: (() => void) | null;
    onEnd: (() => void) | null;
    onNext: (() => void) | null;
    onRepeat: (() => void) | null;
    onError: ((code: ErrorCode, msg: string) => void) | null;
    onDecoderReady: ((config: VideoDecoderConfig) => void) | null;
    onStartOnce: (() => void) | null;
    onEndOnce: (() => void) | null;
    onNextOnce: (() => void) | null;
    onRepeatOnce: (() => void) | null;
    onErrorOnce: ((code: ErrorCode, msg: string) => void) | null;
    onDecoderReadyOnce: ((config: VideoDecoderConfig) => void) | null;
    sendStart(): void;
    sendDecoderReady(config: VideoDecoderConfig): void;
    sendEnd(): void;
    sendNext(): void;
    sendRepeat(): void;
    sendError(code: ErrorCode, msg: string): void;
  }

  class WaninPlayer implements IWaninPlayer {
    #private;
    /**
     * prepare中的videoChunk
     */
    private videoChunks;
    event: EventManager;
    loadVideo(urls: RequestInfo[] | URL[]): Promise<void>;
    createDecoder(): Promise<void>;
    play(mode?: PlayMode, list?: number[]): void;
    update(deltaTime: number): void;
    resetPlaybackState(): void;
    /**
     * 暫停播放影片。
     * @param sw true 代表暫停播放，false 代表恢復播放
     */
    pause(sw: boolean): void;
    GetRenderTexture(): RenderTexture | null;
    unloadVideo(): void;
    closeDecoder(): void;
  }

  export { ErrorCode, PlayMode, WaninPlayer as default };
}
