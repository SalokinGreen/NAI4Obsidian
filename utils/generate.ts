import { requestUrl } from "obsidian";
import { Encoder } from "nai-js-tokenizer";
let tokenizerData = require("../tokenizers/nerdstash_tokenizer_v2.json");
let encoder = new Encoder(
	tokenizerData.vocab,
	tokenizerData.merges,
	tokenizerData.specialTokens,
	tokenizerData.config
);
export default async function generate(
	context: string,
	settings: any,
	key: string,
	model: string,
	prefix: string,
	inst: boolean,
	customEndPoint: string,
	customModel: string
) {
	let apiEndpoint = "https://api.novelai.net/ai/generate";
	if (customEndPoint !== "") {
		apiEndpoint = customEndPoint;
	}
	if (model === "clio-v1") {
		tokenizerData = require("../tokenizers/nerdstash_tokenizer.json");
		encoder = new Encoder(
			tokenizerData.vocab,
			tokenizerData.merges,
			tokenizerData.specialTokens,
			tokenizerData.config
		);
	}

	let newPrefix = prefix;
	if (inst) {
		newPrefix = "special_instruct";
	}
	if (customModel !== "") {
		model = customModel;
	}
	const body = {
		input: context,
		parameters: {
			...settings,
			prefix: newPrefix === "" ? "vanilla" : newPrefix,
			min_length: 1,
			use_string: true,
		},
		model: model,
	};
	const headers = {
		"Content-Type": "application/json",
		accept: "application/json",
		Authorization: `Bearer ${key}`,
	};
	console.log(body);
	console.log(headers);
	const response = await requestUrl({
		url: apiEndpoint,
		method: "POST",
		body: JSON.stringify(body),
		headers: headers,
	});
	if (response.status !== 201) {
		throw new Error("Failed to generate text");
	}
	const bss = response.json.output;
	return bss;
}
