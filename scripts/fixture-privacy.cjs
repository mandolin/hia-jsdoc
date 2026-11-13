/**
 * @file
 * @lang zh-CN 示例门禁按路径内容拦截私有位置，允许已确认公开的项目品牌。
 * @lang en Fixture gates reject private locations by path content while allowing the confirmed public project brand.
 */
"use strict";

/**
 * @lang zh-CN 检查公开文本中的本机路径和内部目录，有限解码ASCII百分号与JSON转义。
 * @lang en Check public text for local paths and internal directories, with bounded ASCII percent and JSON-escape decoding.
 * @param {string} text <lang><zh-CN>已读取的示例正文。</zh-CN><en>Fixture text already read by the caller.</en></lang>
 * @returns {boolean} <lang><zh-CN>存在私有路径时为true；无IO或输入变更。</zh-CN><en>True when private path content exists, without IO or input mutation.</en></lang>
 */
function hasFixtureLocalPathLeakage(text) {
  // <lang><zh-CN>限定三轮以识别常见双重编码，全部替换只处理ASCII转义且不执行输入。</zh-CN><en>Limit decoding to three rounds for common double encoding, processing only ASCII escapes without executing input.</en></lang>
  let decoded = text;
  for (let pass = 0; pass < 3; pass += 1) {
    decoded = decoded.replace(/%([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\u00([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  return /work-zone|Github_mandolin|ai[\\/]+codex|(?:^|[^a-z0-9+.-])[a-z]:[\\/]|file:\/\/|(?:^|[\s"'(<])\\{2,}[a-z0-9_.-]+[\\/]/i.test(decoded);
}

module.exports = {hasFixtureLocalPathLeakage};
