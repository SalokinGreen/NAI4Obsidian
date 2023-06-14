const { Encoder } = require("nai-js-tokenizer");
let tokenizerData = require("../tokenizers/nerdstash_tokenizer.json");
interface Tks {
	[key: string]: {
		[key: string]: number;
	};
}
const tks: Tks = {
	opus: {
		"clio-v1": 8192,
		"krake-v2": 2048,
		"euterpe-v2": 2048,
	},
	scroll: {
		"clio-v1": 6144,
		"krake-v2": 0,
		"euterpe-v2": 2048,
	},
	tablet: {
		"clio-v1": 3072,
		"krake-v2": 0,
		"euterpe-v2": 1024,
	},
};
let encoder = new Encoder(
	tokenizerData.vocab,
	tokenizerData.merges,
	tokenizerData.specialTokens,
	tokenizerData.config
);
interface ATTG {
	author: string;
	genre: string;
	tags: string;
	title: string;
}

export default function ContextBuilder(
	text: string,
	attg: ATTG,
	memory: string,
	prefix: string,
	model: string,
	sub: string,
	tokens: number,
	generate_until_sentence: boolean
) {
	if (model === "krake-v2") {
		tokenizerData = require("../tokenizers/pile_tokenizer.json");
		encoder = new Encoder(
			tokenizerData.vocab,
			tokenizerData.merges,
			tokenizerData.specialTokens,
			tokenizerData.config
		);
	} else if (model === "euterpe-v2") {
		tokenizerData = require("../tokenizers/gpt2_tokenizer.json");
		encoder = new Encoder(
			tokenizerData.vocab,
			tokenizerData.merges,
			tokenizerData.specialTokens,
			tokenizerData.config
		);
	}
	const prefixTokens = prefix !== "" ? 40 : 0;
	const generatedTokens = generate_until_sentence ? 20 : 0;
	const memoryTokens = memory !== "" ? encoder.encode(memory + "\n") : [];
	const memoryLength = memoryTokens.length;
	// builg ATTG
	let attgString = "[ ";
	if (attg.author !== "") {
		attgString += "Author: " + attg.author + "; ";
	}
	attgString += "Title: " + attg.title + "; ";
	if (attg.tags !== "") {
		attgString += "Tags: " + attg.tags + "; ";
	}
	if (attg.genre !== "") {
		attgString += "Genre: " + attg.genre + "; ";
	}
	// remove last semicolon
	attgString = attgString.slice(0, -2);
	// add closing bracket
	attgString += " ]\n";

	const attgTokens = encoder.encode(attgString);
	const attgTokensLength = attgTokens.length;
	const defaultTokens: number = tks[sub][model];
	let maxSize =
		defaultTokens -
		tokens -
		prefixTokens -
		generatedTokens -
		memoryLength -
		attgTokensLength;

	const encoded = encoder.encode(cleanMarkdown(text));
	const reversedContext = encoded.reverse();
	const turnedAroundContext = reversedContext.slice(0, maxSize);
	const context = turnedAroundContext.reverse();
	const finalConext = [...attgTokens, ...memoryTokens, ...context];
	return finalConext;
}
function cleanMarkdown(text: string) {
	console.log("Before: " + text);
	while (text.includes("\n\n")) {
		text = text.replace("\n\n", "\n");
	}
	while (text.includes("  ")) {
		text = text.replace("  ", " ");
	}
	text = text.trim();
	// remove markdown

	console.log("After: " + text);
	return text;
}
