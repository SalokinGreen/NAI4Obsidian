const { Encoder } = require("nai-js-tokenizer");
const tokenizerData = require("../tokenizers/nerdstash_tokenizer.json");

const encoder = new Encoder(
	tokenizerData.vocab,
	tokenizerData.merges,
	tokenizerData.specialTokens,
	tokenizerData.config
);
export default function translate(tokens: number[]) {
	return encoder.decode(tokens);
}
