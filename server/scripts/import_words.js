const xlsx = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'bamboo.sqlite');
const EXCEL_PATH = path.join(__dirname, '..', '..', 'src', 'assets', 'JuniorEn.xlsx');

const db = new Database(DB_PATH);

// 难度计算逻辑
function calculateDifficulty(word) {
  const len = word.length;
  const vowels = (word.match(/[aeiouy]/gi) || []).length;
  // 简单的启发式算法：结合长度、音节（元音数）和特殊后缀
  let score = (len * 0.4) + (vowels * 0.6);
  
  if (word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ability')) score += 1.5;
  if (word.endsWith('ly') || word.endsWith('ing')) score += 0.5;

  if (score <= 3) return 1;
  if (score <= 5) return 2;
  if (score <= 7) return 3;
  if (score <= 9) return 4;
  return 5;
}

async function run() {
  console.log('开始读取 Excel...');
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = xlsx.utils.sheet_to_json(sheet);

  console.log(`读取完成，共 ${rawData.length} 个单词。`);

  // 1. 初步处理，归类难度
  const wordsByDifficulty = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const processedWords = rawData.map(row => {
    const word = String(row['单词'] || '').trim();
    const translation = String(row['释义'] || '').trim();
    const phonetic = String(row['音标'] || '').trim();
    
    if (!word || !translation) return null;
    
    const diff = calculateDifficulty(word);
    const item = { word, translation, phonetic, difficulty: diff };
    wordsByDifficulty[diff].push(item);
    return item;
  }).filter(Boolean);

  console.log('难度分布:', Object.keys(wordsByDifficulty).map(d => `${d}星: ${wordsByDifficulty[d].length}`).join(', '));

  // 2. 为每个单词生成干扰项（从同难度的词库中抽取）
  console.log('正在生成干扰项池...');
  const finalData = processedWords.map(item => {
    const sameDiffWords = wordsByDifficulty[item.difficulty].filter(w => w.word !== item.word);
    
    // 随机打乱并取前 8 个作为干扰项池
    const shuffled = [...sameDiffWords].sort(() => 0.5 - Math.random());
    const pool = shuffled.slice(0, 8);
    
    return {
      ...item,
      distractors_en: JSON.stringify(pool.map(p => p.word)),
      distractors_zh: JSON.stringify(pool.map(p => p.translation))
    };
  });

  // 3. 写入数据库
  console.log('正在清空旧数据并写入数据库...');
  db.prepare('DELETE FROM words').run();
  
  const insert = db.prepare(`
    INSERT INTO words (word, phonetic, translation, difficulty, distractors_en, distractors_zh)
    VALUES (@word, @phonetic, @translation, @difficulty, @distractors_en, @distractors_zh)
  `);

  const insertMany = db.transaction((words) => {
    for (const w of words) insert.run(w);
  });

  insertMany(finalData);

  console.log('✅ 数据导入成功！');
}

run().catch(console.error);
