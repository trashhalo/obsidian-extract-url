const { Platform } = require('obsidian');

function hasBin(bin) {
    if(Platform.isDesktop) {
        const hasBin = require('hasbin');
        return hasBin.sync(bin);
    } else {
        return false;
    }
}

function nodeExec(bin, cb) {
    if(Platform.isDesktop) {
        const childProcess = require('child_process');
        return childProcess.exec(bin, cb);
    } else {
        throw new Error('platform not supported');
    }
}

function clipboardReadText() {
    if(Platform.isDesktop) {
        const electron = require('electron');
        return electron.clipboard.readText();
    } else {
        throw new Error('platform not supported');
    }
}

module.exports = {
    hasBin,
    nodeExec,
    clipboardReadText
}