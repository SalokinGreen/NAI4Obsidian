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
	context: number[],
	settings: any,
	key: string,
	model: string,
	prefix: string,
	inst: boolean,
	customEndPoint: string
) {
	let apiEndpoint = "https://text.novelai.net/ai/generate";
	let check = 200;
	if (model === "clio-v1") {
		apiEndpoint = "https://api.novelai.net/ai/generate";
		check = 201;
		tokenizerData = require("../tokenizers/nerdstash_tokenizer.json");
		encoder = new Encoder(
			tokenizerData.vocab,
			tokenizerData.merges,
			tokenizerData.specialTokens,
			tokenizerData.config
		);
	} else if (model === "llama-3-erato-v1") {
		tokenizerData = require("../tokenizers/llama3nai_tokenizer.json");
		encoder = new Encoder(
			tokenizerData.vocab,
			tokenizerData.merges,
			tokenizerData.specialTokens,
			tokenizerData.config
		);
	}
	if (customEndPoint !== "") {
		apiEndpoint = customEndPoint;
	}

	// Convert tokens to binary based on model type
	const isLlama = model === "llama-3-erato-v1";
	// crop last token from context
	context.pop();
	let lastToken = context.pop();
	const binaryArray = isLlama
		? to32BitLittleEndianBinaryArray(context)
		: to16BitLittleEndianBinaryArray(context);

	const binaryString = binaryArray.join("");
	const uint8Array = binaryStringToUint8Array(binaryString);
	const base64String = uint8ArrayToBase64(uint8Array);

	let newPrefix = prefix;
	if (inst) {
		newPrefix = "special_instruct";
	}

	const body = {
		input: base64String,
		parameters: {
			...settings,
			prefix: newPrefix === "" ? "vanilla" : newPrefix,
			min_length: 1,
			cropped_token: lastToken,
		},
		model: model,
	};

	const headers = {
		"Content-Type": "application/json",
		accept: "application/json",
		Authorization: `Bearer ${key}`,
	};

	try {
		const response = await requestUrl({
			url: apiEndpoint,
			method: "POST",
			body: JSON.stringify(body),
			headers: headers,
		});

		if (response.status !== check) {
			const errorMessage = `Failed to generate text (${response.status})`;
			switch (response.status) {
				case 401:
					throw new Error(
						`${errorMessage}: Invalid API key or unauthorized access`
					);
				case 402:
					throw new Error(
						`${errorMessage}: Payment required - Check your NovelAI subscription`
					);
				case 429:
					throw new Error(
						`${errorMessage}: Too many requests - Please wait before trying again`
					);
				case 500:
				case 502:
				case 503:
				case 504:
					throw new Error(
						`${errorMessage}: NovelAI service error - Please try again later`
					);
				default:
					throw new Error(
						`${errorMessage}: Unexpected error occurred`
					);
			}
		}

		if (!response.json?.output) {
			throw new Error("No output received from NovelAI");
		}

		const bss = response.json.output;
		const bs = base64ToBinaryString(bss);
		const ua = binaryStringToUint8Array(bs);
		const numbers = isLlama
			? uint8ArrayToNumbers32Bit(ua)
			: uint8ArrayToNumbers16Bit(ua);
		// remove first token from generated text
		numbers.shift();
		return encoder.decode(numbers);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Generation failed: ${error.message}`);
		} else {
			throw new Error(
				"An unexpected error occurred during text generation"
			);
		}
	}
}

// Convert to 32-bit (4-byte) little endian binary array for Llama tokens
function to32BitLittleEndianBinaryArray(numbers: number[]) {
	return numbers.map((number) => {
		const byte0 = number & 0xff;
		const byte1 = (number >> 8) & 0xff;
		const byte2 = (number >> 16) & 0xff;
		const byte3 = (number >> 24) & 0xff;
		return (
			String.fromCharCode(byte0) +
			String.fromCharCode(byte1) +
			String.fromCharCode(byte2) +
			String.fromCharCode(byte3)
		);
	});
}

// Convert to 16-bit (2-byte) little endian binary array for other models
function to16BitLittleEndianBinaryArray(numbers: number[]) {
	return numbers.map((number) => {
		const lowByte = number & 0xff;
		const highByte = (number >> 8) & 0xff;
		return String.fromCharCode(lowByte) + String.fromCharCode(highByte);
	});
}

function binaryStringToUint8Array(binaryString: string) {
	const byteArray = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		byteArray[i] = binaryString.charCodeAt(i);
	}
	return byteArray;
}

function uint8ArrayToBase64(uint8Array: Uint8Array) {
	const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
	return base64String;
}

function base64ToBinaryString(base64String: string) {
	const binaryString = atob(base64String);
	return binaryString;
}

// Convert Uint8Array to numbers for 32-bit tokens (Llama)
function uint8ArrayToNumbers32Bit(uint8Array: Uint8Array) {
	const numbers = [];
	for (let i = 0; i < uint8Array.length; i += 4) {
		const byte0 = uint8Array[i];
		const byte1 = uint8Array[i + 1];
		const byte2 = uint8Array[i + 2];
		const byte3 = uint8Array[i + 3];
		const number = (byte3 << 24) | (byte2 << 16) | (byte1 << 8) | byte0;
		numbers.push(number);
	}
	return numbers;
}

// Convert Uint8Array to numbers for 16-bit tokens (other models)
function uint8ArrayToNumbers16Bit(uint8Array: Uint8Array) {
	const numbers = [];
	for (let i = 0; i < uint8Array.length; i += 2) {
		const lowByte = uint8Array[i];
		const highByte = uint8Array[i + 1];
		const number = (highByte << 8) | lowByte;
		numbers.push(number);
	}
	return numbers;
}
