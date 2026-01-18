
import { GoogleGenAI } from "@google/genai";
import { cleanSrtResponse } from "../utils/fileUtils";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async extractSrtFromVideo(base64Data: string, mimeType: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: `Bạn là một chuyên gia trích xuất phụ đề. Hãy nghe âm thanh từ video này và tạo ra một file phụ đề định dạng .srt hoàn chỉnh. 
              Yêu cầu:
              1. Sử dụng định dạng SRT chuẩn: 
                 Số thứ tự
                 00:00:00,000 --> 00:00:00,000
                 Nội dung text
              2. Trích xuất chính xác ngôn ngữ được nói trong video.
              3. Đảm bảo các mốc thời gian khớp với lời nói.
              4. Chỉ trả về nội dung file SRT, không thêm bất kỳ văn bản giải thích nào khác.`,
            },
          ],
        },
        config: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        }
      });

      return cleanSrtResponse(response.text || "");
    } catch (error: any) {
      console.error("Gemini Extraction Error:", error);
      throw new Error(error.message || "Lỗi khi trích xuất phụ đề từ video.");
    }
  }

  async translateSrt(srtContent: string, targetLang: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Bạn là một biên dịch viên chuyên nghiệp. Hãy dịch nội dung file SRT sau đây sang ${targetLang}. 
        Yêu cầu:
        1. Giữ nguyên định dạng SRT (chỉ số, mốc thời gian).
        2. Dịch sát nghĩa và mượt mà văn phong của ngôn ngữ đích.
        3. Tuyệt đối KHÔNG thay đổi các mốc thời gian.
        4. Chỉ trả về nội dung file SRT đã dịch, không thêm văn bản dẫn nhập.

        Nội dung SRT gốc:
        ${srtContent}`,
        config: {
          temperature: 0.3,
        }
      });

      return cleanSrtResponse(response.text || "");
    } catch (error: any) {
      console.error("Gemini Translation Error:", error);
      throw new Error(error.message || "Lỗi khi dịch phụ đề.");
    }
  }
}

export const geminiService = new GeminiService();
