/**
 * 内容安全过滤器
 * 使用DFA（确定有限状态自动机）算法进行敏感词过滤
 */

import logger from './logger';

/**
 * DFA树节点
 */
interface DFANode {
  isEnd: boolean;
  children: Map<string, DFANode>;
}

/**
 * 敏感词过滤器类
 */
export class ContentFilter {
  private root: DFANode;
  private keywordCount: number = 0;

  constructor() {
    this.root = {
      isEnd: false,
      children: new Map(),
    };
  }

  /**
   * 批量添加敏感词
   */
  public addKeywords(keywords: string[]): void {
    for (const keyword of keywords) {
      this.addKeyword(keyword);
    }
    logger.info(`敏感词库已加载，共 ${this.keywordCount} 个敏感词`);
  }

  /**
   * 添加单个敏感词到DFA树
   */
  private addKeyword(keyword: string): void {
    if (!keyword || keyword.trim().length === 0) {
      return;
    }

    const chars = keyword.trim().toLowerCase();
    let node = this.root;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (!node.children.has(char)) {
        node.children.set(char, {
          isEnd: false,
          children: new Map(),
        });
      }
      node = node.children.get(char)!;
    }

    if (!node.isEnd) {
      node.isEnd = true;
      this.keywordCount++;
    }
  }

  /**
   * 检查文本是否包含敏感词
   * @returns 包含的敏感词列表
   */
  public check(text: string): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    const foundKeywords: string[] = [];
    const normalizedText = text.toLowerCase();

    for (let i = 0; i < normalizedText.length; i++) {
      let node = this.root;
      let matchLength = 0;

      for (let j = i; j < normalizedText.length; j++) {
        const char = normalizedText[j];
        if (!node.children.has(char)) {
          break;
        }

        node = node.children.get(char)!;
        matchLength++;

        if (node.isEnd) {
          const keyword = text.substring(i, i + matchLength);
          if (!foundKeywords.includes(keyword)) {
            foundKeywords.push(keyword);
          }
        }
      }
    }

    return foundKeywords;
  }

  /**
   * 替换敏感词为***
   */
  public filter(text: string, replacement: string = '***'): string {
    if (!text || text.length === 0) {
      return text;
    }

    let result = text;
    const normalizedText = text.toLowerCase();

    // 记录所有需要替换的位置
    const replacements: Array<{ start: number; end: number }> = [];

    for (let i = 0; i < normalizedText.length; i++) {
      let node = this.root;
      let matchEnd = -1;

      for (let j = i; j < normalizedText.length; j++) {
        const char = normalizedText[j];
        if (!node.children.has(char)) {
          break;
        }

        node = node.children.get(char)!;

        if (node.isEnd) {
          matchEnd = j + 1;
        }
      }

      if (matchEnd > 0) {
        replacements.push({ start: i, end: matchEnd });
        i = matchEnd - 1; // 跳过已匹配的部分
      }
    }

    // 从后往前替换，避免索引偏移
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end } = replacements[i];
      result = result.substring(0, start) + replacement + result.substring(end);
    }

    return result;
  }

  /**
   * 获取敏感词数量
   */
  public getKeywordCount(): number {
    return this.keywordCount;
  }

  /**
   * 清空敏感词库
   */
  public clear(): void {
    this.root = {
      isEnd: false,
      children: new Map(),
    };
    this.keywordCount = 0;
  }
}

/**
 * 默认敏感词列表（基础版）
 * 实际使用时应从数据库或配置文件加载更完整的敏感词库
 */
const DEFAULT_KEYWORDS = [
  // 政治敏感
  '习近平',
  '共产党',
  '毛泽东',
  '邓小平',
  '江泽民',
  '胡锦涛',
  '六四',
  '天安门事件',
  '法轮功',
  '藏独',
  '台独',
  '疆独',
  '港独',
  
  // 色情低俗
  '色情',
  '黄色',
  '裸体',
  '性交',
  '做爱',
  '一夜情',
  '援交',
  '卖淫',
  '嫖娼',
  
  // 暴力违法
  '杀人',
  '自杀',
  '炸弹',
  '恐怖袭击',
  '枪支',
  '毒品',
  '大麻',
  '海洛因',
  '冰毒',
  '赌博',
  '洗钱',
  
  // 诈骗相关
  '刷单',
  '套现',
  '洗钱',
  '高利贷',
  '裸贷',
  '网络诈骗',
  '传销',
  '非法集资',
  
  // 其他违规
  '翻墙',
  'vpn',
  '代理服务器',
  '翻墙软件',
  '破解版',
  '盗版',
];

// 创建全局过滤器实例
const contentFilter = new ContentFilter();
contentFilter.addKeywords(DEFAULT_KEYWORDS);

export default contentFilter;

