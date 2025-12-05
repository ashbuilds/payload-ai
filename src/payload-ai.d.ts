// src/payload-ai.d.ts
import 'payload';

declare module 'payload' {
  interface BasePayload {
    ai: {
      generate: (args: AIGenerateArgs) => Promise<any>;
      // whatever else you add
    };
  }
}