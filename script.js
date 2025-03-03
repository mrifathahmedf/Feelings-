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

setInterval(createCircle, 500);
const text = "আল্লাহ আমাদেরকে “অতি আশাবাদী কিংবা হতাশাগ্রস্থ জাতি হিসেবে পরিচয় করিয়ে দেন নাই”! মহান আল্লাহ পাক আমাদের সম্পর্কে পরিচয় করিয়ে দিয়েছেন “মধ্যমপন্থী অর্থাৎ ভারসাম্যপূর্ণ জাতি\" হিসেবে ☺️ (সূরা আল-বাকারা ২:১৪৩) \n\nআর পুরো কুরআন মাজিদ তো ভারসাম্যপূর্ণ ❤️ \n\nতাই, জীবনে চলতে ফিরতে ভারসাম্যপূর্ণ হয়ে চলাই উত্তম 🪷";

let index = 0;
const typingText = document.getElementById("typing-text");

function typeText() {
    if (index < text.length) {
        typingText.innerHTML += text.charAt(index);
        index++;
        setTimeout(typeText, 50);
    }
}

window.onload = typeText;