const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const createCSVFile = require('csv-file-creator');

// the website to be scraped.
const url = "http://shirts4mike.com/shirts.php";

// if there is an error, then call this function to append 
// it to 'error.log'.
function errorMessage(message){
	const dir = './data';
	// if 'data' folder doesn't exist then create it.
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}

	errorTime = new Date();
	wholeMessage = "["+errorTime+"] <"+message+">\n";
	fs.appendFile('data/error.log', wholeMessage, function (err) {
  		console.log('Error saved in error.log');
	});
}


request(url, function(err, response, html){
	// if there is no error then proceed.
	if(!err){
		// get all the html from the 'url'.
		let $ = cheerio.load(html);
		// put each shirt detail page url in an array.
		var shirt_detail_urls = [];
		// each 'li' is one shirt.
		$('.products li').each(function (index, li) {
    		shirt_detail_urls.push($(li).find('a').attr("href")); // "this" is the current element in the loop
		});

		// put an object literal for each shirt's title, price, etc in array.
		const shirt_dictionaries = [["title", "price", "imageUrl", "url", "time"]];
		const raw_date = new Date();

		
		// to be used for the csv file name. ex: 2018-7-3.csv
		const date = raw_date.getFullYear() + "-" + ('0' + raw_date.getMonth()).slice(-2) + "-" + ('0' + raw_date.getDate()).slice(-2);
		// to be put in the csv file as the time. ex: 7:30
		const hoursMinutes = raw_date.getHours() + ':' + raw_date.getMinutes();
		for(let i=0; i<shirt_detail_urls.length; i++){
			let url2 = `http://shirts4mike.com/${shirt_detail_urls[i]}`;
			// scrape each shirts detail page for the title, price, etc.
			request(url2, function(err, response, html){
				if(!err){
					$ = cheerio.load(html);
					
					let title = $('.shirt-details').find('h1').text().slice(4);
					let price = $('.price').text();
					let imageUrl = "http://shirts4mike.com/" + $('.shirt-picture').find('img').attr("src");
					let url = url2;
					let time = hoursMinutes;
					// *****************************start below this

					shirt_dictionaries.push([title, price, imageUrl, url, time]);
					// when all of the shirts have been scraped. 8 total shirts.
					if(shirt_dictionaries.length == 8){
						const dir = './data';
						// if 'data' folder doesn't exist then create it.
						if (!fs.existsSync(dir)){
						    fs.mkdirSync(dir);
						}

					
						fs.unlink('data\\*.csv', function(error) {
						    if (error) {
						        throw error;
						    }
						});
						fs.readdir('data', (err, files)=>{
						   for (var i = 0, len = files.length; i < len; i++) {
						      var match = files[i].match('*.csv');
						      if(match !== null)
						          fs.unlink(match[0]);
						   }
						});

						createCSVFile(`data/${date}.csv`, shirt_dictionaries);
						
					}
				}else{
					errorMessage(err.message);
					// break out of the loop if there is an error, so there
					// isn't a loop of errors.
					i=100;
				}
			});
		}		
	}else{
		errorMessage(err.message);
	}
});