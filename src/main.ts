import {
  App,
  Editor,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
  debounce
} from "obsidian";

interface NativeSearchPlusSettings {
  hideNoteNames: boolean;
  searchSelectedText: boolean;
}

const DEFAULT_SETTINGS: NativeSearchPlusSettings = {
  hideNoteNames: false,
  searchSelectedText: false
};

const SEARCH_VIEW_TYPE = "search";
const BODY_HIDE_CLASS = "native-search-plus-hide-note-names";

export default class NativeSearchPlusPlugin extends Plugin {
  settings: NativeSearchPlusSettings;
  private lastSelection = "";
  private selectionDebounce = debounce(() => this.searchFromSelection(), 120, true);

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new NativeSearchPlusSettingTab(this.app, this));
    this.applyHideNoteNamesClass();

    this.registerEvent(
      this.app.workspace.on("editor-change", (_editor: Editor, _view: MarkdownView) => {
        if (this.settings.searchSelectedText) this.selectionDebounce();
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        if (this.settings.searchSelectedText) this.selectionDebounce();
      })
    );

    this.registerDomEvent(document, "selectionchange", () => {
      if (this.settings.searchSelectedText) this.selectionDebounce();
    });
  }

  onunload() {
    document.body.classList.remove(BODY_HIDE_CLASS);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyHideNoteNamesClass();
  }

  applyHideNoteNamesClass() {
    document.body.classList.toggle(BODY_HIDE_CLASS, this.settings.hideNoteNames);
  }

  private getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.editor ?? null;
  }

  private getSelectedText(): string {
    const editor = this.getActiveEditor();
    if (!editor) return "";
    return editor.getSelection().trim();
  }

  private async searchFromSelection() {
    const query = this.getSelectedText();
    if (!query || query === this.lastSelection) return;
    this.lastSelection = query;
    await this.setNativeSearchQuery(query);
  }

  private async setNativeSearchQuery(query: string) {
    const leaf = await this.getOrCreateSearchLeaf();
    if (!leaf) return;

    const view: any = leaf.view;
    const state = typeof view.getState === "function" ? view.getState() : {};

    if (typeof view.setState === "function") {
      await view.setState({ ...state, query }, { history: false });
    }

    this.updateSearchInputDom(query, leaf);
  }

  private async getOrCreateSearchLeaf(): Promise<WorkspaceLeaf | null> {
    let leaf = this.app.workspace.getLeavesOfType(SEARCH_VIEW_TYPE)[0];
    if (leaf) return leaf;

    const newLeaf = this.app.workspace.getLeftLeaf(false);
    if (!newLeaf) return null;

    await newLeaf.setViewState({ type: SEARCH_VIEW_TYPE, active: true });
    return newLeaf;
  }

  private updateSearchInputDom(query: string, leaf: WorkspaceLeaf) {
    const container = leaf.view.containerEl;
    const input = container.querySelector<HTMLInputElement>("input.search-input, input[type='search'], input[type='text']");
    if (!input || input.value === query) return;

    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

class NativeSearchPlusSettingTab extends PluginSettingTab {
  plugin: NativeSearchPlusPlugin;

  constructor(app: App, plugin: NativeSearchPlusPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "原生搜索增强" });

    new Setting(containerEl)
      .setName("隐藏笔记名称")
      .setDesc("开启后，搜索结果中不显示笔记名称，只展示匹配到的结果。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.hideNoteNames)
          .onChange(async (value) => {
            this.plugin.settings.hideNoteNames = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("选中文本实时搜索")
      .setDesc("开启后，在当前文档中选中文字，会自动用选中的内容更新原生搜索。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.searchSelectedText)
          .onChange(async (value) => {
            this.plugin.settings.searchSelectedText = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
