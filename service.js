import pdfjs from "pdfjs-dist";

const match = {g_d1_f1: "name", g_d1_f2: "description", g_d1_f5: "name", g_d1_f6: "description"};

export async function deconstruct(file) {
  const matches = {};
  const pages = [];
  const pdf = await pdfjs.getDocument(file).promise;
  
  for (let idx = 0; idx < pdf.numPages; idx++) {
    const page = await pdf.getPage(idx + 1);
    const content = await page.getTextContent();
    pages.push(content);
    content.items.forEach(item => {
      if (!matches.hasOwnProperty(item.fontName) && item.str) {
        matches[item.fontName] = item.str;
      }
    });
  }

  return { 
    pages,
    matches: Object.keys(matches).map(it => ({
      font: it,
      text: matches[it],
      type: ""
    }))
  };
}