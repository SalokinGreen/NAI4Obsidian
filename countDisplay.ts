import { Notice } from "obsidian";
import { Encoder } from "nai-js-tokenizer";
import llamaTokenizer from "llama3-tokenizer-js";

let tokenizerData = require("./tokenizers/nerdstash_tokenizer_v2.json");

export class CountDisplay {
	private static getEncoder(model: string): Encoder {
		if (model === "clio-v1") {
			tokenizerData = require("./tokenizers/nerdstash_tokenizer.json");
		}
		return new Encoder(
			tokenizerData.vocab,
			tokenizerData.merges,
			tokenizerData.specialTokens,
			tokenizerData.config
		);
	}

	public static countWords(text: string): number {
		return text.trim().split(/\s+/).length;
	}

	public static countTokens(text: string, model: string): number {
		if (model === "erato-v1") {
			return llamaTokenizer.encode(text).length;
		}
		const encoder = this.getEncoder(model);
		return encoder.encode(text).length;
	}

	public static showCounts(text: string, model: string) {
		const words = this.countWords(text);
		const tokens = this.countTokens(text, model);

		new Notice(`Words: ${words} | Tokens: ${tokens}`, 3000);
	}
}
