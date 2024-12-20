let stories = [];
let currentStory;
let currentEvents;
let score = 0;
let successfulMatches = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.container.landing')) {
        // We're on the landing page
        const startGameBtn = document.getElementById('start-game');
        startGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('gameStarted', 'true');
            window.location.href = 'game.html';
        });
    } else if (document.getElementById('game-container')) {
        // We're on the game page
        const backToLandingBtn = document.getElementById('back-to-landing');
        backToLandingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetGame();
            window.location.href = 'index.html';
        });

        if (localStorage.getItem('gameStarted') === 'true') {
            localStorage.removeItem('gameStarted');
            fetchStories();
        }
    }
});

async function fetchStories() {
    try {
        const response = await fetch('stories.json');
        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }
        stories = await response.json();
        startNewStory();
    } catch (error) {
        console.error('Error fetching stories:', error);
        showMessage('Error loading stories. Please try again later.', 'error');
    }
}

function startNewStory() {
    if (stories.length === 0) {
        showMessage('Congratulations! You\'ve completed all stories!', 'success');
        return;
    }

    const randomIndex = Math.floor(Math.random() * stories.length);
    currentStory = stories[randomIndex];
    stories.splice(randomIndex, 1);

    const baseEvents = 3;
    const additionalEvents = Math.floor(successfulMatches / 3);
    const numEvents = Math.min(baseEvents + additionalEvents, currentStory.events.length);
    currentEvents = currentStory.events.slice(0, numEvents);

    displayStory();
    displayEvents();
    clearMessage();
    updateScore();
}

function displayStory() {
    const storyContainer = document.querySelector('#story-container');
    if (storyContainer) {
        storyContainer.textContent = currentStory.text;
    }
}

function displayEvents() {
    const optionsContainer = document.querySelector('#options');
    const answerSlotsContainer = document.querySelector('#answer-slots');

    if (optionsContainer && answerSlotsContainer) {
        optionsContainer.innerHTML = '';
        answerSlotsContainer.innerHTML = '';

        const shuffledEvents = [...currentEvents].sort(() => Math.random() - 0.5);

        shuffledEvents.forEach((event, index) => {
            const eventElement = createEventElement(event, index);
            optionsContainer.appendChild(eventElement);

            const answerSlot = document.createElement('div');
            answerSlot.className = 'answer-slot';
            answerSlot.dataset.index = index;
            answerSlotsContainer.appendChild(answerSlot);
        });

        makeEventsDraggable();
    }
}

function createEventElement(event, index) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';

    // Extract the text content from the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(event, 'text/html');
    const textContent = doc.body.textContent || doc.body.innerText; // Get the text without HTML tags

    eventElement.textContent = textContent; // Use the extracted text content
    eventElement.draggable = true;
    eventElement.dataset.index = index;
    
    return eventElement;
}


function makeEventsDraggable() {
    const events = document.querySelectorAll('.event');
    const answerSlots = document.querySelectorAll('.answer-slot');

    events.forEach(event => {
        event.addEventListener('dragstart', dragStart);
    });

    answerSlots.forEach(slot => {
        slot.addEventListener('dragover', dragOver);
        slot.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text');
    const draggedElement = document.querySelector(`.event[data-index="${data}"]`);

    if (e.target.classList.contains('answer-slot') && !e.target.textContent) {
        e.target.textContent = draggedElement.textContent;
        e.target.dataset.eventIndex = draggedElement.dataset.index;
        draggedElement.style.display = 'none';
    }
}

function checkAnswer() {
    const answerSlots = document.querySelectorAll('.answer-slot');
    let correct = 0;

    answerSlots.forEach((slot, index) => {
        if (slot.textContent === currentEvents[index]) {
            correct++;
        }
    });

    updateScore(correct);
    successfulMatches += (correct === currentEvents.length) ? 1 : 0;

    if (correct === currentEvents.length) {
        showMessage(`Great job! All ${correct} events are in the correct order. Your total score is ${score}.`, 'success');
        setTimeout(() => {
            startNewStory();
        }, 2000);
    } else {
        showMessage(`You got ${correct} out of ${currentEvents.length} correct. Try again!`, 'error');
        resetEvents();
    }
}

function resetEvents() {
    const events = document.querySelectorAll('.event');
    const answerSlots = document.querySelectorAll('.answer-slot');

    events.forEach(event => event.style.display = 'block');
    answerSlots.forEach(slot => {
        slot.textContent = '';
        slot.dataset.eventIndex = '';
    });
}

function showMessage(text, type) {
    const messageElement = document.querySelector('#message');
    if (messageElement) {
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
    }
}

function clearMessage() {
    const messageElement = document.querySelector('#message');
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }
}

function updateScore(correct = 0) {
    score += correct;
    const scoreElement = document.querySelector('#score-value');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

function resetGame() {
    score = 0;
    successfulMatches = 0;
    stories = [];
}

if (document.getElementById('game-container')) {
    document.querySelector('#submit-btn').addEventListener('click', checkAnswer);
    document.querySelector('#reset-btn').addEventListener('click', resetEvents);
}