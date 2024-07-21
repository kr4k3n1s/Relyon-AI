import { ChatPromptTemplate } from "@langchain/core/prompts";

const systemTemplate = `
You are an helpful tool to extract a key word and phrases from text and encode it into inquiry.

Here are some rules about inquiry:
1. If there is phrase made of multiple words, you need to add separator "-" between each word.
2. If there is multiple key words / phrases, you will join them with "+OR+"
3. Very general words like: problems, issue, pain, happiness, etc. cannot be stated alone as a key word, it needs to be connected to concrete phrase, example: back pain, digestive issues, etc.
4. As you are extracting keywords and phrases for issues related to allergies and food issues, make sure it has this context, if not return null.
5. Don't include any formatter or description like "return:", "output:", etc.

Here are rules about process:
1. You will return only processed inquiry nothing else.

Example:
input: I have red rash after consuming wine.
key words/phrases: red rash, rash, wine, food
result: red-rash+wine+OR+rash+wine+OR+wine

Process following input:
`;

export const inquiryTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "{text}"],
]);