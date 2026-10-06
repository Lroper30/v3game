/* =========================================================
   SLOT PHONE X
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   SAVE DATA
   ========================================================= */

const SAVE_KEY = "slotPhoneXSave";

const defaultState = {
    coins: 0,
    xp: 0,
    clickPower: 1,
    autoCoins: 0,
    highScores: {},
    installedGames: [],
    gameIcons: {},
    installedApps: null,
    notes: "",
    dark: true,
    neon: false,
    sound: true,
    notifications: true,

    owned: {
        double: false,
        neon: false,
        badge: false,
        coinBoost: false
    },

    achievements: [],
    streak: 0,
    lastDaily: "",
    questCoins: 0,

    favorites: [],
    lastSong: 0,
    shuffle: false,
    repeat: false,
    volume: 0.70
};


/* =========================================================
   LOAD / SAVE
   ========================================================= */

function loadState() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(SAVE_KEY) || "{}"
            );

        return {
            ...defaultState,
                stage.innerHTML = `
                    <div class="game-score">Height <span id="stack-score">0</span></div>
                    <div class="stack-area" id="stack-area" aria-label="Block tower"></div>
                    <div class="stack-controls">
                        <button type="button" class="game-button stack-drop" onclick="dropStack()">DROP BLOCK</button>
                        <button type="button" class="game-button" onclick="restartStack()">Restart</button>
                    </div>
                    <p class="game-message" id="stack-message">Catch the overlap. Misses fall, narrow blocks wobble.</p>
                `;
                restartStack();
            }

            function restartStack() {
                clearInterval(window.stackTimer);
                const area = $("stack-area");
                if (!area) return;
                area.replaceChildren();
                window.stackHeight = 0;
                window.stackBlocks = [];
                window.stackFalling = [];
                window.stackPos = Math.max(0, (area.clientWidth - 130) / 2);
                window.stackDir = 1;
                window.stackSpeed = 2.7;
                window.stackCamera = 0;
                window.stackGameOver = false;
                window.currentStack = null;
                $("stack-score").textContent = "0";
                $("stack-message").textContent = "Catch the overlap. Misses fall, narrow blocks wobble.";
                stackSpawn();
                window.stackTimer = setInterval(() => {
                    const playfield = $("stack-area");
                    if (!playfield) return;
                    if (!stackGameOver && currentStack) {
                        const maxLeft = Math.max(0, playfield.clientWidth - currentStack.offsetWidth);
                        stackPos += stackDir * stackSpeed;
                        if (stackPos >= maxLeft || stackPos <= 0) {
                            stackPos = Math.max(0, Math.min(maxLeft, stackPos));
                            stackDir *= -1;
                        }
                        currentStack.style.left = `${stackPos}px`;
                    }
                    stackFalling = stackFalling.filter(piece => {
                        piece.vy += 0.48;
                        piece.x += piece.vx;
                        piece.y += piece.vy;
                        piece.rotation += piece.spin;
                        piece.element.style.left = `${piece.x}px`;
                        piece.element.style.top = `${piece.y}px`;
                        piece.element.style.transform = `rotate(${piece.rotation}deg)`;
                        if (piece.y > playfield.clientHeight + 60 || piece.x < -piece.width - 60 || piece.x > playfield.clientWidth + 60) {
                            piece.element.remove();
                            return false;
                        }
                        return true;
                    });
                    if (stackGameOver && !stackFalling.length) {
                        clearInterval(window.stackTimer);
                        window.stackTimer = null;
                    }
                }, 16);
            }

            function stackSpawn() {
                const area = $("stack-area");
                if (!area || stackGameOver) return;
                const block = document.createElement("div");
                block.className = "stack-block stack-moving";
                block.style.width = stackBlocks.length ? `${parseFloat(stackBlocks.at(-1).style.width)}px` : "130px";
                block.style.left = `${Math.min(stackPos, area.clientWidth - parseFloat(block.style.width))}px`;
                block.style.bottom = `${stackHeight * 27 - stackCamera}px`;
                area.appendChild(block);
                currentStack = block;
                stackPos = parseFloat(block.style.left);
                stackSpeed = Math.min(6.4, 2.7 + stackHeight * 0.16);
            }

            function stackDropPiece(element, left, width, bottom, velocityX, velocityY) {
                if (width < 2) return;
                const area = $("stack-area");
                const height = element.offsetHeight || 25;
                const top = area.clientHeight - bottom - height;
                element.className = "stack-block stack-falling";
                element.style.width = `${width}px`;
                element.style.left = `${left}px`;
                element.style.bottom = "auto";
                element.style.top = `${top}px`;
                window.stackFalling.push({
                    element,
                    x: left,
                    y: top,
                    width,
                    vx: velocityX,
                    vy: velocityY,
                    rotation: 0,
                    spin: velocityX * 0.55
                });
            }

            function stackEndRound() {
                if (stackGameOver) return;
                stackGameOver = true;
                const failedBlock = currentStack;
                currentStack = null;
                if (failedBlock) {
                    const left = parseFloat(failedBlock.style.left) || 0;
                    const bottom = parseFloat(failedBlock.style.bottom) || 0;
                    stackDropPiece(failedBlock, left, parseFloat(failedBlock.style.width), bottom, stackDir * 2.4, -2);
                }
                $("stack-message").textContent = `Tower down at ${stackHeight} blocks. Tap Restart and try again.`;
                $("stack-area").classList.add("stack-over");
                $("stack-area").querySelectorAll(".stack-block:not(.stack-falling)").forEach(block => block.classList.add("stack-settled"));
                recordScore("stack", stackHeight, Math.floor(stackHeight / 2));
            }

            function dropStack() {
                if (!currentStack || stackGameOver) return;
                const area = $("stack-area");
                const movingLeft = parseFloat(currentStack.style.left) || 0;
                const movingWidth = currentStack.offsetWidth;
                const movingBottom = parseFloat(currentStack.style.bottom) || 0;
                const previous = stackBlocks.at(-1);
                if (!previous) {
                    currentStack.classList.remove("stack-moving");
                    currentStack.classList.add("stack-settled");
                    stackBlocks.push(currentStack);
                    stackHeight++;
                    $("stack-score").textContent = stackHeight;
                    addCoins(1);
                    stackSpawn();
                    return;
                }
                const previousLeft = parseFloat(previous.style.left) || 0;
                const previousWidth = parseFloat(previous.style.width) || 0;
                const overlapLeft = Math.max(movingLeft, previousLeft);
                const overlapRight = Math.min(movingLeft + movingWidth, previousLeft + previousWidth);
                const overlapWidth = overlapRight - overlapLeft;
                if (overlapWidth <= 0) {
                    stackEndRound();
                    return;
                }
                const leftOffcut = overlapLeft - movingLeft;
                const rightOffcut = movingLeft + movingWidth - overlapRight;
                if (leftOffcut > 1) {
                    const scrap = currentStack.cloneNode(false);
                    area.appendChild(scrap);
                    stackDropPiece(scrap, movingLeft, leftOffcut, movingBottom, -2.1, -4.5);
                }
                if (rightOffcut > 1) {
                    const scrap = currentStack.cloneNode(false);
                    area.appendChild(scrap);
                    stackDropPiece(scrap, overlapRight, rightOffcut, movingBottom, 2.1, -4.5);
                }
                currentStack.classList.remove("stack-moving");
                currentStack.classList.add("stack-settled");
                currentStack.style.left = `${overlapLeft}px`;
                currentStack.style.width = `${overlapWidth}px`;
                currentStack.style.bottom = `${stackHeight * 27 - stackCamera}px`;
                stackBlocks.push(currentStack);
                stackHeight++;
                stackCamera = Math.max(0, stackHeight * 27 - 300);
                stackBlocks.forEach((block, index) => { block.style.bottom = `${index * 27 - stackCamera}px`; });
                $("stack-score").textContent = stackHeight;
                $("stack-message").textContent = overlapWidth < 45 ? "Narrow footing! Keep the tower centered." : `Clean landing · ${Math.round(overlapWidth)} px supported`;
                addCoins(1);
                stackSpawn();
            }
    reset();
}

function buildWhack(stage) {
    stage.innerHTML = '<div class="whack-toolbar"><div class="whack-levels" role="group" aria-label="Target speed"><button type="button" data-whack-level="easy">Easy</button><button type="button" data-whack-level="classic" class="active">Classic</button><button type="button" data-whack-level="blitz">Blitz</button></div><button type="button" class="game-button" id="whack-restart">Restart</button></div><div class="whack-scoreboard"><div><small>TIME</small><strong id="whack-time">30</strong></div><div><small>SCORE</small><strong id="whack-score">0</strong></div><div><small>STREAK</small><strong id="whack-streak">0×</strong></div></div><p class="game-message" id="whack-status">Hit the glowing target. Misses break your streak.</p><div class="whack-grid" id="whack-grid"></div>';
    const grid = $("whack-grid");
    let level = "classic";
    const settings = { easy: { time: 30, speed: 1150 }, classic: { time: 30, speed: 820 }, blitz: { time: 25, speed: 560 } };
    const start = () => {
        clearInterval(window.whackTimer);
        clearInterval(window.whackTargetTimer);
        let time = settings[level].time;
        let score = 0;
        let streak = 0;
        let bestStreak = 0;
        let target = -1;
        let targetHit = false;
        grid.replaceChildren();
        const cells = Array.from({ length: 9 }, (_, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.setAttribute("aria-label", `Whack tile ${index + 1}`);
            button.addEventListener("click", () => {
                if (time <= 0) return;
                if (index !== target || targetHit) {
                    streak = 0;
                    $("whack-streak").textContent = "0×";
                    $("whack-status").textContent = "Miss. Find the next target.";
                    return;
                }
                targetHit = true;
                streak++;
                bestStreak = Math.max(bestStreak, streak);
                score += 1 + Math.floor((streak - 1) / 5);
                $("whack-score").textContent = score;
                $("whack-streak").textContent = `${streak}×`;
                $("whack-status").textContent = streak > 1 ? `${streak} in a row. Keep it going!` : "Nice hit!";
            });
            grid.appendChild(button);
            return button;
        });
        const moveTarget = () => {
            if (time <= 0) return;
            if (target >= 0 && !targetHit) {
                streak = 0;
                $("whack-streak").textContent = "0×";
            }
            const previous = target;
            do { target = Math.floor(Math.random() * cells.length); } while (target === previous);
            targetHit = false;
            cells.forEach((cell, index) => {
                const active = index === target;
                cell.classList.toggle("active", active);
                cell.setAttribute("aria-label", active ? `Whack target ${index + 1}` : `Empty tile ${index + 1}`);
            });
        };
        $("whack-score").textContent = "0";
        $("whack-streak").textContent = "0×";
        $("whack-time").textContent = `${time}s`;
        $("whack-status").textContent = "Hit the glowing target. Misses break your streak.";
        moveTarget();
        window.whackTargetTimer = setInterval(moveTarget, settings[level].speed);
        window.whackTimer = setInterval(() => {
            time--;
            $("whack-time").textContent = `${time}s`;
            if (time <= 0) {
                clearInterval(window.whackTimer);
                clearInterval(window.whackTargetTimer);
                cells.forEach(cell => { cell.disabled = true; });
                $("whack-status").textContent = `Time! Best streak: ${bestStreak}. Tap Restart for another round.`;
                recordScore("whack", score, score);
            }
        }, 1000);
    };
    $("whack-restart").addEventListener("click", start);
    stage.querySelectorAll("[data-whack-level]").forEach(button => button.addEventListener("click", () => {
        level = button.dataset.whackLevel;
        stage.querySelectorAll("[data-whack-level]").forEach(item => item.classList.toggle("active", item === button));
        start();
    }));
    start();
}

function buildTrivia(stage) {
    const bank = [
        { category: "Science", q: "Which planet is known as the Red Planet?", a: ["Mars", "Venus", "Neptune"], correct: 0 },
        { category: "Science", q: "What is the chemical symbol for gold?", a: ["Ag", "Au", "Fe"], correct: 1 },
        { category: "Science", q: "Which gas do plants absorb from the air?", a: ["Oxygen", "Carbon dioxide", "Helium"], correct: 1 },
        { category: "Science", q: "How many chambers are in the human heart?", a: ["Two", "Three", "Four"], correct: 2 },
        { category: "Science", q: "What is the closest star to Earth?", a: ["Sirius", "The Sun", "Proxima Centauri"], correct: 1 },
        { category: "Science", q: "Which force keeps planets in orbit?", a: ["Magnetism", "Gravity", "Friction"], correct: 1 },
        { category: "World", q: "Which ocean is the largest?", a: ["Atlantic", "Indian", "Pacific"], correct: 2 },
        { category: "World", q: "What is the capital of Japan?", a: ["Kyoto", "Tokyo", "Osaka"], correct: 1 },
        { category: "World", q: "Which river flows through Egypt?", a: ["Amazon", "Nile", "Danube"], correct: 1 },
        { category: "World", q: "Which continent has the most countries?", a: ["Africa", "Europe", "South America"], correct: 0 },
        { category: "World", q: "The city of Petra is in which country?", a: ["Jordan", "Greece", "Morocco"], correct: 0 },
        { category: "World", q: "What is the currency of the United Kingdom?", a: ["Euro", "Pound sterling", "Franc"], correct: 1 },
        { category: "Culture", q: "Who wrote Frankenstein?", a: ["Mary Shelley", "Jane Austen", "Virginia Woolf"], correct: 0 },
        { category: "Culture", q: "Who painted the Mona Lisa?", a: ["Claude Monet", "Leonardo da Vinci", "Vincent van Gogh"], correct: 1 },
        { category: "Culture", q: "What is the official language of Brazil?", a: ["Spanish", "Portuguese", "French"], correct: 1 },
        { category: "Culture", q: "Which instrument usually has 88 keys?", a: ["Piano", "Harp", "Accordion"], correct: 0 },
        { category: "Culture", q: "In which sport would you perform a slam dunk?", a: ["Tennis", "Basketball", "Volleyball"], correct: 1 },
        { category: "Culture", q: "What is the name of the toy cowboy in Toy Story?", a: ["Buzz", "Woody", "Rex"], correct: 1 }
    ];
    let category = "Mixed";
    let questions = [];
    let index = 0;
    let score = 0;
    let streak = 0;
    let locked = false;
    const startRound = () => {
        const pool = category === "Mixed" ? [...bank] : bank.filter(item => item.category === category);
        for (let position = pool.length - 1; position > 0; position--) {
            const swap = Math.floor(Math.random() * (position + 1));
            [pool[position], pool[swap]] = [pool[swap], pool[position]];
        }
        questions = pool.slice(0, Math.min(10, pool.length));
        index = 0;
        score = 0;
        streak = 0;
        render();
    };
    const render = () => {
        if (index >= questions.length) {
            const percent = Math.round(score / questions.length * 100);
            stage.innerHTML = `<div class="trivia-finish"><span class="trivia-finish-icon">${percent >= 80 ? "🏆" : percent >= 50 ? "⭐" : "🎯"}</span><p class="eyebrow">ROUND COMPLETE</p><h3>${score} / ${questions.length}</h3><p>${percent}% correct · ${category}</p><button type="button" class="game-button" id="trivia-again">Play another round</button></div>`;
            recordScore("trivia", score, score);
            $("trivia-again").addEventListener("click", startRound);
            return;
        }
        locked = false;
        const item = questions[index];
        stage.innerHTML = `<div class="trivia-toolbar"><div class="trivia-categories" role="group" aria-label="Trivia category">${["Mixed", "Science", "World", "Culture"].map(name => `<button type="button" data-trivia-category="${name}" class="${category === name ? "active" : ""}">${name}</button>`).join("")}</div><span class="trivia-progress-label">${index + 1} / ${questions.length}</span></div><div class="trivia-progress"><span style="width:${index / questions.length * 100}%"></span></div><div class="trivia-round-score"><span>Score <b>${score}</b></span><span>Streak <b>${streak}×</b></span></div><span class="trivia-category-tag">${item.category}</span><h3 class="trivia-question">${item.q}</h3><div class="trivia-options"></div><p class="trivia-feedback" aria-live="polite">Choose your answer</p>`;
        stage.querySelectorAll("[data-trivia-category]").forEach(button => button.addEventListener("click", () => {
            category = button.dataset.triviaCategory;
            startRound();
        }));
        const options = stage.querySelector(".trivia-options");
        item.a.forEach((answer, answerIndex) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "trivia-option";
            button.textContent = answer;
            button.addEventListener("click", () => {
                if (locked) return;
                locked = true;
                const correct = answerIndex === item.correct;
                if (correct) { score++; streak++; }
                else streak = 0;
                options.querySelectorAll("button").forEach((option, position) => {
                    option.disabled = true;
                    if (position === item.correct) option.classList.add("correct");
                    else if (position === answerIndex) option.classList.add("incorrect");
                });
                stage.querySelector(".trivia-round-score").innerHTML = `<span>Score <b>${score}</b></span><span>Streak <b>${streak}×</b></span>`;
                stage.querySelector(".trivia-feedback").textContent = correct ? (streak > 1 ? `Correct! ${streak} in a row.` : "Correct!") : `Not quite. The answer is ${item.a[item.correct]}.`;
                const next = document.createElement("button");
                next.type = "button";
                next.className = "game-button trivia-next";
                next.textContent = index === questions.length - 1 ? "See results" : "Next question →";
                next.addEventListener("click", () => { index++; render(); });
                stage.appendChild(next);
            });
            options.appendChild(button);
        });
    };
    startRound();
}


/* =========================================================
   COINS / XP
   ========================================================= */

function addCoins(amount) {

    let gain = Number(amount) || 0;

    if (state.owned.coinBoost) {
        gain *= 2;
    }

    state.coins += gain;
    state.questCoins += gain;

    addXP(
        Math.max(
            1,
            Math.floor(gain / 2)
        )
    );

    checkAchievements();

    save();
    updateUI();

}


function addXP(amount) {

    state.xp += Number(amount) || 0;

    while (state.xp >= 100) {
        state.xp -= 100;
    }

}


function level() {

    return Math.floor(
        state.coins / 100
    ) + 1;

}


/* =========================================================
   GAMES
   ========================================================= */

const games = [

    {
        id: "clicker",
        name: "Mega Clicker",
        icon: "🖱️",
        cat: "arcade",
        desc: "Build a giant coin pile."
    },

    {
        id: "snake",
        name: "Snake",
        icon: "🐍",
        cat: "arcade",
        desc: "Eat food and grow."
    },

    {
        id: "bricks",
        name: "Brick Breaker",
        icon: "🧱",
        cat: "arcade",
        desc: "Clear every brick."
    },

    {
        id: "pong",
        name: "Pong",
        icon: "🏓",
        cat: "arcade",
        desc: "Beat the computer."
    },

    {
        id: "reaction",
        name: "Reaction Test",
        icon: "⚡",
        cat: "arcade",
        desc: "Test your reaction speed."
    },

    {
        id: "memory",
        name: "Memory Match",
        icon: "🧠",
        cat: "puzzle",
        desc: "Find every matching pair."
    },

    {
        id: "2048",
        name: "2048",
        icon: "🔢",
        cat: "puzzle",
        desc: "Merge numbers and score."
    },

    {
        id: "number",
        name: "Number Guess",
        icon: "🎯",
        cat: "puzzle",
        desc: "Find the secret number."
    },

    {
        id: "color",
        name: "Color Switch",
        icon: "🎨",
        cat: "puzzle",
        desc: "Pick the correct color."
    },

    {
        id: "stack",
        name: "Stacker",
        icon: "🏗️",
        cat: "arcade",
        desc: "Build the tallest tower."
    },

    {
        id: "target",
        name: "Target Tap",
        icon: "🎯",
        cat: "arcade",
        desc: "Hit targets before time runs out."
    },

    {
        id: "dodge",
        name: "Dodge",
        icon: "💨",
        cat: "action",
        desc: "Survive the falling blocks."
    },

    {
        id: "road",
        name: "Road Rush",
        icon: "🚗",
        cat: "action",
        desc: "Dodge traffic and go farther."
    },

    {
        id: "space",
        name: "Space Defender",
        icon: "🚀",
        cat: "action",
        desc: "Defend your ship."
    },

    {
        id: "coins",
        name: "Coin Catcher",
        icon: "🪙",
        cat: "action",
        desc: "Catch coins, avoid hazards."
    },

    {
        id: "mines",
        name: "Grid Sweep",
        icon: "💎",
        cat: "puzzle",
        desc: "Find gems without traps."
    },

    {
        id: "typing",
        name: "Speed Type",
        icon: "⌨️",
        cat: "arcade",
        desc: "Type the words quickly."
    },

    {
        id: "math",
        name: "Math Rush",
        icon: "➗",
        cat: "puzzle",
        desc: "Solve quick math questions."
    },
    {
        id: "tictactoe",
        name: "Tic-Tac-Toe",
        icon: "⭕",
        cat: "puzzle",
        desc: "Take on a quick three-in-a-row match."
    },
    {
        id: "whack",
        name: "Whack-a-Spot",
        icon: "🔨",
        cat: "arcade",
        desc: "Tap the lit tile before it moves."
    },
    {
        id: "trivia",
        name: "Quick Trivia",
        icon: "🧩",
        cat: "puzzle",
        desc: "Answer five rapid-fire questions."
    }

];


/* =========================================================
   NAVIGATION
   ========================================================= */

function openView(name) {

    document
        .querySelectorAll(".view")
        .forEach(view => {
            view.classList.remove("active");
        });

    const target = $(name);

    if (target) {
        target.classList.add("active");
    }

    if (name !== "game") {
        clearGameTimers();
        $("games")?.classList.remove("playing-game");
        $("game-stage")?.replaceChildren();
        if ($("game-title")) $("game-title").textContent = "Choose a game";
        if ($("game-icon")) $("game-icon").textContent = "🎮";
        if (window.gameAnimationFrame) {
            cancelAnimationFrame(window.gameAnimationFrame);
            window.gameAnimationFrame = null;
        }
    }

    updateUI();

}


function home() {

    openView("home");

}


document.addEventListener(
    "click",
    event => {

        const openButton =
            event.target.closest("[data-open]");

        const gameApp = event.target.closest("[data-game-app]");

        if (gameApp) {
            startGame(gameApp.dataset.gameApp);
            return;
        }

        if (openButton) {

            openView(
                openButton.dataset.open
            );

            return;

        }


        if (
            event.target.closest("[data-home]")
        ) {

            home();

            return;

        }


        const filter =
            event.target.closest("[data-filter]");

        if (filter) {

            document
                .querySelectorAll(".filter")
                .forEach(button => {

                    button.classList.remove(
                        "active"
                    );

                });

            filter.classList.add("active");

            renderGames(
                filter.dataset.filter
            );

            return;

        }


        const note =
            event.target.closest("[data-note]");

        if (note) {

            noteAction(
                note.dataset.note
            );

            return;

        }


        const calc =
            event.target.closest("[data-calc]");

        if (calc) {

            calcAction(
                calc.dataset.calc
            );

            return;

        }


        const preset =
            event.target.closest("[data-seconds]");

        if (preset) {

            setTimer(
                Number(
                    preset.dataset.seconds
                )
            );

            return;

        }


        const musicFilter =
            event.target.closest(
                "[data-music-filter]"
            );

        if (musicFilter) {

            document
                .querySelectorAll(
                    "[data-music-filter]"
                )
                .forEach(button => {

                    button.classList.remove(
                        "active"
                    );

                });

            musicFilter.classList.add(
                "active"
            );

            musicFilterMode =
                musicFilter.dataset.musicFilter;

            renderPlaylist();

        }

    }
);


/* =========================================================
   CLOCK
   ========================================================= */

function updateClock() {

    const date = new Date();

    const time =
        date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    if ($("status-time")) {

        $("status-time").textContent =
            time.slice(0, 5);

    }

    if ($("clock-time")) {

        $("clock-time").textContent =
            time;

    }

    if ($("big-clock")) {

        $("big-clock").textContent =
            time;

    }

    if ($("home-date")) {

        $("home-date").textContent =
            date
                .toLocaleDateString(
                    [],
                    {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    }
                )
                .toUpperCase();

    }

    if ($("clock-date")) {

        $("clock-date").textContent =
            date.toLocaleDateString(
                [],
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );

    }

}


setInterval(
    updateClock,
    1000
);

updateClock();


/* =========================================================
   GAME LIST
   ========================================================= */

function updateGameCenterStats() {
    const recordCount = games.filter(game => Number(state.highScores[game.id]) > 0).length;
    const topScore = Math.max(0, ...Object.values(state.highScores).map(Number).filter(Number.isFinite));
    if ($("game-total-count")) $("game-total-count").textContent = games.length;
    if ($("game-record-count")) $("game-record-count").textContent = recordCount;
    if ($("game-top-score")) $("game-top-score").textContent = topScore;
}

function renderGames(filter = "all") {

    const list = $("game-list");

    if (!list) return;

    list.innerHTML = "";
    const dayIndex = Math.floor(Date.now() / 86400000) % games.length;
    const featuredGame = games[dayIndex];
    if ($("game-daily-name")) $("game-daily-name").textContent = featuredGame.name;
    if ($("game-daily-desc")) $("game-daily-desc").textContent = featuredGame.desc;
    if ($("game-daily-play")) $("game-daily-play").onclick = () => startGame(featuredGame.id);
    updateGameCenterStats();

    const matchingGames = games
        .filter(game => {
            const query = $("game-search")?.value.trim().toLowerCase();
            return (
                filter === "all" ||
                game.cat === filter
            ) && (!query || game.name.toLowerCase().includes(query) || game.desc.toLowerCase().includes(query));

        });

    if (!matchingGames.length) {
        const empty = document.createElement("div");
        empty.className = "game-empty";
        empty.textContent = "No games match that search. Try another title or category.";
        list.appendChild(empty);
    }

    matchingGames.forEach(game => {

            const best =
                state.highScores[game.id] || 0;

            const card =
                document.createElement("div");

            card.className = "game-card";

            const icon = state.gameIcons[game.id];
            const installed = state.installedGames.includes(game.id);
            card.innerHTML = `

                <div class="game-icon">${icon ? `<img src="${icon}" alt="${game.name} icon">` : game.icon}</div>

                <div class="game-info">

                    <h3>${game.name}</h3>

                    <p>${game.desc}</p>

                    <div class="game-card-meta">
                        <span class="game-category">${game.cat}</span>
                        <span class="best">${best ? `PERSONAL BEST ${best}` : "NO RECORD YET"}</span>
                    </div>

                </div>

                <div class="game-card-controls">
                    <button class="play" data-play="${game.id}">PLAY</button>
                    <button type="button" class="game-install" data-game-install="${game.id}" aria-pressed="${installed}">${installed ? "Remove" : "Install"}</button>
                    <label class="game-icon-upload" title="Choose a profile picture for ${game.name}">Set icon<input type="file" accept="image/*" data-game-icon="${game.id}" hidden></label>
                </div>

            `;

            list.appendChild(card);

        });


    list
        .querySelectorAll("[data-play]")
        .forEach(button => {

            button.onclick = () => {

                startGame(
                    button.dataset.play
                );

            };

        });

    list.querySelectorAll("[data-game-install]").forEach(button => {
        button.addEventListener("click", () => {
            const id = button.dataset.gameInstall;
            const index = state.installedGames.indexOf(id);
            if (index >= 0) state.installedGames.splice(index, 1);
            else state.installedGames.push(id);
            save();
            renderGameApps();
            renderGames(filter);
            toast(index >= 0 ? "Game removed from your home screen" : "Game added to your home screen");
        });
    });

    list.querySelectorAll("[data-game-icon]").forEach(input => {
        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file?.type.startsWith("image/")) return;
            try {
                const icon = await resizeGameIcon(file);
                state.gameIcons[input.dataset.gameIcon] = icon;
                save();
                renderGames(filter);
                renderGameApps();
                toast("Game profile picture updated");
            } catch {
                toast("Couldn’t use that image");
            }
        });
    });

}

function renderGameApps() {
    const grid = $("home-app-grid");
    if (!grid) return;
    grid.querySelectorAll("[data-game-app]").forEach(tile => tile.remove());
    state.installedGames.forEach(id => {
        const game = games.find(item => item.id === id);
        if (!game) return;
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "app-tile ios-app-tile";
        tile.dataset.gameApp = game.id;
        tile.dataset.name = game.name.toLowerCase();
        const icon = document.createElement("span");
        icon.className = "app-icon purple ios-icon game-home-icon";
        const image = state.gameIcons[game.id];
        if (image) {
            const img = document.createElement("img");
            img.src = image;
            img.alt = "";
            icon.appendChild(img);
        } else {
            icon.textContent = game.icon;
        }
        const name = document.createElement("b");
        name.textContent = game.name;
        tile.append(icon, name);
        grid.appendChild(tile);
    });
}

function resizeGameIcon(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const image = new Image();
            image.onerror = reject;
            image.onload = () => {
                const scale = Math.min(1, 512 / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}


/* =========================================================
   SCORE
   ========================================================= */

function recordScore(
    id,
    score,
    reward = Math.max(
        1,
        Math.floor(score / 10)
    )
) {

    if (
        score >
        (
            state.highScores[id] || 0
        )
    ) {

        state.highScores[id] = score;

        toast("🏆 New high score!");

    }

    if (reward > 0) {
        addCoins(reward);
    } else {
        updateUI();
    }

    save();
    updateGameCenterStats();

}


/* =========================================================
   GAME START
   ========================================================= */

function startGame(id) {

    const game =
        games.find(
            item => item.id === id
        );

    if (!game) return;

    clearGameTimers();

    openView("game");
    $("games")?.classList.add("playing-game");

    $("game-title").textContent =
        game.name;

    $("game-icon").textContent =
        game.icon;

    const stage =
        $("game-stage");

    if (!stage) return;

    stage.innerHTML = "";

    const builders = {

        clicker: buildClicker,
        snake: buildSnake,
        bricks: buildBricks,
        pong: buildPong,
        reaction: buildReaction,
        memory: buildMemory,
        "2048": build2048,
        number: buildNumber,
        color: buildColor,
        stack: buildStack,
        target: buildTarget,
        dodge: buildDodge,
        road: buildRoad,
        space: buildSpace,
        coins: buildCoins,
        mines: buildMines,
        typing: buildTyping,
        math: buildMath,
        tictactoe: buildTicTacToe,
        whack: buildWhack,
        trivia: buildTrivia

    };

    if (builders[id]) {
        builders[id](stage);
    }

    stage.scrollIntoView({ behavior: "smooth", block: "nearest" });

}


function clearGameTimers() {

    const timers = [
        "clickerAuto",
        "snakeTimer",
        "brickTimer",
        "pongTimer",
        "reactionTimer",
        "memoryTimer",
        "numberTimer",
        "colorTimer",
        "targetTimer",
        "dodgeTimer",
        "roadTimer",
        "spaceTimer",
        "catchTimer",
        "stackTimer",
        "mineTimer",
        "typingTimer",
        "mathTimer",
        "whackTimer",
        "whackTargetTimer"
    ];

    timers.forEach(timerName => {

        if (window[timerName]) {

            clearInterval(
                window[timerName]
            );

            window[timerName] = null;

        }

    });

}


/* =========================================================
   CLICKER
   ========================================================= */

function buildClicker(stage) {

    let local = 0;

    stage.innerHTML = `

        <div class="game-score">
            🪙
            <span id="click-score">0</span>
        </div>

        <p class="game-message">
            Tap for coins.
        </p>

        <button
            class="big-click"
            id="big-click"
        >
            🪙
        </button>

        <button
            class="game-button"
            id="power-up"
        >
            Upgrade Click Power — 25 🪙
        </button>

        <button
            class="game-button game-secondary"
            id="auto-up"
        >
            Auto Coins — 75 🪙
        </button>

        <p
            class="game-message"
            id="click-info"
        >
            +${state.clickPower}
            per tap · Auto:
            ${state.autoCoins}/sec
        </p>

    `;

    $("big-click").onclick = () => {

        local += state.clickPower;

        addCoins(state.clickPower);

        $("click-score").textContent =
            local;

    };


    $("power-up").onclick = () => {

        if (state.coins < 25) {

            toast("Need 25 coins");

            return;

        }

        state.coins -= 25;

        state.clickPower++;

        save();
        updateUI();

        toast("⚡ Click power upgraded!");

    };


    $("auto-up").onclick = () => {

        if (state.coins < 75) {

            toast("Need 75 coins");

            return;

        }

        state.coins -= 75;

        state.autoCoins++;

        save();
        updateUI();

        toast("🤖 Auto coins upgraded!");

    };


    clearInterval(window.clickerAuto);

    window.clickerAuto =
        setInterval(() => {

            if (state.autoCoins) {

                addCoins(
                    state.autoCoins
                );

            }

        }, 1000);

}


/* =========================================================
   SNAKE
   ========================================================= */

function buildSnake(stage) {

    stage.innerHTML = `

        <div class="game-score">
            Score:
            <span id="snake-score">0</span>
        </div>

        <canvas
            class="game-canvas"
            id="snake-canvas"
            width="300"
            height="300"
        ></canvas>

        <div class="controls">

            <button onclick="snakeMove('up')">↑</button>
            <button onclick="snakeMove('left')">←</button>
            <button onclick="snakeMove('down')">↓</button>
            <button onclick="snakeMove('right')">→</button>

        </div>

        <button
            class="game-button"
            onclick="startSnakeGame()"
        >
            Restart
        </button>

    `;

    startSnakeGame();

}


function startSnakeGame() {

    clearInterval(
        window.snakeTimer
    );

    window.snake = [
        {x: 7, y: 7},
        {x: 6, y: 7},
        {x: 5, y: 7}
    ];

    window.snakeDir = {
        x: 1,
        y: 0
    };

    window.snakeFood = {
        x: 10,
        y: 10
    };

    window.snakeScore = 0;

    drawSnake();

    window.snakeTimer =
        setInterval(() => {

            const next = {

                x:
                    snake[0].x +
                    snakeDir.x,

                y:
                    snake[0].y +
                    snakeDir.y

            };


            if (

                next.x < 0 ||
                next.x >= 15 ||
                next.y < 0 ||
                next.y >= 15 ||

                snake.some(
                    part =>
                        part.x === next.x &&
                        part.y === next.y
                )

            ) {

                clearInterval(
                    snakeTimer
                );

                recordScore(
                    "snake",
                    snakeScore,
                    Math.floor(
                        snakeScore / 10
                    )
                );

                return;

            }


            snake.unshift(next);


            if (
                next.x === snakeFood.x &&
                next.y === snakeFood.y
            ) {

                snakeScore += 10;

                snakeFood = {

                    x:
                        Math.floor(
                            Math.random() * 15
                        ),

                    y:
                        Math.floor(
                            Math.random() * 15
                        )

                };

            } else {

                snake.pop();

            }

            drawSnake();

        }, 120);

}


function drawSnake() {

    const canvas =
        $("snake-canvas");

    if (!canvas) return;

    const context =
        canvas.getContext("2d");

    context.fillStyle = "#080c14";

    context.fillRect(
        0,
        0,
        300,
        300
    );

    context.fillStyle = "#ff5575";

    context.fillRect(
        snakeFood.x * 20,
        snakeFood.y * 20,
        17,
        17
    );

    context.fillStyle = "#39d98a";

    snake.forEach(part => {

        context.fillRect(
            part.x * 20,
            part.y * 20,
            17,
            17
        );

    });

    if ($("snake-score")) {

        $("snake-score").textContent =
            snakeScore;

    }

}


function snakeMove(direction) {

    if (
        direction === "up" &&
        snakeDir.y === 0
    ) {

        snakeDir = {x: 0, y: -1};

    }

    if (
        direction === "down" &&
        snakeDir.y === 0
    ) {

        snakeDir = {x: 0, y: 1};

    }

    if (
        direction === "left" &&
        snakeDir.x === 0
    ) {

        snakeDir = {x: -1, y: 0};

    }

    if (
        direction === "right" &&
        snakeDir.x === 0
    ) {

        snakeDir = {x: 1, y: 0};

    }

}


/* =========================================================
   MEMORY
   ========================================================= */

function buildMemory(stage) {

    const cards = [

        "🍎", "🍎",
        "🍋", "🍋",
        "🍇", "🍇",
        "🍉", "🍉",
        "⭐", "⭐",
        "🚀", "🚀",
        "🎮", "🎮",
        "🎵", "🎵"

    ].sort(
        () => Math.random() - .5
    );


    stage.innerHTML = `

        <div class="game-score">
            Matches
            <span id="memory-score">0</span>
            /8
        </div>

        <div
            class="memory-grid"
            id="memory-grid"
        ></div>

        <p
            class="game-message"
            id="memory-msg"
        >
            Find all pairs.
        </p>

    `;


    let first = null;
    let locked = false;
    let matches = 0;


    cards.forEach(value => {

        const button =
            document.createElement("button");

        button.className =
            "memory-card";

        button.textContent = "?";


        button.onclick = () => {

            if (
                locked ||
                button === first ||
                button.classList.contains("revealed")
            ) {
                return;
            }


            button.textContent = value;

            button.classList.add("revealed");


            if (!first) {

                first = button;

                button.dataset.value =
                    value;

                return;

            }


            locked = true;


            if (
                first.dataset.value ===
                value
            ) {

                matches++;

                $("memory-score").textContent =
                    matches;

                first = null;
                locked = false;

                addCoins(3);


                if (matches === 8) {

                    $("memory-msg")
                        .textContent =
                        "You cleared the board! 🎉";

                    recordScore(
                        "memory",
                        matches,
                        20
                    );

                }

            } else {

                const old = first;

                setTimeout(() => {

                    old.textContent = "?";

                    old.classList.remove(
                        "revealed"
                    );

                    button.textContent = "?";

                    button.classList.remove(
                        "revealed"
                    );

                    first = null;

                    locked = false;

                }, 600);

            }

        };


        $("memory-grid")
            .appendChild(button);

    });

}


/* =========================================================
   TARGET
   ========================================================= */

function buildTarget(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Time
            <span id="target-time">20</span>

            ·

            Score
            <span id="target-score">0</span>

        </div>

        <div
            class="target-area"
            id="target-area"
        ></div>

        <button
            class="game-button"
            onclick="startTarget()"
        >
            Restart
        </button>

    `;

    startTarget();

}


function startTarget() {

    clearInterval(
        window.targetTimer
    );

    let time = 20;
    let score = 0;

    const area =
        $("target-area");

    area.innerHTML = "";


    function spawnTarget() {

        const target =
            document.createElement("button");

        target.className = "target";

        target.style.left =
            Math.random() * 250 + "px";

        target.style.top =
            Math.random() * 390 + "px";

        target.onclick = () => {

            score++;

            $("target-score").textContent =
                score;

            target.remove();

            spawnTarget();

        };

        area.appendChild(target);

    }


    spawnTarget();


    window.targetTimer =
        setInterval(() => {

            time--;

            $("target-time").textContent =
                time;

            if (time <= 0) {

                clearInterval(
                    targetTimer
                );

                area.innerHTML = `
                    <p
                        style="
                        text-align:center;
                        padding-top:190px;
                        "
                    >
                        Finished!
                        ${score}
                        targets 🎯
                    </p>
                `;

                recordScore(
                    "target",
                    score,
                    score
                );

            }

        }, 1000);

}


/* =========================================================
   REACTION
   ========================================================= */

function buildReaction(stage) {

    stage.innerHTML = `

        <div class="game-score">
            Reaction Test
        </div>

        <div
            class="reaction-box"
            id="reaction-box"
        >
            Click to start
        </div>

        <p
            class="game-message"
            id="reaction-result"
        >
            Wait for green.
        </p>

    `;


    const box =
        $("reaction-box");

    let waiting = false;
    let ready = false;
    let start = 0;


    box.onclick = () => {

        if (!waiting) {

            waiting = true;
            ready = false;

            box.className =
                "reaction-box wait";

            box.textContent =
                "Wait...";


            setTimeout(() => {

                ready = true;

                start =
                    performance.now();

                box.className =
                    "reaction-box ready";

                box.textContent =
                    "CLICK!";

            }, 800 + Math.random() * 2400);

            return;
        }


        if (ready) {

            const milliseconds =
                Math.round(
                    performance.now() - start
                );

            $("reaction-result")
                .textContent =
                `${milliseconds} ms`;

            recordScore(
                "reaction",
                Math.max(
                    1,
                    1000 - milliseconds
                ),
                Math.max(
                    1,
                    Math.floor(
                        1000 /
                        Math.max(
                            1,
                            milliseconds
                        )
                    )
                )
            );

            waiting = false;
            ready = false;

            box.className =
                "reaction-box";

            box.textContent =
                "Click to try again";

        }

    };

}


/* =========================================================
   NUMBER GUESS
   ========================================================= */

function buildNumber(stage) {

    stage.innerHTML = `

        <div class="game-score">
            Number Guess
        </div>

        <p class="game-message">
            I'm thinking of 1–50.
        </p>

        <input
            class="number-input"
            id="guess-input"
            type="number"
            min="1"
            max="50"
            placeholder="Enter guess"
        >

        <button
            class="game-button"
            onclick="guessNumber()"
        >
            Guess
        </button>

        <p
            class="game-message"
            id="guess-msg"
        ></p>

        <button
            class="game-button game-secondary"
            onclick="newNumber()"
        >
            New Number
        </button>

    `;

    newNumber();

}


function newNumber() {

    window.secret =
        Math.floor(
            Math.random() * 50
        ) + 1;

    window.attempts = 0;

    if ($("guess-input")) {
        $("guess-input").value = "";
    }

    if ($("guess-msg")) {
        $("guess-msg").textContent =
            "Good luck!";
    }

}


function guessNumber() {

    const number =
        Number(
            $("guess-input").value
        );

    window.attempts++;


    if (number === secret) {

        $("guess-msg")
            .textContent =
            `Correct in ${attempts} guesses! 🎉`;

        recordScore(
            "number",
            Math.max(
                1,
                50 - attempts
            ),
            Math.max(
                2,
                30 - attempts
            )
        );

    } else {

        $("guess-msg")
            .textContent =
            number < secret
                ? "Too low!"
                : "Too high!";

    }

}


/* =========================================================
   COLOR
   ========================================================= */

function buildColor(stage) {

    stage.innerHTML = `

        <div class="game-score">
            Score
            <span id="color-score">0</span>
        </div>

        <p
            class="game-message"
            id="color-word"
            style="
            font-size:32px;
            font-weight:900;
            "
        >
            RED
        </p>

        <div id="color-buttons"></div>

        <p
            class="game-message"
            id="color-msg"
        >
            Match the word.
        </p>

    `;

    colorRound();

}


function colorRound() {

    const colors = [
        "red",
        "blue",
        "green",
        "yellow",
        "purple"
    ];

    const word =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];

    $("color-word")
        .textContent =
        word.toUpperCase();

    const box =
        $("color-buttons");

    box.innerHTML = "";

    colors.forEach(color => {

        const button =
            document.createElement("button");

        button.className =
            "game-button";

        button.textContent =
            color.toUpperCase();

        button.style.background =
            color;

        if (color === "yellow") {
            button.style.color = "#111";
        }

        button.onclick = () => {

            if (color === word) {

                $("color-score")
                    .textContent =
                    Number(
                        $("color-score")
                            .textContent
                    ) + 1;

                addCoins(2);

                colorRound();

            } else {

                $("color-msg")
                    .textContent =
                    "Nope — try again!";

            }

        };

        box.appendChild(button);

    });

}


/* =========================================================
   STACK
   ========================================================= */

function buildStack(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Height
            <span id="stack-score">0</span>

        </div>

        <div
            class="stack-area"
            id="stack-area"
        ></div>

        <button
            class="game-button"
            onclick="dropStack()"
        >
            DROP BLOCK
        </button>

        <p class="game-message">
            Line up each block.
        </p>

    `;


    window.stackHeight = 0;
    window.stackBlocks = [];
    window.stackPos = 0;
    window.stackDir = 1;

    stackSpawn();

    clearInterval(
        window.stackTimer
    );

    window.stackTimer =
        setInterval(() => {

            stackPos +=
                stackDir * 3;

            if (
                stackPos > 160 ||
                stackPos < 0
            ) {

                stackDir *= -1;

            }

            if (window.currentStack) {

                currentStack.style.left =
                    stackPos + "px";

            }

        }, 20);

}


function stackSpawn() {

    const block =
        document.createElement("div");

    block.className =
        "stack-block";

    block.style.width =
        "130px";

    block.style.left =
        "0";

    block.style.bottom =
        stackHeight * 27 + "px";

    $("stack-area")
        .appendChild(block);

    window.currentStack =
        block;

}


function dropStack() {

    if (!currentStack) return;

    const previous =
        stackBlocks.at(-1);

    if (
        previous &&
        Math.abs(
            parseInt(
                currentStack.style.left
            ) -
            parseInt(
                previous.style.left
            )
        ) > 105
    ) {

        currentStack.remove();

        clearInterval(
            stackTimer
        );

        recordScore(
            "stack",
            stackHeight,
            Math.floor(
                stackHeight / 2
            )
        );

        return;

    }

    stackBlocks.push(
        currentStack
    );

    stackHeight++;

    $("stack-score")
        .textContent =
        stackHeight;

    addCoins(1);

    stackSpawn();

}


/* =========================================================
   DODGE
   ========================================================= */

function buildDodge(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="dodge-score">0</span>

        </div>

        <canvas
            class="game-canvas"
            id="dodge-canvas"
            width="300"
            height="400"
        ></canvas>

        <div class="controls">

            <button onclick="moveDodge(-1)">←</button>
            <button onclick="moveDodge(1)">→</button>

        </div>

        <button
            class="game-button"
            onclick="startDodge()"
        >
            Restart
        </button>

    `;

    startDodge();

}


function startDodge() {

    clearInterval(
        window.dodgeTimer
    );

    const canvas =
        $("dodge-canvas");

    const context =
        canvas.getContext("2d");

    window.dp = 130;
    window.db = [];
    window.ds = 0;

    window.dodgeTimer =
        setInterval(() => {

            context.fillStyle =
                "#080c14";

            context.fillRect(
                0,
                0,
                300,
                400
            );


            if (Math.random() < .05) {

                db.push({

                    x:
                        Math.random() *
                        270,

                    y: -30,

                    v:
                        3 +
                        Math.random() * 3

                });

            }


            db.forEach(object => {

                object.y += object.v;

            });


            context.fillStyle =
                "#38bdf8";

            context.fillRect(
                dp,
                360,
                40,
                22
            );


            context.fillStyle =
                "#ff5575";

            db.forEach(object => {

                context.fillRect(
                    object.x,
                    object.y,
                    30,
                    30
                );


                if (

                    object.x < dp + 40 &&
                    object.x + 30 > dp &&
                    object.y < 382 &&
                    object.y + 30 > 360

                ) {

                    clearInterval(
                        dodgeTimer
                    );

                    recordScore(
                        "dodge",
                        Math.floor(
                            ds / 10
                        ),
                        Math.floor(
                            ds / 100
                        )
                    );

                }

            });


            ds++;

            $("dodge-score")
                .textContent =
                Math.floor(
                    ds / 10
                );

        }, 30);

}


function moveDodge(direction) {

    window.dp =
        Math.max(
            0,
            Math.min(
                260,
                dp + direction * 30
            )
        );

}


/* =========================================================
   ROAD RUSH
   ========================================================= */

function buildRoad(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Distance
            <span id="road-score">0</span>

        </div>

        <canvas
            class="game-canvas"
            id="road-canvas"
            width="300"
            height="400"
        ></canvas>

        <div class="controls">

            <button onclick="moveRoad(-1)">←</button>
            <button onclick="moveRoad(1)">→</button>

        </div>

        <button
            class="game-button"
            onclick="startRoad()"
        >
            Restart
        </button>

    `;

    startRoad();

}


function startRoad() {

    clearInterval(
        window.roadTimer
    );

    const canvas =
        $("road-canvas");

    const context =
        canvas.getContext("2d");

    window.rl = 1;
    window.rc = [];
    window.rs = 0;

    const car =
        new Image();

    car.src =
        "images/car.png";

    window.roadTimer =
        setInterval(() => {

            context.fillStyle =
                "#273238";

            context.fillRect(
                0,
                0,
                300,
                400
            );


            context.strokeStyle =
                "#ffffff";

            for (
                let y = 0;
                y < 400;
                y += 50
            ) {

                context.beginPath();

                context.moveTo(
                    100,
                    y
                );

                context.lineTo(
                    100,
                    y + 25
                );

                context.stroke();


                context.beginPath();

                context.moveTo(
                    200,
                    y
                );

                context.lineTo(
                    200,
                    y + 25
                );

                context.stroke();

            }


            if (Math.random() < .035) {

                rc.push({

                    l:
                        Math.floor(
                            Math.random() * 3
                        ),

                    y: -60

                });

            }


            rc.forEach(object => {

                object.y += 4;

            });


            context.fillStyle =
                "#ff5575";

            rc.forEach(object => {

                context.fillRect(
                    object.l * 100 + 25,
                    object.y,
                    50,
                    70
                );


                if (
                    object.l === rl &&
                    object.y > 315 &&
                    object.y < 390
                ) {

                    clearInterval(
                        roadTimer
                    );

                    recordScore(
                        "road",
                        Math.floor(
                            rs / 10
                        ),
                        Math.floor(
                            rs / 100
                        )
                    );

                }

            });


            if (car.complete) {

                context.drawImage(
                    car,
                    rl * 100 + 25,
                    325,
                    50,
                    70
                );

            } else {

                context.fillStyle =
                    "#38bdf8";

                context.fillRect(
                    rl * 100 + 25,
                    325,
                    50,
                    70
                );

            }


            rs++;

            $("road-score")
                .textContent =
                Math.floor(
                    rs / 10
                );

        }, 30);

}


function moveRoad(direction) {

    window.rl =
        Math.max(
            0,
            Math.min(
                2,
                rl + direction
            )
        );

}


/* =========================================================
   SPACE
   ========================================================= */

function buildSpace(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="space-score">0</span>

        </div>

        <canvas
            class="game-canvas"
            id="space-canvas"
            width="300"
            height="400"
        ></canvas>

        <div class="controls">

            <button onclick="moveSpace(-1)">←</button>
            <button onclick="shootSpace()">🚀</button>
            <button onclick="moveSpace(1)">→</button>

        </div>

        <button
            class="game-button"
            onclick="startSpace()"
        >
            Restart
        </button>

    `;

    startSpace();

}


function startSpace() {

    clearInterval(
        window.spaceTimer
    );

    const canvas =
        $("space-canvas");

    const context =
        canvas.getContext("2d");

    window.sp = 135;
    window.bullets = [];
    window.enemies = [];
    window.ss = 0;

    window.spaceTimer =
        setInterval(() => {

            context.fillStyle =
                "#050812";

            context.fillRect(
                0,
                0,
                300,
                400
            );


            if (Math.random() < .035) {

                enemies.push({

                    x:
                        Math.random() *
                        270,

                    y: -20

                });

            }


            bullets.forEach(
                bullet => {
                    bullet.y -= 7;
                }
            );


            enemies.forEach(
                enemy => {
                    enemy.y += 2;
                }
            );


            bullets.forEach(bullet => {

                enemies.forEach(enemy => {

                    if (

                        bullet.x > enemy.x &&
                        bullet.x < enemy.x + 30 &&
                        bullet.y > enemy.y &&
                        bullet.y < enemy.y + 20

                    ) {

                        enemy.dead = true;
                        bullet.dead = true;

                        ss += 10;

                    }

                });

            });


            bullets =
                bullets.filter(
                    bullet =>
                        !bullet.dead &&
                        bullet.y > 0
                );


            enemies =
                enemies.filter(
                    enemy =>
                        !enemy.dead &&
                        enemy.y < 420
                );


            context.fillStyle =
                "#38bdf8";

            context.fillRect(
                sp,
                365,
                30,
                20
            );


            context.fillStyle =
                "#ffd166";

            bullets.forEach(bullet => {

                context.fillRect(
                    bullet.x,
                    bullet.y,
                    4,
                    12
                );

            });


            context.fillStyle =
                "#ff5575";

            enemies.forEach(enemy => {

                context.fillRect(
                    enemy.x,
                    enemy.y,
                    30,
                    20
                );

            });


            $("space-score")
                .textContent =
                ss;

        }, 30);

}


function moveSpace(direction) {

    window.sp =
        Math.max(
            0,
            Math.min(
                270,
                sp + direction * 25
            )
        );

}


function shootSpace() {

    if (!window.bullets) return;

    bullets.push({

        x: sp + 13,

        y: 360

    });

}


/* =========================================================
   COIN CATCHER
   ========================================================= */

function buildCoins(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Caught
            <span id="catch-score">0</span>

        </div>

        <canvas
            class="game-canvas"
            id="catch-canvas"
            width="300"
            height="400"
        ></canvas>

        <div class="controls">

            <button onclick="moveCatcher(-1)">←</button>
            <button onclick="moveCatcher(1)">→</button>

        </div>

        <button
            class="game-button"
            onclick="startCoins()"
        >
            Restart
        </button>

    `;

    startCoins();

}


function startCoins() {

    clearInterval(
        window.catchTimer
    );

    const canvas =
        $("catch-canvas");

    const context =
        canvas.getContext("2d");

    window.cp = 130;
    window.co = [];
    window.cs = 0;

    window.catchTimer =
        setInterval(() => {

            context.fillStyle =
                "#09101b";

            context.fillRect(
                0,
                0,
                300,
                400
            );


            if (Math.random() < .05) {

                co.push({

                    x:
                        Math.random() *
                        280,

                    y: -20,

                    type:
                        Math.random() < .8
                            ? "coin"
                            : "hazard"

                });

            }


            co.forEach(object => {

                object.y += 4;

            });


            co.forEach(object => {

                if (

                    object.y > 350 &&
                    object.y < 400 &&
                    object.x > cp - 20 &&
                    object.x < cp + 60

                ) {

                    object.hit = true;


                    if (
                        object.type === "coin"
                    ) {

                        cs += 5;

                        addCoins(1);

                    } else {

                        cs =
                            Math.max(
                                0,
                                cs - 10
                            );

                    }

                }

            });


            co =
                co.filter(
                    object =>
                        !object.hit &&
                        object.y < 420
                );


            context.font =
                "22px Arial";

            co.forEach(object => {

                context.fillText(
                    object.type === "coin"
                        ? "🪙"
                        : "💣",
                    object.x,
                    object.y
                );

            });


            context.fillStyle =
                "#38bdf8";

            context.fillRect(
                cp,
                370,
                60,
                20
            );


            $("catch-score")
                .textContent =
                cs;

        }, 30);

}


function moveCatcher(direction) {

    window.cp =
        Math.max(
            0,
            Math.min(
                240,
                cp + direction * 25
            )
        );

}


/* =========================================================
   MINES
   ========================================================= */

function buildMines(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Gems found
            <span id="mine-score">0</span>
            /8

        </div>

        <div
            class="memory-grid"
            id="mine-grid"
        ></div>

        <p
            class="game-message"
            id="mine-msg"
        >
            Find 8 gems. Avoid traps.
        </p>

        <button
            class="game-button"
            onclick="
                buildMines(
                    document.getElementById(
                        'game-stage'
                    )
                )
            "
        >
            New Board
        </button>

    `;


    const cells =
        [...Array(16).keys()]
            .sort(
                () => Math.random() - .5
            );


    const traps =
        new Set(
            cells.slice(0, 5)
        );


    const grid =
        $("mine-grid");


    for (
        let index = 0;
        index < 16;
        index++
    ) {

        const button =
            document.createElement("button");

        button.className =
            "memory-card";

        button.textContent =
            "?";


        button.onclick = () => {

            if (button.disabled) return;

            button.disabled = true;


            if (traps.has(index)) {

                button.textContent =
                    "💥";

                $("mine-msg")
                    .textContent =
                    "Trap! Start a new board.";

                grid
                    .querySelectorAll("button")
                    .forEach(
                        item =>
                            item.disabled = true
                    );

            } else {

                button.textContent =
                    "💎";

                button.classList.add(
                    "revealed"
                );


                const number =
                    Number(
                        $("mine-score")
                            .textContent
                    ) + 1;


                $("mine-score")
                    .textContent =
                    number;

                addCoins(3);


                if (number === 8) {

                    $("mine-msg")
                        .textContent =
                        "Perfect sweep! 🏆";

                    recordScore(
                        "mines",
                        8,
                        30
                    );

                }

            }

        };


        grid.appendChild(button);

    }

}


/* =========================================================
   SPEED TYPE
   ========================================================= */

function buildTyping(stage) {

    const words = [

        "pixel",
        "phone",
        "rocket",
        "coffee",
        "sunset",
        "game",
        "music",
        "purple",
        "castle",
        "dragon",
        "future",
        "button"

    ];


    const word =
        words[
            Math.floor(
                Math.random() *
                words.length
            )
        ];


    let start = 0;


    stage.innerHTML = `

        <div class="game-score">
            Speed Type
        </div>

        <p class="game-message">
            Type the word exactly.
        </p>

        <h1
            style="
            text-align:center;
            margin:30px;
            "
        >
            ${word}
        </h1>

        <input
            class="number-input"
            id="type-input"
            placeholder="Type here"
        >

        <button
            class="game-button"
            id="type-submit"
        >
            Submit
        </button>

        <p
            class="game-message"
            id="type-msg"
        ></p>

    `;


    $("type-input").focus();


    $("type-input").oninput = () => {

        if (!start) {

            start =
                performance.now();

        }

    };


    $("type-submit").onclick = () => {

        if (
            $("type-input").value === word
        ) {

            const seconds =
                (
                    (
                        performance.now() -
                        start
                    ) /
                    1000
                ).toFixed(2);


            $("type-msg")
                .textContent =
                `Correct in ${seconds}s!`;


            recordScore(
                "typing",
                Math.max(
                    1,
                    Math.round(
                        100 /
                        Math.max(
                            .01,
                            seconds
                        )
                    )
                ),
                Math.max(
                    2,
                    Math.round(
                        20 /
                        Math.max(
                            .01,
                            seconds
                        )
                    )
                )
            );

        } else {

            $("type-msg")
                .textContent =
                "Not quite!";

        }

    };

}


/* =========================================================
   MATH RUSH
   ========================================================= */

function buildMath(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="math-score">0</span>

        </div>

        <p
            class="game-message"
            id="math-question"
        ></p>

        <input
            class="number-input"
            id="math-input"
            type="number"
            placeholder="Answer"
        >

        <button
            class="game-button"
            onclick="answerMath()"
        >
            Answer
        </button>

        <p
            class="game-message"
            id="math-msg"
        ></p>

    `;

    newMath();

}


function newMath() {

    window.ma =
        Math.floor(
            Math.random() * 12
        ) + 2;

    window.mb =
        Math.floor(
            Math.random() * 12
        ) + 2;

    window.mop =
        Math.random() < .5
            ? "+"
            : "×";

    $("math-question")
        .textContent =
        `${ma} ${mop} ${mb} = ?`;

    $("math-input").value = "";

}


function answerMath() {

    const answer =
        mop === "+"
            ? ma + mb
            : ma * mb;


    if (
        Number(
            $("math-input").value
        ) === answer
    ) {

        $("math-score")
            .textContent =
            Number(
                $("math-score")
                    .textContent
            ) + 1;

        addCoins(3);

        $("math-msg")
            .textContent =
            "Correct!";

        newMath();

    } else {

        $("math-msg")
            .textContent =
            "Try again.";

    }

}


/* =========================================================
   BRICK BREAKER
   ========================================================= */

function buildBricks(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="brick-score">0</span>

        </div>

        <canvas
            class="game-canvas"
            id="brick-canvas"
            width="300"
            height="300"
        ></canvas>

        <button
            class="game-button"
            onclick="startBricks()"
        >
            Restart
        </button>

    `;

    startBricks();

}


function startBricks() {

    clearInterval(
        window.brickTimer
    );

    const canvas =
        $("brick-canvas");

    if (!canvas) return;

    const context =
        canvas.getContext("2d");

    let ballX = 150;
    let ballY = 260;

    let dx = 2.5;
    let dy = -2.5;

    let paddle = 115;
    let score = 0;

    const bricks = [];


    for (
        let row = 0;
        row < 4;
        row++
    ) {

        for (
            let column = 0;
            column < 6;
            column++
        ) {

            bricks.push({

                x:
                    10 +
                    column * 47,

                y:
                    30 +
                    row * 25,

                active: true

            });

        }

    }


    canvas.onmousemove =
        event => {

            const rect =
                canvas.getBoundingClientRect();

            paddle =
                event.clientX -
                rect.left -
                35;

            paddle =
                Math.max(
                    0,
                    Math.min(
                        230,
                        paddle
                    )
                );

        };


    window.brickTimer =
        setInterval(() => {

            context.fillStyle =
                "#080c14";

            context.fillRect(
                0,
                0,
                300,
                300
            );


            context.fillStyle =
                "#765cff";

            bricks.forEach(brick => {

                if (brick.active) {

                    context.fillRect(
                        brick.x,
                        brick.y,
                        40,
                        17
                    );

                }

            });


            context.fillStyle =
                "#ffffff";

            context.fillRect(
                paddle,
                280,
                70,
                8
            );


            context.beginPath();

            context.arc(
                ballX,
                ballY,
                6,
                0,
                Math.PI * 2
            );

            context.fill();


            ballX += dx;
            ballY += dy;


            if (
                ballX < 6 ||
                ballX > 294
            ) {

                dx *= -1;

            }


            if (ballY < 6) {

                dy *= -1;

            }


            if (
                ballY > 270 &&
                ballX > paddle &&
                ballX < paddle + 70
            ) {

                dy =
                    -Math.abs(dy);

            }


            bricks.forEach(brick => {

                if (

                    brick.active &&

                    ballX > brick.x &&
                    ballX < brick.x + 40 &&
                    ballY > brick.y &&
                    ballY < brick.y + 17

                ) {

                    brick.active = false;

                    dy *= -1;

                    score += 10;

                    addCoins(1);

                    $("brick-score")
                        .textContent =
                        score;

                }

            });


            if (ballY > 300) {

                clearInterval(
                    brickTimer
                );

                recordScore(
                    "bricks",
                    score,
                    Math.floor(
                        score / 10
                    )
                );

            }

        }, 16);

}


/* =========================================================
   PONG
   ========================================================= */

function buildPong(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="pong-score">0</span>

        </div>

        <canvas
            class="game-canvas"
            id="pong-canvas"
            width="300"
            height="300"
        ></canvas>

        <p class="game-message">
            Move the mouse to control your paddle.
        </p>

        <button
            class="game-button"
            onclick="startPong()"
        >
            Restart
        </button>

    `;

    startPong();

}


function startPong() {

    clearInterval(
        window.pongTimer
    );

    const canvas =
        $("pong-canvas");

    if (!canvas) return;

    const context =
        canvas.getContext("2d");

    let playerY = 120;
    let enemyY = 120;

    let ballX = 150;
    let ballY = 150;

    let dx = 3;
    let dy = 2;

    let score = 0;


    canvas.onmousemove =
        event => {

            const rect =
                canvas.getBoundingClientRect();

            playerY =
                event.clientY -
                rect.top -
                30;

            playerY =
                Math.max(
                    0,
                    Math.min(
                        240,
                        playerY
                    )
                );

        };


    window.pongTimer =
        setInterval(() => {

            context.fillStyle =
                "#080c14";

            context.fillRect(
                0,
                0,
                300,
                300
            );


            enemyY +=
                (
                    ballY -
                    (enemyY + 30)
                ) * .04;


            ballX += dx;
            ballY += dy;


            if (
                ballY < 5 ||
                ballY > 295
            ) {

                dy *= -1;

            }


            if (
                ballX < 20 &&
                ballY > playerY &&
                ballY < playerY + 60
            ) {

                dx =
                    Math.abs(dx);

                score++;

            }


            if (
                ballX > 280 &&
                ballY > enemyY &&
                ballY < enemyY + 60
            ) {

                dx =
                    -Math.abs(dx);

            }


            if (
                ballX < 0 ||
                ballX > 300
            ) {

                ballX = 150;
                ballY = 150;

            }


            context.fillStyle =
                "#ffffff";

            context.fillRect(
                8,
                playerY,
                8,
                60
            );

            context.fillRect(
                284,
                enemyY,
                8,
                60
            );


            context.beginPath();

            context.arc(
                ballX,
                ballY,
                6,
                0,
                Math.PI * 2
            );

            context.fill();


            $("pong-score")
                .textContent =
                score;

        }, 16);

}


/* =========================================================
   2048
   ========================================================= */

function build2048(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="s2048">0</span>

        </div>

        <div
            class="grid2048"
            id="grid2048"
        ></div>

        <p class="game-message">
            Use arrow keys.
        </p>

        <button
            class="game-button"
            onclick="start2048()"
        >
            Restart
        </button>

    `;

    start2048();

}


function start2048() {

    window.b2048 =
        Array(16).fill(0);

    window.sc2048 =
        0;

    addTile2048();
    addTile2048();

    draw2048();

}


function addTile2048() {

    const empty =
        b2048
            .map(
                (value, index) =>
                    value
                        ? null
                        : index
            )
            .filter(
                value =>
                    value !== null
            );


    if (!empty.length) return;


    b2048[
        empty[
            Math.floor(
                Math.random() *
                empty.length
            )
        ]
    ] =
        Math.random() < .9
            ? 2
            : 4;

}


function draw2048() {

    const grid =
        $("grid2048");

    if (!grid) return;

    grid.innerHTML = "";


    b2048.forEach(value => {

        const tile =
            document.createElement("div");

        tile.className =
            "tile2048";

        tile.textContent =
            value || "";

        grid.appendChild(tile);

    });


    $("s2048").textContent =
        sc2048;

}


function move2048(direction) {

    let next =
        Array(16).fill(0);

    function slide(values) {

        values =
            values.filter(Boolean);

        for (
            let index = 0;
            index < values.length - 1;
            index++
        ) {

            if (
                values[index] ===
                values[index + 1]
            ) {

                values[index] *= 2;

                sc2048 +=
                    values[index];

                values[index + 1] =
                    0;

            }

        }

        values =
            values.filter(Boolean);

        while (
            values.length < 4
        ) {

            values.push(0);

        }

        return values;

    }


    for (
        let line = 0;
        line < 4;
        line++
    ) {

        let values = [];


        for (
            let index = 0;
            index < 4;
            index++
        ) {

            values.push(

                direction === "left" ||
                direction === "right"

                    ? b2048[
                        line * 4 +
                        index
                    ]

                    : b2048[
                        index * 4 +
                        line
                    ]

            );

        }


        if (
            direction === "right" ||
            direction === "down"
        ) {

            values.reverse();

        }


        values =
            slide(values);


        if (
            direction === "right" ||
            direction === "down"
        ) {

            values.reverse();

        }


        for (
            let index = 0;
            index < 4;
            index++
        ) {

            const position =
                direction === "left" ||
                direction === "right"

                    ? line * 4 + index

                    : index * 4 + line;


            next[position] =
                values[index];

        }

    }


    const moved =
        next.some(
            (value, index) =>
                value !==
                b2048[index]
        );


    if (moved) {

        b2048 = next;

        addTile2048();

        draw2048();


        if (
            b2048.includes(2048)
        ) {

            addCoins(100);

            toast(
                "🏆 2048 reached!"
            );

        }

    }

}


document.addEventListener(
    "keydown",
    event => {

        const directions = {

            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right"

        };


        if (
            directions[event.key] &&
            window.b2048
        ) {

            event.preventDefault();

            move2048(
                directions[event.key]
            );

        }


        if (
            event.key === "ArrowLeft" &&
            typeof moveDodge === "function"
        ) {

            moveDodge(-1);

        }


        if (
            event.key === "ArrowRight" &&
            typeof moveDodge === "function"
        ) {

            moveDodge(1);

        }


        if (
            event.code === "Space" &&
            $("game-title") &&
            $("game-title").textContent ===
            "Space Defender"
        ) {

            event.preventDefault();

            shootSpace();

        }

    }
);


/* =========================================================
   STORE
   ========================================================= */

const products = [

    {
        id: "double",
        icon: "⚡",
        name: "Double Clicker",
        desc: "Double clicker rewards.",
        price: 100
    },

    {
        id: "neon",
        icon: "🌈",
        name: "Neon Theme",
        desc: "Unlock the glowing theme.",
        price: 250
    },

    {
        id: "badge",
        icon: "⭐",
        name: "Pro Badge",
        desc: "Become a Pro player.",
        price: 500
    },

    {
        id: "coinBoost",
        icon: "🪙",
        name: "Coin Booster",
        desc: "Double all coin rewards.",
        price: 750
    }

];


function renderStore() {

    const box =
        $("store-list");

    if (!box) return;

    box.innerHTML = "";


    products.forEach(product => {

        const owned =
            state.owned[product.id];

        const item =
            document.createElement("div");

        item.className =
            "store-item";

        item.innerHTML = `

            <div class="store-icon">
                ${product.icon}
            </div>

            <div class="store-info">

                <b>${product.name}</b>

                <p>${product.desc}</p>

            </div>

            <button class="buy">
                ${
                    owned
                        ? "OWNED"
                        : product.price + " 🪙"
                }
            </button>

        `;


        item
            .querySelector(".buy")
            .onclick = () => {

                if (owned) return;


                if (
                    state.coins <
                    product.price
                ) {

                    toast(
                        "Not enough coins"
                    );

                    return;

                }


                state.coins -=
                    product.price;

                state.owned[
                    product.id
                ] = true;


                if (
                    product.id === "neon"
                ) {

                    state.neon = true;

                }


                save();
                applySettings();
                updateUI();

                toast(
                    "🛍️ Purchase complete!"
                );

            };


        box.appendChild(item);

    });

}


/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const achievements = [

    {
        id: "first",
        icon: "🌱",
        name: "First Coins",
        desc: "Earn your first coin.",
        ok: () => state.coins >= 1
    },

    {
        id: "hundred",
        icon: "💯",
        name: "Coin Century",
        desc: "Reach 100 coins.",
        ok: () => state.coins >= 100
    },

    {
        id: "level5",
        icon: "⭐",
        name: "Level 5",
        desc: "Reach level 5.",
        ok: () => level() >= 5
    },

    {
        id: "gamer",
        icon: "🎮",
        name: "Gamer",
        desc: "Play 5 different games.",
        ok: () =>
            Object.keys(
                state.highScores
            ).length >= 5
    },

    {
        id: "memory",
        icon: "🧠",
        name: "Memory Master",
        desc: "Clear Memory Match.",
        ok: () =>
            state.highScores.memory >= 8
    },

    {
        id: "tower",
        icon: "🏗️",
        name: "Tower Builder",
        desc: "Stack 10 blocks.",
        ok: () =>
            state.highScores.stack >= 10
    },

    {
        id: "two048",
        icon: "🔢",
        name: "Big Number",
        desc: "Reach 2048.",
        ok: () =>
            state.highScores["2048"] >= 2048
    },

    {
        id: "rich",
        icon: "💎",
        name: "Digital Rich",
        desc: "Reach 1,000 coins.",
        ok: () =>
            state.coins >= 1000
    }

];


function checkAchievements() {

    achievements.forEach(achievement => {

        if (

            !state.achievements.includes(
                achievement.id
            ) &&

            achievement.ok()

        ) {

            state.achievements.push(
                achievement.id
            );

            toast(
                "🏆 " +
                achievement.name +
                " unlocked!"
            );

        }

    });

}


function renderAchievements() {

    const box =
        $("achievements");

    if (!box) return;

    box.innerHTML = "";


    achievements.forEach(achievement => {

        const unlocked =
            state.achievements.includes(
                achievement.id
            );

        const item =
            document.createElement("div");

        item.className =
            "achievement" +
            (
                unlocked
                    ? ""
                    : " locked"
            );

        item.innerHTML = `

            <span>${achievement.icon}</span>

            <b>${achievement.name}</b>

            <small>${achievement.desc}</small>

        `;

        box.appendChild(item);

    });


    if ($("achievement-count")) {

        $("achievement-count")
            .textContent =
            `${state.achievements.length}/${achievements.length}`;

    }

}


/* =========================================================
   UI
   ========================================================= */

function updateUI() {

    const currentLevel =
        level();


    [
        "home-coins",
        "games-coins",
        "store-coins"
    ].forEach(id => {

        if ($(id)) {

            $(id).textContent =
                Math.floor(
                    state.coins
                );

        }

    });


    if ($("home-level")) {

        $("home-level").textContent =
            currentLevel;

    }


    if ($("hero-level")) {

        $("hero-level").textContent =
            currentLevel;

    }


    if ($("games-level")) {

        $("games-level").textContent =
            currentLevel;

    }


    if ($("profile-level")) {

        $("profile-level").textContent =
            currentLevel;

    }


    if ($("home-xp")) {

        $("home-xp").textContent =
            state.xp;

    }


    if ($("profile-xp")) {

        $("profile-xp").textContent =
            `${state.xp} / 100 XP`;

    }


    if ($("profile-progress")) {

        $("profile-progress")
            .style.width =
            state.xp + "%";

    }


    if ($("quest-progress")) {

        $("quest-progress")
            .style.width =
            Math.min(
                100,
                state.questCoins
            ) + "%";

    }


    if ($("streak")) {

        $("streak").textContent =
            state.streak;

    }


    if ($("profile-badge")) {

        $("profile-badge")
            .textContent =
            state.owned.badge
                ? "SlotPhone Pro"
                : "Rookie";

    }


    if ($("games-best")) {

        const scores =
            Object.values(
                state.highScores
            );

        $("games-best")
            .textContent =
            scores.length
                ? Math.max(...scores)
                : 0;

    }


    if ($("note-count")) {

        $("note-count")
            .textContent =
            state.notes.length +
            " characters";

    }


    updateSettingButton(
        "dark-toggle",
        state.dark
    );

    updateSettingButton(
        "neon-toggle",
        state.neon
    );

    updateSettingButton(
        "sound-toggle",
        state.sound
    );

    updateSettingButton(
        "notify-toggle",
        state.notifications
    );


    renderStore();
    renderAchievements();


    renderGames(
        document
            .querySelector(".filter.active")
            ?.dataset.filter ||
        "all"
    );

    renderGameApps();


    applySettings();

}


function updateSettingButton(
    id,
    enabled
) {

    const button =
        $(id);

    if (!button) return;

    button.textContent =
        enabled
            ? "ON"
            : "OFF";

    button.className =
        enabled
            ? "on"
            : "";

}


function applySettings() {

    document.body.classList.toggle(
        "light",
        !state.dark
    );

    document.body.classList.toggle(
        "neon",
        state.neon
    );

}


/* =========================================================
   SETTINGS
   ========================================================= */

if ($("dark-toggle")) {

    $("dark-toggle").onclick = () => {

        state.dark =
            !state.dark;

        save();
        updateUI();

    };

}


if ($("neon-toggle")) {

    $("neon-toggle").onclick = () => {

        state.neon =
            !state.neon;

        save();
        updateUI();

    };

}


if ($("sound-toggle")) {

    $("sound-toggle").onclick = () => {

        state.sound =
            !state.sound;

        save();
        updateUI();

    };

}


if ($("notify-toggle")) {

    $("notify-toggle").onclick = () => {

        state.notifications =
            !state.notifications;

        save();
        updateUI();

    };

}


if ($("reset-data")) {

    $("reset-data").onclick = () => {

        if (
            confirm(
                "Reset all SlotPhone progress?"
            )
        ) {

            localStorage.removeItem(
                SAVE_KEY
            );

            location.reload();

        }

    };

}


/* =========================================================
   NOTES
   ========================================================= */

if ($("notes-area")) {

    $("notes-area").value =
        state.notes;


    $("notes-area").oninput =
        event => {

            state.notes =
                event.target.value;

            save();

            const status =
                document.querySelector(".save-status");

            if (status) {
                status.textContent = "Saved on this device";
            }

        };

}


function noteAction(action) {

    const notes =
        $("notes-area");

    if (!notes) return;


    if (action === "clear") {

        notes.value = "";

    }


    if (action === "bold") {

        notes.value +=
            "\n** ";

    }


    if (action === "star") {

        notes.value +=
            "\n⭐ ";

    }


    if (action === "date") {

        notes.value +=
            "\n" +
            new Date()
                .toLocaleDateString();

    }


    state.notes =
        notes.value;

    save();
    updateUI();

}


/* =========================================================
   CALCULATOR
   ========================================================= */

let calculation = "";


function calcAction(value) {

    if (value === "clear") {

        calculation = "";

    }

    else if (value === "delete" || value === "back") {

        calculation =
            calculation.slice(
                0,
                -1
            );

    }

    else if (value === "=") {

        try {

            if (
                !/^[0-9+\-*/%.() ]+$/
                    .test(
                        calculation
                    )
            ) {

                throw new Error();

            }

            calculation =
                String(
                    Function(
                        '"use strict";return(' +
                        calculation +
                        ')'
                    )()
                );

        } catch {

            calculation =
                "Error";

        }

    }

    else {

        if (calculation === "Error") {
            calculation = "";
        }

        calculation +=
            value;

    }


    if ($("calc-display")) {

        $("calc-display")
            .value =
            calculation ||
            "0";

    }

}


/* =========================================================
   SLOTIFY
   ========================================================= */

const songs = [

    {
        title: "Midnight Drive",
        artist: "SlotPhone Studios",
        file: "music/1.mp3",
        image: "images/1.jpg"
    },

    {
        title: "Pixel Dreams",
        artist: "Digital Waves",
        file: "music/2.mp3",
        image: "images/2.jpg"
    },

    {
        title: "Cloud Nine",
        artist: "Skyline",
        file: "music/3.mp3",
        image: "images/3.jpg"
    },

    {
        title: "Sunset Loop",
        artist: "Neon Nights",
        file: "music/4.mp3",
        image: "images/4.jpg"
    },

    {
        title: "Space Station",
        artist: "Orbit Music",
        file: "music/5.mp3",
        image: "images/5.jpg"
    },

    {
        title: "Electric Highway",
        artist: "Future Sound",
        file: "music/6.mp3",
        image: "images/6.jpg"
    }

];


let song =
    state.lastSong || 0;

let playing = false;

let musicFilterMode =
    "all";

let musicSearch =
    "";

const audio =
    $("music-audio");


if (audio) {

    audio.volume =
        state.volume;

}


/* =========================================================
   MUSIC HELPERS
   ========================================================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds)
    ) {

        return "0:00";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        Math.floor(
            seconds % 60
        );

    return (
        minutes +
        ":" +
        String(
            remaining
        ).padStart(
            2,
            "0"
        )
    );

}


function loadSong(
    index,
    autoplay = false
) {

    if (!songs[index]) {
        index = 0;
    }

    song = index;

    const current =
        songs[song];

    state.lastSong =
        song;

    save();


    if ($("song-name")) {

        $("song-name")
            .textContent =
            current.title;

    }


    if ($("song-artist")) {

        $("song-artist")
            .textContent =
            current.artist;

    }


    if ($("song-image")) {

        $("song-image").src =
            current.image;

        $("song-image").alt =
            current.title +
            " album artwork";

    }


    if (audio) {

        audio.src =
            current.file;

        audio.load();

    }


    updateFavoriteButton();
    renderPlaylist();


    if (autoplay) {

        playMusic();

    } else {

        setMusicPlayingUI(false);

    }


    if ($("music-status")) {

        $("music-status")
            .textContent =
            autoplay
                ? "Playing"
                : "Ready to play";

    }

}


async function playMusic() {

    if (!audio) return;

    try {

        await audio.play();

        playing = true;

        setMusicPlayingUI(true);

        if ($("music-status")) {

            $("music-status")
                .textContent =
                "Now playing";

        }

    } catch {

        if ($("music-status")) {

            $("music-status")
                .textContent =
                "Add an MP3 to the music folder";

        }

        playing = false;

        setMusicPlayingUI(false);

    }

}


function pauseMusic() {

    if (!audio) return;

    audio.pause();

    playing = false;

    setMusicPlayingUI(false);

    if ($("music-status")) {

        $("music-status")
            .textContent =
            "Paused";

    }

}


function toggleMusic() {

    if (playing) {

        pauseMusic();

    } else {

        playMusic();

    }

}


function setMusicPlayingUI(isPlaying) {

    playing =
        isPlaying;


    const button =
        $("play-song");

    if (button) {

        button.textContent =
            isPlaying
                ? "⏸"
                : "▶";

    }


    const bars =
        $("playing-bars");

    if (bars) {

        bars.classList.toggle(
            "active",
            isPlaying
        );

    }


    const image =
        $("song-image");

    if (image) {

        image.classList.toggle(
            "playing",
            isPlaying
        );

    }

}


/* =========================================================
   MUSIC NEXT / PREVIOUS
   ========================================================= */

function nextSong() {

    if (state.shuffle) {

        let randomIndex;

        do {

            randomIndex =
                Math.floor(
                    Math.random() *
                    songs.length
                );

        } while (
            songs.length > 1 &&
            randomIndex === song
        );

        loadSong(
            randomIndex,
            true
        );

        return;

    }


    song++;

    if (
        song >= songs.length
    ) {

        song = 0;

    }

    loadSong(
        song,
        true
    );

}


function previousSong() {

    if (
        audio &&
        audio.currentTime > 3
    ) {

        audio.currentTime = 0;

        return;

    }


    song--;

    if (song < 0) {

        song =
            songs.length - 1;

    }

    loadSong(
        song,
        true
    );

}


/* =========================================================
   FAVORITES
   ========================================================= */

function isFavorite(index) {

    return state.favorites.includes(
        index
    );

}


function updateFavoriteButton() {

    const button =
        $("favorite-song-button");

    if (!button) return;

    const favorite =
        isFavorite(song);

    button.textContent =
        favorite
            ? "♥"
            : "♡";

    button.classList.toggle(
        "active",
        favorite
    );

}


function toggleFavorite() {

    const position =
        state.favorites.indexOf(
            song
        );


    if (position >= 0) {

        state.favorites.splice(
            position,
            1
        );

        toast(
            "Removed from favorites"
        );

    } else {

        state.favorites.push(
            song
        );

        toast(
            "❤️ Added to favorites"
        );

    }


    save();

    updateFavoriteButton();
    renderPlaylist();

}


/* =========================================================
   MUSIC SEARCH
   ========================================================= */

function filteredSongs() {

    return songs

        .map(
            (item, index) => ({
                ...item,
                index
            })
        )

        .filter(item => {

            const matchesSearch =
                (
                    item.title +
                    " " +
                    item.artist
                )
                    .toLowerCase()
                    .includes(
                        musicSearch
                            .toLowerCase()
                    );


            const matchesFavorite =
                musicFilterMode === "all" ||
                isFavorite(
                    item.index
                );


            return (
                matchesSearch &&
                matchesFavorite
            );

        });

}


/* =========================================================
   PLAYLIST
   ========================================================= */

function renderPlaylist() {

    const playlist =
        $("playlist");

    if (!playlist) return;

    playlist.innerHTML = "";


    const visibleSongs =
        filteredSongs();


    if ($("playlist-count")) {

        $("playlist-count")
            .textContent =
            `${visibleSongs.length} ${
                visibleSongs.length === 1
                    ? "song"
                    : "songs"
            }`;

    }


    if (
        visibleSongs.length === 0
    ) {

        playlist.innerHTML = `

            <div class="music-empty">

                <div>🎵</div>

                <h3>No songs found</h3>

                <p>
                    Try another search
                    or favorite a song.
                </p>

            </div>

        `;

        return;

    }


    visibleSongs.forEach(item => {

        const button =
            document.createElement("button");

        button.className =
            "playlist-song";


        if (
            item.index === song
        ) {

            button.classList.add(
                "active"
            );

        }


        button.innerHTML = `

            <span class="playlist-number">
                ${item.index + 1}
            </span>

            <img
                class="playlist-image"
                src="${item.image}"
                alt=""
            >

            <span class="playlist-song-info">

                <b>${item.title}</b>

                <small>${item.artist}</small>

            </span>

            ${
                isFavorite(item.index)
                    ? `
                        <span class="playlist-heart">
                            ♥
                        </span>
                    `
                    : ""
            }

            <span class="playlist-play">
                ${
                    item.index === song &&
                    playing
                        ? "♫"
                        : "▶"
                }
            </span>

        `;


        button.onclick = () => {

            loadSong(
                item.index,
                true
            );

        };


        playlist.appendChild(
            button
        );

    });

}


function playAll() {

    const visible =
        filteredSongs();

    if (!visible.length) {

        toast(
            "No songs to play"
        );

        return;

    }

    loadSong(
        visible[0].index,
        true
    );

}


function toggleShuffle() {

    state.shuffle =
        !state.shuffle;

    save();

    $("shuffle-song")
        ?.classList.toggle(
            "active",
            state.shuffle
        );

    toast(
        state.shuffle
            ? "🔀 Shuffle on"
            : "Shuffle off"
    );

}


function toggleRepeat() {

    state.repeat =
        !state.repeat;

    save();

    $("repeat-song")
        ?.classList.toggle(
            "active",
            state.repeat
        );

    toast(
        state.repeat
            ? "🔁 Repeat on"
            : "Repeat off"
    );

}


/* =========================================================
   MUSIC EVENTS
   ========================================================= */

if ($("music-search")) {

    $("music-search").addEventListener(
        "input",
        event => {

            musicSearch =
                event.target.value;

            renderPlaylist();

        }
    );

}


if ($("clear-music-search")) {

    $("clear-music-search").onclick =
        () => {

            $("music-search").value =
                "";

            musicSearch = "";

            renderPlaylist();

        };

}


if ($("favorite-song-button")) {

    $("favorite-song-button").onclick =
        toggleFavorite;

}


if ($("play-song")) {

    $("play-song").onclick =
        toggleMusic;

}


if ($("prev-song")) {

    $("prev-song").onclick =
        previousSong;

}


if ($("next-song")) {

    $("next-song").onclick =
        nextSong;

}


if ($("shuffle-song")) {

    $("shuffle-song").onclick =
        toggleShuffle;

}


if ($("repeat-song")) {

    $("repeat-song").onclick =
        toggleRepeat;

}


if ($("play-all")) {

    $("play-all").onclick =
        playAll;

}


/* =========================================================
   AUDIO EVENTS
   ========================================================= */

if (audio) {

    audio.addEventListener(
        "loadedmetadata",
        () => {

            if ($("music-duration")) {

                $("music-duration")
                    .textContent =
                    formatTime(
                        audio.duration
                    );

            }

        }
    );


    audio.addEventListener(
        "timeupdate",
        () => {

            if (
                !audio.duration
            ) return;


            const percent =
                (
                    audio.currentTime /
                    audio.duration
                ) * 100;


            if ($("music-seek")) {

                $("music-seek").value =
                    percent;

            }


            if ($("music-current")) {

                $("music-current")
                    .textContent =
                    formatTime(
                        audio.currentTime
                    );

            }

        }
    );


    audio.addEventListener(
        "play",
        () => {

            setMusicPlayingUI(true);
            renderPlaylist();

        }
    );


    audio.addEventListener(
        "pause",
        () => {

            setMusicPlayingUI(false);
            renderPlaylist();

        }
    );


    audio.addEventListener(
        "ended",
        () => {

            if (state.repeat) {

                audio.currentTime = 0;

                playMusic();

            } else {

                nextSong();

            }

        }
    );


    audio.addEventListener(
        "error",
        () => {

            setMusicPlayingUI(false);

            if ($("music-status")) {

                $("music-status")
                    .textContent =
                    "Couldn't load this MP3";

            }

        }
    );

}


/* =========================================================
   SEEK
   ========================================================= */

if ($("music-seek")) {

    $("music-seek").addEventListener(
        "input",
        event => {

            if (
                !audio ||
                !audio.duration
            ) return;

            audio.currentTime =
                (
                    Number(
                        event.target.value
                    ) / 100
                ) *
                audio.duration;

        }
    );

}


/* =========================================================
   VOLUME
   ========================================================= */

if ($("music-volume")) {

    $("music-volume").value =
        state.volume;

    $("music-volume").addEventListener(
        "input",
        event => {

            state.volume =
                Number(
                    event.target.value
                );

            if (audio) {

                audio.volume =
                    state.volume;

            }

            save();

        }
    );

}


/* =========================================================
   MUSIC MENU
   ========================================================= */

if ($("music-menu-button")) {

    $("music-menu-button").onclick =
        () => {

            $("music-menu")
                .classList.toggle(
                    "hidden"
                );

        };

}


if ($("clear-favorites")) {

    $("clear-favorites").onclick =
        () => {

            state.favorites = [];

            save();

            updateFavoriteButton();
            renderPlaylist();

            toast(
                "Favorites cleared"
            );

        };

}


if ($("reset-music")) {

    $("reset-music").onclick =
        () => {

            state.favorites = [];
            state.lastSong = 0;
            state.shuffle = false;
            state.repeat = false;
            state.volume = .70;

            song = 0;

            if (audio) {
                audio.volume = .70;
            }

            save();

            loadSong(
                0,
                false
            );

            $("shuffle-song")
                ?.classList.remove(
                    "active"
                );

            $("repeat-song")
                ?.classList.remove(
                    "active"
                );

            if ($("music-volume")) {

                $("music-volume").value =
                    .70;

            }

            toast(
                "Music settings reset"
            );

        };

}


/* =========================================================
   TIMER
   ========================================================= */

let timerSeconds = 300;
let timerRunning = false;
let timerInterval = null;


function updateTimer() {

    if (!$("timer-display")) return;

    const minutes =
        Math.floor(
            timerSeconds / 60
        );

    const seconds =
        timerSeconds % 60;


    $("timer-display")
        .textContent =
        `${String(
            minutes
        ).padStart(
            2,
            "0"
        )}:${String(
            seconds
        ).padStart(
            2,
            "0"
        )}`;

}


function setTimer(seconds) {

    timerSeconds =
        seconds;

    timerRunning =
        false;

    clearInterval(
        timerInterval
    );

    updateTimer();

}


if ($("timer-start")) {

    $("timer-start").onclick =
        () => {

            if (timerRunning) return;

            timerRunning = true;

            timerInterval =
                setInterval(
                    () => {

                        if (
                            timerSeconds <= 0
                        ) {

                            clearInterval(
                                timerInterval
                            );

                            timerRunning =
                                false;

                            toast(
                                "⏰ Timer finished!"
                            );

                            return;

                        }

                        timerSeconds--;

                        updateTimer();

                    },
                    1000
                );

        };

}


if ($("timer-pause")) {

    $("timer-pause").onclick =
        () => {

            timerRunning =
                false;

            clearInterval(
                timerInterval
            );

        };

}


if ($("timer-reset")) {

    $("timer-reset").onclick =
        () => {

            timerRunning =
                false;

            clearInterval(
                timerInterval
            );

            timerSeconds =
                300;

            updateTimer();

        };

}


/* =========================================================
   DAILY QUEST
   ========================================================= */

function updateDailyQuest() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    if (
        state.lastDaily !== today
    ) {

        state.lastDaily =
            today;

        state.questCoins = 0;

        state.streak++;

        save();

    }


    if ($("quest-text")) {

        if (state.questCoins >= 100) {

            $("quest-text")
                .textContent =
                "Quest complete! 🎉";

        } else {

            $("quest-text")
                .textContent =
                `Earn ${
                    Math.max(
                        0,
                        100 - state.questCoins
                    )
                } more coins today.`;

        }

    }

}


/* =========================================================
   START EVERYTHING
   ========================================================= */

updateDailyQuest();

loadSong(
    song,
    false
);


if ($("shuffle-song")) {

    $("shuffle-song")
        .classList.toggle(
            "active",
            state.shuffle
        );

}


if ($("repeat-song")) {

    $("repeat-song")
        .classList.toggle(
            "active",
            state.repeat
        );

}


updateTimer();

updateUI();




/* =========================================================
   SLOT PHONE X — GAMEPLAY POLISH PACK
   These upgraded builders intentionally keep the existing
   game names, rewards, controls, and save system.
   ========================================================= */


/* =========================================================
   CANVAS BACKGROUND
   ========================================================= */

function gameCanvasFrame(ctx, w, h) {

    const g =
        ctx.createLinearGradient(
            0,
            0,
            w,
            h
        );

    g.addColorStop(
        0,
        "#070914"
    );

    g.addColorStop(
        .55,
        "#101525"
    );

    g.addColorStop(
        1,
        "#05070d"
    );

    ctx.fillStyle = g;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    ctx.strokeStyle =
        "rgba(255,255,255,.045)";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < w;
        x += 25
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            h
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < h;
        y += 25
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            w,
            y
        );

        ctx.stroke();

    }

}


/* =========================================================
   ROUNDED CANVAS RECTANGLE
   ========================================================= */

function roundedCanvasRect(
    ctx,
    x,
    y,
    w,
    h,
    r
) {

    const radius =
        Math.min(
            r,
            w / 2,
            h / 2
        );


    ctx.beginPath();

    ctx.moveTo(
        x + radius,
        y
    );

    ctx.arcTo(
        x + w,
        y,
        x + w,
        y + h,
        radius
    );

    ctx.arcTo(
        x + w,
        y + h,
        x,
        y + h,
        radius
    );

    ctx.arcTo(
        x,
        y + h,
        x,
        y,
        radius
    );

    ctx.arcTo(
        x,
        y,
        x + w,
        y,
        radius
    );

    ctx.closePath();

}


/* =========================================================
   SNAKE PRO
   ========================================================= */

function buildSnake(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score

            <span id="snake-score">
                0
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="snake-canvas"
            width="330"
            height="330"
        ></canvas>


        <div class="controls">

            <button
                onclick="snakeMove('up')"
            >
                ▲
            </button>

            <button
                onclick="snakeMove('left')"
            >
                ◀
            </button>

            <button
                onclick="snakeMove('down')"
            >
                ▼
            </button>

            <button
                onclick="snakeMove('right')"
            >
                ▶
            </button>

        </div>


        <p class="game-message">

            Use the buttons or arrow keys.
            Don't hit the wall or yourself.

        </p>


        <button
            class="game-button"
            onclick="startSnakeGame()"
        >

            Restart

        </button>

    `;


    startSnakeGame();

}


function startSnakeGame() {

    clearInterval(
        window.snakeTimer
    );


    const canvas =
        $("snake-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const grid = 22;

    const cell =
        canvas.width / grid;


    window.snake = [

        {
            x: 10,
            y: 11
        },

        {
            x: 9,
            y: 11
        },

        {
            x: 8,
            y: 11
        },

        {
            x: 7,
            y: 11
        }

    ];


    window.snakeDir = {

        x: 1,

        y: 0

    };


    window.snakeNextDir = {

        x: 1,

        y: 0

    };


    window.snakeScore = 0;


    window.snakeFood =
        createSnakeFood(
            grid
        );


    drawSnake();


    window.snakeTimer =

        setInterval(

            () => {

                snakeDir =
                    snakeNextDir;


                const head =
                    snake[0];


                const next = {

                    x:
                        head.x +
                        snakeDir.x,

                    y:
                        head.y +
                        snakeDir.y

                };


                const hitWall =

                    next.x < 0 ||

                    next.x >= grid ||

                    next.y < 0 ||

                    next.y >= grid;


                const hitSelf =

                    snake.some(

                        (part, index) =>

                            index > 0 &&

                            part.x === next.x &&

                            part.y === next.y

                    );


                if (
                    hitWall ||
                    hitSelf
                ) {

                    clearInterval(
                        snakeTimer
                    );


                    recordScore(

                        "snake",

                        snakeScore,

                        Math.floor(
                            snakeScore / 10
                        )

                    );


                    showSnakeGameOver();

                    return;

                }


                snake.unshift(
                    next
                );


                if (

                    next.x ===
                    snakeFood.x &&

                    next.y ===
                    snakeFood.y

                ) {

                    snakeScore += 10;


                    snakeFood =
                        createSnakeFood(
                            grid
                        );


                    addCoins(1);

                } else {

                    snake.pop();

                }


                drawSnake();

            },

            105

        );

}


function createSnakeFood(
    grid
) {

    let food;


    do {

        food = {

            x:
                Math.floor(
                    Math.random() *
                    grid
                ),

            y:
                Math.floor(
                    Math.random() *
                    grid
                )

        };

    } while (

        window.snake &&

        snake.some(

            part =>

                part.x === food.x &&
                part.y === food.y

        )

    );


    return food;

}


function drawSnake() {

    const canvas =
        $("snake-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const grid = 22;

    const cell =
        canvas.width / grid;


    gameCanvasFrame(

        ctx,

        canvas.width,

        canvas.height

    );


    /* Food */

    const fx =
        snakeFood.x *
        cell +
        cell / 2;


    const fy =
        snakeFood.y *
        cell +
        cell / 2;


    ctx.save();


    ctx.shadowBlur = 18;

    ctx.shadowColor =
        "#ff5575";


    ctx.fillStyle =
        "#ff5575";


    ctx.beginPath();

    ctx.arc(

        fx,

        fy,

        cell * .34,

        0,

        Math.PI * 2

    );

    ctx.fill();


    ctx.restore();


    /* Snake */

    snake.forEach(

        (part, index) => {

            const x =
                part.x * cell + 2;

            const y =
                part.y * cell + 2;


            const size =
                cell - 4;


            const gradient =

                ctx.createLinearGradient(

                    x,

                    y,

                    x + size,

                    y + size

                );


            if (
                index === 0
            ) {

                gradient.addColorStop(
                    0,
                    "#8cffc1"
                );

                gradient.addColorStop(
                    1,
                    "#20c77a"
                );

            } else {

                gradient.addColorStop(
                    0,
                    "#42e89b"
                );

                gradient.addColorStop(
                    1,
                    "#168b5c"
                );

            }


            ctx.fillStyle =
                gradient;


            ctx.shadowBlur =
                index === 0
                    ? 15
                    : 5;


            ctx.shadowColor =
                "#28e08b";


            roundedCanvasRect(

                ctx,

                x,

                y,

                size,

                size,

                6

            );


            ctx.fill();


            ctx.shadowBlur = 0;


            if (
                index === 0
            ) {

                ctx.fillStyle =
                    "#06100c";


                let eye1x =
                    x + size * .68;

                let eye1y =
                    y + size * .30;


                let eye2x =
                    x + size * .68;

                let eye2y =
                    y + size * .68;


                if (
                    snakeDir.x < 0
                ) {

                    eye1x =
                        x + size * .30;

                    eye2x =
                        x + size * .30;

                }


                if (
                    snakeDir.y < 0
                ) {

                    eye1x =
                        x + size * .30;

                    eye1y =
                        y + size * .30;

                    eye2x =
                        x + size * .68;

                    eye2y =
                        y + size * .30;

                }


                if (
                    snakeDir.y > 0
                ) {

                    eye1x =
                        x + size * .30;

                    eye1y =
                        y + size * .68;

                    eye2x =
                        x + size * .68;

                    eye2y =
                        y + size * .68;

                }


                ctx.beginPath();

                ctx.arc(
                    eye1x,
                    eye1y,
                    2,
                    0,
                    Math.PI * 2
                );

                ctx.fill();


                ctx.beginPath();

                ctx.arc(
                    eye2x,
                    eye2y,
                    2,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            }

        }

    );


    const score =
        $("snake-score");


    if (score) {

        score.textContent =
            snakeScore;

    }

}


function showSnakeGameOver() {

    const canvas =
        $("snake-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    ctx.fillStyle =
        "rgba(3,5,10,.75)";


    ctx.fillRect(

        0,

        0,

        canvas.width,

        canvas.height

    );


    ctx.textAlign =
        "center";


    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        "bold 28px Arial";


    ctx.fillText(

        "GAME OVER",

        canvas.width / 2,

        canvas.height / 2 - 10

    );


    ctx.font =
        "16px Arial";


    ctx.fillStyle =
        "#aeb7c9";


    ctx.fillText(

        `Score: ${snakeScore}`,

        canvas.width / 2,

        canvas.height / 2 + 22

    );

}


function snakeMove(
    direction
) {

    const current =
        snakeDir;


    if (

        direction === "up" &&

        current.y === 0

    ) {

        snakeNextDir = {

            x: 0,

            y: -1

        };

    }


    if (

        direction === "down" &&

        current.y === 0

    ) {

        snakeNextDir = {

            x: 0,

            y: 1

        };

    }


    if (

        direction === "left" &&

        current.x === 0

    ) {

        snakeNextDir = {

            x: -1,

            y: 0

        };

    }


    if (

        direction === "right" &&

        current.x === 0

    ) {

        snakeNextDir = {

            x: 1,

            y: 0

        };

    }

}


/* =========================================================
   BRICK BREAKER PRO
   ========================================================= */

function buildBricks(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="brick-score">
                0
            </span>

            · Lives
            <span id="brick-lives">
                3
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="brick-canvas"
            width="360"
            height="460"
        ></canvas>


        <p class="game-message">

            Move your mouse or finger
            to control the paddle.

        </p>


        <button
            class="game-button"
            onclick="startBricks()"
        >

            Restart

        </button>

    `;


    startBricks();

}


function startBricks() {

    clearInterval(
        window.brickTimer
    );


    const canvas =
        $("brick-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const W =
        canvas.width;


    const H =
        canvas.height;


    window.brickState = {

        x: W / 2,

        y: H - 70,

        dx: 3.2,

        dy: -3.2,

        radius: 8,

        paddleX:
            W / 2 - 55,

        paddleWidth: 110,

        paddleHeight: 13,

        score: 0,

        lives: 3,

        bricks: []

    };


    const rows = 6;

    const cols = 7;

    const gap = 7;

    const side = 17;

    const bw =
        (W -
            side * 2 -
            gap * (cols - 1))
        / cols;


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < cols;
            col++
        ) {

            brickState.bricks.push({

                x:
                    side +
                    col *
                    (bw + gap),

                y:
                    55 +
                    row * 28,

                width:
                    bw,

                height:
                    20,

                alive: true,

                hp:
                    row < 2
                        ? 2
                        : 1

            });

        }

    }


    const movePaddle =
        event => {

            const rect =
                canvas.getBoundingClientRect();


            const scaleX =
                W / rect.width;


            brickState.paddleX =

                (event.clientX -
                    rect.left) *
                scaleX -
                brickState.paddleWidth / 2;


            brickState.paddleX =

                Math.max(

                    0,

                    Math.min(

                        W -
                        brickState.paddleWidth,

                        brickState.paddleX

                    )

                );

        };


    canvas.onmousemove =
        movePaddle;


    canvas.ontouchmove =
        event => {

            if (
                event.touches.length
            ) {

                const touch =
                    event.touches[0];


                movePaddle({

                    clientX:
                        touch.clientX

                });

            }


            event.preventDefault();

        };


    window.brickTimer =

        setInterval(

            () => {

                updateBricks();

                drawBricks();

            },

            16

        );

}


function updateBricks() {

    const s =
        brickState;


    s.x += s.dx;

    s.y += s.dy;


    if (
        s.x + s.radius >= 360 ||
        s.x - s.radius <= 0
    ) {

        s.dx *= -1;

    }


    if (
        s.y - s.radius <= 0
    ) {

        s.dy *= -1;

    }


    const paddleY =
        460 - 55;


    if (

        s.y + s.radius >=
            paddleY &&

        s.y - s.radius <=
            paddleY +
            s.paddleHeight &&

        s.x >=
            s.paddleX &&

        s.x <=
            s.paddleX +
            s.paddleWidth &&

        s.dy > 0

    ) {

        const hit =
            (
                s.x -
                (
                    s.paddleX +
                    s.paddleWidth / 2
                )
            ) /
            (
                s.paddleWidth / 2
            );


        s.dx =
            hit * 5;


        s.dy =
            -Math.abs(
                s.dy
            );

    }


    s.bricks.forEach(

        brick => {

            if (
                !brick.alive
            ) return;


            if (

                s.x + s.radius >
                brick.x &&

                s.x - s.radius <
                brick.x +
                brick.width &&

                s.y + s.radius >
                brick.y &&

                s.y - s.radius <
                brick.y +
                brick.height

            ) {

                brick.hp--;


                if (
                    brick.hp <= 0
                ) {

                    brick.alive =
                        false;

                    s.score += 10;

                    addCoins(1);

                } else {

                    s.score += 5;

                }


                s.dy *= -1;

            }

        }

    );


    if (
        s.y >
        460 +
        s.radius
    ) {

        s.lives--;


        if (
            s.lives <= 0
        ) {

            clearInterval(
                window.brickTimer
            );


            recordScore(

                "bricks",

                s.score,

                Math.floor(
                    s.score / 10
                )

            );


            return;

        }


        s.x =
            180;

        s.y =
            390;

        s.dx =
            3;

        s.dy =
            -3;

    }


    const remaining =
        s.bricks.filter(
            b => b.alive
        ).length;


    if (
        remaining === 0
    ) {

        clearInterval(
            window.brickTimer
        );


        recordScore(

            "bricks",

            s.score,

            s.score + 20

        );

    }

}


function drawBricks() {

    const canvas =
        $("brick-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    gameCanvasFrame(

        ctx,

        360,

        460

    );


    const s =
        brickState;


    /* Bricks */

    s.bricks.forEach(

        brick => {

            if (
                !brick.alive
            ) return;


            const gradient =

                ctx.createLinearGradient(

                    brick.x,

                    brick.y,

                    brick.x +
                        brick.width,

                    brick.y +
                        brick.height

                );


            gradient.addColorStop(
                0,
                brick.hp === 2
                    ? "#a970ff"
                    : "#4c9cff"
            );


            gradient.addColorStop(
                1,
                brick.hp === 2
                    ? "#6944d7"
                    : "#2163ca"
            );


            ctx.fillStyle =
                gradient;


            ctx.shadowBlur = 9;

            ctx.shadowColor =
                brick.hp === 2
                    ? "#8f5cff"
                    : "#3287ff";


            roundedCanvasRect(

                ctx,

                brick.x,

                brick.y,

                brick.width,

                brick.height,

                5

            );


            ctx.fill();


            ctx.shadowBlur = 0;

        }

    );


    /* Paddle */

    const py =
        460 - 55;


    ctx.fillStyle =
        "#ffffff";


    ctx.shadowBlur = 15;

    ctx.shadowColor =
        "#ffffff";


    roundedCanvasRect(

        ctx,

        s.paddleX,

        py,

        s.paddleWidth,

        s.paddleHeight,

        7

    );


    ctx.fill();


    ctx.shadowBlur = 0;


    /* Ball */

    ctx.fillStyle =
        "#ffde6b";


    ctx.shadowBlur =
        18;


    ctx.shadowColor =
        "#ffcc33";


    ctx.beginPath();

    ctx.arc(

        s.x,

        s.y,

        s.radius,

        0,

        Math.PI * 2

    );

    ctx.fill();


    ctx.shadowBlur = 0;


    if (
        $("brick-score")
    ) {

        $("brick-score").textContent =
            s.score;

    }


    if (
        $("brick-lives")
    ) {

        $("brick-lives").textContent =
            s.lives;

    }

}


/* =========================================================
   PONG PRO
   ========================================================= */

function buildPong(stage) {

    stage.innerHTML = `

        <div class="game-score">

            You
            <span id="pong-player">
                0
            </span>

            —

            CPU
            <span id="pong-cpu">
                0
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="pong-canvas"
            width="360"
            height="460"
        ></canvas>


        <p class="game-message">

            Move your paddle with your mouse,
            finger, or arrow keys.

        </p>


        <button
            class="game-button"
            onclick="startPong()"
        >

            Restart

        </button>

    `;


    startPong();

}


function startPong() {

    clearInterval(
        window.pongTimer
    );


    const canvas =
        $("pong-canvas");


    if (!canvas) return;


    window.pongState = {

        playerY:
            200,

        cpuY:
            200,

        paddleHeight:
            80,

        paddleWidth:
            12,

        ballX:
            180,

        ballY:
            230,

        ballDX:
            3.6,

        ballDY:
            2.2,

        playerScore:
            0,

        cpuScore:
            0

    };


    canvas.onmousemove =
        event => {

            const rect =
                canvas.getBoundingClientRect();


            pongState.playerY =

                (
                    event.clientY -
                    rect.top
                ) -
                pongState.paddleHeight / 2;


            pongState.playerY =

                Math.max(

                    0,

                    Math.min(

                        460 -
                        pongState.paddleHeight,

                        pongState.playerY

                    )

                );

        };


    canvas.ontouchmove =
        event => {

            if (
                event.touches.length
            ) {

                const touch =
                    event.touches[0];


                const rect =
                    canvas.getBoundingClientRect();


                pongState.playerY =

                    (
                        touch.clientY -
                        rect.top
                    ) -
                    pongState.paddleHeight / 2;


                pongState.playerY =

                    Math.max(

                        0,

                        Math.min(

                            460 -
                            pongState.paddleHeight,

                            pongState.playerY

                        )

                    );

            }


            event.preventDefault();

        };


    window.pongTimer =

        setInterval(

            updatePong,

            16

        );

}


function updatePong() {

    const s =
        pongState;


    s.ballX +=
        s.ballDX;


    s.ballY +=
        s.ballDY;


    if (

        s.ballY < 8 ||

        s.ballY > 452

    ) {

        s.ballDY *= -1;

    }


    const cpuTarget =
        s.ballY -
        s.paddleHeight / 2;


    s.cpuY +=
        (
            cpuTarget -
            s.cpuY
        ) *
        .055;


    s.cpuY =

        Math.max(

            0,

            Math.min(

                460 -
                s.paddleHeight,

                s.cpuY

            )

        );


    /* Player paddle */

    if (

        s.ballX < 42 &&

        s.ballX > 25 &&

        s.ballY >
            s.playerY &&

        s.ballY <
            s.playerY +
            s.paddleHeight &&

        s.ballDX < 0

    ) {

        s.ballDX =
            Math.abs(
                s.ballDX
            ) + .08;


        const offset =

            (
                s.ballY -
                (
                    s.playerY +
                    s.paddleHeight / 2
                )
            ) /
            (
                s.paddleHeight / 2
            );


        s.ballDY =
            offset * 5;

    }


    /* CPU paddle */

    if (

        s.ballX > 318 &&

        s.ballX < 335 &&

        s.ballY >
            s.cpuY &&

        s.ballY <
            s.cpuY +
            s.paddleHeight &&

        s.ballDX > 0

    ) {

        s.ballDX =
            -Math.abs(
                s.ballDX
            ) - .08;

    }


    if (
        s.ballX < -20
    ) {

        s.cpuScore++;

        resetPongBall(
            1
        );

    }


    if (
        s.ballX > 380
    ) {

        s.playerScore++;

        addCoins(2);

        resetPongBall(
            -1
        );

    }


    if (
        s.playerScore >= 7 ||
        s.cpuScore >= 7
    ) {

        clearInterval(
            window.pongTimer
        );


        recordScore(

            "pong",

            s.playerScore,

            s.playerScore * 5

        );

    }


    drawPong();

}


function resetPongBall(
    direction
) {

    const s =
        pongState;


    s.ballX =
        180;


    s.ballY =
        230;


    s.ballDX =
        direction *
        3.6;


    s.ballDY =
        (
            Math.random() *
            4
        ) - 2;

}


function drawPong() {

    const canvas =
        $("pong-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const s =
        pongState;


    gameCanvasFrame(

        ctx,

        360,

        460

    );


    /* Center line */

    ctx.strokeStyle =
        "rgba(255,255,255,.15)";


    ctx.setLineDash(
        [8, 12]
    );


    ctx.beginPath();

    ctx.moveTo(
        180,
        0
    );

    ctx.lineTo(
        180,
        460
    );

    ctx.stroke();


    ctx.setLineDash([]);


    /* Player */

    ctx.fillStyle =
        "#66aaff";


    ctx.shadowBlur =
        15;

    ctx.shadowColor =
        "#4e9cff";


    roundedCanvasRect(

        ctx,

        25,

        s.playerY,

        s.paddleWidth,

        s.paddleHeight,

        6

    );


    ctx.fill();


    /* CPU */

    ctx.fillStyle =
        "#ff5575";


    ctx.shadowColor =
        "#ff5575";


    roundedCanvasRect(

        ctx,

        323,

        s.cpuY,

        s.paddleWidth,

        s.paddleHeight,

        6

    );


    ctx.fill();


    /* Ball */

    ctx.fillStyle =
        "#ffffff";


    ctx.shadowColor =
        "#ffffff";


    ctx.beginPath();

    ctx.arc(

        s.ballX,

        s.ballY,

        8,

        0,

        Math.PI * 2

    );


    ctx.fill();


    ctx.shadowBlur = 0;


    setText(
        "pong-player",
        s.playerScore
    );


    setText(
        "pong-cpu",
        s.cpuScore
    );

}


/* =========================================================
   SPACE DEFENDER PRO
   ========================================================= */

function buildSpace(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="space-score">
                0
            </span>

            · Lives
            <span id="space-lives">
                3
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="space-canvas"
            width="360"
            height="500"
        ></canvas>


        <div class="controls">

            <button
                onclick="moveSpace(-1)"
            >
                ◀
            </button>

            <button
                onclick="shootSpace()"
            >
                🔥
            </button>

            <button
                onclick="moveSpace(1)"
            >
                ▶
            </button>

        </div>


        <p class="game-message">

            Arrow keys move.
            Space shoots.

        </p>


        <button
            class="game-button"
            onclick="startSpace()"
        >

            Restart

        </button>

    `;


    startSpace();

}


function startSpace() {

    clearInterval(
        window.spaceTimer
    );


    const canvas =
        $("space-canvas");


    if (!canvas) return;


    window.spaceState = {

        player: {

            x: 180,

            y: 450,

            width: 36,

            height: 24

        },

        bullets: [],

        enemies: [],

        stars: [],

        score: 0,

        lives: 3,

        frame: 0

    };


    for (
        let i = 0;
        i < 70;
        i++
    ) {

        spaceState.stars.push({

            x:
                Math.random() *
                canvas.width,

            y:
                Math.random() *
                canvas.height,

            speed:
                .5 +
                Math.random() * 2,

            size:
                Math.random() * 2 + 1

        });

    }


    window.spaceTimer =

        setInterval(

            () => {

                updateSpace();

                drawSpace();

            },

            16

        );

}


function moveSpace(
    amount
) {

    if (
        !window.spaceState
    ) return;


    spaceState.player.x +=
        amount * 28;


    spaceState.player.x =

        Math.max(

            20,

            Math.min(

                340,

                spaceState.player.x

            )

        );

}


function shootSpace() {

    if (
        !window.spaceState
    ) return;


    spaceState.bullets.push({

        x:
            spaceState.player.x,

        y:
            spaceState.player.y -
            20,

        speed:
            8

    });

}


function updateSpace() {

    const s =
        spaceState;


    s.frame++;


    s.stars.forEach(

        star => {

            star.y +=
                star.speed;


            if (
                star.y > 500
            ) {

                star.y = 0;

                star.x =
                    Math.random() *
                    360;

            }

        }

    );


    if (
        s.frame % 55 === 0
    ) {

        s.enemies.push({

            x:
                25 +
                Math.random() *
                310,

            y:
                -30,

            width:
                30,

            height:
                24,

            speed:
                1.2 +
                Math.random() *
                1.5

        });

    }


    s.bullets.forEach(

        bullet => {

            bullet.y -=
                bullet.speed;

        }

    );


    s.bullets =
        s.bullets.filter(

            bullet =>
                bullet.y > -20

        );


    s.enemies.forEach(

        enemy => {

            enemy.y +=
                enemy.speed;

        }

    );


    s.enemies =
        s.enemies.filter(

            enemy => {

                if (
                    enemy.y > 520
                ) {

                    s.lives--;

                    return false;

                }

                return true;

            }

        );


    s.bullets.forEach(

        bullet => {

            s.enemies.forEach(

                enemy => {

                    if (

                        bullet.x >
                            enemy.x -
                            enemy.width / 2 &&

                        bullet.x <
                            enemy.x +
                            enemy.width / 2 &&

                        bullet.y >
                            enemy.y -
                            enemy.height / 2 &&

                        bullet.y <
                            enemy.y +
                            enemy.height / 2

                    ) {

                        enemy.destroyed =
                            true;

                        bullet.destroyed =
                            true;

                        s.score +=
                            10;

                        addCoins(1);

                    }

                }

            );

        }

    );


    s.enemies =
        s.enemies.filter(
            enemy =>
                !enemy.destroyed
        );


    s.bullets =
        s.bullets.filter(
            bullet =>
                !bullet.destroyed
        );


    s.enemies.forEach(

        enemy => {

            const p =
                s.player;


            if (

                enemy.x >
                    p.x -
                    p.width / 2 &&

                enemy.x <
                    p.x +
                    p.width / 2 &&

                enemy.y +
                    enemy.height / 2 >
                    p.y -
                    p.height / 2 &&

                enemy.y -
                    enemy.height / 2 <
                    p.y +
                    p.height / 2

            ) {

                enemy.destroyed =
                    true;

                s.lives--;

            }

        }

    );


    s.enemies =
        s.enemies.filter(
            enemy =>
                !enemy.destroyed
        );


    if (
        s.lives <= 0
    ) {

        clearInterval(
            window.spaceTimer
        );


        recordScore(

            "space",

            s.score,

            Math.floor(
                s.score / 10
            )

        );

    }

}


function drawSpace() {

    const canvas =
        $("space-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const s =
        spaceState;


    ctx.fillStyle =
        "#03050c";


    ctx.fillRect(

        0,

        0,

        360,

        500

    );


    /* Stars */

    s.stars.forEach(

        star => {

            ctx.fillStyle =
                `rgba(255,255,255,${
                    .3 +
                    Math.random() * .6
                })`;


            ctx.fillRect(

                star.x,

                star.y,

                star.size,

                star.size

            );

        }

    );


    /* Player */

    ctx.save();


    ctx.translate(

        s.player.x,

        s.player.y

    );


    ctx.fillStyle =
        "#55b8ff";


    ctx.shadowBlur =
        20;


    ctx.shadowColor =
        "#3ca8ff";


    ctx.beginPath();

    ctx.moveTo(
        0,
        -18
    );

    ctx.lineTo(
        -18,
        15
    );

    ctx.lineTo(
        0,
        8
    );

    ctx.lineTo(
        18,
        15
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#d9f4ff";


    ctx.beginPath();

    ctx.arc(

        0,

        -5,

        5,

        0,

        Math.PI * 2

    );

    ctx.fill();


    ctx.restore();


    /* Bullets */

    s.bullets.forEach(

        bullet => {

            ctx.fillStyle =
                "#fff36a";


            ctx.shadowBlur =
                14;


            ctx.shadowColor =
                "#ffe94a";


            roundedCanvasRect(

                ctx,

                bullet.x - 3,

                bullet.y - 9,

                6,

                18,

                3

            );


            ctx.fill();

        }

    );


    /* Enemies */

    s.enemies.forEach(

        enemy => {

            ctx.save();


            ctx.translate(

                enemy.x,

                enemy.y

            );


            ctx.fillStyle =
                "#ff4f72";


            ctx.shadowBlur =
                16;


            ctx.shadowColor =
                "#ff3d67";


            ctx.beginPath();

            ctx.moveTo(
                0,
                15
            );

            ctx.lineTo(
                -17,
                -10
            );

            ctx.lineTo(
                -5,
                -7
            );

            ctx.lineTo(
                0,
                -17
            );

            ctx.lineTo(
                5,
                -7
            );

            ctx.lineTo(
                17,
                -10
            );

            ctx.closePath();

            ctx.fill();


            ctx.restore();

        }

    );


    ctx.shadowBlur = 0;


    setText(
        "space-score",
        s.score
    );


    setText(
        "space-lives",
        s.lives
    );

}


/* =========================================================
   COIN CATCHER PRO
   ========================================================= */

function buildCoins(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Coins
            <span id="catch-score">
                0
            </span>

            · Lives
            <span id="catch-lives">
                3
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="catch-canvas"
            width="360"
            height="460"
        ></canvas>


        <div class="controls">

            <button
                onclick="moveCatcher(-1)"
            >
                ◀
            </button>

            <button
                onclick="moveCatcher(1)"
            >
                ▶
            </button>

        </div>


        <button
            class="game-button"
            onclick="startCoins()"
        >

            Restart

        </button>

    `;


    startCoins();

}


function startCoins() {

    clearInterval(
        window.catchTimer
    );


    const canvas =
        $("catch-canvas");


    if (!canvas) return;


    window.catchState = {

        playerX:
            180,

        playerY:
            420,

        score:
            0,

        lives:
            3,

        objects: [],

        frame:
            0

    };


    canvas.onmousemove =
        event => {

            const rect =
                canvas.getBoundingClientRect();


            catchState.playerX =

                (
                    event.clientX -
                    rect.left
                ) *
                (
                    360 /
                    rect.width
                );

        };


    canvas.ontouchmove =
        event => {

            if (
                event.touches.length
            ) {

                const rect =
                    canvas.getBoundingClientRect();


                catchState.playerX =

                    (
                        event.touches[0].clientX -
                        rect.left
                    ) *
                    (
                        360 /
                        rect.width
                    );

            }


            event.preventDefault();

        };


    window.catchTimer =

        setInterval(

            () => {

                updateCatcher();

                drawCatcher();

            },

            16

        );

}


function moveCatcher(
    amount
) {

    if (
        !window.catchState
    ) return;


    catchState.playerX +=
        amount * 30;


    catchState.playerX =

        Math.max(

            25,

            Math.min(

                335,

                catchState.playerX

            )

        );

}


function updateCatcher() {

    const s =
        catchState;


    s.frame++;


    if (
        s.frame % 45 === 0
    ) {

        const good =
            Math.random() > .25;


        s.objects.push({

            x:
                20 +
                Math.random() *
                320,

            y:
                -20,

            speed:
                2 +
                Math.random() * 2,

            good

        });

    }


    s.objects.forEach(

        obj => {

            obj.y +=
                obj.speed;

        }

    );


    s.objects.forEach(

        obj => {

            if (
                obj.hit
            ) return;


            const distance =

                Math.abs(
                    obj.x -
                    s.playerX
                );


            if (

                obj.y >
                    s.playerY -
                    25 &&

                obj.y <
                    s.playerY +
                    25 &&

                distance <
                    35

            ) {

                obj.hit =
                    true;


                if (
                    obj.good
                ) {

                    s.score += 10;

                    addCoins(1);

                } else {

                    s.lives--;

                }

            }

        }

    );


    s.objects =
        s.objects.filter(

            obj => {

                if (
                    obj.y > 490
                ) {

                    if (
                        obj.good &&
                        !obj.hit
                    ) {

                        s.lives--;

                    }

                    return false;

                }

                return !obj.hit;

            }

        );


    if (
        s.lives <= 0
    ) {

        clearInterval(
            window.catchTimer
        );


        recordScore(

            "coins",

            s.score,

            Math.floor(
                s.score / 10
            )

        );

    }

}


function drawCatcher() {

    const canvas =
        $("catch-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const s =
        catchState;


    gameCanvasFrame(

        ctx,

        360,

        460

    );


    /* Player */

    ctx.fillStyle =
        "#64b5ff";


    ctx.shadowBlur =
        18;


    ctx.shadowColor =
        "#4b9fff";


    roundedCanvasRect(

        ctx,

        s.playerX - 28,

        s.playerY - 12,

        56,

        24,

        10

    );


    ctx.fill();


    ctx.shadowBlur = 0;


    /* Objects */

    s.objects.forEach(

        obj => {

            if (
                obj.good
            ) {

                ctx.fillStyle =
                    "#ffd54f";


                ctx.shadowBlur =
                    18;


                ctx.shadowColor =
                    "#ffc928";


                ctx.beginPath();

                ctx.arc(

                    obj.x,

                    obj.y,

                    11,

                    0,

                    Math.PI * 2

                );

                ctx.fill();

            } else {

                ctx.fillStyle =
                    "#ff5575";


                ctx.shadowBlur =
                    14;


                ctx.shadowColor =
                    "#ff3c61";


                ctx.beginPath();

                ctx.moveTo(
                    obj.x,
                    obj.y - 12
                );

                ctx.lineTo(
                    obj.x + 11,
                    obj.y
                );

                ctx.lineTo(
                    obj.x,
                    obj.y + 12
                );

                ctx.lineTo(
                    obj.x - 11,
                    obj.y
                );

                ctx.closePath();

                ctx.fill();

            }

        }

    );


    ctx.shadowBlur = 0;


    setText(
        "catch-score",
        s.score
    );


    setText(
        "catch-lives",
        s.lives
    );

}


/* =========================================================
   DODGE PRO
   ========================================================= */

function buildDodge(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Score
            <span id="dodge-score">
                0
            </span>

            · Lives
            <span id="dodge-lives">
                3
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="dodge-canvas"
            width="360"
            height="500"
        ></canvas>


        <div class="controls">

            <button
                onclick="moveDodge(-1)"
            >
                ◀
            </button>

            <button
                onclick="moveDodge(1)"
            >
                ▶
            </button>

        </div>


        <button
            class="game-button"
            onclick="startDodge()"
        >

            Restart

        </button>

    `;


    startDodge();

}


function startDodge() {

    clearInterval(
        window.dodgeTimer
    );


    window.dodgeState = {

        x:
            180,

        y:
            440,

        score:
            0,

        lives:
            3,

        blocks:
            [],

        frame:
            0

    };


    window.dodgeTimer =

        setInterval(

            () => {

                updateDodge();

                drawDodge();

            },

            16

        );

}


function moveDodge(
    amount
) {

    if (
        !window.dodgeState
    ) return;


    dodgeState.x +=
        amount * 30;


    dodgeState.x =

        Math.max(

            25,

            Math.min(

                335,

                dodgeState.x

            )

        );

}


function updateDodge() {

    const s =
        dodgeState;


    s.frame++;


    if (
        s.frame % 38 === 0
    ) {

        s.blocks.push({

            x:
                15 +
                Math.random() *
                330,

            y:
                -25,

            size:
                22 +
                Math.random() *
                20,

            speed:
                2 +
                Math.random() * 3

        });

    }


    s.blocks.forEach(

        block => {

            block.y +=
                block.speed;

        }

    );


    s.blocks.forEach(

        block => {

            if (
                block.hit
            ) return;


            if (

                Math.abs(
                    block.x -
                    s.x
                ) <

                block.size / 2 +
                18 &&

                Math.abs(
                    block.y -
                    s.y
                ) <

                block.size / 2 +
                18

            ) {

                block.hit =
                    true;

                s.lives--;

            }

        }

    );


    s.blocks =
        s.blocks.filter(

            block =>
                block.y <
                    540 &&
                !block.hit

        );


    s.score += .05;


    if (
        s.lives <= 0
    ) {

        clearInterval(
            window.dodgeTimer
        );


        const finalScore =
            Math.floor(
                s.score
            );


        recordScore(

            "dodge",

            finalScore,

            Math.floor(
                finalScore / 10
            )

        );

    }

}


function drawDodge() {

    const canvas =
        $("dodge-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const s =
        dodgeState;


    gameCanvasFrame(

        ctx,

        360,

        500

    );


    /* Player */

    ctx.fillStyle =
        "#62c8ff";


    ctx.shadowBlur =
        20;


    ctx.shadowColor =
        "#42baff";


    roundedCanvasRect(

        ctx,

        s.x - 18,

        s.y - 18,

        36,

        36,

        9

    );


    ctx.fill();


    ctx.shadowBlur = 0;


    /* Falling blocks */

    s.blocks.forEach(

        block => {

            ctx.fillStyle =
                "#ff526f";


            ctx.shadowBlur =
                14;


            ctx.shadowColor =
                "#ff405f";


            roundedCanvasRect(

                ctx,

                block.x -
                    block.size / 2,

                block.y -
                    block.size / 2,

                block.size,

                block.size,

                6

            );


            ctx.fill();

        }

    );


    ctx.shadowBlur = 0;


    setText(

        "dodge-score",

        Math.floor(
            s.score
        )

    );


    setText(
        "dodge-lives",
        s.lives
    );

}


/* =========================================================
   ROAD RUSH PRO
   ========================================================= */

function buildRoad(stage) {

    stage.innerHTML = `

        <div class="game-score">

            Distance
            <span id="road-score">
                0
            </span>

            · Lives
            <span id="road-lives">
                3
            </span>

        </div>


        <canvas
            class="game-canvas"
            id="road-canvas"
            width="360"
            height="500"
        ></canvas>


        <div class="controls">

            <button
                onclick="moveRoad(-1)"
            >
                ◀
            </button>

            <button
                onclick="moveRoad(1)"
            >
                ▶
            </button>

        </div>


        <p class="game-message">

            Dodge traffic and survive.

        </p>


        <button
            class="game-button"
            onclick="startRoad()"
        >

            Restart

        </button>

    `;


    startRoad();

}


function startRoad() {

    clearInterval(
        window.roadTimer
    );


    window.roadState = {

        lane:
            1,

        score:
            0,

        lives:
            3,

        traffic:
            [],

        frame:
            0

    };


    window.roadTimer =

        setInterval(

            () => {

                updateRoad();

                drawRoad();

            },

            16

        );

}


function moveRoad(
    amount
) {

    if (
        !window.roadState
    ) return;


    roadState.lane +=
        amount;


    roadState.lane =

        Math.max(

            0,

            Math.min(

                2,

                roadState.lane

            )

        );

}


function updateRoad() {

    const s =
        roadState;


    s.frame++;


    if (
        s.frame % 55 === 0
    ) {

        let lane =
            Math.floor(
                Math.random() * 3
            );


        s.traffic.push({

            lane,

            y:
                -80,

            speed:
                3 +
                Math.random() * 2,

            color:
                Math.random() > .5
                    ? "#ff526f"
                    : "#ffb84d"

        });

    }


    s.traffic.forEach(

        car => {

            car.y +=
                car.speed;

        }

    );


    s.traffic.forEach(

        car => {

            if (
                car.hit
            ) return;


            if (

                car.lane ===
                    s.lane &&

                car.y >
                    385 &&

                car.y <
                    455

            ) {

                car.hit =
                    true;

                s.lives--;

            }

        }

    );


    s.traffic =
        s.traffic.filter(

            car =>
                car.y <
                    560 &&
                !car.hit

        );


    s.score += .06;


    if (
        s.lives <= 0
    ) {

        clearInterval(
            window.roadTimer
        );


        const finalScore =
            Math.floor(
                s.score
            );


        recordScore(

            "road",

            finalScore,

            Math.floor(
                finalScore / 8
            )

        );

    }

}


function drawRoad() {

    const canvas =
        $("road-canvas");


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const s =
        roadState;


    /* Road */

    const bg =
        ctx.createLinearGradient(

            0,
            0,
            0,
            500

        );


    bg.addColorStop(
        0,
        "#171b24"
    );


    bg.addColorStop(
        1,
        "#080a0e"
    );


    ctx.fillStyle =
        bg;


    ctx.fillRect(

        0,
        0,
        360,
        500

    );


    /* Grass */

    ctx.fillStyle =
        "#0d291d";


    ctx.fillRect(
        0,
        0,
        35,
        500
    );


    ctx.fillRect(
        325,
        0,
        35,
        500
    );


    /* Road edges */

    ctx.fillStyle =
        "#aab0ba";


    ctx.fillRect(
        35,
        0,
        5,
        500
    );


    ctx.fillRect(
        320,
        0,
        5,
        500
    );


    /* Lane markers */

    ctx.setLineDash(
        [28, 28]
    );


    ctx.lineDashOffset =
        -s.frame * 3;


    ctx.strokeStyle =
        "rgba(255,255,255,.55)";


    ctx.lineWidth =
        4;


    ctx.beginPath();


    ctx.moveTo(
        130,
        0
    );


    ctx.lineTo(
        130,
        500
    );


    ctx.moveTo(
        230,
        0
    );


    ctx.lineTo(
        230,
        500
    );


    ctx.stroke();


    ctx.setLineDash([]);


    /* Player */

    const playerX =

        80 +
        s.lane * 100;


    ctx.fillStyle =
        "#4fa8ff";


    ctx.shadowBlur =
        18;


    ctx.shadowColor =
        "#4c9eff";


    roundedCanvasRect(

        ctx,

        playerX - 22,

        410,

        44,

        72,

        9

    );


    ctx.fill();


    ctx.fillStyle =
        "#dff4ff";


    roundedCanvasRect(

        ctx,

        playerX - 15,

        420,

        30,

        22,

        5

    );


    ctx.fill();


    ctx.fillStyle =
        "#121722";


    ctx.fillRect(

        playerX - 25,

        418,

        6,

        18

    );


    ctx.fillRect(

        playerX + 19,

        418,

        6,

        18

    );


    ctx.fillRect(

        playerX - 25,

        458,

        6,

        18

    );


    ctx.fillRect(

        playerX + 19,

        458,

        6,

        18

    );


    ctx.shadowBlur = 0;


    /* Traffic */

    s.traffic.forEach(

        car => {

            const x =

                80 +
                car.lane * 100;


            ctx.fillStyle =
                car.color;


            ctx.shadowBlur =
                14;


            ctx.shadowColor =
                car.color;


            roundedCanvasRect(

                ctx,

                x - 21,

                car.y,

                42,

                68,

                8

            );


            ctx.fill();


            ctx.shadowBlur = 0;


            ctx.fillStyle =
                "#dff4ff";


            roundedCanvasRect(

                ctx,

                x - 14,

                car.y + 10,

                28,

                18,

                5

            );


            ctx.fill();


            ctx.fillStyle =
                "#161b25";


            ctx.fillRect(

                x - 24,

                car.y + 12,

                5,

                15

            );


            ctx.fillRect(

                x + 19,

                car.y + 12,

                5,

                15

            );


            ctx.fillRect(

                x - 24,

                car.y + 45,

                5,

                15

            );


            ctx.fillRect(

                x + 19,

                car.y + 45,

                5,

                15

            );

        }

    );


    setText(

        "road-score",

        Math.floor(
            s.score
        )

    );


    setText(
        "road-lives",
        s.lives
    );

}


/* =========================================================
   GLOBAL KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(

    "keydown",

    event => {

        const key =
            event.key.toLowerCase();


        if (
            key === "arrowup"
        ) {

            snakeMove("up");

        }


        if (
            key === "arrowdown"
        ) {

            snakeMove("down");

        }


        if (
            key === "arrowleft"
        ) {

            snakeMove("left");

            moveDodge(-1);

            moveRoad(-1);

            moveCatcher(-1);

        }


        if (
            key === "arrowright"
        ) {

            snakeMove("right");

            moveDodge(1);

            moveRoad(1);

            moveCatcher(1);

        }


        if (
            key === " "
        ) {

            shootSpace();

        }

    }

);


/* =========================================================
   SLOTIFY PLAYING ANIMATION HOOK
   ========================================================= */

(function setupMusicAnimation() {

    const oldFunction =
        window.setMusicPlayingUI;


    if (
        typeof oldFunction !==
        "function"
    ) {

        return;

    }


    window.setMusicPlayingUI =

        function(isPlaying) {

            oldFunction(
                isPlaying
            );


            document.body.classList.toggle(

                "music-playing",

                !!isPlaying

            );


            const logo =
                document.querySelector(
                    ".slotify-logo"
                );


            if (logo) {

                logo.classList.toggle(

                    "is-playing",

                    !!isPlaying

                );

            }

        };

})();
/* =========================================================
   SLOT PHONE X — PERSONALIZATION + MUSIC IMPORT
   ========================================================= */

(function SlotPhoneUpgrade() {

    "use strict";

    /* -----------------------------------------------------
       HOME SCREEN WALLPAPER
       ----------------------------------------------------- */

    const WALLPAPER_KEY =
        "slotphone_custom_wallpaper";
    const WALLPAPER_PRESET_KEY = "slotphone_wallpaper_preset";
    const WALLPAPER_TINT_KEY = "slotphone_wallpaper_tint";

    const screen =
        document.querySelector(".screen");

    const wallpaperPresets = {
        aurora: "radial-gradient(ellipse at 20% 18%, rgba(68, 190, 180, .85), transparent 42%), linear-gradient(145deg, #172c48, #10151f 62%, #412c45)",
        sunset: "radial-gradient(ellipse at 78% 15%, rgba(255, 188, 113, .85), transparent 38%), linear-gradient(155deg, #773d58, #392b4b 60%, #151a31)",
        ocean: "radial-gradient(ellipse at 30% 10%, rgba(75, 162, 220, .8), transparent 42%), linear-gradient(150deg, #164758, #152f43 62%, #172331)"
    };

    function applyWallpaperTint(value) {
        if (!screen || !value) return;
        const red = parseInt(value.slice(1, 3), 16);
        const green = parseInt(value.slice(3, 5), 16);
        const blue = parseInt(value.slice(5, 7), 16);
        screen.style.setProperty("--wallpaper-tint", `rgba(${red}, ${green}, ${blue}, .28)`);
    }

    function applyWallpaperPreset(name) {
        if (!screen || !wallpaperPresets[name]) return;
        screen.classList.remove("custom-wallpaper");
        screen.classList.add("preset-wallpaper");
        screen.style.backgroundImage = wallpaperPresets[name];
        localStorage.setItem(WALLPAPER_PRESET_KEY, name);
        localStorage.removeItem(WALLPAPER_KEY);
    }

    function applyCustomWallpaper(data) {

        if (!screen) return;

        if (!data) {

            screen.classList.remove(
                "custom-wallpaper"
            );

            screen.style.backgroundImage = "";
            screen.classList.remove("preset-wallpaper");

            return;
        }

        screen.classList.add(
            "custom-wallpaper"
        );
        screen.classList.remove("preset-wallpaper");

        screen.style.backgroundImage =
            `url("${data}")`;
    }


    /* LOAD SAVED WALLPAPER */

    try {

        const savedWallpaper =
            localStorage.getItem(
                WALLPAPER_KEY
            );

        if (savedWallpaper) {

            applyCustomWallpaper(
                savedWallpaper
            );

        } else {
            const savedPreset = localStorage.getItem(WALLPAPER_PRESET_KEY);
            if (savedPreset) applyWallpaperPreset(savedPreset);

        }

        applyWallpaperTint(localStorage.getItem(WALLPAPER_TINT_KEY) || "#263c68");

    } catch (error) {

        console.warn(
            "Could not load saved wallpaper.",
            error
        );

    }


    /* -----------------------------------------------------
       CREATE WALLPAPER SETTINGS
       ----------------------------------------------------- */

    function createWallpaperSettings() {

        const settings =
            document.getElementById(
                "settings"
            );

        if (!settings) return;

        if (
            document.getElementById(
                "wallpaper-settings"
            )
        ) {

            return;

        }


        const card =
            document.createElement("div");

        card.id =
            "wallpaper-settings";

        card.className =
            "wallpaper-settings";


        card.innerHTML = `

            <h3>
                Home Screen
            </h3>

            <p>Pick a backdrop, upload a photo, and add a color wash.</p>

            <div class="wallpaper-presets" aria-label="Wallpaper presets">
                <button type="button" data-wallpaper-preset="aurora" aria-label="Aurora wallpaper">Aurora</button>
                <button type="button" data-wallpaper-preset="sunset" aria-label="Sunset wallpaper">Sunset</button>
                <button type="button" data-wallpaper-preset="ocean" aria-label="Ocean wallpaper">Ocean</button>
            </div>

            <label class="wallpaper-tint-control" for="wallpaper-tint">Color wash <input id="wallpaper-tint" type="color" value="#263c68"></label>

            <div class="wallpaper-buttons">

                <button
                    class="wallpaper-button"
                    id="choose-wallpaper"
                    type="button"
                >
                    🖼️ Choose Wallpaper
                </button>

                <button
                    class="wallpaper-reset"
                    id="reset-wallpaper"
                    type="button"
                >
                    Reset
                </button>

            </div>

            <input
                id="wallpaper-file"
                type="file"
                accept="image/*"
                hidden
            >

        `;


        settings.appendChild(card);


        const choose =
            document.getElementById(
                "choose-wallpaper"
            );

        const input =
            document.getElementById(
                "wallpaper-file"
            );

        const reset =
            document.getElementById(
                "reset-wallpaper"
            );


        if (choose && input) {

            choose.onclick =
                function() {

                    input.click();

                };

        }


        if (input) {

            input.addEventListener(
                "change",
                function(event) {

                    const file =
                        event.target.files &&
                        event.target.files[0];

                    if (!file) return;


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        alert(
                            "Please choose an image."
                        );

                        return;

                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        function(loadEvent) {

                            const imageData =
                                loadEvent.target.result;


                            applyCustomWallpaper(
                                imageData
                            );
                            localStorage.removeItem(WALLPAPER_PRESET_KEY);


                            try {

                                localStorage.setItem(
                                    WALLPAPER_KEY,
                                    imageData
                                );

                            } catch (error) {

                                console.warn(
                                    "The image was too large to save.",
                                    error
                                );

                                alert(
                                    "The wallpaper works now, but the image was too large to save permanently. Try a smaller image."
                                );

                            }

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );

        }


        card.querySelectorAll("[data-wallpaper-preset]").forEach(button => {
            button.addEventListener("click", () => {
                applyWallpaperPreset(button.dataset.wallpaperPreset);
                toast(`${button.textContent} wallpaper applied`);
            });
        });

        const tint = document.getElementById("wallpaper-tint");
        if (tint) {
            tint.value = localStorage.getItem(WALLPAPER_TINT_KEY) || "#263c68";
            applyWallpaperTint(tint.value);
            tint.addEventListener("input", () => {
                applyWallpaperTint(tint.value);
                localStorage.setItem(WALLPAPER_TINT_KEY, tint.value);
            });
        }

        if (reset) {

            reset.onclick =
                function() {

                    localStorage.removeItem(
                        WALLPAPER_KEY
                    );
                    localStorage.removeItem(WALLPAPER_PRESET_KEY);
                    localStorage.removeItem(WALLPAPER_TINT_KEY);

                    applyCustomWallpaper(
                        null
                    );
                    screen.style.removeProperty("--wallpaper-tint");

                    if (input) {
                        input.value = "";
                    }

                };

        }

    }


    /*
       Settings is already in the HTML,
       so create the wallpaper controls
       once the page is ready.
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            createWallpaperSettings
        );

    } else {

        createWallpaperSettings();

    }


    /* -----------------------------------------------------
       MUSIC IMPORT
       ----------------------------------------------------- */

    let importedSongs = [];


    function createMusicImporter() {

        const slotify =
            document.getElementById(
                "slotify"
            );

        if (!slotify) return;


        if (
            document.getElementById(
                "music-import"
            )
        ) {

            return;

        }


        const playlistTitle =
            slotify.querySelector(
                ".playlist-title-row"
            );


        if (!playlistTitle) return;


        const importer =
            document.createElement(
                "div"
            );

        importer.id =
            "music-import";

        importer.className =
            "music-import";


        importer.innerHTML = `

            <button
                type="button"
                class="music-import-button"
                id="choose-music"
            >
                🎵 Add Your MP3s
            </button>

            <input
                id="music-file-picker"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/*"
                multiple
            >

        `;


        playlistTitle.after(
            importer
        );


        const chooseMusic =
            document.getElementById(
                "choose-music"
            );

        const musicPicker =
            document.getElementById(
                "music-file-picker"
            );


        if (
            chooseMusic &&
            musicPicker
        ) {

            chooseMusic.onclick =
                function() {

                    musicPicker.click();

                };

        }


        if (musicPicker) {

            musicPicker.addEventListener(
                "change",
                function(event) {

                    const files =
                        Array.from(
                            event.target.files || []
                        );


                    if (!files.length) {
                        return;
                    }


                    files.forEach(
                        function(file) {

                            if (
                                !file.type.startsWith(
                                    "audio/"
                                )
                            ) {

                                return;

                            }


                            const url =
                                URL.createObjectURL(
                                    file
                                );


                            importedSongs.push({

                                title:
                                    file.name
                                        .replace(
                                            /\.[^/.]+$/,
                                            ""
                                        ),

                                artist:
                                    "My Music",

                                file:
                                    url,

                                image:
                                    ""

                            });

                        }
                    );


                    renderImportedSongs();

                    event.target.value =
                        "";

                }
            );

        }

    }


    function renderImportedSongs() {

        const playlist =
            document.getElementById(
                "playlist"
            );

        if (!playlist) return;


        /*
           Put imported tracks ABOVE
           the original playlist.
        */

        importedSongs
            .slice()
            .reverse()
            .forEach(
                function(item) {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "playlist-song imported-song";


                    button.innerHTML = `

                        <span
                            class="playlist-number"
                        >
                            ♪
                        </span>

                        <span
                            class="playlist-image"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:linear-gradient(135deg,#0a84ff,#7b2cff);
                                font-size:20px;
                            "
                        >
                            🎵
                        </span>

                        <span
                            class="playlist-song-info"
                        >

                            <b>
                                ${escapeMusicText(
                                    item.title
                                )}
                            </b>

                            <small>
                                My Music
                            </small>

                        </span>

                    `;


                    button.addEventListener(
                        "click",
                        function() {

                            playImportedSong(
                                item
                            );

                        }
                    );


                    playlist.prepend(
                        button
                    );

                }
            );

    }


    function escapeMusicText(text) {

        return String(text)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    function playImportedSong(
        imported
    ) {

        const player =
            document.getElementById(
                "music-audio"
            );

        if (!player) return;


        player.src =
            imported.file;


        player.volume =
            Number(
                document.getElementById(
                    "music-volume"
                )?.value || .7
            );


        const title =
            document.getElementById(
                "song-name"
            );

        const artist =
            document.getElementById(
                "song-artist"
            );

        const image =
            document.getElementById(
                "song-image"
            );


        if (title) {

            title.textContent =
                imported.title;

        }


        if (artist) {

            artist.textContent =
                imported.artist;

        }


        /*
           Don't try to load an image
           if the imported MP3 doesn't
           have album artwork.
        */

        if (image) {

            image.style.display =
                "block";

            image.src =
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="600"
                        height="600"
                        viewBox="0 0 600 600"
                    >

                        <defs>

                            <linearGradient
                                id="g"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                            >

                                <stop
                                    offset="0"
                                    stop-color="#0a84ff"
                                />

                                <stop
                                    offset="1"
                                    stop-color="#7b2cff"
                                />

                            </linearGradient>

                        </defs>

                        <rect
                            width="600"
                            height="600"
                            rx="90"
                            fill="url(#g)"
                        />

                        <text
                            x="300"
                            y="340"
                            text-anchor="middle"
                            font-size="180"
                        >
                            🎵
                        </text>

                    </svg>

                `);

        }


        player.play()
            .then(
                function() {

                    if (
                        typeof setMusicPlayingUI ===
                        "function"
                    ) {

                        setMusicPlayingUI(
                            true
                        );

                    }

                    const status =
                        document.getElementById(
                            "music-status"
                        );

                    if (status) {

                        status.textContent =
                            "Now playing";

                    }

                }
            )
            .catch(
                function(error) {

                    console.error(
                        "Music playback failed:",
                        error
                    );

                    const status =
                        document.getElementById(
                            "music-status"
                        );

                    if (status) {

                        status.textContent =
                            "Click Play to start this song";

                    }

                }
            );

    }


    /* -----------------------------------------------------
       MAKE EXISTING ALBUM IMAGES MORE RELIABLE
       ----------------------------------------------------- */

    function fixImages() {

        const images =
            document.querySelectorAll(
                "img"
            );


        images.forEach(
            function(image) {

                image.addEventListener(
                    "error",
                    function() {

                        /*
                           Don't leave a broken
                           image icon on screen.
                        */

                        image.style.background =
                            "linear-gradient(135deg,#24265f,#10152f)";

                        image.style.objectFit =
                            "cover";

                        image.src =
                            "data:image/svg+xml;charset=UTF-8," +
                            encodeURIComponent(`

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="500"
                                    height="500"
                                >

                                    <defs>

                                        <linearGradient
                                            id="g"
                                            x1="0"
                                            y1="0"
                                            x2="1"
                                            y2="1"
                                        >

                                            <stop
                                                offset="0"
                                                stop-color="#30336b"
                                            />

                                            <stop
                                                offset="1"
                                                stop-color="#11152d"
                                            />

                                        </linearGradient>

                                    </defs>

                                    <rect
                                        width="500"
                                        height="500"
                                        fill="url(#g)"
                                    />

                                    <text
                                        x="250"
                                        y="280"
                                        text-anchor="middle"
                                        font-size="130"
                                    >
                                        🎵
                                    </text>

                                </svg>

                            `);

                    }

                );

            }
        );

    }


    /* -----------------------------------------------------
       START UPGRADE
       ----------------------------------------------------- */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function() {

                createMusicImporter();

                fixImages();

            }
        );

    } else {

        createMusicImporter();

        fixImages();

    }

})();
/* =========================================================
   SLOT PHONE X — SHORTCUT DOCK + GAME EXIT
   ========================================================= */

(function FinalPhoneControls() {

    "use strict";


    /* =====================================================
       REBUILD THE BOTTOM SHORTCUT BAR
       ===================================================== */

    function setupShortcutDock() {

        const dock =
            document.querySelector(
                ".ios-dock"
            );

        if (!dock) return;


        dock.innerHTML = `

            <button
                class="dock-button"
                type="button"
                onclick="openView('home')"
                aria-label="Home"
            >

                <span
                    class="dock-app-icon dock-home"
                >
                    🏠
                </span>

            </button>


            <button
                class="dock-button"
                type="button"
                onclick="openView('slotify')"
                aria-label="Music"
            >

                <span
                    class="dock-app-icon dock-music"
                >
                    🎵
                </span>

            </button>


            <button
                class="dock-button"
                type="button"
                onclick="openView('settings')"
                aria-label="Settings"
            >

                <span
                    class="dock-app-icon dock-settings"
                >
                    ⚙️
                </span>

            </button>

        `;

    }


    /* =====================================================
       EXIT CURRENT GAME
       ===================================================== */

    window.exitGame =
        function() {

            /*
               Stop all timers created by
               the games.
            */

            if (
                typeof clearGameTimers ===
                "function"
            ) {

                clearGameTimers();

            }


            /*
               Stop any game-specific
               animation frames.
            */

            if (
                window.gameAnimationFrame
            ) {

                cancelAnimationFrame(
                    window.gameAnimationFrame
                );

                window.gameAnimationFrame =
                    null;

            }


            /*
               Stop common game timers.
            */

            const timerNames = [

                "clickerAuto",
                "snakeTimer",
                "brickTimer",
                "pongTimer",
                "reactionTimer",
                "memoryTimer",
                "numberTimer",
                "colorTimer",
                "stackTimer",
                "targetTimer",
                "dodgeTimer",
                "roadTimer",
                "spaceTimer",
                "catchTimer",
                "mineTimer",
                "typingTimer",
                "mathTimer"

            ];


            timerNames.forEach(
                function(name) {

                    if (
                        window[name]
                    ) {

                        clearInterval(
                            window[name]
                        );

                        window[name] =
                            null;

                    }

                }
            );


            /*
               Return to Game Center.
            */

            if (
                typeof openView ===
                "function"
            ) {

                openView("games");

            }


            /*
               Clear the game stage
               so nothing keeps running.
            */

            const stage =
                document.getElementById(
                    "game-stage"
                );

            if (stage) {

                stage.innerHTML = "";

            }


            const title =
                document.getElementById(
                    "game-title"
                );

            if (title) {

                title.textContent =
                    "Choose a game";

            }


            const icon =
                document.getElementById(
                    "game-icon"
                );

            if (icon) {

                icon.textContent =
                    "🎮";

            }

        };


    /* =====================================================
       ADD EXIT BUTTON TO EVERY GAME
       ===================================================== */

    function addExitButton() {

        const stage =
            document.getElementById(
                "game-stage"
            );

        if (!stage) return;


        /*
           Watch the game stage because
           startGame() replaces its HTML
           every time a game starts.
        */

        const observer =
            new MutationObserver(
                function() {

                    if (
                        !stage.children.length
                    ) {

                        return;

                    }


                    /*
                       Don't add it twice.
                    */

                    if (
                        stage.querySelector(
                            ".exit-game-button"
                        )
                    ) {

                        return;

                    }


                    const exit =
                        document.createElement(
                            "button"
                        );


                    exit.type =
                        "button";

                    exit.className =
                        "exit-game-button";

                    exit.innerHTML =
                        "✕  Exit Game";


                    exit.addEventListener(
                        "click",
                        function() {

                            window.exitGame();

                        }
                    );


                    stage.appendChild(
                        exit
                    );

                }
            );


        observer.observe(
            stage,
            {
                childList: true
            }
        );

    }


    /* =====================================================
       SET EVERYTHING UP
       ===================================================== */

    function setup() {

        setupShortcutDock();

        addExitButton();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setup
        );

    } else {

        setup();

    }

})();
/* =========================================================
   FIX GAME CENTER NAVIGATION
   ========================================================= */

(function FixGameNavigation() {

    const originalOpenView = window.openView;

    window.openView = function(name) {

        /*
           The Games page is actually called
           "games" in the HTML.

           Some of the older game code uses
           "game", so redirect it correctly.
        */

        if (name === "game") {
            name = "games";
        }

        return originalOpenView(name);

    };

})();

/* =========================================================
   APP INTERACTIONS
   ========================================================= */

(function setupAppInteractions() {
    const readLocal = (key, fallback) => {
        try {
            return JSON.parse(localStorage.getItem(key)) ?? fallback;
        } catch {
            return fallback;
        }
    };

    const writeLocal = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            toast("Storage is full. Remove saved items and try again.");
            return false;
        }
    };

    const byId = id => document.getElementById(id);
    const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);

    function setupAppSearch() {
        const input = byId("app-search");
        const home = byId("home");
        if (input && home) {
            input.readOnly = true;
            input.placeholder = "Swipe down to unlock search";
            let startY = null;
            let startX = null;
            const unlock = () => {
                if (!input.readOnly) return;
                input.readOnly = false;
                input.placeholder = "Search apps";
                home.classList.add("search-unlocked");
                input.focus();
            };
            home.addEventListener("touchstart", event => {
                const touch = event.touches[0];
                if (touch.clientY <= 180) {
                    startY = touch.clientY;
                    startX = touch.clientX;
                }
            }, { passive: true });
            home.addEventListener("touchend", event => {
                const touch = event.changedTouches[0];
                if (startY !== null && touch.clientY - startY > 64 && Math.abs(touch.clientX - startX) < 60) unlock();
                startY = null;
                startX = null;
            }, { passive: true });
            let pointerStartY = null;
            home.addEventListener("pointerdown", event => {
                if (event.pointerType !== "touch" && event.clientY <= 180) pointerStartY = event.clientY;
            });
            home.addEventListener("pointerup", event => {
                if (pointerStartY !== null && event.clientY - pointerStartY > 64) unlock();
                pointerStartY = null;
            });
        }
        input?.addEventListener("input", () => {
            const query = input.value.trim().toLowerCase();
            document.querySelectorAll("#home-app-grid [data-name]").forEach(tile => {
                tile.hidden = !tile.dataset.name.toLowerCase().includes(query);
            });
        });
        const gameSearch = byId("game-search");
        gameSearch?.addEventListener("input", () => {
            renderGames(document.querySelector(".filter.active")?.dataset.filter || "all");
        });
    }

    function openCameraDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("slotPhoneCameraMedia", 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains("videos")) {
                    request.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveCameraVideo(blob, name) {
        const database = await openCameraDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction("videos", "readwrite");
            transaction.objectStore("videos").add({ blob, name, createdAt: Date.now() });
            transaction.oncomplete = () => { database.close(); resolve(); };
            transaction.onerror = () => { database.close(); reject(transaction.error); };
        });
    }

    function setupMessages() {
        const list = byId("message-list");
        const input = byId("message-input");
        const send = byId("send-message");
        if (!list || !input || !send) return;
        const key = "slotPhoneMessages";
        const recipient = byId("message-recipient");
        const sms = byId("send-sms");
        let conversations = readLocal(key, null);
        if (Array.isArray(conversations)) conversations = { Jamie: conversations };
        if (!conversations || typeof conversations !== "object") {
            conversations = {
                Jamie: [...list.querySelectorAll(".message")].map(bubble => ({
                    text: bubble.textContent.trim(),
                    sent: bubble.classList.contains("sent")
                }))
            };
        }

        const contacts = readLocal("slotPhoneContacts", []);
        recipient?.replaceChildren();
        const jamie = document.createElement("option");
        jamie.value = "Jamie";
        jamie.textContent = "Jamie · demo thread";
        recipient?.appendChild(jamie);
        contacts.forEach(contact => {
            const option = document.createElement("option");
            option.value = contact.phone;
            option.textContent = `${contact.name} · ${contact.phone}`;
            recipient?.appendChild(option);
        });

        const currentThread = () => recipient?.value || "Jamie";
        const render = () => {
            list.replaceChildren();
            (conversations[currentThread()] || []).forEach(message => {
                const bubble = document.createElement("div");
                bubble.className = `message ${message.sent ? "sent" : "received"}`;
                bubble.textContent = message.text;
                list.appendChild(bubble);
            });
            list.scrollTop = list.scrollHeight;
        };
        const persist = () => {
            if (writeLocal(key, conversations)) {
                channel?.postMessage({ thread: currentThread(), messages: conversations[currentThread()] });
            }
        };
        const channel = "BroadcastChannel" in window ? new BroadcastChannel("slotPhoneMessages") : null;
        if (!conversations.Jamie) conversations.Jamie = [];
        recipient?.addEventListener("change", render);
        render();

        const sendMessage = () => {
            const text = input.value.trim();
            if (!text) return;
            (conversations[currentThread()] ||= []).push({ text, sent: true, time: Date.now() });
            input.value = "";
            render();
            persist();
        };

        send.addEventListener("click", sendMessage);
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        });
        sms?.addEventListener("click", () => {
            const phone = currentThread();
            const text = input.value.trim();
            if (phone === "Jamie") return toast("Choose one of your contacts first");
            if (!text) return toast("Write a message first");
            window.location.href = `sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(text)}`;
        });
        channel?.addEventListener("message", event => {
            if (!event.data?.thread || !Array.isArray(event.data.messages)) return;
            conversations[event.data.thread] = event.data.messages;
            if (event.data.thread === currentThread()) render();
        });
        window.addEventListener("storage", event => {
            if (event.key !== key || !event.newValue) return;
            const latest = JSON.parse(event.newValue);
            if (latest && !Array.isArray(latest)) {
                conversations = latest;
                render();
            }
        });
    }

    function setupAssistant() {
        const list = byId("assistant-messages");
        const form = byId("assistant-form");
        const input = byId("assistant-input");
        if (!list || !form || !input) return;
        const key = "slotPhoneAssistantChat";
        let messages = readLocal(key, []);
        if (!Array.isArray(messages)) messages = [];
        if (!messages.length) messages.push({ role: "assistant", text: "Hi! I can help with quick questions, simple math, and general reference lookups." });

        const render = () => {
            list.replaceChildren();
            messages.forEach(message => {
                const bubble = document.createElement("p");
                bubble.className = `assistant-message ${message.role}`;
                bubble.textContent = message.text;
                list.appendChild(bubble);
            });
            list.scrollTop = list.scrollHeight;
        };
        const persist = () => writeLocal(key, messages);
        const respond = async question => {
            const clean = question.trim();
            const math = clean.match(/^(-?\d+(?:\.\d+)?)\s*([+*/-])\s*(-?\d+(?:\.\d+)?)\s*\??$/);
            if (math) {
                const left = Number(math[1]);
                const right = Number(math[3]);
                const answer = math[2] === "+" ? left + right : math[2] === "-" ? left - right : math[2] === "*" ? left * right : right === 0 ? null : left / right;
                return answer === null ? "Division by zero is undefined." : `${left} ${math[2]} ${right} = ${answer}`;
            }
            if (/\b(hello|hi|hey)\b/i.test(clean)) return "Hello! What would you like to know?";
            if (/\b(time|date|day)\b/i.test(clean)) return `It is ${new Date().toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}.`;
            const topic = clean.replace(/^(who|what|where|when|why|how)\s+(is|are|was|were|do|does|did)\s+/i, "").replace(/[?!.]+$/, "").trim();
            if (!topic) return "Try asking a question or entering a calculation such as 18 * 7.";
            try {
                const params = new URLSearchParams({ action: "query", list: "search", srsearch: topic, srlimit: "1", format: "json", origin: "*" });
                const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
                if (!response.ok) throw new Error("Lookup failed");
                const data = await response.json();
                const result = data.query.search[0];
                if (!result) return `I couldn't find a reference result for “${topic}”. Try rephrasing it.`;
                const detailParams = new URLSearchParams({ action: "query", prop: "extracts", exintro: "1", explaintext: "1", exsentences: "3", titles: result.title, format: "json", origin: "*" });
                const detailResponse = await fetch(`https://en.wikipedia.org/w/api.php?${detailParams}`);
                if (!detailResponse.ok) throw new Error("Lookup failed");
                const detail = await detailResponse.json();
                const page = Object.values(detail.query.pages)[0];
                return `${page.extract || result.snippet.replace(/<[^>]*>/g, "") || result.title}\nSource: Wikipedia · ${result.title}`;
            } catch {
                return "I’m offline, so I can’t look up that topic right now. I can still help with greetings, the current date and time, and simple arithmetic.";
            }
        };
        render();
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const question = input.value.trim();
            if (!question) return;
            messages.push({ role: "user", text: question });
            input.value = "";
            render();
            const pending = document.createElement("p");
            pending.className = "assistant-message assistant";
            pending.textContent = "Thinking…";
            list.appendChild(pending);
            list.scrollTop = list.scrollHeight;
            const answer = await respond(question);
            messages.push({ role: "assistant", text: answer });
            persist();
            render();
        });
        byId("assistant-clear")?.addEventListener("click", () => {
            messages = [{ role: "assistant", text: "Conversation cleared. What would you like to ask?" }];
            persist();
            render();
        });
        persist();
    }

    function resizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const image = new Image();
                image.onerror = reject;
                image.onload = () => {
                    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));
                    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.78));
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function setupPhotos() {
        const view = byId("photos");
        const grid = view?.querySelector(".photo-grid");
        if (!view || !grid) return;
        const controls = document.createElement("div");
        controls.className = "photo-actions";
        controls.innerHTML = '<button type="button" id="add-photo">＋ Add Photos</button><input id="photo-picker" type="file" accept="image/*" multiple hidden>';
        view.querySelector(".page-head").after(controls);
        const picker = byId("photo-picker");

        const addVideo = record => {
            const card = document.createElement("div");
            card.className = "photo-card recorded-video";
            card.dataset.videoUrl = URL.createObjectURL(record.blob);
            card.dataset.videoName = record.name;
            const preview = document.createElement("video");
            preview.src = card.dataset.videoUrl;
            preview.muted = true;
            preview.playsInline = true;
            preview.preload = "metadata";
            const label = document.createElement("span");
            label.textContent = `▶ ${record.name}`;
            card.append(preview, label);
            grid.prepend(card);
        };

        openCameraDatabase().then(database => {
            const request = database.transaction("videos", "readonly").objectStore("videos").getAll();
            request.onsuccess = () => {
                request.result.sort((left, right) => right.createdAt - left.createdAt).forEach(addVideo);
                database.close();
            };
        }).catch(() => {});
        window.addEventListener("slotphone:video-saved", event => addVideo(event.detail));

        function addPhoto(photo, persist) {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "photo-card imported-photo";
            card.dataset.photo = photo.data;
            card.setAttribute("aria-label", `Open ${photo.name}`);
            const image = document.createElement("img");
            image.src = photo.data;
            image.alt = photo.name;
            const label = document.createElement("span");
            label.textContent = photo.name;
            card.append(image, label);
            grid.prepend(card);
            if (persist) {
                const photos = readLocal("slotPhonePhotos", []);
                photos.unshift(photo);
                writeLocal("slotPhonePhotos", photos);
            }
        }

        const renderSavedPhotos = () => [...readLocal("slotPhonePhotos", [])].reverse().forEach(photo => addPhoto(photo, false));
        renderSavedPhotos();
        window.addEventListener("slotphone:photos-updated", () => {
            grid.querySelectorAll(".imported-photo").forEach(card => card.remove());
            renderSavedPhotos();
        });
        byId("add-photo").addEventListener("click", () => picker.click());
        picker.addEventListener("change", async () => {
            for (const file of [...picker.files]) {
                if (!file.type.startsWith("image/")) continue;
                try {
                    addPhoto({ data: await resizeImage(file), name: file.name }, true);
                } catch {
                    toast(`Couldn't add ${file.name}`);
                }
            }
            picker.value = "";
        });

        grid.addEventListener("click", event => {
            const card = event.target.closest(".photo-card");
            if (!card) return;
            if (card.dataset.videoUrl) {
                const viewer = document.createElement("div");
                viewer.className = "photo-viewer";
                const video = document.createElement("video");
                video.src = card.dataset.videoUrl;
                video.controls = true;
                video.autoplay = true;
                video.playsInline = true;
                const close = document.createElement("button");
                close.type = "button";
                close.className = "photo-viewer-close";
                close.setAttribute("aria-label", "Close");
                close.textContent = "×";
                close.addEventListener("click", () => { video.pause(); viewer.remove(); });
                viewer.append(close, video);
                viewer.addEventListener("click", closeEvent => {
                    if (closeEvent.target === viewer) { video.pause(); viewer.remove(); }
                });
                document.body.appendChild(viewer);
                return;
            }
            const image = card.querySelector("img");
            const viewer = document.createElement("div");
            viewer.className = "photo-viewer";
            viewer.innerHTML = `<button type="button" class="photo-viewer-close" aria-label="Close">×</button>${image ? `<img src="${image.src}" alt="${escapeHTML(image.alt)}">` : `<div class="photo-emoji">${escapeHTML(card.textContent.trim())}</div>`}`;
            if (card.dataset.photo) {
                const preview = viewer.querySelector("img");
                const editor = document.createElement("div");
                editor.className = "photo-editor";
                let rotation = 0;
                const adjustments = { brightness: 100, contrast: 100, saturation: 100 };
                const updatePreview = () => {
                    preview.style.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
                    preview.style.transform = `rotate(${rotation}deg)`;
                };
                Object.keys(adjustments).forEach(name => {
                    const label = document.createElement("label");
                    label.textContent = `${name[0].toUpperCase()}${name.slice(1)} `;
                    const value = document.createElement("span");
                    value.textContent = "100%";
                    const slider = document.createElement("input");
                    slider.type = "range";
                    slider.min = "50";
                    slider.max = "150";
                    slider.value = "100";
                    slider.setAttribute("aria-label", name);
                    slider.addEventListener("input", () => {
                        adjustments[name] = Number(slider.value);
                        value.textContent = `${slider.value}%`;
                        updatePreview();
                    });
                    label.append(value, slider);
                    editor.appendChild(label);
                });
                const actions = document.createElement("div");
                actions.className = "photo-editor-actions";
                const rotate = document.createElement("button");
                rotate.type = "button";
                rotate.textContent = "Rotate";
                rotate.addEventListener("click", () => { rotation = (rotation + 90) % 360; updatePreview(); });
                const download = document.createElement("button");
                download.type = "button";
                download.textContent = "Download";
                const saveEdit = document.createElement("button");
                saveEdit.type = "button";
                saveEdit.textContent = "Save changes";
                const exportImage = () => new Promise((resolve, reject) => {
                    const source = new Image();
                    source.onerror = reject;
                    source.onload = () => {
                        const sideways = Math.abs(rotation % 180) === 90;
                        const canvas = document.createElement("canvas");
                        canvas.width = sideways ? source.naturalHeight : source.naturalWidth;
                        canvas.height = sideways ? source.naturalWidth : source.naturalHeight;
                        const context = canvas.getContext("2d");
                        context.translate(canvas.width / 2, canvas.height / 2);
                        context.rotate(rotation * Math.PI / 180);
                        context.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
                        context.drawImage(source, -source.naturalWidth / 2, -source.naturalHeight / 2);
                        resolve(canvas.toDataURL("image/jpeg", 0.92));
                    };
                    source.src = card.dataset.photo;
                });
                download.addEventListener("click", async () => {
                    try {
                        const link = document.createElement("a");
                        link.href = await exportImage();
                        link.download = `edited-${(image.alt || "photo").replace(/[^\w.-]+/g, "-")}.jpg`;
                        link.click();
                    } catch {
                        toast("Couldn’t export this photo");
                    }
                });
                saveEdit.addEventListener("click", async () => {
                    try {
                        const data = await exportImage();
                        const photos = readLocal("slotPhonePhotos", []);
                        const record = photos.find(photo => photo.data === card.dataset.photo);
                        if (!record) return toast("This photo is no longer in your library");
                        record.data = data;
                        if (writeLocal("slotPhonePhotos", photos)) {
                            card.dataset.photo = data;
                            image.src = data;
                            preview.src = data;
                            toast("Photo changes saved");
                        }
                    } catch {
                        toast("Couldn’t save this photo");
                    }
                });
                actions.append(rotate, download, saveEdit);
                editor.appendChild(actions);
                viewer.appendChild(editor);
                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "photo-delete";
                remove.textContent = "Delete Photo";
                remove.addEventListener("click", () => {
                    const photos = readLocal("slotPhonePhotos", []).filter(photo => photo.data !== card.dataset.photo);
                    if (writeLocal("slotPhonePhotos", photos)) {
                        card.remove();
                        viewer.remove();
                    }
                });
                viewer.appendChild(remove);
            }
            viewer.addEventListener("click", closeEvent => {
                if (closeEvent.target === viewer || closeEvent.target.closest(".photo-viewer-close")) viewer.remove();
            });
            document.body.appendChild(viewer);
        });
    }

    let cameraStream;
    let cameraFacingMode = "environment";
    let cameraRecorder;
    let cameraRecordingStarted = 0;
    let cameraChunks = [];

    function stopCamera() {
        if (cameraRecorder?.state === "recording") cameraRecorder.stop();
        cameraStream?.getTracks().forEach(track => track.stop());
        cameraStream = null;
        const video = byId("camera-video");
        if (video) video.srcObject = null;
        const recordButton = byId("camera-record");
        recordButton?.classList.remove("recording");
        if (recordButton) recordButton.textContent = "● REC";
    }

    async function startCamera() {
        const video = byId("camera-video");
        const status = byId("camera-status");
        if (!video || !navigator.mediaDevices?.getUserMedia) return;
        stopCamera();
        try {
            let hasMicrophone = true;
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode }, audio: true });
            } catch {
                hasMicrophone = false;
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode }, audio: false });
            }
            video.srcObject = cameraStream;
            video.play().catch(() => {});
            if (status) status.textContent = hasMicrophone ? "Camera and microphone ready" : "Camera ready · microphone unavailable";
        } catch {
            if (status) status.textContent = "Allow camera access, or add pictures in Photos.";
        }
    }

    function setupCamera() {
        const video = byId("camera-video");
        const status = byId("camera-status");
        if (!video) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            if (status) status.textContent = "Camera access isn't available here. Add pictures in Photos instead.";
            return;
        }
        if (!video.dataset.controlsReady) {
            video.dataset.controlsReady = "true";
            byId("camera-stop")?.addEventListener("click", () => {
                stopCamera();
                if (status) status.textContent = "Camera paused";
            });
            byId("camera-switch")?.addEventListener("click", () => {
                cameraFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
                startCamera();
            });
            byId("camera-capture")?.addEventListener("click", () => {
                if (!video.videoWidth) return toast("Start the camera before taking a photo");
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext("2d").drawImage(video, 0, 0);
                const photos = readLocal("slotPhonePhotos", []);
                photos.unshift({ data: canvas.toDataURL("image/jpeg", 0.8), name: `Camera ${new Date().toLocaleString()}` });
                if (writeLocal("slotPhonePhotos", photos)) {
                    window.dispatchEvent(new Event("slotphone:photos-updated"));
                    toast("Saved to Photos");
                }
            });
            byId("camera-record")?.addEventListener("click", async event => {
                const button = event.currentTarget;
                if (cameraRecorder?.state === "recording") {
                    cameraRecorder.stop();
                    button.textContent = "● REC";
                    button.classList.remove("recording");
                    if (status) status.textContent = "Saving video to Photos…";
                    return;
                }
                if (!video.videoWidth || !cameraStream) return toast("Start the camera before recording");
                if (!window.MediaRecorder) return toast("Video recording isn’t supported in this browser");
                cameraChunks = [];
                const mimeType = ["video/mp4;codecs=h264,aac", "video/webm;codecs=vp9,opus", "video/webm"]
                    .find(type => MediaRecorder.isTypeSupported(type));
                try {
                    cameraRecorder = new MediaRecorder(cameraStream, mimeType ? { mimeType } : undefined);
                    cameraRecorder.addEventListener("dataavailable", recordingEvent => {
                        if (recordingEvent.data.size) cameraChunks.push(recordingEvent.data);
                    });
                    cameraRecorder.addEventListener("stop", async () => {
                        const blob = new Blob(cameraChunks, { type: cameraRecorder.mimeType || "video/webm" });
                        const extension = blob.type.includes("mp4") ? "mp4" : "webm";
                        const record = { blob, name: `Camera ${new Date(cameraRecordingStarted).toLocaleString()}.${extension}` };
                        try {
                            await saveCameraVideo(blob, record.name);
                            window.dispatchEvent(new CustomEvent("slotphone:video-saved", { detail: record }));
                            if (status) status.textContent = "Video saved to Photos";
                            toast("Video saved to Photos");
                        } catch {
                            if (status) status.textContent = "Couldn’t save the recording. Check device storage.";
                            toast("Couldn’t save the video");
                        }
                    });
                    cameraRecorder.start(500);
                    cameraRecordingStarted = Date.now();
                    button.textContent = "■ STOP";
                    button.classList.add("recording");
                    if (status) status.textContent = cameraStream.getAudioTracks().length ? "Recording video with audio…" : "Recording video without microphone audio…";
                } catch {
                    toast("Couldn’t start video recording");
                }
            });
            document.addEventListener("click", event => {
                if (event.target.closest("[data-home]") || event.target.closest('[data-open]:not([data-open="camera"])')) stopCamera();
            });
        }
        startCamera();
    }

    function setupPhoneAndContacts() {
        let number = "";
        const display = byId("phone-number");
        const telURI = value => `tel:${String(value).replace(/[^\d+*#]/g, "").replace(/#/g, "%23").replace(/\*/g, "%2A")}`;
        document.querySelectorAll("[data-dial]").forEach(button => button.addEventListener("click", () => {
            number += button.dataset.dial;
            if (display) display.textContent = number;
        }));
        byId("dial-clear")?.addEventListener("click", () => {
            number = number.slice(0, -1);
            if (display) display.textContent = number || "Enter number";
        });
        byId("dial-delete")?.addEventListener("click", () => {
            number = "";
            if (display) display.textContent = "Enter number";
        });
        byId("dial-call")?.addEventListener("click", () => {
            const callableNumber = number.replace(/[^\d+*#]/g, "");
            if (!callableNumber) return toast("Enter a number first");
            window.location.href = telURI(callableNumber);
        });

        const search = byId("contact-search");
        const list = byId("contact-list");
        const addForm = byId("contact-add-form");

        const addContactRow = (name, phone) => {
            const row = document.createElement("div");
            row.className = "contact-row";
            const avatar = document.createElement("div");
            avatar.className = "contact-avatar";
            avatar.textContent = name.trim().charAt(0).toUpperCase();
            const info = document.createElement("div");
            const nameLabel = document.createElement("b");
            nameLabel.textContent = name;
            const phoneLabel = document.createElement("small");
            phoneLabel.textContent = phone;
            info.append(nameLabel, phoneLabel);
            row.append(avatar, info);
            list.appendChild(row);
        };

        readLocal("slotPhoneContacts", []).forEach(contact => addContactRow(contact.name, contact.phone));
        list?.querySelectorAll(".contact-row").forEach(row => {
            const name = row.querySelector("b")?.textContent.trim() || "contact";
            const phone = row.querySelector("small")?.textContent.trim();
            if (!phone) return;
            const call = document.createElement("a");
            call.className = "contact-call";
            call.href = telURI(phone);
            call.textContent = "Call";
            call.setAttribute("aria-label", `Call ${name}`);
            row.appendChild(call);
        });
        addForm?.addEventListener("submit", event => {
            event.preventDefault();
            const nameInput = byId("contact-name-input");
            const phoneInput = byId("contact-phone-input");
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const normalized = phone.replace(/[\s().-]/g, "");
            if (!name || !/^\+?[\d*#]{3,}$/.test(normalized)) {
                toast("Enter a name and a valid phone number");
                return;
            }
            const contacts = readLocal("slotPhoneContacts", []);
            contacts.push({ name, phone });
            if (!writeLocal("slotPhoneContacts", contacts)) return;
            addContactRow(name, phone);
            const row = list.lastElementChild;
            const call = document.createElement("a");
            call.className = "contact-call";
            call.href = telURI(normalized);
            call.textContent = "Call";
            call.setAttribute("aria-label", `Call ${name}`);
            row.appendChild(call);
            nameInput.value = "";
            phoneInput.value = "";
        });
        search?.addEventListener("input", () => {
            const query = search.value.trim().toLowerCase();
            list?.querySelectorAll(".contact-row").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
        });
        list?.addEventListener("click", event => {
            if (event.target.closest(".contact-call")) return;
            const row = event.target.closest(".contact-row");
            const phone = row?.querySelector("small")?.textContent.trim();
            if (!phone) return;
            openView("phone");
            number = phone.replace(/\D/g, "");
            if (display) display.textContent = number;
        });
    }

    function setupWeather() {
        const weatherCodes = {
            0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
            45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
            61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"], 71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"],
            80: ["Rain showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy showers", "🌧️"], 95: ["Thunderstorm", "⛈️"], 96: ["Thunder and hail", "⛈️"], 99: ["Severe thunderstorm", "⛈️"]
        };
        const getWeather = async (latitude, longitude, location) => {
            const params = new URLSearchParams({
                latitude: String(latitude), longitude: String(longitude),
                current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
                daily: "weather_code,temperature_2m_max,temperature_2m_min",
                temperature_unit: "fahrenheit", wind_speed_unit: "mph", forecast_days: "5", timezone: "auto"
            });
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
            if (!response.ok) throw new Error("Weather service unavailable");
            const data = await response.json();
            const current = data.current;
            const description = weatherCodes[current.weather_code] || ["Current conditions", "🌡️"];
            const round = value => `${Math.round(value)}°`;
            const label = $("home-weather-label");
            if (label) label.textContent = location;
            if ($("weather-temp")) $("weather-temp").textContent = round(current.temperature_2m);
            if ($("home-weather-temp")) $("home-weather-temp").textContent = round(current.temperature_2m);
            if ($("weather-condition")) $("weather-condition").textContent = description[0];
            if ($("weather-feels")) $("weather-feels").textContent = `Feels like ${round(current.apparent_temperature)}`;
            if ($("home-weather-summary")) $("home-weather-summary").textContent = `${description[0]} · feels ${round(current.apparent_temperature)}`;
            if ($("weather-humidity")) $("weather-humidity").textContent = `💧 ${current.relative_humidity_2m}%`;
            if ($("weather-wind")) $("weather-wind").textContent = `💨 ${Math.round(current.wind_speed_10m)} mph`;
            if ($("weather-high")) $("weather-high").textContent = `⬆️ ${round(data.daily.temperature_2m_max[0])}`;
            if ($("weather-low")) $("weather-low").textContent = `⬇️ ${round(data.daily.temperature_2m_min[0])}`;
            const icon = document.querySelector("#weather .page-head > span");
            if (icon) icon.textContent = description[1];
            const forecast = $("weather-forecast");
            if (forecast) {
                forecast.replaceChildren();
                data.daily.time.forEach((day, index) => {
                    const [condition, symbol] = weatherCodes[data.daily.weather_code[index]] || ["Forecast", "🌡️"];
                    const row = document.createElement("div");
                    const weekday = document.createElement("b");
                    weekday.textContent = index === 0 ? "Today" : new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
                    const weatherIcon = document.createElement("span");
                    weatherIcon.textContent = symbol;
                    weatherIcon.setAttribute("aria-label", condition);
                    const range = document.createElement("strong");
                    range.textContent = `${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°`;
                    row.append(weekday, weatherIcon, range);
                    forecast.appendChild(row);
                });
            }
        };
        const load = () => {
            const status = $("weather-condition");
            if (status) status.textContent = "Finding local forecast…";
            const fallback = () => getWeather(40.7128, -74.006, "New York · sample location").catch(() => {
                if (status) status.textContent = "Weather needs an internet connection";
                if ($("home-weather-summary")) $("home-weather-summary").textContent = "Forecast unavailable · tap to retry";
            });
            if (!navigator.geolocation) return fallback();
            navigator.geolocation.getCurrentPosition(
                position => getWeather(position.coords.latitude, position.coords.longitude, "Your location").catch(fallback),
                fallback,
                { timeout: 6000, maximumAge: 600000 }
            );
        };
        $("weather-refresh")?.addEventListener("click", load);
        load();
    }

    function setupBrowserAndMaps() {
        const browser = byId("browser");
        const input = byId("browser-url");
        const go = byId("browser-go");
        const results = byId("browser-results");
        if (browser && input && go && results) {
            let currentFrame;
            const pageHistory = [];
            let pageHistoryIndex = -1;
            const recent = readLocal("slotSearchRecent", []);
            const renderRecent = () => {
                browser.querySelector(".browser-shortcuts")?.querySelectorAll("[data-recent]").forEach(button => button.remove());
                recent.slice(0, 4).forEach(query => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.dataset.recent = query;
                    button.textContent = query;
                    button.addEventListener("click", () => search(query));
                    browser.querySelector(".browser-shortcuts")?.appendChild(button);
                });
            };

            async function openArticle(title) {
                results.innerHTML = '<p class="search-loading">Opening article…</p>';
                const params = new URLSearchParams({
                    action: "query", prop: "extracts|pageimages", exintro: "1", explaintext: "1",
                    pithumbsize: "480", titles: title, format: "json", origin: "*"
                });
                try {
                    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
                    if (!response.ok) throw new Error("Search unavailable");
                    const data = await response.json();
                    const page = Object.values(data.query.pages)[0];
                    const article = document.createElement("article");
                    article.className = "search-article";
                    const back = document.createElement("button");
                    back.type = "button";
                    back.className = "search-back";
                    back.textContent = "‹ Results";
                    back.addEventListener("click", () => search(input.value, false));
                    const heading = document.createElement("h2");
                    heading.textContent = page.title;
                    article.append(back, heading);
                    if (page.thumbnail?.source) {
                        const image = document.createElement("img");
                        image.src = page.thumbnail.source;
                        image.alt = "";
                        article.appendChild(image);
                    }
                    const extract = document.createElement("p");
                    extract.textContent = page.extract || "No article summary is available.";
                    article.appendChild(extract);
                    const source = document.createElement("small");
                    source.textContent = "Article text from Wikipedia";
                    article.appendChild(source);
                    results.replaceChildren(article);
                } catch {
                    results.innerHTML = '<div class="search-empty"><strong>Can’t load this article right now</strong><p>Check your connection and try the search again.</p></div>';
                }
            }

            async function search(value = input.value, remember = true, fromHistory = false) {
                const query = value.trim();
                if (!query) {
                    results.innerHTML = '<div class="search-empty"><strong>What are you curious about?</strong><p>Type a topic, person, place, or question above.</p></div>';
                    input.focus();
                    return;
                }
                input.value = query;
                if (remember) {
                    const next = [query, ...recent.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 4);
                    recent.splice(0, recent.length, ...next);
                    writeLocal("slotSearchRecent", recent);
                    renderRecent();
                }
                const hasWhitespace = /\s/.test(query);
                const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(query) || (!hasWhitespace && /^[\w-]+(?:\.[\w-]+)+(?:[/:?#].*)?$/i.test(query));
                if (looksLikeUrl) {
                    let url;
                    try {
                        url = new URL(/^https?:\/\//i.test(query) ? query : `https://${query}`);
                        if (!/^https?:$/.test(url.protocol)) throw new Error("Unsupported scheme");
                    } catch {
                        results.innerHTML = '<div class="search-empty"><strong>Enter a valid website address</strong></div>';
                        return;
                    }
                    browser.querySelector(".browser-home").hidden = true;
                    if (!fromHistory) {
                        pageHistory.splice(pageHistoryIndex + 1);
                        pageHistory.push(url.href);
                        pageHistoryIndex = pageHistory.length - 1;
                    }
                    input.value = url.href;
                    results.replaceChildren();
                    const toolbar = document.createElement("div");
                    toolbar.className = "browser-page-toolbar";
                    const label = document.createElement("span");
                    label.textContent = url.href;
                    const limitation = document.createElement("small");
                    limitation.textContent = "Some websites block in-app display. YouTube video links play here; other blocked pages may need a new tab.";
                    toolbar.append(label, limitation);
                    results.appendChild(toolbar);

                    if (/\.(avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i.test(url.href)) {
                        const image = document.createElement("img");
                        image.className = "browser-image";
                        image.src = url.href;
                        image.alt = url.pathname.split("/").pop() || "Web image";
                        image.addEventListener("error", () => {
                            image.replaceWith(Object.assign(document.createElement("p"), { textContent: "This image could not be loaded." }));
                        }, { once: true });
                        results.appendChild(image);
                    } else {
                        const youtubeId = url.hostname.match(/(?:^|\.)youtu(?:\.be|be\.com)$/i)
                            ? (url.hostname.endsWith("youtu.be") ? url.pathname.slice(1).split("/")[0] : url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1])
                            : null;
                        const frame = document.createElement("iframe");
                        frame.className = "browser-frame";
                        frame.title = `Website: ${url.hostname}`;
                        frame.referrerPolicy = "strict-origin-when-cross-origin";
                        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                        frame.allowFullscreen = true;
                        frame.src = youtubeId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}` : url.href;
                        currentFrame = frame;
                        results.appendChild(frame);
                        const blockedMessage = document.createElement("p");
                        blockedMessage.className = "browser-frame-blocked";
                        blockedMessage.textContent = "This site does not allow its page to appear inside another app. Use the link below to open it in a browser tab.";
                        blockedMessage.hidden = true;
                        frame.addEventListener("error", () => { blockedMessage.hidden = false; });
                        window.setTimeout(() => {
                            try {
                                if (currentFrame === frame && !frame.contentDocument?.body?.childElementCount) blockedMessage.hidden = false;
                            } catch {
                                if (currentFrame === frame) blockedMessage.hidden = false;
                            }
                        }, 2500);
                        results.appendChild(blockedMessage);
                        const openLink = document.createElement("a");
                        openLink.className = "browser-external-link";
                        openLink.href = url.href;
                        openLink.target = "_blank";
                        openLink.rel = "noopener noreferrer";
                        openLink.textContent = "Open this website in a browser tab ↗";
                        results.appendChild(openLink);
                    }
                    return;
                }
                browser.querySelector(".browser-home").hidden = false;
                results.innerHTML = '<p class="search-loading">Searching…</p>';
                const params = new URLSearchParams({ action: "query", list: "search", srsearch: query, srlimit: "8", format: "json", origin: "*" });
                try {
                    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
                    if (!response.ok) throw new Error("Search unavailable");
                    const data = await response.json();
                    const items = data.query.search || [];
                    if (!items.length) {
                        results.innerHTML = '<div class="search-empty"><strong>No matching pages</strong><p>Try a shorter or different search.</p></div>';
                        return;
                    }
                    const header = document.createElement("p");
                    header.className = "search-count";
                    header.textContent = `${data.query.searchinfo.totalhits.toLocaleString()} results`;
                    const list = document.createElement("div");
                    list.className = "search-result-list";
                    items.forEach(item => {
                        const card = document.createElement("article");
                        card.className = "search-result";
                        const title = document.createElement("button");
                        title.type = "button";
                        title.className = "search-result-title";
                        title.textContent = item.title;
                        title.addEventListener("click", () => openArticle(item.title));
                        const snippet = document.createElement("p");
                        const parsed = new DOMParser().parseFromString(item.snippet, "text/html");
                        snippet.textContent = parsed.body.textContent;
                        const open = document.createElement("button");
                        open.type = "button";
                        open.className = "search-result-open";
                        open.textContent = "Read summary →";
                        open.addEventListener("click", () => openArticle(item.title));
                        card.append(title, snippet, open);
                        list.appendChild(card);
                    });
                    results.replaceChildren(header, list);
                } catch {
                    results.innerHTML = '<div class="search-empty"><strong>Search needs an internet connection</strong><p>Your search stays in Safari. Try again when you’re online.</p><button type="button" id="search-retry">Try again</button></div>';
                    byId("search-retry")?.addEventListener("click", () => search(query, false));
                }
            }

            go.addEventListener("click", () => search());
            input.addEventListener("keydown", event => { if (event.key === "Enter") search(); });
            browser.querySelectorAll("[data-search-term]").forEach(button => button.addEventListener("click", () => search(button.dataset.searchTerm)));
            byId("browser-back")?.addEventListener("click", () => {
                if (pageHistoryIndex > 0) search(pageHistory[--pageHistoryIndex], false, true);
                else {
                    browser.querySelector(".browser-home").hidden = false;
                    results.replaceChildren();
                    currentFrame = null;
                }
            });
            byId("browser-forward")?.addEventListener("click", () => {
                if (pageHistoryIndex < pageHistory.length - 1) search(pageHistory[++pageHistoryIndex], false, true);
            });
            byId("browser-reload")?.addEventListener("click", () => {
                if (currentFrame) currentFrame.src = currentFrame.src;
                else search(input.value, false);
            });
            renderRecent();
        }
        byId("open-real-maps")?.addEventListener("click", () => window.open("https://maps.google.com/?q=SlotPhone+City", "_blank", "noopener,noreferrer"));
    }

    function setupCalendar() {
        const grid = byId("calendar-grid");
        const monthLabel = byId("cal-month");
        if (!grid || !monthLabel) return;
        let month = new Date();
        month = new Date(month.getFullYear(), month.getMonth(), 1);
        let selected = new Date();
        const eventLabel = byId("cal-selected-date");
        const eventInput = byId("calendar-event-input");
        const eventList = byId("calendar-events");
        const events = readLocal("slotPhoneCalendarEvents", {});
        const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const render = () => {
            monthLabel.textContent = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
            grid.replaceChildren();
            const offset = (month.getDay() + 6) % 7;
            const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
            for (let blank = 0; blank < offset; blank++) grid.appendChild(document.createElement("span"));
            for (let day = 1; day <= days; day++) {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = day;
                button.dataset.day = day;
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                if (date.toDateString() === new Date().toDateString()) button.classList.add("today");
                if (date.toDateString() === selected.toDateString()) button.classList.add("selected-day");
                grid.appendChild(button);
            }
        };
        const renderEvents = () => {
            if (eventLabel) eventLabel.textContent = selected.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            if (!eventList) return;
            eventList.replaceChildren();
            (events[dateKey(selected)] || []).forEach((text, index) => {
                const row = document.createElement("div");
                row.className = "calendar-event";
                row.innerHTML = `<span>${escapeHTML(text)}</span><button type="button" data-calendar-delete="${index}" aria-label="Delete event">×</button>`;
                eventList.appendChild(row);
            });
            if (!(events[dateKey(selected)] || []).length) eventList.innerHTML = '<p class="calendar-empty">No events for this day</p>';
        };
        const moveMonth = amount => {
            month.setMonth(month.getMonth() + amount);
            const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
            selected = new Date(month.getFullYear(), month.getMonth(), Math.min(selected.getDate(), lastDay));
            render();
            renderEvents();
        };
        byId("cal-prev")?.addEventListener("click", () => moveMonth(-1));
        byId("cal-next")?.addEventListener("click", () => moveMonth(1));
        grid.addEventListener("click", event => {
            const day = event.target.closest("[data-day]");
            if (!day) return;
            selected = new Date(month.getFullYear(), month.getMonth(), Number(day.dataset.day));
            render();
            renderEvents();
            toast(selected.toLocaleDateString(undefined, { dateStyle: "long" }));
        });
        const addEvent = () => {
            const text = eventInput?.value.trim();
            if (!text) return;
            (events[dateKey(selected)] ||= []).push(text);
            writeLocal("slotPhoneCalendarEvents", events);
            eventInput.value = "";
            renderEvents();
        };
        byId("calendar-event-add")?.addEventListener("click", addEvent);
        eventInput?.addEventListener("keydown", event => { if (event.key === "Enter") addEvent(); });
        eventList?.addEventListener("click", event => {
            const remove = event.target.closest("[data-calendar-delete]");
            if (!remove) return;
            events[dateKey(selected)].splice(Number(remove.dataset.calendarDelete), 1);
            writeLocal("slotPhoneCalendarEvents", events);
            renderEvents();
        });
        render();
        renderEvents();
    }

    function setupReminders() {
        const list = byId("reminder-list");
        const input = byId("reminder-input");
        const add = byId("add-reminder");
        if (!list || !input || !add) return;
        const key = "slotPhoneReminders";
        let reminders = readLocal(key, []);
        const render = () => {
            list.replaceChildren();
            reminders.forEach((reminder, index) => {
                const row = document.createElement("div");
                row.className = `reminder-row${reminder.done ? " done" : ""}`;
                row.innerHTML = `<button class="check-circle" data-reminder-check="${index}" aria-label="Toggle reminder">${reminder.done ? "✓" : ""}</button><span>${escapeHTML(reminder.text)}</span><button data-reminder-delete="${index}" aria-label="Delete reminder">×</button>`;
                list.appendChild(row);
            });
            if (!reminders.length) list.innerHTML = '<p class="empty-state">No reminders yet</p>';
        };
        const create = () => {
            const text = input.value.trim();
            if (!text) return;
            reminders.push({ text, done: false });
            input.value = "";
            writeLocal(key, reminders);
            render();
        };
        add.addEventListener("click", create);
        input.addEventListener("keydown", event => { if (event.key === "Enter") create(); });
        list.addEventListener("click", event => {
            const check = event.target.closest("[data-reminder-check]");
            const remove = event.target.closest("[data-reminder-delete]");
            if (check) reminders[Number(check.dataset.reminderCheck)].done = !reminders[Number(check.dataset.reminderCheck)].done;
            if (remove) reminders.splice(Number(remove.dataset.reminderDelete), 1);
            if (check || remove) { writeLocal(key, reminders); render(); }
        });
        render();
    }

    function setupFiles() {
        const picker = byId("file-picker");
        const list = byId("file-list");
        const search = byId("file-search");
        if (!picker || !list) return;
        picker.addEventListener("change", () => {
            [...picker.files].forEach(file => {
                const row = document.createElement("a");
                row.className = "file-row user-file";
                row.href = URL.createObjectURL(file);
                row.target = "_blank";
                row.rel = "noopener";
                row.innerHTML = `<span>${file.type.startsWith("image/") ? "🖼️" : file.type.startsWith("audio/") ? "🎵" : "📄"}</span><div><b>${escapeHTML(file.name)}</b><small>${(file.size / 1024).toFixed(1)} KB · Open file</small></div><strong>↗</strong>`;
                list.appendChild(row);
            });
            picker.value = "";
        });
        search?.addEventListener("input", () => {
            const query = search.value.trim().toLowerCase();
            list.querySelectorAll(".file-row").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
        });
    }

    function setupMail() {
        document.querySelectorAll(".mail-item").forEach(item => {
            item.tabIndex = 0;
            item.setAttribute("role", "button");
            const openMail = () => {
                const sender = item.querySelector("b")?.textContent.trim() || "Message";
                const subject = item.querySelector("strong")?.textContent.trim() || "";
                const body = item.querySelector("p")?.textContent.trim() || "";
                const dialog = document.createElement("dialog");
                dialog.className = "mail-dialog";
                dialog.innerHTML = `<form method="dialog"><button class="photo-viewer-close" aria-label="Close">×</button></form><p class="eyebrow">${escapeHTML(sender)}</p><h2>${escapeHTML(subject)}</h2><p>${escapeHTML(body)}</p>`;
                const reply = document.createElement("form");
                reply.className = "mail-reply-form";
                reply.innerHTML = '<input type="email" name="to" placeholder="Recipient email" autocomplete="email" required><textarea name="body" placeholder="Write your reply…" required></textarea><button class="game-button" type="submit">Open Email App</button>';
                reply.addEventListener("submit", event => {
                    event.preventDefault();
                    const recipient = reply.querySelector('[name="to"]').value.trim();
                    const message = reply.querySelector('[name="body"]').value.trim();
                    const replySubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;
                    const replyBody = `${message}\n\n--- Original message ---\n${body}`;
                    const address = encodeURIComponent(recipient).replace(/%40/gi, "@");
                    window.location.href = `mailto:${address}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`;
                });
                dialog.appendChild(reply);
                dialog.addEventListener("close", () => dialog.remove());
                document.body.appendChild(dialog);
                dialog.showModal();
            };
            item.addEventListener("click", openMail);
            item.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMail(); } });
        });
    }

    function setupSettingsAndStore() {
        document.querySelectorAll("[data-setting]").forEach(button => {
            const setting = button.dataset.setting;
            button.classList.toggle("active", Boolean(state[setting]));
            button.setAttribute("aria-pressed", String(Boolean(state[setting])));
            button.addEventListener("click", () => {
                state[setting] = !state[setting];
                button.classList.toggle("active", state[setting]);
                button.setAttribute("aria-pressed", String(state[setting]));
                save();
                applySettings();
            });
        });
        byId("reset-phone")?.addEventListener("click", () => {
            if (!confirm("Reset SlotPhone and clear its saved app data from this device?")) return;
            [SAVE_KEY, "slotPhoneMessages", "slotPhonePhotos", "slotPhoneReminders", "slotPhoneContacts", "slotPhoneShortsLiked", "slotPhoneShortsSaved", "slotSearchRecent", "slotphone_custom_wallpaper", "slotphone_wallpaper_preset", "slotphone_wallpaper_tint"].forEach(key => localStorage.removeItem(key));
            const finishReset = () => location.reload();
            if (!window.indexedDB) return finishReset();
            let remaining = 2;
            ["slotPhoneShorts", "slotPhoneCameraMedia"].forEach(databaseName => {
                const deletion = indexedDB.deleteDatabase(databaseName);
                const complete = () => { if (--remaining === 0) finishReset(); };
                deletion.onsuccess = complete;
                deletion.onerror = complete;
                deletion.onblocked = complete;
            });
        });
        const prices = { double: 100, neon: 250, badge: 500, coinBoost: 750 };
        document.querySelectorAll("[data-buy]").forEach(button => {
            const product = button.dataset.buy;
            const render = () => {
                button.disabled = Boolean(state.owned[product]);
                button.textContent = state.owned[product] ? "Owned" : `Buy · ${prices[product]} coins`;
            };
            render();
            button.addEventListener("click", () => {
                if (state.owned[product]) return;
                if (state.coins < prices[product]) return toast("Not enough coins");
                state.coins -= prices[product];
                state.owned[product] = true;
                if (product === "neon") state.neon = true;
                save();
                applySettings();
                updateUI();
                render();
                toast("Purchase complete");
            });
        });
        setupAppCatalog();
    }

    function setupAppCatalog() {
        const catalog = byId("app-catalog");
        const search = byId("app-store-search");
        const tiles = [...document.querySelectorAll("#home-app-grid .app-tile[data-open]")];
        const apps = tiles.map(tile => ({
            id: tile.dataset.open,
            name: tile.querySelector("b")?.textContent.trim() || tile.dataset.name,
            icon: tile.querySelector(".app-icon")?.textContent.trim() || "◉",
            tile
        })).filter(app => app.id !== "games");
        const gameApps = games.map(game => ({ id: `game:${game.id}`, name: game.name, icon: game.icon, game }));
        if (!Array.isArray(state.installedApps)) state.installedApps = apps.map(app => app.id);

        const render = () => {
            if (!catalog) return;
            const query = search?.value.trim().toLowerCase() || "";
            catalog.replaceChildren();
            [...apps, ...gameApps].filter(app => app.name.toLowerCase().includes(query)).forEach(app => {
                const row = document.createElement("article");
                row.className = "app-catalog-item";
                const icon = document.createElement("span");
                icon.className = "app-catalog-icon";
                icon.textContent = app.icon;
                const details = document.createElement("div");
                details.className = "app-catalog-details";
                const name = document.createElement("b");
                name.textContent = app.name;
                const type = document.createElement("small");
                type.textContent = app.game ? `${app.game.cat} game · ready to play` : "Included with SlotPhone";
                details.append(name, type);
                const installed = app.game ? state.installedGames.includes(app.game.id) : state.installedApps.includes(app.id);
                const button = document.createElement("button");
                button.type = "button";
                button.className = "app-catalog-action";
                button.textContent = app.game ? (installed ? "Open" : "Get") : (installed ? (app.id === "store" ? "Open" : "Remove") : "Get");
                button.setAttribute("aria-label", `${app.game ? (installed ? "Open" : "Install") : (installed ? (app.id === "store" ? "Open" : "Remove") : "Install")} ${app.name}`);
                if (app.id === "store") button.disabled = true;
                button.addEventListener("click", () => {
                    if (app.game) {
                        if (installed) {
                            startGame(app.game.id);
                            return;
                        }
                        if (!state.installedGames.includes(app.game.id)) state.installedGames.push(app.game.id);
                        renderGameApps();
                    } else if (installed) {
                        if (app.id === "store") {
                            openView(app.id);
                            return;
                        }
                        state.installedApps = state.installedApps.filter(id => id !== app.id);
                        app.tile.hidden = true;
                    } else {
                        state.installedApps.push(app.id);
                        app.tile.hidden = false;
                    }
                    save();
                    render();
                    toast(app.game ? `${app.name} installed` : installed ? `${app.name} removed from home screen` : `${app.name} added to home screen`);
                });
                row.append(icon, details, button);
                if (app.game && installed) {
                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "app-catalog-action app-catalog-remove";
                    remove.textContent = "Remove";
                    remove.setAttribute("aria-label", `Remove ${app.name}`);
                    remove.addEventListener("click", () => {
                        state.installedGames = state.installedGames.filter(id => id !== app.game.id);
                        save();
                        renderGameApps();
                        render();
                        toast(`${app.name} removed from home screen`);
                    });
                    row.appendChild(remove);
                }
                catalog.appendChild(row);
            });
        };
        apps.forEach(app => { app.tile.hidden = !state.installedApps.includes(app.id); });
        search?.addEventListener("input", render);
        render();
    }

    async function setupShorts() {
        const feed = byId("shorts-feed");
        const picker = byId("shorts-picker");
        const upload = byId("shorts-upload");
        const storageStatus = byId("shorts-storage-status");
        if (!feed || !picker || !upload) return;

        const clipURL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
        const clips = [
            { key: "seed-0", title: "A little color for your day", creator: "@slotphone", src: clipURL, poster: "images/1.jpg" },
            { key: "seed-1", title: "Golden hour, on repeat", creator: "@dailyframes", src: clipURL, poster: "images/2.jpg" },
            { key: "seed-2", title: "Somewhere between here and home", creator: "@weekendroll", src: clipURL, poster: "images/3.jpg" },
            { key: "seed-3", title: "Press play. Take a breath.", creator: "@smallmoments", src: clipURL, poster: "images/4.jpg" }
        ];
        const liked = readLocal("slotPhoneShortsLiked", []);
        const saved = readLocal("slotPhoneShortsSaved", []);
        const memoryVideos = [];
        let database;
        let cursor = 0;
        let observer;

        const setStatus = count => {
            if (storageStatus) storageStatus.textContent = `${count} uploaded ${count === 1 ? "video" : "videos"} · saved on this device`;
        };

        const openDatabase = () => new Promise((resolve, reject) => {
            if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
            const request = indexedDB.open("slotPhoneShorts", 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains("videos")) {
                    request.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const readVideos = db => new Promise((resolve, reject) => {
            const request = db.transaction("videos", "readonly").objectStore("videos").getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const storeVideo = (db, record) => new Promise((resolve, reject) => {
            const transaction = db.transaction("videos", "readwrite");
            const request = transaction.objectStore("videos").add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const deleteVideo = id => new Promise((resolve, reject) => {
            if (!database || typeof id !== "number") return resolve();
            const transaction = database.transaction("videos", "readwrite");
            transaction.objectStore("videos").delete(id);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });

        const createCard = clip => {
            const card = document.createElement("article");
            card.className = "short-card";
            card.dataset.shortKey = clip.key;
            const poster = document.createElement("img");
            poster.className = "short-poster";
            poster.src = clip.poster || "images/1.jpg";
            poster.alt = "";
            const video = document.createElement("video");
            video.poster = clip.poster || "images/1.jpg";
            video.dataset.src = clip.src;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = "none";
            video.hidden = true;
            const shade = document.createElement("div");
            shade.className = "short-shade";
            const copy = document.createElement("div");
            copy.className = "short-copy";
            const creator = document.createElement("small");
            creator.textContent = clip.creator;
            const title = document.createElement("h3");
            title.textContent = clip.title;
            const play = document.createElement("button");
            play.type = "button";
            play.dataset.shortPlay = "";
            play.textContent = "▶ Play clip";
            copy.append(creator, title, play);
            const actions = document.createElement("div");
            actions.className = "short-actions";
            const like = document.createElement("button");
            like.type = "button";
            like.dataset.shortLike = "";
            like.setAttribute("aria-label", "Like");
            like.setAttribute("aria-pressed", String(liked.includes(clip.key)));
            like.textContent = liked.includes(clip.key) ? "♥" : "♡";
            const save = document.createElement("button");
            save.type = "button";
            save.dataset.shortSave = "";
            save.setAttribute("aria-label", "Save video");
            save.setAttribute("aria-pressed", String(saved.includes(clip.key)));
            save.textContent = saved.includes(clip.key) ? "✓" : "＋";
            actions.append(like, save);
            const audio = document.createElement("button");
            audio.type = "button";
            audio.dataset.shortAudio = "";
            audio.setAttribute("aria-label", "Turn clip audio on");
            audio.setAttribute("aria-pressed", "false");
            audio.textContent = "🔇";
            actions.appendChild(audio);
            if (clip.uploaded) {
                const remove = document.createElement("button");
                remove.type = "button";
                remove.dataset.shortDelete = "";
                remove.setAttribute("aria-label", "Delete uploaded video");
                remove.textContent = "×";
                actions.appendChild(remove);
            }
            card.append(poster, video, shade, copy, actions);
            feed.appendChild(card);
            observer?.observe(card);
            return card;
        };

        const appendBatch = (count = 4) => {
            if (!clips.length) return;
            for (let index = 0; index < count; index++) {
                createCard(clips[cursor % clips.length]);
                cursor++;
            }
        };

        const stopCard = card => {
            const video = card.querySelector("video");
            video.pause();
            video.hidden = true;
            card.querySelector(".short-poster").hidden = false;
            card.querySelector("[data-short-play]").textContent = "▶ Play clip";
            card.classList.remove("playing");
        };

        const playCard = (card, audible = true) => {
            feed.querySelectorAll(".short-card.playing").forEach(other => {
                if (other !== card) stopCard(other);
            });
            const video = card.querySelector("video");
            if (!video.src) video.src = video.dataset.src;
            video.muted = !audible;
            const audioButton = card.querySelector("[data-short-audio]");
            audioButton.textContent = audible ? "🔊" : "🔇";
            audioButton.setAttribute("aria-label", audible ? "Turn clip audio off" : "Turn clip audio on");
            audioButton.setAttribute("aria-pressed", String(audible));
            video.hidden = false;
            video.play().then(() => {
                card.classList.add("playing");
                delete card.dataset.playFailed;
                card.querySelector(".short-poster").hidden = true;
                card.querySelector("[data-short-play]").textContent = "Ⅱ Pause";
            }).catch(() => {
                stopCard(card);
                card.dataset.playFailed = "true";
                toast("This clip can’t play here. Upload a video from your device.");
            });
        };

        if ("IntersectionObserver" in window) {
            observer = new IntersectionObserver(entries => entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.72 && !entry.target.dataset.playFailed) {
                    playCard(entry.target, false);
                } else {
                    stopCard(entry.target);
                }
            }), { root: feed, threshold: [0, 0.72, 1] });
        }

        feed.tabIndex = 0;
        feed.addEventListener("scroll", () => {
            if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - feed.clientHeight * 1.5) appendBatch();
        }, { passive: true });
        feed.addEventListener("keydown", event => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                feed.scrollBy({ top: (event.key === "ArrowDown" ? 1 : -1) * feed.clientHeight, behavior: "smooth" });
            }
        });
        feed.addEventListener("click", async event => {
            const card = event.target.closest(".short-card");
            if (!card) return;
            const clip = clips.find(item => item.key === card.dataset.shortKey);
            if (!clip) return;
            const like = event.target.closest("[data-short-like]");
            const save = event.target.closest("[data-short-save]");
            const audio = event.target.closest("[data-short-audio]");
            const play = event.target.closest("[data-short-play]");
            const remove = event.target.closest("[data-short-delete]");
            if (like || save) {
                const list = like ? liked : saved;
                const storageKey = like ? "slotPhoneShortsLiked" : "slotPhoneShortsSaved";
                const index = list.indexOf(clip.key);
                if (index >= 0) list.splice(index, 1);
                else list.push(clip.key);
                const active = list.includes(clip.key);
                (like || save).textContent = like ? (active ? "♥" : "♡") : (active ? "✓" : "＋");
                (like || save).setAttribute("aria-pressed", String(active));
                writeLocal(storageKey, list);
            } else if (remove && clip.uploaded) {
                try {
                    await deleteVideo(clip.databaseId);
                    clips.splice(clips.indexOf(clip), 1);
                    URL.revokeObjectURL(clip.src);
                    feed.replaceChildren();
                    cursor = 0;
                    appendBatch(8);
                    setStatus(clips.filter(item => item.uploaded).length);
                } catch {
                    toast("Couldn’t remove this video");
                }
            } else if (audio) {
                const video = card.querySelector("video");
                if (!video.src) video.src = video.dataset.src;
                if (video.paused) {
                    playCard(card, video.muted);
                } else {
                    video.muted = !video.muted;
                    audio.textContent = video.muted ? "🔇" : "🔊";
                    audio.setAttribute("aria-pressed", String(!video.muted));
                    audio.setAttribute("aria-label", video.muted ? "Turn clip audio on" : "Turn clip audio off");
                }
            } else if (play) {
                const video = card.querySelector("video");
                if (video.paused) playCard(card, true);
                else if (video.muted) {
                    video.muted = false;
                    card.querySelector("[data-short-audio]").textContent = "🔊";
                    card.querySelector("[data-short-audio]").setAttribute("aria-pressed", "true");
                    card.querySelector("[data-short-audio]").setAttribute("aria-label", "Turn clip audio off");
                } else stopCard(card);
            } else if (card.classList.contains("playing")) {
                stopCard(card);
            } else {
                playCard(card, true);
            }
        });

        appendBatch(8);

        const loadPromise = (async () => {
            try {
                database = await openDatabase();
                database.onversionchange = () => database.close();
                const stored = await readVideos(database);
                stored.forEach(record => {
                    const blob = record.blob;
                    const clip = {
                        key: `upload-${record.id}`,
                        databaseId: record.id,
                        title: record.title,
                        creator: "@you",
                        src: URL.createObjectURL(blob),
                        poster: "images/5.jpg",
                        uploaded: true
                    };
                    clips.push(clip);
                    createCard(clip);
                    cursor++;
                });
                setStatus(stored.length);
            } catch {
                if (storageStatus) storageStatus.textContent = "Uploads stay available in this tab";
            }
        })();

        upload.addEventListener("click", () => picker.click());
        picker.addEventListener("change", async () => {
            await loadPromise;
            for (const file of [...picker.files]) {
                if (!file.type.startsWith("video/")) {
                    toast(`${file.name} isn’t a video`);
                    continue;
                }
                const title = file.name.replace(/\.[^.]+$/, "") || "Untitled video";
                const record = { title, type: file.type, blob: file, createdAt: Date.now() };
                try {
                    if (database) record.id = await storeVideo(database, record);
                    else {
                        record.id = `memory-${Date.now()}-${memoryVideos.length}`;
                        memoryVideos.push(record);
                    }
                    const clip = {
                        key: `upload-${record.id}`,
                        databaseId: record.id,
                        title,
                        creator: "@you",
                        src: URL.createObjectURL(file),
                        poster: "images/5.jpg",
                        uploaded: true
                    };
                    clips.push(clip);
                    createCard(clip);
                    cursor++;
                    setStatus(clips.filter(item => item.uploaded).length);
                    toast(`Added ${title}`);
                } catch {
                    toast("Couldn’t save this video. Try a smaller file.");
                }
            }
            picker.value = "";
        });
    }

    document.addEventListener("click", event => {
        if (event.target.closest('[data-open="camera"]')) setupCamera();
    });

    document.querySelectorAll("[data-timer]").forEach(button => {
        button.addEventListener("click", () => setTimer(Number(button.dataset.timer)));
    });
    byId("timer-reset")?.addEventListener("click", () => setTimer(300));

    setupAppSearch();
    setupMessages();
    setupAssistant();
    setupPhotos();
    setupPhoneAndContacts();
    setupWeather();
    setupBrowserAndMaps();
    setupCalendar();
    setupReminders();
    setupFiles();
    setupMail();
    setupSettingsAndStore();
    setupShorts();
})();