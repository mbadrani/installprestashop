'use strict';

const puppeteer = require('puppeteer');
require('events').EventEmitter.prototype._maxListeners = Infinity;
const faker = require('faker')
let argv = require('minimist')(process.argv.slice(2));

let LOCALHOST = argv.LOCALHOST || 'localhost/prestashop_tommy'

//let URL = argv.URL || 'http://' + LOCALHOST + '/install';
let URL = argv.URL || 'http://' + LOCALHOST +'/install-dev';
let EMAIL = argv.LOGIN || 'demo@prestashop.com';
let PASSWORD = argv.PASSWD || 'prestashop_demo';
let SHOPNAME = faker.fake("{{company.companyName}}")
let FIRSTNAME = faker.fake("{{name.firstName}}")
let LASTNAME = faker.fake("{{name.lastName}}")
let DBNAME = faker.fake("{{name.lastName}}")

const populatePS = async (browser, page) => {

	await page.goto(URL, { waitUntil: 'networkidle0' });

//  await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

	//page 1
	await page.waitForSelector('#langList')
	await page.click('#langList') //type en then enter
  await page.type('#langList', "EN")
  await page.keyboard.press('Enter')
  await page.waitForSelector('#btNext')
  await page.click('#btNext')
//page 2
  await page.waitForSelector('#set_license')
  await page.click('#set_license')
  await page.waitForSelector('#btNext')
  await page.click('#btNext')
//page 3
  await page.waitForSelector('#btNext')
  await page.click('#btNext')
//page 4
  await page.waitForSelector('#infosShop')
  await page.type('#infosShop', SHOPNAME)
  await page.click('#infosActivity_chosen') //type cars then enter
  await page.type('#infosActivity_chosen', "Cars")
  await page.keyboard.press('Enter')

  await page.click('#infosCountry_chosen') //type cars then enter
  await page.type('#infosCountry_chosen', "France")
  await page.keyboard.press('Enter')

  await page.type('#infosFirstname', FIRSTNAME)
  await page.type('#infosName', LASTNAME)
  await page.type('#infosEmail', EMAIL)
  await page.type('#infosPassword', PASSWORD)
  await page.type('#infosPasswordRepeat', PASSWORD)

  await page.waitForSelector('#btNext')
  await page.click('#btNext')

//page 5
  await page.waitForSelector('#dbServer')
  await page.click("#dbServer", {clickCount: 3})
  await page.type('#dbServer', "127.0.0.1")
//  await page.type('#dbServer', "mysql:3306")
  await page.click("#dbName", {clickCount: 3})
//  await page.keyboard.press('Backspace')
  await page.type('#dbName', "ps"+DBNAME)
  await page.click("#dbLogin", {clickCount: 3})
//  await page.keyboard.press('Backspace')
  await page.type('#dbLogin', "root")
  await page.click("#dbPassword", {clickCount: 3})
//  await page.keyboard.press('Backspace')
  await page.type('#dbPassword', "root")
  await page.click("#db_prefix", {clickCount: 3})
  await page.type('#db_prefix', "ps_")
//	await page.type('#db_prefix', "ps_"+DBNAME)
  //await page.type('#db_prefix', "ps_dbdefoliesy")

	await page.click("#btTestDB")
	await page.waitForSelector('#btCreateDB')
	await page.click("#btCreateDB")

  await page.waitForSelector('#dbResultCheck')
	await page.waitForSelector('#btNext')
  await page.click('#btNext')

	console.log('shop URL under creation:' + LOCALHOST)
	console.log('shop DB:' + DBNAME)

	await page.waitFor('a.BO')

	return DBNAME
}

const interceptReq = async (browser, page) => {
//	console.log('je suis ici')

	let date_debut =new Date()

	const step1 = await page.waitForRequest(request => request.url().toString().startsWith(URL+ '/index.php?populateDatabase=true') && !(request.failure()), { timeout: 300000});
	console.log('step1 populateDatabase')

	const step2 = await page.waitForRequest(request => request.url().toString().startsWith(URL+ '/index.php?configureShop=true') && !(request.failure()), { timeout: 300000});
	console.log('step2 configureShop')

	const step3 = await page.waitForRequest(request => request.url().toString().startsWith(URL+ '/index.php?installFixtures=true') && !(request.failure()), { timeout: 300000});
	console.log('step3 installFixtures')

	const step4 = await page.waitForRequest(request => request.url().toString().startsWith(URL+ '/index.php?installModules=true') && !(request.failure()), { timeout: 300000});
	console.log('step4 installModules')

	const step5 = await page.waitForRequest(request => request.url().toString().startsWith(URL+ '/index.php?installModulesAddons=true') && !(request.failure()), { timeout: 300000});
	console.log('step5 installModulesAddons')

	const finalRequest = await page.waitForRequest(request => request.url().toString().startsWith(URL+ '/index.php?installTheme=true') && !(request.failure()), { timeout: 3000000});
//	const finalRequest = await page.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
	let date_fin =new Date()
	console.log('----shop successfully created in : ' + ((date_fin.getTime() - date_debut.getTime())/1000) + ' sec')
//	console.log('----shop successfully created in : ' + ((date_fin.getTime() - date_debut.getTime())/60000) + ' min')
	return finalRequest.url();
}

const run = async () => {
	const browser = await puppeteer.launch({ headless: false })
	const page = await browser.newPage()

  const populateInstall = await populatePS(browser, page)
	const interceptRequest = await interceptReq(browser, page)

  browser.close()
}

run()
  .then(value => {
    console.log("--------everything is fine ... the end :-* --------")
  })
  .catch(e => console.log(`error: ${e}`))
