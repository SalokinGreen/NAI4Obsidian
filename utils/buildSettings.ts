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

	// build settings
	return (settings = {
		max_length: tokens,
		temperature,
		top_p,
		top_k,
		repetition_penalty,
		top_a,
		typical_p,
		tail_free_sampling,
		repetition_penalty_range,
		repetition_penalty_slope,
		repetition_penalty_frequency,
		repetition_penalty_presence,
		order,
	});
}
