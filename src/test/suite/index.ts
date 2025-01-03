import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
    // Crée une instance de Mocha
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise(async (resolve, reject) => {
        try {
            // Utiliser l'API asynchrone de glob
            const files = await glob('**/**.test.js', { cwd: testsRoot });

            // Ajouter les fichiers de test à Mocha
            files.forEach((f: string) =>
                mocha.addFile(path.resolve(testsRoot, f)),
            );

            // Exécuter les tests
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}
