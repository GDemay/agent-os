import { OpenRouterProvider } from '../src/lib/llm/providers/openrouter';

async function main() {
  console.log("Testing OpenRouter with tngtech/deepseek-r1t-chimera:free...\n");
  
  const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);
  
  const prompt = `You are working on a coding task.

TASK:
Title: Create hello.txt file with content
Description: Create a file named hello.txt in the project root containing "Hello World"

AVAILABLE TOOLS:
- filesystem: Read, write, list, and manage files
- shell: Execute shell commands  
- git: Git operations

INSTRUCTIONS:
1. Analyze what needs to be done
2. Use the available tools to complete the task
3. When completely done, set status to "complete"

Respond with a JSON object:
{
  "thinking": "your analysis and plan",
  "actions": [
    {"tool": "filesystem", "args": {"action": "write", "path": "hello.txt", "content": "Hello World"}}
  ],
  "status": "complete",
  "summary": "Created hello.txt with Hello World content"
}`;

  try {
    console.log("Sending request...");
    const response = await provider.generate([
      { role: 'system', content: 'You are a helpful coding assistant. Always respond with valid JSON matching the requested format exactly.' },
      { role: 'user', content: prompt }
    ], { 
      model: 'tngtech/deepseek-r1t-chimera:free',
      temperature: 0.2,
      timeoutMs: 120000
    });
    
    console.log("\n=== Response ===");
    console.log("Model:", response.model);
    console.log("Tokens:", response.usage);
    console.log("\nContent:");
    console.log(response.content);
    console.log("\n=== Attempting to parse JSON ===");
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : response.content;
      const parsed = JSON.parse(jsonContent);
      console.log("Parsed successfully:");
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("Failed to parse as JSON:", e);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
