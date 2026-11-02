const docx = require('docx');
console.log('docx version/exports successfully loaded!');
console.log('Available classes:', Object.keys(docx).filter(k => ['Document', 'Paragraph', 'TextRun', 'Table', 'ImageRun'].includes(k)));
