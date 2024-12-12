import * as vscode from 'vscode';
import { run } from '@softwaretechnik/dbml-renderer';
import { parseTableDefinition } from './parser';

let webviewPanel: vscode.WebviewPanel | null = null;

// Gardez une trace du dernier SVG réussi
let lastSuccessfulSvg: string = '';

// Gardez une trace du dernier délai
let lastTimeout: NodeJS.Timeout | null = null;

// Génère un contenu SVG à partir d'un contenu DBML
async function generateSvg(dbmlContent: string): Promise<string> {
    try {
        const svgContent = run(dbmlContent, 'svg');
        return svgContent;
    } catch (error: unknown) {
        let errorMessage = 'Error generating SVG: Unknown error';
        if (error instanceof Error) {
            errorMessage = 'Error generating SVG: ' + error.message;
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

async function showDbmlGraphWebView() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found. Open a DBML file to render it.');
        return;
    }

    const document = editor.document;
    const dbmlContent = document.getText();
    const svgContent = await generateSvg(dbmlContent);

    // Si la génération du SVG a réussi, mettez à jour le dernier SVG réussi
    if (svgContent) {
        lastSuccessfulSvg = svgContent;
    }

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

    // Utilisez le dernier SVG réussi pour l'affichage
    webviewPanel.webview.html = getHtmlForWebview(webviewPanel.webview, lastSuccessfulSvg);
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

    const disposable = vscode.commands.registerCommand(
        'dbml-viewer.generateDbmlGraph',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found.');
                return;
            }

            const dbmlContent = editor.document.getText();
            try {
                const svgOutput = parseTableDefinition(dbmlContent);
                vscode.workspace.openTextDocument({ content: svgOutput, language: 'html' })
                    .then(doc => vscode.window.showTextDocument(doc));
            } catch (error: unknown) {
                let errorMessage = 'Error rendering DBML: Unknown error';
                if (error instanceof Error) {
                    errorMessage = 'Error rendering DBML: ' + error.message;
                } else {
                    errorMessage = 'Unexpected error rendering DBML.';
                }
                vscode.window.showErrorMessage(errorMessage);
            }
        }
    );

    context.subscriptions.push(disposable);

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

    // Structure
    let provider = vscode.languages.registerDocumentSymbolProvider(
        { scheme: 'file', language: 'dbml' },
        new DbmlDocumentSymbolProvider()
    );
    context.subscriptions.push(provider);

    // Mettez à jour la WebView lors de la modification d'un fichier DBML
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.document.languageId === 'dbml') {
            // Si un délai a déjà été défini, le supprime
            if (lastTimeout) {
                clearTimeout(lastTimeout);
            }

            // Définir un nouveau délai
            lastTimeout = setTimeout(() => {
                showDbmlGraphWebView();
            }, 200); // 200ms
        }
    });
}

// Code Structrure with Table, Enum and Ref keywords
class DbmlDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Thenable<vscode.DocumentSymbol[]> {
        let symbols: vscode.DocumentSymbol[] = [];

        let tableRegex = /Table\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let enumRegex = /Enum\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let refRegex = /Ref:\s+([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\s*[><]\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/g;

        this.findSymbols(document, tableRegex, vscode.SymbolKind.Class, symbols);
        this.findSymbols(document, enumRegex, vscode.SymbolKind.Enum, symbols);
        this.findSymbols(document, refRegex, vscode.SymbolKind.Object, symbols);

        return Promise.resolve(symbols);
    }

    private findSymbols(
        document: vscode.TextDocument,
        regex: RegExp,
        kind: vscode.SymbolKind,
        symbols: vscode.DocumentSymbol[]
    ) {
        let match;

        while (match = regex.exec(document.getText())) {
            let range = new vscode.Range(
                document.positionAt(match.index),
                document.positionAt(match.index + match[0].length)
            );

            let symbolInfo = new vscode.DocumentSymbol(
                match[1],
                '',
                kind,
                range,
                range
            );

            symbols.push(symbolInfo);
        }
    }
}

export function deactivate() { }