const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const config = require('./config');

class Builder {
    constructor() {
        this.buildPath = path.join(__dirname, 'build');
        this.distPath = path.join(__dirname, 'dist');
    }

    async build() {
        try {
            logger.info('Iniciando processo de build...');

            // Limpa diretórios de build anteriores
            this.cleanBuildDirectories();

            // Instala dependências
            this.installDependencies();

            // Compila o código
            this.compileCode();

            // Empacota o aplicativo
            this.packageApp();

            // Cria o instalador
            this.createInstaller();

            logger.info('Build concluído com sucesso!');
            return true;
        } catch (error) {
            logger.error('Erro durante o processo de build:', error);
            return false;
        }
    }

    cleanBuildDirectories() {
        logger.info('Limpando diretórios de build...');

        if (fs.existsSync(this.buildPath)) {
            fs.rmSync(this.buildPath, { recursive: true, force: true });
        }

        if (fs.existsSync(this.distPath)) {
            fs.rmSync(this.distPath, { recursive: true, force: true });
        }

        fs.mkdirSync(this.buildPath);
        fs.mkdirSync(this.distPath);
    }

    installDependencies() {
        logger.info('Instalando dependências...');

        // Instala dependências de produção
        execSync('npm install --production', { stdio: 'inherit' });

        // Instala dependências de desenvolvimento
        execSync('npm install --save-dev electron-builder', { stdio: 'inherit' });
    }

    compileCode() {
        logger.info('Compilando código...');

        // Compila arquivos TypeScript (se houver)
        if (fs.existsSync('tsconfig.json')) {
            execSync('npx tsc', { stdio: 'inherit' });
        }

        // Copia arquivos estáticos
        this.copyStaticFiles();
    }

    copyStaticFiles() {
        const staticFiles = [
            'main.js',
            'renderer.js',
            'index.html',
            'styles.css',
            'assets',
            'translations',
            'package.json'
        ];

        // Primeiro, copia os arquivos principais para a raiz do build
        for (const file of staticFiles) {
            const srcPath = path.join(__dirname, file);
            const destPath = path.join(this.buildPath, file);

            if (fs.existsSync(srcPath)) {
                if (fs.lstatSync(srcPath).isDirectory()) {
                    fs.cpSync(srcPath, destPath, { recursive: true });
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
                logger.info(`Arquivo copiado: ${file}`);
            } else {
                logger.warn(`Arquivo não encontrado: ${file}`);
            }
        }

        // Cria um package.json simplificado para o build
        const packageJson = {
            name: "client-lister",
            version: "1.0.0",
            main: "main.js",
            dependencies: {}
        };

        fs.writeFileSync(
            path.join(this.buildPath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
    }

    packageApp() {
        logger.info('Empacotando aplicativo...');

        const buildConfig = {
            appId: 'com.clientlister.app',
            productName: 'Client Lister',
            copyright: 'Copyright © 2024',
            directories: {
                output: this.distPath,
                buildResources: 'assets'
            },
            files: [
                'build/**/*',
                'node_modules/**/*'
            ],
            win: {
                target: [
                    {
                        target: 'nsis',
                        arch: ['x64']
                    }
                ],
                icon: 'assets/icon.ico'
            },
            nsis: {
                oneClick: false,
                allowToChangeInstallationDirectory: true,
                createDesktopShortcut: true,
                createStartMenuShortcut: true,
                shortcutName: 'Client Lister'
            }
        };

        // Salva configuração do electron-builder
        fs.writeFileSync(
            'electron-builder.json',
            JSON.stringify(buildConfig, null, 2)
        );

        // Executa o build
        execSync('npx electron-builder', { stdio: 'inherit' });
    }

    createInstaller() {
        logger.info('Criando instalador...');

        // O instalador será criado automaticamente pelo electron-builder
        // na pasta dist com o nome Client Lister Setup.exe
    }
}

// Executa o build se este arquivo for executado diretamente
if (require.main === module) {
    const builder = new Builder();
    builder.build().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = Builder; 