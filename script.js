function toggleReview() {
    let reviewBox = document.getElementById("reviewBox");
    let reviewBtn = document.getElementById("reviewBtn");

    if (reviewBox.classList.contains("hidden")) {
        reviewBox.classList.remove("hidden");
    } else {
        reviewBtn.style.display = "none"; 
    }
}

function submitReview(rating) {
    document.getElementById("thankYouMessage").classList.remove("hidden");
}