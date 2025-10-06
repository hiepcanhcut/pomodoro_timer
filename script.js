/**
 * Pomodoro Timer Application
 * State Management và Core Logic
 */

class PomodoroTimer {
    constructor() {
        this.state = {
            mode: 'work', // work, break, long
            work: 25 * 60,
            break: 5 * 60,
            long: 15 * 60,
            sessionsBeforeLong: 4,
            timeLeft: 25 * 60,
            timer: null,
            running: false,
            sessionCount: 0,
            totalSessions: 0,
            totalWorkTime: 0,
            autoStart: false,
            sound: true,
            dark: false
        };

        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.loadStats();
        this.updateDisplay();
    }

    initializeElements() {
        // Timer elements
        this.display = document.getElementById('display');
        this.modeLabel = document.getElementById('modeLabel');
        this.clock = document.getElementById('clock');
        
        // Control buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Input fields
        this.workInput = document.getElementById('workInput');
        this.breakInput = document.getElementById('breakInput');
        this.longInput = document.getElementById('longInput');
        this.sessionsBeforeLong = document.getElementById('sessionsBeforeLong');
        
        // Toggle switches
        this.autoSwitch = document.getElementById('autoSwitch');
        this.soundSwitch = document.getElementById('soundSwitch');
        this.darkSwitch = document.getElementById('darkSwitch');
        
        // Preset buttons
        this.presetButtons = document.querySelectorAll('.preset');
        
        // Stats elements
        this.sessionsToday = document.getElementById('sessionsToday');
        this.totalSessionsEl = document.getElementById('totalSessions');
        this.workTime = document.getElementById('workTime');

        // Audio context for sound notifications
        this.audioCtx = null;
    }

    bindEvents() {
        // Timer controls
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.skipBtn.addEventListener('click', () => this.skipSession());
        this.saveBtn.addEventListener('click', () => this.saveSettings());
        this.resetBtn.addEventListener('click', () => this.resetStatistics());

        // Toggle switches
        this.autoSwitch.addEventListener('click', () => this.toggleAutoStart());
        this.soundSwitch.addEventListener('click', () => this.toggleSound());
        this.darkSwitch.addEventListener('click', () => this.toggleDarkMode());

        // Preset buttons
        this.presetButtons.forEach(button => {
            button.addEventListener('click', (e) => this.loadPreset(e.target));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Timer control methods
    startTimer() {
        if (this.state.running) return;
        
        this.state.running = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.state.timer = setInterval(() => this.tick(), 1000);
        
        // Add breathing animation to clock
        this.clock.classList.add('breathing');
        
        this.notify(`${this.state.mode === 'work' ? 'Bắt đầu làm việc' : 'Bắt đầu nghỉ ngơi'}!`);
    }

    pauseTimer() {
        if (!this.state.running) return;
        
        this.state.running = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        clearInterval(this.state.timer);
        
        // Remove animation
        this.clock.classList.remove('breathing');
        
        this.notify('Đã tạm dừng');
    }

    resetTimer() {
        this.pauseTimer();
        this.state.timeLeft = this.getTotalForMode();
        this.updateDisplay();
        this.notify('Đã đặt lại');
    }

    skipSession() {
        this.pauseTimer();
        this.completeSession();
    }

    tick() {
        this.state.timeLeft--;
        
        if (this.state.timeLeft <= 0) {
            this.completeSession();
        }
        
        this.updateDisplay();
    }

    completeSession() {
        this.pauseTimer();

        if (this.state.mode === 'work') {
            // Track work session completion
            this.state.sessionCount++;
            this.state.totalSessions++;
            this.state.totalWorkTime += this.state.work;
            
            // Play completion sound
            if (this.state.sound) {
                this.playCompletionSound();
            }
            
            // Determine next mode
            const nextMode = (this.state.sessionCount % this.state.sessionsBeforeLong === 0) ? 'long' : 'break';
            this.state.mode = nextMode;
            this.state.timeLeft = this.getTotalForMode();
            
            this.notify(
                nextMode === 'long' 
                    ? 'Hoàn thành phiên làm việc! Đến lúc nghỉ dài.' 
                    : 'Hoàn thành phiên làm việc! Đến lúc nghỉ ngắn.',
                5000
            );
        } else {
            // Break completed, back to work
            this.state.mode = 'work';
            this.state.timeLeft = this.state.work;
            this.notify('Kết thúc nghỉ ngơi! Quay lại làm việc.', 3000);
        }
        
        this.updateDisplay();
        this.updateStats();
        this.saveStats();
        
        // Auto-start next session if enabled
        if (this.state.autoStart) {
            setTimeout(() => this.startTimer(), 1000);
        }
    }

    getTotalForMode() {
        switch (this.state.mode) {
            case 'work': return this.state.work;
            case 'break': return this.state.break;
            case 'long': return this.state.long;
            default: return this.state.work;
        }
    }

    // Display methods
    updateDisplay() {
        this.display.textContent = this.formatTime(this.state.timeLeft);
        this.updateModeLabel();
        this.updateClockStyle();
        this.updateStats();
    }

    updateModeLabel() {
        let modeText = '';
        switch (this.state.mode) {
            case 'work':
                modeText = 'Làm việc';
                break;
            case 'break':
                modeText = 'Nghỉ ngắn';
                break;
            case 'long':
                modeText = 'Nghỉ dài';
                break;
        }
        this.modeLabel.textContent = modeText;
    }

    updateClockStyle() {
        let borderColor = '';
        switch (this.state.mode) {
            case 'work':
                borderColor = 'rgba(231, 76, 60, 0.1)';
                break;
            case 'break':
                borderColor = 'rgba(46, 204, 113, 0.1)';
                break;
            case 'long':
                borderColor = 'rgba(52, 152, 219, 0.1)';
                break;
        }
        this.clock.style.borderColor = borderColor;
    }

    updateStats() {
        this.sessionsToday.textContent = this.state.sessionCount;
        this.totalSessionsEl.textContent = this.state.totalSessions;
        
        const hours = Math.floor(this.state.totalWorkTime / 3600);
        const minutes = Math.floor((this.state.totalWorkTime % 3600) / 60);
        this.workTime.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Sound methods
    playCompletionSound() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.4);
            
            gainNode.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            oscillator.start(this.audioCtx.currentTime);
            oscillator.stop(this.audioCtx.currentTime + 0.6);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }

    // Notification methods
    notify(message, duration = 3000) {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Settings methods
    loadPreset(button) {
        // Remove active class from all presets
        this.presetButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked preset
        button.classList.add('active');
        
        // Update inputs and state
        this.workInput.value = button.dataset.work;
        this.breakInput.value = button.dataset.break;
        this.longInput.value = button.dataset.long;
        
        this.state.work = parseInt(button.dataset.work) * 60;
        this.state.break = parseInt(button.dataset.break) * 60;
        this.state.long = parseInt(button.dataset.long) * 60;
        this.state.timeLeft = this.state.work;
        this.state.mode = 'work';
        
        this.updateDisplay();
    }

    toggleAutoStart() {
        this.state.autoStart = !this.state.autoStart;
        this.autoSwitch.classList.toggle('on');
        this.saveSettings();
    }

    toggleSound() {
        this.state.sound = !this.state.sound;
        this.soundSwitch.classList.toggle('on');
        this.saveSettings();
    }

    toggleDarkMode() {
        this.state.dark = !this.state.dark;
        this.darkSwitch.classList.toggle('on');
        document.body.classList.toggle('dark-mode');
        this.saveSettings();
    }

    saveSettings() {
        // Update state from input fields
        this.state.work = parseInt(this.workInput.value) * 60;
        this.state.break = parseInt(this.breakInput.value) * 60;
        this.state.long = parseInt(this.longInput.value) * 60;
        this.state.sessionsBeforeLong = parseInt(this.sessionsBeforeLong.value);
        
        // Reset timer if not running
        if (!this.state.running) {
            this.state.timeLeft = this.getTotalForMode();
            this.updateDisplay();
        }
        
        // Save to localStorage
        const settings = {
            work: this.state.work,
            break: this.state.break,
            long: this.state.long,
            sessionsBeforeLong: this.state.sessionsBeforeLong,
            autoStart: this.state.autoStart,
            sound: this.state.sound,
            dark: this.state.dark
        };
        localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
        
        this.notify('Đã lưu cài đặt!');
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('pomodoro_settings');
            if (!raw) return;
            
            const settings = JSON.parse(raw);
            
            // Update state
            this.state.work = settings.work || this.state.work;
            this.state.break = settings.break || this.state.break;
            this.state.long = settings.long || this.state.long;
            this.state.sessionsBeforeLong = settings.sessionsBeforeLong || this.state.sessionsBeforeLong;
            this.state.autoStart = settings.autoStart || this.state.autoStart;
            this.state.sound = typeof settings.sound === 'boolean' ? settings.sound : this.state.sound;
            this.state.dark = settings.dark || this.state.dark;
            
            // Update UI
            this.workInput.value = Math.floor(this.state.work / 60);
            this.breakInput.value = Math.floor(this.state.break / 60);
            this.longInput.value = Math.floor(this.state.long / 60);
            this.sessionsBeforeLong.value = this.state.sessionsBeforeLong;
            
            if (this.state.autoStart) this.autoSwitch.classList.add('on');
            if (this.state.sound) this.soundSwitch.classList.add('on');
            if (this.state.dark) {
                this.darkSwitch.classList.add('on');
                document.body.classList.add('dark-mode');
            }
            
            this.state.timeLeft = this.getTotalForMode();
        } catch (error) {
            console.warn('Error loading settings:', error);
        }
    }

    // Statistics methods
    resetStatistics() {
        if (confirm('Bạn có chắc chắn muốn đặt lại tất cả thống kê?')) {
            this.state.sessionCount = 0;
            this.state.totalSessions = 0;
            this.state.totalWorkTime = 0;
            this.updateStats();
            this.saveStats();
            this.notify('Đã đặt lại thống kê!');
        }
    }

    saveStats() {
        const stats = {
            sessionCount: this.state.sessionCount,
            totalSessions: this.state.totalSessions,
            totalWorkTime: this.state.totalWorkTime,
            lastDate: new Date().toDateString()
        };
        localStorage.setItem('pomodoro_stats', JSON.stringify(stats));
    }

    loadStats() {
        try {
            const raw = localStorage.getItem('pomodoro_stats');
            if (!raw) return;
            
            const stats = JSON.parse(raw);
            const today = new Date().toDateString();
            
            // Reset daily stats if it's a new day
            if (stats.lastDate !== today) {
                this.state.sessionCount = 0;
                this.state.totalWorkTime = 0;
            } else {
                this.state.sessionCount = stats.sessionCount || 0;
                this.state.totalWorkTime = stats.totalWorkTime || 0;
            }
            
            this.state.totalSessions = stats.totalSessions || 0;
        } catch (error) {
            console.warn('Error loading stats:', error);
        }
    }

    // Keyboard shortcuts
    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT') return;
        
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.state.running ? this.pauseTimer() : this.startTimer();
                break;
            case 'KeyR':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.resetTimer();
                }
                break;
            case 'KeyS':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.skipSession();
                }
                break;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroApp = new PomodoroTimer();
});