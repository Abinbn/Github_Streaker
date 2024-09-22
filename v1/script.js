const DAYS = ['Mon', 'Wed', 'Fri'];
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const LEVELS = 5;
        const DETAILED_SUGGESTIONS = [
            'Take a break and plan your next contribution',
            'Fix a small bug or improve documentation',
            'Implement a new feature or refactor existing code',
            'Review and merge pull requests',
            'Lead a major project or mentor other contributors'
        ];

        let grid = [];
        let isDrawing = false;
        let darkMode = false;
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Start from Monday
        let todoList = new Map();
        let colorPalette = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
        let darkColorPalette = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
        let contributionGoal = 0;
        let totalContributions = 0;

        const gridElement = document.getElementById('grid');
        const monthsElement = document.getElementById('months');
        const todoListElement = document.getElementById('todoList');
        const darkModeToggle = document.getElementById('darkModeToggle');
        const prevYearBtn = document.getElementById('prevYearBtn');
        const nextYearBtn = document.getElementById('nextYearBtn');
        const resetBtn = document.getElementById('resetBtn');
        const randomizeBtn = document.getElementById('randomizeBtn');
        const syncGitHubBtn = document.getElementById('syncGitHubBtn');
        const shareBtn = document.getElementById('shareBtn');
        const tooltip = document.getElementById('tooltip');
        const statsContainer = document.getElementById('statsContainer');
        const colorPaletteContainer = document.getElementById('colorPalette');
        const goalInput = document.getElementById('goalInput');
        const progressBar = document.getElementById('progress');
        const shareUrlInput = document.getElementById('shareUrl');

        function initializeGrid() {
            grid = Array(7).fill().map(() => Array(53).fill(0));
            renderGrid();
            renderMonths();
            updateStats();
        }

        function renderGrid() {
            gridElement.innerHTML = '';
            grid.forEach((row, i) => {
                row.forEach((cell, j) => {
                    const cellElement = document.createElement('div');
                    cellElement.className = 'cell';
                    cellElement.style.backgroundColor = getColor(cell);
                    cellElement.addEventListener('mousedown', () => handleMouseDown(i, j));
                    cellElement.addEventListener('mouseenter', (e) => handleMouseEnter(e, i, j));
                    cellElement.addEventListener('mousemove', (e) => showTooltip(e, i, j));
                    cellElement.addEventListener('mouseleave', hideTooltip);
                    gridElement.appendChild(cellElement);
                });
            });
        }

        function renderMonths() {
            monthsElement.innerHTML = '';
            const currentDate = new Date(startDate);
            currentDate.setDate(1);
            for (let i = 0; i < 12; i++) {
                const monthElement = document.createElement('span');
                monthElement.className = 'month';
                monthElement.textContent = MONTHS[currentDate.getMonth()];
                monthsElement.appendChild(monthElement);
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        function handleMouseDown(row, col) {
            isDrawing = true;
            updateGrid(row, col);
        }

        function handleMouseEnter(event, row, col) {
            if (isDrawing && event.buttons === 1) {
                updateGrid(row, col);
            }
        }

        function updateGrid(row, col) {
            const oldLevel = grid[row][col];
            const newLevel = (oldLevel + 1) % LEVELS;
            grid[row][col] = newLevel;
            animateCell(row, col, oldLevel, newLevel);
            updateTodoList(row, col, oldLevel, newLevel);
            updateStats();
        }

        function animateCell(row, col, oldLevel, newLevel) {
            const cellElement = gridElement.children[row * 53 + col];
            cellElement.style.transform = 'scale(1.2)';
            cellElement.style.backgroundColor = getColor(newLevel);
            setTimeout(() => {
                cellElement.style.transform = 'scale(1)';
            }, 300);
        }

        function getColor(level) {
            return darkMode ? darkColorPalette[level] : colorPalette[level];
        }

        function getDateFromPosition(row, col) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + col * 7 + row);
            return date;
        }

        function updateTodoList(row, col, oldLevel, newLevel) {
            const date = getDateFromPosition(row, col);
            const dateString = date.toISOString().split('T')[0];
            
            if (newLevel === 0) {
                todoList.delete(dateString);
            } else {
                todoList.set(dateString, { date, suggestion: DETAILED_SUGGESTIONS[newLevel] });
            }
            
            renderTodoList();
        }

        function renderTodoList() {
            todoListElement.innerHTML = '';
            [...todoList.values()].sort((a, b) => b.date - a.date).forEach(item => {
                const todoItem = document.createElement('div');
                todoItem.className = 'todo-item';
                todoItem.innerHTML = `
                    <p style="color: ${getColor(4)}; font-weight: bold;">${item.date.toDateString()}</p>
                    <p>${item.suggestion}</p>
                `;
                todoListElement.appendChild(todoItem);
            });
        }

        function showTooltip(event, row, col) {
            const date = getDateFromPosition(row, col);
            const level = grid[row][col];
            const suggestion = DETAILED_SUGGESTIONS[level];
            tooltip.innerHTML = `
                <p>${date.toDateString()}</p>
                <p>Activity Level: ${level}</p>
                <p>Suggestion: ${suggestion}</p>
            `;
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
            tooltip.style.opacity = 1;
        }

        function hideTooltip() {
            tooltip.style.opacity = 0;
        }

        function updateStats() {
            totalContributions = grid.flat().reduce((sum, cell) => sum + cell, 0);
            const longestStreak = calculateLongestStreak();
            const currentStreak = calculateCurrentStreak();

            statsContainer.innerHTML = `
                <div class="stat">
                    <div class="stat-value">${totalContributions}</div>
                    <div>Total Contributions</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${longestStreak}</div>
                    <div>Longest Streak</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${currentStreak}</div>
                    <div>Current Streak</div>
                </div>
            `;

            updateProgressBar();
        }

        function calculateLongestStreak() {
            let longestStreak = 0;
            let currentStreak = 0;
            grid.flat().forEach(cell => {
                if (cell > 0) {
                    currentStreak++;
                    longestStreak = Math.max(longestStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            });
            return longestStreak;
        }

        function calculateCurrentStreak() {
            let currentStreak = 0;
            for (let i = grid[0].length - 1; i >= 0; i--) {
                for (let j = 6; j >= 0; j--) {
                    if (grid[j][i] > 0) {
                        currentStreak++;
                    } else if (currentStreak > 0) {
                        return currentStreak;
                    }
                }
            }
            return currentStreak;
        }

        function updateProgressBar() {
            if (contributionGoal > 0) {
                const progress = Math.min((totalContributions / contributionGoal) * 100, 100);
                progressBar.style.width = `${progress}%`;
            }
        }

        function renderColorPalette() {
            colorPaletteContainer.innerHTML = '';
            const currentPalette = darkMode ? darkColorPalette : colorPalette;
            currentPalette.forEach((color, index) => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = color;
                input.addEventListener('change', (e) => updateColor(index, e.target.value));
                colorPaletteContainer.appendChild(input);
            });
        }

        function updateColor(index, color) {
            if (darkMode) {
                darkColorPalette[index] = color;
            } else {
                colorPalette[index] = color;
            }
            renderGrid();
            renderColorPalette();
        }

        darkModeToggle.addEventListener('change', () => {
            darkMode = darkModeToggle.checked;
            document.body.classList.toggle('dark-mode', darkMode);
            renderGrid();
            renderColorPalette();
            document.querySelectorAll('.legend-item').forEach((item, index) => {
                item.style.backgroundColor = getColor(index);
            });
        });

        prevYearBtn.addEventListener('click', () => {
            startDate.setFullYear(startDate.getFullYear() - 1);
            initializeGrid();
        });

        nextYearBtn.addEventListener('click', () => {
            startDate.setFullYear(startDate.getFullYear() + 1);
            initializeGrid();
        });

        resetBtn.addEventListener('click', () => {
            initializeGrid();
            todoList.clear();
            renderTodoList();
        });

        randomizeBtn.addEventListener('click', () => {
            grid = grid.map(row => row.map(() => Math.floor(Math.random() * LEVELS)));
            renderGrid();
            todoList.clear();
            grid.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (cell > 0) {
                        updateTodoList(i, j, 0, cell);
                    }
                });
            });
            updateStats();
        });

        syncGitHubBtn.addEventListener('click', () => {
            alert('This feature would typically connect to the GitHub API to fetch real contribution data. For this demo, we\'ll simulate a sync with random data.');
            randomizeBtn.click();
        });

        shareBtn.addEventListener('click', () => {
            const gridData = grid.flat().join('');
            const shareUrl = `${window.location.origin}${window.location.pathname}?grid=${gridData}&start=${startDate.toISOString()}`;
            shareUrlInput.value = shareUrl;
            alert('Share URL has been generated and copied to the input field below.');
        });

        goalInput.addEventListener('change', (e) => {
            contributionGoal = parseInt(e.target.value, 10);
            updateProgressBar();
        });

        document.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        // Initialize the app
        initializeGrid();
        renderColorPalette();
        document.querySelectorAll('.legend-item').forEach((item, index) => {
            item.style.backgroundColor = getColor(index);
        });

        // Load shared grid if present in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedGrid = urlParams.get('grid');
        const sharedStart = urlParams.get('start');
        if (sharedGrid && sharedStart) {
            startDate = new Date(sharedStart);
            grid = [];
            for (let i = 0; i < 7; i++) {
                grid.push(sharedGrid.slice(i * 53, (i + 1) * 53).split('').map(Number));
            }
            renderGrid();
            renderMonths();
            updateStats();
        }
