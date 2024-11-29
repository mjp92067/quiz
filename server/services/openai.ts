import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export async function generateQuestions(content: string, options: {
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  difficulty: 'easy' | 'medium' | 'hard';
  level: 'elementary' | 'middle' | 'high' | 'university';
  numQuestions: number;
}): Promise<Question[]> {
  const { type, difficulty, level, numQuestions } = options;

  const systemPrompt = `You are a quiz generator that creates ${type} questions. Generate questions that are ${difficulty} difficulty and suitable for ${level} level students.`;
  
  const userPrompt = `Generate ${numQuestions} questions about the following content: ${content}

Requirements:
1. For multiple-choice questions, provide 4 options
2. For true/false questions, provide 2 options
3. For fill-in-the-blank questions, provide the correct answer

Format each question as a JSON object with:
{
  "question": "The question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "The correct option"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
  });

  try {
    const text = response.choices[0]?.message?.content || '';
    // Clean and parse the response
    const cleanedText = text
      .replace(/```json\s*/g, '')  // Remove JSON code block markers
      .replace(/```\s*/g, '')      // Remove remaining code block markers
      .trim();                     // Remove extra whitespace

    let questions;
    try {
      // Try parsing the entire response first
      questions = JSON.parse(cleanedText);
    } catch {
      // If that fails, try to extract just the array
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No valid JSON array found in response");
      }
      questions = JSON.parse(jsonMatch[0]);
    }

    // Validate the questions array
    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array of questions");
    }

    return questions;
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    throw new Error("Failed to generate questions");
  }
}
