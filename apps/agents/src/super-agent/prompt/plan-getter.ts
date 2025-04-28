import { tool } from "@langchain/core/tools";
import { z } from "zod";
const documents = [
    {
        id: "1",
        title: "深度搜索",
        description: `# 深度搜索方案
## 输入
- 用户查询主题

## 任务流程
1. 生成查询：基于用户输入构建有效的搜索查询
2. 网络研究：使用生成的查询获取相关信息
3. 反思总结：评估当前摘要质量和完整性
    - 如果需要更多信息：返回进行更多网络研究
    - 如果信息充分：进入最终阶段
4. 完成摘要：生成最终报告

## 关键特点
- 迭代研究循环确保信息全面性
- 自我反思机制评估信息质量
- 动态决策路由基于信息充分性
- 每一段的信息来源需要使用脚注标明

## 输出
- 综合性研究摘要报告`,
    },
];

export const planGetterNode = () => {
    return documents[0].description;
};
