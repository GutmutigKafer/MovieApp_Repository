import {
  allComments,
  addCommentToStorage,
  allRatings,
  addRatingToStorage,
  saveRatings,
  removeDublicates,
} from "./comments.js";
//* FETCH MOVIES DATA
let movies = null;
async function fetchMoviesData() {
  try {
    const result = await fetch(
      "https://raw.githubusercontent.com/GutmutigKafer/gutmutigkafer.github.io/refs/heads/main/movieapp-data/movies-list.json"
    );
    const resultJSON = await result.json();
    movies = resultJSON;
    initializeMoviesFunctions();
    return movies;
  } catch (error) {
    console.error("Error loading movies:", error);
    return error;
  }
}

const initializeMoviesFunctions = () => {
  generateGenreFilters();
  renderMovieList();
  displayMoviesGrid();
  searchFunction();
};

fetchMoviesData();

const isMobileScreen = () => window.matchMedia("(max-width: 1024px)").matches;

//* SWITCH VIEW FUNCTION
let currentView = "grid";
const gridButton = document.getElementById("grid-button");
const listButton = document.getElementById("list-button");
const cardContainer = document.getElementById("card-container");
const listContainer = document.getElementById("list-container");

const showView = (newView) => {
  // Update current view state
  currentView = newView;

  // Switch to Grid View
  if (newView === "grid") {
    cardContainer.classList.add("show");
    listContainer.classList.remove("show");
    showCursor();
  }
  // Switch to List View
  else if (newView === "list") {
    listContainer.classList.add("show");
    cardContainer.classList.remove("show");
    generateGenreFilters();
    renderMovieList();
  }
};

// Event listeners to switch between views
gridButton.addEventListener("click", () => showView("grid"));
listButton.addEventListener("click", () => showView("list"));

//Start page with the grid view
cardContainer.classList.add("show");

// Custom Cursor Sign for Grid View
const customCursor = document.createElement("div");
customCursor.id = "custom-cursor";

const cursorImg = document.createElement("img");
cursorImg.src = "https://img.icons8.com/badges/100/FFFFFF/move.png";

document.body.appendChild(customCursor);
customCursor.appendChild(cursorImg);

const showCursor = () => {
  customCursor.classList.remove("fade-out");
  customCursor.style.display = "block";

  // Add Fade In
  setTimeout(() => customCursor.classList.add("fade-in"), 500);

  // Fade out after 3 seconds
  setTimeout(() => {
    customCursor.classList.remove("fade-in");
    customCursor.classList.add("fade-out");

    // Hide after Fade Out
    setTimeout(() => (customCursor.style.display = "none"), 500);
  }, 2500);
};
showCursor();

//* GENRE FILTERS
const selectedGenres = new Set();
//!INITIALIZED IN FETCH
const generateGenreFilters = () => {
  const genreContainer = document.getElementById("genre-filters");
  // Get unique genres from movie list
  const uniqueGenres = Array.from(
    new Set(movies.flatMap((movie) => movie.genres))
  );

  // Create genre filter elements
  genreContainer.innerHTML = uniqueGenres
    .map(
      (genre) => `
        <div class="genre-filter" data-genre="${genre}">${genre}</div>`
    )
    .join("");

  // Add click event listeners to genre filters
  const genreFilters = document.querySelectorAll(".genre-filter");
  genreFilters.forEach((filterElement) => {
    filterElement.addEventListener("click", () => {
      const genre = filterElement.dataset.genre;
      toggleGenreFilter(genre);
    });
  });
};

const toggleGenreFilter = (genre) => {
  const genreElement = document.querySelector(`[data-genre="${genre}"]`);
  if (genreElement) {
    // Toggle active class on genre element
    genreElement.classList.toggle("active");
    // Add or remove genre from selected genres
    if (selectedGenres.has(genre)) {
      selectedGenres.delete(genre);
    } else {
      selectedGenres.add(genre);
    }
    // Update movie list based on selected genres
    renderMovieList();
  }
};

const filterSection = document.querySelector(".filter-section");
const filterToggle = document.querySelector(".filter-toggle");

if (isMobileScreen()) {
  filterSection.style.overflow = "hidden"; // Contain the scroll
  const genreFilters = document.getElementById("genre-filters");
  genreFilters.style.overflowY = "auto";
  genreFilters.style.height = "100%";

  filterToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    filterSection.classList.toggle("active");
  });

  document.addEventListener("click", (event) => {
    if (!filterSection.contains(event.target)) {
      filterSection.classList.remove("active");
    }
  });
}

//* MOVIE LIST
//!INITIALIZED IN FETCH
const renderMovieList = () => {
  const movieListContainer = document.getElementById("movie-list-items");

  const filteredMovies = movies.filter((movie) => {
    // Check if movie genres match selected genres
    const matchesGenres =
      selectedGenres.size === 0 ||
      [...selectedGenres].every((genre) => movie.genres.includes(genre));
    return matchesGenres;
  });
  // Create HTML for filtered movies
  movieListContainer.innerHTML = filteredMovies
    .map(
      (movie) => `
        <div class="movie-item" data-movie-id="${movie.id}">
      <img src="${movie.poster_url}" alt="${movie.title}">
      <div>
        <h2>${movie.title}</h2>
        <p class="movie-year">${movie.movieYear}</p>
        <div class="genre-list">
          ${movie.genres
            .map(
              (genre) => `
            <span class="genre-tag">${genre}</span>
          `
            )
            .join("")}
        </div>
        <p>${movie.description}</p>
      </div>
    </div>`
    )
    .join("");

  document.querySelectorAll(".movie-item").forEach((movieItem) => {
    movieItem.addEventListener("click", (event) => {
      const movieId = movieItem.dataset.movieId;

      const numericMovieId = Number(movieId);
      const thisMovie = movies.find((movie) => movie.id === numericMovieId);

      if (isGameActive) {
        timerGameFunction(event, thisMovie);
      } else {
        toggleDetails(thisMovie);
      }
    });
  });
};

// Prevent closing the Timer Game right after it ends
let bufferPeriodActive = false;
//* MOVIES GRID
//!INITIALIZED IN FETCH
const displayMoviesGrid = () => {
  const cardContainer = document.getElementById("card-container");

  // Get min X and Y values
  const minX = Math.min(...movies.map((movie) => movie.coordinates.x));
  const minY = Math.min(...movies.map((movie) => movie.coordinates.y));

  // Create movie cards
  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h2>${movie.title}</h2>
            <p>${movie.description}</p>
            <img src="${movie.poster_url}" alt="${movie.title}">`;

    // Calculating card position on the Grid
    const gridColumn = movie.coordinates.x - minX + 1;
    const gridRow = movie.coordinates.y - minY + 1;

    //Assigning calculated values to the CSS Grid
    card.style.gridColumn = gridColumn;
    card.style.gridRow = gridRow;

    card.addEventListener("click", (event) => {
      if (isGameActive) {
        timerGameFunction(event, movie);
      } else {
        toggleDetails(movie);
      }
    });

    cardContainer.appendChild(card);
  });

  // Center the grid after rendering
  const centerX = (cardContainer.scrollWidth - cardContainer.clientWidth) / 2;
  const centerY = (cardContainer.scrollHeight - cardContainer.clientHeight) / 2;
  cardContainer.scrollTo(centerX, centerY);
};

// Grouped all the Details functions under movieDetailsPanel()
const movieDetails = document.getElementById("movie-details");

/* Sliding window */
const toggleDetails = (movie) => {
  const currentMovieTitle =
    document.getElementById("details-title").textContent;
  const isSameMovie = currentMovieTitle === movie.title;

  if (movieDetails.classList.contains("show")) {
    isSameMovie ? closeDetails() : openDetails(movie, movie.id);
  } else {
    openDetails(movie, movie.id);
  }
};
let currentMovie = null;
/* Open sliding window */
const openDetails = (movie, currentMovieId) => {
  currentMovie = movie;
  // Show the movie details container
  movieDetails.classList.add("show");

  // Reset the scroll position to the top
  movieDetails.scrollTop = 0;
  // Set the movie title
  document.getElementById("details-title").textContent = movie.title;
  // Set the movie year
  document.getElementById("details-year").textContent = `${movie.movieYear}`;
  const detailsGenre = document.getElementById("details-genre");
  const detailsDirector = document.getElementById("details-director");
  const detailsCast = document.getElementById("details-cast");
  const detailsDescription = document.getElementById("details-description");
  const detailsPoster = document.getElementById("details-poster");
  detailsGenre.innerHTML = `<span class="bold">Genre:</span> ${movie.genres.join(
    ", "
  )}`;
  detailsDirector.innerHTML = `<span class="bold">Director:</span> ${movie.director}`;
  detailsCast.innerHTML = `<span class="bold">Cast:</span> ${movie.actors?.join(
    ", "
  )}`;

  detailsDescription.textContent = movie.description;

  detailsPoster.src = movie.poster_url;

  commentForm.addEventListener("submit", (event) => {
    updateComments(event);
  });

  // Display comments for the current movie ID
  displayComments(currentMovieId);
  displayRating(currentMovieId);
};

/* Close the details window */
const closeDetails = () => {
  movieDetails.classList.remove("show");
  removeDublicates();
  saveRatings();
};
/* Close details when clicking outside the movie details panel */
document.addEventListener("click", (event) => {
  const clickedInsideDetails = movieDetails.contains(event.target);
  const clickedOnCard = event.target.closest(".card");

  if (!clickedInsideDetails && !clickedOnCard) {
    closeDetails();
  }
});
window.closeDetails = closeDetails;

//* COMMENTS SECTION
// Check if comments section already exists, if not create a new one
let commentsSection = document.getElementById("comments-section");
if (!commentsSection) {
  commentsSection = document.createElement("div");
  commentsSection.id = "comments-section";
  movieDetails.append(commentsSection);
}
// Define the HTML structure for the comments section
commentsSection.innerHTML = ` <h3 id="comments-title">Leave a comment!</h3>
        <form class="comment-form">
      <input type="text" placeholder="Your name" required>
      <textarea placeholder="Your comment" required></textarea>
      <button type="submit">Post Comment</button>
    </form>
    <div class="comment-display" id="comment-display"></div>`;

// Get references to the comment form, input fields, and comment display elements
const commentForm = commentsSection.querySelector(".comment-form");
const nameInput = commentForm.querySelector('input[type="text"]');
const commentInput = commentForm.querySelector("textarea");
const commentDisplay = commentsSection.querySelector("#comment-display");

// Function to display comments for a given movie ID
const displayComments = (currentMovieId) => {
  // Filter comments by movie ID and create HTML structure for comments
  const comments = allComments.filter(
    (comment) => comment.movieId === currentMovieId
  );
  const commentHTML = comments
    .map(
      (comment) => `
             <div class="comment">
               <h4>${comment.userName}</h4>
               <p>${comment.commentText}</p>
               <p>${comment.date}</p>
             </div>
           `
    )
    .join("");
  // Update the comment display element with the generated HTML
  commentDisplay.innerHTML = commentHTML;
};

// Function to add a new comment
const updateComments = (event) => {
  event.preventDefault();
  // Get the user's name and comment from the input fields
  const name = nameInput.value.trim();
  const comment = commentInput.value.trim();
  if (name && comment) {
    // Add the comment to storage
    addCommentToStorage(currentMovie.id, currentMovie.title, name, comment);
    nameInput.value = "";
    commentInput.value = "";
    // Update the comment display with the new comment
    displayComments(currentMovie.id);
  }
};
movieDetails.append(commentsSection);

//* RATING FUNCTIONS

const stars = document.querySelectorAll(".star"); //Get all the star elements
let selectedRating = 0; // Keeps track of the selected rating

const displayRating = (currentMovieId) => {
  const starRating = allRatings.find(
    (rating) => rating.movieId === currentMovieId
  );
  if (starRating) {
    selectedRating = starRating.rating;
    updateStarHighlight(starRating.rating);
  } else {
    selectedRating = 0;
    updateStarHighlight(0);
  }
};

// Loops through each star to update its appearance based on the selected rating
const updateStarHighlight = (rating) => {
  stars.forEach((star) =>
    star.classList.toggle("active", star.dataset.value <= rating)
  );
};

stars.forEach((star) => {
  star.addEventListener("click", (event) => {
    const rating = event.currentTarget.dataset.value;
    selectedRating = rating;
    updateStarHighlight(rating);
    updateRatingInStorage(currentMovie.id, rating);
  });
});

const updateRatingInStorage = (movieId, rating) => {
  const existingRating = allRatings.find(
    (rating) => rating.movieId === movieId
  );
  if (existingRating) {
    existingRating.rating = rating;
  } else {
    addRatingToStorage(movieId, rating);
  }
  saveRatings();
};

//*SEARCH FUNCTIONS
const searchDiv = document.querySelector(".search");
const searchInput = document.querySelector(".search .searchText");
let searchResults = [];
const searchDropdown = document.getElementById("search-dropdown");

//!INITIALIZED IN FETCH
const searchFunction = () => {
  searchResults = [];
  const searchText = searchInput.value.trim().toLowerCase();

  // Hide the dropdown if the input is empty
  if (!searchText) {
    searchDropdown.style.display = "none";
    return;
  }
  // Filter movies
  searchResults = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchText)
  );

  searchDropdown.innerHTML = "";

  // Create an HTML structure for displaying the results.
  searchResults.forEach((result) => {
    const resultItem = document.createElement("div");
    resultItem.classList.add("resultItem");

    // Create movie poster image
    const resultPoster = document.createElement("img");
    resultPoster.classList.add("resultPoster");
    resultPoster.src = result.poster_url;
    resultItem.appendChild(resultPoster);

    // Create movie title
    const resultTitle = document.createElement("span");
    resultTitle.classList.add("resultTitle");
    resultTitle.textContent = result.title;
    resultItem.appendChild(resultTitle);

    // Create release year
    const resultYear = document.createElement("span");
    resultYear.classList.add("resultYear");
    resultYear.textContent = result.movieYear;
    resultItem.appendChild(resultYear);

    // Go to the result
    resultItem.addEventListener("click", () => goToMovie(result));
    searchDropdown.appendChild(resultItem);
  });
  toggleSearchDropdown();
};

const toggleSearchDropdown = () => {
  const hasResults = searchResults.length > 0;
  const hasText = searchInput.value.trim() !== "";
  //Show dropdown if there are both input and results
  searchDropdown.style.display = hasResults && hasText ? "block" : "none";
};

//Show results when typing
let timeoutResults = null;
searchInput.addEventListener("input", () => {
  clearTimeout(timeoutResults);
  timeoutResults = setTimeout(searchFunction, 200);
});

//Show results when clicking
searchInput.addEventListener("click", (event) => {
  event.stopPropagation();
  if (searchInput.value.trim()) {
    searchFunction();
    toggleSearchDropdown();
  }
});

//Hide results when clicking outside
document.addEventListener("click", (event) => {
  if (!searchDiv.contains(event.target)) {
    searchDropdown.style.display = "none";
  }
});

// Close the dropdown when clicking on a result
searchDropdown.addEventListener("click", (event) => {
  if (searchDropdown.contains(event.target)) {
    searchDropdown.style.display = "none";
  }
});

// Highlight the selected card
const highlightCard = (selectedCard) => {
  document.querySelectorAll(".highlighted").forEach((card) => {
    card.classList.remove("highlighted");
  });

  setTimeout(() => {
    if (selectedCard) {
      selectedCard.classList.add("highlighted");
      setTimeout(() => selectedCard.classList.remove("highlighted"), 1000);
    }
  }, 200);
};

//* TIMER ON PAGE SECTION
let isGameActive = false;
let selectedMovies = [];
let formatedTimeOnPage = "00:00";
// On Page Timer
let onPageTimer = document.createElement("div");
onPageTimer.id = "on-page-timer";
onPageTimer.innerHTML = `
    <h3>Time on page</h3>
        <h2>${formatedTimeOnPage}</h2>`;

let timerOnPageCount = 0;

// Set interval for timer
const timerOnPage = () =>
  setInterval(() => {
    timerOnPageCount++;
    // Calculate seconds and minutes
    const seconds = timerOnPageCount % 60;
    const minutes = Math.floor(timerOnPageCount / 60);

    // Update formated time
    formatedTimeOnPage = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // Update the on page timer
    onPageTimer.innerHTML = `
      <h3>Time on page</h3>
      <h2>${formatedTimeOnPage}</h2>
      `;
  }, 1000);

// Start  on the page timer
document.addEventListener("DOMContentLoaded", timerOnPage);

// Create timer dropdown menu and add event listeners to the timer button
const timerButton = document.getElementById("timer-button");
const menuBar = document.querySelector(".menu");

const timerDropdown = document.createElement("div");
timerDropdown.id = "timer-dropdown";
menuBar.appendChild(timerDropdown);

timerButton.addEventListener("click", () => {
  // Toggle the display of the timer dropdown menu
  timerDropdown.style.display =
    timerDropdown.style.display === "none" || timerDropdown.style.display === ""
      ? "block"
      : "none";
});

// Create interface for the timer dropdown
const timerInterface = document.createElement("div");
timerInterface.id = "timer-interface";
timerDropdown.appendChild(timerInterface);

timerInterface.appendChild(onPageTimer);

// Create the quick choice game button
const buttonGameTimer = document.createElement("div");
buttonGameTimer.id = "button-game-timer";
buttonGameTimer.innerHTML = `
    <h3>Start quick choice game</h3>
    <button id="start-game-btn">5 seconds</button>`;
timerInterface.appendChild(buttonGameTimer);

// Add event listener to the start game button
document.getElementById("start-game-btn").addEventListener("click", () => {
  if (!isGameActive) {
    startGameTimer(5);
  }
});

// Create the game timer section
const gameTimerSection = document.createElement("div");
gameTimerSection.id = "game-timer-section";
gameTimerSection.innerHTML = `
    <div id="game-timer-bar">
    <div id="timer-progress"></div>
    </div>
    <div id="selected-movies-list"></div>
    <div id="final-result"></div>`;
timerDropdown.appendChild(gameTimerSection);

// Update the list of selected movies
const updateSelectedMoviesList = () => {
  const selectedMoviesList = document.getElementById("selected-movies-list");
  selectedMoviesList.innerHTML = selectedMovies
    .map(
      (movie) => `
        <div class="selected-movie-item">
           <img src="${movie.poster_url}" alt="${movie.title}">
            <span>${movie.title}</span>
            <span>${movie.ratingIMDB}</span>
        </div>
        `
    )
    .join("");
};

//* TIMER GAME SECTION
const timerGameFunction = (event, movie) => {
  //TimerGame selection logic
  if (!selectedMovies.some((thisMovie) => thisMovie?.id === movie.id)) {
    selectedMovies.push(movie);
    updateSelectedMoviesList();
  }
  // Handle dropdown visibility based on view
  if (currentView === "grid") {
    const isTimerDropdownClicked = event.target.closest(".timer-dropdown");
    if (!isTimerDropdownClicked && !bufferPeriodActive && !isGameActive) {
      timerDropdown.style.display = "none";
    }
  }
  if (isMobileScreen() && isGameActive) {
    timerDropdown.classList.add("hidden");
  }

  // Prevent details opening in both views
  event.stopPropagation();
  event.preventDefault();
};

// Start Game Timer

const startGameTimer = (seconds) => {
  isGameActive = true;

  if (isMobileScreen()) {
    timerDropdown.classList.add("hidden");
  }
  closeDetails();
  selectedMovies = [];
  document.getElementById("timer-progress").style.width = "100%";
  document.getElementById("selected-movies-list").innerHTML = "";

  let remainingSeconds = seconds;
  const countdownInterval = setInterval(() => {
    // Reduce the remaining seconds by 0.1 each time
    remainingSeconds = Math.round((remainingSeconds - 0.1) * 10) / 10;
    // Update the progress bar
    document.getElementById("timer-progress").style.width = `${
      (remainingSeconds / seconds) * 100
    }%`;

    // End the game
    if (remainingSeconds <= 0) {
      document.getElementById("timer-progress").style.width = "0%";
      clearInterval(countdownInterval);
      endGame();
    }
  }, 100);
};
// End Game Timer
const endGame = () => {
  isGameActive = false;

  if (isMobileScreen()) {
    timerDropdown.classList.remove("hidden");
  }

  // Run a buffer period, so the dropdown doesn't axidently close on click
  bufferPeriodActive = true;
  setTimeout(() => (bufferPeriodActive = false), 3000);

  // Clear previous game results
  const resultContainer = document.getElementById("final-result");
  resultContainer.innerHTML = "";

  if (selectedMovies.length === 0) {
    resultContainer.innerHTML = "<p>No movies selected!</p>";
    return;
  }

  // If there are movies selected, display a random one

  const randomNum = Math.floor(Math.random() * selectedMovies.length);
  const randomMovie = selectedMovies[randomNum];

  // Add the title for the selected random movie
  const resultTitle = document.createElement("h3");
  resultTitle.innerHTML = "Movie for tonight";
  resultContainer.appendChild(resultTitle);

  // Create a container for the random movie result
  const movieResultContainer = document.createElement("div");
  movieResultContainer.classList.add("selected-movie-item");
  movieResultContainer.id = "timer-result";
  movieResultContainer.innerHTML = `
        <img src="${randomMovie.poster_url}" alt="${randomMovie.title}">
         <span>${randomMovie.title}</span>
         <span>${randomMovie.ratingIMDB}</span>
         </div>
        `;
  resultContainer.appendChild(movieResultContainer);

  // Add click event to navigate to the selected movie
  movieResultContainer.addEventListener("click", () => {
    goToMovie(randomMovie);
  });
};

const goToMovie = (result) => {
  const container =
    currentView === "grid"
      ? document.getElementById("card-container")
      : document.getElementById("movie-list-items");

  if (isMobileScreen()) {
    timerDropdown.classList.add("hidden");
  }

  const selectedCard = [...container.children].find(
    (card) =>
      card.querySelector("h2").textContent.trim() === result.title.trim()
  );

  if (selectedCard) {
    // Highlight the card
    highlightCard(selectedCard);

    if (currentView === "grid") {
      // Get the parameters of the cards and the container
      const cardWidth = selectedCard.offsetWidth;
      const cardHeight = selectedCard.offsetHeight;
      const columnGap = parseFloat(getComputedStyle(container).columnGap);
      const rowGap = parseFloat(getComputedStyle(container).rowGap);

      //Grid dimentions
      const minX = Math.min(...movies.map((movie) => movie.coordinates.x));
      const minY = Math.min(...movies.map((movie) => movie.coordinates.y));

      const gridColumn = result.coordinates.x - minX + 1;
      const gridRow = result.coordinates.y - minY + 1;

      // Calculate the x and y coordinates of the card in the window
      const cardX = (gridColumn - 1) * (cardWidth + columnGap);
      const cardY = (gridRow - 1) * (cardHeight + rowGap);

      const centerX = cardX + cardWidth / 2 - window.innerWidth / 2;
      const centerY = cardY + cardHeight / 2 - window.innerHeight / 2;

      // Scroll to the card
      container.scrollTo({
        left: centerX,
        top: centerY,
        behavior: "smooth",
      });
    } else {
      const containerRect = container.getBoundingClientRect();
      const cardRect = selectedCard.getBoundingClientRect();
      const scrollTop = cardRect.top - containerRect.top + container.scrollTop;
      const centerOffset =
        scrollTop - container.clientHeight / 2 + selectedCard.offsetHeight / 2;

      container.scrollTo({
        top: centerOffset,
        left: 0,
        behavior: "smooth",
      });
    }
  }
};

//* SCREEN DRAG FUNCTIONS
const screenDrag = () => {
  const container = document.getElementById("card-container");
  let isDragging = false;
  let startX, startY; // Position of grab
  let scrollLeft, scrollTop; // How much scrolled
  let currentX, currentY;

  container.addEventListener("mousedown", (dragEvent) => {
    dragEvent.preventDefault(); // Prevent from selecting text and images  while dragging
    isDragging = true;
    startX = dragEvent.pageX - container.offsetLeft; // Drag start position
    startY = dragEvent.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft; // Current scroll position of the container
    scrollTop = container.scrollTop;
    currentX = dragEvent.pageX;
    currentY = dragEvent.pageY;
  });

  container.addEventListener("mouseup", () => (isDragging = false)); //Stop dragging if mouse is released
  container.addEventListener("mouseleave", () => (isDragging = false));

  const dragLoop = () => {
    if (!isDragging) return;
    const walkX = (currentX - startX) * 1.5; // Dragging speed + Multiplier
    const walkY = (currentY - startY) * 1.5; // Dragging speed + Multiplier
    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop = scrollTop - walkY;
    requestAnimationFrame(dragLoop);
  };

  container.addEventListener("mousemove", (dragEvent) => {
    if (!isDragging) return;
    currentX = dragEvent.pageX;
    currentY = dragEvent.pageY;
    dragLoop();
  });
};
screenDrag();
