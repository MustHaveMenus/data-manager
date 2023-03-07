import pdfjs from "pdfjs-dist";
import puppeteer from "puppeteer";
import jquery from "jquery";
import {JSDOM} from "jsdom";

const BROWSER_HEADERS = { 
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', 
  'upgrade-insecure-requests': '1', 
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 
  'accept-encoding': 'gzip, deflate, br', 
  'accept-language': 'en-US,en;q=0.9,en;q=0.8' 
}

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

export async function getPopMenu(url) {
  console.log("=> URL BEFORE: " + url);
  if (url.indexOf("https") === -1) {
    url = `https://${url}`;
  }
  if (url.indexOf("menu#menu") > -1) {
    const bits = url.split("menu#menu=");
    url = `${bits[0]}menus/${bits[1]}`;
  }
  console.log("=> URL AFTER: " + url);


  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 720 }); 
  await page.setExtraHTTPHeaders(BROWSER_HEADERS); 
  await page.goto(url);
  await autoScrollPage(page);
  await page.waitForTimeout(1000)
  
  const content = await page.content();
  
  await browser.close();

  const dom = new JSDOM(content);
  const $ = jquery(dom.window);
  const $sections = $(".pm-menu-section");

  const sections = [];
  $sections.each(function() {
    const $section = $(this);
    const section = {
      name: $section.find("h3").text(),
      items: []
    }

    let $items = $section.find(".pm-next-dish-card-inner");
    if ($items.length === 0) {
      $items = $(".pm-dish-card");
    }

    $items.each(function() {
      const $item = $(this);
      section.items.push({
        name: $item.find("h4").text(),
        description: $item.find("p span:last").text(),
        price: $item.find(".pm-next-dish-price").text()
      })
    });

    sections.push(section);
  });

  return sections;
}

async function autoScrollPage(page){
  await page.evaluate(async () => {
      await new Promise((resolve) => {
          var totalHeight = 0;
          var distance = 500;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight - window.innerHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}