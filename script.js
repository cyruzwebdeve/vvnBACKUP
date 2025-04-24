// Returns the current date in Philippine timezone (UTC+8) formatted as 'YYYY-MM-DD'
function getPhilippineDateString() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const phTime = new Date(utc + (3600000 * 8)); // UTC+8
    return phTime.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Randomly selects a specified number of words from the dictionary
function getRandomFeaturedWords(count) {
    const shuffled = [...dictionary].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Saves featured words to local storage with the current PH date as key
function saveToLocalStorage(words) {
    const dateKey = getPhilippineDateString();
    localStorage.setItem("featuredWords", JSON.stringify({
        date: dateKey,
        words: words
    }));
}

// Loads featured words from local storage if the date matches today's PH date
function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem("featuredWords"));
    const dateKey = getPhilippineDateString();
    if (data && data.date === dateKey) {
        return data.words;
    }
    return null;
}

// Sets the featured words on the homepage cards; fetches from local storage or selects new
function setFeaturedWords() {
    let featured = loadFromLocalStorage();

    if (!featured) {
        featured = getRandomFeaturedWords(3);
        saveToLocalStorage(featured);
    }

    const cards = document.querySelectorAll('.card');

    cards.forEach((card, index) => {
        const titleEl = card.querySelector('.title');
        const subDefEl = card.querySelector('.sub-def');

        if (featured[index]) {
            const word = featured[index].title;
            const definition = featured[index].definition;

            // Make the title clickable to redirect to detail page
            titleEl.innerHTML = `<a href="detail.html?word=${encodeURIComponent(word)}">${word}</a>`;
            subDefEl.textContent = definition;
        }
    });

    console.log("Featured words set for PH date:", getPhilippineDateString());
}

// Automatically sets featured words when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', setFeaturedWords);

// Filters dictionary and displays suggestions based on user input in the search bar
function showSuggestions() {
    const query = document.getElementById("search-input").value.toLowerCase();
    const suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = '';

    if (query.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    const filteredWords = dictionary.filter(item => {
        const title = item.title ? item.title.toLowerCase() : '';
        return title.startsWith(query);
    });

    if (filteredWords.length > 0) {
        suggestionsContainer.style.display = 'block';
        filteredWords.forEach(item => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.textContent = item.title;
            suggestionItem.onclick = () => selectSuggestion(item.title);
            suggestionsContainer.appendChild(suggestionItem);
        });
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

// Redirects to the detail page when a suggestion is selected
function selectSuggestion(word) {
    document.getElementById("search-input").value = word;
    window.location.href = `detail.html?word=${encodeURIComponent(word)}`;
    document.getElementById("suggestions").style.display = "none";
}

// Retrieves a query parameter from the URL
function getQueryStringParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Opens a modal with a message (used for saving feedback)
function openSaveModal(message) {
    document.getElementById("saveModalMessage").textContent = message;
    document.getElementById("saveModal").style.display = "flex";
}

// Closes the save modal
function closeSaveModal() {
    document.getElementById("saveModal").style.display = "none";
}

// Saves a word to local storage and shows confirmation modal
function saveWord(title) {
    const savedWords = JSON.parse(localStorage.getItem("savedWords") || "[]");
    if (!savedWords.includes(title)) {
        savedWords.push(title);
        localStorage.setItem("savedWords", JSON.stringify(savedWords));
        openSaveModal(`"${title}" has been saved!`);
    } else {
        openSaveModal(`"${title}" is already saved.`);
    }
}

// Displays details of a specific word on the detail page
function displayWordDetails(word) {
    if (!word || typeof word !== 'string') {
        console.warn("Invalid word provided to displayWordDetails:", word);
        document.getElementById("card-container").innerHTML = "<p>No details found for this word.</p>";
        return;
    }

    const wordDetails = dictionary.find(item =>
        item.title && item.title.toLowerCase() === word.toLowerCase()
    );

    const cardContainer = document.getElementById("card-container");

    if (wordDetails) {
        cardContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>${wordDetails.title}</h3>
                    <button class="save" onclick="saveWord('${wordDetails.title}')">Save</button>
                </div>
                <p class="pronunciation">Pronunciation: ${wordDetails.pronunciation}</p>
                <hr>
                <h1>DEFINITION</h1> 
                <p>${wordDetails.definition}</p>
            </div>
        `;
    } else {
        cardContainer.innerHTML = "<p>No details found for this word.</p>";
    }
}

// Checks if a word is passed in URL, if yes display details
const wordFromUrl = getQueryStringParameter("word");
if (wordFromUrl) {
    displayWordDetails(wordFromUrl);
} else {
    document.getElementById("card-container").innerHTML = "<p>No word selected.</p>";
}

// Allows sharing of the word via Web Share API or fallback to clipboard
function shareWord(title) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?word=${encodeURIComponent(title)}`;

    if (navigator.share) {
        navigator.share({
            title: `Dictionary Word: ${title}`,
            text: `Check out this medical word: ${title}`,
            url: shareUrl
        }).catch((err) => {
            console.error("Sharing failed:", err);
        });
    } else {
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                openSaveModal(`Link copied to clipboard!`);
            })
            .catch(() => {
                openSaveModal(`Couldn't share or copy link.`);
            });
    }
}

// Toggles sidebar visibility for responsive layouts
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mask = document.getElementById('sidebar-mask');
    const isActive = sidebar.classList.contains('active');

    if (isActive) {
        sidebar.classList.remove('active');
        mask.style.opacity = '0';
        mask.style.visibility = 'hidden';
    } else {
        sidebar.classList.add('active');
        mask.style.opacity = '1';
        mask.style.visibility = 'visible';
    }
}

// Dynamically creates list items from dictionary entries and adds toggle on click
const list = document.getElementById("dictionaryList");

dictionary.forEach(entry => {
    const li = document.createElement("li");

    li.innerHTML = `
<div class="title">${entry.title}</div>
<div class="details">
  <p><strong>Pronunciation:</strong> ${entry.pronunciation}</p>
  <p><strong>Definition:</strong> ${entry.definition}</p>
</div>
`;

    li.addEventListener("click", () => {
        const details = li.querySelector(".details");
        details.style.display = details.style.display === "none" || details.style.display === "" ? "block" : "none";
    });

    list.appendChild(li);
});

// Navigates back to previous page or fallback to dictionary page if no history exists
function goBack() {
    if (history.length > 1) {
        history.back();
    } else {
        window.location.href = "dictionary.html";
    }
}