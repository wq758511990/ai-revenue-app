import { AIMessage } from '../types/ai-provider';
import logger from '../utils/logger';

/**
 * Prompt构建器 - 动态构建AI提示词
 */
export class PromptBuilderService {
  /**
   * 构建完整的提示词消息
   */
  buildPrompt(
    scenarioPrompt: string,
    toneModifier: string,
    userInput: Record<string, any>
  ): AIMessage[] {
    // 1. 系统提示词
    const systemPrompt = this.buildSystemPrompt(toneModifier);

    // 2. 场景提示词 + 用户输入
    const userPrompt = this.replaceVariables(scenarioPrompt, userInput);

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    logger.debug('Prompt已构建', {
      systemLength: systemPrompt.length,
      userLength: userPrompt.length,
    });

    return messages;
  }

  /**
   * 构建系统提示词（包含情绪风格）
   */
  private buildSystemPrompt(toneModifier: string): string {
    const basePrompt = `你是一名专业的文案撰写助手。你的任务是根据用户提供的信息和要求，生成高质量的营销文案。

重要原则：
1. 避免AI腔调，使用自然、真实的表达
2. 内容要具体、有画面感，不要空泛
3. 避免过度使用形容词堆砌
4. 语言要贴近目标受众，不要说教
5. 保持真诚，不夸大其词

${toneModifier}

请直接输出文案内容，不要包含"以下是..."、"根据您的要求..."等开场白。`;

    return basePrompt;
  }

  /**
   * 替换模板变量
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // 替换简单变量 {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null && value !== '') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value));
      }
    }

    // 处理条件语句 {{#if variable}}...{{/if}}
    result = this.processConditionals(result, variables);

    // 清理未使用的变量占位符
    result = result.replace(/{{[^}]+}}/g, '');

    return result.trim();
  }

  /**
   * 处理条件语句
   */
  private processConditionals(template: string, variables: Record<string, any>): string {
    let result = template;

    // 匹配 {{#if variable}}...{{/if}}
    const conditionalRegex = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs;

    result = result.replace(conditionalRegex, (_match, variableName, content) => {
      const value = variables[variableName];
      // 如果变量有值，保留内容；否则移除
      return value !== undefined && value !== null && value !== '' ? content : '';
    });

    return result;
  }
}

export default new PromptBuilderService();

