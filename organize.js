const fs = require('fs');
const path = require('path');

// Função para criar diretório se não existir
function createDir(dir) {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✓ Diretório criado: ${dir}`);
        }
    } catch (error) {
        console.error(`✗ Erro ao criar diretório ${dir}:`, error.message);
    }
}

// Função para mover arquivo
function moveFile(source, target) {
    try {
        if (fs.existsSync(source)) {
            createDir(path.dirname(target));
            fs.copyFileSync(source, target);
            fs.unlinkSync(source);
            console.log(`✓ Arquivo movido: ${source} -> ${target}`);
        } else {
            console.log(`! Arquivo não encontrado: ${source}`);
        }
    } catch (error) {
        console.error(`✗ Erro ao mover arquivo ${source}:`, error.message);
    }
}

// Função para mover diretório
function moveDir(source, target) {
    try {
        if (fs.existsSync(source)) {
            createDir(target);
            const files = fs.readdirSync(source);
            files.forEach(file => {
                const sourcePath = path.join(source, file);
                const targetPath = path.join(target, file);
                if (fs.statSync(sourcePath).isDirectory()) {
                    moveDir(sourcePath, targetPath);
                } else {
                    moveFile(sourcePath, targetPath);
                }
            });
            fs.rmdirSync(source);
            console.log(`✓ Diretório movido: ${source} -> ${target}`);
        }
    } catch (error) {
        console.error(`✗ Erro ao mover diretório ${source}:`, error.message);
    }
}

// Estrutura de diretórios
const structure = {
    'src': {
        'main': ['main.js', 'config.js'],
        'renderer': ['renderer.js'],
        'styles': ['styles.css'],
        'assets': ['assets/*'],
        'translations': ['translations/*'],
        'utils': ['utils/*'],
        'installer': ['installer.js', 'installer.html']
    },
    'public': {
        'index.html': 'index.html'
    },
    'scripts': {
        'build.js': 'build.js'
    },
    'data': {
        'combos': ['combos/*'],
        'hits': ['hits/*']
    }
};

console.log('Iniciando reorganização dos arquivos...\n');

// Criar diretórios
Object.keys(structure).forEach(dir => {
    createDir(dir);
    if (typeof structure[dir] === 'object') {
        Object.keys(structure[dir]).forEach(subdir => {
            createDir(path.join(dir, subdir));
        });
    }
});

// Mover arquivos
Object.entries(structure).forEach(([dir, content]) => {
    if (typeof content === 'object') {
        Object.entries(content).forEach(([subdir, files]) => {
            if (Array.isArray(files)) {
                files.forEach(file => {
                    if (file.endsWith('/*')) {
                        // É um diretório
                        const sourceDir = file.replace('/*', '');
                        const targetDir = path.join(dir, subdir);
                        moveDir(sourceDir, targetDir);
                    } else {
                        // É um arquivo
                        const source = file;
                        const target = path.join(dir, subdir, path.basename(file));
                        moveFile(source, target);
                    }
                });
            } else {
                moveFile(files, path.join(dir, files));
            }
        });
    }
});

console.log('\nReorganização concluída!'); 