import { Encoder } from "nai-js-tokenizer";
let tokenizerData = require("../tokenizers/nerdstash_tokenizer_v2.json");

interface Tks {
	[key: string]: number;
}
const tks: Tks = {
	opus: 8192,

	scroll: 6144,

	tablet: 3072,
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
	generate_until_sentence: boolean,
	lore: string[]
) {
	if (model === "clio-v1") {
		tokenizerData = require("../tokenizers/nerdstash_tokenizer.json");
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
	const defaultTokens: number = tks[sub];
	let loreContext = "";
	let loreSize = 0;
	lore.forEach((l) => {
		if (loreSize + encoder.encode(l + "\n").length < defaultTokens - 1000) {
			loreContext += l + "\n";
			loreSize += encoder.encode(l + "\n").length;
		}
	});
	const loreTokens = encoder.encode(loreContext);

	let maxSize =
		defaultTokens -
		tokens -
		prefixTokens -
		generatedTokens -
		memoryLength -
		attgTokensLength -
		loreTokens.length;

	const encoded = encoder.encode(cleanMarkdown(text));
	const reversedContext = encoded.reverse();
	const turnedAroundContext = reversedContext.slice(0, maxSize);
	const context = turnedAroundContext.reverse();
	const finalConext = [
		...attgTokens,
		...memoryTokens,
		...loreTokens,
		...context,
	];
	console.log(finalConext.length);
	return finalConext;
}
function cleanMarkdown(text: string) {
	console.log("Before: " + text);
	// remove '#tags-tags'
	text = text.replace(/#[a-zA-Z0-9]+-[a-zA-Z0-9]+/g, "");
	// remove '#tags_tags'
	text = text.replace(/#[a-zA-Z0-9]+_[a-zA-Z0-9]+/g, "");
	// remove '#tags'
	text = text.replace(/#[a-zA-Z0-9]+/g, "");

	let lastNewLine = false;
	// check if there is a new line at the end of the text
	text[text.length - 1] === "\n" ? (lastNewLine = true) : null;

	// remove references and images: ![[]]
	text = text.replace(/\!\[\[.*?\]\]/g, "");
	// get rid of [[]]
	text = text.replace("[[", "");
	text = text.replace("]]", "");

	// remove markdown
	// to be added

	// remove newlines
	while (text.includes("\n\n")) {
		text = text.replace("\n\n", "\n");
	}
	while (text.includes("  ")) {
		text = text.replace("  ", " ");
	}
	text.replace("\n ", "\n");
	text.replace(" \n", "\n");
	text = text.trim();
	// add last newline
	lastNewLine ? (text += "\n") : null;
	console.log("After: " + text);
	return text;
}
