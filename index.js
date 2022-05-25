import { Plugin, PluginSettingTab } from "obsidian";
import rustPlugin from "./pkg/obsidian_rust_plugin_bg.wasm";
import * as plugin from "./pkg/obsidian_rust_plugin.js";

class RustSettingsTab extends PluginSettingTab {
  constructor(app, plugin, wasm) {
    super(app, plugin);
    this.plugin = plugin;
    this.wasm = wasm;
  }

  display() {
    this.wasm.settings(this);
  }
}

export default class RustPlugin extends Plugin {
  async onload() {
    const buffer = Uint8Array.from(atob(rustPlugin), (c) => c.charCodeAt(0));
    await plugin.default(Promise.resolve(buffer));
    plugin.onload(this);
    this.addSettingTab(new RustSettingsTab(this.app, this, plugin));
  }
}
