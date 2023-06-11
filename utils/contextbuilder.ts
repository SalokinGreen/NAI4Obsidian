const { Encoder } = require("nai-js-tokenizer");
const tokenizerData = require("../tokenizers/nerdstash_tokenizer.json");

const encoder = new Encoder(
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

	let maxSize =
		8196 -
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
	// remove markdown
	text = text.replace(/(\*\*|__)(.*?)\1/gms, "$2");
	text = text.replace(/(\*|_)(.*?)\1/gms, "$2");
	text = text.replace(/~~(.*?)~~/gms, "$1");
	text = text.replace(/`(.*?)`/gms, "$1");
	text = text.replace(/!\[(.*?)\]\((.*?)\)/gms, "$1");
	text = text.replace(/\[(.*?)\]\((.*?)\)/gms, "$1");
	text = text.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/gms, "");
	text = text.replace(/\n/gms, " ");
	text = text.replace(/\s\s+/gms, " ");
	// remove trailing spaces
	text = text.trim();
	// remove double newlines
	text = text.replace(/\n\n/gms, "\n");
	return text;
}
