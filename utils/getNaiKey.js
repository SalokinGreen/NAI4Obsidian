import _sodium from "libsodium-wrappers-sumo";
import { requestUrl } from "obsidian";
export default async function getKey(email, password) {
	await _sodium.ready;
	const sodium = _sodium;
	let wrongCredentials = false;
	async function naiHashArgon(email, password, size, domain) {
		const pre_salt = password.substring(0, 6) + email + domain;
		var raw = sodium
			.crypto_pwhash(
				64,
				new Uint8Array(sodium.from_string(password)),
				sodium.crypto_generichash(
					sodium.crypto_pwhash_SALTBYTES,
					pre_salt
				),
				2,
				2e6,
				sodium.crypto_pwhash_ALG_ARGON2ID13,
				"base64"
			)
			.slice(0, 64);
		return raw;
	}

	async function getAccessKey(email, password) {
		email = email.toLowerCase();
		var access_key = await naiHashArgon(
			email,
			password,
			64,
			"novelai_data_access_key"
		);
		return access_key.substr(0, 64).replace(/\//g, "_").replace(/\+/g, "-");
	}

	async function login(email, password) {
		var key = await getAccessKey(email, password);
		return key;
	}

	const data = await login(email, password);
	const json = JSON.stringify({ key: data });
	const headers = {
		"Content-Type": "application/json",
	};

	const key = await requestUrl({
		url: "https://api.novelai.net/user/login",
		method: "POST",
		body: json,
		headers: headers,
	});

	if (wrongCredentials) {
		return false;
	} else {
		return key.json.accessToken;
	}
}
