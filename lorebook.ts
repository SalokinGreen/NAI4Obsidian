import { create } from "domain";
import { App, Modal } from "obsidian";

export interface Entry {
	title: string;
	content: string;
	keys: string[];
	on: boolean;
	alwaysOn: boolean;
	searchRange: number;
	priority: number;
	id: string;
}
export class LorebookModal extends Modal {
	constructor(
		app: App,
		public entries: Entry[],
		public saveSettings: Function
	) {
		super(app);
		this.entries = entries;
		this.saveSettings = saveSettings;
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.empty();
		// main container
		let mainContainer = contentEl.createDiv("lorebook-container");
		// left container
		let leftContainer = mainContainer.createDiv("lorebook-left-container");
		// right container
		let rightContainer = mainContainer.createDiv(
			"lorebook-right-container"
		);
		//  'Add Entry' button
		let addEntryButton = leftContainer.createEl("button", {
			text: "Add Entry",
		});
		addEntryButton.addEventListener("click", () => {
			this.entries.push({
				title: "New Entry",
				content: "",
				keys: [],
				on: true,
				alwaysOn: false,
				searchRange: 1000,
				priority: 400,
				id:
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15),
			});
			console.log(this.entries);
			// clear left container
			leftContainer.empty();
			// rebuild left container
			this.entries.forEach((entry) => {
				addEntries(entry);
			});
		});
		// Add Entries by title
		const addEntries = (entry: Entry) => {
			let entryButton = leftContainer.createEl("button", {
				text: entry.title,
			});
			entryButton.addEventListener("click", () => {
				// Clear right container
				rightContainer.empty();
				// create form
				let form = rightContainer.createEl("form", {
					cls: "lorebook-form",
				});
				// remove default form action
				form.addEventListener("submit", (e) => {
					e.preventDefault();
				});

				// Add title
				let overTitleArea = form.createDiv("lorebook-over-title-area");
				overTitleArea.createEl("label", { text: "Title" });
				let titleArea = overTitleArea.createDiv("lorebook-title-area");
				let title = titleArea.createEl("input", {
					attr: {
						type: "text",
						value: entry.title,
					},
				});
				// add event listener to update entry title
				title.addEventListener("change", () => {
					entry.title = title.value;
					entryButton.innerText = title.value;
					this.saveSettings(this.entries);
				});
				title.addEventListener("keydown", (e) => {
					if (e.key == "Enter") {
						e.preventDefault();
						title.blur();
					}
				});

				// add on/off switch

				let onOffSwitch = titleArea.createEl("input", {
					attr: {
						type: "checkbox",
						checked: entry.on,
					},
				});
				onOffSwitch.addEventListener("change", () => {
					entry.on = onOffSwitch.checked;
					this.saveSettings(this.entries);
				});
				// set the checkbox to its correct state
				if (entry.on) {
					onOffSwitch.checked = true;
				} else {
					onOffSwitch.checked = false;
				}
				// add content
				let contentArea = form.createDiv("lorebook-content-area");
				contentArea.createEl("label", { text: "Content" });
				let content = contentArea.createEl("textarea", {
					text: entry.content,
				});
				content.addEventListener("change", () => {
					entry.content = content.value;
					this.saveSettings(this.entries);
				});

				// add keys
				let overKeyArea = form.createDiv("lorebook-over-key-area");
				let keyArea = overKeyArea.createDiv("lorebook-key-area");

				let keyInput = keyArea.createEl("input", {
					attr: {
						type: "text",
						placeholder: "Add Key",
					},
				});
				keyInput.addEventListener("keydown", (e) => {
					if (e.key == "Enter") {
						entry.keys.push(keyInput.value);
						let keyButton = createEl("button", {
							text: keyInput.value,
							cls: "lorebook-key",
						});
						// on click, delete key
						keyButton.addEventListener("click", () => {
							entry.keys = entry.keys.filter(
								(k) => k != keyInput.value
							);
							keyButton.remove();
						});
						keyArea.appendChild(keyButton);
						// repace key Area with new key area
						keyArea.replaceWith(keyArea);

						keyInput.value = "";
						this.saveSettings(this.entries);
					}
				});
				entry.keys.forEach((key) => {
					let keyButton = createEl("button", {
						text: key,
						cls: "lorebook-key",
					});
					// on click, delete key
					keyButton.addEventListener("click", () => {
						entry.keys = entry.keys.filter((k) => k != key);
						keyButton.remove();
					});
					keyArea.appendChild(keyButton);
				});
				// add always on switch
				let alwaysOnArea = overKeyArea.createDiv("lorebook-always-on");
				alwaysOnArea.createEl("label", { text: "Always On" });
				let alwaysOnSwitch = alwaysOnArea.createEl("input", {
					attr: {
						type: "checkbox",
						checked: entry.alwaysOn,
					},
				});
				alwaysOnSwitch.addEventListener("change", () => {
					entry.alwaysOn = alwaysOnSwitch.checked;
					this.saveSettings(this.entries);
				});
				// set the checkbox to its correct state
				if (entry.alwaysOn) {
					alwaysOnSwitch.checked = true;
				} else {
					alwaysOnSwitch.checked = false;
				}

				// add settings area
				let settingsArea = form.createDiv("lorebook-settings-area");
				// add search range
				let searchRangeArea = settingsArea.createDiv(
					"lorebook-range-area"
				);
				searchRangeArea.createEl("label", { text: "Search Range" });
				let searchRange = searchRangeArea.createEl("input", {
					attr: {
						type: "number",
						value: entry.searchRange,
					},
				});
				searchRange.addEventListener("change", () => {
					entry.searchRange = parseInt(searchRange.value);
					this.saveSettings(this.entries);
				});
				searchRange.addEventListener("keydown", (e) => {
					if (e.key == "Enter") {
						e.preventDefault();
						searchRange.blur();
					}
				});
				// add priority
				let priorityArea = settingsArea.createDiv(
					"lorebook-priority-area"
				);
				priorityArea.createEl("label", { text: "Priority" });
				let priority = priorityArea.createEl("input", {
					attr: {
						type: "number",
						value: entry.priority,
					},
				});
				priority.addEventListener("change", () => {
					entry.priority = parseInt(priority.value);
					this.saveSettings(this.entries);
				});
				priority.addEventListener("keydown", (e) => {
					if (e.key == "Enter") {
						e.preventDefault();
						priority.blur();
					}
				});
				// add delete button
				let deleteButton = form.createEl("button", {
					text: "Delete",
				});
				deleteButton.addEventListener("click", (k) => {
					k.preventDefault();
					this.entries = this.entries.filter((e) => e.id != entry.id);
					entryButton.remove();
					this.saveSettings(this.entries);
					form.remove();
				});

				// change right container to form
				rightContainer.empty();
				rightContainer.appendChild(form);
			});
			leftContainer.appendChild(entryButton);
			// Add Entry to left container
			leftContainer.appendChild(addEntryButton);
		};
		this.entries.forEach((entry) => {
			// clear left container
			addEntries(entry);
		});

		// Add Entry to left container
		leftContainer.appendChild(addEntryButton);
	}

	onClose() {
		let { contentEl } = this;
		this.saveSettings(this.entries);
		contentEl.empty();
	}
}
