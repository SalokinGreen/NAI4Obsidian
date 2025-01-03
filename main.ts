import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";
import { LorebookModal } from "lorebook";
import { Entry } from "lorebook";
import createLore from "utils/createLore";

import getKey from "utils/getNaiKey";
import buildSettings from "utils/buildSettings";
import ContextBuilder from "utils/contextbuilder";
import generate from "utils/generate";
import { ProgressNotice } from "progressnotice";
import { CountDisplay } from "countDisplay";
import llama3Tokenizer from "llama3-tokenizer-js";
interface Settings {
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
	cfg: string;
	order: string;
	tags: string;
	author: string;
	genre: string;
	memory: string;
	defaultSettings: boolean;
	white_list: boolean;
	phrase_repetition_penalty: string;
	instruct_range: string;
	lore: Entry[];
	mirostat_tau: string;
	mirostat_lr: string;
	top_g: string;
	customApiEndpoint: string;
	math1_quad: string;
	math1_quad_entropy_scale: string;
	math1_temp: string;
	showStatusBar: boolean;
}
interface Parameters {
	model: string;
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
	cfg: string;
	order: string;
	defaultSettings: boolean;
	white_list: boolean;
	phrase_repetition_penalty: string;
	mirostat_tau: string;
	mirostat_lr: string;
	top_g: string;
	math1_quad?: string;
	math1_quad_entropy_scale?: string;
	math1_temp?: string;
}
const DefaultSettings: Settings = {
	email: "",
	password: "",
	apiKey: "",
	sub: "tablet",
	model: "clio-v1",
	tokens: "40",
	generate_until_sentence: true,
	prefix: "",
	author: "",
	genre: "",
	memory: "",
	tags: "",
	temperature: "2",
	top_p: "0",
	top_k: "4",
	repetition_penalty: "2.3",
	top_a: "0.71",
	typical_p: "0",
	tail_free_sampling: "0",
	repetition_penalty_range: "8192",
	repetition_penalty_slope: "0.09",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "1",
	white_list: true,
	phrase_repetition_penalty: "Off",
	order: "1, 0, 4",
	defaultSettings: true,
	instruct_range: "1000",
	lore: [],
	mirostat_tau: "0",
	mirostat_lr: "0",
	top_g: "0",
	customApiEndpoint: "",
	math1_quad: "0.4",
	math1_quad_entropy_scale: "-0.1",
	math1_temp: "-0.4",
	showStatusBar: false,
};

export default class NAI4Obsidian extends Plugin {
	settings: Settings;
	generating: boolean = false;
	lore: Entry[]; // lorebook entries

	settingsTab: NAI4ObsidianSettings;
	public countStatusBar: HTMLElement;

	private statusBarEvents: any[] = [];

	public registerStatusBarEvents() {
		// Clear any existing events
		this.statusBarEvents.forEach((evt) => evt());
		this.statusBarEvents = [];

		// Register new events
		this.statusBarEvents.push(
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", () =>
					this.updateStatusBar()
				)
			)
		);
		this.statusBarEvents.push(
			this.registerEvent(
				this.app.workspace.on("editor-change", () =>
					this.updateStatusBar()
				)
			)
		);
	}

	async onload() {
		this.settingsTab = new NAI4ObsidianSettings(this.app, this);
		this.addSettingTab(this.settingsTab);
		await this.loadSettings();
		this.lore = this.settings.lore;
		if (!this.lore) {
			this.lore = [];
		}
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"pencil",
			"NAI4Obsidian",
			async (evt: MouseEvent) => {
				if (this.generating) {
					new Notice("Already generating!");
					return;
				}

				this.generating = true;

				await generateMarkdown.call(this, this.generating).then(() => {
					this.generating = false;
				});
			}
		);
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// add commands
		this.addCommand({
			id: "getKey",
			name: "Get key",
			callback: async () => {
				const key = await getKey(
					this.settings.email,
					this.settings.password
				);
				new Notice("GOT IT!");
				this.settings.apiKey = key;
				await this.saveSettings();
			},
		});

		this.addCommand({
			id: "generate",
			name: "Generate",
			callback: async () => {
				if (this.generating) {
					new Notice("Already generating!");
					return;
				}
				this.generating = true;
				await generateMarkdown.call(this, this.generating).then(() => {
					this.generating = false;
				});
			},
		});
		this.addCommand({
			id: "retryNAI",
			name: "Retry",
			callback: async () => {
				if (this.generating) {
					new Notice("Already generating!");
					return;
				} else {
					new Notice("Generating...");

					this.generating = true;
					await this.saveSettings();
				}
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					const codeMirror = markdownView.editor;
					codeMirror.undo();
					const file = markdownView.file;
					// Proceed with the next steps
					const cursorPosition = codeMirror.getCursor();
					const textBeforeCursor = codeMirror.getRange(
						{ line: 0, ch: 0 },
						cursorPosition
					);
					const lorebook = createLore(this.lore, textBeforeCursor);

					const context = ContextBuilder(
						textBeforeCursor,
						{
							...this.settings,
							title: markdownView.file?.basename,
						},
						this.settings.memory,
						this.settings.prefix,
						this.settings.model,
						this.settings.sub,
						Number(this.settings.tokens),
						this.settings.generate_until_sentence,
						lorebook
					);
					// check if "{" is in the text, 1000 characters before the cursor
					let instruct = false;
					let instructRange = Number(this.settings.instruct_range);
					instructRange = instructRange * -1;
					if (textBeforeCursor.slice(instructRange).includes("{")) {
						instruct = true;
					}
					const settings = await buildSettings(
						{
							...this.settings,
						},
						this.settings.defaultSettings
					);
					try {
						const generated = await generate(
							context,
							settings,
							this.settings.apiKey,
							this.settings.model,
							this.settings.prefix,
							instruct,
							this.settings.customApiEndpoint
						);
						codeMirror.replaceRange(
							generated,
							cursorPosition,
							cursorPosition
						);
						// get length of generated text
						const generatedTextLength = generated.length;
						// get lines of generated text
						const generatedTextLines = generated.split("\n").length;
						// move cursos to the end of the generated text
						codeMirror.setCursor({
							line: cursorPosition.line + generatedTextLines,
							ch: generatedTextLength,
						});
						// Get last token from line and delete it
						let string = "";
					} catch (e) {
						console.error(e);
						// Show error to user via Notice
						new Notice(
							`${
								e instanceof Error
									? e.message
									: "Failed to generate text"
							}`
						);
						// Optional: Add error logging
						console.error("Generation error:", e);
					}
					codeMirror.setCursor({
						line: cursorPosition.line + 1,
						ch: 0,
					});
				} else {
					new Notice("No active Markdown file.");
				}

				this.generating = false;
				await this.saveSettings();
			},
		});
		this.addCommand({
			id: "load-preset",
			name: "Load preset",
			callback: async () => {
				// get the text from the open file
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (
					markdownView &&
					markdownView.file?.basename.endsWith(".preset")
				) {
					// turn the text into a JSON object
					const codeMirror = markdownView.editor;
					const text = codeMirror.getValue();
					const json = JSON.parse(text);
					// set the settings to the JSON object
					this.settings = json;
					// setOrder
				}
			},
		});
		this.addCommand({
			id: "open-lorebook",
			name: "Open Lorebook",
			callback: () => {
				this.lore = this.settings.lore;
				let modal = new LorebookModal(
					this.app,
					this.lore,
					this.saveLore.bind(this)
				);
				modal.open();
			},
		});
		this.addCommand({
			id: "show-counts",
			name: "Show word and token counts",
			editorCallback: (editor) => {
				const selection = editor.getSelection();
				const text = selection || editor.getValue();
				CountDisplay.showCounts(text, this.settings.model);
			},
		});
		// Add status bar item
		if (this.settings.showStatusBar) {
			this.countStatusBar = this.addStatusBarItem();
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", () =>
					this.updateStatusBar()
				)
			);
			this.registerEvent(
				this.app.workspace.on("editor-change", () =>
					this.updateStatusBar()
				)
			);
		}
		// Initialize status bar if enabled
		if (this.settings.showStatusBar) {
			this.countStatusBar = this.addStatusBarItem();
			this.registerStatusBarEvents();
		}
	}
	public updateStatusBar() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const text = view.editor.getValue();
			const words = CountDisplay.countWords(text);
			const tokens = CountDisplay.countTokens(text, this.settings.model);
			this.countStatusBar.setText(`${words} Words ${tokens} Tokens`);
		} else {
			this.countStatusBar.setText("");
		}

		this.countStatusBar = this.addStatusBarItem();
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () =>
				this.updateStatusBar()
			)
		);
		this.registerEvent(
			this.app.workspace.on("editor-change", () => this.updateStatusBar())
		);
	}
	async onunload() {
		// Clean up status bar events
		this.statusBarEvents.forEach((evt) => evt());
		if (this.countStatusBar) {
			this.countStatusBar.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DefaultSettings,
			await this.loadData()
		);
	}

	async saveSettings() {
		console.log("saving settings");
		await this.saveData(this.settings);
	}
	async saveLore(lore: Entry[]) {
		this.lore = lore;
		this.settings.lore = lore;
		await this.saveSettings();
	}
}

class NAI4ObsidianSettings extends PluginSettingTab {
	plugin: NAI4Obsidian;

	constructor(app: App, plugin: NAI4Obsidian) {
		super(app, plugin);
		this.plugin = plugin;
	}
	refresh(): void {
		this.display();
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Email")
			.setDesc("Your NovelAI email")
			.addText((text) =>
				text
					.setPlaceholder("Email")
					.setValue(this.plugin.settings.email)
					.onChange(async (value) => {
						this.plugin.settings.email = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Password")
			.setDesc("Your NovelAI password")
			.addText((text) =>
				text
					.setPlaceholder("Password")
					.setValue(this.plugin.settings.password)
					.onChange(async (value) => {
						this.plugin.settings.password = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("API Key")
			.setDesc("Your NovelAI API Key")
			.addText((text) =>
				text
					.setPlaceholder("API Key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					})
			);

		//  Default Preset Select
		new Setting(containerEl)
			.setName("Default Presets")
			.setDesc("Load a default preset")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("None", "None")
					// Kayra presets
					.addOption("Zany Scribe (Kayra)", "Zany Scribe (Kayra)")
					.addOption("Carefree", "Carefree (Kayra)")
					.addOption("Stelenes", "Stelenes (Kayra)")
					.addOption("Fresh Coffee (Kayra)", "Fresh Coffee (Kayra)")
					.addOption("Asper", "Asper (Kayra)")
					.addOption("Writer's Deamon", "Writer's Deamon (Kayra)")
					// Clio presets
					.addOption("Vingt-Un", "Vingt-Un (Clio)")
					.addOption("Long Press", "Long Press (Clio)")
					.addOption("Edgewise", "Edgewise (Clio)")
					.addOption("Fresh Coffee (Clio)", "Fresh Coffee (Clio)")
					.addOption("Talker C", "Talker C (Clio)")
					// Erato presets
					.addOption("Zany Scribe (Erato)", "Zany Scribe (Erato)")
					.addOption("Golden Arrow (Erato)", "Golden Arrow (Erato)")
					.addOption("Wilder (Erato)", "Wilder (Erato)")
					.addOption("Dragonfruit (Erato)", "Dragonfruit (Erato)")
					.onChange(async (value) => {
						defaultPreset.call(this, value);
					})
			);
		new Setting(containerEl)
			.setName("Sub")
			.setDesc("Your NovelAI sub")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("tablet", "tablet")
					.addOption("scroll", "scroll")
					.addOption("opus", "opus")
					.setValue(this.plugin.settings.sub)
					.onChange(async (value) => {
						this.plugin.settings.sub = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Model")
			.setDesc("Your NovelAI model")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("clio-v1", "clio-v1")
					.addOption("kayra-v1", "kayra-v1")
					.addOption("llama-3-erato-v1", "erato-v1")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Tokens")
			.setDesc("Number of tokens to generate")
			.addText((text) =>
				text
					.setPlaceholder("Tokens")
					.setValue(this.plugin.settings.tokens.toString())
					.onChange(async (value) => {
						this.plugin.settings.tokens = value.toString();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Generate Until End of Sentence")
			.setDesc("Generate until end of setence")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.generate_until_sentence)
					.onChange(async (value) => {
						this.plugin.settings.generate_until_sentence = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Prefix")
			.setDesc("Your module. Leave blank for none.")
			.addText((text) =>
				text
					.setPlaceholder("Prefix")
					.setValue(this.plugin.settings.prefix)
					.onChange(async (value) => {
						this.plugin.settings.prefix = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Author")
			.setDesc("Your author. Leave blank for none.")
			.addText((text) =>
				text

					.setValue(this.plugin.settings.author)
					.onChange(async (value) => {
						this.plugin.settings.author = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Tags")
			.setDesc("Your tags. Leave blank for none.")
			.addText((text) =>
				text

					.setValue(this.plugin.settings.tags)
					.onChange(async (value) => {
						this.plugin.settings.tags = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Genre")
			.setDesc("Your genre. Leave blank for none.")
			.addText((text) =>
				text

					.setValue(this.plugin.settings.genre)
					.onChange(async (value) => {
						this.plugin.settings.genre = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Memory")
			.setDesc("Your memory. Leave blank for none.")
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.memory)
					.onChange(async (value) => {
						this.plugin.settings.memory = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Temperature")
			.setDesc("Randomness")
			.addText((text) =>
				text
					.setPlaceholder("Temperature")
					.setValue(this.plugin.settings.temperature.toString())
					.onChange(async (value) => {
						this.plugin.settings.temperature = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Order")
			.setDesc("Order")
			.addText((text) =>
				text
					.setPlaceholder("Order")
					.setValue(this.plugin.settings.order.toString())
					.onChange(async (value) => {
						this.plugin.settings.order = value.toString();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Top P")
			.setDesc("Top P")
			.addText((text) =>
				text
					.setPlaceholder("Top P")
					.setValue(this.plugin.settings.top_p.toString())
					.onChange(async (value) => {
						this.plugin.settings.top_p = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Top K")
			.setDesc("Top K")
			.addText((text) =>
				text
					.setPlaceholder("Top K")
					.setValue(this.plugin.settings.top_k.toString())
					.onChange(async (value) => {
						this.plugin.settings.top_k = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Top A")
			.setDesc("Top A")
			.addText((text) =>
				text
					.setPlaceholder("Top A")
					.setValue(this.plugin.settings.top_a.toString())
					.onChange(async (value) => {
						this.plugin.settings.top_a = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Repetition Penalty")
			.setDesc("Repetition Penalty")
			.addText((text) =>
				text
					.setPlaceholder("Repetition Penalty")
					.setValue(
						this.plugin.settings.repetition_penalty.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.repetition_penalty =
							value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Typical P")
			.setDesc("Typical P")
			.addText((text) =>
				text
					.setPlaceholder("Typical P")

					.setValue(this.plugin.settings.typical_p.toString())
					.onChange(async (value) => {
						this.plugin.settings.typical_p = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Tail Free Sampling")
			.setDesc("Tail Free Sampling")
			.addText((text) =>
				text
					.setPlaceholder("Tail Free Sampling")
					.setValue(
						this.plugin.settings.tail_free_sampling.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.tail_free_sampling =
							value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Mirostat Tau")
			.setDesc("Mirostat Tau")
			.addText((text) =>
				text
					.setPlaceholder("Mirostat Tau")
					.setValue(this.plugin.settings.mirostat_tau.toString())
					.onChange(async (value) => {
						this.plugin.settings.mirostat_tau = value.toString();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Mirostat LR")
			.setDesc("Mirostat LR")
			.addText((text) =>
				text
					.setPlaceholder("Mirostat LR")
					.setValue(this.plugin.settings.mirostat_lr.toString())
					.onChange(async (value) => {
						this.plugin.settings.mirostat_lr = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Top G")
			.setDesc("Top G")
			.addText((text) =>
				text
					.setPlaceholder("Top G")
					.setValue(this.plugin.settings.top_g.toString())
					.onChange(async (value) => {
						this.plugin.settings.top_g = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Repitition Penalty Range")
			.setDesc("Repitition Penalty Range")
			.addText((text) =>
				text
					.setPlaceholder("Repitition Penalty Range")
					.setValue(
						this.plugin.settings.repetition_penalty_range.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.repetition_penalty_range =
							value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Frequency Penalty Slope")
			.setDesc("Frequency Penalty Slope")
			.addText((text) =>
				text
					.setPlaceholder("Frequency Penalty Slope")
					.setValue(
						this.plugin.settings.repetition_penalty_slope.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.repetition_penalty_slope =
							value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Frequency Penalty")
			.setDesc("Frequency Penalty")
			.addText((text) =>
				text
					.setPlaceholder("Frequency Penalty")
					.setValue(
						this.plugin.settings.repetition_penalty_frequency.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.repetition_penalty_frequency =
							value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Presence Penalty")
			.setDesc("Presence Penalty")
			.addText((text) =>
				text
					.setPlaceholder("Presence Penalty")
					.setValue(
						this.plugin.settings.repetition_penalty_presence.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.repetition_penalty_presence =
							value.toString();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("White List")
			.setDesc("White List")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.white_list)
					.onChange(async (value) => {
						this.plugin.settings.white_list = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Phrase Repetition Penalty")
			.setDesc("Phrase Repetition Penalty")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("off", "Off")
					.addOption("very_light", "Very Light")
					.addOption("light", "Light")
					.addOption("medium", "Medium")
					.addOption("aggressive", "Aggressive")
					.addOption("very_aggressive", "Very Agressive")
					.setValue(this.plugin.settings.phrase_repetition_penalty)
					.onChange(async (value) => {
						this.plugin.settings.phrase_repetition_penalty = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("Default Settings")
			.setDesc("Include the default bans and biases?")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultSettings)
					.onChange(async (value) => {
						this.plugin.settings.defaultSettings = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Instruct Range")
			.setDesc("How many characters to check for instructions")
			.addText((text) =>
				text
					.setPlaceholder("Instruct Range")
					.setValue(this.plugin.settings.instruct_range.toString())
					.onChange(async (value) => {
						this.plugin.settings.instruct_range = value.toString();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Custom Api Endpoint")
			.setDesc(
				"Custom API endpoint. Only add if you have a custom API endpoint and know your stuff! Has to use the NovelAI interface."
			)
			.addText((text) =>
				text
					.setPlaceholder("Custom API Endpoint")
					.setValue(this.plugin.settings.customApiEndpoint)
					.onChange(async (value) => {
						this.plugin.settings.customApiEndpoint = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Math1 Quad")
			.setDesc("Math1 Quad")
			.addText((text) =>
				text
					.setPlaceholder("Math1 Quad")
					.setValue(this.plugin.settings.math1_quad)
					.onChange(async (value) => {
						this.plugin.settings.math1_quad = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Math1 Quad Entropy Scale")
			.setDesc("Math1 Quad Entropy Scale")
			.addText((text) =>
				text
					.setPlaceholder("Math1 Quad Entropy Scale")
					.setValue(this.plugin.settings.math1_quad_entropy_scale)
					.onChange(async (value) => {
						this.plugin.settings.math1_quad_entropy_scale = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Math1 Temp")
			.setDesc("Math1 Temp")
			.addText((text) =>
				text
					.setPlaceholder("Math1 Temp")
					.setValue(this.plugin.settings.math1_temp)
					.onChange(async (value) => {
						this.plugin.settings.math1_temp = value;
						await this.plugin.saveSettings();
					})
			);
		// Fix this later, Green!
		// new Setting(containerEl)
		// 	.setName("Show Status Bar")
		// 	.setDesc("Show word and token counts in status bar")
		// 	.addToggle((toggle) =>
		// 		toggle
		// 			.setValue(this.plugin.settings.showStatusBar)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.showStatusBar = value;
		// 				// Remove existing status bar if it exists
		// 				if (this.plugin.countStatusBar) {
		// 					this.plugin.countStatusBar.remove();
		// 				}

		// 				if (value) {
		// 					// Create new status bar and set up listeners
		// 					this.plugin.countStatusBar =
		// 						this.plugin.addStatusBarItem();
		// 					this.plugin.registerStatusBarEvents();
		// 					this.plugin.updateStatusBar();
		// 				}

		// 				await this.plugin.saveSettings();
		// 			})
		// 	);
	}
}
// Function to stop from editing while generating
async function setFilePermissions(file: TFile, readOnly: boolean) {
	const vault = this.app.vault;
	const fileContent = await vault.read(file);
	await vault.delete(file.path);
	await vault.create(file.path, fileContent, { readOnly });
}
async function generateMarkdown(this: NAI4Obsidian, generating: boolean) {
	const progress = new ProgressNotice("Generating text");

	try {
		await this.saveSettings();

		const markdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) {
			progress.hide();
			new Notice("No active Markdown file.");
			return;
		}

		const codeMirror = markdownView.editor;
		const cursorPosition = codeMirror.getCursor();
		const textBeforeCursor = codeMirror.getRange(
			{ line: 0, ch: 0 },
			cursorPosition
		);

		// Show context building progress
		progress.hide();
		const contextProgress = new ProgressNotice("Building context");

		const lorebook = createLore(this.lore, textBeforeCursor);
		const context = ContextBuilder(
			textBeforeCursor,
			{
				...this.settings,
				title: markdownView.file?.basename,
			},
			this.settings.memory,
			this.settings.prefix,
			this.settings.model,
			this.settings.sub,
			Number(this.settings.tokens),
			this.settings.generate_until_sentence,
			lorebook
		);

		contextProgress.hide();
		const generatingProgress = new ProgressNotice("Requesting completion");

		let instruct = false;
		let instructRange = Number(this.settings.instruct_range);
		instructRange = instructRange * -1;
		if (textBeforeCursor.slice(instructRange).includes("{")) {
			instruct = true;
		}

		const settings = await buildSettings(
			{
				...this.settings,
			},
			this.settings.defaultSettings
		);

		try {
			const generated = await generate(
				context,
				settings,
				this.settings.apiKey,
				this.settings.model,
				this.settings.prefix,
				instruct,
				this.settings.customApiEndpoint
			);

			generatingProgress.hide();
			// Show generation stats
			const stats = {
				contextWords: CountDisplay.countWords(textBeforeCursor),
				contextTokens: context.length,
				generatedWords: CountDisplay.countWords(generated),
				generatedTokens: CountDisplay.countTokens(
					generated,
					this.settings.model
				),
			};

			// Create a status element
			const statusEl = this.addStatusBarItem();
			statusEl.setText(
				`Context: ${stats.contextTokens}🔤 ${stats.contextWords}📝 | Generated: ${stats.generatedTokens}🔤 ${stats.generatedWords}📝`
			);

			// Remove after 5 seconds
			setTimeout(() => statusEl.remove(), 5000);
			new Notice("Generation complete!", 2000);

			// Delete the last token if llama-3-erato-v1
			let string = "";
			if (this.settings.model === "llama-3-erato-v1") {
				// tokenize line
				const line = codeMirror.getLine(cursorPosition.line);
				const tokens = llama3Tokenizer.encode(line);
				console.log("TOKENS", tokens);
				// measure the length of the last token
				const lastToken = tokens[tokens.length - 2];
				string = llama3Tokenizer.decode([lastToken]);
				console.log("STRING", string);
				//
				// delete the last token
				codeMirror.replaceRange(
					"",
					{
						line: cursorPosition.line,
						ch: cursorPosition.ch - string.length,
					},
					cursorPosition
				);
			}
			// new cursor position after the last token was removed. - string length
			cursorPosition.ch = cursorPosition.ch - string.length;
			// Insert the generated text and account for the removed token
			codeMirror.replaceRange(generated, cursorPosition, cursorPosition);

			const generatedTextLength = generated.length;
			const generatedTextLines = generated.split("\n").length;

			codeMirror.setCursor({
				line: cursorPosition.line + generatedTextLines,
				ch: generatedTextLength,
			});
		} catch (e) {
			generatingProgress.hide();
			new Notice(
				`Generation failed: ${
					e instanceof Error ? e.message : "Unknown error"
				}`,
				3000
			);
			console.error(e);
		}
	} catch (e) {
		progress.hide();
		new Notice(
			`Error: ${e instanceof Error ? e.message : "Unknown error"}`,
			3000
		);
		console.error(e);
	}
}
function setSettings(this: NAI4Obsidian, Parameters: Parameters) {
	this.settings.model = Parameters.model;
	this.settings.temperature = Parameters.temperature;
	this.settings.top_p = Parameters.top_p;
	this.settings.top_k = Parameters.top_k;
	this.settings.repetition_penalty = Parameters.repetition_penalty;
	this.settings.top_a = Parameters.top_a;
	this.settings.typical_p = Parameters.typical_p;
	this.settings.tail_free_sampling = Parameters.tail_free_sampling;
	this.settings.repetition_penalty_range =
		Parameters.repetition_penalty_range;
	this.settings.repetition_penalty_slope =
		Parameters.repetition_penalty_slope;
	this.settings.repetition_penalty_frequency =
		Parameters.repetition_penalty_frequency;
	this.settings.repetition_penalty_presence =
		Parameters.repetition_penalty_presence;
	this.settings.cfg = Parameters.cfg;
	this.settings.order = Parameters.order;
	this.settings.defaultSettings = Parameters.defaultSettings;
	this.settings.white_list = Parameters.white_list;
	this.settings.phrase_repetition_penalty =
		Parameters.phrase_repetition_penalty;
	this.settings.mirostat_tau = Parameters.mirostat_tau;
	this.settings.mirostat_lr = Parameters.mirostat_lr;
	this.settings.top_g = Parameters.top_g;
	this.saveSettings().then(() => {
		if (this.settingsTab) {
			this.settingsTab.refresh();
		}
	});
}

/* Carefree
 */

const Carefree: Parameters = {
	order: "2, 3, 0, 4, 1",
	model: "kayra-v1",
	phrase_repetition_penalty: "aggressive",
	repetition_penalty: "2.8",
	repetition_penalty_frequency: "0.02",
	repetition_penalty_presence: "0",
	repetition_penalty_range: "2048",
	repetition_penalty_slope: "0.02",
	tail_free_sampling: "0.915",
	temperature: "1.35",
	top_a: "0.71",
	top_k: "15",
	top_p: "0.85",
	typical_p: "0",
	cfg: "0",
	mirostat_lr: "0",
	mirostat_tau: "0",
	top_g: "0",
	defaultSettings: true,
	white_list: true,
};

const Stelenes: Parameters = {
	model: "kayra-v1",
	temperature: "2.5",
	top_p: "",
	top_k: "",
	repetition_penalty: "1",
	top_a: "",
	typical_p: "0.969",
	tail_free_sampling: "0.941",
	repetition_penalty_range: "1024",
	repetition_penalty_slope: "",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "3, 0, 5",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "medium",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};

const FreshCoffeeKayra: Parameters = {
	model: "kayra-v1",
	temperature: "1",
	top_p: "1",
	top_k: "25",
	repetition_penalty: "1.9",
	top_a: "0",
	typical_p: "0",
	tail_free_sampling: "0.925",
	repetition_penalty_range: "768",
	repetition_penalty_slope: "1",
	repetition_penalty_frequency: "0.0025",
	repetition_penalty_presence: "0.001",
	cfg: "1",
	order: "6, 0, 1, 2, 3",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "off",
	mirostat_tau: "0",
	mirostat_lr: "0",
	top_g: "0",
};
const Asper: Parameters = {
	model: "kayra-v1",
	temperature: "1.16",
	top_p: "",
	top_k: "175",
	repetition_penalty: "1.68",
	top_a: "",
	typical_p: "0.96",
	tail_free_sampling: "0.994",
	repetition_penalty_range: "2240",
	repetition_penalty_slope: "1.5",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0.005",
	cfg: "",
	order: "5, 0, 1, 3",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "medium",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};
const WritersDeamon: Parameters = {
	model: "kayra-v1",
	temperature: "1.5",
	top_p: "0.95",
	top_k: "",
	repetition_penalty: "1.625",
	top_a: "0.02",
	typical_p: "0.95",
	tail_free_sampling: "0.95",
	repetition_penalty_range: "2016",
	repetition_penalty_slope: "",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "8, 0, 5, 3, 2, 4",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "very_aggressive",
	mirostat_tau: "5",
	mirostat_lr: "0.25",
	top_g: "",
};
const VingtUn: Parameters = {
	model: "clio-v1",
	temperature: "1.21",
	top_p: "0.912",
	top_k: "0",
	repetition_penalty: "1.21",
	top_a: "",
	typical_p: "0.912",
	tail_free_sampling: "0.921",
	repetition_penalty_range: "321",
	repetition_penalty_slope: "2.1",
	repetition_penalty_frequency: "0.00621",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "0, 5, 3, 2, 1",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "very_light",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};
const LongPress: Parameters = {
	model: "clio-v1",
	temperature: "1.155",
	top_p: "",
	top_k: "25",
	repetition_penalty: "1.65",
	top_a: "0.265",
	typical_p: "0.985",
	tail_free_sampling: "0.88",
	repetition_penalty_range: "8192",
	repetition_penalty_slope: "1.5",
	repetition_penalty_frequency: "0.0085",
	repetition_penalty_presence: "0.0125",
	cfg: "",
	order: "0, 4, 1, 5, 3",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "very_light",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};
const Edgewise: Parameters = {
	model: "clio-v1",
	temperature: "1.09",
	top_p: "0.969",
	top_k: "",
	repetition_penalty: "1.09",
	top_a: "0.09",
	typical_p: "0.99",
	tail_free_sampling: "0.969",
	repetition_penalty_range: "8192",
	repetition_penalty_slope: "0.069",
	repetition_penalty_frequency: "0.006",
	repetition_penalty_presence: "0.009",
	cfg: "",
	order: "4, 0, 5, 3, 2",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "very_light",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};
const FreshCoffeeClio: Parameters = {
	model: "clio-v1",
	temperature: "1",
	top_p: "1",
	top_k: "25",
	repetition_penalty: "1.9",
	top_a: "",
	typical_p: "",
	tail_free_sampling: "0.925",
	repetition_penalty_range: "768",
	repetition_penalty_slope: "3.33",
	repetition_penalty_frequency: "0.0025",
	repetition_penalty_presence: "0.001",
	cfg: "",
	order: "0, 1, 2, 3",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "very_light",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};
const TalkerC: Parameters = {
	model: "clio-v1",
	temperature: "1.5",
	top_p: "0.75",
	top_k: "10",
	repetition_penalty: "2.25",
	top_a: "0.08",
	typical_p: "0.975",
	tail_free_sampling: "0.967",
	repetition_penalty_range: "8192",
	repetition_penalty_slope: "0.09",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0.005",
	cfg: "",
	order: "1, 5, 0, 2, 3, 4",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "very_light",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
};

const ZanyScribe: Parameters = {
	model: "kayra-v1",
	temperature: "1",
	top_p: "0.99",
	top_k: "",
	repetition_penalty: "1",
	top_a: "",
	typical_p: "",
	tail_free_sampling: "0.925",
	repetition_penalty_range: "768",
	repetition_penalty_slope: "1",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "0, 9, 2",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "medium",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
	math1_quad: "0.4",
	math1_quad_entropy_scale: "-0.1",
	math1_temp: "-0.4",
};
const ZanyScribeErato: Parameters = {
	model: "llama-3-erato-v1",
	temperature: "1",
	top_p: "0.98",
	top_k: "",
	repetition_penalty: "1",
	top_a: "",
	typical_p: "",
	tail_free_sampling: "",
	repetition_penalty_range: "3024",
	repetition_penalty_slope: "1.1",
	repetition_penalty_frequency: "",
	repetition_penalty_presence: "0.25",
	cfg: "",
	order: "9, 2",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "medium",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
	math1_quad: "0.35",
	math1_quad_entropy_scale: "-0.2",
	math1_temp: "-0.275",
};
const GoldenArrowErato: Parameters = {
	model: "llama-3-erato-v1",
	temperature: "1",
	top_p: "0.995",
	top_k: "",
	repetition_penalty: "1.5",
	top_a: "",
	typical_p: "",
	tail_free_sampling: "",
	repetition_penalty_range: "2240",
	repetition_penalty_slope: "1",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "9, 2",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "light",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
	math1_quad: "0.19",
	math1_quad_entropy_scale: "-0.08",
	math1_temp: "0.5",
};
const WilderErato: Parameters = {
	model: "llama-3-erato-v1",
	temperature: "1",
	top_p: "",
	top_k: "",
	repetition_penalty: "1.4",
	top_a: "",
	typical_p: "",
	tail_free_sampling: "",
	repetition_penalty_range: "2240",
	repetition_penalty_slope: "0.64",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "9, 10",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "medium",
	mirostat_tau: "",
	mirostat_lr: "",
	top_g: "",
	math1_quad: "0.19",
	math1_quad_entropy_scale: "-0.095",
	math1_temp: "0",
};

const DragonfruitErato: Parameters = {
	model: "llama-3-erato-v1",
	temperature: "1.37",
	top_p: "",
	top_k: "",
	repetition_penalty: "3.25",
	top_a: "0.1",
	typical_p: "0.875",
	tail_free_sampling: "",
	repetition_penalty_range: "6000",
	repetition_penalty_slope: "3.25",
	repetition_penalty_frequency: "0",
	repetition_penalty_presence: "0",
	cfg: "",
	order: "0, 5, 9, 10, 8, 4",
	defaultSettings: true,
	white_list: true,
	phrase_repetition_penalty: "off",
	mirostat_tau: "4",
	mirostat_lr: "0.2",
	top_g: "",
	math1_quad: "0.07",
	math1_quad_entropy_scale: "-0.05",
	math1_temp: "0.9",
};

// Update the defaultPreset function to include the new preset
function defaultPreset(name: string) {
	if (name === "Carefree") {
		setSettings.call(this.plugin, Carefree);
	} else if (name === "Stelenes") {
		setSettings.call(this.plugin, Stelenes);
	} else if (name === "Fresh Coffee (Kayra)") {
		setSettings.call(this.plugin, FreshCoffeeKayra);
	} else if (name === "Asper") {
		setSettings.call(this.plugin, Asper);
	} else if (name === "Writer's Deamon") {
		setSettings.call(this.plugin, WritersDeamon);
	} else if (name === "Vingt-Un") {
		setSettings.call(this.plugin, VingtUn);
	} else if (name === "Long Press") {
		setSettings.call(this.plugin, LongPress);
	} else if (name === "Edgewise") {
		setSettings.call(this.plugin, Edgewise);
	} else if (name === "Fresh Coffee (Clio)") {
		setSettings.call(this.plugin, FreshCoffeeClio);
	} else if (name === "Talker C") {
		setSettings.call(this.plugin, TalkerC);
	} else if (name === "Zany Scribe (Kayra)") {
		setSettings.call(this.plugin, ZanyScribe);
	} else if (name === "Zany Scribe (Erato)") {
		setSettings.call(this.plugin, ZanyScribeErato);
	} else if (name === "Golden Arrow (Erato)") {
		setSettings.call(this.plugin, GoldenArrowErato);
	} else if (name === "Wilder (Erato)") {
		setSettings.call(this.plugin, WilderErato);
	} else if (name === "Dragonfruit (Erato)") {
		setSettings.call(this.plugin, DragonfruitErato);
	}
}
