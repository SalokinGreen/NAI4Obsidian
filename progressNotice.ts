import { Notice } from "obsidian";

export class ProgressNotice {
	private notice: Notice;
	private text: string;
	private dots: number = 0;
	private interval: NodeJS.Timeout;

	constructor(text: string) {
		this.text = text;
		this.notice = new Notice(text + "...", 0);
		this.startAnimation();
	}

	private startAnimation() {
		this.interval = setInterval(() => {
			this.dots = (this.dots + 1) % 4;
			this.notice.setMessage(this.text + ".".repeat(this.dots));
		}, 400);
	}

	public hide() {
		clearInterval(this.interval);
		this.notice.hide();
	}
}
