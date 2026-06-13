const darkButton = document.querySelector(".drk-md-btn");
const root = document.documentElement;
const o = document.querySelector(".title-o")
const bulbImage = darkButton.querySelector("img");
const themeStorageKey = "ilmwordle-theme";

function applyTheme(theme){
    if (theme === "dark"){
        root.classList.add("dark-theme");
        if (o){
            o.textContent = "ö";
        }
        bulbImage.src = "./assets/bulb-off.png";
    } else {
        root.classList.remove("dark-theme");
        if (o){
            o.textContent = "O";
        }
        bulbImage.src="./assets/bulb-on.png";
    }
}

function saveTheme(theme){
    localStorage.setItem(themeStorageKey, theme);
}

const savedTheme = localStorage.getItem(themeStorageKey);

if (savedTheme) {
    applyTheme(savedTheme);
}

darkButton.addEventListener("pointerdown", () => {
    darkButton.classList.add("pull");

    const isDarkMode = root.classList.contains("dark-theme");
    const nextTheme = isDarkMode ? "light" : "dark";

    applyTheme(nextTheme);
    saveTheme(nextTheme);

    setTimeout(() => {
        darkButton.classList.remove("pull");
    }, 250);
})