type OnceAuthCodeReceivedCallback = (authCode: string | null) => void;

declare global {
  interface Window {
    filesystem?: {
      feedback: {
        export: (fileName: string, data: object) => Promise<void>;
      };
      excel: {
        read: () => Promise<Buffer>;
        write: (buffer: Buffer) => Promise<void>;
        open: () => Promise<string>;
      };
    };
    oauth?: {
      getVerifierCode: () => Promise<string>;
      getChallengeCode: () => Promise<string>;
      onceAuthCodeReceived: (
        callback: OnceAuthCodeReceivedCallback
      ) => Promise<void>;
    };
  }
}

export {};
