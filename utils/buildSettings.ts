interface Package {
	email: string;
	password: string;
	sub: string;
	apiKey: string;
	model: string;
	tokens: string;
	generate_until_sentence: boolean;
	prefix: string;
	temperature: string;
	top_p: string;
	top_k: string;
	repetition_penalty: string;
	top_a: string;
	typical_p: string;
	tail_free_sampling: string;
	repetition_penalty_range: string;
	repetition_penalty_slope: string;
	repetition_penalty_frequency: string;
	repetition_penalty_presence: string;
	order: string;
	tags: string;
	author: string;
	genre: string;
	memory: string;
}
export default function buildSettings(pkg: Package) {
	let settings = {};
	// get settings from package
	let tokens = Number(pkg.tokens);
	let temperature = Number(pkg.temperature);
	let top_p = Number(pkg.top_p);
	let top_k = Number(pkg.top_k);
	let repetition_penalty = Number(pkg.repetition_penalty);
	let top_a = Number(pkg.top_a);
	let typical_p = Number(pkg.typical_p);
	let tail_free_sampling = Number(pkg.tail_free_sampling);
	let repetition_penalty_range = Number(pkg.repetition_penalty_range);
	let repetition_penalty_slope = Number(pkg.repetition_penalty_slope);
	let repetition_penalty_frequency = Number(pkg.repetition_penalty_frequency);
	let repetition_penalty_presence = Number(pkg.repetition_penalty_presence);
	let order = pkg.order.split(",").map((n) => Number(n));
	// put settings in. If 0, don't add.
	tokens !== 0 ? ((settings as any)["max_length"] = tokens) : 40;
	top_p !== 0 ? ((settings as any)["top_p"] = top_a) : null;
	top_k !== 0 ? ((settings as any)["top_k"] = top_k) : null;
	temperature !== 0 ? ((settings as any)["temperature"] = temperature) : 0.9;
	repetition_penalty !== 0
		? ((settings as any)["repetition_penalty"] = repetition_penalty)
		: 0.9;
	typical_p !== 0 ? ((settings as any)["typical_p"] = typical_p) : 0.9;
	tail_free_sampling !== 0
		? ((settings as any)["tail_free_sampling"] = tail_free_sampling)
		: 0.9;
	repetition_penalty_range !== 0
		? ((settings as any)["repetition_penalty_range"] =
				repetition_penalty_range)
		: 0.9;
	repetition_penalty_slope !== 0
		? ((settings as any)["repetition_penalty_slope"] =
				repetition_penalty_slope)
		: 0.9;
	repetition_penalty_frequency !== 0
		? ((settings as any)["repetition_penalty_frequency"] =
				repetition_penalty_frequency)
		: 0.9;
	repetition_penalty_presence !== 0
		? ((settings as any)["repetition_penalty_presence"] =
				repetition_penalty_presence)
		: 0.9;
	(settings as any)["order"] = order;

	// build settings
	return settings;
}
