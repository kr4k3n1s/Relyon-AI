import { ChatPromptTemplate } from "@langchain/core/prompts";

const systemTemplate = "Translate the following into {language}:";

export const translateTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "{text}"],
]);