// ব্যাকগ্রাউন্ড অ্যানিমেশন তৈরি করা
const background = document.querySelector('.background-animation');

function createCircle() {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    const size = Math.random() * 15 + 5 + 'px';
    circle.style.width = size;
    circle.style.height = size;
    circle.style.left = Math.random() * window.innerWidth + 'px';
    circle.style.top = window.innerHeight + 'px';
    background.appendChild(circle);

    setTimeout(() => {
        circle.remove();
    }, 8000);
}

