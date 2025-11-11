import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { imessageDB } from '@/lib/db/imessage';
import { contextDB } from '@/lib/db/context';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const aiRouter = createTRPCRouter({
  // Generate message suggestions
  generateSuggestions: publicProcedure
    .input(
      z.object({
        contactPhone: z.string(),
        recentMessages: z.array(
          z.object({
            text: z.string(),
            isFromMe: z.boolean(),
            timestamp: z.number(),
          })
        ),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Get contact context
      const contactContext = contextDB.getContact(input.contactPhone);

      // Get user context
      const userContexts = contextDB.getUserContext();

      // Build prompt
      const systemPrompt = `You are helping draft a response to ${contactContext?.name || input.contactPhone}.

${contactContext?.backgroundContext ? `CONTACT CONTEXT:\n${contactContext.backgroundContext}\n` : ''}
${contactContext?.formalityLevel ? `FORMALITY LEVEL: ${contactContext.formalityLevel}\n` : ''}
${userContexts.length > 0 ? `YOUR CURRENT STATUS:\n${userContexts.map((c) => `- ${c.content}`).join('\n')}\n` : ''}
${input.additionalContext ? `ADDITIONAL CONTEXT:\n${input.additionalContext}\n` : ''}

Generate 3 response options that:
1. Match the formality and style of this conversation
2. Use relevant context from the contact's background
3. Consider your current status and availability
4. Sound natural and authentic

Format your response as a JSON array of strings.`;

      const conversationHistory = input.recentMessages
        .slice(-10)
        .map((m) => `${m.isFromMe ? 'You' : contactContext?.name || 'Them'}: ${m.text}`)
        .join('\n');

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Recent conversation:\n${conversationHistory}\n\nGenerate 3 response suggestions:` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('No response from AI');
        }

        const parsed = JSON.parse(responseText);
        const suggestions = parsed.suggestions || parsed.responses || Object.values(parsed);

        return {
          suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
        };
      } catch (error) {
        console.error('OpenAI error:', error);
        throw new Error('Failed to generate suggestions');
      }
    }),

  // Analyze conversation style
  analyzeStyle: publicProcedure
    .input(z.object({ contactPhone: z.string() }))
    .mutation(async ({ input }) => {
      const messages = imessageDB.getAllMessagesForContact(input.contactPhone);

      // Filter only messages from the contact (not from me)
      const theirMessages = messages.filter((m) => !m.isFromMe && m.text);

      if (theirMessages.length === 0) {
        return {
          formalityLevel: 'neutral' as const,
          avgMessageLength: 0,
          emojiFrequency: 0,
          analysis: 'Not enough data',
        };
      }

      // Calculate metrics
      const avgMessageLength = theirMessages.reduce((sum, m) => sum + (m.text?.length || 0), 0) / theirMessages.length;
      const emojiCount = theirMessages.reduce((sum, m) => {
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        return sum + (m.text?.match(emojiRegex)?.length || 0);
      }, 0);
      const emojiFrequency = emojiCount / theirMessages.length;

      // Use AI to analyze formality
      try {
        const sampleMessages = theirMessages.slice(-20).map((m) => m.text).join('\n');

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'Analyze the formality level of these messages. Respond with a JSON object containing: { "formality": "casual" | "neutral" | "formal", "analysis": "brief explanation" }',
            },
            { role: 'user', content: sampleMessages },
          ],
          response_format: { type: 'json_object' },
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

        return {
          formalityLevel: analysis.formality || 'neutral',
          avgMessageLength: Math.round(avgMessageLength),
          emojiFrequency: parseFloat(emojiFrequency.toFixed(2)),
          analysis: analysis.analysis || 'Style analyzed',
        };
      } catch (error) {
        console.error('Style analysis error:', error);
        return {
          formalityLevel: 'neutral' as const,
          avgMessageLength: Math.round(avgMessageLength),
          emojiFrequency: parseFloat(emojiFrequency.toFixed(2)),
          analysis: 'Basic analysis completed',
        };
      }
    }),
});
