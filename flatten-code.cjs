const fs = require("fs");
const path = require("path");
const ignore = require("ignore");
const { execSync } = require("child_process");

// --- 配置区域 ---
const CONFIG = {
  outputFile: "project_summary",
  stagedOutputFile: "changes",
  gitignorePath: ".gitignore",
  // 除了 .gitignore 外，额外需要强制排除的目录（不出现在树，也不出现在内容）
  extraExcludes: ["node_modules", ".git", "dist", "build"],

  // --- 文件名白名单 (正则表达式) ---
  // 只有匹配这些正则的文件，其内容才会被放入汇总部分
  whiteList: [
    /\.tsx?$/, // .ts, .tsx
    /\.jsx?$/, // .js, .jsx
    /package\.json$/,
    /\.css$/,
    /\.json$/,
  ],
};

// 初始化 ignore 实例（基于项目根目录的 .gitignore）
const ig = ignore();
if (fs.existsSync(CONFIG.gitignorePath)) {
  ig.add(fs.readFileSync(CONFIG.gitignorePath).toString());
}
ig.add(CONFIG.extraExcludes);

/**
 * 执行 Git 命令并返回结果数组
 */
function getGitStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
    });
    return output.split("\n").filter((f) => f.trim() !== "");
  } catch (e) {
    console.error("❌ 获取 Git 暂存区文件失败，请确保你在 Git 仓库中。");
    process.exit(1);
  }
}

/**
 * 获取 Git Diff 具体内容
 */
function getGitDiffContent() {
  try {
    // 1. 获取所有已暂存的文件名
    const stagedFiles = getGitStagedFiles();

    // 2. 在 Node.js 侧根据白名单过滤文件
    const filteredFiles = stagedFiles.filter((file) =>
      isFileInWhiteList(path.basename(file)),
    );

    if (filteredFiles.length === 0) {
      return "(没有匹配白名单的更改内容)";
    }

    // 3. 将文件名数组转为命令行参数字符串
    // 使用双引号包裹路径以处理空格，并用空格连接
    const filesParam = filteredFiles.map((f) => `"${f}"`).join(" ");

    // 执行 diff
    return execSync(`git diff --cached --unified=3 -- ${filesParam}`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 设置 10MB 缓冲区防止大型 diff 溢出
    });
  } catch (e) {
    return `(获取 Diff 失败: ${e.message})`;
  }
}

/**
 * 判断文件是否在白名单中
 */
function isFileInWhiteList(filename) {
  return CONFIG.whiteList.some((regex) => regex.test(filename));
}

/**
 * 递归生成目录树（只处理指定的路径们）
 */
function generateTreeForPaths(paths) {
  let structure = "";

  paths.forEach((targetPath, index) => {
    const isLast = index === paths.length - 1;
    const basename = path.basename(targetPath);
    structure += `${isLast ? "└── " : "├── "}${basename}\n`;

    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      const prefix = isLast ? "    " : "│   ";
      structure += generateTree(targetPath, prefix);
    }
  });

  return structure;
}

function generateTree(dir, prefix = "") {
  let structure = "";
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return `${prefix}(无法读取目录)\n`;
  }

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (ig.ignores(relativePath)) return;

    const isLast = index === files.length - 1;
    structure += `${prefix}${isLast ? "└── " : "├── "}${file}\n`;

    if (fs.statSync(fullPath).isDirectory()) {
      structure += generateTree(fullPath, prefix + (isLast ? "    " : "│   "));
    }
  });
  return structure;
}

/**
 * 递归收集符合条件的文件内容（只处理指定的路径们）
 */
function generateCodeBlocksForPaths(paths) {
  let content = "";

  paths.forEach((targetPath) => {
    const stats = fs.statSync(targetPath);

    if (stats.isFile()) {
      const relativePath = path.relative(process.cwd(), targetPath);
      if (ig.ignores(relativePath)) return;

      if (isFileInWhiteList(path.basename(targetPath))) {
        content += appendFileContent(targetPath, relativePath);
      }
    } else if (stats.isDirectory()) {
      content += collectFilesInDir(targetPath);
    }
  });

  return content;
}

function collectFilesInDir(dir) {
  let content = "";
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return "";
  }

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (ig.ignores(relativePath)) return;

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      content += collectFilesInDir(fullPath);
    } else if (isFileInWhiteList(file)) {
      content += appendFileContent(fullPath, relativePath);
    }
  });

  return content;
}

function appendFileContent(fullPath, relativePath) {
  let block = `## File: ${relativePath}\n\n`;
  const ext = path.extname(fullPath).slice(1) || "text";

  try {
    const code = fs.readFileSync(fullPath, "utf-8");
    block += `\`\`\`${ext}\n${code}\n\`\`\`\n\n`;
  } catch (e) {
    block += `(读取文件失败: ${e.message})\n\n`;
  }

  block += `---\n\n`;
  return block;
}

// --- 主程序 ---
function main() {
  // 获取命令行参数（跳过 node 和脚本名）
  const args = process.argv.slice(2);
  const isStaged = args.includes("-s") || args.includes("--staged");
  const isDiffOnly = args.includes("--diff");

  let filePrefix = CONFIG.outputFile;
  let contentBody = "";

  // 第一部分：目录结构
  let finalMarkdown = `# Project Source Code Summary\n\n`;
  finalMarkdown += `## 1. Directory Structure\n\`\`\`text\n`;
  finalMarkdown += generateTreeForPaths(["."]);
  finalMarkdown += `\`\`\`\n\n---\n\n`;

  if (isStaged) {
    filePrefix = CONFIG.stagedOutputFile;
    const stagedFiles = getGitStagedFiles();

    if (stagedFiles.length === 0) {
      console.log("查无已暂存（Staged）的文件，任务结束。");
      return;
    }

    console.log(`快速处理暂存区文件 (${stagedFiles.length} 个)...`);

    if (isDiffOnly) {
      // 模式 A: 仅提取 Diff 内容
      finalMarkdown += `**模式**：Git Staged Diff Only\n\n`;
      contentBody = `## Git Diff Content\n\n\`\`\`diff\n${getGitDiffContent()}\n\`\`\`\n`;
    } else {
      // 模式 B: 提取暂存文件的全文
      finalMarkdown += `**模式**：Git Staged Full Content\n\n`;
      // 这里复用你原来的 generateTree 逻辑，但由于 staged 文件分散，通常直接列出
      stagedFiles.forEach((file) => {
        if (isFileInWhiteList(file)) {
          contentBody += appendFileContent(path.resolve(file), file);
        }
      });
    }
  } else {
    // 清理路径并转换为绝对路径
    let targetPaths = args.length > 0 ? args : ["."];
    targetPaths = targetPaths.map((p) => path.resolve(p));

    // 过滤掉不存在的路径并提示
    const validPaths = targetPaths.filter((p) => {
      if (!fs.existsSync(p)) {
        console.warn(`⚠️ 路径不存在，已跳过: ${p}`);
        return false;
      }
      return true;
    });

    if (validPaths.length === 0) {
      console.error("❌ 没有有效的路径可处理");
      process.exit(1);
    }

    console.log(`🚀 开始处理以下路径 (${validPaths.length} 个):`);
    validPaths.forEach((p) => console.log(`   - ${p}`));

    finalMarkdown += `**扫描路径**：\n\n`;
    validPaths.forEach((p) => {
      finalMarkdown += `- ${path.relative(process.cwd(), p) || "."}\n`;
    });
    finalMarkdown += `\n\n`;

    // 第二部分：代码内容（仅白名单文件）
    finalMarkdown += `## 2. Source Code (Filtered by Whitelist)\n\n`;
    finalMarkdown += generateCodeBlocksForPaths(validPaths);
  }

  // 生成带时间戳的文件名
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0");

  const filename = `${filePrefix}_${timestamp}.md`;

  fs.writeFileSync(filename, finalMarkdown + contentBody, "utf-8");

  console.log(`\n✅ 处理完成！`);
  console.log(`   - 结果已保存至: ${filename}`);
  console.log(`   - 源码部分仅包含白名单匹配的文件`);
}

main();
