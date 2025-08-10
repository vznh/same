// services/helperClient
import axios from "axios";

interface OClientI {

  // tools that the agent can use

  // tester
  ping(): Promise<boolean>;
}

// perform CRUD with all frames, or generate within them
class OClient implements OClientI {
  private key: string | undefined = process.env.OAI_KEY;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("* Key wasn't given. Check .env.");
    this.key = apiKey;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 200 && response.data?.choices?.length > 0;
    } catch (e) {
      console.error("* Ping returned error.\n", e);
      return false;
    }
  }
};

const chatClient = new OClient(
  process.env.OAI_API_KEY || ""
);

export default chatClient;
