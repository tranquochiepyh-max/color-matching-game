// ==========================================
// HỆ THỐNG DATABASE ẢO (LOCAL STORAGE)
// ==========================================
let currentUser = null; // Tên user đang đăng nhập (null = chưa đăng nhập, 'guest' = khách)
let currentStreak = 0;
let virtualMoney = 0;

// Các phần tử UI của Auth
const authModal = document.getElementById('auth-modal');
const gameWrapper = document.getElementById('game-wrapper');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const authError = document.getElementById('auth-error');
const playerNameDisplay = document.getElementById('player-name-display');

// ĐĂNG KÝ TÀI KHOẢN MỚI
document.getElementById('register-btn').addEventListener('click', () => {
    let user = usernameInput.value.trim().toLowerCase();
    let pass = passwordInput.value.trim();
    
    if (!user || !pass) {
        authError.innerText = "Vui lòng nhập tài khoản và mật khẩu!";
        return;
    }
    
    let db = JSON.parse(localStorage.getItem('gameUsersDB')) || {};
    
    if (db[user]) {
        authError.innerText = "Tên tài khoản này đã có người sử dụng!";
    } else {
        // Tạo hồ sơ mới
        db[user] = { password: pass, streak: 0, money: 0 };
        localStorage.setItem('gameUsersDB', JSON.stringify(db));
        authError.style.color = "#2ecc71";
        authError.innerText = "Đăng ký thành công! Đang vào game...";
        
        setTimeout(() => loginSuccess(user, 0, 0), 1000);
    }
});

// ĐĂNG NHẬP
document.getElementById('login-btn').addEventListener('click', () => {
    let user = usernameInput.value.trim().toLowerCase();
    let pass = passwordInput.value.trim();
    
    if (!user || !pass) {
        authError.innerText = "Vui lòng nhập tài khoản và mật khẩu!";
        return;
    }
    
    let db = JSON.parse(localStorage.getItem('gameUsersDB')) || {};
    
    if (db[user] && db[user].password === pass) {
        // Đúng mật khẩu -> Tải dữ liệu
        loginSuccess(user, db[user].streak, db[user].money);
    } else {
        authError.style.color = "#e74c3c";
        authError.innerText = "Sai tài khoản hoặc mật khẩu!";
    }
});

// CHƠI KHÁCH
document.getElementById('guest-btn').addEventListener('click', () => {
    loginSuccess('guest', 0, 0);
});

// ĐĂNG XUẤT
document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    currentStreak = 0;
    virtualMoney = 0;
    usernameInput.value = "";
    passwordInput.value = "";
    authError.innerText = "";
    gameWrapper.style.display = "none";
    authModal.style.display = "flex";
});

function loginSuccess(username, streak, money) {
    currentUser = username;
    currentStreak = streak;
    virtualMoney = money;
    
    authModal.style.display = "none";
    gameWrapper.style.display = "flex";
    
    if (currentUser === 'guest') {
        playerNameDisplay.innerText = "Chế độ: Khách (Không lưu tiến trình)";
    } else {
        playerNameDisplay.innerText = "Xin chào, " + currentUser;
    }
    
    loadNewLevel(); // Tải game sau khi đăng nhập xong
}

// LƯU TIẾN TRÌNH VÀO BỘ NHỚ (Chỉ lưu nếu không phải Guest)
function saveProgress() {
    if (currentUser && currentUser !== 'guest') {
        let db = JSON.parse(localStorage.getItem('gameUsersDB')) || {};
        // Đảm bảo user tồn tại trước khi cập nhật
        if(db[currentUser]) {
            db[currentUser].streak = currentStreak;
            db[currentUser].money = virtualMoney;
            localStorage.setItem('gameUsersDB', JSON.stringify(db));
        }
    }
}


// ==========================================
// HỆ THỐNG GAME LÕI (Không đổi)
// ==========================================
const shirtImg = document.getElementById('shirt-img');
const bodyImg = document.getElementById('body-img'); 
const targetImg = document.getElementById('target-img');
const colorOverlay = document.getElementById('color-overlay');
const hueSlider = document.getElementById('hue');
const saturationSlider = document.getElementById('saturation');
const brightnessSlider = document.getElementById('brightness');
const quickColor = document.getElementById('quick-color'); 
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');
const resultText = document.getElementById('result-text');
const originalBox = document.getElementById('original-box');
const charNameDisplay = document.getElementById('character-name-display'); 
const controlsPanel = document.getElementById('controls-panel'); 
const resultModal = document.getElementById('result-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalScore = document.getElementById('modal-score');
const modalComment = document.getElementById('modal-comment');

const levelList = [
    "naruto_236_142_70.png", "doraemon_0_151_227.png", "shin_229_38_56.png",
    "piccolo_108_33_118.png", "pikachu_255_217_36.png", "hattori heji_225_157_104.png",
    "hulk_139_175_66.png", "sakura_239_191_191.png", "anya forger_245_188_171.png",
    "mitsuri kanroji_188_205_126.png", "joe swanson_189_193_196.png", "deku_29_105_75.png",
    "nobi nobita_254_223_106.png", "toru kazama_41_189_215.png", "minions_235_205_71.png",
    "jerry mouse_210_144_34.png", "chopper_231_90_106.png"
];

let targetR = 0, targetG = 0, targetB = 0;
let playBag = [];
let lastPlayed = ""; 

function getDifficultyConfig() {
    if (currentStreak <= 4) return { level: "Very Easy", req: 80 };
    if (currentStreak <= 9) return { level: "Easy", req: 85 };
    if (currentStreak <= 14) return { level: "Normal", req: 90 };
    if (currentStreak <= 19) return { level: "Hard", req: 95 };
    return { level: "Impossible", req: 99 };
}

function updateHUD() {
    let diff = getDifficultyConfig();
    document.getElementById('streak-display').innerText = `🔥 Chuỗi: ${currentStreak} (${diff.level} - Yêu cầu: >= ${diff.req}%)`;
    document.getElementById('money-display').innerText = `💰 Tài khoản: ${virtualMoney} Tỷ VNĐ`;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }

function loadNewLevel() {
    updateHUD();
    if (playBag.length === 0) playBag = [...levelList]; 
    let randomIndex = Math.floor(Math.random() * playBag.length);
    let chosenFileName = playBag[randomIndex];
    if (playBag.length > 1 && chosenFileName === lastPlayed) {
        randomIndex = (randomIndex + 1) % playBag.length;
        chosenFileName = playBag[randomIndex];
    }
    playBag.splice(randomIndex, 1);
    lastPlayed = chosenFileName;
    let parts = chosenFileName.split('.')[0].split('_'); 
    targetB = parseInt(parts.pop()); targetG = parseInt(parts.pop()); targetR = parseInt(parts.pop()); 
    let rawCharName = parts.join('_'); 
    let charName = rawCharName.toLowerCase();
    charNameDisplay.innerText = "Nhân vật của bạn: " + rawCharName.replace(/_/g, ' ');
    
    let cacheBuster = new Date().getTime();
    targetImg.src = `character-original/${chosenFileName}?v=${cacheBuster}`;
    bodyImg.src = `body/${charName}_body.png?v=${cacheBuster}`;
    shirtImg.src = `shirt/${charName}_255_255_255.png?v=${cacheBuster}`;
    colorOverlay.style.webkitMaskImage = `url('shirt/${charName}_255_255_255.png?v=${cacheBuster}')`;
    colorOverlay.style.webkitMaskSize = "100% 100%";
    colorOverlay.style.maskImage = `url('shirt/${charName}_255_255_255.png?v=${cacheBuster}')`;
    colorOverlay.style.maskSize = "100% 100%";

    resultText.innerHTML = "";
    originalBox.style.display = "none"; nextBtn.style.display = "none";
    checkBtn.style.display = "inline-block"; controlsPanel.style.display = "block"; 

    hueSlider.value = Math.floor(Math.random() * 360);
    saturationSlider.value = 70; brightnessSlider.value = 50;
    let rgb = hslToRgb(hueSlider.value, saturationSlider.value, brightnessSlider.value);
    quickColor.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
    changeShirtColor();
}

function changeShirtColor() {
    let h = parseInt(hueSlider.value); let s = parseInt(saturationSlider.value); let l = parseInt(brightnessSlider.value);
    colorOverlay.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
}

function calculateScore() {
    let hex = quickColor.value;
    let pR = parseInt(hex.substr(1, 2), 16); let pG = parseInt(hex.substr(3, 2), 16); let pB = parseInt(hex.substr(5, 2), 16);
    let rDiff = Math.abs(pR - targetR); let gDiff = Math.abs(pG - targetG); let bDiff = Math.abs(pB - targetB);
    let finalScore = 0;
    if (rDiff === 0 && gDiff === 0 && bDiff === 0) { finalScore = 100; } 
    else { let score = 100 - ((rDiff + gDiff + bDiff) / 765 * 100); finalScore = score > 0 ? Math.round(score) : 0; }

    let diffConfig = getDifficultyConfig();
    let isPass = finalScore >= diffConfig.req;
    let comment = "", encourageMsg = "";

    if (isPass) {
        currentStreak++; virtualMoney++;
        comment = finalScore === 100 ? `Tuyệt đỉnh! Hoàn hảo 100%! Bạn vượt qua mốc ${diffConfig.req}% một cách dễ dàng.` : `Thành công! Bạn đạt ${finalScore}%, đủ để vượt qua yêu cầu ${diffConfig.req}% của cấp độ ${diffConfig.level}.`;
        encourageMsg = `🔥 Chúc mừng! Chuỗi của bạn tăng lên ${currentStreak}. Tài khoản +1 Tỷ VNĐ. Tiếp tục nào!`;
        modalScore.style.color = "#28a745"; 
    } else {
        comment = `Rất tiếc! Cấp độ ${diffConfig.level} yêu cầu tối thiểu ${diffConfig.req}%, nhưng bạn chỉ đạt ${finalScore}%.`;
        encourageMsg = `💔 Chuỗi đã bị vỡ và quay về 0! Thất bại là mẹ thành công, hãy gỡ gạc lại ở ván sau!`;
        modalScore.style.color = "#e53935"; 
        currentStreak = 0;
    }

    updateHUD();
    saveProgress(); // BƯỚC ĐỘT PHÁ: Lệnh tự động sao lưu dữ liệu vào trình duyệt ngay lập tức

    originalBox.style.display = "flex"; controlsPanel.style.display = "none"; 
    checkBtn.style.display = "none"; nextBtn.style.display = "inline-block";
    
    modalScore.innerText = finalScore + "%"; modalComment.innerText = comment;
    resultText.innerHTML = `Độ giống nhau: <strong style="color: ${isPass ? '#28a745' : '#e53935'};">${finalScore}%</strong><br><span style="font-size: 20px; color: #555;">${encourageMsg}</span>`;
    resultModal.style.display = "flex";
}

closeModalBtn.onclick = function() { resultModal.style.display = "none"; }
window.onclick = function(event) { if (event.target == resultModal) resultModal.style.display = "none"; }

function syncColorPickerToSliders() {
    let hex = quickColor.value; let r = parseInt(hex.substr(1, 2), 16); let g = parseInt(hex.substr(3, 2), 16); let b = parseInt(hex.substr(5, 2), 16);
    let values = rgbToHsl(r, g, b); hueSlider.value = values[0]; saturationSlider.value = values[1]; brightnessSlider.value = values[2];
    changeShirtColor();
}

hueSlider.addEventListener('input', () => { let rgb = hslToRgb(hueSlider.value, saturationSlider.value, brightnessSlider.value); quickColor.value = rgbToHex(rgb[0], rgb[1], rgb[2]); changeShirtColor(); });
saturationSlider.addEventListener('input', () => { let rgb = hslToRgb(hueSlider.value, saturationSlider.value, brightnessSlider.value); quickColor.value = rgbToHex(rgb[0], rgb[1], rgb[2]); changeShirtColor(); });
brightnessSlider.addEventListener('input', () => { let rgb = hslToRgb(hueSlider.value, saturationSlider.value, brightnessSlider.value); quickColor.value = rgbToHex(rgb[0], rgb[1], rgb[2]); changeShirtColor(); });
quickColor.addEventListener('input', syncColorPickerToSliders);

checkBtn.addEventListener('click', calculateScore);
nextBtn.addEventListener('click', loadNewLevel);

// Xóa lệnh loadNewLevel() mặc định ở cuối file để chờ người chơi Đăng nhập trước