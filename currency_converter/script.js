const apikey = "fca_live_lOjGM9o2iBlBm2Mjk4CQS3oki33uHKIDWP6iiY7u";
const state = {
    openedDrawer: null, //who opened the drawer
    currencies: [],
    searchResults: [],
    "from-btn": "USD",
    "to-btn": "EUR",
    rates: {},
    fromValue: 1
};

// UI component
const ui = {
    controls: document.getElementById("controls"),
    drawer: document.getElementById("drawer"),
    dismissBtn: document.getElementById("dismiss-btn"),
    currencyList: document.getElementById("currency-list"),
    searchBox: document.getElementById("search"),
    toBtn: document.getElementById("to-btn"),
    fromBtn: document.getElementById("from-btn"),
    exchangeRateText: document.getElementById("exchange-rate-text"),
    toInput: document.getElementById("to-input"),
    fromInput: document.getElementById("from-input"),
    swapBtn: document.getElementById("swap-btn")
};

// event listeners
const setEventListener = () => {
    document.addEventListener("DOMContentLoaded", initApp);
    ui.controls.addEventListener("click", showDrawer);
    ui.dismissBtn.addEventListener("click", hideDrawer);
    ui.searchBox.addEventListener("input", searchCurrency);
    ui.currencyList.addEventListener("click", selectPair);
    ui.fromInput.addEventListener('change', convertCurrency);
    ui.swapBtn.addEventListener('click', swapPair);
};

//event handlers
const initApp = () => {
    fetchCurrencies();
    fetchExchangeRates();
    // fetchCurrencies2();
};

const showDrawer = (e) => {
    if (e.target.hasAttribute("select-currency-button")) {
        //track whether it is the to or from button that wanted currency selection box
        state.openedDrawer = e.target.id;
        drawer.toggleAttribute("toggled-visible");
        console.log(e);
        console.log(state);
    }
};

const hideDrawer = (e) => {
    clearSearchBox(); //clear searchbox every time the drawer is hidden
    state.openedDrawer = null;
    console.log(e);
    drawer.toggleAttribute("toggled-visible");
    console.log(state.openedDrawer);
};

const searchCurrency = () => {
    const keyword = ui.searchBox.value.trim().toLowerCase();
    console.log(keyword);
    state.searchResults = getSelectableCurrencies().filter((val) => {
        return (
            val["code"].toLowerCase().includes(keyword) ||
            val["name"].toLowerCase().includes(keyword) ||
            val["symbol"].toLowerCase().includes(keyword)
        );
    });

    displayCurrencies();
};

const selectPair = (e) => {
    //need to use event details to see which was pressed in CurrencyList. so we take e
    console.log(e.target); //this target could be h4, img, or p element, disabling pointer-events in css makes only li selectable

    if (e.target.hasAttribute("data-MalaiChaineCode")) {

        //to-btn or from-btn
        const drawerOpenerBtn = state.openedDrawer;
        console.dir(e.target);
        //set to-btn or from-btn attr of state object to the currency-code: (data-malaichainecode) value
        state[drawerOpenerBtn] = e.target['dataset']['malaichainecode']; //somehow camelcase turns to smallcase in dataset 
        // console.log(state)

        //load new exchange rates and update buttons
        loadExchangeRate();

        //close after selection:
        hideDrawer();
    }
};


const convertCurrency = () => {
    state.fromValue = parseFloat(ui.fromInput.value) || 1;
    loadExchangeRate();

}

const displayConvertedResult = () => {
    updateButtons();
    updateInputs();
    updateExchangeRate();

}


const swapPair = () => {
    [state["from-btn"], state["to-btn"]] = [state["to-btn"], state["from-btn"]];
    state.fromValue = parseFloat(ui.toInput.value) || 1;
    loadExchangeRate();
}
//utilities


const showLoading = () => {
    ui.controls.classList.add("skeleton");
    ui.exchangeRateText.classList.add("skeleton");
}


const hideLoading = () => {
    ui.controls.classList.remove("skeleton");
    ui.exchangeRateText.classList.remove("skeleton");
}

const loadExchangeRate = () => {
    const from = state["from-btn"];
    const rates = state["rates"];
    if (typeof (rates[from]) !== "undefined") {

        displayConvertedResult();
    }
    else {
        fetchExchangeRates();
    }
}

const updateButtons = () => {
    //update buttons:
    [ui.fromBtn, ui.toBtn].forEach(
        (btn) => {
            const code = state[btn.id];
            btn.textContent = code;

            //add currency chosen to the parent tag of button i.e. control... sidhai button mai garda ni hunthyo, but agadi parent tag bata button select garexa, so no risk of overwriting or specificity issues
            btn.parentNode.classList.add("currency-chosen");
            btn.style.setProperty("--image", `url(https://wise.com/public-resources/assets/flags/rectangle/${code.toLowerCase()}.png)`)
        }
    )
}

const updateInputs = () => {
    const to = state["to-btn"];
    const from = state["from-btn"];
    const rates = state["rates"];
    const fromValue = state["fromValue"]
    const convertedValue = (fromValue * rates[from]["data"][to]).toFixed(4);

    ui.toInput.value = convertedValue;
    ui.fromInput.value = fromValue;

}

const clearSearchBox = () => {
    ui.searchBox.value = ""; //this clears the searches, but the search result remains empty next time drawer is opened
    //so manually trigger an input event with input of "" to filter out none of the currencies, and get all currencies as searchResult
    ui.searchBox.dispatchEvent(new Event("input"));
};

const getSelectableCurrencies = () => {
    return state.currencies.filter((val) => {
        return state["from-btn"] !== val.code && state["to-btn"] !== val.code; //doesnt let a currency appear in search if it is already in from/to option
    });
};

const updateExchangeRate = () => {
    const to = state["to-btn"];
    console.log(to);
    const from = state["from-btn"];
    console.log(from);
    const rates = state["rates"];
    console.log(rates);
    const rate = rates[from]["data"][to].toFixed(4);

    ui.exchangeRateText.textContent = `1 ${from} = ${rate} ${to}`;
}

//display functions

function displayCurrencies() {
    // console.log(state.currencies)
    ui.currencyList.innerHTML = state.searchResults
        .map((val, index) => {
            // console.log(val.code)
            return `
            <li data-MalaiChaineCode="${val.code}">
          <img src="https://wise.com/public-resources/assets/flags/rectangle/${val.code.toLowerCase()}.png" alt="${val.name}">
          <div class="trailer">
            <h4>${val.code} (${val.symbol})</h4>
            <p>${val.name} </p>
          </div>
        </li>
            `;
        })
        .join(""); //join to avoid comma between each item
}

//api calls

const fetchCurrencies = async () => {
    let url = `https://api.freecurrencyapi.com/v1/currencies?apikey=${apikey}`;

    try {
        const response = await fetch(url);
        const responseJson = await response.json();
        console.log(responseJson);
        state.currencies = Object.values(responseJson["data"]); //data is a field (object) within a reponse object
        console.log(state.currencies);

        //initially, there is nothing filtered, so searchResult is all currencies
        state.searchResults = getSelectableCurrencies();
        displayCurrencies();
    } catch (error) {
        console.log(error);
    }
};

const fetchExchangeRates = () => {
    const from = state["from-btn"];
    showLoading();

    fetch(
        `https://api.freecurrencyapi.com/v1/latest?apikey=${apikey}&currencies=&base_currency=${from}`
    )
        .then((response) => response.json())
        .then(data => {
            state.rates[from] = data; //store data as state{rates{usd:{... ...}} }
            console.log(data);
            displayConvertedResult();
        })
        .catch(console.error)
        .finally(hideLoading)
}

//init

setEventListener();

