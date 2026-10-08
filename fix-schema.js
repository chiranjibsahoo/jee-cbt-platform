const fs = require('fs');
const path = 'apps/api/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// Replace all enum definitions with just nothing, and fields to String
const enums = ['UserRole', 'ExamType', 'ExamMode', 'Subject', 'QuestionType', 'Difficulty', 'AttemptStatus', 'QuestionStatus', 'MistakeType'];

enums.forEach(e => {
  const regex = new RegExp(`enum ${e} {[\\s\\S]*?}`, 'g');
  content = content.replace(regex, '');
  
  // replace fields using this enum to String
  const fieldRegex = new RegExp(`([a-zA-Z]+)(\\s+)${e}(\\s+)`, 'g');
  content = content.replace(fieldRegex, `$1$2String$3`);
  
  const fieldRegexOptional = new RegExp(`([a-zA-Z]+)(\\s+)${e}\\?`, 'g');
  content = content.replace(fieldRegexOptional, `$1$2String?`);
});

// Since I sed'd UserRole to model earlier, I need to restore from backup or just fix it. Let's just download the original schema string and rewrite it.
