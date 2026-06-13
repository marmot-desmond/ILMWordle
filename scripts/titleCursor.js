function setupTitleCursorEffect() {
    const letters = document.querySelectorAll(".title-container span");

    letters.forEach((letter) => {
        letter.addEventListener("mousemove", (event) => {
            const rect = letter.getBoundingClientRect();

            const letterX = rect.left + rect.width / 2;
            const letterY = rect.top + rect.height / 2;

            const moveX = (event.clientX - letterX) * 0.75;
            const moveY = (event.clientY - letterY) * 0.75;

            letter.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });

        letter.addEventListener("mouseleave", () => {
            letter.style.transform = "translate(0, 0)";
        });
    });
}

setupTitleCursorEffect();