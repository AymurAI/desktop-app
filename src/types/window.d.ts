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
