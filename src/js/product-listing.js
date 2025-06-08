import { loadHeaderFooter, getParam } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";
import ProductList from "./ProductList.mjs";
import loadAlerts from "./alerts.js";

document.addEventListener("DOMContentLoaded", () => {
  loadAlerts();
  loadHeaderFooter();

  const category = getParam("category");
  const dataSource = new ExternalServices();
  const element = document.querySelector(".product-list");
  const listing = new ProductList(category, dataSource, element);

  listing.init();

  // Search functionality
  const searchButton = document.getElementById("search-button");
  const searchInput = document.getElementById("search-input");

  if (searchButton && searchInput) {
    const handleSearch = () => {
      const query = searchInput.value.toLowerCase();
      listing.filterProducts(query);
      searchInput.value = "";
    };

    searchButton.addEventListener("click", handleSearch);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleSearch();
    });
  }
});
