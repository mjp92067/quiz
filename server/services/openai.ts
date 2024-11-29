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

  const systemPrompt = `You are a quiz generator that creates ${type} questions. Your output must be a valid JSON array containing exactly ${numQuestions} questions.
Each question must follow this exact format:
{
  "question": "Question text here?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "The exact text of the correct option"
}

Example output format:
[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "correctAnswer": "Paris"
  }
]

Remember:
1. Output must be a valid JSON array
2. Each question must have exactly the specified number of options (4 for multiple-choice, 2 for true/false)
3. The correctAnswer must exactly match one of the options`;

  const userPrompt = `Generate ${numQuestions} ${difficulty} difficulty questions suitable for ${level} level students about the following content:

${content}

Requirements:
- For multiple-choice questions: provide exactly 4 options
- For true/false questions: provide exactly 2 options ("True" and "False")
- For fill-in-the-blank questions: provide the correct answer as the first option
- Ensure all questions are properly formatted as JSON
- Make sure the correctAnswer exactly matches one of the options`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || '';
    console.log("Raw OpenAI response:", text); // Log raw response for debugging

    // Clean the response text
    const cleanedText = text
      .replace(/```json\s*/g, '')  // Remove JSON code block markers
      .replace(/```\s*/g, '')      // Remove remaining code block markers
      .replace(/^\s*\[/, '[')      // Ensure array starts cleanly
      .replace(/\]\s*$/, ']')      // Ensure array ends cleanly
      .trim();

    console.log("Cleaned response text:", cleanedText); // Log cleaned response

    try {
      // First attempt: Try parsing the entire response
      const questions = JSON.parse(cleanedText);
      
      // Validate response structure
      if (!Array.isArray(questions)) {
        throw new Error("Response is not an array");
      }

      // Validate each question
      questions.forEach((q, index) => {
        if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
          throw new Error(`Question ${index + 1} is missing required fields`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1} has a correctAnswer that doesn't match any option`);
        }
      });

      return questions;
    } catch (parseError) {
      console.error("First parse attempt failed:", parseError);

      // Second attempt: Try to extract and parse just the array
      const arrayMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!arrayMatch) {
        throw new Error("Could not find a valid JSON array in the response");
      }

      const questions = JSON.parse(arrayMatch[0]);
      if (!Array.isArray(questions)) {
        throw new Error("Extracted content is not an array");
      }

      return questions;
    }
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    throw new Error(
      error instanceof Error 
        ? `Failed to generate questions: ${error.message}`
        : "Failed to generate questions"
    );
  }
}
