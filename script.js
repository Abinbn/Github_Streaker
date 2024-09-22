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
        let colorPalette = ['#cccccc', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
        let darkColorPalette = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
        let totalContributions = 0;
        let longestStreak = 0;
        let currentStreak = 0;
        let heatmapChart = null;
        let reminders = [];

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
        const printBtn = document.getElementById('printBtn');
        const saveBtn = document.getElementById('saveBtn');
        const loadBtn = document.getElementById('loadBtn');
        const reminderBtn = document.getElementById('reminderBtn');
        const tooltip = document.getElementById('tooltip');
        const statsContainer = document.getElementById('statsContainer');
        const colorPaletteContainer = document.getElementById('colorPalette');
        const shareUrlInput = document.getElementById('shareUrl');
        const textInput = document.getElementById('textInput');
        const achievementsContainer = document.getElementById('achievementsContainer');
        const gridViewBtn = document.getElementById('gridViewBtn');
        const heatmapViewBtn = document.getElementById('heatmapViewBtn');
        const heatmapContainer = document.getElementById('heatmap');
        const sharePopup = document.getElementById('sharePopup');
        const reminderPopup = document.getElementById('reminderPopup');
        const addReminderBtn = document.getElementById('addReminderBtn');
        const remindersContainer = document.getElementById('remindersContainer');
        const timelapse = document.getElementById('timelapse');
        const timelapseHandle = document.getElementById('timelapseHandle');

        const achievements = [
            { name: 'First Contribution', description: 'Make your first contribution', icon: 'mdi:star-outline', condition: () => totalContributions > 0 },
            { name: 'Consistent Contributor', description: 'Contribute for 7 days in a row', icon: 'mdi:calendar-check', condition: () => longestStreak >= 7 },
            { name: 'Coding Machine', description: 'Make 100 contributions', icon: 'mdi:robot', condition: () => totalContributions >= 100 },
            { name: 'Open Source Hero', description: 'Reach a 30-day streak', icon: 'mdi:trophy', condition: () => longestStreak >= 30 },
            { name: 'Contribution Master', description: 'Make 1000 contributions', icon: 'mdi:crown', condition: () => totalContributions >= 1000 },
        ];

        const patterns = {
            heart: [
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0],
                [0,0,0,1,0,0,0]
            ],
            star: [
                [0,0,0,1,0,0,0],
                [0,0,1,1,1,0,0],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,0,1,0,0],
                [0,1,0,0,0,1,0]
            ]
        };

        function initializeGrid() {
            grid = Array(7).fill().map(() => Array(53).fill(0));
            renderGrid();
            renderMonths();
            updateStats();
            renderAchievements();
        }

        function renderGrid() {
            gridElement.innerHTML = '';
            grid.forEach((row, i) => {
                row.forEach((cell, j) => {
                    const cellElement = document.createElement('div');
                    cellElement.className = 'cell';
                    cellElement.style.backgroundColor = getColor(cell);
                    cellElement.addEventListener('mousedown', (e) => handleMouseDown(e, i, j));
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

        function handleMouseDown(event, row, col) {
            if (event.ctrlKey) {
                updateGrid(row, col, 0);
            } else {
                isDrawing = true;
                updateGrid(row, col);
            }
        }

        function handleMouseEnter(event, row, col) {
            if (isDrawing && event.buttons === 1) {
                updateGrid(row, col);
            }
        }

        function updateGrid(row, col, forcedLevel = null) {
            const oldLevel = grid[row][col];
            const newLevel = forcedLevel !== null ? forcedLevel : (oldLevel + 1) % LEVELS;
            grid[row][col] = newLevel;
            animateCell(row, col, oldLevel, newLevel);
            updateTodoList(row, col, oldLevel, newLevel);
            updateStats();
            renderAchievements();
            if (heatmapChart) {
                updateHeatmap();
            }
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
            longestStreak = calculateLongestStreak();
            currentStreak = calculateCurrentStreak();

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
            if (heatmapChart) {
                updateHeatmap();
            }
        }

        function renderAchievements() {
            achievementsContainer.innerHTML = '';
            achievements.forEach(achievement => {
                const achievementElement = document.createElement('div');
                achievementElement.className = `achievement ${achievement.condition() ? '' : 'achievement-locked'}`;
                achievementElement.innerHTML = `
                    <span class="iconify" data-icon="${achievement.icon}"></span>
                    <p>${achievement.name}</p>
                `;
                achievementElement.title = achievement.description;
                achievementsContainer.appendChild(achievementElement);
            });
        }

        function updateHeatmap() {
            const data = grid.flat();
            heatmapChart.data.datasets[0].data = data.map((value, index) => ({
                x: index % 53,
                y: Math.floor(index / 53),
                v: value
            }));
            heatmapChart.update();
        }

        function createHeatmap() {
            const ctx = document.getElementById('heatmap').getContext('2d');
            const data = grid.flat();
            heatmapChart = new Chart(ctx, {
                type: 'heatmap',
                data: {
                    datasets: [{
                        data: data.map((value, index) => ({
                            x: index % 53,
                            y: Math.floor(index / 53),
                            v: value
                        })),
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            min: 0,
                            max: 52,
                            ticks: {
                                stepSize: 1,
                                callback: function(value, index, values) {
                                    return index % 4 === 0 ? MONTHS[Math.floor(index / 4)] : '';
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            position: 'left',
                            min: 0,
                            max: 6,
                            ticks: {
                                stepSize: 1,
                                callback: function(value, index, values) {
                                    return DAYS[Math.floor(index / 2)];
                                }
                            }
                        }
                    }
                }
            });
        }

        function updateTextOnGrid() {
            const text = textInput.value.toUpperCase();
            const textGrid = textToPixels(text);
            
            // Clear the grid
            grid = grid.map(row => row.map(() => 0));
            
            // Place the text grid in the center of the main grid
            const startRow = Math.floor((7 - textGrid.length) / 2);
            const startCol = Math.floor((53 - textGrid[0].length) / 2);
            
            textGrid.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (startRow + i < 7 && startCol + j < 53) {
                        grid[startRow + i][startCol + j] = cell ? 4 : 0; // Use maximum level for text pixels
                    }
                });
            });
            
            renderGrid();
            updateStats();
            renderAchievements();
            if (heatmapChart) {
                updateHeatmap();
            }
        }

        function textToPixels(text) {
            const charWidth = 5;
            const charHeight = 7;
            const spacing = 1;
            
            const pixels = [];
            for (let i = 0; i < charHeight; i++) {
                pixels.push(new Array(text.length * (charWidth + spacing)).fill(0));
            }
            
            text.split('').forEach((char, charIndex) => {
                const charPixels = getCharPixels(char);
                for (let i = 0; i < charHeight; i++) {
                    for (let j = 0; j < charWidth; j++) {
                        if (charPixels[i][j]) {
                            pixels[i][charIndex * (charWidth + spacing) + j] = 1;
                        }
                    }
                }
            });
            
            return pixels;
        }

        function getCharPixels(char) {
            const charPatterns = {
                'A': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    'B': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0]
    ],
    'C': [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [0,1,1,1,1]
    ],
    'D': [
        [1,1,1,0,0],
        [1,0,0,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,1,0],
        [1,1,1,0,0]
    ],
    'E': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ],
    'F': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0]
    ],
    'G': [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,1]
    ],
    'H': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    'I': [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1]
    ],
    'J': [
        [0,0,0,1,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    'K': [
        [1,0,0,0,1],
        [1,0,0,1,0],
        [1,0,1,0,0],
        [1,1,0,0,0],
        [1,0,1,0,0],
        [1,0,0,1,0],
        [1,0,0,0,1]
    ],
    'L': [
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ],
    'M': [
        [1,0,0,0,1],
        [1,1,0,1,1],
        [1,0,1,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    'N': [
        [1,0,0,0,1],
        [1,1,0,0,1],
        [1,0,1,0,1],
        [1,0,0,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    'O': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    'P': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0]
    ],
    'Q': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,0,0,1,0],
        [0,1,1,0,1]
    ],
    'R': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,1,0,0],
        [1,0,0,1,0],
        [1,0,0,0,1]
    ],
    'S': [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [0,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,1,1,1,0]
    ],
    'T': [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0]
    ],
    'U': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    'V': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0]
    ],
    'W': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,1,0,1,1],
        [1,0,0,0,1]
    ],
    'X': [
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1]
    ],
    'Y': [
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0]
    ],
    'Z': [
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ],
    '0': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '1': [
        [0,0,1,0,0],
        [0,1,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,1,1,1,0]
    ],
    '2': [
        [1,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ],
    '3': [
        [1,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,1,1,1,0]
    ],
    '4': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,0,1]
    ],
    '5': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,1,1,1,0]
    ],
    '6': [
        [0,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '7': [
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0]
    ],
    '8': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '9': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,1,1,1,0]
    ],
     '!': [
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,0,0],
        [0,1,0],
        [0,0,0]
    ],
    '@': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,1,1,1],
        [1,0,1,0,0],
        [1,0,1,1,1],
        [1,0,0,0,0],
        [0,1,1,1,1]
    ],
    '#': [
        [0,1,0,1,0],
        [1,1,1,1,1],
        [0,1,0,1,0],
        [1,1,1,1,1],
        [0,1,0,1,0],
        [0,1,0,1,0],
        [0,0,0,0,0]
    ],
    '$': [
        [0,0,1,0,0],
        [0,1,1,1,1],
        [1,0,1,0,0],
        [0,1,1,1,0],
        [0,0,1,0,1],
        [1,1,1,1,0],
        [0,0,1,0,0]
    ],
    '%': [
        [1,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,1]
    ],
    '^': [
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    '&': [
        [0,1,1,0,0],
        [1,0,0,1,0],
        [0,1,1,0,0],
        [1,0,1,0,1],
        [1,0,0,1,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '*': [
        [0,1,0],
        [1,1,1],
        [0,1,0],
        [1,1,1],
        [0,1,0],
        [0,0,0],
        [0,0,0]
    ],
    '(': [
        [0,0,1,0],
        [0,1,0,0],
        [1,0,0,0],
        [1,0,0,0],
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0]
    ],
    ')': [
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0],
        [0,0,1,0],
        [0,0,1,0],
        [0,1,0,0],
        [1,0,0,0]
    ],
    '_': [
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0]
    ],
    '-': [
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0]
    ],
    '=': [
        [0,0,0,0],
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    
    '+': [
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    '<': [
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,0,0,1,0]
    ],
    '>': [
        [1,0,0,0,0],
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0]
    ],
    ',': [
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [0,1,0],
        [0,1,0],
        [1,0,0]
    ],
    '.': [
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [0,0,0],
        [1,1,0],
        [1,1,0]
    ],
    '?': [
        [0,1,1,0],
        [1,0,0,1],
        [0,0,0,1],
        [0,0,1,0],
        [0,0,1,0],
        [0,0,0,0],
        [0,0,1,0]
    ],
    '/': [
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    ':': [
        [0,0,0],
        [1,1,0],
        [1,1,0],
        [0,0,0],
        [1,1,0],
        [1,1,0],
        [0,0,0]
    ],
    ';': [
        [0,0,0],
        [1,1,0],
        [1,1,0],
        [0,0,0],
        [0,1,0],
        [0,1,0],
        [1,0,0]
    ],
    '"': [
        [1,1,0,1,1],
        [1,1,0,1,1],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    "'": [
        [1,0],
        [1,0],
        [0,0],
        [0,0],
        [0,0],
        [0,0],
        [0,0]
    ],
    '{': [
        [0,0,1],
        [0,1,0],
        [0,1,0],
        [1,0,0],
        [0,1,0],
        [0,1,0],
        [0,0,1]
    ],
    '}': [
        [1,0,0],
        [0,1,0],
        [0,1,0],
        [0,0,1],
        [0,1,0],
        [0,1,0],
        [1,0,0]
    ],
    '[': [
        [0,1,1],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,1]
    ],
     ']': [
        [1,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [1,1,0]
    ],
    '\\': [
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0]
    ],
    '|': [
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0]
    ],
    '~': [
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,1,0,1,0,1],
        [1,0,1,0,1,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0]
    ],
    '`': [
        [1,0],
        [0,1],
        [0,0],
        [0,0],
        [0,0],
        [0,0],
        [0,0]
    ],
                // Add more characters as needed
            };
            return charPatterns[char] || charPatterns['A']; // Default to 'A' if character is not found
        }

        function saveToLocalStorage() {
            const data = {
                grid: grid,
                startDate: startDate.toISOString(),
                todoList: Array.from(todoList.entries()),
                colorPalette: colorPalette,
                darkColorPalette: darkColorPalette
            };
            localStorage.setItem('githubStreakCreator', JSON.stringify(data));
            alert('Data saved successfully!');
        }

        function loadFromLocalStorage() {
            const savedData = localStorage.getItem('githubStreakCreator');
            if (savedData) {
                const data = JSON.parse(savedData);
                grid = data.grid;
                startDate = new Date(data.startDate);
                todoList = new Map(data.todoList);
                colorPalette = data.colorPalette;
                darkColorPalette = data.darkColorPalette;
                renderGrid();
                renderMonths();
                renderTodoList();
                updateStats();
                renderAchievements();
                renderColorPalette();
                if (heatmapChart) {
                    updateHeatmap();
                }
                alert('Data loaded successfully!');
            } else {
                alert('No saved data found.');
            }
        }

        function showSharePopup() {
            const gridData = grid.flat().join('');
            const shareUrl = `${window.location.origin}${window.location.pathname}?grid=${gridData}&start=${startDate.toISOString()}`;
            shareUrlInput.value = shareUrl;
            sharePopup.style.display = 'block';
        }

        function hideSharePopup() {
            sharePopup.style.display = 'none';
        }

        function showReminderPopup() {
            reminderPopup.style.display = 'block';
        }

        function hideReminderPopup() {
            reminderPopup.style.display = 'none';
        }

        function addReminder() {
            const date = document.getElementById('reminderDate').value;
            const text = document.getElementById('reminderText').value;
            if (date && text) {
                reminders.push({ date, text });
                renderReminders();
                hideReminderPopup();
            } else {
                alert('Please fill in both date and reminder text.');
            }
        }

        function renderReminders() {
            remindersContainer.innerHTML = '';
            reminders.forEach((reminder, index) => {
                const reminderElement = document.createElement('div');
                reminderElement.className = 'reminder-item';
                reminderElement.innerHTML = `
                    <span>${reminder.date}: ${reminder.text}</span>
                    <button onclick="removeReminder(${index})">Remove</button>
                `;
                remindersContainer.appendChild(reminderElement);
            });
        }

        function removeReminder(index) {
            reminders.splice(index, 1);
            renderReminders();
        }

        function applyPattern(pattern) {
            const startRow = Math.floor((7 - pattern.length) / 2);
            const startCol = Math.floor((53 - pattern[0].length) / 2);
            
            pattern.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (startRow + i < 7 && startCol + j < 53) {
                        grid[startRow + i][startCol + j] = cell ? 4 : 0;
                    }
                });
            });
            
            renderGrid();
            updateStats();
            renderAchievements();
            if (heatmapChart) {
                updateHeatmap();
            }
        }

        

        darkModeToggle.addEventListener('change', () => {
            darkMode = darkModeToggle.checked;
            document.body.classList.toggle('dark-mode', darkMode);
            renderGrid();
            renderColorPalette();
            document.querySelectorAll('.legend-item').forEach((item, index) => {
                item.style.backgroundColor = getColor(index);
            });
            if (heatmapChart) {
                updateHeatmap();
            }
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
            randomizeBtn.classList.add('loading');
            setTimeout(() => {
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
                renderAchievements();
                if (heatmapChart) {
                    updateHeatmap();
                }
                randomizeBtn.classList.remove('loading');
            }, 1000);
        });






// Implement timelapse functionality
let timelapseInterval;
let currentFrame = 0;
const totalFrames = 53 * 7;

function startTimelapse() {
    stopTimelapse(); // Stop any existing timelapse

    timelapseInterval = setInterval(() => {
        const row = currentFrame % 7;
        const col = Math.floor(currentFrame / 7);
        
        updateGrid(row, col, Math.floor(Math.random() * LEVELS));
        
        currentFrame++;
        timelapseHandle.style.left = `${(currentFrame / totalFrames) * 100}%`;
        
        if (currentFrame >= totalFrames) {
            stopTimelapse();
        }
    }, 50);
}

function stopTimelapse() {
    clearInterval(timelapseInterval);
}

function setTimelapsePosition(percentage) {
    currentFrame = Math.floor(percentage * totalFrames);
    timelapseHandle.style.left = `${percentage * 100}%`;
    
    // Update grid based on current frame
    for (let i = 0; i < currentFrame; i++) {
        const row = i % 7;
        const col = Math.floor(i / 7);
        grid[row][col] = Math.floor(Math.random() * LEVELS);
    }
    
    renderGrid();
    updateStats();
    renderAchievements();
    if (heatmapChart) {
        updateHeatmap();
    }
}

// Update event listeners for timelapse
timelapse.addEventListener('click', (e) => {
    const rect = timelapse.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setTimelapsePosition(percentage);
});

timelapseHandle.addEventListener('mousedown', (e) => {
    const move = (moveEvent) => {
        const rect = timelapse.getBoundingClientRect();
        let x = moveEvent.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percentage = x / rect.width;
        setTimelapsePosition(percentage);
    };
    
    const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
    };
    
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
});

// Add buttons to control timelapse
const startTimelapseBtn = document.createElement('button');
startTimelapseBtn.textContent = 'Start Timelapse';
startTimelapseBtn.addEventListener('click', startTimelapse);

const stopTimelapseBtn = document.createElement('button');
stopTimelapseBtn.textContent = 'Stop Timelapse';
stopTimelapseBtn.addEventListener('click', stopTimelapse);

// Add these buttons to your controls div
document.querySelector('.controls').appendChild(startTimelapseBtn);
document.querySelector('.controls').appendChild(stopTimelapseBtn);








        syncGitHubBtn.addEventListener('click', () => {
            syncGitHubBtn.classList.add('loading');
            setTimeout(() => {
                alert('This feature would typically connect to the GitHub API to fetch real contribution data. For this demo, we\'ll simulate a sync with random data.');
                randomizeBtn.click();
                syncGitHubBtn.classList.remove('loading');
            }, 2000);
        });

        shareBtn.addEventListener('click', showSharePopup);

        printBtn.addEventListener('click', () => {
            const printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>Todo List</title>');
            printWindow.document.write('<style>body { font-family: Arial, sans-serif; } .todo-item { background-color: #f6f8fa; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); margin-bottom: 20px; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h1>Todo List</h1>');
            todoList.forEach((item, date) => {
                printWindow.document.write(`<div class="todo-item"><h3>${new Date(date).toDateString()}</h3><p>${item.suggestion}</p></div>`);
            });
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        });

        saveBtn.addEventListener('click', saveToLocalStorage);
        loadBtn.addEventListener('click', loadFromLocalStorage);
        reminderBtn.addEventListener('click', showReminderPopup);
        addReminderBtn.addEventListener('click', addReminder);

        textInput.addEventListener('input', updateTextOnGrid);

        gridViewBtn.addEventListener('click', () => {
            gridElement.style.display = 'grid';
            heatmapContainer.style.display = 'none';
        });

        heatmapViewBtn.addEventListener('click', () => {
            gridElement.style.display = 'none';
            heatmapContainer.style.display = 'block';
            if (!heatmapChart) {
                createHeatmap();
            } else {
                updateHeatmap();
            }
        });

        document.querySelectorAll('.close-popup').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                sharePopup.style.display = 'none';
                reminderPopup.style.display = 'none';
            });
        });

        timelapse.addEventListener('click', (e) => {
            const rect = timelapse.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            timelapseHandle.style.left = `${percentage * 100}%`;
            // You can use the percentage to update the grid state
        });

        timelapseHandle.addEventListener('mousedown', (e) => {
            const move = (moveEvent) => {
                const rect = timelapse.getBoundingClientRect();
                let x = moveEvent.clientX - rect.left;
                x = Math.max(0, Math.min(x, rect.width));
                const percentage = x / rect.width;
                timelapseHandle.style.left = `${percentage * 100}%`;
                // You can use the percentage to update the grid state
            };
            
            const up = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };
            
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
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
            renderAchievements();
        }