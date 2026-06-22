import { GoogleGenerativeAI } from '@google/generative-ai';

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isApiKeyError = errorMsg.includes('API key') || errorMsg.includes('API_KEY') || errorMsg.includes('INVALID_ARGUMENT');
    if (retries > 0 && !isApiKeyError) {
      console.warn(`Gemini API call failed with error: ${errorMsg}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates an English dialogue with Vietnamese translations on a given topic
 * using the Google Gemini API (gemini-2.5-flash).
 */
export async function generateDialogueFromAI(
  topic: string,
  apiKey: string,
  lessonType: 'dialogue' | 'paragraph' = 'dialogue',
  sentenceLength: 'short' | 'medium' | 'long' = 'medium'
): Promise<{
  title: string;
  description: string;
  tags: string[];
  lines: Array<{ speaker: string; en: string; vi: string }>;
}> {
  const finalApiKey = (apiKey && apiKey.trim() !== '') ? apiKey : (process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  if (!finalApiKey || finalApiKey.trim() === '') {
    throw new Error('API Key Gemini chưa được cấu hình. Vui lòng vào Cài đặt để thêm key.');
  }

  try {
    const ai = new GoogleGenerativeAI(finalApiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const lengthInstructions = {
      short: 'Mỗi câu tiếng Anh phải thật ngắn gọn (dưới 10 từ), sử dụng cấu trúc câu cực kỳ đơn giản và từ vựng thông dụng dễ tiếp thu cho người mới bắt đầu.',
      medium: 'Mỗi câu tiếng Anh có độ dài trung bình (khoảng 10-15 từ), cấu trúc câu phổ biến.',
      long: 'Mỗi câu tiếng Anh có độ dài chi tiết hơn, cấu trúc ngữ pháp đa dạng hơn.',
    }[sentenceLength];

    const typeInstructions = lessonType === 'paragraph'
      ? `Hãy tạo một đoạn văn ngắn (gồm từ 3 đến 5 câu liên tiếp) có tính liên kết cao tạo thành một đoạn đọc hoặc kể chuyện có ý nghĩa sâu sắc. Không phân vai hội thoại. Trong phần JSON trả về, hãy để giá trị "speaker" cho mọi câu là "Paragraph".`
      : `Hãy tạo một đoạn hội thoại giao tiếp thực tế ngắn (từ 4 đến 8 câu giao tiếp qua lại) giữa các nhân vật nói xen kẽ nhau. Đoạn hội thoại phải tự nhiên, thực tế, chứa các mẫu câu giao tiếp thông dụng của đời sống.`;

    const prompt = `Bạn là một giáo viên tiếng Anh bản xứ chuyên nghiệp. Hãy thiết kế nội dung học tiếng Anh về chủ đề: "${topic}".
${typeInstructions}
${lengthInstructions}

Trả về dữ liệu dưới dạng JSON thuần túy theo đúng cấu trúc mẫu sau (không kèm markdown, không viết chữ gì khác ngoài JSON):
{
  "title": "Tên chủ đề tiếng Việt ngắn gọn (ví dụ: Gọi đồ uống tại quán cafe hoặc Câu chuyện về ngày mưa)",
  "description": "Mô tả ngắn bằng tiếng Việt về ngữ cảnh (ví dụ: Đoạn hội thoại giữa nhân viên phục vụ và khách hàng tại quầy cafe hoặc Đoạn văn tả cảm xúc khi trời mưa)",
  "tags": ["giao-tiep", "cafe", "doi-song"],
  "lines": [
    {
      "speaker": "${lessonType === 'paragraph' ? 'Paragraph' : 'Tên nhân vật ngắn gọn (ví dụ: Staff, Customer, A, B)'}",
      "en": "Câu tiếng Anh hoàn chỉnh",
      "vi": "Bản dịch nghĩa tiếng Việt tự nhiên, chuẩn nghĩa"
    }
  ]
}`;

    const result = await callWithRetry(() => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }));

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Không nhận được phản hồi từ Gemini API.');
    }

    // Parse the response text with fault-tolerance
    let parsedData: any;
    let rawText = responseText.trim();
    
    // Strip markdown code block wraps if present
    if (rawText.startsWith('```')) {
      const match = rawText.match(/^(?:```[a-zA-Z0-9]*\s*)([\s\S]*?)(?:\s*```)$/);
      if (match && match[1]) {
        rawText = match[1].trim();
      }
    }
    
    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', responseText);
      throw new Error('Không thể phân tích kịch bản hội thoại từ Gemini dưới dạng JSON.');
    }

    // Robust field extraction
    let title = '';
    let description = '';
    let tags: string[] = [];
    let lines: Array<{ speaker: string; en: string; vi: string }> = [];

    // Resolve root array or nested object wraps like { "dialogue": { ... } }, { "dialogues": [...] }, etc.
    let targetObj = parsedData;
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      targetObj = parsedData[0];
    }

    if (targetObj && typeof targetObj === 'object' && !Array.isArray(targetObj)) {
      if (targetObj.dialogue && typeof targetObj.dialogue === 'object' && !Array.isArray(targetObj.dialogue)) {
        targetObj = targetObj.dialogue;
      } else if (targetObj.data && typeof targetObj.data === 'object' && !Array.isArray(targetObj.data)) {
        targetObj = targetObj.data;
      } else if (Array.isArray(targetObj.dialogues) && targetObj.dialogues.length > 0) {
        targetObj = targetObj.dialogues[0];
      } else if (Array.isArray(targetObj.data) && targetObj.data.length > 0) {
        targetObj = targetObj.data[0];
      }
    }

    // 1. Resolve title
    title = String(targetObj.title || targetObj.topic || targetObj.name || topic).trim();

    // 2. Resolve description
    description = String(targetObj.description || targetObj.context || targetObj.summary || `Đoạn hội thoại luyện tập về ${topic}`).trim();

    // 3. Resolve tags
    if (Array.isArray(targetObj.tags)) {
      tags = targetObj.tags.map((t: any) => String(t));
    } else if (typeof targetObj.tags === 'string') {
      tags = targetObj.tags.split(',').map((t: string) => t.trim());
    } else if (Array.isArray(parsedData.tags)) {
      tags = parsedData.tags.map((t: any) => String(t));
    }
    if (tags.length === 0) {
      tags = ['giao-tiep'];
    }

    // 4. Resolve dialogue lines array
    let rawLines = targetObj.lines || targetObj.dialogue || targetObj.conversation || targetObj.content;
    if (!Array.isArray(rawLines)) {
      const potentialArrays = Object.values(targetObj).filter(val => Array.isArray(val));
      if (potentialArrays.length > 0) {
        rawLines = potentialArrays.sort((a: any, b: any) => b.length - a.length)[0];
      }
    }

    if (Array.isArray(rawLines)) {
      lines = rawLines.map((l: any) => {
        if (typeof l === 'object' && l !== null) {
          return {
            speaker: String(l.speaker || l.character || l.person || l.role || 'A').trim(),
            en: String(l.en || l.english || l.text || '').trim(),
            vi: String(l.vi || l.vietnamese || l.translation || '').trim()
          };
        }
        return null;
      }).filter((l: any): l is { speaker: string; en: string; vi: string } => l !== null && l.en !== '');
    }

    // Basic structure validation
    if (!title || lines.length < 2) {
      console.error('Invalid structure in parsed Gemini response:', parsedData);
      throw new Error('Định dạng dữ liệu trả về từ Gemini không đúng cấu trúc yêu cầu hoặc có ít hơn 2 câu.');
    }

    return {
      title,
      description,
      tags,
      lines
    };
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    const err = error as Error;
    throw new Error(err.message || 'Lỗi kết nối Gemini API. Vui lòng kiểm tra lại API Key hoặc mạng internet.');
  }
}

export interface AIChatFeedback {
  generalFeedback: string;
  pronunciationTips: string[];
  expressionSuggestions: string[];
}

/**
 * Generates feedback on user pronunciation and fluency based on dialogue transcripts
 * using the Google Gemini API (gemini-2.5-flash).
 */
export async function generateAIChatFeedback(
  dialogueTitle: string,
  transcript: Array<{ lineText: string; userTranscript: string; score: number }>,
  apiKey: string
): Promise<AIChatFeedback> {
  const finalApiKey = (apiKey && apiKey.trim() !== '') ? apiKey : (process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  if (!finalApiKey || finalApiKey.trim() === '') {
    throw new Error('API Key Gemini chưa được cấu hình. Vui lòng vào Cài đặt để thêm key.');
  }

  try {
    const ai = new GoogleGenerativeAI(finalApiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Bạn là một chuyên gia bản xứ giảng dạy tiếng Anh. Hãy đưa ra nhận xét chi tiết (feedback) cho học viên sau khi họ hoàn thành một buổi luyện nói đóng vai (AI Roleplay) dựa trên đoạn hội thoại chủ đề: "${dialogueTitle}".

Dưới đây là transcript quá trình luyện nói của học viên (gồm câu mẫu tiếng Anh, kết quả nhận diện giọng nói thực tế từ mic của họ, và điểm số độ khớp từ 0-100%):
${JSON.stringify(transcript, null, 2)}

Hãy phân tích xem học viên phát âm thế nào, các từ nào bị đọc sai, thiếu âm đuôi, hay không rõ âm (dựa trên so sánh giữa lineText và userTranscript), nhận xét độ lưu loát, và đưa ra gợi ý cách sửa đổi, hoặc các mẫu câu tương đương tự nhiên hơn cho ngữ cảnh này.
Hãy giữ giọng điệu chuyên nghiệp, tích cực, và viết hoàn toàn bằng tiếng Việt.

Trả về dữ liệu dưới dạng JSON thuần túy theo đúng cấu trúc mẫu sau (không kèm markdown, không viết chữ gì khác ngoài JSON):
{
  "generalFeedback": "Nhận xét tổng quan chi tiết về phát âm, ngữ điệu và độ trôi chảy...",
  "pronunciationTips": [
    "Lời khuyên phát âm cho các từ cụ thể học viên đọc chưa chuẩn (ví dụ: 'Từ \"schedule\" bạn phát âm chưa chuẩn, âm đúng là /'ʃedjuːl/ hoặc /'skedʒuːl/.')"
  ],
  "expressionSuggestions": [
    "Gợi ý các câu giao tiếp nâng cao hoặc tự nhiên hơn trong hoàn cảnh này (ví dụ: 'Thay vì dùng \"How are you?\", bạn có thể dùng \"How\'s it going?\"')"
  ]
}`;

    const result = await callWithRetry(() => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }));

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Không nhận được phản hồi từ Gemini API.');
    }

    let parsedData: any;
    let rawText = responseText.trim();
    
    // Strip markdown code block wraps if present
    if (rawText.startsWith('```')) {
      const match = rawText.match(/^(?:```[a-zA-Z0-9]*\s*)([\s\S]*?)(?:\s*```)$/);
      if (match && match[1]) {
        rawText = match[1].trim();
      }
    }
    
    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      console.error('Failed to parse Gemini feedback response as JSON. Raw text was:', responseText);
      throw new Error('Không thể phân tích nhận xét nói của Gemini dưới dạng JSON.');
    }

    const generalFeedback = parsedData.generalFeedback || parsedData.feedback || 'Không có nhận xét tổng quan.';
    
    let pronunciationTips: string[] = [];
    if (Array.isArray(parsedData.pronunciationTips)) {
      pronunciationTips = parsedData.pronunciationTips.map((t: any) => String(t));
    } else if (Array.isArray(parsedData.tips)) {
      pronunciationTips = parsedData.tips.map((t: any) => String(t));
    }

    let expressionSuggestions: string[] = [];
    if (Array.isArray(parsedData.expressionSuggestions)) {
      expressionSuggestions = parsedData.expressionSuggestions.map((s: any) => String(s));
    } else if (Array.isArray(parsedData.suggestions)) {
      expressionSuggestions = parsedData.suggestions.map((s: any) => String(s));
    }

    return {
      generalFeedback,
      pronunciationTips,
      expressionSuggestions
    };
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API để lấy feedback:', error);
    const err = error as Error;
    throw new Error(err.message || 'Lỗi kết nối Gemini API. Vui lòng kiểm tra lại API Key hoặc mạng internet.');
  }
}

