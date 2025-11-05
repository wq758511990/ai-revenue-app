const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充种子数据...');

  // 1. 创建情绪风格配置
  const toneStyles = [
    {
      name: '热情洋溢',
      slug: 'ENTHUSIASTIC',
      description: '充满活力和激情的表达风格',
      promptModifier: '请用热情洋溢、充满活力的语气，使用感叹号和积极的词汇，让文案充满激情和感染力。',
      sortOrder: 1,
    },
    {
      name: '专业严谨',
      slug: 'PROFESSIONAL',
      description: '正式、专业、可信的表达风格',
      promptModifier: '请用专业严谨的语气，使用准确的术语和数据，保持客观理性的表达方式，展现专业性和可信度。',
      sortOrder: 2,
    },
    {
      name: '轻松幽默',
      slug: 'HUMOROUS',
      description: '风趣幽默、轻松愉快的表达风格',
      promptModifier: '请用轻松幽默的语气，适当使用比喻和俏皮话，让文案读起来有趣且易于接受。',
      sortOrder: 3,
    },
    {
      name: '温柔亲和',
      slug: 'GENTLE',
      description: '温暖、亲切、有同理心的表达风格',
      promptModifier: '请用温柔亲和的语气，展现理解和关怀，使用温暖的词汇，让读者感到被关心和理解。',
      sortOrder: 4,
    },
    {
      name: '简洁直接',
      slug: 'CONCISE',
      description: '直截了当、简明扼要的表达风格',
      promptModifier: '请用简洁直接的语气，去除冗余表达，直击重点，用最少的文字传达最核心的信息。',
      sortOrder: 5,
    },
  ];

  console.log('创建情绪风格配置...');
  for (const style of toneStyles) {
    await prisma.toneStyle.upsert({
      where: { slug: style.slug },
      update: style,
      create: style,
    });
  }
  console.log(`✅ 已创建 ${toneStyles.length} 个情绪风格`);

  // 2. 创建文案场景配置
  const scenarios = [
    {
      name: '小红书爆款文案',
      slug: 'xiaohongshu',
      description: '适合小红书平台的种草文案，吸引眼球，引发共鸣',
      platform: '小红书',
      inputSchema: {
        fields: [
          {
            name: 'productName',
            label: '产品名称',
            type: 'text',
            required: true,
            placeholder: '请输入产品名称',
          },
          {
            name: 'features',
            label: '产品特点',
            type: 'textarea',
            required: true,
            placeholder: '列出产品的主要特点和卖点',
            maxLength: 200,
          },
          {
            name: 'targetAudience',
            label: '目标用户',
            type: 'select',
            options: ['年轻女性', '职场人士', '学生群体', '宝妈群体'],
            required: false,
          },
        ],
      },
      systemPrompt: `你是一名专业的小红书文案撰写专家。请根据用户提供的产品信息，生成一篇适合小红书平台的爆款文案。

要求：
1. 使用emoji增强表达力
2. 标题要吸引眼球，引发好奇
3. 内容要真实、有共鸣感
4. 适当使用"姐妹们"、"宝子们"等亲切称呼
5. 突出使用体验和效果
6. 字数控制在300-500字

产品信息：
- 产品名称：{{productName}}
- 产品特点：{{features}}
{{#if targetAudience}}- 目标用户：{{targetAudience}}{{/if}}`,
      defaultToneStyle: 'ENTHUSIASTIC',
      maxLength: 500,
      sortOrder: 1,
    },
    {
      name: '抖音短视频脚本',
      slug: 'douyin',
      description: '15-60秒短视频文案脚本，快节奏，强冲击',
      platform: '抖音',
      inputSchema: {
        fields: [
          {
            name: 'topic',
            label: '视频主题',
            type: 'text',
            required: true,
          },
          {
            name: 'duration',
            label: '视频时长',
            type: 'select',
            options: ['15秒', '30秒', '60秒'],
            required: true,
          },
          {
            name: 'hook',
            label: '开场钩子',
            type: 'text',
            placeholder: '用一句话抓住观众注意力',
          },
        ],
      },
      systemPrompt: `你是一名抖音短视频文案策划师。请根据用户需求，生成一份短视频脚本。

要求：
1. 前3秒必须吸引注意力
2. 内容节奏快，信息密度高
3. 包含镜头提示和配音文案
4. 结尾要有行动号召（CTA）
5. 时长：{{duration}}

主题：{{topic}}
{{#if hook}}开场钩子：{{hook}}{{/if}}`,
      defaultToneStyle: 'ENTHUSIASTIC',
      maxLength: 400,
      sortOrder: 2,
    },
    {
      name: '微信朋友圈文案',
      slug: 'wechat-moments',
      description: '适合微信朋友圈发布的生活化文案',
      platform: '微信',
      inputSchema: {
        fields: [
          {
            name: 'content',
            label: '想表达的内容',
            type: 'textarea',
            required: true,
            placeholder: '简单描述你想分享的内容',
          },
          {
            name: 'mood',
            label: '心情',
            type: 'select',
            options: ['开心', '感动', '思考', '日常', '吐槽'],
          },
        ],
      },
      systemPrompt: `你是一名朋友圈文案创作者。请根据用户的内容和心情，生成一条适合发朋友圈的文案。

要求：
1. 自然、生活化，不要过于商业化
2. 适当使用emoji
3. 长度适中，3-5行为宜
4. 可以适当留白，引发思考

内容：{{content}}
{{#if mood}}心情：{{mood}}{{/if}}`,
      defaultToneStyle: 'GENTLE',
      maxLength: 200,
      sortOrder: 3,
    },
    {
      name: '电商产品详情页',
      slug: 'product-detail',
      description: '电商产品详情页文案，突出卖点，促进转化',
      platform: '电商平台',
      inputSchema: {
        fields: [
          {
            name: 'productName',
            label: '产品名称',
            type: 'text',
            required: true,
          },
          {
            name: 'category',
            label: '产品类别',
            type: 'text',
            required: true,
          },
          {
            name: 'sellingPoints',
            label: '核心卖点',
            type: 'textarea',
            required: true,
            placeholder: '列出3-5个核心卖点',
          },
          {
            name: 'targetProblem',
            label: '解决的痛点',
            type: 'textarea',
            placeholder: '这个产品解决用户的什么问题？',
          },
        ],
      },
      systemPrompt: `你是一名电商文案策划师。请为产品撰写详情页文案。

要求：
1. 突出产品核心卖点
2. 痛点+解决方案的逻辑
3. 包含使用场景描述
4. 增强信任感（如质检、认证等）
5. 结尾引导下单

产品信息：
- 名称：{{productName}}
- 类别：{{category}}
- 卖点：{{sellingPoints}}
{{#if targetProblem}}- 解决痛点：{{targetProblem}}{{/if}}`,
      defaultToneStyle: 'PROFESSIONAL',
      maxLength: 800,
      sortOrder: 4,
    },
    {
      name: '招聘JD',
      slug: 'job-description',
      description: '企业招聘职位描述，吸引优秀人才',
      platform: '招聘平台',
      inputSchema: {
        fields: [
          {
            name: 'position',
            label: '职位名称',
            type: 'text',
            required: true,
          },
          {
            name: 'company',
            label: '公司名称',
            type: 'text',
            required: true,
          },
          {
            name: 'responsibilities',
            label: '岗位职责',
            type: 'textarea',
            required: true,
            placeholder: '列出主要工作职责',
          },
          {
            name: 'requirements',
            label: '任职要求',
            type: 'textarea',
            required: true,
            placeholder: '学历、经验、技能要求等',
          },
          {
            name: 'benefits',
            label: '福利待遇',
            type: 'textarea',
            placeholder: '薪资范围、福利、发展机会等',
          },
        ],
      },
      systemPrompt: `你是一名HR招聘专家。请根据提供的信息，撰写一份专业且吸引人的招聘JD。

要求：
1. 标题明确，突出职位和公司亮点
2. 岗位职责清晰具体，3-5条
3. 任职要求合理，避免过于苛刻
4. 福利待遇有吸引力
5. 语言专业但不失温度
6. 字数控制在600-800字

职位信息：
- 职位：{{position}}
- 公司：{{company}}
- 职责：{{responsibilities}}
- 要求：{{requirements}}
{{#if benefits}}- 福利：{{benefits}}{{/if}}`,
      defaultToneStyle: 'PROFESSIONAL',
      maxLength: 800,
      sortOrder: 5,
    },
    {
      name: '公众号推文',
      slug: 'wechat-article',
      description: '微信公众号长图文，深度内容',
      platform: '微信公众号',
      inputSchema: {
        fields: [
          {
            name: 'topic',
            label: '文章主题',
            type: 'text',
            required: true,
          },
          {
            name: 'keyPoints',
            label: '核心观点',
            type: 'textarea',
            required: true,
            placeholder: '列出3-5个核心观点',
          },
          {
            name: 'targetAudience',
            label: '目标读者',
            type: 'select',
            options: ['职场人士', '创业者', '学生群体', '家长群体', '通用'],
          },
        ],
      },
      systemPrompt: `你是一名公众号内容编辑。请根据主题和观点，创作一篇公众号推文。

要求：
1. 标题吸引点击（可使用数字、疑问、悬念等技巧）
2. 开头引发共鸣或提出痛点
3. 正文有逻辑结构（总分总/递进/对比等）
4. 每个观点有实例或数据支撑
5. 结尾有行动号召或金句
6. 适当使用小标题分段
7. 字数800-1200字

主题：{{topic}}
核心观点：{{keyPoints}}
{{#if targetAudience}}目标读者：{{targetAudience}}{{/if}}`,
      defaultToneStyle: 'PROFESSIONAL',
      maxLength: 1200,
      sortOrder: 6,
    },
    {
      name: '活动策划文案',
      slug: 'event-planning',
      description: '线上线下活动宣传文案',
      platform: '活动平台',
      inputSchema: {
        fields: [
          {
            name: 'eventName',
            label: '活动名称',
            type: 'text',
            required: true,
          },
          {
            name: 'eventType',
            label: '活动类型',
            type: 'select',
            options: ['促销活动', '品牌活动', '社交活动', '培训讲座', '其他'],
            required: true,
          },
          {
            name: 'time',
            label: '活动时间',
            type: 'text',
            required: true,
          },
          {
            name: 'highlights',
            label: '活动亮点',
            type: 'textarea',
            required: true,
            placeholder: '特色环节、嘉宾、优惠等',
          },
        ],
      },
      systemPrompt: `你是一名活动策划文案撰写者。请为活动创作宣传文案。

要求：
1. 标题有吸引力，突出活动价值
2. 明确活动时间、地点、参与方式
3. 突出活动亮点和独特价值
4. 制造紧迫感（限时、限量等）
5. 结尾有明确的CTA（报名/购买）
6. 字数控制在400-600字

活动信息：
- 名称：{{eventName}}
- 类型：{{eventType}}
- 时间：{{time}}
- 亮点：{{highlights}}`,
      defaultToneStyle: 'ENTHUSIASTIC',
      maxLength: 600,
      sortOrder: 7,
    },
    {
      name: '自媒体标题',
      slug: 'media-title',
      description: '爆款标题生成，提升点击率',
      platform: '自媒体平台',
      inputSchema: {
        fields: [
          {
            name: 'content',
            label: '内容主题',
            type: 'textarea',
            required: true,
            placeholder: '简单描述文章/视频的核心内容',
          },
          {
            name: 'keywords',
            label: '关键词',
            type: 'text',
            placeholder: '用逗号分隔，如：减肥,健身,瘦身',
          },
        ],
      },
      systemPrompt: `你是一名标题优化专家。请根据内容生成5个不同风格的吸引人标题。

要求：
1. 每个标题15-30字
2. 使用不同的标题技巧（数字、疑问、对比、悬念、痛点）
3. 包含关键词
4. 避免标题党，内容要真实
5. 标题要有画面感或情绪

内容主题：{{content}}
{{#if keywords}}关键词：{{keywords}}{{/if}}

请按以下格式输出：
1. [数字型] ...
2. [疑问型] ...
3. [对比型] ...
4. [悬念型] ...
5. [痛点型] ...`,
      defaultToneStyle: 'ENTHUSIASTIC',
      maxLength: 200,
      sortOrder: 8,
    },
    {
      name: '商品评价',
      slug: 'product-review',
      description: '真实、有用的商品评价文案',
      platform: '电商平台',
      inputSchema: {
        fields: [
          {
            name: 'productName',
            label: '商品名称',
            type: 'text',
            required: true,
          },
          {
            name: 'experience',
            label: '使用体验',
            type: 'textarea',
            required: true,
            placeholder: '描述使用感受、效果、优缺点等',
          },
          {
            name: 'rating',
            label: '评分',
            type: 'select',
            options: ['5星好评', '4星推荐', '3星一般', '2星不满', '1星差评'],
            required: true,
          },
        ],
      },
      systemPrompt: `你是一名真实买家。请根据使用体验撰写一条商品评价。

要求：
1. 真实客观，有理有据
2. 包含具体细节（外观、功能、使用感受等）
3. 提及优点和（适当的）不足
4. 给其他买家实用建议
5. 语言自然，像真人说话
6. 字数100-300字

商品：{{productName}}
体验：{{experience}}
评分：{{rating}}`,
      defaultToneStyle: 'GENTLE',
      maxLength: 300,
      sortOrder: 9,
    },
    {
      name: '邮件营销',
      slug: 'email-marketing',
      description: 'EDM营销邮件，促进转化',
      platform: '邮件',
      inputSchema: {
        fields: [
          {
            name: 'purpose',
            label: '邮件目的',
            type: 'select',
            options: ['新品推广', '优惠促销', '用户唤醒', '内容分享', '邀请活动'],
            required: true,
          },
          {
            name: 'offer',
            label: '核心利益点',
            type: 'textarea',
            required: true,
            placeholder: '优惠内容、产品亮点、活动价值等',
          },
          {
            name: 'cta',
            label: '行动号召',
            type: 'text',
            placeholder: '如：立即购买、查看详情、注册参与等',
          },
        ],
      },
      systemPrompt: `你是一名邮件营销文案专家。请撰写一封营销邮件。

要求：
1. 主题行简洁有力（10字内），激发打开欲望
2. 称呼个性化（尊敬的用户/会员）
3. 正文突出核心利益点
4. 制造紧迫感（限时、限量）
5. CTA按钮文案清晰
6. 结尾礼貌专业
7. 字数控制在300-500字

邮件目的：{{purpose}}
核心利益：{{offer}}
{{#if cta}}行动号召：{{cta}}{{/if}}`,
      defaultToneStyle: 'PROFESSIONAL',
      maxLength: 500,
      sortOrder: 10,
    },
    {
      name: '知乎回答',
      slug: 'zhihu-answer',
      description: '专业、深度的知乎问题回答',
      platform: '知乎',
      inputSchema: {
        fields: [
          {
            name: 'question',
            label: '问题',
            type: 'textarea',
            required: true,
            placeholder: '输入知乎问题标题',
          },
          {
            name: 'viewpoint',
            label: '你的观点',
            type: 'textarea',
            required: true,
            placeholder: '简要说明你的核心观点和论据',
          },
        ],
      },
      systemPrompt: `你是一名知乎优秀回答者。请针对问题给出高质量回答。

要求：
1. 开头简明扼要给出结论
2. 正文有逻辑层次（观点+论据+实例）
3. 使用专业知识和数据支持
4. 可适当分享个人经历
5. 客观理性，避免绝对化表达
6. 适当使用小标题和列表
7. 结尾可总结或给建议
8. 字数800-1200字

问题：{{question}}
我的观点：{{viewpoint}}`,
      defaultToneStyle: 'PROFESSIONAL',
      maxLength: 1200,
      sortOrder: 11,
    },
    {
      name: '社群公告',
      slug: 'community-notice',
      description: '微信群、社群公告通知',
      platform: '社群',
      inputSchema: {
        fields: [
          {
            name: 'type',
            label: '公告类型',
            type: 'select',
            options: ['活动通知', '规则提醒', '福利发放', '重要公告', '日常通知'],
            required: true,
          },
          {
            name: 'content',
            label: '公告内容',
            type: 'textarea',
            required: true,
            placeholder: '需要通知的具体事项',
          },
        ],
      },
      systemPrompt: `你是一名社群运营者。请撰写一条社群公告。

要求：
1. 开头有吸引注意的emoji或称呼
2. 信息清晰，重点突出
3. 关键信息加粗或使用emoji标注
4. 如有行动要求，给出明确指引
5. 语气亲切但不失专业
6. 字数控制在100-300字

公告类型：{{type}}
公告内容：{{content}}`,
      defaultToneStyle: 'GENTLE',
      maxLength: 300,
      sortOrder: 12,
    },
  ];

  console.log('创建文案场景配置...');
  for (const scenario of scenarios) {
    await prisma.contentScenario.upsert({
      where: { slug: scenario.slug },
      update: scenario,
      create: scenario,
    });
  }
  console.log(`✅ 已创建 ${scenarios.length} 个文案场景`);

  console.log('✅ 种子数据填充完成!');
}

main()
  .catch(e => {
    console.error('种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

