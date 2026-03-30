import OpenAI from "openai";

export interface TranscriptionResult {
  text: string;
  durationSeconds: number;
  language?: string;
}

export class TranscriptionService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(
    audioBuffer: Buffer,
    filename: string,
    language?: string,
  ): Promise<TranscriptionResult> {
    const file = new File([audioBuffer], filename, { type: "audio/webm" });

    const response = await this.client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language,
      response_format: "verbose_json",
    });

    return {
      text: response.text,
      durationSeconds: response.duration ?? 0,
      language: response.language,
    };
  }
}
