declare global {
  interface Window {
    filesystem?: {
      feedback: {
        export: (fileName: string, data: object) => Promise<void>;
      };
    };
  }
}

export {};
