const puppeteer = require("puppeteer");
const fs = require("fs");

async function selectStateAndGetCityOptions(page, state) {
  await page.waitForTimeout(500);
  // Click on the state option
  await page.select('select[id="searchState"]', state.optionValue);

  // Add a delay
  await page.waitForTimeout(8000); // Adjust the delay as needed

  // Wait for the city select element to be ready
  await page.waitForSelector('select[name="city"]');

  // Extract the values of all options within the updated city select element
  const cityOptions = await page.evaluate((externalState) => {
    const citySelect = document.querySelector('select[name="city"]');
    const optionElements = citySelect.querySelectorAll("option");
    return Array.from(optionElements, (option) => {
      return {
        optionCityValue: option.value,
        optionCityName: option.textContent.trim(),
        state: externalState.optionName,
      };
    });
  }, state);

  return cityOptions;
}

// Example usage:
// const pincodeString = "Chetan Parsa\nMaker Road\nPincode :\n841219\nPhone :\n9931984386";
// const result = extractAndStorePincode(pincodeString);

async function selectCityAndGetHospitalDetails(page, city) {
  // Wait for the table to be updated
  const element = page.$(".cubl_hospitalLocationResultMainIn");

  if (element !== null) {
    await page.waitForTimeout(1000);
    await page.waitForSelector(".locationContainer");
    const elements = await page.$$(".locationContainer");
    // const checkOneOrTwo = document.querySelectorAll('.locationContainer')
    const elementCount = elements.length;
    console.log("line no. 50 checkin true or false", elementCount > 1);
    let hospitalDetails;
    if (elementCount > 1) {
      await page.waitForSelector(".cubl_hospitalLocationResultMainIn");

      // Extract the hospital details from the table
      hospitalDetails = await page.evaluate((externalCity) => {
        const rows = document.querySelectorAll(
          ".cubl_hospitalLocationResultMainIn"
        );

        return Array.from(rows, (row) => {
          // const columns = row.querySelectorAll('td[role="gridcell"]');

          // Leftbox data
          const hospitalNameLeft = row.querySelector(
            ".addressBox.addressBoxLeft h3"
          );
          const hospitalAddressLeft = row.querySelectorAll(
            ".addressBox.addressBoxLeft .locationContainer strong"
          );
          const hospitalContactLeft = row.querySelector(
            ".addressBox.addressBoxLeft .locationContainer"
          );
          // const hospitalAddress = row.querySelector("p")

          // Rightbox data
          const hospitalNameRight = row.querySelector(
            ".addressBox.addressBoxRight h3"
          );
          const hospitalAddressRight = row.querySelectorAll(
            ".addressBox.addressBoxRight .locationContainer strong"
          );
          const hospitalContactRight = row.querySelector(
            ".addressBox.addressBoxRight .locationContainer"
          );

          if (hospitalNameRight) {
            function extractAndStorePincode(pincodeString) {
              const pincodeMatch = pincodeString.match(/Pincode\s*:\s*(\d{6})/);

              if (pincodeMatch) {
                const pincode = pincodeMatch[1];
                return pincode;
              } else {
                console.log("No PIN code found in the string or not 6 digits.");
                return null;
              }
            }
            return [
              {
                HospitalName: hospitalNameLeft?.textContent?.trim(),
                Address:
                  hospitalAddressLeft[0]?.textContent?.trim() +
                  " " +
                  hospitalAddressLeft[1]?.textContent?.trim(),
                City: externalCity?.optionCityName,
                State: externalCity?.state,
                PinCode: extractAndStorePincode(
                  hospitalContactLeft?.textContent?.trim()
                ),
                Contact: hospitalContactLeft?.textContent
                  ?.trim()
                  ?.split(" ")
                  ?.pop(),
              },
              {
                HospitalName: hospitalNameRight?.textContent?.trim(),
                Address:
                  hospitalAddressRight[0]?.textContent?.trim() +
                  " " +
                  hospitalAddressRight[1]?.textContent?.trim(),
                City: externalCity?.optionCityName,
                State: externalCity?.state,
                PinCode: extractAndStorePincode(
                  hospitalContactRight?.textContent?.trim()
                ),
                Contact: hospitalContactRight?.textContent
                  ?.trim()
                  ?.split(" ")
                  ?.pop(),
              },
            ];
          }
        });
      }, city);
    } else {
      await page.waitForSelector(".cubl_hospitalLocationResultMainIn");

      // Extract the hospital details from the table
      hospitalDetails = await page.evaluate((externalCity) => {
        const rows = document.querySelectorAll(
          ".cubl_hospitalLocationResultMainIn"
        );

        return Array.from(rows, (row) => {
          // const columns = row.querySelectorAll('td[role="gridcell"]');

          // Leftbox data
          const hospitalNameLeft = row.querySelector(
            ".addressBox.addressBoxLeft h3"
          );
          const hospitalAddressLeft = row.querySelectorAll(
            ".addressBox.addressBoxLeft .locationContainer strong"
          );
          const hospitalContactLeft = row.querySelector(
            ".addressBox.addressBoxLeft .locationContainer"
          );
          // const hospitalAddress = row.querySelector("p")

          // Rightbox data
          // const hospitalNameRight = row.querySelector(".addressBox.addressBoxRight h3");
          // const hospitalAddressRight = row.querySelectorAll(".addressBox.addressBoxRight .locationContainer strong")
          // const hospitalContactRight = row.querySelector(".addressBox.addressBoxRight .locationContainer");
          function extractAndStorePincode(pincodeString) {
            const pincodeMatch = pincodeString.match(/Pincode\s*:\s*(\d{6})/);

            if (pincodeMatch) {
              const pincode = pincodeMatch[1];
              return pincode;
            } else {
              console.log("No PIN code found in the string or not 6 digits.");
              return null;
            }
          }
          return [
            {
              HospitalName: hospitalNameLeft?.textContent?.trim(),
              Address:
                hospitalAddressLeft[0]?.textContent?.trim() +
                " " +
                hospitalAddressLeft[1]?.textContent?.trim(),
              City: externalCity?.optionCityName,
              State: externalCity?.state,
              PinCode: extractAndStorePincode(
                hospitalContactLeft?.textContent?.trim()
              ),
              Contact: hospitalContactLeft?.textContent
                ?.trim()
                ?.split(" ")
                ?.pop(),
            },
          ];
        });
      }, city);
    }
    return hospitalDetails;
  } else {
    return [null];
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const result = [];
  try {
    // Navigate to the page
    await page.goto(
      "https://www.careinsurance.com/health-plan-network-hospitals.html?state=12&button=Submit"
    );

    // Wait for the first select element to be present on the page
    await page.waitForSelector('select[id="searchState"]');

    // Extract the values of all options within the first select element
    const stateOptions = await page.evaluate(() => {
      const selectElement = document.querySelector('select[id="searchState"]');
      const optionElements = selectElement.querySelectorAll("option");
      return Array.from(optionElements, (option) => {
        return {
          optionValue: option.value,
          optionName: option.innerHTML,
        };
      });
    });

    // console.log("State Options:", stateOptions);

    // for (let i = 2; i < stateOptions.length; i++) {
    for (let i = 1; i < stateOptions.length; i++) {
      const cityOptions = await selectStateAndGetCityOptions(
        page,
        stateOptions[i]
      );

      //   console.log(`City Options for State ${stateOptions[i].optionName}:`, cityOptions);

      // for (let j = 1; j < cityOptions.length; j++) {
      // console.log({cityOptions})

      for (let j = 1; j < cityOptions.length; j++) {
        console.log("cityOptions[j]", i, j, cityOptions[j]);
        //! basic selection
        // Click on the city option
        await page.select('select[id="city"]', cityOptions[j].optionCityValue);

        // Add a delay
        await page.waitForTimeout(500); // Adjust the delay as needed

        await page.waitForSelector('input[class="greenSrchBtn_network"]');

        await page.click('input[class="greenSrchBtn_network"]');

        await page.waitForTimeout(500);

        await page.waitForSelector(".cubl_hospitalLocationResultMainIn");
        //! basic selection

        // Get the element with class 'fr'
        const pagesElement = await page.$(".fr");

        if (pagesElement) {
          // Get the inner text of the element and split it by spaces
          const pagesText = await pagesElement.evaluate(
            (element) => element.innerText
          );
          const pagesArray = pagesText.split(" ");

          // Get the second-to-last element of the array
          let pages = pagesArray[pagesArray.length - 2];
          pages = pages === "of" ? 1 : pages;
          console.log("Number of pages:", pages);
          let pageRes = [];
          for (let pg_idx = 0; pg_idx < pages; pg_idx++) {
            console.log("pgs", pg_idx);

            let hospitalDetails = await selectCityAndGetHospitalDetails(
              page,
              cityOptions[j]
            );
            console.log(
              `Hospital Details for City ${cityOptions[j].optionCityName}:`,
              hospitalDetails.length
            );
            pageRes.push(hospitalDetails);
            result.push(pageRes);
            console.log("line no. 191", result);
            fs.writeFileSync("careHealth.json", JSON.stringify(result));
            //! basic selection

            //!click next Page
            //process next page
            const next_link = await page.$(
              `a[href="health-plan-network-hospitals.html?state=13&city=${
                cityOptions[j].optionCityValue
              }&search_word=&page=${pg_idx + 2}"][rel="next"]`
            );
            // Click on the next_link
            await page.waitForTimeout(1000);
            if (next_link) {
              await next_link.click();

              await page.waitForNavigation();

              // You can perform further actions after the navigation is complete
              // For example, you can extract information or perform other interactions
            } else {
              console.log("next_link not found");
            }
            //!click next Page
          }
        } else {
          console.log('Element with class "fr" not found');
        }
      }
    }
  } catch (error) {
    console.error("Error navigating to the page:", error);
  } finally {
    // await browser.close();
    // console.log(result)
  }
})();
