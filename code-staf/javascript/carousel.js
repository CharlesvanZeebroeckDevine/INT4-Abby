/* document.addEventListener('DOMContentLoaded', function () {
    const eyeRow = document.querySelector('.eye-row');
    if (!eyeRow) return;

    const squares = eyeRow.querySelectorAll('.square');
    const total = squares.length;

    const width = 1192;
    const arcHeight = 120;
    const startX = 0;
    const endX = width;
    const centerY = 250;

    squares.forEach((square, i) => {
        // Evenly distribute X positions
        const x = startX + (i / (total - 1)) * (endX - startX) - square.offsetWidth / 2;

        // Calculate Y for an elliptical arc
        // Formula: y = centerY - arcHeight * Math.sin(Math.PI * (i / (total - 1)))
        // This creates a half-ellipse arc
        const t = i / (total - 1); // 0 to 1
        const y = centerY - arcHeight * Math.sin(Math.PI * t) - square.offsetHeight / 2;

        square.style.position = 'absolute';
        square.style.left = `${x}px`;
        square.style.top = `${y}px`;
    });
}); */
