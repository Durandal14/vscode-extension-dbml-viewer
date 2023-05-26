import * as vscode from 'vscode';
import { run } from '@softwaretechnik/dbml-renderer';

let webviewPanel: vscode.WebviewPanel | null = null;

// Génère un contenu SVG à partir d'un contenu DBML
async function generateSvg(dbmlContent: string): Promise<string> {
    try {
        const svgContent = run(dbmlContent, 'svg');
        return svgContent;
    } catch (error: unknown) {
        let errorMessage = 'Error generating SVG: Unknown error';
        if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = 'Error generating SVG: ' + (error as { message: string }).message;
        }
        console.error(errorMessage);
        vscode.window.showErrorMessage(errorMessage);
        return '';
    }
}

// Génère le code HTML pour la WebView à partir du contenu SVG
function getHtmlForWebview(webview: vscode.Webview, svgContent: string): string {
    const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DBML Graph</title>
    <style>
    body, html {
        margin: 0;
        padding: 0;
        overflow: hidden;
    }
    #svg-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fff;
    }
    svg {
        max-width: 100%;
        max-height: 100%;
    }
    </style>
    </head>
    <body>
    <div id="svg-container">
    ${svgContent}
    </div>
    </body>
    </html>`;
}

// Fonction pour générer et afficher la WebView avec le contenu DBML
async function showDbmlGraphWebView() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found. Open a DBML file to render it.');
        return;
    }

    const document = editor.document;
    const dbmlContent = document.getText();
    const svgContent = await generateSvg(dbmlContent);

    if (!webviewPanel) {
        webviewPanel = vscode.window.createWebviewPanel(
            'dbmlRenderer',
            'DBML Renderer',
            vscode.ViewColumn.Beside,
            {}
        );

        webviewPanel.onDidDispose(() => {
            webviewPanel = null;
        });
    }

    webviewPanel.webview.html = getHtmlForWebview(webviewPanel.webview, svgContent);
    if (!webviewPanel.visible) {
        webviewPanel.reveal(vscode.ViewColumn.Beside, false);
    }
}

// Fonction pour enregistrer le contenu DBML en tant que fichier SVG
async function saveDbmlAsSvg() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const dbmlContent = editor.document.getText();
    const svgContent = await generateSvg(dbmlContent);
    if (!svgContent) {
        return;
    }

    const uri = await vscode.window.showSaveDialog({
        filters: {
            images: ['svg']
        },
        saveLabel: 'Save SVG'
    });

    if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(svgContent, 'utf-8'));
        vscode.window.showInformationMessage('SVG file saved successfully.');
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "dbml-viewer" is now active!');

    // Enregistrement des commandes
    context.subscriptions.push(vscode.commands.registerCommand('extension.generateDbmlGraph', showDbmlGraphWebView));
    context.subscriptions.push(vscode.commands.registerCommand('extension.generateDbmlSvg', saveDbmlAsSvg));

    // Création du File System Watcher pour les fichiers DBML
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.dbml');
    context.subscriptions.push(watcher);

    // Mise à jour de la WebView lors de la modification d'un fichier DBML
    watcher.onDidChange(async (event) => {
        const document = await vscode.workspace.openTextDocument(event);
        showDbmlGraphWebView();
    });

    // Mise à jour de la WebView lors de l'ouverture d'un fichier DBML
    vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId === 'dbml') {
            showDbmlGraphWebView();
        }
    });

    // Mise à jour de la WebView lors de la modification d'un fichier DBML
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.document.languageId === 'dbml') {
            showDbmlGraphWebView();
        }
    });
}

export function deactivate() {}