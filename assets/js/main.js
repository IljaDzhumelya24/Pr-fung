const searchInput = document.querySelector("#searchInput");
const cards = document.querySelectorAll(".exam-card");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase().trim();

    cards.forEach(card => {
      card.classList.toggle("hide", !card.textContent.toLowerCase().includes(value));
    });
  });
}
