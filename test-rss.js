fetch("https://www.rtl.lu/rss/feed/business.rss", {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}).then(async r => {
  console.log("RTL LU Business:", r.status);
}).catch(console.error);

fetch("https://www.virgule.lu/economie/rss", {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}).then(async r => {
  console.log("Virgule Eco:", r.status);
}).catch(console.error);

