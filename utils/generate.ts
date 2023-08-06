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
	inst: boolean
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
	const binaryArray = to16BitLittleEndianBinaryArray(context);
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
		url: "https://api.novelai.net/ai/generate",
		method: "POST",
		body: JSON.stringify(body),
		headers: headers,
	});
	if (response.status !== 201) {
		throw new Error("Failed to generate text");
	}
	const bss = response.json.output;
	const bs = base64ToBinaryString(bss);
	const ua = binaryStringToUint8Array(bs);
	const numbers = uint8ArrayToNumbers(ua);
	return numbers;
}
// Make to byte
// Convert the array of numbers into an array of 16-bit little endian binary strings
function to16BitLittleEndianBinaryArray(numbers: number[]) {
	return numbers.map((number) => {
		const lowByte = number & 0xff;
		const highByte = (number >> 8) & 0xff;
		return String.fromCharCode(lowByte) + String.fromCharCode(highByte);
	});
}

// Convert the binary string into a Uint8Array
function binaryStringToUint8Array(binaryString: string) {
	const byteArray = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		byteArray[i] = binaryString.charCodeAt(i);
	}
	return byteArray;
}

// Encode the Uint8Array into a base64 string
function uint8ArrayToBase64(uint8Array: Uint8Array) {
	const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
	return base64String;
}

// get bytes back into tokens
// Decode the base64 string into a binary string
function base64ToBinaryString(base64String: string) {
	const binaryString = atob(base64String);
	return binaryString;
}

// Convert the Uint8Array back into an array of numbers
function uint8ArrayToNumbers(uint8Array: Uint8Array) {
	const numbers = [];
	for (let i = 0; i < uint8Array.length; i += 2) {
		const lowByte = uint8Array[i];
		const highByte = uint8Array[i + 1];
		const number = (highByte << 8) | lowByte;
		numbers.push(number);
	}
	return encoder.decode(numbers);
}
