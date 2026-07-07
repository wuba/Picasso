const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(packageRoot, 'package.json');
const versionTsPath = path.join(packageRoot, 'src', 'version.ts');

/**
 * 读取 picasso-parse 包版本号。
 *
 * @returns {string} package.json 中声明的 version；若字段缺失或不是字符串会抛错，避免生成不可溯源的版本常量。
 */
function readPackageVersion() {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // parserVersion 会进入 RestoreDSL 产物元信息，必须是明确的 npm 包版本字符串。
    if (!pkg.version || typeof pkg.version !== 'string') {
        throw new Error('package.json version must be a non-empty string');
    }

    return pkg.version;
}

/**
 * 生成编译期版本常量文件。
 *
 * @param {string} version - npm 包版本号，写入 PARSER_VERSION 供 RestoreDSL meta.parserVersion 使用。
 * @returns {void} 直接覆盖 src/version.ts；文件内容由 package.json 派生，不承载手写业务逻辑。
 */
function writeVersionFile(version) {
    const content = [
        '// 本文件由 tools/sync_parser_version.js 根据 package.json 自动生成，请勿手改。',
        `export const PARSER_VERSION = '${version}';`,
        '',
    ].join('\n');

    fs.writeFileSync(versionTsPath, content);
}

writeVersionFile(readPackageVersion());
