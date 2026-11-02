const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'screenshots', '01_login.png');
const imgBuffer = fs.readFileSync(imgPath);

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Test Heading for Image",
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: {
                width: 550,
                height: 343,
              },
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(__dirname, 'test_output.docx'), buffer);
  console.log('test_output.docx generated successfully! Size:', buffer.length);
});
