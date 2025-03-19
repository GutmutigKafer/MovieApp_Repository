
import { movies } from "./movies-list.js";
import { allComments, addCommentToStorage } from './comments.js';


//* SWITCH VIEW FUNCTION
let currentView = 'grid';
const gridButton = document.getElementById('grid-button');
const listButton = document.getElementById('list-button');
const cardContainer = document.getElementById('card-container');
const listContainer = document.getElementById('list-container');
function showView(newView) {
  currentView = newView;

  if (newView === 'grid') {
    cardContainer.classList.add('show');
    listContainer.classList.remove('show');
    showCursor();
  } else if (newView === 'list') {
    listContainer.classList.add('show');
    cardContainer.classList.remove('show');
    generateGenreFilters();
    renderMovieList();
  }
}
  gridButton.addEventListener('click', () => showView('grid'));
listButton.addEventListener('click', () => showView('list'));

//Start page with the grid view
cardContainer.classList.add('show');


// Custom Cursor for Grid View
const customCursor = document.createElement('div');
customCursor.id = 'custom-cursor';

const cursorImg = document.createElement('img');
cursorImg.src = 'https://img.icons8.com/badges/100/FFFFFF/move.png';

document.body.appendChild(customCursor);
customCursor.appendChild(cursorImg);

function showCursor() {
    customCursor.classList.remove('fade-out');
    customCursor.style.display = 'block';

    // Add Fade In
    setTimeout(() => {
        customCursor.classList.add('fade-in');
    }, 500);

    // Fade out after 3 seconds
    setTimeout(() => {
        customCursor.classList.remove('fade-in');
        customCursor.classList.add('fade-out');

        // Hide after Fade Out
        setTimeout(() => {
            customCursor.style.display = 'none';
        }, 500);
    }, 2500);
}
showCursor();


//* GENRE FILTERS

const selectedGenres = new Set();

function generateGenreFilters() {
    const genreContainer = document.getElementById('genre-filters');
    const uniqueGenres = Array.from(new Set(movies.flatMap(movie => movie.genres)));

    genreContainer.innerHTML = uniqueGenres.map(genre => `
        <div class="genre-filter" data-genre="${genre}">${genre}</div>`).join('');

    const genreFilters = document.querySelectorAll('.genre-filter');
    genreFilters.forEach(filterElement => {
        filterElement.addEventListener('click', () => {
            const genre = filterElement.dataset.genre;
            toggleGenreFilter(genre);
        });
    });
}

function toggleGenreFilter(genre) {
    const genreElement = document.querySelector(`[data-genre="${genre}"]`);
    if (genreElement) {
        genreElement.classList.toggle('active');
        if (selectedGenres.has(genre)) {
            selectedGenres.delete(genre);
        } else {
            selectedGenres.add(genre);
        }
        renderMovieList();
    }
}

//* MOVIE LIST

function renderMovieList() {
    const movieListContainer = document.getElementById('movie-list-items');

    const filteredMovies = movies.filter(movie => {
        const matchesGenres = selectedGenres.size === 0 || 
        [...selectedGenres].every(genre => movie.genres.includes(genre));
        return matchesGenres;
    });

    movieListContainer.innerHTML = filteredMovies.map(movie => `
        <div class="movie-item">
      <img src="${movie.poster_url}" alt="${movie.title}">
      <div>
        <h3>${movie.title} (${movie.movieYear})</h3>
        <div class="genre-list">
          ${movie.genres.map(genre => `
            <span class="genre-tag">${genre}</span>
          `).join('')}
        </div>
        <p>${movie.description.slice(0, 150)}...</p>
      </div>
    </div>`).join('');

}

//* MOVIES GRID

function displayMoviesGrid() {
    const cardContainer = document.getElementById('card-container');

    // Calculating grid dimensions, depending on the min/max coordinate values
    const minX = Math.min(...movies.map(m => m.coordinates.x));
    const maxX = Math.max(...movies.map(m => m.coordinates.x));
    const minY = Math.min(...movies.map(m => m.coordinates.y));
    const maxY = Math.max(...movies.map(m => m.coordinates.y));

    //Seting grid size
    const gridWidth = maxX - minX + 1;
    const gridHeight = maxY - minY + 1;

    // Applying CSS Grid to the cardContainer
    cardContainer.style.gridTemplateColumns = `repeat(${gridWidth}, 400px)`;
    cardContainer.style.gridTemplateRows = `repeat(${gridHeight}, 620px)`;

    // Create movie cards
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = 
            `<h2>${movie.title}</h2>
            <p>${movie.description}</p>
            <img src="${movie.poster_url}" alt="${movie.title}">`;

        // Calculating card position on the Grid
        const gridColumn = movie.coordinates.x - minX + 1;
        const gridRow = movie.coordinates.y - minY + 1;

        //Assigning calculated values to the CSS Grid
        card.style.gridColumn = gridColumn;
        card.style.gridRow = gridRow;

        //TimerGame selection logic
        card.addEventListener('click', (event) => {
            if (isGameActive) {
            if (!selectedMovies.some(m => m.id === movie.id)) {
                selectedMovies.push(movie);
                updateSelectedMoviesList();
            } 
            //Prevent the details to open during the game
                event.stopPropagation(); 
                return;
            }
           
            let isTimerDropdown = event.target.closest('.timer-dropdown');
            if (!isTimerDropdown) {
                    timerDropdown.style.display = 'none'
            } else if (isGameActive) {
                setTimeout(() => {
                    timerDropdown.style.display = 'none'}, 5000);
            }

           toggleDetails(movie);
    });
        cardContainer.appendChild(card);

    });

    //* Display All movies on the grid in console 

    //Creates a grid with empty cells
const consoleGrid = Array(gridHeight).fill().map(() => Array(gridWidth).fill('.'));

movies.forEach((movie) => {
    const x = movie.coordinates.x - minX;
    const y = movie.coordinates.y - minY;
    consoleGrid[y][x] = String(movie.id);
});

consoleGrid.forEach((row) => console.log(row.join(' ')));

    // Center the grid after rendering
    setTimeout(() => {
        const centerX = (cardContainer.scrollWidth - cardContainer.clientWidth) / 2;
        const centerY = (cardContainer.scrollHeight - cardContainer.clientHeight) / 2;
        cardContainer.scrollTo(centerX, centerY);
    }, 100);
    
}
let timerDropdown;

// Grouped all the Details functions under movieDetailsPanel()
const movieDetails = document.getElementById('movie-details');
function movieDetailsPanel() {
   

   /* Sliding window */
   function toggleDetails(movie) {
    const currentMovieTitle = document.getElementById("details-title").textContent;
    const isSameMovie =  currentMovieTitle === movie.title;

    if (movieDetails.classList.contains("show")) {
        isSameMovie ? closeDetails() : openDetails(movie, movie.id);
    } else {
    openDetails(movie, movie.id);
    }
}

    /* Open sliding window */
    function openDetails(movie, currentMovieId) {
        movieDetails.classList.add("show");
        movieDetails.scrollTop = 0; 
        document.getElementById("details-title").textContent = movie.title;
        document.getElementById("details-year").textContent = `${movie.movieYear}`;
        document.getElementById("details-genre").innerHTML = `<span class="bold">Genre:</span> ${movie.genres.join(", ") || ''}`;
        document.getElementById("details-director").innerHTML = `<span class="bold">Director:</span> ${movie.director}`;
        document.getElementById("details-cast").innerHTML = `<span class="bold">Cast:</span> ${movie.actors?.join(", ") || ''}`;
        document.getElementById("details-description").textContent = movie.description;
        document.getElementById("details-poster").src = movie.poster_url;



        //* COMMENTS SECTION
        // Check if comments section already exists, if not create a new one
        let commentsSection = document.getElementById('comments-section');
     if (!commentsSection) {
        commentsSection = document.createElement('div');
    commentsSection.id = 'comments-section';
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
  const commentForm = commentsSection.querySelector('.comment-form');
const nameInput = commentForm.querySelector('input[type="text"]');
const commentInput = commentForm.querySelector('textarea');
const commentDisplay = commentsSection.querySelector('#comment-display');

// Function to display comments for a given movie ID
function displayComments(movieId) {
    // Filter comments by movie ID and create HTML structure for comments
    const comments = allComments.filter((comment) => comment.movieId === movieId);
    const commentHTML = comments.map((comment) => `
      <div class="comment">
        <h4>${comment.userName}</h4>
        <p>${comment.commentText}</p>
        <p>${comment.date}</p>
      </div>
    `).join('');
      // Update the comment display element with the generated HTML
    commentDisplay.innerHTML = commentHTML;
  }


// Function to add a new comment
commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Get the user's name and comment from the input fields
    const name = nameInput.value.trim();
    const comment = commentInput.value.trim();
    if (name && comment) {
         // Add the comment to storage
        addCommentToStorage(movie.id, movie.title, name, comment);
    nameInput.value = '';
    commentInput.value = '';
    // Update the comment display with the new comment
    displayComments(currentMovieId);
    }
  });

  movieDetails.append(commentsSection);

  // Display comments for the current movie ID
  displayComments(currentMovieId);

    }

    /* Close the details window */
    function closeDetails() {
        movieDetails.classList.remove("show");
    }

    /* Close details when clicking outside the movie details panel */
    document.addEventListener('click', (event) => {
        const clickedInsideDetails = movieDetails.contains(event.target);   
        const clickedOnCard = event.target.closest('.card');   

        if (!clickedInsideDetails && !clickedOnCard) {
            closeDetails();
        } 
    });

    // Return for the movieDetailsPanel()
    return {
        openDetails,
        toggleDetails,
        closeDetails
    };
}

// In global scope, extracting the functions, assigning them to variables 
const { toggleDetails, closeDetails } = movieDetailsPanel();
window.closeDetails = closeDetails; 


// Rating functions

document.addEventListener("DOMContentLoaded", function () {
    let stars = document.querySelectorAll(".star"); /*Get all the star elements */
    let selectedRating = 0; /* Keeps track of the selected rating */
     /* Loops through each star to update its appearance based on the selected rating */
    function updateStarHighlight(rating) {
        stars.forEach(star => {
            if (star.dataset.value <= rating) {
                star.classList.add("active"); /*highlights it */
            } else {
                star.classList.remove("active"); // Unhighlight
            }
        });
    }
    stars.forEach(star => {
        star.addEventListener("click", function () {
            /*When a star is clicked, get its rating value */
            selectedRating = this.dataset.value;
            updateStarHighlight(selectedRating);
        });
    });
    /* Reset the star rating for a new movie card */
    let cardContainer = document.getElementById("card-container");
    cardContainer.addEventListener("click", function (event) {
        let clickedCard = event.target.closest(".card"); /* Check if the clicked element is inside a movie card */
        if (clickedCard) {
            selectedRating = 0;
            updateStarHighlight(selectedRating); /* Clear the stars’ highlights */
        }
    });
});


//*SEARCH FUNCTIONS

let searchDiv = document.querySelector('.search');
let searchInput = document.querySelector('.search .searchText');

function searchFunction() {

let searchDropdown = document.getElementById('search-dropdown');
    // Hide the dropdown if the input is empty
 if (searchInput.value.trim() === '') {
     searchDropdown.style.display = 'none';
        return;
      }
    if (searchDropdown) {
     document.addEventListener('click', () => {
        searchDropdown.style.display = 'none';
      })};

      if (searchInput.value.trim() !== '') {
        searchInput.addEventListener('click', () => {
          searchDropdown.style.display = 'block';
        });
      }

      // Get movies by title 
let searchResults = [];
let searchText = searchInput.value.trim();
for (let movie of movies) {
    if (movie.title.toLowerCase().includes(searchText.toLowerCase())) {
      searchResults.push(movie);
    }
  }
    console.log(`searchResults: ${searchResults.length}`);
    searchResults.forEach(result => console.log(result.title));


    //Create and populate the results dropdown
if (!searchDropdown) {
    searchDropdown = document.createElement('div');
    searchDropdown.id = 'search-dropdown';
    searchDiv.appendChild(searchDropdown);
}
searchDropdown.innerHTML = '';

searchResults.forEach(result => {

let resultItem = document.createElement('div');
resultItem.classList.add('resultItem');

let resultPoster = document.createElement('img');
resultPoster.classList.add('resultPoster');
resultPoster.src = result.poster_url;
resultItem.appendChild(resultPoster);

let resultTitle = document.createElement('span');
resultTitle.classList.add('resultTitle');
resultTitle.textContent = result.title;
resultItem.appendChild(resultTitle);

let resultYear = document.createElement('span');
resultYear.classList.add('resultYear');
resultYear.textContent = result.movieYear;
resultItem.appendChild(resultYear);

// Go to the result
resultItem.addEventListener('click', () => goToMovie(result));
searchDropdown.appendChild(resultItem);
});

//Show results if there are any
if (searchResults.length > 0) {
    searchDropdown.style.display = 'block';
  } else {
    searchDropdown.style.display = 'none';
  }
}

    //Show results when typing
    
        let timeoutResults = null;
        searchInput.addEventListener('input', () => {
        clearTimeout(timeoutResults);
        timeoutResults = setTimeout(searchFunction, 200);
        });





// Highlight the selected card
function highlightCard(selectedCard) {
    document.querySelectorAll('.highlighted').forEach(card => {
        card.classList.remove('highlighted');
    });

    setTimeout(() => {
    if (selectedCard) {
        selectedCard.classList.add('highlighted');
       
        setTimeout(() => {
            selectedCard.classList.remove('highlighted');
        }, 1000);
   
    }
}, 200);
}
//* TIMER SECTION

let isGameActive = false;
let selectedMovies = [];
function timerInteraction() {
    let timerOnPageCount;
    let seconds;
    let minutes;
    let formatedTimeOnPage;
    let onPageTimer;

        // On Page Timer
        function timerOnPage()  {
        timerOnPageCount = 0;
        seconds = 0;
        minutes = 0;
        setInterval(() => {
            timerOnPageCount++;
            seconds = timerOnPageCount % 60;
            minutes = Math.floor(timerOnPageCount / 60);
            formatedTimeOnPage = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            onPageTimer.innerHTML = `
            <h3>Time on page</h3>
            <h2>${formatedTimeOnPage}</h2>`;
        }, 1000);
    }
    document.addEventListener('DOMContentLoaded', timerOnPage)

    let timerButton = document.getElementById('timer-button');
 
    let menuBar = document.querySelector('.menu');
  
        timerDropdown = document.createElement('div');
        timerDropdown.id = 'timer-dropdown';
        menuBar.appendChild(timerDropdown);

        timerButton.addEventListener('click', () => {
            timerDropdown.style.display = (timerDropdown.style.display === 'none' || timerDropdown.style.display === '') ? 'block' : 'none';
        
        });

        let timerInterface = document.createElement('div');
        timerInterface.id = 'timer-interface';
        timerDropdown.appendChild(timerInterface);

        onPageTimer = document.createElement('div');
        onPageTimer.id = 'on-page-timer';
        onPageTimer.innerHTML = `
        <h3>Time on page</h3>
            <h2>${formatedTimeOnPage}</h2>`;
        timerInterface.appendChild(onPageTimer);

        let buttonGameTimer = document.createElement('div');
        buttonGameTimer.id = 'button-game-timer';
        buttonGameTimer.innerHTML = `
        <h3>Start quick choice game</h3>
        <button id="start-game-btn">5 seconds</button>`;
        timerInterface.appendChild(buttonGameTimer);

        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (!isGameActive) {
                startGameTimer(5);
            }
        });

        let gameTimerSection = document.createElement('div');
        gameTimerSection.id = 'game-timer-section';
        gameTimerSection.innerHTML = `
        <div id="game-timer-bar">
        <div id="timer-progress"></div>
        </div>
        <div id="selected-movies-list"></div>
        <div id="final-result"></div>`;
        timerDropdown.appendChild(gameTimerSection);


        // Game Timer

let countdownInterval;

        function startGameTimer(seconds) {
            isGameActive = true;
            closeDetails();
            selectedMovies = [];
            document.getElementById('timer-progress').style.width = '100%';
            document.getElementById('selected-movies-list').innerHTML = '';

            let remainingSeconds = seconds;
            countdownInterval = setInterval(() => {
                remainingSeconds = Math.round((remainingSeconds - 0.1) * 10) / 10;
                document.getElementById('timer-progress').style.width =
                 `${(remainingSeconds / seconds) * 100}%`;

                if (remainingSeconds <= 0) {
                    document.getElementById('timer-progress').style.width = '0%';
                    clearInterval(countdownInterval);
                    endGame();
                }
            }, 100);
        }
    }
    function updateSelectedMoviesList() {
        const selectedMoviesList = document.getElementById('selected-movies-list');
        selectedMoviesList.innerHTML = selectedMovies.map(movie => `
            <div class="selected-movie-item">
               <img src="${movie.poster_url}" alt="${movie.title}">
                <span>${movie.title}</span>
                <span>${movie.ratingIMDB}</span>
            </div>
            `).join('');
   }

    function endGame() {
        isGameActive = false;
        const resultContainer = document.getElementById('final-result');
        resultContainer.innerHTML = '';

        if (selectedMovies.length > 0) {
            let randomNum = Math.floor(selectedMovies.length * Math.random());
            const randomMovie = selectedMovies[randomNum];

            const resultTitle = document.createElement('h3');
            resultTitle.innerHTML = 'Movie for tonight';
            resultContainer.appendChild(resultTitle);

            const movieResultContainer = document.createElement('div');
            movieResultContainer.classList.add('selected-movie-item');
            movieResultContainer.id = 'timer-result';
            movieResultContainer.innerHTML = `
            <img src="${randomMovie.poster_url}" alt="${randomMovie.title}">
             <span>${randomMovie.title}</span>
             <span>${randomMovie.ratingIMDB}</span>
             </div>
            `;
            resultContainer.appendChild(movieResultContainer);

            movieResultContainer.addEventListener('click', () => {
                goToMovie(randomMovie);
            });
    
        }

        
    };

 timerInteraction();


function goToMovie(result) {
    const container = document.getElementById('card-container');

    const selectedCard = [...container.children].find(card => 
         card.querySelector('h2').textContent.trim() === result.title.trim()
);

    if (selectedCard) {
        highlightCard(selectedCard);

//Grid dimentions
    const minX = Math.min(...movies.map(m => m.coordinates.x));
    const minY = Math.min(...movies.map(m => m.coordinates.y));

    const gridColumn = result.coordinates.x - minX + 1;
    const gridRow = result.coordinates.y - minY + 1;

    const cardWidth = 380;
    const cardHeight = 620;
    const columnGap = 20;
    const rowGap = 30;

    const cardX = (gridColumn - 1) * (cardWidth + columnGap);
    const cardY = (gridRow - 1) * (cardHeight + rowGap);

    const centerX = cardX + cardWidth / 2 - window.innerWidth / 2;
    const centerY = cardY + cardHeight / 2 - window.innerHeight / 2;

    container.scrollTo({
        left: centerX,
        top: centerY,
        behavior: 'smooth'
    });
}
    };




//* SCREEN DRAG FUNCTIONS

function screenDrag() {
    const container = document.getElementById('card-container');
    let isDragging = false;
    let startX, startY;         // Position of grab
    let scrollLeft, scrollTop;  // How much scrolled

    container.addEventListener('mousedown', (dragEvent) => {
    dragEvent.preventDefault();      // Prevent from selecting text and images  while dragging
    isDragging = true;
        startX = dragEvent.pageX - container.offsetLeft; // Drag start position 
        startY = dragEvent.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft; // Current scroll position of the container
        scrollTop = container.scrollTop;
    });
    
    container.addEventListener('mouseup', () => isDragging = false);    //Stop dragging if mouse is released 
    container.addEventListener('mouseleave', () => isDragging = false);

    container.addEventListener('mousemove', (dragEvent) => {
        if (!isDragging) return;    
        const x = dragEvent.pageX - container.offsetLeft;
        const y = dragEvent.pageY - container.offsetTop;
        const walkX = (x - startX) * 1.5;   // Dragging speed + Multiplier
        const walkY = (y - startY) * 1.5;   // Dragging speed + Multiplier
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
}

displayMoviesGrid();

screenDrag();

