import https from 'https';
import { Tool } from '../agents/BaseAgent';

/**
 * Arguments for WebSearch tool
 */
export interface WebSearchArgs {
  query: string;
  maxResults?: number;
}

interface DuckDuckGoResult {
  Text?: string;
  FirstURL?: string;
  Topics?: DuckDuckGoResult[];
}

interface DuckDuckGoResponse {
  Heading?: string;
  AbstractText?: string;
  AbstractURL?: string;
  Answer?: string;
  AnswerType?: string;
  RelatedTopics?: DuckDuckGoResult[];
}

const fetchJson = async (url: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const { statusCode } = res;
        if (!statusCode || statusCode < 200 || statusCode >= 300) {
          reject(new Error(`Request failed with status ${statusCode}`));
          res.resume();
          return;
        }
        const chunks: Uint8Array[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            resolve(json);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
};

const flattenResults = (items: DuckDuckGoResult[] = []): DuckDuckGoResult[] => {
  const results: DuckDuckGoResult[] = [];
  for (const item of items) {
    if (item.Text || item.FirstURL) {
      results.push({ Text: item.Text, FirstURL: item.FirstURL });
    }
    if (item.Topics && item.Topics.length > 0) {
      results.push(...flattenResults(item.Topics));
    }
  }
  return results;
};

/**
 * WebSearch Tool - Search the web using DuckDuckGo Instant Answer API
 */
export const WebSearchTool: Tool = {
  name: 'websearch',
  description:
    'Search the web using DuckDuckGo Instant Answer API. Provide a query and optional maxResults.',
  parameters: {
    query: { type: 'string', description: 'Search query string' },
    maxResults: { type: 'number', description: 'Maximum number of results to return' },
  },

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { query, maxResults } = args as unknown as WebSearchArgs;

    if (!query || query.trim().length === 0) {
      throw new Error('query is required');
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_redirect: '1',
      no_html: '1',
      skip_disambig: '1',
    });

    const url = `https://api.duckduckgo.com/?${params.toString()}`;
    const data = (await fetchJson(url)) as DuckDuckGoResponse;

    const related = flattenResults(data.RelatedTopics);
    const limit = Math.max(1, Math.min(maxResults ?? 5, 10));

    const results = related.slice(0, limit).map((item) => ({
      title: item.Text || 'Result',
      url: item.FirstURL,
    }));

    return {
      success: true,
      query,
      results,
      summary: {
        heading: data.Heading,
        abstract: data.AbstractText,
        abstractUrl: data.AbstractURL,
        answer: data.Answer,
        answerType: data.AnswerType,
      },
    };
  },
};
