// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.48
const baseURL = "https://api.checkwatt.se";
let password;
let username;
let mode;
let modeStatus;
let rpiSerial;
let meterId;
let siteId;
let batteryCapacityKwh;
let peakBought;
let token;
let firstDayStr;
let lastDayStr;
let revenues;
let total;
let widget;
let day;
let date;
let language;
let settings = {}
let langId;
let hour;
let minute;
let translationData;
let monthName;
let currentLang;
let fcrdRevenues;
let fcrdRevenuesYear;
let ffrRevenues;
let ffrRevenuesYear;
let savingsRevenues;
let savingsRevenuesYear;
let totalSavings;
let totalSavingsYear;
const fileNameSettings = Script.name() + "_Settings.json";
const fileNameTranslations = Script.name() + "_Translations.json";
const fileNameRevenues = Script.name() + "_Revenues.json";
const fileNameRevenuesYear = Script.name() + "_RevenuesYear.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePathSettings = fm.joinPath(dir, fileNameSettings);
const filePathTranslations = fm.joinPath(dir, fileNameTranslations);
const filePathRevenues = fm.joinPath(dir, fileNameRevenues);
const filePathRevenuesYear = fm.joinPath(dir, fileNameRevenuesYear);
let height = 1150;
let width = 1300;

if (!config.runsInWidget){
  await updatecode();
  await readTranslations();
  await readsettings();
  await createVariables();
  //await start();
  //await createVariables();
}

if (config.runsInWidget){
 await readsettings();
}
if (config.runsInWidget){
  await updatecode();
  await createVariables();
}

async function start() {
  const [topType, topDay] = settings.showattop.split(",").map(s => s.trim());
  const [middleType, middleDay] = settings.showatmiddle.split(",").map(s => s.trim());
 // const [bottomType, bottomDay] = settings.showatbottom.split(",").map(s => s.trim());
  let alert = new Alert();
  //let vatText = includevat == 1 ? t("yes") : t("no")
  alert.message = 
    t("changesetup") + "?\n" +
    t("top").charAt(0).toUpperCase() + t("top").slice(1) + ":\n" + t(topType) + (topDay ? ", " + t(topDay) : "") + "\n" +
    t("middle").charAt(0).toUpperCase() + t("middle").slice(1) + ":\n" + t(middleType) + (middleDay ? ", " + t(middleDay) : "")
    //t("bottom").charAt(0).toUpperCase() + t("bottom").slice(1) + ":\n" + t(bottomType) + (bottomDay ? ", " + t(bottomDay) : "")
  alert.addAction(t("yes"));
  alert.addAction(t("no"));
  let index = await alert.presentAlert();
  if (index === 0) {
    settings = await ask();
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function updatecode() {
  try {
    const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-EiB/main/Version.txt");
    req.timeoutInterval = 5;
    const serverVersion = await req.loadString()
    if (version < serverVersion) {
      try {
        const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-EiB/main/EiB.js");
        req.timeoutInterval = 5;
        const response = await req.load();
        const status = req.response.statusCode;
        if (status !== 200) {
          throw new Error(`Error: HTTP ${status}`);
        }
        const codeString = response.toRawString();
        fm.writeString(module.filename, codeString);

        const reqTranslations = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-EiB/main/Translations.json");
        reqTranslations.timeoutInterval = 5;
        const responseTranslations = await reqTranslations.load();
        const statusTranslations = reqTranslations.response.statusCode;
        if (statusTranslations !== 200) {
          throw new Error(`Error: HTTP ${statusTranslations}`);
        }
        const codeStringTranslations = responseTranslations.toRawString();
        fm.writeString(filePathTranslations, codeStringTranslations);
        //fm.remove(filePathSettings);
        let updateNotify = new Notification();
        updateNotify.title = Script.name();
        updateNotify.body = "New version installed, " + serverVersion;
        updateNotify.sound = "default";
        await updateNotify.schedule();
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error("The update failed. Please try again later." + error);
  }
}

async function readsettings() {
  try {
    if (fm.fileExists(filePathSettings)) {
      let raw = fm.readString(filePathSettings);
      settings = JSON.parse(raw);
			if (!settings.graphOption || Object.keys(settings.graphOption).length === 0) {
        settings.graphOption = {
        top: "bar",
        middle: "bar",
        bottom: "bar"
        }
      }
			if (!settings.username || settings.username.length === 0) {
  			settings.username = "username"
			}
			if (!settings.password || settings.password.length === 0) {
  			settings.password = "password"
			}
			if (!settings.language || settings.language.length === 0) {
  			settings.language = 1
			}
			if (!settings.showattop || settings.showattop.length === 0) {
  			settings.showattop = "graph, thismonth"
			}
			if (!settings.showatmiddle || settings.showatmiddle.length === 0) {
  			settings.showatmiddle = "status, thismonth"
			}
			if (!settings.showatbottom || settings.showatbottom.length === 0) {
  			settings.showatbottom = "revenue, thismonth"
			}
 			if (!settings.height || settings.height.length === 0) {
  			settings.height = 750
			}
      langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
      await readTranslations();
    } else {
      if (config.runsInWidget) {
        return;
      }
      await askForLanguage();
      await readTranslations();
      let alert = new Alert();
      alert.title = "Support";
      alert.message = t("buymeacoffee") + "?";
      alert.addAction(t("noway"));
			alert.addAction("Ko-fi");
      alert.addCancelAction("Buymeacoffee");
      let response = await alert.present();
      if (response === -1) {
        Safari.open("https://buymeacoffee.com/flopp999");
      }
			if (response === 1) {
        Safari.open("https://ko-fi.com/flopp999");
      }
      throw new Error("Settings file not found");
    }
  } catch (error) {
    if (config.runsInWidget) {
      return;
    }
    console.warn("Settings file not found or error reading file: " + error.message);
    settings = await ask();
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function getDetails() {
  const endpoint = `/ems/ActivationSchedule`;
  const url = baseURL + endpoint;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
  const req = new Request(url);
  req.method = "GET";
  req.headers = headers;
  try {
    const response = await req.loadJSON();
    if (req.response.statusCode === 200) {
			batteryCapacityKwh = response["SystemSetting"]["BATTERY_CAPACITY"]
      return null;
    } else {
      console.error("❌ Fel statuskod:", req.response.statusCode);
    }
  } catch (err) {
    console.error("❌ Fel vid hämtning av details:", err);
  }
  return null;
}

async function getPeakBought() {
	let datum = new Date();
	let year = datum.getFullYear();
	let month = String(datum.getMonth() + 1).padStart(2, '0'); // månader är 0-indexerade
	let currentMonth = `${year}-${month}`;
	const endpoint = `/ems/PeakBoughtMonth?month=${currentMonth}`;
  const url = baseURL + endpoint;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
  const req = new Request(url);
  req.method = "GET";
  req.headers = headers;
  try {
    const response = await req.loadJSON();
    if (req.response.statusCode === 200) {
			peakBought = response["HourPeak"] / 1000;
      return null;
    } else {
      console.error("❌ Fel statuskod:", req.response.statusCode);
    }
  } catch (err) {
    console.error("❌ Fel vid hämtning av details:", err);
  }
  return null;
}

async function getRpiSerial() {
  const endpoint = `/ems/energyflow`;
  const url = baseURL + endpoint;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
  const req = new Request(url);
  req.method = "GET";
  req.headers = headers;
  try {
    const response = await req.loadJSON();
    if (req.response.statusCode === 200) {
			const raw = response["LoggerGridDatastream"];
  		// Plocka ut delarna före "_"
  		rpiSerial = raw.map(item => item.split("_")[0]);
      return;
    } else {
      console.error("❌ Fel statuskod:", req.response.statusCode);
    }
  } catch (err) {
    console.error("❌ Fel vid hämtning av rpiserial:", err);
  }
  return null;
}

async function getStatus() {
  const endpoint = `/site/Statuses?serial=` + rpiSerial;
  const url = baseURL + endpoint;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
  const req = new Request(url);
  req.method = "GET";
  req.headers = headers;
  try {
    const responsestatus = await req.loadJSON();
    if (req.response.statusCode === 200) {
			if (responsestatus[0]["Pending"][0] == "fcrd") {
				mode = "CO"
			} else if (responsestatus[0]["Pending"][0] == "sc") {
				mode = "SC"
			} else {
				mode = "Unknown"
			}
			if (responsestatus[0]["Service"][0] == "off") {
				modeStatus = t("deactivated")
			} else if (responsestatus[0]["Service"][0] == "fcrdup" || responsestatus[0]["Service"][0] == "fcrddown" || responsestatus[0]["Service"][0] == "fcrd" || responsestatus[0]["Service"][0] == "sc") {
				modeStatus = t("activated")
			} else {
				modeStatus = "Unknown"
			}
			siteId = responsestatus[0]["SiteId"]
			FpUpInKw = responsestatus[0]["FpUpInKw"]
			FpDownInKw = responsestatus[0]["FpDownInKw"]
			ChargingMax = responsestatus[0]["RelatedMeters"][0]["PeakAcKw"]
			DischargingMax = responsestatus[0]["RelatedMeters"][1]["PeakAcKw"]
      return null;
    } else {
      console.error("❌ Fel statuskod:", req.response.statusCode);
    }
  } catch (err) {
    console.error("❌ Fel vid hämtning av status", err);
  }
  return null;
}

// == Login: Basic Auth och hämta JWT ==
async function loginAndGetToken() {
  const credentials = `${username}:${password}`;
  const encoded = Data.fromString(credentials).toBase64String();
  const endpoint = "/user/Login?audience=eib";
  const url = baseURL + endpoint;
  const headers = {
  	"Authorization": `Basic ${encoded}`,
  	"Accept": "application/json",
  	"Content-Type": "application/json",
	};

  const payload = {
    OneTimePassword: ""
  };

  const req = new Request(url);
  req.method = "POST";
  req.headers = headers;
  req.body = JSON.stringify(payload);

  try {
    const res = await req.loadJSON();
		const jwt = res.JwtToken;
    if (!jwt) throw new Error("Inget JWT-token returnerat");
    return jwt;
  } catch (error) {
    console.error("❌ Misslyckades logga in:", error);
    return null;
  }
}
// == Hämta revenue med JWT ==
async function fetchRevenue(jwtToken) {
	Path = filePathRevenues
	DateObj = new Date();
	
	async function getRevenues() {
		// Dagens datum
		const now = new Date();
		// Första dagen i månaden
		const dayOne = new Date(now.getFullYear(), 0,1);
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		// Sista dagen i månaden
		const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		// Formatera som YYYY-MM-DD
		firstDayStr = `${firstDay.getFullYear()}-${(firstDay.getMonth() + 1).toString().padStart(2, '0')}-01`;
		lastDayStr = `${lastDay.getFullYear()}-${(lastDay.getMonth() + 1).toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;
		dayOneDayStr = `${dayOne.getFullYear()}-01-01`;
		const endpoint = `/revenue/${siteId}?from=${firstDayStr}&to=${lastDayStr}&resolution=day`;
		const url = baseURL + endpoint;
		const headers = {
			"Authorization": `Bearer ${jwtToken}`,
			"Accept": "application/json"
		};
		const req = new Request(url);
		req.method = "GET";
		req.headers = headers;
		req.timeoutInterval = 5;
		try {
			const revenue = await req.loadJSON();
			if (req.response.statusCode === 200) {
				const dataJSON = JSON.stringify(revenue, null ,2);
				fm.writeString(filePathRevenues, dataJSON);
			} else {
				console.error("❌ Fel statuskod:", req.response.statusCode);
			}
		} catch (err) {
			console.error("❌ Fel vid hämtning av month revenue:", err);
		}

		const endpointYear = `/revenue/${siteId}?from=${dayOneDayStr}&to=${lastDayStr}&resolution=month`;
		const urlYear = baseURL + endpointYear;
		const headersYear = {
			"Authorization": `Bearer ${jwtToken}`,
			"Accept": "application/json"
		};
		const reqYear = new Request(urlYear);
		reqYear.method = "GET";
		reqYear.headers = headersYear;
		reqYear.timeoutInterval = 5;
		try {
			const revenueYear = await reqYear.loadJSON();
			if (reqYear.response.statusCode === 200) {
				const dataJSON = JSON.stringify(revenueYear, null ,2);
				fm.writeString(filePathRevenuesYear, dataJSON);
			} else {
				console.error("❌ Fel statuskod:", req.response.statusCode);
			}
		} catch (err) {
			console.error("❌ Fel vid hämtning av year revenue:", err);
		}
	}
	
	if (fm.fileExists(filePathRevenues)) {
		let modified = fm.modificationDate(filePathRevenues);
		let now = new Date();
		let hoursDiff = (now - modified) / (1000 * 60 * 60);
		let modifiedDay = modified.getDate();
		let modifiedMonth = modified.getMonth();
		let modifiedYear = modified.getFullYear();
		let yesterday = new Date(now);
		yesterday.setDate(now.getDate() - 1);
		let isFromYesterday =
		modifiedDay === yesterday.getDate() &&
		modifiedMonth === yesterday.getMonth() &&
		modifiedYear === yesterday.getFullYear();
		if (hoursDiff > 6 || isFromYesterday) {
			await getRevenues();
		}
	} else {
		await getRevenues();
	}
	hour = DateObj.getHours();
	minute = DateObj.getMinutes();
	let content = fm.readString(filePathRevenues);
	revenue = JSON.parse(content);
	// Få ut alla NetRevenue för fcrd
	fcrdRevenues = revenue["Revenue"]
	.filter(item => item.ServiceName === "FCR-D")
	.map(item => item.NetRevenue);
	// Få ut alla NetRevenue för savings
	savingsRevenues = revenue["Revenue"]
	.filter(item => item.ServiceName === "Savings")
	.map(item => item.NetRevenue);
	// Få ut alla NetRevenue för ffr
	ffrRevenues = revenue["Revenue"]
	.filter(item => item.ServiceName === "FFR")
	.map(item => item.NetRevenue);

	//revenues = revenue.map(item => item.NetRevenue);
	totalFcrd = fcrdRevenues.reduce((sum, value) => sum + value, 0);
	totalFfr = ffrRevenues.reduce((sum, value) => sum + value, 0);
	totalSavings = savingsRevenues.reduce((sum, value) => sum + value, 0);
	content = fm.readString(filePathRevenuesYear);
	revenueYear = JSON.parse(content);
	// Få ut alla NetRevenue för fcrd
				fcrdRevenuesYear = revenueYear["Revenue"]
				.filter(item => item.ServiceName === "FCR-D")
				.map(item => item.NetRevenue);
		
				// Få ut alla NetRevenue för savings
				savingsRevenuesYear = revenueYear["Revenue"]
				.filter(item => item.ServiceName === "Savings")
				.map(item => item.NetRevenue);
				// Få ut alla NetRevenue för ffr
				ffrRevenuesYear = revenueYear["Revenue"]
				.filter(item => item.ServiceName === "FFR")
				.map(item => item.NetRevenue);

				//revenues = revenue.map(item => item.NetRevenue);
				totalFcrdYear = fcrdRevenuesYear.reduce((sum, value) => sum + value, 0);
				totalFfrYear = ffrRevenuesYear.reduce((sum, value) => sum + value, 0);
				totalSavingsYear = savingsRevenuesYear.reduce((sum, value) => sum + value, 0);

	
	updated = "" + hour + minute + "";
}

async function createVariables() {
  username = settings.username;
  password = settings.password;
  service = settings.service;
  rpiSerial = settings.rpiserial;
  batteryCapacityKwh = settings.batterycapacitykwh;
  meterId = settings.meterid;
}

async function readTranslations() {
  if (!fm.fileExists(filePathTranslations)) {
    let url = "https://raw.githubusercontent.com/flopp999/Scriptable-EiB/main/Translations.json";
    let req = new Request(url);
    req.timeoutInterval = 5;
    let content = await req.loadString();
    fm.writeString(filePathTranslations, content);
  }
  try {
    translationData = JSON.parse(fm.readString(filePathTranslations));
    const langMap = {
      1: "en",
      3: "sv"
    };
    currentLang = langMap[langId] || "en"; // fallback to english
  } catch (error) {
    console.error(error);
  }
}

function t(key) {
  const entry = translationData[key];
  if (!entry) return `[${key}]`; // key is missing
  return entry[currentLang] || entry["en"] || `[${key}]`;
}

async function ask() {
  settings.username = await askForUsername();
  settings.password = await askForPassword();
  settings.showattop = "graph, thismonth"
  settings.showatmiddle = "status, thismonth"
	settings.showatbottom = "revenue, thismonth"
  settings.graphOption = {"top": "bar"}
  settings.height = 750
  return settings
}

async function askForAllShowPositions() {
  const options = ["graph", "status", "nothing"];
  const days = ["thismonth"];
  const graphTypes = ["bar"];
  const chosenCombinations = [];
  const positions = ["top", "middle", "bottom"];
  const graphOption = {};
  for (let position of positions) {
    const usedCount = (type) =>
      chosenCombinations.filter(c => c && c.type === type).length;

    const usedGraph = usedCount("graph");
    const usedStatus = usedCount("status");

    let filteredOptions = options.filter(type => {
      if (type === "graph" && usedGraph >= 2) return false;
      if (type === "status" && usedStatus >= 2) return false;
      if ((usedGraph + usedStatus) >= 3 && (type === "graph" || type === "status")) return false;
      return true;
    });

    const alert = new Alert();
    alert.message = `${t("showwhat")} ${t(position)}?`;
    filteredOptions.forEach(o => alert.addAction(t(o)));
    const index = await alert.presentAlert();
    const choice = filteredOptions[index];

    let day = "";
    if (choice === "graph") {
      const graphTypeAlert = new Alert();
      graphTypeAlert.title = t(position).charAt(0).toUpperCase() + t(position).slice(1);
      graphTypeAlert.message = t("choosegraphtype");
      graphTypes.forEach(g => graphTypeAlert.addAction(t(g)));
      const gIndex = await graphTypeAlert.presentAlert();
      const selectedGraphType = graphTypes[gIndex];
      graphOption[position] = selectedGraphType;
    }
    if (choice !== "nothing") {
      const usedDaysForType = chosenCombinations
        .filter(c => c.type === choice)
        .map(c => c.day);
      const availableDays = days.filter(d => !usedDaysForType.includes(d));
      const dayAlert = new Alert();
      dayAlert.title = t(position).charAt(0).toUpperCase() + t(position).slice(1);
      dayAlert.message = t("showday") + "?";
      availableDays.forEach(d => dayAlert.addAction(t(d)));
      const dayIndex = await dayAlert.presentAlert();
      day = availableDays[dayIndex];
    }

    chosenCombinations.push({ position, type: choice, day });
    settings[`showat${position}`] = `${choice}, ${day}`;
  }
  settings.graphOption = graphOption;
  
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  const totalGraph = chosenCombinations.filter(c => c.type === "graph").length;
  const totalStatus = chosenCombinations.filter(c => c.type === "status").length;
  const totalPriceStats = chosenCombinations.filter(c => c.type === "pricestats").length;
  const heightMap = {
    "1-0-0": 1000,
    "0-1-0": 800,
    "0-0-1": 800,
  
    "1-1-0": 750,
    "1-0-1": 1130,
    "0-1-1": 900,
    "2-0-0": 550,
    "0-2-0": 600,
  
    "1-1-1": 730,
    "2-1-0": 380,
    "1-2-0": 540,
    "2-0-1": 470,
    "0-2-1": 580,
    "1-0-2": 1050,
    "0-1-2": 900,
  };
  
  const key = `${totalGraph}-${totalStatus}-${totalPriceStats}`;
  settings.height = heightMap[key] ?? 1150;
  return settings;
  }

// Select resolution
async function askForLanguage() {
  let alert = new Alert();
  alert.message = "Language/Språk:";
  alert.addAction("English");
  alert.addAction("Svenska");
  let index = await alert.presentAlert();
  settings.language = [1,3][index];
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
  return [1,3][index];
}

// Include extra cost?
async function askForUsername() {
  let alert = new Alert();
  alert.title = t("username");
  alert.message = (t("askforusername") + "?");
  alert.addTextField("example@mail.com",settings.username).setEmailAddressKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  username = input
  return input;
}

// Include extra cost?
async function askForPassword() {
  let alert = new Alert();
  alert.title = t("password");
  alert.message = (t("askforpassword") + "?");
  alert.addTextField().setDefaultKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  password = input;
  return input;
}

async function Status(day) {
	let row = listwidget.addStack();
	row.layoutHorizontally()
  let left = row.addStack()
  left.layoutVertically()
	row.addSpacer(40)
	let mid = row.addStack()
	mid.layoutVertically()
	let right = row.addStack()
	right.layoutVertically()
	let whatday = left.addText(t("mode") + ": " + mode + ", " + modeStatus);
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
	whatday = mid.addText(t("capacity") + ": " + String(batteryCapacityKwh) +  "kWh");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
  whatday = left.addText(t("charge") + ": " + String(ChargingMax) + "kW");
  whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
  whatday = mid.addText(t("up") + ": " + String(FpUpInKw) + "kW");
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(13);
	whatday = left.addText(t("discharge") + ": " + String(DischargingMax) + "kW");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
	whatday = mid.addText(t("down") + ": " + String(FpDownInKw) + "kW");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
}

async function Graph(day, graphOption) {
//chart
  if (60 == 60) {
    let graphtoday = "https://quickchart.io/chart?bkg=black&w=1300&h="+settings.height+"&c="
    graphtoday += encodeURI("{\
      data: { \
        labels: ["+daysArray+"],\
        datasets: [\
          {\
            data: ["+fcrdRevenues+"],\
            type: '"+graphOption+"',\
            fill: false,\
            borderColor: 'rgb(221,204,119)',\
            borderWidth: 20, \
            pointRadius: 0\
          },\
					{\
            data: ["+savingsRevenues+"],\
            type: '"+graphOption+"',\
            fill: false,\
            borderColor: 'rgb(128,153,82)',\
            borderWidth: 20, \
            pointRadius: 0\
          },\
        ]\
      },\
        options:\
          {\
						title: {\
							display: true,\
							fontSize: 40,\
							fontColor: 'white',\
							text: '"+monthName+"'\
						},\
            legend:\
            {\
              display: false\
            },\
            scales:\
            {\
              xAxes: [{\
								stacked: true,\
                offset:true,\
                ticks:{fontSize:30,fontColor:'white'}\
              }],\
              yAxes: [{\
                stacked:true, gridLines: {color:'white'},ticks:{stepSize:10,beginAtZero:true,fontSize:30,fontColor:'white'}\
              }]\
            }\
          }\
    }")
    graphtoday.timeoutInterval = 5;
    const GRAPH = await new Request(graphtoday).loadImage()
    let chart = listwidget.addStack()
    chart.addImage(GRAPH) 
  }
  listwidget.addSpacer(5);
}

const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const now = new Date();
// Hämta antalet dagar i innevarande månad
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
// Skapa array från 1 till antal dagar
const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

async function renderSection(position) {
  const value = settings[`showat${position}`];
  if (!value || value === "nothing") return;

  const [type, day] = value.split(",").map(s => s.trim());
	
  const graphOption = settings.graphOption[position]
  switch (type) {
    case "status":
      await Status(day);
      break;
    case "graph":
      await Graph(day, graphOption);
      break;
    case "revenue":
      await Revenue();
      break;
    default:
  }
}

let listwidget = new ListWidget();

async function Revenue() {
	let ja = listwidget.addStack()
  listwidget.addSpacer(10)
	let save = listwidget.addStack();
  save.layoutHorizontally()
  let saveleft = save.addStack()
  saveleft.layoutVertically()
  save.addSpacer(20)
  let savemid = save.addStack()
  savemid.layoutVertically()
  save.addSpacer(30)
  let saveright = save.addStack()
  saveright.layoutVertically()
  save.addSpacer(20)
  let savemost = save.addStack()
  savemost.layoutVertically()
  let te = saveleft.addText(String(monthName))
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff")
  te = savemid.addText(" ")
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveleft.addText("FCR-D");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = savemid.addText(String(Math.round(totalFcrd)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveleft.addText(t("savings"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveleft.addText(t("peakbought"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemid.addText(String(Math.round(totalSavings)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	 te = savemid.addText(String(peakBought.toFixed(1)) + "kW");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveright.addText(t("thisyear"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveright.addText("FCR-D");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveright.addText(t("savings"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(" ")
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(String(Math.round(totalFcrdYear)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(String(Math.round(totalSavingsYear)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
}

async function createWidget(){
	token = await loginAndGetToken();
	
	await getDetails();
	await getRpiSerial();
	
	await getStatus();
	await fetchRevenue(token);
	await getPeakBought();
	
	const date = new Date();
	if (settings.language == 1) {
		monthName = date.toLocaleDateString("en-EN", { month: "long" });
	} else if (settings.language == 3) {
		monthName = date.toLocaleDateString("sv-SE", { month: "long" });
	}
  monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  listwidget.backgroundColor = new Color("#000000");
  await renderSection("top");
  await renderSection("middle");
  await renderSection("bottom");  
  listwidget.addSpacer(10)
  let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  return listwidget
}

widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  if (Math.random() < 0.5) {
    let alert = new Alert();
    alert.title = "Support";
    alert.message = t("buymeacoffee") + "?";
    alert.addCancelAction("Buymeacoffee 👍");
	  alert.addAction("Ko-fi 👍");
    alert.addAction(t("noway"));
    let response = await alert.present();
    if (response === -1) {
      Safari.open("https://buymeacoffee.com/flopp999");
    }
		if (response === 0) {
        Safari.open("https://ko-fi.com/flopp999");
    }
  }
}

widget.presentLarge()
Script.complete();
