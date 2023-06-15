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

// Remember to rename these classes and interfaces!
import getKey from "utils/getNaiKey";
import buildSettings from "utils/buildSettings";
import ContextBuilder from "utils/contextbuilder";
import generate from "utils/generate";
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
	order: string;
	tags: string;
	author: string;
	genre: string;
	memory: string;
	generating: boolean;
	defaultSettings: boolean;
}

const DEFAULT_SETTINGS: Settings = {
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
	order: "1, 0, 4",
	generating: false,
	defaultSettings: true,
};

export default class NAI4Obsidian extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"pencil",
			"NAI4Obsidian",
			async (evt: MouseEvent) => {
				if (this.settings.generating) {
					new Notice("Already generating!");
					return;
				} else {
					new Notice("Generating...");
					this.settings.generating = true;
					await this.saveSettings();
				}
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					const codeMirror = markdownView.editor;
					const file = markdownView.file;

					// Proceed with the next steps
					const cursorPosition = codeMirror.getCursor();
					const textBeforeCursor = codeMirror.getRange(
						{ line: 0, ch: 0 },
						cursorPosition
					);
					console.log(textBeforeCursor);
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
						this.settings.generate_until_sentence
					);
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
							this.settings.prefix
						);
						console.log(generated);
						codeMirror.replaceRange(
							generated,
							cursorPosition,
							cursorPosition
						);
					} catch (e) {
						console.error(e);
					}
				} else {
					new Notice("No active Markdown file.");
				}

				this.settings.generating = false;
				await this.saveSettings();
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// add commands
		this.addCommand({
			id: "getKey",
			name: "Get Key",
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
				if (this.settings.generating) {
					new Notice("Already generating!");
					return;
				} else {
					new Notice("Generating...");

					this.settings.generating = true;
					await this.saveSettings();
				}
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					const codeMirror = markdownView.editor;
					const file = markdownView.file;

					// Proceed with the next steps
					const cursorPosition = codeMirror.getCursor();
					const textBeforeCursor = codeMirror.getRange(
						{ line: 0, ch: 0 },
						cursorPosition
					);
					console.log(textBeforeCursor);
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
						this.settings.generate_until_sentence
					);
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
							this.settings.prefix
						);
						console.log(generated);
						codeMirror.replaceRange(
							generated,
							cursorPosition,
							cursorPosition
						);
					} catch (e) {
						console.error(e);
					}
				} else {
					new Notice("No active Markdown file.");
				}
				this.settings.generating = false;
				await this.saveSettings();
			},
		});
		this.addCommand({
			id: "retryNAI",
			name: "Retry",
			callback: async () => {
				if (this.settings.generating) {
					new Notice("Already generating!");
					return;
				} else {
					new Notice("Generating...");

					this.settings.generating = true;
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
					console.log(textBeforeCursor);
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
						this.settings.generate_until_sentence
					);
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
							this.settings.prefix
						);
						console.log(generated);
						codeMirror.replaceRange(
							generated,
							cursorPosition,
							cursorPosition
						);
					} catch (e) {
						console.error(e);
					}
				} else {
					new Notice("No active Markdown file.");
				}
				this.settings.generating = false;
				await this.saveSettings();
			},
		});
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: NAI4Obsidian;

	constructor(app: App, plugin: NAI4Obsidian) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings." });
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
					.addOption("krake-v2", "krake-v2")
					.addOption("euterpe-v2", "euterpe-v2")
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
			.setName("Genrating")
			.setDesc(
				"Used to check if the plugin is generating. Do not change unless there was a bug keeping it on."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.generating)
					.onChange(async (value) => {
						this.plugin.settings.generating = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
// Function to stop from editing while generating
async function setFilePermissions(file: TFile, readOnly: boolean) {
	const vault = this.app.vault;
	const fileContent = await vault.read(file);
	await vault.delete(file.path);
	await vault.create(file.path, fileContent, { readOnly });
}
