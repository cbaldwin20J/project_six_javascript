const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const createCSVFile = require('csv-file-creator');
const glob = require("glob");

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
		const shirt_detail_urls = [];
		// each 'li' is one shirt.
		$('.products li').each(function (index, li) {
    		shirt_detail_urls.push($(li).find('a').attr("href")); // "this" is the current element in the loop
		});
		
		// 'shirt_dictionaries will be used for the createCSVFile module'
		const shirt_dictionaries = [["Title", "Price", "ImageUrl", "URL", "Time"]];
		const raw_date = new Date();

		
		// to be used for the csv file name. ex: 2018-07-03.csv
		const date = raw_date.getFullYear() + "-" + ('0' + raw_date.getMonth()).slice(-2) + "-" + ('0' + raw_date.getDate()).slice(-2);
		// to be put in the csv file as the time. ex: 7:30
		const hoursMinutes = ('0' + raw_date.getHours()).slice(-2) + ':' + ('0' + raw_date.getMinutes()).slice(-2);
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

					// We want a bunch of arrays inside one container array.
					shirt_dictionaries.push([title, price, imageUrl, url, time]);
					// when all of the shirts have been scraped. 8 total shirts.
					if(shirt_dictionaries.length == 9){
						const dir = './data';
						// if 'data' folder doesn't exist then create it.
						if (!fs.existsSync(dir)){
						    fs.mkdirSync(dir);
						}

						// gets the old csv file to delete
						let file = glob.sync("data/*.csv");

						// deletes the old csv file
						if(file[0]){
							fs.unlink(file[0], function(error) {
						    	if (error) {
						        	throw error;
						    	}
							});
						}
						
						// creates the new csv file
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