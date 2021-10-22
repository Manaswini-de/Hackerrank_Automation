// npm init -y
// npm install minimist
// npm install puppeteer

// node hackerRankAutomation.js --url=https://www.hackerrank.com --config=config.json 

let minimist = require("minimist");
let puppeteer = require("puppeteer");
let fs = require("fs");

let args = minimist(process.argv);

configJSON = fs.readFileSync(args.config, "utf-8");
configJSO = JSON.parse(configJSON);

async function run(){
    // start the browser
    let browser = await puppeteer.launch({
        headless: false,
        args:[
            '--start-maximized' // to open in full screen
        ],
        defaultViewport: null
    });

    // get the tabs (there is only one tab)
    let pages = await browser.pages();
    let page = pages[0];

    // open the url
    await page.goto(args.url);

    // wait and then click on login on page 1
    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    // wait and then click on login on page 2
    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    // type userid 
    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']",configJSO.userid, {delay: 40});

    // type password
    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']",configJSO.password, {delay: 40});

    await page.waitForTimeout(1000)

    //click on login on page 3
    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");

    //click on compete
    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");
    await page.waitForTimeout(500);

    //click on manage contest
    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");
    await page.waitForTimeout(2000);

    await page.waitForSelector("a[data-attr1='Last']");
    let numpages = await page.$eval("a[data-attr1='Last']",function(atag){
        let totalpgs = atag.getAttribute("data-page");
        return totalpgs;
    }) 

    for(let i=1; i<=numpages; i++){
        await handleAllContestsOfApage(page,browser);

        if(i<numpages){
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    }
}
run();

async function handleAllContestsOfApage(page,browser){
    //Fetch the urls of all the contest in the page
    await page.waitForSelector("a.backbone.block-center");
    let contestUrls = await page.$$eval("a.backbone.block-center",function(atags){ 
        // $$eval is basically querySelectorAll in puppeteer.This method runs Array.from(document.querySelectorAll(selector)) within the page and passes the result as the first argument to the pageFunction.

        let urls = [];

        for(let i=0; i<atags.length; i++){
            let url = atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls; // this urls will get stored in the contestUrls
    })

    for(let i=0; i<contestUrls.length; i++){
        let contestTab = await browser.newPage();
        await saveModeratorInContest(contestTab,args.url+contestUrls[i],configJSO.moderator);

        await contestTab.close();
        await contestTab.waitForTimeout(2000);
    }
}

async function saveModeratorInContest(contestTab,fullUrl,moderator){
    await contestTab.bringToFront(); // to bring the new Tab to focus
    contestTab.goto(fullUrl); 
    await contestTab.waitForTimeout(4000);

    await contestTab.waitForSelector("li[data-tab='moderators']");
    await contestTab.click("li[data-tab='moderators']");

    await contestTab.waitForTimeout(1000);

    await contestTab.waitForSelector("input#moderator");
    await contestTab.type("input#moderator", moderator, {delay: 40});
    await contestTab.keyboard.press("Enter");

    await contestTab.waitForTimeout(1000);
}
