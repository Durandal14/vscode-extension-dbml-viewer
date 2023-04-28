import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { run } from '@softwaretechnik/dbml-renderer';

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

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "dbml-viewer" is now active!');
    
    let disposable = vscode.commands.registerCommand('extension.generateDbmlGraph', () => {
        const panel = vscode.window.createWebviewPanel(
            'dbmlRenderer',
            'DBML Renderer',
            vscode.ViewColumn.Beside,
            {}
            );
            
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const dbmlCode = document.getText();
            
            // Test pour compatibilité Windows
            const isWindows = process.platform === 'win32';
            const dbmlRendererPath = path.join(
                __dirname,
                '..',
                'node_modules',
                '.bin',
                isWindows ? 'dbml-renderer.cmd' : 'dbml-renderer'
                );
                
                const renderer = cp.spawn(dbmlRendererPath, ['-i', '-', '-f', 'svg'], { shell: true });
                renderer.stdin.write(dbmlCode);
                renderer.stdin.end();
                
                let svgCode = '';
                
                renderer.stdout.on('data', (data) => {
                    svgCode += data;
                });
                
                renderer.stdout.on('end', () => {
                    panel.webview.html = getHtmlForWebview(panel.webview, svgCode);
                });
                
                renderer.stderr.on('data', ( data) => {
                    console.error(`dbml-renderer error: ${data}`);
                });
            } else {
                vscode.window.showErrorMessage('No active text editor found. Open a DBML file to render it.');
            }
        });
        
        context.subscriptions.push(disposable);
            
    // Save SVG
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.generateDbmlSvg', async () => {
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
        })
        );
        
    // Watch for DBML changes and regenerate WebView
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.dbml');
    const webviewPanels = new Map<string, vscode.WebviewPanel>();
    context.subscriptions.push(watcher);
    watcher.onDidChange(async (event) => {
        const document = await vscode.workspace.openTextDocument(event);
        const dbmlContent = document.getText();
        const svgContent = await generateSvg(dbmlContent);
        // Check if there is an existing webview panel for the document
        let panel = webviewPanels.get(document.uri.toString());
        if (panel) {
            panel.webview.html = getHtmlForWebview(panel.webview, svgContent);
        } else {
            panel = vscode.window.createWebviewPanel(
                'dbmlGraph',
                'DBML Graph',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    localResourceRoots: [],
                }
                );
                panel.webview.html = getHtmlForWebview(panel.webview, svgContent);
                
                // Store the webview panel in the map
                webviewPanels.set(document.uri.toString(), panel);
                
                // Dispose the webview panel when it is closed
                panel.onDidDispose(() => {
                    webviewPanels.delete(document.uri.toString());
                });
            }
        });
    }
        
export function deactivate() {}
                