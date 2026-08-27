import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";

let _anthropic: Anthropic | undefined;
let _replicate: Replicate | undefined;

export function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export function getReplicateClient(): Replicate {
  if (!_replicate) {
    const auth = process.env.REPLICATE_API_TOKEN;
    if (!auth) throw new Error("REPLICATE_API_TOKEN manquante");
    _replicate = new Replicate({ auth });
  }
  return _replicate;
}
