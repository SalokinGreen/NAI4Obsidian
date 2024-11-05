/* New settings:
math1_quad
: 
0.4
math1_quad_entropy_scale
: 
-0.1
math1_temp
: 
-0.4
*/
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
	white_list: boolean;
	cfg: string;
	phrase_repetition_penalty: string;
	mirostat_tau: string;
	mirostat_lr: string;
	top_g: string;
	math1_quad: string;
	math1_quad_entropy_scale: string;
	math1_temp: string;
}
interface Defaults {
	[key: string]: {
		bans: number[][] | null;
		bias: object[] | null;
	};
}
const defaults: Defaults = {
	"clio-v1": {
		bans: [
			[3],
			[49356],
			[1431],
			[31715],
			[34387],
			[20765],
			[30702],
			[10691],
			[49333],
			[1266],
			[19438],
			[43145],
			[26523],
			[41471],
			[2936],
			[23],
			[49522],
			[3695],
			[16967],
			[8353],
			[24],
		],
		bias: null,
	},
	"kayra-v1": {
		bans: [
			[3],
			[49356],
			[1431],
			[31715],
			[34387],
			[20765],
			[30702],
			[10691],
			[49333],
			[1266],
			[19438],
			[43145],
			[26523],
			[41471],
			[2936],
			[85, 85],
			[49332],
			[7286],
			[1115],
		],
		bias: [
			{
				sequence: [23],
				bias: -0.08,
				ensure_sequence_finish: false,
				generate_once: false,
			},
			{
				sequence: [21],
				bias: -0.08,
				ensure_sequence_finish: false,
				generate_once: false,
			},
		],
	},
};
export default function buildSettings(pkg: Package, def: boolean) {
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

	let phrase_rep_pen = pkg.phrase_repetition_penalty;
	let order = pkg.order.split(",").map((n) => Number(n));
	// put settings in. If 0, don't add.
	tokens !== 0 ? ((settings as any)["max_length"] = tokens) : 40;
	top_p !== 0 ? ((settings as any)["top_p"] = top_p) : null;
	top_a !== 0 ? ((settings as any)["top_a"] = top_a) : null;
	top_k !== 0 ? ((settings as any)["top_k"] = top_k) : null;
	temperature !== 0
		? ((settings as any)["temperature"] = temperature)
		: ((settings as any)["temperature"] = 0);
	repetition_penalty !== 0
		? ((settings as any)["repetition_penalty"] = repetition_penalty)
		: ((settings as any)["repetition_penalty"] = 0);
	typical_p !== 0
		? ((settings as any)["typical_p"] = typical_p)
		: ((settings as any)["typical_p"] = 0.0);
	tail_free_sampling !== 0
		? ((settings as any)["tail_free_sampling"] = tail_free_sampling)
		: ((settings as any)["tail_free_sampling"] = 0);
	repetition_penalty_range !== 0
		? ((settings as any)["repetition_penalty_range"] =
				repetition_penalty_range)
		: ((settings as any)["repetition_penalty_range"] = 0);
	repetition_penalty_slope !== 0
		? ((settings as any)["repetition_penalty_slope"] =
				repetition_penalty_slope)
		: ((settings as any)["repetition_penalty_slope"] = 0);
	repetition_penalty_frequency !== 0
		? ((settings as any)["repetition_penalty_frequency"] =
				repetition_penalty_frequency)
		: ((settings as any)["repetition_penalty_frequency"] = 0);
	repetition_penalty_presence !== 0
		? ((settings as any)["repetition_penalty_presence"] =
				repetition_penalty_presence)
		: ((settings as any)["repetition_penalty_presence"] = 0);
	(settings as any)["order"] = order;
	if (def) {
		defaults[pkg.model].bias
			? ((settings as any)["logit_bias_exp"] = defaults[pkg.model].bias)
			: null;
		defaults[pkg.model].bans
			? ((settings as any)["bad_words_ids"] = defaults[pkg.model].bans)
			: null;
	}
	if (pkg.white_list) {
		(settings as any)["repetition_penalty_whitelist"] = [
			49256, 49264, 49231, 49230, 49287, 85, 49255, 49399, 49262, 336,
			333, 432, 363, 468, 492, 745, 401, 426, 623, 794, 1096, 2919, 2072,
			7379, 1259, 2110, 620, 526, 487, 16562, 603, 805, 761, 2681, 942,
			8917, 653, 3513, 506, 5301, 562, 5010, 614, 10942, 539, 2976, 462,
			5189, 567, 2032, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132,
			588, 803, 1040, 49209, 4, 5, 6, 7, 8, 9, 10, 11, 12,
		];
	}

	(settings as any)["phrase_rep_pen"] = phrase_rep_pen;
	if (Number(pkg.mirostat_tau) > 0) {
		(settings as any)["mirostat_tau"] = Number(pkg.mirostat_tau);
		(settings as any)["mirostat_lr"] = Number(pkg.mirostat_lr);
	}
	if (Number(pkg.top_g) > 0) {
		(settings as any)["top_g"] = Number(pkg.top_g);
	}
	(settings as any)["generate_until_sentence"] = true;
	// build settings
	return settings;
}
