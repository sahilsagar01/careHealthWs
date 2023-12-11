const puppeteer = require('puppeteer');
const fs = require("fs");


async function selectStateAndGetCityOptions(page, state) {
    await page.waitForTimeout(500)
    // Click on the state option
    await page.select('select[id="searchState"]', state.optionValue);

    // Add a delay
    await page.waitForTimeout(8000); // Adjust the delay as needed

    // Wait for the city select element to be ready
    await page.waitForSelector('select[name="city"]');
    
    // Extract the values of all options within the updated city select element
    const cityOptions = await page.evaluate((externalState) => {
        const citySelect = document.querySelector('select[name="city"]');
        const optionElements = citySelect.querySelectorAll('option');
        return Array.from(optionElements, option => {
            return {
                optionCityValue: option.value,
                optionCityName: option.textContent.trim(),
                state: externalState.optionName
            }
        });
    },state);

    return cityOptions;
}

async function selectCityAndGetHospitalDetails(page, city) {
    // Click on the city option
    await page.select('select[id="city"]', city.optionCityValue);

    // Add a delay
    await page.waitForTimeout(500); // Adjust the delay as needed

    await page.waitForSelector('input[class="greenSrchBtn_network"]');

    await page.click('input[class="greenSrchBtn_network"]')

    await page.waitForTimeout(500)

    await page.waitForSelector('.cubl_hospitalLocationResultMainIn');
    // Wait for the table to be updated
    const element = page.$('.cubl_hospitalLocationResultMainIn');

    if(element !== null){
        await page.waitForTimeout(1000);
        await page.waitForSelector('.locationContainer')
        const elements = await page.$$('.locationContainer');
        // const checkOneOrTwo = document.querySelectorAll('.locationContainer')
        const elementCount = elements.length
        console.log("line no. 50 checkin true or false" ,elementCount > 1)
        if(elementCount > 1){
            await page.waitForSelector('.cubl_hospitalLocationResultMainIn');

        // Extract the hospital details from the table
        const hospitalDetails = await page.evaluate((externalCity) => {
            const rows = document.querySelectorAll('.cubl_hospitalLocationResultMainIn');
    
            return Array.from(rows, row => {
                // const columns = row.querySelectorAll('td[role="gridcell"]');
    
                // Leftbox data
                const hospitalNameLeft = row.querySelector(".addressBox.addressBoxLeft h3");
                const hospitalAddressLeft = row.querySelectorAll(".addressBox.addressBoxLeft .locationContainer strong")
                const hospitalContactLeft = row.querySelector(".addressBox.addressBoxLeft .locationContainer");
                // const hospitalAddress = row.querySelector("p")
    
                // Rightbox data
                const hospitalNameRight = row.querySelector(".addressBox.addressBoxRight h3");
                const hospitalAddressRight = row.querySelectorAll(".addressBox.addressBoxRight .locationContainer strong")
                const hospitalContactRight = row.querySelector(".addressBox.addressBoxRight .locationContainer");
                

            if(hospitalNameRight){
                return [
                    {
                        "HospitalName": hospitalNameLeft?.textContent?.trim(),
                        "Address": hospitalAddressLeft[0]?.textContent?.trim()+" "+hospitalAddressLeft[1]?.textContent?.trim(),
                        "City": externalCity?.optionCityName,
                        "State": externalCity?.state,
                        "Contact": hospitalContactLeft?.textContent?.trim()?.split(" ")?.pop(),
              
                    },
                    {
                        "HospitalName": hospitalNameRight?.textContent?.trim(),
                        "Address": hospitalAddressRight[0]?.textContent?.trim()+" "+hospitalAddressRight[1]?.textContent?.trim(),
                        "City": externalCity?.optionCityName,
                        "State": externalCity?.state,
                    //     // "Pincode": 
                    //     // "State": columns[3].textContent.trim().split(",").pop(),
                        "Contact": hospitalContactRight?.textContent?.trim()?.split(" ")?.pop(),
                    //     // "Mobile": columns[5].textContent.trim(),
                    }
                ];
            }
            });
        },city);
    
        return hospitalDetails;
        }else{
            await page.waitForSelector('.cubl_hospitalLocationResultMainIn');

            // Extract the hospital details from the table
            const hospitalDetails = await page.evaluate((externalCity) => {
                const rows = document.querySelectorAll('.cubl_hospitalLocationResultMainIn');
        
                return Array.from(rows, row => {
                    // const columns = row.querySelectorAll('td[role="gridcell"]');
        
                    // Leftbox data
                    const hospitalNameLeft = row.querySelector(".addressBox.addressBoxLeft h3");
                    const hospitalAddressLeft = row.querySelectorAll(".addressBox.addressBoxLeft .locationContainer strong")
                    const hospitalContactLeft = row.querySelector(".addressBox.addressBoxLeft .locationContainer");
                    // const hospitalAddress = row.querySelector("p")
        
                    // Rightbox data
                    // const hospitalNameRight = row.querySelector(".addressBox.addressBoxRight h3");
                    // const hospitalAddressRight = row.querySelectorAll(".addressBox.addressBoxRight .locationContainer strong")
                    // const hospitalContactRight = row.querySelector(".addressBox.addressBoxRight .locationContainer");
                    
        
        
                    return [
                        {
                            "HospitalName": hospitalNameLeft?.textContent?.trim(),
                            "Address": hospitalAddressLeft[0]?.textContent?.trim()+" "+hospitalAddressLeft[1]?.textContent?.trim(),
                            "City": externalCity?.optionCityName,
                            "State": externalCity?.state,
                            "Contact": hospitalContactLeft?.textContent?.trim()?.split(" ")?.pop(),
                        },
                    ];
                });
            },city);
        
            return hospitalDetails;
        }
    }else{
        return [null]
    }
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const result = [];
    try {
        // Navigate to the page
        await page.goto("https://www.careinsurance.com/health-plan-network-hospitals.html");

        // Wait for the first select element to be present on the page
        await page.waitForSelector('select[id="searchState"]');

        // Extract the values of all options within the first select element
        const stateOptions = await page.evaluate(() => {
            const selectElement = document.querySelector('select[id="searchState"]');
            const optionElements = selectElement.querySelectorAll('option');
            return Array.from(optionElements, option => {
                return {
                    optionValue: option.value,
                    optionName: option.innerHTML
                }
            });
        });



        console.log('State Options:', stateOptions);

        for (let i = 1; i < stateOptions.length; i++) { 
            const cityOptions = await selectStateAndGetCityOptions(page, stateOptions[i]);
            console.log(`City Options for State ${stateOptions[i].optionName}:`, cityOptions);

            for (let j = 1; j < cityOptions.length; j++) {
                const hospitalDetails = await selectCityAndGetHospitalDetails(page, cityOptions[j]);
                console.log(`Hospital Details for City ${cityOptions[j].optionCityName}:`, hospitalDetails);
                result.push(hospitalDetails);
                fs.writeFileSync("result.json", JSON.stringify(result));

            }
        }

    } catch (error) {
        console.error("Error navigating to the page:", error); 
    } finally {
        await browser.close();
        // console.log(result)
    }
})();